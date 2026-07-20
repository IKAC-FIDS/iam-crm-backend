import { Injectable } from '@nestjs/common';
import { ActivityType, Prisma, Priority, UserRole } from '@prisma/client';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { parseApiDate, parseApiDateRange } from '../common/dates/api-date.util';
import { userTeamFilterWhere, userTeamScopeWhere } from '../common/tenant/team-scope.util';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import { OwnershipScope } from '../common/dto/ownership-scope.dto';

interface StageConversion {
  fromStageId: string | null;
  fromStage: string | null;
  fromLabel: string;
  toStageId: string;
  toStage: string;
  toLabel: string;
  fromCount: number;
  toCount: number;
  conversionRate: number;
}

interface DurationResult {
  stage: string;
  stageId?: string;
  label?: string;
  sortOrder?: number;
  sample_count: number;
  avg_duration_days: number;
  min_duration_days: number;
  max_duration_days: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private transitionKey(fromStageId: string | null, toStageId: string) {
    return `${fromStageId ?? 'ENTRY'}:${toStageId}`;
  }

  private percent(part: number, total: number) {
    return total ? Math.round((part / total) * 100) : 0;
  }

  private companyWhere(filters: ReportFiltersDto, user: CurrentUserPayload): Prisma.CompanyWhereInput {
    const and: Prisma.CompanyWhereInput[] = [
      { organizationId: getCurrentOrganizationId(user) },
    ];
    if (filters.ownerIds?.length) and.push({ ownerId: { in: filters.ownerIds } });
    if (filters.teams?.length) and.push({ owner: userTeamFilterWhere(filters.teams) });
    if (filters.priorities?.length) and.push({ priority: { in: filters.priorities } });
    if (filters.industries?.length) and.push({ industry: { in: filters.industries } });
    if (filters.sources?.length) and.push({ source: { in: filters.sources } });
    if (filters.companyIds?.length) and.push({ id: { in: filters.companyIds } });

    and.push(this.companyOwnershipScopeWhere(filters.ownershipScope, user));

    return and.length ? { AND: and } : {};
  }

  private opportunityWhere(filters: ReportFiltersDto, user: CurrentUserPayload, applyCreatedAt = false): Prisma.OpportunityWhereInput {
    const and: Prisma.OpportunityWhereInput[] = [
      { organizationId: getCurrentOrganizationId(user) },
      { archivedAt: null },
      { company: { archivedAt: null } },
    ];
    if (filters.ownerIds?.length) and.push({ ownerId: { in: filters.ownerIds } });
    if (filters.teams?.length) and.push({ owner: userTeamFilterWhere(filters.teams) });
    if (filters.stages?.length) and.push({ OR: [
      { stageId: { in: filters.stages } },
      { stage: { code: { in: filters.stages.map((item) => item.toUpperCase()) } } },
    ] });
    if (filters.priorities?.length) and.push({ priority: { in: filters.priorities } });
    if (filters.industries?.length) and.push({ company: { industry: { in: filters.industries } } });
    if (filters.sources?.length) and.push({ source: { in: filters.sources } });
    if (filters.companyIds?.length) and.push({ companyId: { in: filters.companyIds } });
    if (applyCreatedAt) {
      const { range } = this.dateRange(filters);
      if (range) and.push({ createdAt: range });
    }
    and.push(this.opportunityOwnershipScopeWhere(filters.ownershipScope, user));
    return { AND: and };
  }

  private dateRange(filters: ReportFiltersDto, defaultToLast30Days = false) {
    const defaultStartDate = defaultToLast30Days ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : undefined;
    const defaultEndDate = defaultToLast30Days ? new Date() : undefined;
    const range = parseApiDateRange(filters.startDate, filters.endDate, 'startDate', 'endDate');
    const explicitEndDate = filters.endDate ? parseApiDate(filters.endDate, 'endDate') : undefined;

    return {
      startDate: range?.gte ?? defaultStartDate,
      endDate: explicitEndDate ?? defaultEndDate,
      range: range ?? (defaultToLast30Days ? { gte: defaultStartDate, lte: defaultEndDate } : undefined),
    };
  }

