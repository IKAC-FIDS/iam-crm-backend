import { ForbiddenException } from '@nestjs/common';
import { ConversationMessageReferenceType } from '@prisma/client';
import { ConversationReferenceOptionsService } from '../src/conversations/conversation-reference-options.service';

describe('ConversationReferenceOptionsService', () => {
  const companiesService = { findOptions: jest.fn() };
  const opportunitiesService = { findAll: jest.fn() };
  const tasksService = { findAll: jest.fn() };
  const meetingsService = { findAll: jest.fn() };

  const service = new ConversationReferenceOptionsService(
    companiesService as any,
    opportunitiesService as any,
    tasksService as any,
    meetingsService as any,
  );

  const user = {
    id: 'user-1',
    organizationId: 'org-1',
    tenantContext: {
      permissions: [
        'company:view',
        'opportunity:view',
        'task:view',
        'meeting:view',
      ],
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the company domain option query and returns labels only', async () => {
    companiesService.findOptions.mockResolvedValue({
      data: [{ id: 'company-1', brandName: 'برند', legalName: 'شرکت' }],
    });

    await expect(
      service.find(
        { type: ConversationMessageReferenceType.COMPANY, search: 'بر' },
        user,
      ),
    ).resolves.toEqual({ data: [{ id: 'company-1', label: 'برند' }] });
    expect(companiesService.findOptions).toHaveBeenCalledWith(user, {
      search: 'بر',
      page: 1,
      limit: 20,
    });
  });

  it.each([
    [
      ConversationMessageReferenceType.OPPORTUNITY,
      opportunitiesService,
      { data: [{ id: 'opportunity-1', title: 'فرصت' }] },
      { search: 'ف', page: 1, limit: 20, activeOnly: 'true' },
      'opportunity-1',
      'فرصت',
    ],
    [
      ConversationMessageReferenceType.TASK,
      tasksService,
      { data: [{ id: 'task-1', title: 'وظیفه' }] },
      { search: 'ف', page: 1, limit: 20 },
      'task-1',
      'وظیفه',
    ],
    [
      ConversationMessageReferenceType.MEETING,
      meetingsService,
      { data: [{ id: 'meeting-1', title: 'جلسه' }] },
      { search: 'ف', page: 1, limit: 20 },
      'meeting-1',
      'جلسه',
    ],
  ])(
    'uses the %s domain-scoped list query',
    async (type, domainService, result, query, id, label) => {
      domainService.findAll.mockResolvedValue(result);

      await expect(
        service.find({ type, search: 'ف' }, user),
      ).resolves.toEqual({ data: [{ id, label }] });
      expect(domainService.findAll).toHaveBeenCalledWith(query, user);
    },
  );

  it('rejects a reference type when its domain view permission is missing', async () => {
    await expect(
      service.find(
        { type: ConversationMessageReferenceType.TASK, search: '' },
        { ...user, tenantContext: { permissions: [] } },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(tasksService.findAll).not.toHaveBeenCalled();
  });
});
