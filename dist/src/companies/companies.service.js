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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const pipeline_config_service_1 = require("../admin/pipeline/pipeline-config.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
let CompaniesService = class CompaniesService {
    constructor(prisma, pipelineConfig, audit) {
        this.prisma = prisma;
        this.pipelineConfig = pipelineConfig;
        this.audit = audit;
    }
    async findAll(user, pagination, filters) {
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 20;
        const skip = (page - 1) * limit;
        let where = {};
        if (user.role === client_1.UserRole.REP) {
            where.ownerId = user.userId;
        }
        else if (user.role === client_1.UserRole.MANAGER) {
            if (user.team) {
                where.owner = { team: user.team };
            }
            else {
                where = { id: { in: [] } };
            }
        }
        else if (user.role === client_1.UserRole.BOARDS) {
            where = { id: { in: [] } };
        }
        if (filters?.withoutOwner && user.role !== client_1.UserRole.REP) {
            where.ownerId = null;
        }
        if (filters?.stage) {
            where.stage = filters.stage;
        }
        if (filters?.priority) {
            where.priority = filters.priority;
        }
        if (filters?.ownerId) {
            if (user.role === client_1.UserRole.ADMIN || user.role === client_1.UserRole.MANAGER) {
                where.ownerId = filters.ownerId;
            }
        }
        if (filters?.search?.trim()) {
            const search = filters.search.trim();
            where.OR = [
                { legalName: { contains: search } },
                { brandName: { contains: search } },
                { industry: { contains: search } },
                { headOfficeCity: { contains: search } },
            ];
        }
        if (filters?.archivedOnly) {
            where.archivedAt = { not: null };
        }
        else if (!filters?.includeArchived) {
            where.archivedAt = null;
        }
        const [data, total] = await Promise.all([
            this.prisma.company.findMany({
                where,
                include: {
                    owner: {
                        select: {
                            id: true,
                            fullName: true,
                            team: true,
                        },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.company.count({ where }),
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
    async findOne(id, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما دسترسی به شرکت‌ها را ندارید');
        }
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, fullName: true, team: true } },
                people: true,
                branches: true,
                socialChannels: true,
                callCard: true,
                activities: { orderBy: { occurredAt: 'desc' }, take: 20 },
                stageHistory: { orderBy: { changedAt: 'desc' } },
            },
        });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        this.assertAccess(company, user);
        return company;
    }
    async create(dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما اجازه ایجاد شرکت را ندارید');
        }
        const company = await this.prisma.company.create({
            data: {
                ...dto,
                ownerId: dto.ownerId ?? user.userId,
            },
        });
        await this.audit.record({ actorId: user.userId, entityType: 'company', entityId: company.id, action: 'company.created', after: company });
        return company;
    }
    async update(id, dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما اجازه ویرایش شرکت را ندارید');
        }
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        this.assertAccess(company, user);
        const updated = await this.prisma.company.update({
            where: { id },
            data: dto,
        });
        await this.audit.record({ actorId: user.userId, entityType: 'company', entityId: id, action: 'company.updated', before: company, after: updated });
        return updated;
    }
    async changeStage(id, dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما اجازه تغییر مرحله شرکت را ندارید');
        }
        const company = await this.prisma.company.findUnique({ where: { id } });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        this.assertAccess(company, user);
        await this.pipelineConfig.assertTransitionAllowed(company.stage, dto.stage, user.role);
        const [updated] = await this.prisma.$transaction([
            this.prisma.company.update({
                where: { id },
                data: { stage: dto.stage },
            }),
            this.prisma.pipelineStageHistory.create({
                data: {
                    companyId: id,
                    fromStage: company.stage,
                    toStage: dto.stage,
                    changedById: user.userId,
                },
            }),
        ]);
        await this.audit.record({ actorId: user.userId, entityType: 'company', entityId: id, action: 'company.stage_changed', before: { stage: company.stage }, after: { stage: updated.stage } });
        return updated;
    }
    async changeOwner(id, dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما اجازه تغییر مالکیت شرکت را ندارید');
        }
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: { owner: true },
        });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        await this.assertChangeOwnerAccess(company, user);
        const newOwner = await this.prisma.user.findUnique({
            where: { id: dto.newOwnerId },
        });
        if (!newOwner)
            throw new common_1.NotFoundException('کاربر جدید پیدا نشد');
        if (newOwner.role !== client_1.UserRole.REP && newOwner.role !== client_1.UserRole.MANAGER) {
            throw new common_1.BadRequestException('کاربر جدید باید نقش REP یا MANAGER داشته باشد');
        }
        if (newOwner.role === client_1.UserRole.MANAGER) {
            const companyTeam = company.owner?.team;
            if (companyTeam && newOwner.team !== companyTeam) {
                throw new common_1.BadRequestException('مدیر فروش باید در همان تیم شرکت باشد');
            }
        }
        const updated = await this.prisma.company.update({
            where: { id },
            data: { ownerId: dto.newOwnerId },
        });
        await this.audit.record({ actorId: user.userId, entityType: 'company', entityId: id, action: 'company.owner_changed', before: { ownerId: company.ownerId }, after: { ownerId: updated.ownerId } });
        return updated;
    }
    async archive(id, dto, user) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: { owner: { select: { team: true } } },
        });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        this.assertArchiveAccess(company, user);
        if (company.archivedAt)
            throw new common_1.BadRequestException('شرکت قبلاً بایگانی شده است');
        const archived = await this.prisma.company.update({
            where: { id },
            data: { archivedAt: new Date(), archivedById: user.userId, archiveReason: dto.reason },
        });
        await this.audit.record({ actorId: user.userId, entityType: 'company', entityId: id, action: 'company.archived', before: company, after: archived });
        return archived;
    }
    async restore(id, user) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: { owner: { select: { team: true } } },
        });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        this.assertArchiveAccess(company, user);
        if (!company.archivedAt)
            throw new common_1.BadRequestException('شرکت بایگانی نشده است');
        const restored = await this.prisma.company.update({
            where: { id },
            data: { archivedAt: null, archivedById: null, archiveReason: null },
        });
        await this.audit.record({ actorId: user.userId, entityType: 'company', entityId: id, action: 'company.restored', before: company, after: restored });
        return restored;
    }
    async bulkChangeOwner(dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما اجازه تغییر مالکیت گروهی شرکت‌ها را ندارید');
        }
        const newOwner = await this.prisma.user.findUnique({
            where: { id: dto.newOwnerId },
        });
        if (!newOwner)
            throw new common_1.NotFoundException('کاربر جدید پیدا نشد');
        if (newOwner.role !== client_1.UserRole.REP && newOwner.role !== client_1.UserRole.MANAGER) {
            throw new common_1.BadRequestException('کاربر جدید باید نقش REP یا MANAGER داشته باشد');
        }
        const companies = await this.prisma.company.findMany({
            where: { id: { in: dto.companyIds } },
            include: { owner: true },
        });
        if (companies.length === 0) {
            throw new common_1.BadRequestException('هیچ شرکتی با این شناسه‌ها پیدا نشد');
        }
        for (const company of companies) {
            await this.assertChangeOwnerAccess(company, user);
        }
        if (newOwner.role === client_1.UserRole.MANAGER) {
            for (const company of companies) {
                const companyTeam = company.owner?.team;
                if (companyTeam && newOwner.team !== companyTeam) {
                    throw new common_1.BadRequestException(`شرکت ${company.legalName} در تیم ${companyTeam} است اما مدیر جدید در تیم ${newOwner.team} است`);
                }
            }
        }
        const result = await this.prisma.company.updateMany({
            where: { id: { in: dto.companyIds } },
            data: { ownerId: dto.newOwnerId },
        });
        await Promise.all(companies.map((company) => this.audit.record({
            actorId: user.userId,
            entityType: 'company',
            entityId: company.id,
            action: 'company.owner_changed',
            before: { ownerId: company.ownerId },
            after: { ownerId: dto.newOwnerId },
            metadata: { bulk: true },
        })));
        return {
            message: `${result.count} شرکت با موفقیت به کاربر ${newOwner.fullName} اختصاص یافت`,
            updatedCount: result.count,
        };
    }
    assertAccess(company, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما دسترسی به شرکت‌ها را ندارید');
        }
        if (user.role === client_1.UserRole.REP && company.ownerId !== user.userId) {
            throw new common_1.ForbiddenException('شما به این شرکت دسترسی ندارید');
        }
    }
    assertArchiveAccess(company, user) {
        if (user.role === client_1.UserRole.ADMIN)
            return;
        if (user.role === client_1.UserRole.MANAGER && user.team && company.owner?.team === user.team)
            return;
        throw new common_1.ForbiddenException('شما اجازه بایگانی یا بازیابی این شرکت را ندارید');
    }
    async assertChangeOwnerAccess(company, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما اجازه تغییر مالکیت شرکت را ندارید');
        }
        if (user.role === client_1.UserRole.ADMIN)
            return;
        if (user.role === client_1.UserRole.MANAGER) {
            if (!company.ownerId) {
                throw new common_1.ForbiddenException('فقط ادمین می‌تواند مالکیت شرکت‌های بدون مالک را تغییر دهد');
            }
            const companyTeam = company.owner?.team;
            if (!companyTeam || companyTeam !== user.team) {
                throw new common_1.ForbiddenException('شما فقط می‌توانید شرکت‌های تیم خود را تغییر دهید');
            }
            return;
        }
        throw new common_1.ForbiddenException('شما اجازه تغییر مالکیت شرکت‌ها را ندارید');
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, pipeline_config_service_1.PipelineConfigService, audit_log_service_1.AuditLogService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map