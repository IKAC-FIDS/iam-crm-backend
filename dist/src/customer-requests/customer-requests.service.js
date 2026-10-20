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
exports.CustomerRequestsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const node_crypto_1 = require("node:crypto");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const company_access_service_1 = require("../companies/company-access.service");
const prisma_service_1 = require("../prisma/prisma.service");
const customer_request_lifecycle_1 = require("./customer-request-lifecycle");
const customer_request_form_1 = require("./customer-request-form");
let CustomerRequestsService = class CustomerRequestsService {
    constructor(prisma, audit, companyAccess) {
        this.prisma = prisma;
        this.audit = audit;
        this.companyAccess = companyAccess;
    }
    listTypesInternal(user, includeRetired = false) {
        return this.prisma.customerRequestType.findMany({ where: { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), ...(!includeRetired && { retiredAt: null }) }, include: { currentPublishedVersion: true, companyAvailability: { select: { companyId: true } }, _count: { select: { formVersions: true, requests: true } } }, orderBy: [{ displayOrder: 'asc' }, { displayName: 'asc' }] });
    }
    async createType(dto, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user), code = dto.code.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_');
        if (!/^[A-Z][A-Z0-9_]{1,63}$/.test(code))
            throw new common_1.BadRequestException('Request type code is invalid');
        try {
            return await this.prisma.$transaction(async (tx) => { const row = await tx.customerRequestType.create({ data: { organizationId, code, displayName: dto.displayName.trim(), description: dto.description?.trim() || null, presentation: dto.presentation, displayOrder: dto.displayOrder ?? 0, availabilityPolicy: dto.availabilityPolicy, defaultRoutingDestination: dto.defaultRoutingDestination, createdById: user.userId } }); await this.audit.record({ actorId: user.userId, organizationId, entityType: 'customer-request-type', entityId: row.id, action: 'customer_request_type.created', after: { code, displayName: row.displayName } }, tx); return row; });
        }
        catch (error) {
            if (this.unique(error))
                throw new common_1.ConflictException('Request type code already exists');
            throw error;
        }
    }
    async updateType(id, dto, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user), before = await this.typeOrThrow(id, organizationId);
        return this.prisma.$transaction(async (tx) => { const row = await tx.customerRequestType.update({ where: { id }, data: { ...(dto.displayName !== undefined && { displayName: dto.displayName.trim() }), ...(dto.description !== undefined && { description: dto.description.trim() || null }), ...(dto.presentation !== undefined && { presentation: dto.presentation }), ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }), ...(dto.isEnabled !== undefined && { isEnabled: dto.isEnabled }), ...(dto.availabilityPolicy !== undefined && { availabilityPolicy: dto.availabilityPolicy }), ...(dto.defaultRoutingDestination !== undefined && { defaultRoutingDestination: dto.defaultRoutingDestination }), ...(dto.retired !== undefined && { retiredAt: dto.retired ? new Date() : null, ...(dto.retired && { isEnabled: false }) }) } }); await this.audit.record({ actorId: user.userId, organizationId, entityType: 'customer-request-type', entityId: id, action: 'customer_request_type.updated', before: this.typeAudit(before), after: this.typeAudit(row) }, tx); return row; });
    }
    async configureAvailability(id, dto, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        await this.typeOrThrow(id, organizationId);
        const companyIds = [...new Set(dto.companyIds)];
        if (companyIds.length && await this.prisma.company.count({ where: { id: { in: companyIds }, organizationId, archivedAt: null } }) !== companyIds.length)
            throw new common_1.BadRequestException('One or more companies are invalid');
        await this.prisma.$transaction(async (tx) => { await tx.customerRequestTypeCompanyAvailability.deleteMany({ where: { requestTypeId: id, organizationId } }); if (companyIds.length)
            await tx.customerRequestTypeCompanyAvailability.createMany({ data: companyIds.map(companyId => ({ requestTypeId: id, companyId, organizationId })) }); await tx.customerRequestType.update({ where: { id }, data: { availabilityPolicy: client_1.CustomerRequestAvailabilityPolicy.SELECTED_COMPANIES } }); await this.audit.record({ actorId: user.userId, organizationId, entityType: 'customer-request-type', entityId: id, action: 'customer_request_type.availability_changed', after: { companyIds } }, tx); });
        return { requestTypeId: id, companyIds };
    }
    async saveDraftForm(typeId, input, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        await this.typeOrThrow(typeId, organizationId);
        const schema = (0, customer_request_form_1.parseCustomerRequestFormSchema)(input);
        return this.prisma.$transaction(async (tx) => { const draft = await tx.customerRequestFormVersion.findFirst({ where: { requestTypeId: typeId, status: 'DRAFT' }, orderBy: { version: 'desc' } }); const max = draft ? draft.version : ((await tx.customerRequestFormVersion.aggregate({ where: { requestTypeId: typeId }, _max: { version: true } }))._max.version ?? 0) + 1; const row = draft ? await tx.customerRequestFormVersion.update({ where: { id: draft.id }, data: { schema: schema } }) : await tx.customerRequestFormVersion.create({ data: { requestTypeId: typeId, version: max, schema: schema } }); await this.audit.record({ actorId: user.userId, organizationId, entityType: 'customer-request-form-version', entityId: row.id, action: 'customer_request_form.draft_saved', metadata: { requestTypeId: typeId, version: row.version, fieldCount: schema.fields.length } }, tx); return row; }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async publishForm(typeId, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        await this.typeOrThrow(typeId, organizationId);
        return this.prisma.$transaction(async (tx) => { const draft = await tx.customerRequestFormVersion.findFirst({ where: { requestTypeId: typeId, status: 'DRAFT' }, orderBy: { version: 'desc' } }); if (!draft)
            throw new common_1.ConflictException('No draft form version is available'); (0, customer_request_form_1.parseCustomerRequestFormSchema)(draft.schema); const row = await tx.customerRequestFormVersion.update({ where: { id: draft.id }, data: { status: 'PUBLISHED', publishedAt: new Date(), publishedById: user.userId } }); await tx.customerRequestType.update({ where: { id: typeId }, data: { currentPublishedVersionId: row.id } }); await this.audit.record({ actorId: user.userId, organizationId, entityType: 'customer-request-form-version', entityId: row.id, action: 'customer_request_form.published', metadata: { requestTypeId: typeId, version: row.version } }, tx); return row; }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async formHistory(typeId, user) { await this.typeOrThrow(typeId, (0, tenant_scope_util_1.getCurrentOrganizationId)(user)); return this.prisma.customerRequestFormVersion.findMany({ where: { requestTypeId: typeId }, orderBy: { version: 'desc' } }); }
    portalCatalog(p) { return this.prisma.customerRequestType.findMany({ where: this.availableTypeWhere(p), select: this.portalTypeSelect(), orderBy: [{ displayOrder: 'asc' }, { displayName: 'asc' }] }); }
    async portalType(id, p) { const row = await this.prisma.customerRequestType.findFirst({ where: { id, ...this.availableTypeWhere(p) }, select: this.portalTypeSelect() }); if (!row)
        throw new common_1.NotFoundException('Request type not found'); return row; }
    async createPortalRequest(dto, p) {
        const type = await this.portalType(dto.requestTypeId, p), version = type.currentPublishedVersion, answers = (0, customer_request_form_1.validateCustomerRequestAnswers)(version.schema, dto.answers ?? {}, true);
        return this.prisma.$transaction(async (tx) => { const row = await tx.customerRequest.create({ data: { organizationId: p.organizationId, companyId: p.companyId, requestTypeId: type.id, formVersionId: version.id, creatorUserId: p.userId, creatorMembershipId: p.membershipId, title: dto.title.trim(), answers: answers } }); await tx.customerRequestStatusHistory.create({ data: { organizationId: p.organizationId, companyId: p.companyId, requestId: row.id, newStatus: 'DRAFT', actorType: 'CUSTOMER', actorId: p.userId } }); await this.audit.record({ actorId: p.userId, actorMembershipId: p.membershipId, organizationId: p.organizationId, entityType: 'customer-request', entityId: row.id, action: 'customer_request.created', metadata: { companyId: p.companyId, requestTypeId: type.id, formVersionId: version.id } }, tx); return this.portalView(row.id, p, tx); });
    }
    async updateDraft(id, dto, p) { const row = await this.portalMutation(id, p, true); if (row.status !== 'DRAFT')
        throw new common_1.ConflictException('Only drafts can be edited'); const answers = (0, customer_request_form_1.validateCustomerRequestAnswers)(row.formVersion.schema, dto.answers, true); await this.prisma.customerRequest.update({ where: { id }, data: { ...(dto.title && { title: dto.title.trim() }), answers: answers } }); return this.portalView(id, p); }
    async submit(id, p) {
        return this.prisma.$transaction(async (tx) => { const row = await tx.customerRequest.findFirst({ where: { id, organizationId: p.organizationId, companyId: p.companyId, creatorMembershipId: p.membershipId, status: 'DRAFT' }, include: { formVersion: true, requestType: { include: { companyAvailability: true } } } }); if (!row)
            throw new common_1.NotFoundException('Draft request not found'); this.assertAvailable(row.requestType, p.companyId); (0, customer_request_form_1.validateCustomerRequestAnswers)(row.formVersion.schema, row.answers); if (row.formVersion.status !== client_1.CustomerRequestFormVersionStatus.PUBLISHED)
            throw new common_1.ConflictException({ code: 'FORM_VERSION_UNAVAILABLE', message: 'نسخه فرم این پیش‌نویس دیگر قابل ارسال نیست؛ اطلاعات شما حفظ شده است.' }); const trackingNumber = await this.tracking(tx), now = new Date(); if (!(await tx.customerRequest.updateMany({ where: { id, status: 'DRAFT' }, data: { status: 'SUBMITTED', trackingNumber, submittedAt: now } })).count)
            throw new common_1.ConflictException('Request has already been submitted'); await tx.customerRequestStatusHistory.create({ data: { organizationId: p.organizationId, companyId: p.companyId, requestId: id, previousStatus: 'DRAFT', newStatus: 'SUBMITTED', actorType: 'CUSTOMER', actorId: p.userId, customerVisibleExplanation: 'درخواست ثبت شد.' } }); await this.audit.record({ actorId: p.userId, actorMembershipId: p.membershipId, organizationId: p.organizationId, entityType: 'customer-request', entityId: id, action: 'customer_request.submitted', metadata: { companyId: p.companyId, requestTypeId: row.requestTypeId, formVersionId: row.formVersionId, trackingNumber } }, tx); return this.portalView(id, p, tx); }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async cancel(id, p) { const row = await this.portalMutation(id, p, false); (0, customer_request_lifecycle_1.assertCustomerRequestTransition)(row.status, 'CANCELLED'); return this.prisma.$transaction(async (tx) => { const changed = await tx.customerRequest.updateMany({ where: { id, status: row.status }, data: { status: 'CANCELLED', closedAt: new Date() } }); if (!changed.count)
        throw new common_1.ConflictException('Request status changed; reload and try again'); await tx.customerRequestStatusHistory.create({ data: { organizationId: p.organizationId, companyId: p.companyId, requestId: id, previousStatus: row.status, newStatus: 'CANCELLED', actorType: 'CUSTOMER', actorId: p.userId, customerVisibleExplanation: 'درخواست توسط مشتری لغو شد.' } }); await this.audit.record({ actorId: p.userId, actorMembershipId: p.membershipId, organizationId: p.organizationId, entityType: 'customer-request', entityId: id, action: 'customer_request.cancelled', metadata: { companyId: p.companyId } }, tx); return this.portalView(id, p, tx); }); }
    async listPortal(q, p) { const page = q.page ?? 1, limit = q.limit ?? 20, access = p.role === client_1.CustomerRole.CUSTOMER_ADMIN ? {} : { OR: [{ creatorMembershipId: p.membershipId }, { shares: { some: { membershipId: p.membershipId, revokedAt: null } } }] }, where = { organizationId: p.organizationId, companyId: p.companyId, ...access, ...(q.status && { status: q.status }), ...(q.requestTypeId && { requestTypeId: q.requestTypeId }), ...(q.search && { OR: [{ trackingNumber: { contains: q.search, mode: 'insensitive' } }, { title: { contains: q.search, mode: 'insensitive' } }] }) }; const [data, total] = await Promise.all([this.prisma.customerRequest.findMany({ where, select: this.portalListSelect(), orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.prisma.customerRequest.count({ where })]); return { data, meta: this.meta(total, page, limit) }; }
    portalDetail(id, p) { return this.portalView(id, p); }
    async portalHistory(id, p) { await this.portalView(id, p); return this.prisma.customerRequestStatusHistory.findMany({ where: { requestId: id, organizationId: p.organizationId, companyId: p.companyId }, select: { id: true, previousStatus: true, newStatus: true, customerVisibleExplanation: true, createdAt: true }, orderBy: { createdAt: 'asc' } }); }
    async listShares(id, p) { await this.shareAdmin(id, p); return this.prisma.customerRequestShare.findMany({ where: { requestId: id, companyId: p.companyId, revokedAt: null }, select: { id: true, membershipId: true, createdAt: true, membership: { select: { role: true, user: { select: { id: true, fullName: true, email: true } } } } } }); }
    async share(id, membershipId, p) { await this.shareAdmin(id, p); if (!await this.prisma.customerCompanyMembership.findFirst({ where: { id: membershipId, organizationId: p.organizationId, companyId: p.companyId, status: 'ACTIVE' } }))
        throw new common_1.BadRequestException('Eligible company member not found'); return this.prisma.$transaction(async (tx) => { const row = await tx.customerRequestShare.upsert({ where: { requestId_membershipId: { requestId: id, membershipId } }, create: { requestId: id, organizationId: p.organizationId, companyId: p.companyId, membershipId, sharedByUserId: p.userId }, update: { revokedAt: null, revokedByUserId: null, sharedByUserId: p.userId } }); await this.audit.record({ actorId: p.userId, actorMembershipId: p.membershipId, organizationId: p.organizationId, entityType: 'customer-request-share', entityId: row.id, action: 'customer_request.shared', metadata: { requestId: id, companyId: p.companyId, membershipId } }, tx); return row; }); }
    async revokeShare(id, shareId, p) { await this.shareAdmin(id, p); return this.prisma.$transaction(async (tx) => { if (!(await tx.customerRequestShare.updateMany({ where: { id: shareId, requestId: id, organizationId: p.organizationId, companyId: p.companyId, revokedAt: null }, data: { revokedAt: new Date(), revokedByUserId: p.userId } })).count)
        throw new common_1.NotFoundException('Share not found'); await this.audit.record({ actorId: p.userId, actorMembershipId: p.membershipId, organizationId: p.organizationId, entityType: 'customer-request-share', entityId: shareId, action: 'customer_request.share_revoked', metadata: { requestId: id, companyId: p.companyId } }, tx); return { success: true }; }); }
    async listInternal(q, user) { const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user), page = q.page ?? 1, limit = q.limit ?? 20; if (q.companyId)
        await this.companyAccess.assertCompanyReadable(q.companyId, user); const where = { organizationId, status: q.status ?? { not: 'DRAFT' }, ...(q.companyId && { companyId: q.companyId }), ...(q.requestTypeId && { requestTypeId: q.requestTypeId }), ...(q.search && { OR: [{ trackingNumber: { contains: q.search, mode: 'insensitive' } }, { title: { contains: q.search, mode: 'insensitive' } }] }), ...(q.submittedFrom || q.submittedTo ? { submittedAt: { ...(q.submittedFrom && { gte: new Date(q.submittedFrom) }), ...(q.submittedTo && { lte: new Date(q.submittedTo) }) } } : {}) }; const include = { company: { select: { id: true, legalName: true, brandName: true } }, requestType: { select: { id: true, code: true, displayName: true } }, creator: { select: { id: true, fullName: true, email: true } } }; const [data, total] = await Promise.all([this.prisma.customerRequest.findMany({ where, include, orderBy: { submittedAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.prisma.customerRequest.count({ where })]); return { data, meta: this.meta(total, page, limit) }; }
    async internalDetail(id, user) { const row = await this.prisma.customerRequest.findFirst({ where: { id, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), status: { not: 'DRAFT' } }, include: { company: { select: { id: true, legalName: true, brandName: true } }, requestType: true, formVersion: true, creator: { select: { id: true, fullName: true, email: true } }, histories: { orderBy: { createdAt: 'asc' } } } }); if (!row)
        throw new common_1.NotFoundException('Customer request not found'); await this.companyAccess.assertCompanyReadable(row.companyId, user); return { ...row, allowedTransitions: (0, customer_request_lifecycle_1.allowedCustomerRequestTransitions)(row.status) }; }
    async changeStatus(id, dto, user) { const row = await this.internalDetail(id, user); (0, customer_request_lifecycle_1.assertCustomerRequestTransition)(row.status, dto.status); const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user); return this.prisma.$transaction(async (tx) => { const changed = await tx.customerRequest.updateMany({ where: { id, status: row.status }, data: { status: dto.status, ...(['CLOSED', 'CANCELLED'].includes(dto.status) && { closedAt: new Date() }) } }); if (changed.count !== 1)
        throw new common_1.ConflictException('Customer request status changed concurrently'); const updated = await tx.customerRequest.findUniqueOrThrow({ where: { id } }); await tx.customerRequestStatusHistory.create({ data: { organizationId, companyId: row.companyId, requestId: id, previousStatus: row.status, newStatus: dto.status, actorType: 'INTERNAL', actorId: user.userId, customerVisibleExplanation: dto.customerVisibleExplanation?.trim() || null, internalReason: dto.internalReason?.trim() || null } }); await this.audit.record({ actorId: user.userId, organizationId, entityType: 'customer-request', entityId: id, action: 'customer_request.status_changed', before: { status: row.status }, after: { status: dto.status }, metadata: { companyId: row.companyId, hasCustomerExplanation: !!dto.customerVisibleExplanation, hasInternalReason: !!dto.internalReason } }, tx); return updated; }); }
    availableTypeWhere(p) { return { organizationId: p.organizationId, isEnabled: true, retiredAt: null, currentPublishedVersionId: { not: null }, OR: [{ availabilityPolicy: 'ALL_PORTAL_COMPANIES' }, { availabilityPolicy: 'SELECTED_COMPANIES', companyAvailability: { some: { companyId: p.companyId } } }] }; }
    portalTypeSelect() { return { id: true, code: true, displayName: true, description: true, presentation: true, displayOrder: true, currentPublishedVersion: { select: { id: true, version: true, schema: true } } }; }
    async portalMutation(id, p, ownOnly) { const row = await this.prisma.customerRequest.findFirst({ where: { id, organizationId: p.organizationId, companyId: p.companyId, ...(ownOnly && { creatorMembershipId: p.membershipId }) }, include: { formVersion: true } }); if (!row || (row.creatorMembershipId !== p.membershipId && p.role !== client_1.CustomerRole.CUSTOMER_ADMIN))
        throw new common_1.NotFoundException('Customer request not found'); return row; }
    async portalView(id, p, db = this.prisma) { const row = await db.customerRequest.findFirst({ where: { id, organizationId: p.organizationId, companyId: p.companyId, ...(p.role !== client_1.CustomerRole.CUSTOMER_ADMIN && { OR: [{ creatorMembershipId: p.membershipId }, { shares: { some: { membershipId: p.membershipId, revokedAt: null } } }] }) }, select: { id: true, trackingNumber: true, title: true, status: true, answers: true, submittedAt: true, createdAt: true, updatedAt: true, creatorMembershipId: true, requestType: { select: { id: true, code: true, displayName: true } }, formVersion: { select: { id: true, version: true, schema: true } }, histories: { select: { id: true, previousStatus: true, newStatus: true, customerVisibleExplanation: true, createdAt: true }, orderBy: { createdAt: 'asc' } } } }); if (!row)
        throw new common_1.NotFoundException('Customer request not found'); return { ...row, allowedActions: { edit: row.status === 'DRAFT' && row.creatorMembershipId === p.membershipId, submit: row.status === 'DRAFT' && row.creatorMembershipId === p.membershipId, cancel: ['DRAFT', 'SUBMITTED'].includes(row.status) && (row.creatorMembershipId === p.membershipId || p.role === client_1.CustomerRole.CUSTOMER_ADMIN), share: p.role === client_1.CustomerRole.CUSTOMER_ADMIN && row.status !== 'DRAFT' } }; }
    async shareAdmin(id, p) { if (p.role !== client_1.CustomerRole.CUSTOMER_ADMIN)
        throw new common_1.ForbiddenException('Only customer admins may manage sharing'); if (!await this.prisma.customerRequest.findFirst({ where: { id, organizationId: p.organizationId, companyId: p.companyId, status: { not: 'DRAFT' } } }))
        throw new common_1.NotFoundException('Customer request not found'); }
    async typeOrThrow(id, organizationId) { const row = await this.prisma.customerRequestType.findFirst({ where: { id, organizationId } }); if (!row)
        throw new common_1.NotFoundException('Request type not found'); return row; }
    assertAvailable(type, companyId) { if (!type.isEnabled || type.retiredAt || !type.currentPublishedVersionId || (type.availabilityPolicy === client_1.CustomerRequestAvailabilityPolicy.SELECTED_COMPANIES && !type.companyAvailability.some((x) => x.companyId === companyId)))
        throw new common_1.ConflictException({ code: 'REQUEST_TYPE_UNAVAILABLE', message: 'این نوع درخواست دیگر برای شرکت فعال قابل ارسال نیست؛ پیش‌نویس شما حفظ شده است.' }); }
    async tracking(tx) { for (let i = 0; i < 8; i++) {
        const value = `NSH-${new Date().getUTCFullYear()}-${(0, node_crypto_1.randomBytes)(5).toString('hex').toUpperCase()}`;
        if (!await tx.customerRequest.findUnique({ where: { trackingNumber: value } }))
            return value;
    } throw new common_1.ConflictException('Could not allocate tracking number'); }
    portalListSelect() { return { id: true, trackingNumber: true, title: true, status: true, submittedAt: true, createdAt: true, updatedAt: true, creatorMembershipId: true, requestType: { select: { id: true, code: true, displayName: true } } }; }
    typeAudit(row) { return { displayName: row.displayName, description: row.description, displayOrder: row.displayOrder, availabilityPolicy: row.availabilityPolicy, isEnabled: row.isEnabled, retiredAt: row.retiredAt }; }
    unique(error) { return error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002'; }
    meta(total, page, limit) { const totalPages = Math.ceil(total / limit); return { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 }; }
};
exports.CustomerRequestsService = CustomerRequestsService;
exports.CustomerRequestsService = CustomerRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_log_service_1.AuditLogService, company_access_service_1.CompanyAccessService])
], CustomerRequestsService);
//# sourceMappingURL=customer-requests.service.js.map