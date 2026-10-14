import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerRequestCrmTargetType, Prisma } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import { CompanyAccessService } from '../companies/company-access.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { TechnicalCenterService } from '../technical-center/technical-center.service';
import type { CreateLinkedOpportunityDto, CreateLinkedTaskDto, CreateLinkedTechnicalDocumentDto, LinkCustomerRequestRecordDto, RequestListDto, UpdateRequestTriageDto } from './dto/customer-request.dto';

const linkInclude = {
  createdBy: { select: { id: true, fullName: true } },
  task: { select: { id: true, title: true, status: true, priority: true, dueAt: true } },
  technicalDocument: { select: { id: true, title: true, documentType: true, status: true } },
  opportunity: { select: { id: true, title: true, priority: true, stage: { select: { id: true, label: true, terminalType: true } } } },
} satisfies Prisma.CustomerRequestCrmLinkInclude;

@Injectable()
export class CustomerRequestOperationsService {
  constructor(private prisma: PrismaService, private audit: AuditLogService, private companyAccess: CompanyAccessService, private tasks: TasksService, private opportunities: OpportunitiesService, private technical: TechnicalCenterService) {}

  async list(q: RequestListDto, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user), page = q.page ?? 1, limit = q.limit ?? 20;
    if (q.companyId) await this.companyAccess.assertCompanyReadable(q.companyId, user);
    const where: Prisma.CustomerRequestWhereInput = { organizationId, company: { archivedAt: null }, status: q.status ?? { not: 'DRAFT' }, ...(q.companyId && { companyId: q.companyId }), ...(q.requestTypeId && { requestTypeId: q.requestTypeId }), ...(q.priority && { priority: q.priority }), ...(q.triageStatus && { triageStatus: q.triageStatus }), ...(q.assignedToId && { assignedToId: q.assignedToId }), ...(q.responsibleTeamId && { responsibleTeamId: q.responsibleTeamId }), ...(q.routingDestination && { routingDestination: q.routingDestination }), ...(q.search && { OR: [{ trackingNumber: { contains: q.search, mode: 'insensitive' } }, { title: { contains: q.search, mode: 'insensitive' } }] }) };
    const include = { company: { select: { id: true, legalName: true, brandName: true } }, requestType: { select: { id: true, code: true, displayName: true, defaultRoutingDestination: true } }, assignedTo: { select: { id: true, fullName: true, email: true } }, responsibleTeam: { select: { id: true, name: true, code: true } }, _count: { select: { crmLinks: { where: { unlinkedAt: null } } } } } as const;
    const sortBy = q.sortBy ?? 'submittedAt', sortOrder = q.sortOrder ?? 'asc';
    const [data, total] = await Promise.all([this.prisma.customerRequest.findMany({ where, include, orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }], skip: (page - 1) * limit, take: limit }), this.prisma.customerRequest.count({ where })]);
    const totalPages = Math.ceil(total / limit); return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
  }

  async options(user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const [teams, requestTypes] = await Promise.all([
      this.prisma.team.findMany({ where: { organizationId, isActive: true }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } }),
      this.prisma.customerRequestType.findMany({ where: { organizationId, retiredAt: null }, select: { id: true, displayName: true }, orderBy: [{ displayOrder: 'asc' }, { displayName: 'asc' }] }),
    ]);
    return { teams, requestTypes };
  }

  async updateTriage(id: string, dto: UpdateRequestTriageDto, user: CurrentUserPayload) {
    const request = await this.request(id, user);
    if (dto.assignedToId !== undefined || dto.responsibleTeamId !== undefined) this.require(user, 'customer-request:assign');
    if (dto.routingDestination !== undefined) this.require(user, 'customer-request:route');
    if (dto.assignedToId) await this.assertUser(dto.assignedToId, request.organizationId);
    if (dto.responsibleTeamId) await this.assertTeam(dto.responsibleTeamId, request.organizationId);
    const next = { priority: dto.priority ?? request.priority, assignedToId: dto.assignedToId === undefined ? request.assignedToId : dto.assignedToId, responsibleTeamId: dto.responsibleTeamId === undefined ? request.responsibleTeamId : dto.responsibleTeamId, routingDestination: dto.routingDestination ?? request.routingDestination ?? request.requestType.defaultRoutingDestination };
    const complete = dto.completeTriage ?? true;
    return this.prisma.$transaction(async tx => {
      const changed = await tx.customerRequest.updateMany({ where: { id, organizationId: request.organizationId, revision: dto.expectedRevision }, data: { ...next, triageReason: dto.internalReason?.trim() || null, triageStatus: complete ? 'TRIAGED' : 'UNTRIAGED', triagedAt: complete ? new Date() : null, triagedById: complete ? user.userId : null, revision: { increment: 1 } } });
      if (changed.count !== 1) throw new ConflictException({ code: 'CUSTOMER_REQUEST_TRIAGE_CONFLICT', message: 'درخواست توسط کاربر دیگری تغییر کرده است؛ صفحه را تازه‌سازی کنید.' });
      await tx.customerRequestOperationalHistory.create({ data: { organizationId: request.organizationId, companyId: request.companyId, requestId: id, actorId: user.userId, action: request.triageStatus === 'UNTRIAGED' && complete ? 'TRIAGE_COMPLETED' : 'TRIAGE_UPDATED', previousPriority: request.priority, newPriority: next.priority, previousAssigneeId: request.assignedToId, newAssigneeId: next.assignedToId, previousTeamId: request.responsibleTeamId, newTeamId: next.responsibleTeamId, previousRoutingDestination: request.routingDestination, newRoutingDestination: next.routingDestination, internalReason: dto.internalReason?.trim() || null } });
      await this.audit.record({ actorId: user.userId, organizationId: request.organizationId, entityType: 'customer-request', entityId: id, action: 'customer_request.triaged', before: { revision: request.revision }, after: { revision: request.revision + 1, ...next }, metadata: { companyId: request.companyId } }, tx);
      return tx.customerRequest.findUniqueOrThrow({ where: { id }, include: { assignedTo: { select: { id: true, fullName: true } }, responsibleTeam: { select: { id: true, name: true } }, requestType: { select: { defaultRoutingDestination: true } } } });
    });
  }

  async history(id: string, user: CurrentUserPayload) { const r = await this.request(id, user); return this.prisma.customerRequestOperationalHistory.findMany({ where: { requestId: id, organizationId: r.organizationId }, include: { actor: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } }); }
  async links(id: string, user: CurrentUserPayload) { const r = await this.request(id, user); return this.prisma.customerRequestCrmLink.findMany({ where: { requestId: id, organizationId: r.organizationId, unlinkedAt: null }, include: linkInclude, orderBy: { createdAt: 'desc' } }); }
  async linkExisting(id: string, dto: LinkCustomerRequestRecordDto, user: CurrentUserPayload) { const r = await this.request(id, user); await this.assertTarget(dto.targetType, dto.targetId, r.companyId, user); return this.persistLink(r, dto.targetType, dto.targetId, dto.purpose, user); }
  async unlink(id: string, linkId: string, reason: string, user: CurrentUserPayload) { const r = await this.request(id, user); return this.prisma.$transaction(async tx => { const link = await tx.customerRequestCrmLink.findFirst({ where: { id: linkId, requestId: id, organizationId: r.organizationId, unlinkedAt: null } }); if (!link) throw new NotFoundException('پیوند فعال پیدا نشد'); const row = await tx.customerRequestCrmLink.update({ where: { id: link.id }, data: { unlinkedAt: new Date(), unlinkedById: user.userId, unlinkReason: reason.trim() }, include: linkInclude }); await this.operation(tx, r, user.userId, 'CRM_LINK_REMOVED', { linkId, targetType: link.targetType }); await this.audit.record({ actorId: user.userId, organizationId: r.organizationId, entityType: 'customer-request-crm-link', entityId: link.id, action: 'customer_request.crm_link_removed', metadata: { requestId: id, companyId: r.companyId } }, tx); return row; }); }

  async createTask(id: string, dto: CreateLinkedTaskDto, user: CurrentUserPayload) { this.require(user, 'task:create'); const r = await this.request(id, user); return this.createIdempotent(r, 'TASK', dto.idempotencyKey, dto.purpose, user, async () => (await this.tasks.create({ title: dto.title, description: dto.description, priority: dto.priority, dueAt: dto.dueAt, assignedToId: dto.assignedToId, companyId: r.companyId }, user)).id); }
  async createOpportunity(id: string, dto: CreateLinkedOpportunityDto, user: CurrentUserPayload) { this.require(user, 'opportunity:create'); const r = await this.request(id, user); return this.createIdempotent(r, 'OPPORTUNITY', dto.idempotencyKey, dto.purpose, user, async () => (await this.opportunities.create({ companyId: r.companyId, title: dto.title, description: dto.description, ownerId: dto.ownerId, stageId: dto.stageId, priority: dto.priority, expectedCloseDate: dto.expectedCloseDate }, user)).id); }
  async createTechnicalDocument(id: string, dto: CreateLinkedTechnicalDocumentDto, user: CurrentUserPayload) { this.require(user, 'technical-document:manage'); const r = await this.request(id, user); return this.createIdempotent(r, 'TECHNICAL_DOCUMENT', dto.idempotencyKey, dto.purpose, user, async () => (await this.technical.createDocument({ title: dto.title, documentType: dto.documentType, ownerId: dto.ownerId, description: dto.description, confidentiality: dto.confidentiality, companyId: r.companyId }, user)).id); }

  private async createIdempotent(r: any, type: CustomerRequestCrmTargetType, key: string, purpose: string | undefined, user: CurrentUserPayload, create: () => Promise<string>) {
    const linked = await this.byKey(r.id, key); if (linked) return linked;
    let attempt = await this.prisma.customerRequestCrmCreationAttempt.findUnique({ where: { requestId_idempotencyKey: { requestId: r.id, idempotencyKey: key } } });
    let mayCreate = false;
    if (!attempt) { try { attempt = await this.prisma.customerRequestCrmCreationAttempt.create({ data: { organizationId: r.organizationId, companyId: r.companyId, requestId: r.id, targetType: type, idempotencyKey: key, createdById: user.userId } }); mayCreate = true; } catch (error) { if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error; attempt = await this.prisma.customerRequestCrmCreationAttempt.findUniqueOrThrow({ where: { requestId_idempotencyKey: { requestId: r.id, idempotencyKey: key } } }); } }
    if (attempt.targetType !== type) throw new ConflictException('کلید تکرار برای نوع دیگری استفاده شده است');
    let targetId = attempt.targetId;
    if (!targetId && !mayCreate) { const claim = await this.prisma.customerRequestCrmCreationAttempt.updateMany({ where: { id: attempt.id, status: 'FAILED', targetId: null }, data: { status: 'PENDING', errorCode: null, createdById: user.userId } }); if (claim.count !== 1) throw new ConflictException({ code: 'CUSTOMER_REQUEST_CREATION_IN_PROGRESS', message: 'ایجاد رکورد با این کلید در حال انجام است.' }); mayCreate = true; }
    if (!targetId && mayCreate) { try { targetId = await create(); await this.prisma.customerRequestCrmCreationAttempt.update({ where: { id: attempt.id }, data: { targetId, status: 'TARGET_CREATED' } }); } catch (error) { await this.prisma.customerRequestCrmCreationAttempt.update({ where: { id: attempt.id }, data: { status: 'FAILED', errorCode: error instanceof Error ? error.name : 'UNKNOWN' } }); throw error; } }
    if (!targetId) throw new ConflictException('وضعیت ایجاد رکورد نامعتبر است');
    try { const row = await this.persistLink(r, type, targetId, purpose, user, key, true); await this.prisma.customerRequestCrmCreationAttempt.update({ where: { id: attempt.id }, data: { status: 'COMPLETED' } }); return row; } catch { throw new ConflictException({ code: 'CUSTOMER_REQUEST_LINK_RECOVERY_REQUIRED', message: 'رکورد ساخته شد؛ برای بازیابی پیوند با همان کلید دوباره تلاش کنید.', targetId }); }
  }

  private async persistLink(r: any, type: CustomerRequestCrmTargetType, targetId: string, purpose: string | undefined, user: CurrentUserPayload, key?: string, created = false) { const target = this.target(type, targetId); try { return await this.prisma.$transaction(async tx => { const existing = await tx.customerRequestCrmLink.findFirst({ where: { requestId: r.id, ...target } }); const row = existing ? await tx.customerRequestCrmLink.update({ where: { id: existing.id }, data: { unlinkedAt: null, unlinkedById: null, unlinkReason: null, purpose: purpose?.trim() || null, ...(key && { idempotencyKey: key }) }, include: linkInclude }) : await tx.customerRequestCrmLink.create({ data: { organizationId: r.organizationId, companyId: r.companyId, requestId: r.id, targetType: type, ...target, purpose: purpose?.trim() || null, idempotencyKey: key, createdById: user.userId }, include: linkInclude }); await this.operation(tx, r, user.userId, created ? 'CRM_RECORD_CREATED_AND_LINKED' : 'CRM_RECORD_LINKED', { linkId: row.id, targetType: type, targetId }); await this.audit.record({ actorId: user.userId, organizationId: r.organizationId, entityType: 'customer-request-crm-link', entityId: row.id, action: created ? 'customer_request.crm_record_created_and_linked' : 'customer_request.crm_record_linked', metadata: { requestId: r.id, companyId: r.companyId, targetType: type, targetId } }, tx); return row; }); } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('این رکورد قبلاً پیوند شده است'); throw error; } }
  private async assertTarget(type: CustomerRequestCrmTargetType, id: string, companyId: string, user: CurrentUserPayload) { if (type === 'TASK') { this.require(user, 'task:view'); if ((await this.tasks.assertReadable(id, user)).companyId !== companyId) throw new BadRequestException('کار متعلق به شرکت درخواست نیست'); } else if (type === 'OPPORTUNITY') { this.require(user, 'opportunity:view'); if ((await this.opportunities.findOne(id, user)).companyId !== companyId) throw new BadRequestException('فرصت متعلق به شرکت درخواست نیست'); } else { this.require(user, 'technical-document:view'); if ((await this.technical.getDocument(id, user)).companyId !== companyId) throw new BadRequestException('سند فنی متعلق به شرکت درخواست نیست'); } }
  private async request(id: string, user: CurrentUserPayload) { const organizationId = getCurrentOrganizationId(user); const r = await this.prisma.customerRequest.findFirst({ where: { id, organizationId, status: { not: 'DRAFT' } }, include: { requestType: { select: { defaultRoutingDestination: true } } } }); if (!r) throw new NotFoundException('درخواست مشتری پیدا نشد'); await this.companyAccess.assertCompanyReadable(r.companyId, user); return r; }
  private async assertUser(id: string, org: string) { if (!await this.prisma.user.findFirst({ where: { id, organizationId: org, principalType: 'INTERNAL', isActive: true } })) throw new BadRequestException('کاربر مسئول معتبر نیست'); }
  private async assertTeam(id: string, org: string) { if (!await this.prisma.team.findFirst({ where: { id, organizationId: org, isActive: true } })) throw new BadRequestException('تیم مسئول معتبر نیست'); }
  private byKey(requestId: string, idempotencyKey: string) { return this.prisma.customerRequestCrmLink.findFirst({ where: { requestId, idempotencyKey, unlinkedAt: null }, include: linkInclude }); }
  private target(type: CustomerRequestCrmTargetType, id: string) { return type === 'TASK' ? { taskId: id } : type === 'TECHNICAL_DOCUMENT' ? { technicalDocumentId: id } : { opportunityId: id }; }
  private require(user: CurrentUserPayload, p: string) { if (!user.tenantContext?.permissions.includes(p)) throw new ForbiddenException(`دسترسی لازم وجود ندارد: ${p}`); }
  private operation(tx: Prisma.TransactionClient, r: any, actorId: string, action: string, metadata: Record<string, unknown>) { return tx.customerRequestOperationalHistory.create({ data: { organizationId: r.organizationId, companyId: r.companyId, requestId: r.id, actorId, action, metadata: metadata as Prisma.InputJsonValue } }); }
}
