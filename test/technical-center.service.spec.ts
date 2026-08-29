import { ForbiddenException } from '@nestjs/common';
import {
  KnowledgeBaseStatus,
  TechnicalDocumentStatus,
  TechnicalReleaseStatus,
  TechnicalResourceStatus,
  TenderStatus,
} from '@prisma/client';
import { CurrentUserPayload } from '../src/common/decorators/current-user.decorator';
import { TechnicalCenterService } from '../src/technical-center/technical-center.service';

const organizationId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';
const user = (permissions: string[] = []): CurrentUserPayload => ({
  userId: '33333333-3333-4333-8333-333333333333', email: 'admin@example.com', role: 'ADMIN',
  membershipId: '44444444-4444-4444-8444-444444444444', organizationId,
  tenantContext: {
    tenantId: organizationId, organizationId, userId: '33333333-3333-4333-8333-333333333333',
    membershipId: '44444444-4444-4444-8444-444444444444', tenantRole: 'ADMIN', permissions,
    platformAdmin: false, membershipStatus: 'active', resolutionSource: 'authenticated-membership',
  },
});

describe('TechnicalCenterService', () => {
  const release = {
    id: '55555555-5555-4555-8555-555555555555', organizationId, productId, version: '1.0.0', title: 'Release',
    summary: null, releaseNotes: null, status: TechnicalReleaseStatus.DRAFT, releaseDate: null,
    supportStartDate: null, supportEndDate: null, endOfLifeDate: null, createdById: user().userId,
    updatedById: user().userId, revision: 1, archivedAt: null, createdAt: new Date(), updatedAt: new Date(),
  };
  let prisma: any;
  let audit: any;
  let service: TechnicalCenterService;

  beforeEach(() => {
    prisma = {
      productCatalogItem: { findUnique: jest.fn().mockResolvedValue({ id: productId }) },
      technicalRelease: {
        create: jest.fn().mockResolvedValue(release), findFirst: jest.fn().mockResolvedValue(release),
        findMany: jest.fn().mockResolvedValue([release]), count: jest.fn().mockResolvedValue(1),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      knowledgeBaseArticle: {
        create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0), update: jest.fn(),
      },
      technicalDocument: {
        create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0), updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      technicalDocumentVersion: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
      technicalResource: {
        create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0), update: jest.fn(),
      },
      tender: {
        create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0), updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      tenderRequirement: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
      organizationMembership: { findFirst: jest.fn().mockResolvedValue({ id: 'membership' }) },
      company: { findFirst: jest.fn().mockResolvedValue({ id: 'company' }) },
      opportunity: { findFirst: jest.fn().mockResolvedValue({ id: 'opportunity' }) },
      team: { findFirst: jest.fn().mockResolvedValue({ id: 'team' }) },
    };
    audit = { recordTenantEvent: jest.fn().mockResolvedValue({ id: 'audit' }) };
    service = new TechnicalCenterService(prisma, audit);
  });

  it('derives tenant ownership from the authenticated context and audits creation', async () => {
    prisma.technicalRelease.findFirst.mockResolvedValueOnce(null);
    await service.createRelease({ productId, version: '1.0.0', title: 'Release' }, user());
    expect(prisma.technicalRelease.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ organizationId, productId, createdById: user().userId }),
    }));
    expect(audit.recordTenantEvent).toHaveBeenCalledWith(expect.objectContaining({ organizationId, action: 'technical-release.created' }));
  });

  it('returns a structured conflict for a duplicate tenant product version', async () => {
    prisma.technicalRelease.findFirst.mockResolvedValueOnce({ id: 'duplicate' });
    await expect(service.createRelease({ productId, version: '1.0.0', title: 'Release' }, user()))
      .rejects.toMatchObject({ response: expect.objectContaining({ code: 'DUPLICATE_RELEASE_VERSION' }) });
  });

  it('always applies organizationId to list filters', async () => {
    await service.listReleases({ page: 1, limit: 20 }, user());
    expect(prisma.technicalRelease.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId }) }));
  });

  it('requires the privileged publish permission for release publication', async () => {
    prisma.technicalRelease.findFirst.mockResolvedValue({ ...release, status: TechnicalReleaseStatus.PLANNED });
    await expect(service.transitionRelease(release.id, { status: 'RELEASED' }, user(['technical-release:manage']))).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.technicalRelease.updateMany).not.toHaveBeenCalled();
  });

  it('uses revision in lifecycle updates and records the transition', async () => {
    prisma.technicalRelease.findFirst
      .mockResolvedValueOnce({ ...release, status: TechnicalReleaseStatus.PLANNED })
      .mockResolvedValueOnce({ ...release, status: TechnicalReleaseStatus.RELEASED, revision: 2 });
    await service.transitionRelease(release.id, { status: 'RELEASED', revision: 1 }, user(['technical-release:publish']));
    expect(prisma.technicalRelease.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: release.id, organizationId, revision: 1 } }));
    expect(audit.recordTenantEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'technical-release.released' }));
  });

  it('creates a tenant-scoped knowledge draft and publishes only through lifecycle policy', async () => {
    const article = { id: 'kb', organizationId, title: 'KB', slug: 'kb', content: 'body', status: KnowledgeBaseStatus.DRAFT, archivedAt: null };
    prisma.knowledgeBaseArticle.create.mockResolvedValue(article);
    await service.createKnowledge({ title: 'KB', slug: 'KB', content: 'body' }, user());
    expect(prisma.knowledgeBaseArticle.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId, slug: 'kb' }) }));

    prisma.knowledgeBaseArticle.findFirst.mockResolvedValue(article);
    await expect(service.transitionKnowledge('kb', { status: 'PUBLISHED' }, user(['technical-knowledge:publish'])))
      .rejects.toMatchObject({ response: expect.objectContaining({ code: 'INVALID_LIFECYCLE_TRANSITION' }) });

    prisma.knowledgeBaseArticle.findFirst.mockResolvedValue({ ...article, status: KnowledgeBaseStatus.IN_REVIEW });
    prisma.knowledgeBaseArticle.update.mockResolvedValue({ ...article, status: KnowledgeBaseStatus.PUBLISHED });
    await service.transitionKnowledge('kb', { status: 'PUBLISHED' }, user(['technical-knowledge:publish']));
    expect(audit.recordTenantEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'technical-knowledge.published' }));
  });

  it('applies tenant isolation to knowledge lookup', async () => {
    prisma.knowledgeBaseArticle.findFirst.mockResolvedValue(null);
    await expect(service.getKnowledge('foreign', user())).rejects.toThrow('Knowledge article not found');
    expect(prisma.knowledgeBaseArticle.findFirst).toHaveBeenCalledWith({ where: { id: 'foreign', organizationId } });
  });

  it('validates document owner membership and enforces approval lifecycle', async () => {
    const document = { id: 'doc', organizationId, title: 'Doc', documentType: 'ARCHITECTURE', ownerId: user().userId, status: TechnicalDocumentStatus.DRAFT, revision: 1, archivedAt: null, effectiveFrom: null, versions: [] };
    prisma.technicalDocument.create.mockResolvedValue(document);
    await service.createDocument({ title: 'Doc', documentType: 'ARCHITECTURE', ownerId: user().userId }, user());
    expect(prisma.organizationMembership.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId, userId: user().userId }) }));

    prisma.technicalDocument.findFirst.mockResolvedValue({ ...document, status: TechnicalDocumentStatus.IN_REVIEW });
    await expect(service.transitionDocument('doc', { status: 'APPROVED' }, user(['technical-document:manage']))).rejects.toBeInstanceOf(ForbiddenException);
    prisma.technicalDocument.findFirst
      .mockResolvedValueOnce({ ...document, status: TechnicalDocumentStatus.IN_REVIEW })
      .mockResolvedValueOnce({ ...document, status: TechnicalDocumentStatus.APPROVED, revision: 2 });
    await service.transitionDocument('doc', { status: 'APPROVED' }, user(['technical-document:approve']));
    expect(audit.recordTenantEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'technical-document.approved' }));
  });

  it('rejects cross-tenant document relations', async () => {
    prisma.company.findFirst.mockResolvedValueOnce(null);
    await expect(service.createDocument({ title: 'Doc', documentType: 'SECURITY', ownerId: user().userId, companyId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }, user())).rejects.toThrow('company not found');
    expect(prisma.technicalDocument.create).not.toHaveBeenCalled();
  });

  it('creates and filters resources inside the tenant and validates release linkage', async () => {
    const resource = { id: 'resource', organizationId, title: 'SDK', resourceType: 'SDK', status: TechnicalResourceStatus.DRAFT, archivedAt: null };
    prisma.technicalResource.create.mockResolvedValue(resource);
    await service.createResource({ title: 'SDK', resourceType: 'SDK', productId }, user());
    expect(prisma.technicalResource.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId, productId }) }));
    await service.listResources({ page: 1, limit: 20, type: 'SDK', status: 'DRAFT' }, user());
    expect(prisma.technicalResource.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId, resourceType: 'SDK', status: 'DRAFT' }) }));
  });

  it('creates a tender, protects submit permission, and rejects invalid lifecycle jumps', async () => {
    const tender = { id: 'tender', organizationId, title: 'RFP', tenderType: 'RFP', ownerId: user().userId, status: TenderStatus.DRAFT, revision: 1, archivedAt: null, requirements: [], deliverables: [] };
    prisma.tender.create.mockResolvedValue(tender);
    await service.createTender({ title: 'RFP', tenderType: 'RFP', ownerId: user().userId }, user());
    expect(prisma.tender.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId, ownerId: user().userId }) }));

    prisma.tender.findFirst.mockResolvedValue(tender);
    await expect(service.transitionTender('tender', { status: 'SUBMITTED' }, user(['technical-tender:submit'])))
      .rejects.toMatchObject({ response: expect.objectContaining({ code: 'INVALID_LIFECYCLE_TRANSITION' }) });
    prisma.tender.findFirst.mockResolvedValue({ ...tender, status: TenderStatus.READY_FOR_SUBMISSION });
    await expect(service.transitionTender('tender', { status: 'SUBMITTED' }, user(['technical-tender:manage']))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('applies tender list filters and tenant ownership', async () => {
    await service.listTenders({ page: 1, limit: 20, companyId: 'company', status: 'DRAFT', type: 'RFP' }, user());
    expect(prisma.tender.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId, companyId: 'company', status: 'DRAFT', tenderType: 'RFP' }) }));
  });

  it('supports tenant-scoped requirement create, update, list and delete', async () => {
    const tender = { id: 'tender', organizationId, status: TenderStatus.PREPARING, requirements: [], deliverables: [] };
    const requirement = { id: 'requirement', organizationId, tenderId: 'tender', title: 'Compliance', status: 'OPEN' };
    prisma.tender.findFirst.mockResolvedValue(tender);
    prisma.tenderRequirement.create.mockResolvedValue(requirement);
    prisma.tenderRequirement.findMany.mockResolvedValue([requirement]);
    prisma.tenderRequirement.findFirst.mockResolvedValue(requirement);
    prisma.tenderRequirement.update.mockResolvedValue({ ...requirement, status: 'READY' });
    await service.addRequirement('tender', { title: 'Compliance' }, user());
    await expect(service.listRequirements('tender', user())).resolves.toEqual([requirement]);
    await service.updateRequirement('tender', 'requirement', { status: 'READY' }, user());
    await service.removeRequirement('tender', 'requirement', user());
    expect(prisma.tenderRequirement.delete).toHaveBeenCalledWith({ where: { id: 'requirement' } });
    expect(audit.recordTenantEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'technical-tender.requirement-status-changed' }));
  });

  it('does not expose large article bodies in audit snapshots', async () => {
    const article = { id: 'kb', organizationId, title: 'KB', slug: 'kb', content: 'sensitive long body', status: KnowledgeBaseStatus.IN_REVIEW, archivedAt: null };
    prisma.knowledgeBaseArticle.findFirst.mockResolvedValue(article);
    prisma.knowledgeBaseArticle.update.mockResolvedValue({ ...article, status: KnowledgeBaseStatus.PUBLISHED });
    await service.transitionKnowledge('kb', { status: 'PUBLISHED' }, user(['technical-knowledge:publish']));
    const call = audit.recordTenantEvent.mock.calls.at(-1)[0];
    expect(call.before).not.toHaveProperty('content');
    expect(call.after).not.toHaveProperty('content');
  });
});