  private activityWhere(
    filters: ReportFiltersDto,
    user: CurrentUserPayload,
    defaultToLast30Days = false,
  ): Prisma.ActivityWhereInput {
    const { range } = this.dateRange(filters, defaultToLast30Days);
    const companyFilters = { ...filters, teams: undefined };
    const and: Prisma.ActivityWhereInput[] = [{ company: this.companyWhere(companyFilters, user) }];
    if (range) and.push({ occurredAt: range });
    if (filters.userIds?.length) and.push({ userId: { in: filters.userIds } });
    if (filters.activityTypes?.length) and.push({ type: { in: filters.activityTypes } });
    if (filters.teams?.length) and.push({ user: userTeamFilterWhere(filters.teams) });

    return { AND: and };
  }

  private companyOwnershipScopeWhere(
    scope: OwnershipScope | undefined,
    user: CurrentUserPayload,
  ): Prisma.CompanyWhereInput {
    switch (scope ?? OwnershipScope.ALL) {
      case OwnershipScope.MINE:
        return { ownerId: user.userId };
      case OwnershipScope.TEAM:
        return { owner: userTeamScopeWhere(user) };
      case OwnershipScope.UNASSIGNED:
        return { ownerId: null };
      default:
        return {};
    }
  }

  private opportunityOwnershipScopeWhere(
    scope: OwnershipScope | undefined,
    user: CurrentUserPayload,
  ): Prisma.OpportunityWhereInput {
    switch (scope ?? OwnershipScope.ALL) {
      case OwnershipScope.MINE:
        return { OR: [{ ownerId: user.userId }, { company: { ownerId: user.userId } }] };
      case OwnershipScope.TEAM:
        return { owner: userTeamScopeWhere(user) };
      case OwnershipScope.UNASSIGNED:
        return { ownerId: null };
      default:
        return {};
    }
  }

  async getConversionRates(filters: ReportFiltersDto, user: CurrentUserPayload) {
    const where = this.opportunityWhere(filters, user);
    const { range, startDate, endDate } = this.dateRange(filters);
    const historyWhere: Prisma.OpportunityStageHistoryWhereInput = {
      opportunity: where,
      ...(range && { changedAt: range }),
    };

    const [transitions, qualifyingOpportunityRows, movementCounts, reachedRows, wonRows] = await Promise.all([
      this.prisma.pipelineStageTransition.findMany({
        where: {
          isAllowed: true,
          toStage: { isActive: true },
          OR: [{ fromStageId: null }, { fromStage: { isActive: true } }],
        },
        include: {
          fromStage: true,
          toStage: true,
        },
      }),

      this.prisma.opportunityStageHistory.findMany({
        where: historyWhere,
        select: { opportunityId: true },
        distinct: ['opportunityId'],
      }),

      this.prisma.opportunityStageHistory.groupBy({
        by: ['fromStageId', 'toStageId'],
        where: historyWhere,
        _count: { opportunityId: true },
      }),

      this.prisma.opportunityStageHistory.findMany({
        where: historyWhere,
        select: {
          opportunityId: true,
          toStageId: true,
        },
        distinct: ['opportunityId', 'toStageId'],
      }),

      this.prisma.opportunityStageHistory.findMany({
        where: { AND: [historyWhere, { toStage: { terminalType: 'WON' } }] },
        select: { opportunityId: true },
        distinct: ['opportunityId'],
      }),
    ]);
    const totalOpportunities = qualifyingOpportunityRows.length;

    const uniqueTransitions = new Map<string, (typeof transitions)[number]>();

    for (const transition of transitions) {
      const key = this.transitionKey(transition.fromStageId, transition.toStageId);

      if (!uniqueTransitions.has(key)) {
        uniqueTransitions.set(key, transition);
      }
    }

    const movementMap = new Map(
      movementCounts.map((item) => [
        this.transitionKey(item.fromStageId, item.toStageId),
        item._count.opportunityId,
      ]),
    );

    const reachedMap = new Map<string, number>();

    for (const item of reachedRows) {
      reachedMap.set(item.toStageId, (reachedMap.get(item.toStageId) ?? 0) + 1);
    }

    const rows = [...uniqueTransitions.values()]
      .sort((a, b) => {
        const fromSortA = a.fromStage?.sortOrder ?? -1;
        const fromSortB = b.fromStage?.sortOrder ?? -1;

        if (fromSortA !== fromSortB) return fromSortA - fromSortB;

        return a.toStage.sortOrder - b.toStage.sortOrder;
      })
      .map((transition): StageConversion => {
        const toCount = movementMap.get(this.transitionKey(transition.fromStageId, transition.toStageId)) ?? 0;

        const fromCount = transition.fromStageId
          ? reachedMap.get(transition.fromStageId) ?? 0
          : totalOpportunities;

        return {
          fromStageId: transition.fromStageId,
          fromStage: transition.fromStage?.code ?? null,
          fromLabel: transition.fromStage?.label ?? 'ورودی اولیه',
          toStageId: transition.toStageId,
          toStage: transition.toStage.code,
          toLabel: transition.toStage.label,
          fromCount,
          toCount,
          conversionRate: this.percent(toCount, fromCount),
        };
      });

    const wonCount = wonRows.length;

    return {
      stages: rows,
      summary: {
        totalCompanies: totalOpportunities,
        completedCompanies: wonCount,
        overallConversionRate: this.percent(wonCount, totalOpportunities),

        totalOpportunities,
        wonOpportunities: wonCount,
        overallOpportunityConversionRate: this.percent(wonCount, totalOpportunities),
      },
      period: this.period(startDate, endDate, 'STAGE_TRANSITION_CHANGED_AT'),
    };
  }

