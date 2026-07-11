"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunitiesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pipeline_config_service_1 = require("../admin/pipeline/pipeline-config.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
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
            commercialDocuments: true,
            payments: true,
            tasks: true,
        },
    },
    commercialDocuments: {
        orderBy: [
            { createdAt: 'desc' },
        ],
        include: {
            payments: {
                select: {
                    id: true,
                    status: true,
                    amount: true,
                    currency: true,
                    dueDate: true,
                    paidAt: true,
                    method: true,
                    referenceNumber: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
    },
    payments: {
        orderBy: [
            { createdAt: 'desc' },
        ],
        include: {
            commercialDocument: {
                select: {
                    id: true,
                    type: true,
                    status: true,
                    number: true,
                    title: true,
                },
            },
        },
    },
};
let OpportunitiesService = class OpportunitiesService {
    constructor(prisma, pipelineConfig, audit) {
        this.prisma = prisma;
        this.pipelineConfig = pipelineConfig;
        this.audit = audit;
    }
    async findAll(query, user) {
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
    findByCompany(companyId, query, user) {
        return this.findAll({ ...query, companyId }, user);
    }
    async findOne(id, user) {
        const opportunity = await this.prisma.opportunity.findFirst({
            where: {
                AND: [
                    { id },
                    { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
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
                commercialDocuments: {
                    orderBy: [
                        { createdAt: 'desc' },
                    ],
                    include: {
                        payments: {
                            select: {
                                id: true,
                                status: true,
                                amount: true,
                                currency: true,
                                dueDate: true,
                                paidAt: true,
                                method: true,
                                referenceNumber: true,
                            },
                            orderBy: {
                                createdAt: 'desc',
                            },
                        },
                    },
                },
                payments: {
                    orderBy: [
                        { createdAt: 'desc' },
                    ],
                    include: {
                        commercialDocument: {
                            select: {
                                id: true,
                                type: true,
                                status: true,
                                number: true,
                                title: true,
                            },
                        },
                    },
                },
                tasks: {
                    include: {
                        assignedTo: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                role: true,
                                team: true,
                            },
                        },
                        createdBy: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: [
                        { dueAt: 'asc' },
                        { createdAt: 'desc' },
                    ],
                },
            },
        });
        if (!opportunity) {
            throw new common_1.NotFoundException('Opportunity not found');
        }
        return opportunity;
    }
    async create(dto, user) {
        const company = await this.getCompanyInScope(dto.companyId, user);
        const stage = await this.resolveStage(dto.stageId, dto.stage);
        const ownerId = dto.ownerId ?? company.ownerId;
        if (dto.ownerId) {
            await this.validateOwner(dto.ownerId, user);
        }
        const opportunity = await this.prisma.opportunity.create({
            data: {
                organizationId: company.organizationId,
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
    async update(id, dto, user) {
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
    async changeStage(id, dto, user) {
        const current = await this.getForMutation(id, user);
        if (current.archivedAt) {
            throw new common_1.BadRequestException('Archived opportunities cannot change stage');
        }
        if (!dto.stageId && !dto.stage) {
            throw new common_1.BadRequestException('stageId or stage code is required');
        }
        const target = await this.resolveStage(dto.stageId, dto.stage);
        await this.pipelineConfig.assertTransitionAllowed(current.stageId, target.id, user.role);
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
                    type: client_1.ActivityType.STAGE_CHANGE,
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
    async changeOwner(id, dto, user) {
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
    async archive(id, dto, user) {
        const current = await this.getForMutation(id, user);
        if (current.archivedAt) {
            throw new common_1.BadRequestException('Opportunity is already archived');
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
    async restore(id, user) {
        const current = await this.getForMutation(id, user);
        if (!current.archivedAt) {
            throw new common_1.BadRequestException('Opportunity is not archived');
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
    buildWhere(query, user) {
        const and = [
            {
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
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
        }
        else if (query.includeArchived !== 'true') {
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
    scopeWhere(user) {
        if (user.role === client_1.UserRole.ADMIN || user.role === client_1.UserRole.BOARDS) {
            return {};
        }
        if (user.role === client_1.UserRole.MANAGER) {
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
    async getForMutation(id, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('Opportunity is read-only for this role');
        }
        const item = await this.prisma.opportunity.findFirst({
            where: {
                AND: [
                    { id },
                    { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
                    this.scopeWhere(user),
                ],
            },
            include: opportunityInclude,
        });
        if (!item) {
            throw new common_1.NotFoundException('Opportunity not found');
        }
        return item;
    }
    async getCompanyInScope(companyId, user) {
        const company = await this.prisma.company.findFirst({
            where: {
                id: companyId,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
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
            throw new common_1.NotFoundException('Company not found');
        }
        if (user.role === client_1.UserRole.ADMIN) {
            return company;
        }
        if (user.role === client_1.UserRole.MANAGER &&
            user.team &&
            company.owner?.team === user.team) {
            return company;
        }
        if (user.role === client_1.UserRole.REP && company.ownerId === user.userId) {
            return company;
        }
        throw new common_1.ForbiddenException('You do not have access to this company');
    }
    async validateOwner(ownerId, user) {
        const owner = await this.prisma.user.findUnique({
            where: {
                id: ownerId,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
        });
        if (!owner ||
            !owner.isActive ||
            (owner.role !== client_1.UserRole.REP && owner.role !== client_1.UserRole.MANAGER)) {
            throw new common_1.BadRequestException('Opportunity owner must be an active REP or MANAGER');
        }
        if (user.role === client_1.UserRole.REP && owner.id !== user.userId) {
            throw new common_1.ForbiddenException('REP can only assign opportunities to self');
        }
        if (user.role === client_1.UserRole.MANAGER &&
            (!user.team || owner.team !== user.team)) {
            throw new common_1.ForbiddenException('Owner must belong to the manager team');
        }
    }
    async getDefaultStage() {
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
            throw new common_1.BadRequestException('No active initial pipeline stage is configured');
        }
        return config;
    }
    async resolveStage(stageId, code) {
        if (!stageId && !code) {
            return this.getDefaultStage();
        }
        const stage = await this.prisma.pipelineStage.findFirst({
            where: stageId
                ? {
                    id: stageId,
                }
                : {
                    code: code.trim().toUpperCase(),
                },
        });
        if (!stage?.isActive) {
            throw new common_1.BadRequestException('Selected pipeline stage is not active');
        }
        return stage;
    }
};
exports.OpportunitiesService = OpportunitiesService;
exports.OpportunitiesService = OpportunitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pipeline_config_service_1.PipelineConfigService,
        audit_log_service_1.AuditLogService])
], OpportunitiesService);
//# sourceMappingURL=opportunities.service.js.map