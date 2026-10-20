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
exports.CustomerRequestOperationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const company_access_service_1 = require("../companies/company-access.service");
const opportunities_service_1 = require("../opportunities/opportunities.service");
const prisma_service_1 = require("../prisma/prisma.service");
const tasks_service_1 = require("../tasks/tasks.service");
const technical_center_service_1 = require("../technical-center/technical-center.service");
const linkInclude = {
    createdBy: { select: { id: true, fullName: true } },
    task: { select: { id: true, title: true, status: true, priority: true, dueAt: true } },
    technicalDocument: { select: { id: true, title: true, documentType: true, status: true } },
    opportunity: { select: { id: true, title: true, priority: true, stage: { select: { id: true, label: true, terminalType: true } } } },
};
let CustomerRequestOperationsService = class CustomerRequestOperationsService {
    constructor(prisma, audit, companyAccess, tasks, opportunities, technical) {
        this.prisma = prisma;
        this.audit = audit;
        this.companyAccess = companyAccess;
        this.tasks = tasks;
        this.opportunities = opportunities;
        this.technical = technical;
    }
    async list(q, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user), page = q.page ?? 1, limit = q.limit ?? 20;
        if (q.companyId)
            await this.companyAccess.assertCompanyReadable(q.companyId, user);
        const where = { organizationId, company: { archivedAt: null }, status: q.status ?? { not: 'DRAFT' }, ...(q.companyId && { companyId: q.companyId }), ...(q.requestTypeId && { requestTypeId: q.requestTypeId }), ...(q.priority && { priority: q.priority }), ...(q.triageStatus && { triageStatus: q.triageStatus }), ...(q.assignedToId && { assignedToId: q.assignedToId }), ...(q.responsibleTeamId && { responsibleTeamId: q.responsibleTeamId }), ...(q.routingDestination && { routingDestination: q.routingDestination }), ...(q.search && { OR: [{ trackingNumber: { contains: q.search, mode: 'insensitive' } }, { title: { contains: q.search, mode: 'insensitive' } }] }) };
        const include = { company: { select: { id: true, legalName: true, brandName: true } }, requestType: { select: { id: true, code: true, displayName: true, defaultRoutingDestination: true } }, assignedTo: { select: { id: true, fullName: true, email: true } }, responsibleTeam: { select: { id: true, name: true, code: true } }, _count: { select: { crmLinks: { where: { unlinkedAt: null } } } } };
        const sortBy = q.sortBy ?? 'submittedAt', sortOrder = q.sortOrder ?? 'asc';
        const [data, total] = await Promise.all([this.prisma.customerRequest.findMany({ where, include, orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }), this.prisma.customerRequest.count({ where })]);
        const totalPages = Math.ceil(total / limit);
        return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    }
    async options(user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const [teams, requestTypes] = await Promise.all([
            this.prisma.team.findMany({ where: { organizationId, isActive: true }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } }),
            this.prisma.customerRequestType.findMany({ where: { organizationId, retiredAt: null }, select: { id: true, displayName: true }, orderBy: [{ displayOrder: 'asc' }, { displayName: 'asc' }] }),
        ]);
        return { teams, requestTypes };
    }
    async updateTriage(id, dto, user) {
        const request = await this.request(id, user);
        if (dto.assignedToId !== undefined || dto.responsibleTeamId !== undefined)
            this.require(user, 'customer-request:assign');
        if (dto.routingDestination !== undefined)
            this.require(user, 'customer-request:route');
        if (dto.assignedToId)
            await this.assertUser(dto.assignedToId, request.organizationId);
        if (dto.responsibleTeamId)
            await this.assertTeam(dto.responsibleTeamId, request.organizationId);
        const next = { priority: dto.priority ?? request.priority, assignedToId: dto.assignedToId === undefined ? request.assignedToId : dto.assignedToId, responsibleTeamId: dto.responsibleTeamId === undefined ? request.responsibleTeamId : dto.responsibleTeamId, routingDestination: dto.routingDestination ?? request.routingDestination ?? request.requestType.defaultRoutingDestination };
        const complete = dto.completeTriage ?? true;
        return this.prisma.$transaction(async (tx) => {
            const changed = await tx.customerRequest.updateMany({ where: { id, organizationId: request.organizationId, revision: dto.expectedRevision }, data: { ...next, triageReason: dto.internalReason?.trim() || null, triageStatus: complete ? 'TRIAGED' : 'UNTRIAGED', triagedAt: complete ? new Date() : null, triagedById: complete ? user.userId : null, revision: { increment: 1 } } });
            if (changed.count !== 1)
                throw new common_1.ConflictException({ code: 'CUSTOMER_REQUEST_TRIAGE_CONFLICT', message: 'درخواست توسط کاربر دیگری تغییر کرده است؛ صفحه را تازه‌سازی کنید.' });
            await tx.customerRequestOperationalHistory.create({ data: { organizationId: request.organizationId, companyId: request.companyId, requestId: id, actorId: user.userId, action: request.triageStatus === 'UNTRIAGED' && complete ? 'TRIAGE_COMPLETED' : 'TRIAGE_UPDATED', previousPriority: request.priority, newPriority: next.priority, previousAssigneeId: request.assignedToId, newAssigneeId: next.assignedToId, previousTeamId: request.responsibleTeamId, newTeamId: next.responsibleTeamId, previousRoutingDestination: request.routingDestination, newRoutingDestination: next.routingDestination, internalReason: dto.internalReason?.trim() || null } });
            await this.audit.record({ actorId: user.userId, organizationId: request.organizationId, entityType: 'customer-request', entityId: id, action: 'customer_request.triaged', before: { revision: request.revision }, after: { revision: request.revision + 1, ...next }, metadata: { companyId: request.companyId } }, tx);
            return tx.customerRequest.findUniqueOrThrow({ where: { id }, include: { assignedTo: { select: { id: true, fullName: true } }, responsibleTeam: { select: { id: true, name: true } }, requestType: { select: { defaultRoutingDestination: true } } } });
        });
    }
    async history(id, user) { const r = await this.request(id, user); return this.prisma.customerRequestOperationalHistory.findMany({ where: { requestId: id, organizationId: r.organizationId }, include: { actor: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } }); }
    async links(id, user) { const r = await this.request(id, user); return this.prisma.customerRequestCrmLink.findMany({ where: { requestId: id, organizationId: r.organizationId, unlinkedAt: null }, include: linkInclude, orderBy: { createdAt: 'desc' } }); }
    async linkExisting(id, dto, user) { const r = await this.request(id, user); await this.assertTarget(dto.targetType, dto.targetId, r.companyId, user); return this.persistLink(r, dto.targetType, dto.targetId, dto.purpose, user); }
    async unlink(id, linkId, reason, user) { const r = await this.request(id, user); return this.prisma.$transaction(async (tx) => { const link = await tx.customerRequestCrmLink.findFirst({ where: { id: linkId, requestId: id, organizationId: r.organizationId, unlinkedAt: null } }); if (!link)
        throw new common_1.NotFoundException('پیوند فعال پیدا نشد'); const row = await tx.customerRequestCrmLink.update({ where: { id: link.id }, data: { unlinkedAt: new Date(), unlinkedById: user.userId, unlinkReason: reason.trim() }, include: linkInclude }); await this.operation(tx, r, user.userId, 'CRM_LINK_REMOVED', { linkId, targetType: link.targetType }); await this.audit.record({ actorId: user.userId, organizationId: r.organizationId, entityType: 'customer-request-crm-link', entityId: link.id, action: 'customer_request.crm_link_removed', metadata: { requestId: id, companyId: r.companyId } }, tx); return row; }); }
    async createTask(id, dto, user) { this.require(user, 'task:create'); const r = await this.request(id, user); return this.createIdempotent(r, 'TASK', dto.idempotencyKey, dto.purpose, user, async () => (await this.tasks.create({ title: dto.title, description: dto.description, priority: dto.priority, dueAt: dto.dueAt, assignedToId: dto.assignedToId, companyId: r.companyId }, user)).id); }
    async createOpportunity(id, dto, user) { this.require(user, 'opportunity:create'); const r = await this.request(id, user); return this.createIdempotent(r, 'OPPORTUNITY', dto.idempotencyKey, dto.purpose, user, async () => (await this.opportunities.create({ companyId: r.companyId, title: dto.title, description: dto.description, ownerId: dto.ownerId, stageId: dto.stageId, priority: dto.priority, expectedCloseDate: dto.expectedCloseDate }, user)).id); }
    async createTechnicalDocument(id, dto, user) { this.require(user, 'technical-document:manage'); const r = await this.request(id, user); return this.createIdempotent(r, 'TECHNICAL_DOCUMENT', dto.idempotencyKey, dto.purpose, user, async () => (await this.technical.createDocument({ title: dto.title, documentType: dto.documentType, ownerId: dto.ownerId, description: dto.description, confidentiality: dto.confidentiality, companyId: r.companyId }, user)).id); }
    async createIdempotent(r, type, key, purpose, user, create) {
        const linked = await this.byKey(r.id, key);
        if (linked)
            return linked;
        let attempt = await this.prisma.customerRequestCrmCreationAttempt.findUnique({ where: { requestId_idempotencyKey: { requestId: r.id, idempotencyKey: key } } });
        let mayCreate = false;
        if (!attempt) {
            try {
                attempt = await this.prisma.customerRequestCrmCreationAttempt.create({ data: { organizationId: r.organizationId, companyId: r.companyId, requestId: r.id, targetType: type, idempotencyKey: key, createdById: user.userId } });
                mayCreate = true;
            }
            catch (error) {
                if (!(error instanceof client_1.Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002')
                    throw error;
                attempt = await this.prisma.customerRequestCrmCreationAttempt.findUniqueOrThrow({ where: { requestId_idempotencyKey: { requestId: r.id, idempotencyKey: key } } });
            }
        }
        if (attempt.targetType !== type)
            throw new common_1.ConflictException('کلید تکرار برای نوع دیگری استفاده شده است');
        let targetId = attempt.targetId;
        if (!targetId && !mayCreate) {
            const claim = await this.prisma.customerRequestCrmCreationAttempt.updateMany({ where: { id: attempt.id, status: 'FAILED', targetId: null }, data: { status: 'PENDING', errorCode: null, createdById: user.userId } });
            if (claim.count !== 1)
                throw new common_1.ConflictException({ code: 'CUSTOMER_REQUEST_CREATION_IN_PROGRESS', message: 'ایجاد رکورد با این کلید در حال انجام است.' });
            mayCreate = true;
        }
        if (!targetId && mayCreate) {
            try {
                targetId = await create();
                await this.prisma.customerRequestCrmCreationAttempt.update({ where: { id: attempt.id }, data: { targetId, status: 'TARGET_CREATED' } });
            }
            catch (error) {
                await this.prisma.customerRequestCrmCreationAttempt.update({ where: { id: attempt.id }, data: { status: 'FAILED', errorCode: error instanceof Error ? error.name : 'UNKNOWN' } });
                throw error;
            }
        }
        if (!targetId)
            throw new common_1.ConflictException('وضعیت ایجاد رکورد نامعتبر است');
        try {
            const row = await this.persistLink(r, type, targetId, purpose, user, key, true);
            await this.prisma.customerRequestCrmCreationAttempt.update({ where: { id: attempt.id }, data: { status: 'COMPLETED' } });
            return row;
        }
        catch {
            throw new common_1.ConflictException({ code: 'CUSTOMER_REQUEST_LINK_RECOVERY_REQUIRED', message: 'رکورد ساخته شد؛ برای بازیابی پیوند با همان کلید دوباره تلاش کنید.', targetId });
        }
    }
    async persistLink(r, type, targetId, purpose, user, key, created = false) { const target = this.target(type, targetId); try {
        return await this.prisma.$transaction(async (tx) => { const existing = await tx.customerRequestCrmLink.findFirst({ where: { requestId: r.id, ...target } }); const row = existing ? await tx.customerRequestCrmLink.update({ where: { id: existing.id }, data: { unlinkedAt: null, unlinkedById: null, unlinkReason: null, purpose: purpose?.trim() || null, ...(key && { idempotencyKey: key }) }, include: linkInclude }) : await tx.customerRequestCrmLink.create({ data: { organizationId: r.organizationId, companyId: r.companyId, requestId: r.id, targetType: type, ...target, purpose: purpose?.trim() || null, idempotencyKey: key, createdById: user.userId }, include: linkInclude }); await this.operation(tx, r, user.userId, created ? 'CRM_RECORD_CREATED_AND_LINKED' : 'CRM_RECORD_LINKED', { linkId: row.id, targetType: type, targetId }); await this.audit.record({ actorId: user.userId, organizationId: r.organizationId, entityType: 'customer-request-crm-link', entityId: row.id, action: created ? 'customer_request.crm_record_created_and_linked' : 'customer_request.crm_record_linked', metadata: { requestId: r.id, companyId: r.companyId, targetType: type, targetId } }, tx); return row; });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            throw new common_1.ConflictException('این رکورد قبلاً پیوند شده است');
        throw error;
    } }
    async assertTarget(type, id, companyId, user) { if (type === 'TASK') {
        this.require(user, 'task:view');
        if ((await this.tasks.assertReadable(id, user)).companyId !== companyId)
            throw new common_1.BadRequestException('کار متعلق به شرکت درخواست نیست');
    }
    else if (type === 'OPPORTUNITY') {
        this.require(user, 'opportunity:view');
        if ((await this.opportunities.findOne(id, user)).companyId !== companyId)
            throw new common_1.BadRequestException('فرصت متعلق به شرکت درخواست نیست');
    }
    else {
        this.require(user, 'technical-document:view');
        if ((await this.technical.getDocument(id, user)).companyId !== companyId)
            throw new common_1.BadRequestException('سند فنی متعلق به شرکت درخواست نیست');
    } }
    async request(id, user) { const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user); const r = await this.prisma.customerRequest.findFirst({ where: { id, organizationId, status: { not: 'DRAFT' } }, include: { requestType: { select: { defaultRoutingDestination: true } } } }); if (!r)
        throw new common_1.NotFoundException('درخواست مشتری پیدا نشد'); await this.companyAccess.assertCompanyReadable(r.companyId, user); return r; }
    async assertUser(id, org) { if (!await this.prisma.user.findFirst({ where: { id, organizationId: org, principalType: 'INTERNAL', isActive: true } }))
        throw new common_1.BadRequestException('کاربر مسئول معتبر نیست'); }
    async assertTeam(id, org) { if (!await this.prisma.team.findFirst({ where: { id, organizationId: org, isActive: true } }))
        throw new common_1.BadRequestException('تیم مسئول معتبر نیست'); }
    byKey(requestId, idempotencyKey) { return this.prisma.customerRequestCrmLink.findFirst({ where: { requestId, idempotencyKey, unlinkedAt: null }, include: linkInclude }); }
    target(type, id) { return type === 'TASK' ? { taskId: id } : type === 'TECHNICAL_DOCUMENT' ? { technicalDocumentId: id } : { opportunityId: id }; }
    require(user, p) { if (!user.tenantContext?.permissions.includes(p))
        throw new common_1.ForbiddenException(`دسترسی لازم وجود ندارد: ${p}`); }
    operation(tx, r, actorId, action, metadata) { return tx.customerRequestOperationalHistory.create({ data: { organizationId: r.organizationId, companyId: r.companyId, requestId: r.id, actorId, action, metadata: metadata } }); }
};
exports.CustomerRequestOperationsService = CustomerRequestOperationsService;
exports.CustomerRequestOperationsService = CustomerRequestOperationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_log_service_1.AuditLogService, company_access_service_1.CompanyAccessService, tasks_service_1.TasksService, opportunities_service_1.OpportunitiesService, technical_center_service_1.TechnicalCenterService])
], CustomerRequestOperationsService);
//# sourceMappingURL=customer-request-operations.service.js.map