  async getAverageStageDuration(filters: ReportFiltersDto, user: CurrentUserPayload): Promise<DurationResult[]> {
    const opportunityFilters = { ...filters, stages: undefined };

    const [histories, stages] = await Promise.all([
      this.prisma.opportunityStageHistory.findMany({
        where: {
          opportunity: this.opportunityWhere(opportunityFilters, user),
        },
        select: {
          opportunityId: true,
          fromStageId: true,
          fromStage: {
            select: {
              id: true,
              code: true,
              label: true,
              sortOrder: true,
            },
          },
          changedAt: true,
        },
        orderBy: [{ opportunityId: 'asc' }, { changedAt: 'asc' }],
      }),

      this.prisma.pipelineStage.findMany({
        select: {
          id: true,
          code: true,
          label: true,
          sortOrder: true,
        },
      }),
    ]);

    const stageByCode = new Map(stages.map((stage) => [stage.code, stage]));
    const durations = new Map<string, number[]>();
    const previous = new Map<string, Date>();
    const { range } = this.dateRange(filters);

    for (const item of histories) {
      const previousDate = previous.get(item.opportunityId);

      const stageFilterMatches =
        !filters.stages?.length ||
        filters.stages.includes(item.fromStageId ?? '') ||
        (item.fromStage && filters.stages.map((value) => value.toUpperCase()).includes(item.fromStage.code));

      const exitInPeriod = !range || this.dateMatchesRange(item.changedAt, range);
      if (previousDate && item.fromStage && stageFilterMatches && exitInPeriod) {
        const days = (item.changedAt.getTime() - previousDate.getTime()) / 86_400_000;

        durations.set(item.fromStage.code, [
          ...(durations.get(item.fromStage.code) || []),
          days,
        ]);
      }

      previous.set(item.opportunityId, item.changedAt);
    }

    return [...durations.entries()]
      .map(([stage, values]) => {
        const config = stageByCode.get(stage);

        return {
          stage,
          stageId: config?.id,
          label: config?.label,
          sortOrder: config?.sortOrder,
          sample_count: values.length,
          avg_duration_days: this.round(values.reduce((sum, value) => sum + value, 0) / values.length),
          min_duration_days: this.round(Math.min(...values)),
          max_duration_days: this.round(Math.max(...values)),
        };
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  async getPipelineSummary(filters: ReportFiltersDto, user: CurrentUserPayload) {
    const where = this.opportunityWhere(filters, user, true);
    const { startDate, endDate } = this.dateRange(filters);

    const [stageCounts, stages] = await Promise.all([
      this.prisma.opportunity.groupBy({
        by: ['stageId'],
        where,
        _count: { id: true },
        orderBy: { stageId: 'asc' },
      }),

      this.prisma.pipelineStage.findMany({
        orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      }),
    ]);

    const totalOpportunities = stageCounts.reduce((sum, item) => sum + item._count.id, 0);
    const countMap = new Map(stageCounts.map((item) => [item.stageId, item._count.id]));

    const wonCount = stages
      .filter((stage) => stage.terminalType === 'WON')
      .reduce((sum, stage) => sum + (countMap.get(stage.id) ?? 0), 0);

    const lostCount = stages
      .filter((stage) => stage.terminalType === 'LOST')
      .reduce((sum, stage) => sum + (countMap.get(stage.id) ?? 0), 0);

    const activeCount = stages
      .filter((stage) => !stage.isTerminal && stage.terminalType === null)
      .reduce((sum, stage) => sum + (countMap.get(stage.id) ?? 0), 0);

    return {
      stages: stages.map((stage) => {
        const count = countMap.get(stage.id) ?? 0;

        return {
          stage: stage.code,
          stageId: stage.id,
          label: stage.label,
          sortOrder: stage.sortOrder,
          count,
          percentage: this.percent(count, totalOpportunities),
        };
      }),

      summary: {
        totalCompanies: totalOpportunities,
        activeCompanies: activeCount,
        lostCompanies: lostCount,
        lostRate: this.percent(lostCount, totalOpportunities),

        totalOpportunities,
        activeOpportunities: activeCount,
        wonOpportunities: wonCount,
        lostOpportunities: lostCount,
        wonRate: this.percent(wonCount, totalOpportunities),
        lostOpportunityRate: this.percent(lostCount, totalOpportunities),
      },
      period: this.period(startDate, endDate, 'OPPORTUNITY_CREATED_AT'),
    };
  }

  async getActivityReport(filters: ReportFiltersDto, user: CurrentUserPayload) {
    const { startDate, endDate } = this.dateRange(filters);
    const activities = await this.prisma.activity.groupBy({
      by: ['type'], where: this.activityWhere(filters, user), _count: { id: true }, orderBy: { type: 'asc' },
    });
    const totalActivities = activities.reduce((sum, item) => sum + item._count.id, 0);
    return {
      startDate,
      endDate,
      totalActivities,
      breakdown: activities.map((item) => ({
        type: item.type,
        count: item._count.id,
        percentage: totalActivities ? Math.round((item._count.id / totalActivities) * 100) : 0,
      })),
      period: this.period(startDate, endDate, 'ACTIVITY_OCCURRED_AT'),
    };
  }

  async getActivitiesByUser(filters: ReportFiltersDto, user: CurrentUserPayload) {
    const userWhere: Prisma.UserWhereInput = this.reportUserWhere(filters, user);
    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: { id: true, fullName: true, team: true },
      orderBy: { fullName: 'asc' },
    });
    const allowedIds = users.map((item) => item.id);
    const counts = allowedIds.length ? await this.prisma.activity.groupBy({
      by: ['userId', 'type'],
      where: { AND: [this.activityWhere(filters, user), { userId: { in: allowedIds } }] },
      _count: { id: true },
    }) : [];
    const count = (userId: string, type?: ActivityType) => counts
      .filter((item) => item.userId === userId && (!type || item.type === type))
      .reduce((sum, item) => sum + item._count.id, 0);
    return users.map((item) => ({
      userId: item.id,
      fullName: item.fullName,
      team: item.team,
      totalActivities: count(item.id),
      calls: count(item.id, ActivityType.CALL),
      emails: count(item.id, ActivityType.EMAIL),
      meetings: count(item.id, ActivityType.MEETING),
      notes: count(item.id, ActivityType.NOTE),
      linkedinMessages: count(item.id, ActivityType.LINKEDIN_MESSAGE),
      linkedinEngagements: count(item.id, ActivityType.LINKEDIN_ENGAGEMENT),
    }));
  }

  async getPipelineByOwner(filters: ReportFiltersDto, user: CurrentUserPayload) {
    const [opportunities, stages] = await Promise.all([
      this.prisma.opportunity.findMany({
        where: {
          AND: [this.opportunityWhere(filters, user, true), { ownerId: { not: null } }],
        },
        select: {
          ownerId: true,
          stageId: true,
          stage: true,
          owner: {
            select: {
              fullName: true,
              team: true,
            },
          },
        },
      }),

      this.prisma.pipelineStage.findMany({
        orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      }),
    ]);

    const owners = new Map<string, typeof opportunities>();

    for (const opportunity of opportunities) {
      if (!opportunity.ownerId) continue;

      owners.set(opportunity.ownerId, [
        ...(owners.get(opportunity.ownerId) || []),
        opportunity,
      ]);
    }

    return [...owners.entries()]
      .map(([ownerId, items]) => {
        const wonOpportunities = items.filter((item) => item.stage.terminalType === 'WON').length;
        const lostOpportunities = items.filter((item) => item.stage.terminalType === 'LOST').length;
        const totalOpportunities = items.length;
        const activeOpportunities = items.filter(
          (item) => !item.stage.isTerminal && item.stage.terminalType === null,
        ).length;

        return {
          ownerId,
          fullName: items[0].owner?.fullName || '',
          team: items[0].owner?.team ?? null,

          totalCompanies: totalOpportunities,
          activeCompanies: activeOpportunities,
          doneCompanies: wonOpportunities,
          lostCompanies: lostOpportunities,

          totalOpportunities,
          activeOpportunities,
          wonOpportunities,
          lostOpportunities,

          conversionRate: this.percent(wonOpportunities, totalOpportunities),
          lostRate: this.percent(lostOpportunities, totalOpportunities),

          stages: stages.map((stage) => ({
            stage: stage.code,
            stageId: stage.id,
            label: stage.label,
            sortOrder: stage.sortOrder,
            count: items.filter((item) => item.stageId === stage.id).length,
          })),
        };
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async getFilterOptions(user: CurrentUserPayload) {
    const userWhere = this.reportUserWhere({}, user);

    const [users, teams, industries, leadSources, stages] = await Promise.all([
      this.prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          fullName: true,
          role: true,
          team: true,
          teamId: true,
          teamRef: {
            select: {
              code: true,
              name: true,
            },
          },
          isActive: true,
        },
        orderBy: { fullName: 'asc' },
      }),

      this.prisma.team.findMany({
        where: {
          isActive: true,
          organizationId: getCurrentOrganizationId(user),
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      }),

      this.prisma.industry.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      }),

      this.prisma.leadSource.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          name: true,
          sortOrder: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),

      this.prisma.pipelineStage.findMany({
        where: { isActive: true },
        select: {
          id: true,
          code: true,
          label: true,
          sortOrder: true,
          color: true,
          isTerminal: true,
          terminalType: true,
          isDefault: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      }),
    ]);

    const activeUsers = users.filter((item) => item.isActive);

    const owners = activeUsers.filter(
      (item) => item.role === UserRole.REP || item.role === UserRole.MANAGER,
    );

    const managedTeamValues = new Set(teams.flatMap((team) => [team.id, team.code, team.name]));
    const legacyTeams = [
      ...new Set(
        activeUsers
          .map((item) => item.team)
          .filter((value): value is string => value !== null && value !== '' && !managedTeamValues.has(value)),
      ),
    ].sort();

    const priorityOptions = [
      { value: Priority.LOW, label: 'کم' },
      { value: Priority.MEDIUM, label: 'متوسط' },
      { value: Priority.HIGH, label: 'زیاد' },
      { value: Priority.STRATEGIC, label: 'استراتژیک' },
    ];

    const activityTypeOptions = [
      { value: ActivityType.CALL, label: 'تماس' },
      { value: ActivityType.EMAIL, label: 'ایمیل' },
      { value: ActivityType.LINKEDIN_MESSAGE, label: 'پیام لینکدین' },
      { value: ActivityType.LINKEDIN_ENGAGEMENT, label: 'تعامل لینکدین' },
      { value: ActivityType.MEETING, label: 'جلسه' },
      { value: ActivityType.NOTE, label: 'یادداشت' },
      { value: ActivityType.STAGE_CHANGE, label: 'تغییر مرحله' },
    ];

    return {
      users: activeUsers.map((item) => ({
        value: item.id,
        id: item.id,
        label: item.fullName,
        fullName: item.fullName,
        team: item.team,
        teamId: item.teamId,
        teamCode: item.teamRef?.code ?? item.team,
        teamName: item.teamRef?.name ?? null,
        role: item.role,
      })),

      owners: owners.map((item) => ({
        value: item.id,
        id: item.id,
        label: item.fullName,
        fullName: item.fullName,
        team: item.team,
        teamId: item.teamId,
        teamCode: item.teamRef?.code ?? item.team,
        teamName: item.teamRef?.name ?? null,
        role: item.role,
      })),

      teams: [
        ...teams.map((team) => ({
          value: team.id,
          id: team.id,
          code: team.code,
          label: team.name,
          name: team.name,
        })),
        ...legacyTeams.map((team) => ({
          value: team,
          label: team,
          legacy: true,
        })),
      ],

      industries: industries.map((item) => ({
        value: item.name,
        id: item.id,
        label: item.name,
        name: item.name,
      })),

      sources: leadSources.map((item) => ({
        value: item.code,
        id: item.id,
        code: item.code,
        label: item.name,
        name: item.name,
        sortOrder: item.sortOrder,
      })),

      leadSources: leadSources.map((item) => ({
        value: item.code,
        id: item.id,
        code: item.code,
        label: item.name,
        name: item.name,
        sortOrder: item.sortOrder,
      })),

      stages: stages.map((item) => ({
        value: item.id,
        id: item.id,
        code: item.code,
        label: item.label,
        sortOrder: item.sortOrder,
        color: item.color,
        isTerminal: item.isTerminal,
        terminalType: item.terminalType,
        isDefault: item.isDefault,
      })),

      pipelineStages: stages.map((item) => ({
        value: item.id,
        id: item.id,
        code: item.code,
        label: item.label,
        sortOrder: item.sortOrder,
        color: item.color,
        isTerminal: item.isTerminal,
        terminalType: item.terminalType,
        isDefault: item.isDefault,
      })),

      priorities: priorityOptions,
      priorityOptions,
      activityTypes: activityTypeOptions,
      activityTypeOptions,
    };
  }

  private reportUserWhere(filters: ReportFiltersDto, user: CurrentUserPayload): Prisma.UserWhereInput {
    const and: Prisma.UserWhereInput[] = [
      { organizationId: getCurrentOrganizationId(user) },
    ];
    if (filters.userIds?.length) and.push({ id: { in: filters.userIds } });
    if (filters.teams?.length) and.push(userTeamFilterWhere(filters.teams));
    return and.length ? { AND: and } : {};
  }

  private dateMatchesRange(date: Date, range: { gte?: Date; lte?: Date; lt?: Date }) {
    return (!range.gte || date >= range.gte) && (!range.lte || date <= range.lte) && (!range.lt || date < range.lt);
  }

  private period(
    startDate: Date | undefined,
    endDate: Date | undefined,
    dateBasis: 'OPPORTUNITY_CREATED_AT' | 'STAGE_TRANSITION_CHANGED_AT' | 'ACTIVITY_OCCURRED_AT',
  ) {
    return {
      startDate: startDate?.toISOString() ?? null,
      endDate: endDate?.toISOString() ?? null,
      dateBasis,
    };
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }
}
