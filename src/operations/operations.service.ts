import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ConversationEntityType,
  MeetingStatus,
  PersonalTodoStatus,
  Prisma,
  TaskStatus,
} from "@prisma/client";
import type { CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { OwnershipScope } from "../common/dto/ownership-scope.dto";
import { organizationDayBounds } from "../common/dates/timezone-boundary.util";
import { activeOpportunityStateWhere } from "../common/opportunities/active-opportunity-scope";
import { userTeamScopeWhere } from "../common/tenant/team-scope.util";
import { tenantScope } from "../common/tenant/tenant-scope.util";
import { PrismaService } from "../prisma/prisma.service";
import {
  OperationsAttentionState,
  OperationsCompaniesQueryDto,
} from "./dto/operations-companies-query.dto";
import { OperationsWorkspaceQueryDto } from "./dto/operations-workspace-query.dto";
import { classifyOperationsAttention } from "./operations-attention";

const OPEN_TASK_STATUSES = [TaskStatus.TODO, TaskStatus.IN_PROGRESS];

type UnreadCompanyRow = { companyId: string; unreadCount: number };
type UnreadThreadRow = { threadId: string; unreadCount: number };
type UnreadTotalRow = { unreadCount: number };

@Injectable()
export class OperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyActiveOpportunities(
    companyId: string,
    user: CurrentUserPayload,
  ) {
    const tenant = tenantScope.require(user);
    return this.prisma.withTenantTransaction(tenant, async (tx) => {
      const company = await tx.company.findFirst({
        where: {
          id: companyId,
          organizationId: tenant.organizationId,
          archivedAt: null,
        },
        select: { id: true },
      });
      if (!company) return { data: [], total: 0 };
      const data = await tx.opportunity.findMany({
        where: {
          AND: [
            activeOpportunityStateWhere(),
            { organizationId: tenant.organizationId, companyId },
          ],
        },
        select: {
          id: true,
          title: true,
          priority: true,
          expectedCloseDate: true,
          stage: { select: { id: true, label: true, terminalType: true } },
        },
        orderBy: [{ expectedCloseDate: "asc" }, { updatedAt: "desc" }],
      });
      return { data, total: data.length };
    });
  }

  async getWorkspace(
    query: OperationsWorkspaceQueryDto,
    user: CurrentUserPayload,
  ) {
    const tenant = tenantScope.require(user);
    const targetUserId = await this.resolveTargetUserId(
      query.userId,
      user,
      tenant.organizationId,
    );
    const scopeUser = { ...user, userId: targetUserId };
    const now = new Date();
    const recentLimit = query.recentLimit ?? 5;
    const permissions = new Set(user.tenantContext?.permissions ?? []);
    const canViewTasks = permissions.has("task:view");
    const canViewMeetings = permissions.has("meeting:view");
    const canViewOpportunities = permissions.has("opportunity:view");

    return this.prisma.withTenantTransaction(tenant, async (tx) => {
      const organization = await tx.organization.findUnique({
        where: { id: tenant.organizationId },
        select: { timezone: true },
      });
      const { start: todayStart, end: tomorrowStart } = organizationDayBounds(
        now,
        organization?.timezone || "Asia/Tehran",
      );
      const taskWhere: Prisma.TaskWhereInput = {
        organizationId: tenant.organizationId,
        assignedToId: scopeUser.userId,
        status: { in: OPEN_TASK_STATUSES },
      };
      const meetingAccess: Prisma.MeetingWhereInput = {
        OR: [
          { organizerId: scopeUser.userId },
          { assignees: { some: { userId: scopeUser.userId } } },
        ],
      };

      const [
        dueTodayTasks,
        overdueTasks,
        todayTasks,
        meetingsToday,
        activeOpportunities,
        unreadConversationMessages,
        recentParticipants,
        personalTodosToday,
        personalTodosUpcoming,
        personalTodosCompleted,
        personalTodosOverdue,
      ] = await Promise.all([
        canViewTasks
          ? tx.task.count({
              where: {
                ...taskWhere,
                dueAt: { gte: todayStart, lt: tomorrowStart },
              },
            })
          : Promise.resolve(0),
        canViewTasks
          ? tx.task.count({
              where: { ...taskWhere, dueAt: { lt: todayStart } },
            })
          : Promise.resolve(0),
        canViewTasks
          ? tx.task.findMany({
              where: {
                ...taskWhere,
                dueAt: { gte: todayStart, lt: tomorrowStart },
              },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueAt: true,
                opportunityId: true,
                company: {
                  select: { id: true, legalName: true, brandName: true },
                },
              },
              orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
            })
          : Promise.resolve([]),
        canViewMeetings
          ? tx.meeting.findMany({
              where: {
                organizationId: tenant.organizationId,
                status: MeetingStatus.SCHEDULED,
                startAt: { gte: todayStart, lt: tomorrowStart },
                ...meetingAccess,
              },
              select: {
                id: true,
                title: true,
                startAt: true,
                endAt: true,
                mode: true,
                company: {
                  select: { id: true, legalName: true, brandName: true },
                },
              },
              orderBy: { startAt: "asc" },
            })
          : Promise.resolve([]),
        canViewOpportunities
          ? tx.opportunity.count({
              where: {
                AND: [
                  activeOpportunityStateWhere(),
                  {
                    organizationId: tenant.organizationId,
                    ownerId: scopeUser.userId,
                  },
                ],
              },
            })
          : Promise.resolve(0),
        this.getUnreadTotal(tx, tenant.organizationId, scopeUser.userId),
        tx.conversationParticipant.findMany({
          where: {
            userId: scopeUser.userId,
            thread: { organizationId: tenant.organizationId },
          },
          select: {
            threadId: true,
            thread: {
              select: {
                entityType: true,
                entityId: true,
                status: true,
                updatedAt: true,
                createdBy: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarObjectKey: true,
                  },
                },
                participants: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        fullName: true,
                        avatarObjectKey: true,
                      },
                    },
                  },
                },
                messages: {
                  where: { deletedAt: null },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  select: {
                    id: true,
                    body: true,
                    type: true,
                    createdAt: true,
                    author: {
                      select: {
                        id: true,
                        fullName: true,
                        avatarObjectKey: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { thread: { updatedAt: "desc" } },
          take: recentLimit,
        }),
        tx.personalTodo.findMany({
          where: {
            organizationId: tenant.organizationId,
            userId: scopeUser.userId,
            status: PersonalTodoStatus.TODO,
            OR: [{ dueAt: null }, { dueAt: { lt: tomorrowStart } }],
          },
          include: {
            company: { select: { id: true, legalName: true, brandName: true } },
            opportunity: { select: { id: true, title: true } },
            task: { select: { id: true, title: true } },
          },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
          take: recentLimit,
        }),
        tx.personalTodo.findMany({
          where: {
            organizationId: tenant.organizationId,
            userId: scopeUser.userId,
            status: PersonalTodoStatus.TODO,
            dueAt: { gte: tomorrowStart },
          },
          include: {
            company: { select: { id: true, legalName: true, brandName: true } },
            opportunity: { select: { id: true, title: true } },
            task: { select: { id: true, title: true } },
          },
          orderBy: { dueAt: "asc" },
          take: recentLimit,
        }),
        tx.personalTodo.findMany({
          where: {
            organizationId: tenant.organizationId,
            userId: scopeUser.userId,
            status: PersonalTodoStatus.DONE,
          },
          include: {
            company: { select: { id: true, legalName: true, brandName: true } },
            opportunity: { select: { id: true, title: true } },
            task: { select: { id: true, title: true } },
          },
          orderBy: { completedAt: "desc" },
          take: recentLimit,
        }),
        tx.personalTodo.count({
          where: {
            organizationId: tenant.organizationId,
            userId: scopeUser.userId,
            status: PersonalTodoStatus.TODO,
            dueAt: { lt: todayStart },
          },
        }),
      ]);

      const threadUnread = await this.getUnreadThreadCounts(
        tx,
        tenant.organizationId,
        scopeUser.userId,
        recentParticipants.map((participant) => participant.threadId),
      );
      const companyThreadIds = recentParticipants
        .filter(
          (item) =>
            item.thread.entityType === ConversationEntityType.COMPANY,
        )
        .map((item) => item.thread.entityId);
      const taskThreadIds = recentParticipants
        .filter(
          (item) => item.thread.entityType === ConversationEntityType.TASK,
        )
        .map((item) => item.thread.entityId);
      const activityThreadIds = recentParticipants
        .filter(
          (item) =>
            item.thread.entityType === ConversationEntityType.ACTIVITY,
        )
        .map((item) => item.thread.entityId);
      const [conversationCompanies, conversationTasks, conversationActivities] =
        await Promise.all([
          companyThreadIds.length
            ? tx.company.findMany({
                where: {
                  organizationId: tenant.organizationId,
                  id: { in: companyThreadIds },
                },
                select: { id: true, legalName: true, brandName: true },
              })
            : Promise.resolve([]),
          taskThreadIds.length
            ? tx.task.findMany({
                where: {
                  organizationId: tenant.organizationId,
                  id: { in: taskThreadIds },
                },
                select: {
                  id: true,
                  title: true,
                  company: {
                    select: { id: true, legalName: true, brandName: true },
                  },
                  opportunity: { select: { id: true, title: true } },
                },
              })
            : Promise.resolve([]),
          activityThreadIds.length
            ? tx.activity.findMany({
                where: { id: { in: activityThreadIds } },
                select: {
                  id: true,
                  company: {
                    select: { id: true, legalName: true, brandName: true },
                  },
                  opportunity: { select: { id: true, title: true } },
                  task: { select: { id: true, title: true } },
                },
              })
            : Promise.resolve([]),
        ]);
      const companyContext = new Map<
        string,
        (typeof conversationCompanies)[number]
      >();
      conversationCompanies.forEach((item) =>
        companyContext.set(item.id, item),
      );
      const taskContext = new Map<
        string,
        (typeof conversationTasks)[number]
      >();
      conversationTasks.forEach((item) => taskContext.set(item.id, item));
      const activityContext = new Map<
        string,
        (typeof conversationActivities)[number]
      >();
      conversationActivities.forEach((item) =>
        activityContext.set(item.id, item),
      );

      return {
        subject: {
          userId: scopeUser.userId,
          isCurrentUser: scopeUser.userId === user.userId,
        },
        capabilities: {
          tasks: canViewTasks,
          meetings: canViewMeetings,
          opportunities: canViewOpportunities,
          conversations: true,
        },
        attention: {
          dueTodayTasks,
          overdueTasks,
          unreadConversationMessages,
          meetingsToday: meetingsToday.length,
          activeOpportunities,
        },
        today: { tasks: todayTasks, meetings: meetingsToday },
        personalTodos: {
          today: personalTodosToday,
          upcoming: personalTodosUpcoming,
          completed: personalTodosCompleted,
          counts: {
            today: personalTodosToday.length,
            overdue: personalTodosOverdue,
            upcoming: personalTodosUpcoming.length,
          },
        },
        recentConversations: recentParticipants.map((participant) => {
          const directCompany = companyContext.get(participant.thread.entityId);
          const task = taskContext.get(participant.thread.entityId);
          const activity = activityContext.get(participant.thread.entityId);
          const company = directCompany ?? task?.company ?? activity?.company;
          const opportunity = task?.opportunity ?? activity?.opportunity;
          const relatedTask = task
            ? { id: task.id, title: task.title }
            : activity?.task;
          return {
            threadId: participant.threadId,
            entityType: participant.thread.entityType,
            entityId: participant.thread.entityId,
            status: participant.thread.status,
            updatedAt: participant.thread.updatedAt,
            unreadCount: threadUnread.get(participant.threadId) ?? 0,
            createdBy: participant.thread.createdBy,
            relatedUsers: participant.thread.participants
              .map((item) => item.user)
              .filter(
                (item) =>
                  item.id !== participant.thread.createdBy.id &&
                  item.id !== scopeUser.userId,
              ),
            context: {
              company: company
                ? {
                    id: company.id,
                    name: company.brandName || company.legalName,
                  }
                : null,
              opportunity: opportunity ?? null,
              task: relatedTask ?? null,
            },
            latestMessage: participant.thread.messages[0] ?? null,
          };
        }),
      };
    });
  }

  async getCompanies(
    query: OperationsCompaniesQueryDto,
    user: CurrentUserPayload,
  ) {
    const tenant = tenantScope.require(user);
    const targetUserId = await this.resolveTargetUserId(
      query.userId,
      user,
      tenant.organizationId,
    );
    const scopeUser = { ...user, userId: targetUserId };
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const now = new Date();
    const permissions = new Set(user.tenantContext?.permissions ?? []);
    const canViewTasks = permissions.has("task:view");
    const canViewMeetings = permissions.has("meeting:view");
    const canViewOpportunities = permissions.has("opportunity:view");
    const canViewActivities = permissions.has("activity:view");
    const safeQuery: OperationsCompaniesQueryDto = {
      ...query,
      attentionState:
        canViewTasks && canViewMeetings && canViewOpportunities
          ? query.attentionState
          : undefined,
      hasNoNextAction:
        canViewTasks && canViewMeetings && canViewOpportunities
          ? query.hasNoNextAction
          : undefined,
      hasActiveOpportunity: canViewOpportunities
        ? query.hasActiveOpportunity
        : undefined,
    };

    return this.prisma.withTenantTransaction(tenant, async (tx) => {
      const organization = await tx.organization.findUnique({
        where: { id: tenant.organizationId },
        select: { timezone: true },
      });
      const { start: todayStart, end: tomorrowStart } = organizationDayBounds(
        now,
        organization?.timezone || "Asia/Tehran",
      );
      const companyWhere = await this.buildCompanyWhere(
        tx,
        safeQuery,
        scopeUser,
        tenant.organizationId,
        todayStart,
        tomorrowStart,
        now,
      );

      const [total, companies] = await Promise.all([
        tx.company.count({ where: companyWhere }),
        tx.company.findMany({
          where: companyWhere,
          select: {
            id: true,
            legalName: true,
            brandName: true,
            logoObjectKey: true,
            priority: true,
            activityStatus: true,
            owner: {
              select: { id: true, fullName: true, avatarObjectKey: true },
            },
          },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      const companyIds = companies.map((company) => company.id);
      if (!companyIds.length) {
        return this.paginated([], total, page, limit);
      }

      const [
        opportunityCounts,
        tasks,
        meetings,
        activities,
        conversationThreads,
        unreadCounts,
      ] = await Promise.all([
        canViewOpportunities
          ? tx.opportunity.groupBy({
              by: ["companyId"],
              where: {
                AND: [
                  activeOpportunityStateWhere(),
                  {
                    organizationId: tenant.organizationId,
                    companyId: { in: companyIds },
                  },
                ],
              },
              _count: { id: true },
            })
          : Promise.resolve([]),
        canViewTasks
          ? tx.task.findMany({
              where: {
                organizationId: tenant.organizationId,
                companyId: { in: companyIds },
                assignedToId: scopeUser.userId,
                status: { in: OPEN_TASK_STATUSES },
              },
              select: {
                id: true,
                companyId: true,
                title: true,
                dueAt: true,
                priority: true,
                opportunityId: true,
              },
              orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
            })
          : Promise.resolve([]),
        canViewMeetings
          ? tx.meeting.findMany({
              where: {
                organizationId: tenant.organizationId,
                companyId: { in: companyIds },
                status: MeetingStatus.SCHEDULED,
                startAt: { gte: now },
                OR: [
                  { organizerId: scopeUser.userId },
                  { assignees: { some: { userId: scopeUser.userId } } },
                ],
              },
              select: {
                id: true,
                companyId: true,
                title: true,
                startAt: true,
                mode: true,
              },
              orderBy: { startAt: "asc" },
            })
          : Promise.resolve([]),
        canViewActivities
          ? tx.activity.findMany({
              where: {
                companyId: { in: companyIds },
                company: { organizationId: tenant.organizationId },
                type: { not: "STAGE_CHANGE" },
              },
              select: {
                id: true,
                companyId: true,
                type: true,
                occurredAt: true,
              },
              orderBy: { occurredAt: "desc" },
              distinct: ["companyId"],
            })
          : Promise.resolve([]),
        tx.conversationThread.findMany({
          where: {
            organizationId: tenant.organizationId,
            entityType: ConversationEntityType.COMPANY,
            entityId: { in: companyIds },
          },
          select: {
            entityId: true,
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                body: true,
                type: true,
                createdAt: true,
                author: {
                  select: {
                    id: true,
                    fullName: true,
                    avatarObjectKey: true,
                  },
                },
              },
            },
          },
        }),
        this.getUnreadOperationalCompanyCounts(
          tx,
          tenant.organizationId,
          scopeUser.userId,
          companyIds,
          canViewTasks,
          canViewActivities,
          user.role === "ADMIN" ||
            permissions.has("activity:view-organization"),
          user.role === "ADMIN" || permissions.has("task:view-organization"),
        ),
      ]);

      const opportunityCountMap = new Map<string, number>(
        opportunityCounts.map(
          (item) => [item.companyId, item._count.id] as const,
        ),
      );
      const taskMap = this.groupByCompany(tasks);
      const meetingMap = this.groupByCompany(meetings);
      const activityMap = new Map(
        activities
          .filter((activity) => activity.companyId)
          .map((activity) => [activity.companyId as string, activity]),
      );
      const conversationMap = new Map(
        conversationThreads.map((thread) => [thread.entityId, thread]),
      );

      const data = companies.map((company) => {
        const companyTasks = taskMap.get(company.id) ?? [];
        const companyMeetings = meetingMap.get(company.id) ?? [];
        const activeCount = opportunityCountMap.get(company.id) ?? 0;
        const overdue = companyTasks.filter(
          (task) => task.dueAt && task.dueAt < todayStart,
        ).length;
        const dueToday = companyTasks.filter(
          (task) =>
            task.dueAt &&
            task.dueAt >= todayStart &&
            task.dueAt < tomorrowStart,
        ).length;
        const futureTasks = companyTasks.filter(
          (task) => task.dueAt && task.dueAt >= tomorrowStart,
        );
        const nextTask = companyTasks
          .filter((task) => task.dueAt && task.dueAt >= now)
          .sort(
            (left, right) =>
              (left.dueAt as Date).getTime() - (right.dueAt as Date).getTime(),
          )[0];
        const nextMeeting = companyMeetings[0];
        const attention = classifyOperationsAttention({
          overdueTasks: overdue,
          dueTodayTasks: dueToday,
          hasFutureTask: futureTasks.length > 0,
          hasFutureMeeting: companyMeetings.length > 0,
          activeOpportunities: activeCount,
        });
        const nextAction = this.nextAction(nextTask, nextMeeting);
        const thread = conversationMap.get(company.id);

        return {
          company,
          activeOpportunities: {
            count: activeCount,
            preview: [],
            hasMore: activeCount > 0,
          },
          tasks: {
            open: companyTasks.length,
            overdue,
            dueToday,
            next: nextTask ?? null,
          },
          conversation: {
            unreadCount: unreadCounts.get(company.id) ?? 0,
            latestMessage: thread?.messages[0] ?? null,
          },
          lastActivity: activityMap.get(company.id) ?? null,
          nextMeeting: nextMeeting ?? null,
          nextAction,
          attention,
        };
      });

      return this.paginated(data, total, page, limit);
    });
  }

  private async buildCompanyWhere(
    tx: Prisma.TransactionClient,
    query: OperationsCompaniesQueryDto,
    user: CurrentUserPayload,
    organizationId: string,
    todayStart: Date,
    tomorrowStart: Date,
    now: Date,
  ): Promise<Prisma.CompanyWhereInput> {
    const and: Prisma.CompanyWhereInput[] = [
      { organizationId, archivedAt: null },
    ];
    if (query.search?.trim()) {
      const search = query.search.trim();
      and.push({
        OR: [
          { legalName: { contains: search, mode: "insensitive" } },
          { brandName: { contains: search, mode: "insensitive" } },
          { nationalId: { contains: search } },
        ],
      });
    }
    if (query.priority) and.push({ priority: query.priority });

    const ownershipScope = query.ownershipScope ?? OwnershipScope.MINE;
    if (ownershipScope === OwnershipScope.MINE) {
      and.push({ ownerId: user.userId });
    } else if (ownershipScope === OwnershipScope.TEAM) {
      and.push({ owner: userTeamScopeWhere(user) });
    } else if (ownershipScope === OwnershipScope.UNASSIGNED) {
      and.push({ ownerId: null });
    }

    const openTask = {
      organizationId,
      assignedToId: user.userId,
      status: { in: OPEN_TASK_STATUSES },
    } satisfies Prisma.TaskWhereInput;
    const overdue = {
      tasks: { some: { ...openTask, dueAt: { lt: todayStart } } },
    } satisfies Prisma.CompanyWhereInput;
    const today = {
      tasks: {
        some: {
          ...openTask,
          dueAt: { gte: todayStart, lt: tomorrowStart },
        },
      },
    } satisfies Prisma.CompanyWhereInput;
    const futureTask = {
      tasks: { some: { ...openTask, dueAt: { gte: tomorrowStart } } },
    } satisfies Prisma.CompanyWhereInput;
    const futureMeeting = {
      meetings: {
        some: {
          organizationId,
          status: MeetingStatus.SCHEDULED,
          startAt: { gte: now },
          OR: [
            { organizerId: user.userId },
            { assignees: { some: { userId: user.userId } } },
          ],
        },
      },
    } satisfies Prisma.CompanyWhereInput;
    const activeOpportunity = {
      opportunities: {
        some: { AND: [activeOpportunityStateWhere(), { organizationId }] },
      },
    } satisfies Prisma.CompanyWhereInput;
    const noNextAction: Prisma.CompanyWhereInput = {
      AND: [
        { NOT: overdue },
        { NOT: today },
        activeOpportunity,
        { NOT: futureTask },
        { NOT: futureMeeting },
      ],
    };

    if (query.hasActiveOpportunity !== undefined) {
      and.push(
        query.hasActiveOpportunity === "true"
          ? activeOpportunity
          : { NOT: activeOpportunity },
      );
    }
    if (query.hasNoNextAction !== undefined) {
      and.push(
        query.hasNoNextAction === "true" ? noNextAction : { NOT: noNextAction },
      );
    }
    if (query.attentionState) {
      and.push(
        this.attentionWhere(
          query.attentionState,
          overdue,
          today,
          futureTask,
          futureMeeting,
          activeOpportunity,
          noNextAction,
        ),
      );
    }
    if (query.hasUnreadMessages !== undefined) {
      const unreadIds = Array.from(
        (
          await this.getUnreadCompanyCounts(tx, organizationId, user.userId)
        ).keys(),
      );
      if (query.hasUnreadMessages === "true") {
        and.push({ id: { in: unreadIds } });
      } else if (unreadIds.length) {
        and.push({ id: { notIn: unreadIds } });
      }
    }

    return { AND: and };
  }

  private attentionWhere(
    state: OperationsAttentionState,
    overdue: Prisma.CompanyWhereInput,
    today: Prisma.CompanyWhereInput,
    futureTask: Prisma.CompanyWhereInput,
    futureMeeting: Prisma.CompanyWhereInput,
    activeOpportunity: Prisma.CompanyWhereInput,
    noNextAction: Prisma.CompanyWhereInput,
  ): Prisma.CompanyWhereInput {
    if (state === OperationsAttentionState.OVERDUE) return overdue;
    if (state === OperationsAttentionState.TODAY) {
      return { AND: [{ NOT: overdue }, today] };
    }
    if (state === OperationsAttentionState.NO_NEXT_ACTION) return noNextAction;
    if (state === OperationsAttentionState.UPCOMING) {
      return {
        AND: [
          { NOT: overdue },
          { NOT: today },
          { OR: [futureTask, futureMeeting] },
        ],
      };
    }
    return {
      AND: [
        { NOT: overdue },
        { NOT: today },
        { NOT: futureTask },
        { NOT: futureMeeting },
        { NOT: activeOpportunity },
      ],
    };
  }

  private nextAction(
    task: { id: string; title: string; dueAt: Date | null } | undefined,
    meeting:
      | { id: string; title: string; startAt: Date; companyId: string }
      | undefined,
  ) {
    if (!task?.dueAt && !meeting) return null;
    if (!meeting || (task?.dueAt && task.dueAt <= meeting.startAt)) {
      return {
        type: "TASK" as const,
        id: task!.id,
        title: task!.title,
        at: task!.dueAt,
      };
    }
    return {
      type: "MEETING" as const,
      id: meeting.id,
      title: meeting.title,
      at: meeting.startAt,
    };
  }

  private groupByCompany<T extends { companyId: string | null }>(items: T[]) {
    const grouped = new Map<string, T[]>();
    for (const item of items) {
      if (!item.companyId) continue;
      const group = grouped.get(item.companyId) ?? [];
      group.push(item);
      grouped.set(item.companyId, group);
    }
    return grouped;
  }

  private async resolveTargetUserId(
    requestedUserId: string | undefined,
    user: CurrentUserPayload,
    organizationId: string,
  ) {
    const targetUserId = requestedUserId ?? user.userId;
    if (targetUserId === user.userId) return targetUserId;
    if (user.role !== "ADMIN") {
      throw new ForbiddenException(
        "فقط مدیر سیستم می‌تواند عملیات کاربران دیگر را مشاهده کند",
      );
    }
    const target = await this.prisma.user.findFirst({
      where: { id: targetUserId, organizationId, isActive: true },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException("کاربر موردنظر در سازمان فعلی پیدا نشد");
    }
    return target.id;
  }

  private paginated<T>(data: T[], total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  private async getUnreadCompanyCounts(
    tx: Prisma.TransactionClient,
    organizationId: string,
    userId: string,
    companyIds?: string[],
  ) {
    if (companyIds && !companyIds.length) return new Map<string, number>();
    const companyFilter = companyIds
      ? Prisma.sql`AND thread."entityId" IN (${Prisma.join(companyIds)})`
      : Prisma.empty;
    const rows = await tx.$queryRaw<UnreadCompanyRow[]>(Prisma.sql`
      SELECT thread."entityId" AS "companyId", COUNT(message.id)::int AS "unreadCount"
      FROM "conversation_threads" thread
      INNER JOIN "conversation_participants" participant
        ON participant."threadId" = thread.id AND participant."userId" = ${userId}
      INNER JOIN "conversation_messages" message
        ON message."threadId" = thread.id
        AND message."organizationId" = ${organizationId}
        AND message."authorId" <> ${userId}
        AND message."deletedAt" IS NULL
        AND (participant."lastReadAt" IS NULL OR message."createdAt" > participant."lastReadAt")
      WHERE thread."organizationId" = ${organizationId}
        AND thread."entityType" = CAST(${ConversationEntityType.COMPANY} AS "ConversationEntityType")
        ${companyFilter}
      GROUP BY thread."entityId"
    `);
    return new Map(rows.map((row) => [row.companyId, Number(row.unreadCount)]));
  }

  private async getUnreadOperationalCompanyCounts(
    tx: Prisma.TransactionClient,
    organizationId: string,
    userId: string,
    companyIds: string[],
    canViewTasks: boolean,
    canViewActivities: boolean,
    canViewOrganizationActivities: boolean,
    canViewOrganizationTasks: boolean,
  ) {
    if (!companyIds.length) return new Map<string, number>();
    const taskScope = canViewTasks
      ? canViewOrganizationTasks
        ? Prisma.sql`TRUE`
        : Prisma.sql`(task."assignedToId" = ${userId} OR task."createdById" = ${userId} OR task."reviewerId" = ${userId})`
      : Prisma.sql`FALSE`;
    const activityScope = canViewActivities
      ? canViewOrganizationActivities
        ? Prisma.sql`TRUE`
        : Prisma.sql`activity."userId" = ${userId}`
      : Prisma.sql`FALSE`;
    const rows = await tx.$queryRaw<UnreadCompanyRow[]>(Prisma.sql`
      SELECT mapped."companyId", COUNT(message.id)::int AS "unreadCount"
      FROM (
        SELECT thread.id,
          CASE
            WHEN thread."entityType" = CAST(${ConversationEntityType.COMPANY} AS "ConversationEntityType") THEN thread."entityId"
            WHEN thread."entityType" = CAST(${ConversationEntityType.TASK} AS "ConversationEntityType") AND ${taskScope} THEN task."companyId"
            WHEN thread."entityType" = CAST(${ConversationEntityType.ACTIVITY} AS "ConversationEntityType") AND ${activityScope} THEN activity."companyId"
          END AS "companyId"
        FROM "conversation_threads" thread
        LEFT JOIN tasks task ON thread."entityType" = CAST(${ConversationEntityType.TASK} AS "ConversationEntityType") AND task.id = thread."entityId" AND task."organizationId" = ${organizationId}
        LEFT JOIN activities activity ON thread."entityType" = CAST(${ConversationEntityType.ACTIVITY} AS "ConversationEntityType") AND activity.id = thread."entityId"
        WHERE thread."organizationId" = ${organizationId}
      ) mapped
      INNER JOIN "conversation_participants" participant ON participant."threadId" = mapped.id AND participant."userId" = ${userId}
      INNER JOIN "conversation_messages" message ON message."threadId" = mapped.id AND message."organizationId" = ${organizationId}
        AND message."authorId" <> ${userId} AND message."deletedAt" IS NULL
        AND (participant."lastReadAt" IS NULL OR message."createdAt" > participant."lastReadAt")
      WHERE mapped."companyId" IN (${Prisma.join(companyIds)})
      GROUP BY mapped."companyId"
    `);
    return new Map(rows.map((row) => [row.companyId, Number(row.unreadCount)]));
  }

  private async getUnreadThreadCounts(
    tx: Prisma.TransactionClient,
    organizationId: string,
    userId: string,
    threadIds: string[],
  ) {
    if (!threadIds.length) return new Map<string, number>();
    const rows = await tx.$queryRaw<UnreadThreadRow[]>(Prisma.sql`
      SELECT thread.id AS "threadId", COUNT(message.id)::int AS "unreadCount"
      FROM "conversation_threads" thread
      INNER JOIN "conversation_participants" participant
        ON participant."threadId" = thread.id AND participant."userId" = ${userId}
      INNER JOIN "conversation_messages" message
        ON message."threadId" = thread.id
        AND message."organizationId" = ${organizationId}
        AND message."authorId" <> ${userId}
        AND message."deletedAt" IS NULL
        AND (participant."lastReadAt" IS NULL OR message."createdAt" > participant."lastReadAt")
      WHERE thread."organizationId" = ${organizationId}
        AND thread.id IN (${Prisma.join(threadIds)})
      GROUP BY thread.id
    `);
    return new Map(rows.map((row) => [row.threadId, Number(row.unreadCount)]));
  }

  private async getUnreadTotal(
    tx: Prisma.TransactionClient,
    organizationId: string,
    userId: string,
  ) {
    const rows = await tx.$queryRaw<UnreadTotalRow[]>(Prisma.sql`
      SELECT COUNT(message.id)::int AS "unreadCount"
      FROM "conversation_threads" thread
      INNER JOIN "conversation_participants" participant
        ON participant."threadId" = thread.id AND participant."userId" = ${userId}
      INNER JOIN "conversation_messages" message
        ON message."threadId" = thread.id
        AND message."organizationId" = ${organizationId}
        AND message."authorId" <> ${userId}
        AND message."deletedAt" IS NULL
        AND (participant."lastReadAt" IS NULL OR message."createdAt" > participant."lastReadAt")
      WHERE thread."organizationId" = ${organizationId}
    `);
    return Number(rows[0]?.unreadCount ?? 0);
  }
}
