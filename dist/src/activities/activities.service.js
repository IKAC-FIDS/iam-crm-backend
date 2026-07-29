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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const api_date_util_1 = require("../common/dates/api-date.util");
const company_access_service_1 = require("../companies/company-access.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const team_scope_util_1 = require("../common/tenant/team-scope.util");
const ownership_scope_dto_1 = require("../common/dto/ownership-scope.dto");
const api_date_util_2 = require("../common/dates/api-date.util");
const find_activities_dto_1 = require("./dto/find-activities.dto");
const activityCenterSelect = {
    id: true,
    type: true,
    notes: true,
    outcome: true,
    occurredAt: true,
    completedAt: true,
    createdAt: true,
    person: { select: { id: true, fullName: true } },
    company: {
        select: {
            id: true,
            legalName: true,
            brandName: true,
            owner: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    team: true,
                    teamId: true,
                },
            },
        },
    },
    user: {
        select: { id: true, fullName: true, email: true },
    },
};
let ActivitiesService = class ActivitiesService {
    constructor(prisma, audit, companyAccess) {
        this.prisma = prisma;
        this.audit = audit;
        this.companyAccess = companyAccess;
    }
    async findAll(query, user) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = this.activityCenterWhere(query, user);
        const orderBy = query.sortBy === 'createdAt'
            ? { createdAt: query.sortOrder ?? 'desc' }
            : { occurredAt: query.sortOrder ?? 'desc' };
        const [rows, total] = await Promise.all([
            this.prisma.activity.findMany({
                where,
                select: activityCenterSelect,
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.activity.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: rows.map((row) => this.activityCenterRow(row)),
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
    async latestActivities(user) {
        const rows = await this.prisma.activity.findMany({
            where: this.activityCenterWhere({}, user),
            select: activityCenterSelect,
            orderBy: { occurredAt: 'desc' },
            take: 10,
        });
        return rows.map((row) => {
            const mapped = this.activityCenterRow(row);
            return {
                id: mapped.id,
                type: mapped.type,
                title: mapped.title,
                activityDate: mapped.activityDate,
                person: mapped.person,
                company: mapped.company,
                createdBy: mapped.createdBy,
            };
        });
    }
    activityCenterWhere(query, user) {
        const and = [
            {
                company: {
                    organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                    archivedAt: null,
                },
            },
        ];
        if (query.activityType)
            and.push({ type: query.activityType });
        if (query.status === find_activities_dto_1.ActivityListStatus.COMPLETED) {
            and.push({ completedAt: { not: null } });
        }
        else if (query.status === find_activities_dto_1.ActivityListStatus.RECORDED) {
            and.push({ completedAt: null });
        }
        if (query.ownerId)
            and.push({ company: { ownerId: query.ownerId } });
        if (query.createdById)
            and.push({ userId: query.createdById });
        if (query.personId)
            and.push({ personId: query.personId });
        if (query.companyId)
            and.push({ companyId: query.companyId });
        const activityDate = (0, api_date_util_2.parseApiDateRange)(query.dateFrom, query.dateTo, 'dateFrom', 'dateTo');
        if (activityDate)
            and.push({ occurredAt: activityDate });
        if (query.team?.trim()) {
            and.push({ company: { owner: (0, team_scope_util_1.userTeamFilterWhere)([query.team]) } });
        }
        if (query.ownershipScope === ownership_scope_dto_1.OwnershipScope.MINE) {
            and.push({ company: { ownerId: user.userId } });
        }
        else if (query.ownershipScope === ownership_scope_dto_1.OwnershipScope.TEAM) {
            and.push({ company: { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) } });
        }
        else if (query.ownershipScope === ownership_scope_dto_1.OwnershipScope.UNASSIGNED) {
            and.push({ company: { ownerId: null } });
        }
        if (query.mine)
            and.push({ userId: user.userId });
        if (query.unassigned)
            and.push({ company: { ownerId: null } });
        const search = query.search?.trim();
        if (search) {
            and.push({
                OR: [
                    { outcome: { contains: search, mode: 'insensitive' } },
                    { notes: { contains: search, mode: 'insensitive' } },
                    { person: { fullName: { contains: search, mode: 'insensitive' } } },
                    { company: { legalName: { contains: search, mode: 'insensitive' } } },
                    { company: { brandName: { contains: search, mode: 'insensitive' } } },
                ],
            });
        }
        return { AND: and };
    }
    activityCenterRow(row) {
        const { owner, ...company } = row.company;
        return {
            ...row,
            title: row.outcome ?? row.type,
            description: row.notes,
            status: row.completedAt
                ? find_activities_dto_1.ActivityListStatus.COMPLETED
                : find_activities_dto_1.ActivityListStatus.RECORDED,
            activityDate: row.occurredAt,
            updatedAt: row.createdAt,
            company,
            owner,
            createdBy: row.user,
        };
    }
    async validateCompanyAccess(companyId, user) {
        await this.companyAccess.assertCompanyMutable(companyId, user);
    }
    async validatePersonAccess(personId, user) {
        const person = await this.prisma.person.findUnique({
            where: { id: personId },
            include: { company: { select: { ownerId: true, owner: { select: { team: true, teamId: true } } } } },
        });
        if (!person) {
            throw new common_1.NotFoundException('مخاطب پیدا نشد');
        }
        await this.validateCompanyAccess(person.companyId, user);
        return person;
    }
    async findActivityForMutation(activityId, user) {
        const activity = await this.prisma.activity.findUnique({
            where: { id: activityId },
            include: {
                company: true,
                person: true,
                user: { select: { id: true, fullName: true } },
                completedBy: { select: { id: true, fullName: true } },
            },
        });
        if (!activity)
            throw new common_1.NotFoundException('Activity not found');
        await this.validateCompanyAccess(activity.companyId, user);
        return activity;
    }
    async findByCompany(companyId, pagination, user) {
        if (!companyId) {
            throw new common_1.BadRequestException('شناسه شرکت الزامی است');
        }
        await this.assertCompanyReadable(companyId, user);
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.activity.findMany({
                where: { companyId },
                include: { person: true, user: { select: { id: true, fullName: true } } },
                orderBy: { occurredAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.activity.count({ where: { companyId } }),
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
    async create(dto, user) {
        await this.validateCompanyAccess(dto.companyId, user);
        if (dto.personId) {
            await this.validatePersonAccess(dto.personId, user);
        }
        if (dto.opportunityId)
            await this.validateOpportunityCompany(dto.opportunityId, dto.companyId);
        const activity = await this.prisma.activity.create({
            data: {
                companyId: dto.companyId,
                personId: dto.personId,
                userId: user.userId,
                type: dto.type,
                notes: dto.notes,
                outcome: dto.outcome,
                occurredAt: dto.occurredAt ? (0, api_date_util_1.parseApiDate)(dto.occurredAt, 'occurredAt') : undefined,
                nextActionDate: dto.nextActionDate ? (0, api_date_util_1.parseApiDate)(dto.nextActionDate, 'nextActionDate') : undefined,
                opportunityId: dto.opportunityId,
            },
        });
        await this.audit.record({ actorId: user.userId, entityType: 'activity', entityId: activity.id, action: 'activity.created', after: activity });
        return activity;
    }
    async assertCompanyReadable(companyId, user) {
        await this.companyAccess.assertCompanyReadable(companyId, user);
    }
    async updateActivity(activityId, dto, user) {
        const activity = await this.findActivityForMutation(activityId, user);
        if (activity.type === 'STAGE_CHANGE') {
            throw new common_1.BadRequestException('STAGE_CHANGE activities cannot be edited manually');
        }
        if (dto.type === 'STAGE_CHANGE') {
            throw new common_1.BadRequestException('Activity type cannot be changed to STAGE_CHANGE manually');
        }
        if (dto.personId) {
            const person = await this.validatePersonAccess(dto.personId, user);
            if (person.companyId !== activity.companyId) {
                throw new common_1.BadRequestException('Person must belong to the activity company');
            }
        }
        if (dto.opportunityId)
            await this.validateOpportunityCompany(dto.opportunityId, activity.companyId);
        const updated = await this.prisma.activity.update({
            where: { id: activityId },
            data: {
                ...(dto.type !== undefined && { type: dto.type }),
                ...(dto.personId !== undefined && { personId: dto.personId }),
                ...(dto.occurredAt != null && { occurredAt: (0, api_date_util_1.parseApiDate)(dto.occurredAt, 'occurredAt') }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
                ...(dto.outcome !== undefined && { outcome: dto.outcome }),
                ...(dto.nextActionDate !== undefined && {
                    nextActionDate: (0, api_date_util_1.parseNullableApiDate)(dto.nextActionDate, 'nextActionDate'),
                }),
                ...(dto.opportunityId !== undefined && { opportunityId: dto.opportunityId }),
            },
            include: { company: true, person: true, user: { select: { id: true, fullName: true } }, completedBy: { select: { id: true, fullName: true } } },
        });
        await this.audit.record({ actorId: user.userId, entityType: 'activity', entityId: activityId, action: 'activity.updated', before: activity, after: updated });
        return updated;
    }
    async completeActivity(activityId, dto, user) {
        const activity = await this.findActivityForMutation(activityId, user);
        if (!activity.nextActionDate) {
            throw new common_1.BadRequestException('Only activities with a follow-up date can be completed');
        }
        if (activity.completedAt)
            return activity;
        const completed = await this.prisma.activity.update({
            where: { id: activityId },
            data: {
                completedAt: new Date(),
                completedById: user.userId,
                completionNote: dto.completionNote,
                ...(dto.outcome !== undefined && { outcome: dto.outcome }),
            },
            include: { company: true, person: true, user: { select: { id: true, fullName: true } }, completedBy: { select: { id: true, fullName: true } } },
        });
        await this.audit.record({ actorId: user.userId, entityType: 'activity', entityId: activityId, action: 'follow-up.completed', before: activity, after: completed });
        return completed;
    }
    async rescheduleActivity(activityId, dto, user) {
        const activity = await this.findActivityForMutation(activityId, user);
        if (activity.completedAt) {
            throw new common_1.BadRequestException('Completed follow-ups cannot be rescheduled');
        }
        const nextActionDate = (0, api_date_util_1.parseApiDate)(dto.nextActionDate, 'nextActionDate');
        if (nextActionDate <= new Date()) {
            throw new common_1.BadRequestException('nextActionDate must be in the future');
        }
        const note = dto.note?.trim();
        const notes = note ? [activity.notes, `[Rescheduled] ${note}`].filter(Boolean).join('\n') : activity.notes;
        const rescheduled = await this.prisma.activity.update({
            where: { id: activityId },
            data: { nextActionDate, notes },
            include: { company: true, person: true, user: { select: { id: true, fullName: true } }, completedBy: { select: { id: true, fullName: true } } },
        });
        await this.audit.record({ actorId: user.userId, entityType: 'activity', entityId: activityId, action: 'follow-up.rescheduled', before: activity, after: rescheduled });
        return rescheduled;
    }
    async findDueFollowUps(user, pagination) {
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = {
            userId: user.userId,
            nextActionDate: { lte: new Date() },
            completedAt: null,
        };
        const [data, total] = await Promise.all([
            this.prisma.activity.findMany({
                where,
                include: { company: { select: { id: true, legalName: true } }, person: true },
                orderBy: { nextActionDate: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.activity.count({ where }),
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
    async validateOpportunityCompany(opportunityId, companyId) {
        const opportunity = await this.prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { companyId: true } });
        if (!opportunity)
            throw new common_1.NotFoundException('Opportunity not found');
        if (opportunity.companyId !== companyId)
            throw new common_1.BadRequestException('Opportunity must belong to the activity company');
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_log_service_1.AuditLogService, company_access_service_1.CompanyAccessService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map