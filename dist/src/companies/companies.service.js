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
const audit_log_service_1 = require("../audit-log/audit-log.service");
const ownership_scope_dto_1 = require("../common/dto/ownership-scope.dto");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const api_date_util_1 = require("../common/dates/api-date.util");
const team_scope_util_1 = require("../common/tenant/team-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const company_access_service_1 = require("./company-access.service");
const company_phone_util_1 = require("./company-phone.util");
const companyOptionSelect = {
    id: true,
    legalName: true,
    brandName: true,
    nationalId: true,
    registrationNumber: true,
    economicCode: true,
    parentCompanyId: true,
};
let CompaniesService = class CompaniesService {
    constructor(prisma, audit, companyAccess) {
        this.prisma = prisma;
        this.audit = audit;
        this.companyAccess = companyAccess;
    }
    async findOptions(user, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 25;
        const search = query.search?.trim();
        const where = {
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            ...(!query.includeArchived && { archivedAt: null }),
            ...(query.excludeId && { id: { not: query.excludeId } }),
        };
        if (query.selectedId) {
            where.id = query.excludeId
                ? { equals: query.selectedId, not: query.excludeId }
                : query.selectedId;
        }
        else if (search) {
            where.OR = [
                { legalName: { contains: search, mode: 'insensitive' } },
                { brandName: { contains: search, mode: 'insensitive' } },
                { nationalId: { contains: search, mode: 'insensitive' } },
                { registrationNumber: { contains: search, mode: 'insensitive' } },
                { economicCode: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.company.findMany({
                where,
                select: companyOptionSelect,
                orderBy: [
                    { brandName: 'asc' },
                    { legalName: 'asc' },
                    { createdAt: 'desc' },
                    { id: 'asc' },
                ],
                skip: (page - 1) * limit,
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
    async findOption(id, user) {
        const company = await this.prisma.company.findFirst({
            where: {
                id,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
            select: companyOptionSelect,
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        return company;
    }
    async findAll(user, pagination, filters) {
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
        };
        const ownershipScope = filters?.ownershipScope ?? ownership_scope_dto_1.OwnershipScope.ALL;
        if (ownershipScope === ownership_scope_dto_1.OwnershipScope.MINE) {
            where.ownerId = user.userId;
        }
        else if (ownershipScope === ownership_scope_dto_1.OwnershipScope.TEAM) {
            where.owner = (0, team_scope_util_1.userTeamScopeWhere)(user);
        }
        else if (ownershipScope === ownership_scope_dto_1.OwnershipScope.UNASSIGNED) {
            where.ownerId = null;
        }
        if (filters?.withoutOwner) {
            where.ownerId = null;
        }
        if (filters?.stage) {
            where.stage = filters.stage;
        }
        if (filters?.priority) {
            where.priority = filters.priority;
        }
        if (filters?.industryId) {
            where.industryId = filters.industryId;
        }
        else if (filters?.industry?.trim()) {
            where.industry = {
                equals: filters.industry.trim(),
                mode: 'insensitive',
            };
        }
        if (filters?.sourceId) {
            where.sourceId = filters.sourceId;
        }
        else if (filters?.source?.trim()) {
            where.source = {
                equals: filters.source.trim(),
                mode: 'insensitive',
            };
        }
        if (filters?.ownerId) {
            where.ownerId = filters.ownerId;
        }
        if (filters?.search?.trim()) {
            const search = filters.search.trim();
            const normalizedPhoneSearch = (0, company_phone_util_1.normalizeCompanyPhone)(search);
            where.OR = [
                { legalName: { contains: search, mode: 'insensitive' } },
                { brandName: { contains: search, mode: 'insensitive' } },
                { industry: { contains: search, mode: 'insensitive' } },
                { headOfficeCity: { contains: search, mode: 'insensitive' } },
                { industryRef: { name: { contains: search, mode: 'insensitive' } } },
                { sourceRef: { name: { contains: search, mode: 'insensitive' } } },
                { sourceRef: { code: { contains: search, mode: 'insensitive' } } },
            ];
            if ((0, company_phone_util_1.isPhoneLikeSearch)(normalizedPhoneSearch)) {
                where.OR.push({
                    centralPhone: { contains: normalizedPhoneSearch },
                });
            }
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
                    industryRef: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                    sourceRef: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            description: true,
                            isActive: true,
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
        const company = await this.prisma.company.findFirst({
            where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            include: {
                owner: { select: { id: true, fullName: true, team: true } },
                industryRef: true,
                sourceRef: true,
                people: true,
                branches: true,
                socialChannels: true,
                callCard: true,
                activities: { orderBy: { occurredAt: 'desc' }, take: 20 },
                stageHistory: { orderBy: { changedAt: 'desc' } },
                opportunities: {
                    include: {
                        stage: true,
                        owner: { select: { id: true, fullName: true, email: true, team: true } },
                    },
                    orderBy: { updatedAt: 'desc' },
                },
                parentRelations: { include: { parentCompany: true } },
                subsidiaryRelations: { include: { subsidiaryCompany: true } },
                legalDocuments: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        return this.withHierarchy(company);
    }
    async create(dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما اجازه ایجاد شرکت را ندارید');
        }
        const { industryId, industry, sourceId, source, parentCompanyIds, subsidiaryCompanyIds, establishmentDate, registeredCapital, centralPhone, ...companyData } = dto;
        const normalizedRefs = await this.resolveCompanyReferences({
            industryId,
            industry,
            sourceId,
            source,
            applyDefaultSource: true,
        });
        if (dto.ownerId) {
            await this.assertOwnerInOrganization(dto.ownerId, user);
        }
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        await this.validateRelatedCompanies([...new Set([...(parentCompanyIds ?? []), ...(subsidiaryCompanyIds ?? [])])], organizationId);
        const company = await this.prisma.$transaction(async (tx) => {
            const created = await tx.company.create({ data: {
                    ...companyData,
                    centralPhone: (0, company_phone_util_1.normalizeCompanyPhone)(centralPhone),
                    establishmentDate: establishmentDate ? (0, api_date_util_1.parseApiDate)(establishmentDate, 'establishmentDate') : undefined,
                    registeredCapital: registeredCapital !== undefined ? new client_1.Prisma.Decimal(registeredCapital) : undefined,
                    industryId: normalizedRefs.industryId, industry: normalizedRefs.industryName,
                    sourceId: normalizedRefs.sourceId, source: normalizedRefs.sourceCode,
                    ownerId: dto.ownerId ?? null, organizationId,
                } });
            await this.replaceHierarchy(tx, created.id, parentCompanyIds ?? [], subsidiaryCompanyIds ?? []);
            return tx.company.findUniqueOrThrow({ where: { id: created.id }, include: this.companySummaryInclude() });
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'company',
            entityId: company.id,
            action: 'company.created',
            after: company,
        });
        return this.withHierarchy(company);
    }
    async update(id, dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما اجازه ویرایش شرکت را ندارید');
        }
        const company = await this.prisma.company.findFirst({
            where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
        });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        await this.companyAccess.assertCompanyMutable(id, user);
        const { industryId, industry, sourceId, source, parentCompanyIds, subsidiaryCompanyIds, establishmentDate, registeredCapital, centralPhone, ...companyData } = dto;
        const updateData = {
            ...companyData,
        };
        if (establishmentDate !== undefined)
            updateData.establishmentDate = establishmentDate ? (0, api_date_util_1.parseApiDate)(establishmentDate, 'establishmentDate') : null;
        if (registeredCapital !== undefined)
            updateData.registeredCapital = new client_1.Prisma.Decimal(registeredCapital);
        if (centralPhone !== undefined) {
            updateData.centralPhone = (0, company_phone_util_1.normalizeCompanyPhone)(centralPhone);
        }
        if (industryId !== undefined || industry !== undefined) {
            const normalizedIndustry = await this.resolveIndustryReference(industryId, industry);
            updateData.industryId = normalizedIndustry.industryId;
            updateData.industry = normalizedIndustry.industryName;
        }
        if (sourceId !== undefined || source !== undefined) {
            const normalizedSource = await this.resolveSourceReference(sourceId, source, false);
            updateData.sourceId = normalizedSource.sourceId;
            updateData.source = normalizedSource.sourceCode;
        }
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const relationIds = [...new Set([...(parentCompanyIds ?? []), ...(subsidiaryCompanyIds ?? [])])];
        if (relationIds.includes(id))
            throw new common_1.BadRequestException('A company cannot be related to itself');
        await this.validateRelatedCompanies(relationIds, organizationId);
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.company.update({ where: { id }, data: updateData });
            if (parentCompanyIds !== undefined || subsidiaryCompanyIds !== undefined) {
                const currentParents = parentCompanyIds ?? (await tx.companyHierarchyRelation.findMany({ where: { subsidiaryCompanyId: id }, select: { parentCompanyId: true } })).map((item) => item.parentCompanyId);
                const currentSubsidiaries = subsidiaryCompanyIds ?? (await tx.companyHierarchyRelation.findMany({ where: { parentCompanyId: id }, select: { subsidiaryCompanyId: true } })).map((item) => item.subsidiaryCompanyId);
                await this.replaceHierarchy(tx, id, currentParents, currentSubsidiaries);
            }
            return tx.company.findUniqueOrThrow({ where: { id }, include: this.companySummaryInclude() });
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'company',
            entityId: id,
            action: 'company.updated',
            before: company,
            after: updated,
        });
        return this.withHierarchy(updated);
    }
    async changeOwner(id, dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما اجازه تغییر مالکیت شرکت را ندارید');
        }
        const company = await this.prisma.company.findFirst({
            where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            include: { owner: true },
        });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        await this.companyAccess.assertCompanyMutable(id, user);
        const newOwner = await this.prisma.user.findFirst({
            where: { id: dto.newOwnerId, ...tenant_scope_util_1.tenantScope.activeMembership(user) },
        });
        if (!newOwner)
            throw new common_1.NotFoundException('کاربر جدید پیدا نشد');
        if (newOwner.role !== client_1.UserRole.REP && newOwner.role !== client_1.UserRole.MANAGER) {
            throw new common_1.BadRequestException('کاربر جدید باید نقش REP یا MANAGER داشته باشد');
        }
        if (newOwner.role === client_1.UserRole.MANAGER) {
            if (company.owner && !(0, team_scope_util_1.userMatchesTeam)(newOwner, {
                ...user,
                teamId: company.owner.teamId,
                team: company.owner.team,
            })) {
                throw new common_1.BadRequestException('مدیر فروش باید در همان تیم شرکت باشد');
            }
        }
        const updated = await this.prisma.company.update({
            where: { id },
            data: { ownerId: dto.newOwnerId },
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'company',
            entityId: id,
            action: 'company.owner_changed',
            before: { ownerId: company.ownerId },
            after: { ownerId: updated.ownerId },
        });
        return updated;
    }
    async archive(id, dto, user) {
        const company = await this.prisma.company.findFirst({
            where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            include: { owner: { select: { team: true, teamId: true } } },
        });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        await this.companyAccess.assertCompanyMutable(id, user);
        if (company.archivedAt) {
            throw new common_1.BadRequestException('شرکت قبلاً بایگانی شده است');
        }
        const archived = await this.prisma.company.update({
            where: { id },
            data: {
                archivedAt: new Date(),
                archivedById: user.userId,
                archiveReason: dto.reason,
            },
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'company',
            entityId: id,
            action: 'company.archived',
            before: company,
            after: archived,
        });
        return archived;
    }
    async restore(id, user) {
        const company = await this.prisma.company.findFirst({
            where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            include: { owner: { select: { team: true, teamId: true } } },
        });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        await this.companyAccess.assertCompanyMutable(id, user, { allowArchived: true });
        if (!company.archivedAt) {
            throw new common_1.BadRequestException('شرکت بایگانی نشده است');
        }
        const restored = await this.prisma.company.update({
            where: { id },
            data: {
                archivedAt: null,
                archivedById: null,
                archiveReason: null,
            },
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'company',
            entityId: id,
            action: 'company.restored',
            before: company,
            after: restored,
        });
        return restored;
    }
    async bulkChangeOwner(dto, user) {
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما اجازه تغییر مالکیت گروهی شرکت‌ها را ندارید');
        }
        const newOwner = await this.prisma.user.findFirst({
            where: { id: dto.newOwnerId, ...tenant_scope_util_1.tenantScope.activeMembership(user) },
        });
        if (!newOwner)
            throw new common_1.NotFoundException('کاربر جدید پیدا نشد');
        if (newOwner.role !== client_1.UserRole.REP && newOwner.role !== client_1.UserRole.MANAGER) {
            throw new common_1.BadRequestException('کاربر جدید باید نقش REP یا MANAGER داشته باشد');
        }
        const companies = await this.prisma.company.findMany({
            where: {
                id: { in: dto.companyIds },
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
            include: { owner: true },
        });
        if (companies.length === 0) {
            throw new common_1.BadRequestException('هیچ شرکتی با این شناسه‌ها پیدا نشد');
        }
        for (const company of companies) {
            await this.companyAccess.assertCompanyMutable(company.id, user);
        }
        if (newOwner.role === client_1.UserRole.MANAGER) {
            for (const company of companies) {
                if (company.owner && !(0, team_scope_util_1.userMatchesTeam)(newOwner, {
                    ...user,
                    teamId: company.owner.teamId,
                    team: company.owner.team,
                })) {
                    throw new common_1.BadRequestException(`شرکت ${company.legalName} در تیم دیگری است و مدیر جدید عضو همان تیم نیست`);
                }
            }
        }
        const result = await this.prisma.company.updateMany({
            where: {
                id: { in: dto.companyIds },
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
            data: { ownerId: dto.newOwnerId },
        });
        await Promise.all(companies.map((company) => this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
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
    async assertOwnerInOrganization(ownerId, user) {
        const owner = await this.prisma.user.findFirst({
            where: {
                id: ownerId,
                ...tenant_scope_util_1.tenantScope.activeMembership(user),
                isActive: true,
            },
        });
        if (!owner) {
            throw new common_1.BadRequestException('Owner must belong to the current organization');
        }
    }
    async resolveCompanyReferences(input) {
        const normalizedIndustry = await this.resolveIndustryReference(input.industryId, input.industry);
        const normalizedSource = await this.resolveSourceReference(input.sourceId, input.source, input.applyDefaultSource);
        return {
            ...normalizedIndustry,
            ...normalizedSource,
        };
    }
    async resolveIndustryReference(industryId, industryName) {
        if (industryId) {
            const industry = await this.prisma.industry.findUnique({
                where: { id: industryId },
            });
            if (!industry) {
                throw new common_1.BadRequestException('صنعت انتخاب‌شده معتبر نیست');
            }
            return {
                industryId: industry.id,
                industryName: industry.name,
            };
        }
        const normalizedName = industryName?.trim();
        if (!normalizedName) {
            return {
                industryId: null,
                industryName: null,
            };
        }
        const industry = await this.prisma.industry.findFirst({
            where: {
                name: {
                    equals: normalizedName,
                    mode: 'insensitive',
                },
            },
        });
        if (!industry) {
            throw new common_1.BadRequestException('صنعت باید از کتابخانه صنایع انتخاب شود. مقدار متنی آزاد مجاز نیست');
        }
        return {
            industryId: industry.id,
            industryName: industry.name,
        };
    }
    async resolveSourceReference(sourceId, source, applyDefaultSource = false) {
        if (sourceId) {
            const leadSource = await this.prisma.leadSource.findUnique({
                where: { id: sourceId },
            });
            if (!leadSource || !leadSource.isActive) {
                throw new common_1.BadRequestException('منبع جذب انتخاب‌شده معتبر یا فعال نیست');
            }
            return {
                sourceId: leadSource.id,
                sourceCode: leadSource.code,
            };
        }
        const normalizedSource = source?.trim();
        if (normalizedSource) {
            const leadSource = await this.prisma.leadSource.findFirst({
                where: {
                    isActive: true,
                    OR: [
                        {
                            code: {
                                equals: normalizedSource,
                                mode: 'insensitive',
                            },
                        },
                        {
                            name: {
                                equals: normalizedSource,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            });
            if (!leadSource) {
                throw new common_1.BadRequestException('منبع جذب باید از کتابخانه Lead Sources انتخاب شود. مقدار متنی آزاد مجاز نیست');
            }
            return {
                sourceId: leadSource.id,
                sourceCode: leadSource.code,
            };
        }
        if (applyDefaultSource) {
            const defaultLeadSource = await this.prisma.leadSource.findUnique({
                where: { code: 'SAM_LIST' },
            });
            if (defaultLeadSource?.isActive) {
                return {
                    sourceId: defaultLeadSource.id,
                    sourceCode: defaultLeadSource.code,
                };
            }
        }
        return {
            sourceId: null,
            sourceCode: null,
        };
    }
    companySummaryInclude() {
        return {
            owner: { select: { id: true, fullName: true, team: true } },
            industryRef: true,
            sourceRef: true,
            parentRelations: { include: { parentCompany: true } },
            subsidiaryRelations: { include: { subsidiaryCompany: true } },
        };
    }
    withHierarchy(company) {
        return {
            ...company,
            parentCompanies: company.parentRelations?.map((item) => item.parentCompany) ?? [],
            subsidiaryCompanies: company.subsidiaryRelations?.map((item) => item.subsidiaryCompany) ?? [],
        };
    }
    async validateRelatedCompanies(ids, organizationId) {
        if (!ids.length)
            return;
        const companies = await this.prisma.company.findMany({
            where: { id: { in: ids }, organizationId },
            select: { id: true, archivedAt: true },
        });
        if (companies.length !== ids.length) {
            throw new common_1.BadRequestException('All related companies must exist in the current organization');
        }
        if (companies.some((company) => company.archivedAt)) {
            throw new common_1.BadRequestException('Archived companies cannot be used in company hierarchy');
        }
    }
    async replaceHierarchy(tx, companyId, parentCompanyIds, subsidiaryCompanyIds) {
        const parents = [...new Set(parentCompanyIds)];
        const subsidiaries = [...new Set(subsidiaryCompanyIds)];
        if (parents.includes(companyId) || subsidiaries.includes(companyId)) {
            throw new common_1.BadRequestException('A company cannot be related to itself');
        }
        const overlap = parents.find((id) => subsidiaries.includes(id));
        if (overlap)
            throw new common_1.BadRequestException('A company cannot be both parent and subsidiary directly');
        await this.assertHierarchyAcyclic(tx, companyId, parents, subsidiaries);
        const reverse = await tx.companyHierarchyRelation.findFirst({
            where: {
                OR: [
                    { parentCompanyId: companyId, subsidiaryCompanyId: { in: parents } },
                    { parentCompanyId: { in: subsidiaries }, subsidiaryCompanyId: companyId },
                ],
            },
        });
        if (reverse)
            throw new common_1.BadRequestException('Reverse company hierarchy relation already exists');
        await tx.companyHierarchyRelation.deleteMany({
            where: { OR: [{ parentCompanyId: companyId }, { subsidiaryCompanyId: companyId }] },
        });
        await tx.companyHierarchyRelation.createMany({
            data: [
                ...parents.map((parentCompanyId) => ({ parentCompanyId, subsidiaryCompanyId: companyId })),
                ...subsidiaries.map((subsidiaryCompanyId) => ({ parentCompanyId: companyId, subsidiaryCompanyId })),
            ],
            skipDuplicates: true,
        });
    }
    async assertHierarchyAcyclic(tx, companyId, parents, subsidiaries) {
        const relations = await tx.companyHierarchyRelation.findMany({
            where: {
                parentCompany: { organizationId: (await tx.company.findUniqueOrThrow({
                        where: { id: companyId },
                        select: { organizationId: true },
                    })).organizationId },
            },
            select: { parentCompanyId: true, subsidiaryCompanyId: true },
        });
        const graph = new Map();
        const addEdge = (parent, child) => {
            const children = graph.get(parent) ?? new Set();
            children.add(child);
            graph.set(parent, children);
        };
        for (const relation of relations) {
            if (relation.parentCompanyId !== companyId && relation.subsidiaryCompanyId !== companyId) {
                addEdge(relation.parentCompanyId, relation.subsidiaryCompanyId);
            }
        }
        const reaches = (start, target) => {
            const pending = [start];
            const visited = new Set();
            while (pending.length) {
                const current = pending.pop();
                if (current === target)
                    return true;
                if (visited.has(current))
                    continue;
                visited.add(current);
                pending.push(...(graph.get(current) ?? []));
            }
            return false;
        };
        for (const [parent, child] of [
            ...parents.map((parent) => [parent, companyId]),
            ...subsidiaries.map((subsidiary) => [companyId, subsidiary]),
        ]) {
            if (reaches(child, parent)) {
                throw new common_1.BadRequestException('Company hierarchy cannot contain a cycle');
            }
            addEdge(parent, child);
        }
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService,
        company_access_service_1.CompanyAccessService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map