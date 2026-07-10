import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, Prisma, UserRole } from '@prisma/client';
import { PipelineConfigService } from '../admin/pipeline/pipeline-config.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ArchiveOpportunityDto } from './dto/archive-opportunity.dto';
import { ChangeOpportunityOwnerDto } from './dto/change-opportunity-owner.dto';
import { ChangeOpportunityStageDto } from './dto/change-opportunity-stage.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { FindOpportunitiesDto } from './dto/find-opportunities.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

const opportunityInclude = {
  company: {
    select: {
      id: true,
      legalName: true,
      brandName: true,
      industry: true,
    },
  },
  owner: {
    select: {
      id: true,
      fullName: true,
      email: true,
      team: true,
    },
  },
  stage: {
    select: {
      id: true,
      code: true,
      label: true,
      sortOrder: true,
      color: true,
      isTerminal: true,
      terminalType: true,
    },
  },
  _count: {
    select: {
      lineItems: true,
    },
  },
} satisfies Prisma.OpportunityInclude;

@Injectable()
export class OpportunitiesService {
  constructor(
    private prisma: PrismaService,
    private pipelineConfig: PipelineConfigService,
    private audit: AuditLogService,
  ) {}

  async findAll(query: FindOpportunitiesDto, user: CurrentUserPayload) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query, user);

    const [data, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        include: opportunityInclude,
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.opportunity.count({ where }),
    ]);

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

  findByCompany(
    companyId: string,
    query: FindOpportunitiesDto,
    user: CurrentUserPayload,
  ) {
    return this.findAll({ ...query, companyId }, user);
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: {
        AND: [
          { id },
          this.scopeWhere(user),
        ],
      },
      include: {
        ...opportunityInclude,

        stageHistories: {
          include: {
            fromStage: {
              select: {
                id: true,
                code: true,
                label: true,
              },
            },
            toStage: {
              select: {
                id: true,
                code: true,
                label: true,
              },
            },
          },
          orderBy: {
            changedAt: 'desc',
          },
        },

        activities: {
          orderBy: {
            occurredAt: 'desc',
          },
          take: 20,
        },

        lineItems: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true,
                unit: true,
                defaultUnitPrice: true,
                currency: true,
                isActive: true,
              },
            },
          },
          orderBy: [
            { sortOrder: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    return opportunity;
  }

  async create(dto: CreateOpportunityDto, user: CurrentUserPayload) {
    const company = await this.getCompanyInScope(dto.companyId, user);
    const stage = await this.resolveStage(dto.stageId, dto.stage);
    const ownerId = dto.ownerId ?? company.ownerId;

    if (dto.ownerId) {
      await this.validateOwner(dto.ownerId, user);
    }

    const opportunity = await this.prisma.opportunity.create({
      data: {
        companyId: company.id,
        ownerId,
        title: dto.title.trim(),
        description: dto.description,
        stageId: stage.id,
        priority: dto.priority,
        estimatedValue: dto.estimatedValue,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
        source: dto.source,
        wonAt: stage.terminalType === 'WON' ? new Date() : undefined,
        lostAt: stage.terminalType === 'LOST' ? new Date() : undefined,
        stageHistories: {
          create: {
            fromStageId: null,
            toStageId: stage.id,
            changedById: user.userId,
          },
        },
      },
      include: opportunityInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'opportunity',
      entityId: opportunity.id,
      action: 'opportunity.created',
      after: opportunity,
    });

    return opportunity;
  }

  async update(id: string, dto: UpdateOpportunityDto, user: CurrentUserPayload) {
    const current = await this.getForMutation(id, user);

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.title !== undefined && {
          title: dto.title.trim(),
        }),
        ...(dto.expectedCloseDate !== undefined && {
          expectedCloseDate: new Date(dto.expectedCloseDate),
        }),
      },
      include: opportunityInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'opportunity',
      entityId: id,
      action: 'opportunity.updated',
      before: current,
      after: updated,
    });

    return updated;
  }

  async changeStage(
    id: string,
    dto: ChangeOpportunityStageDto,
    user: CurrentUserPayload,
  ) {
    const current = await this.getForMutation(id, user);

    if (current.archivedAt) {
      throw new BadRequestException('Archived opportunities cannot change stage');
    }

    if (!dto.stageId && !dto.stage) {
      throw new BadRequestException('stageId or stage code is required');
    }

    const target = await this.resolveStage(dto.stageId, dto.stage);

    await this.pipelineConfig.assertTransitionAllowed(
      current.stageId,
      target.id,
      user.role as UserRole,
    );

    const now = new Date();

    const [updated] = await this.prisma.$transaction([
      this.prisma.opportunity.update({
        where: { id },
        data: {
          stageId: target.id,
          wonAt: target.terminalType === 'WON' ? now : null,
          lostAt: target.terminalType === 'LOST' ? now : null,
        },
        include: opportunityInclude,
      }),

      this.prisma.opportunityStageHistory.create({
        data: {
          opportunityId: id,
          fromStageId: current.stageId,
          toStageId: target.id,
          changedById: user.userId,
          note: dto.note,
        },
      }),

      this.prisma.activity.create({
        data: {
          companyId: current.companyId,
          opportunityId: id,
          userId: user.userId,
          type: ActivityType.STAGE_CHANGE,
          notes: dto.note,
          outcome: `${current.stage.code} -> ${target.code}`,
        },
      }),
    ]);

    await this.audit.record({
      actorId: user.userId,
      entityType: 'opportunity',
      entityId: id,
      action: 'opportunity.stage_changed',
      before: {
        stageId: current.stageId,
        code: current.stage.code,
      },
      after: {
        stageId: target.id,
        code: target.code,
      },
      metadata: {
        note: dto.note,
      },
    });

    return updated;
  }

  async changeOwner(
    id: string,
    dto: ChangeOpportunityOwnerDto,
    user: CurrentUserPayload,
  ) {
    const current = await this.getForMutation(id, user);

    if (dto.ownerId) {
      await this.validateOwner(dto.ownerId, user);
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        ownerId: dto.ownerId,
      },
      include: opportunityInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'opportunity',
      entityId: id,
      action: 'opportunity.owner_changed',
      before: {
        ownerId: current.ownerId,
      },
      after: {
        ownerId: updated.ownerId,
      },
    });

    return updated;
  }

  async archive(
    id: string,
    dto: ArchiveOpportunityDto,
    user: CurrentUserPayload,
  ) {
    const current = await this.getForMutation(id, user);

    if (current.archivedAt) {
      throw new BadRequestException('Opportunity is already archived');
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedById: user.userId,
        archiveReason: dto.reason,
      },
      include: opportunityInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'opportunity',
      entityId: id,
      action: 'opportunity.archived',
      before: current,
      after: updated,
    });

    return updated;
  }

  async restore(id: string, user: CurrentUserPayload) {
    const current = await this.getForMutation(id, user);

    if (!current.archivedAt) {
      throw new BadRequestException('Opportunity is not archived');
    }

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedById: null,
        archiveReason: null,
      },
      include: opportunityInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'opportunity',
      entityId: id,
      action: 'opportunity.restored',
      before: current,
      after: updated,
    });

    return updated;
  }

  private buildWhere(
    query: FindOpportunitiesDto,
    user: CurrentUserPayload,
  ): Prisma.OpportunityWhereInput {
    const and: Prisma.OpportunityWhereInput[] = [
      this.scopeWhere(user),
      {
        company: {
          archivedAt: null,
        },
      },
    ];

    if (query.companyId) {
      and.push({
        companyId: query.companyId,
      });
    }

    if (query.ownerId) {
      and.push({
        ownerId: query.ownerId,
      });
    }

    if (query.team?.trim()) {
      and.push({
        owner: {
          team: query.team.trim(),
        },
      });
    }

    if (query.stage) {
      and.push({
        stage: {
          code: query.stage.trim().toUpperCase(),
        },
      });
    }

    if (query.stageId) {
      and.push({
        stageId: query.stageId,
      });
    }

    if (query.priority) {
      and.push({
        priority: query.priority,
      });
    }

    if (query.source?.trim()) {
      and.push({
        source: query.source.trim(),
      });
    }

    if (query.archivedOnly === 'true') {
      and.push({
        archivedAt: {
          not: null,
        },
      });
    } else if (query.includeArchived !== 'true') {
      and.push({
        archivedAt: null,
      });
    }

    const search = query.search?.trim();

    if (search) {
      and.push({
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            company: {
              legalName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            company: {
              brandName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            owner: {
              fullName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            owner: {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ],
      });
    }

    return {
      AND: and,
    };
  }

  private scopeWhere(user: CurrentUserPayload): Prisma.OpportunityWhereInput {
    if (user.role === UserRole.ADMIN || user.role === UserRole.BOARDS) {
      return {};
    }

    if (user.role === UserRole.MANAGER) {
      return user.team
        ? {
            company: {
              owner: {
                team: user.team,
              },
            },
          }
        : {
            id: {
              in: [],
            },
          };
    }

    return {
      OR: [
        {
          ownerId: user.userId,
        },
        {
          company: {
            ownerId: user.userId,
          },
        },
      ],
    };
  }

  private async getForMutation(id: string, user: CurrentUserPayload) {
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('Opportunity is read-only for this role');
    }

    const item = await this.prisma.opportunity.findFirst({
      where: {
        AND: [
          { id },
          this.scopeWhere(user),
        ],
      },
      include: opportunityInclude,
    });

    if (!item) {
      throw new NotFoundException('Opportunity not found');
    }

    return item;
  }

  private async getCompanyInScope(
    companyId: string,
    user: CurrentUserPayload,
  ) {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      include: {
        owner: {
          select: {
            team: true,
          },
        },
      },
    });

    if (!company || company.archivedAt) {
      throw new NotFoundException('Company not found');
    }

    if (user.role === UserRole.ADMIN) {
      return company;
    }

    if (
      user.role === UserRole.MANAGER &&
      user.team &&
      company.owner?.team === user.team
    ) {
      return company;
    }

    if (user.role === UserRole.REP && company.ownerId === user.userId) {
      return company;
    }

    throw new ForbiddenException('You do not have access to this company');
  }

  private async validateOwner(ownerId: string, user: CurrentUserPayload) {
    const owner = await this.prisma.user.findUnique({
      where: {
        id: ownerId,
      },
    });

    if (
      !owner ||
      !owner.isActive ||
      (owner.role !== UserRole.REP && owner.role !== UserRole.MANAGER)
    ) {
      throw new BadRequestException(
        'Opportunity owner must be an active REP or MANAGER',
      );
    }

    if (user.role === UserRole.REP && owner.id !== user.userId) {
      throw new ForbiddenException('REP can only assign opportunities to self');
    }

    if (
      user.role === UserRole.MANAGER &&
      (!user.team || owner.team !== user.team)
    ) {
      throw new ForbiddenException('Owner must belong to the manager team');
    }
  }

  private async getDefaultStage() {
    const config = await this.prisma.pipelineStage.findFirst({
      where: {
        isActive: true,
        isDefault: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    if (!config) {
      throw new BadRequestException(
        'No active initial pipeline stage is configured',
      );
    }

    return config;
  }

  private async resolveStage(stageId?: string, code?: string) {
    if (!stageId && !code) {
      return this.getDefaultStage();
    }

    const stage = await this.prisma.pipelineStage.findFirst({
      where: stageId
        ? {
            id: stageId,
          }
        : {
            code: code!.trim().toUpperCase(),
          },
    });

    if (!stage?.isActive) {
      throw new BadRequestException('Selected pipeline stage is not active');
    }

    return stage;
  }
}