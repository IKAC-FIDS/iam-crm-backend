import { BadRequestException } from '@nestjs/common';
import { Priority, TaskAssignmentScope, TaskStatus, UserRole } from '@prisma/client';
import { TasksService } from '../src/tasks/tasks.service';
import { tenantUser } from './helpers/tenant-user';

const organizationId = '00000000-0000-4000-8000-000000000001';
const user = tenantUser({
  userId: 'user-1',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
  organizationId,
});

function createPrismaService() {
  return {
    task: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    company: {
      findFirst: jest.fn(),
    },
    opportunity: {
      findFirst: jest.fn(),
    },
    person: {
      findFirst: jest.fn(),
    },
    opportunityCommercialDocument: {
      findFirst: jest.fn(),
    },
    opportunityPayment: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn().mockResolvedValue({
        id: user.userId,
        isActive: true,
        role: UserRole.ADMIN,
      }),
    },
    team: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    meeting: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    activity: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    productCatalogItem: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  };
}

function createService(prisma: ReturnType<typeof createPrismaService>) {
  return new TasksService(
    prisma as any,
    { record: jest.fn() } as any,
    { notifyUser: jest.fn() } as any,
  );
}

function task(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    organizationId,
    title: 'Follow up',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    companyId: null,
    personId: null,
    opportunityId: null,
    commercialDocumentId: null,
    paymentId: null,
    meetingId: null,
    activityId: null,
    productId: null,
    parentTaskId: null,
    assignmentScope: TaskAssignmentScope.SELF,
    teamId: null,
    assignedToId: user.userId,
    createdById: user.userId,
    dueAt: null,
    reminderAt: null,
    company: null,
    person: null,
    opportunity: null,
    commercialDocument: null,
    payment: null,
    ...overrides,
  };
}

describe('TasksService relation resolution', () => {
  it('derives companyId from opportunityId during task creation', async () => {
    const prisma = createPrismaService();
    prisma.opportunity.findFirst.mockResolvedValue({
      id: 'opportunity-1',
      companyId: 'company-1',
      archivedAt: null,
    });
    prisma.task.create.mockResolvedValue(task({
      companyId: 'company-1',
      opportunityId: 'opportunity-1',
    }));
    const service = createService(prisma);

    await service.create(
      {
        title: 'Follow up',
        opportunityId: 'opportunity-1',
      },
      user,
    );

    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          opportunityId: 'opportunity-1',
        }),
      }),
    );
  });

  it('rejects a task company that conflicts with the selected opportunity company', async () => {
    const prisma = createPrismaService();
    prisma.opportunity.findFirst.mockResolvedValue({
      id: 'opportunity-1',
      companyId: 'company-1',
      archivedAt: null,
    });
    const service = createService(prisma);

    await expect(
      service.create(
        {
          title: 'Follow up',
          companyId: 'company-2',
          opportunityId: 'opportunity-1',
        },
        user,
      ),
    ).rejects.toThrow(
      new BadRequestException('Task company must match the selected opportunity company.'),
    );
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it('rejects a person from a different company than the opportunity company', async () => {
    const prisma = createPrismaService();
    prisma.opportunity.findFirst.mockResolvedValue({
      id: 'opportunity-1',
      companyId: 'company-1',
      archivedAt: null,
    });
    prisma.person.findFirst.mockResolvedValue({
      id: 'person-1',
      companyId: 'company-2',
    });
    const service = createService(prisma);

    await expect(
      service.create(
        {
          title: 'Follow up',
          opportunityId: 'opportunity-1',
          personId: 'person-1',
        },
        user,
      ),
    ).rejects.toThrow(
      new BadRequestException('Selected person does not belong to the task company.'),
    );
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it('updates companyId from the new opportunity during task update', async () => {
    const prisma = createPrismaService();
    prisma.task.findFirst.mockResolvedValue(task({
      id: 'task-1',
      companyId: 'company-1',
    }));
    prisma.opportunity.findFirst.mockResolvedValue({
      id: 'opportunity-2',
      companyId: 'company-2',
      archivedAt: null,
    });
    prisma.task.update.mockResolvedValue(task({
      id: 'task-1',
      companyId: 'company-2',
      opportunityId: 'opportunity-2',
    }));
    const service = createService(prisma);

    await service.update(
      'task-1',
      {
        opportunityId: 'opportunity-2',
      },
      user,
    );

    expect(prisma.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          company: { connect: { id: 'company-2' } },
          opportunity: { connect: { id: 'opportunity-2' } },
        }),
      }),
    );
  });
});

describe('TasksService work-management rules', () => {
  it('keeps SELF assignment consistent with the acting user', async () => {
    const prisma = createPrismaService();
    prisma.task.create.mockResolvedValue(task());
    const service = createService(prisma);

    await service.create({ title: 'Self task', assignmentScope: TaskAssignmentScope.SELF }, user);

    expect(prisma.task.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ assignmentScope: TaskAssignmentScope.SELF, assignedToId: user.userId }),
    }));
  });

  it('rejects a TEAM assignee who is not a member of the selected team', async () => {
    const prisma = createPrismaService();
    prisma.team.findFirst.mockResolvedValue({ id: '00000000-0000-4000-8000-000000000010' });
    prisma.user.findFirst.mockResolvedValue({ id: 'user-2', isActive: true, role: UserRole.MANAGER, teamId: 'other-team' });
    const service = createService(prisma);

    await expect(service.create({
      title: 'Team task', assignmentScope: TaskAssignmentScope.TEAM,
      teamId: '00000000-0000-4000-8000-000000000010', assignedToId: '00000000-0000-4000-8000-000000000020',
    }, user)).rejects.toMatchObject({ response: expect.objectContaining({ code: 'TASK_ASSIGNEE_TEAM_MISMATCH' }) });
  });

  it('rejects a linked meeting outside the organization', async () => {
    const prisma = createPrismaService();
    prisma.meeting.findFirst.mockResolvedValue(null);
    const service = createService(prisma);
    await expect(service.create({ title: 'Meeting task', meetingId: '00000000-0000-4000-8000-000000000030' }, user))
      .rejects.toThrow('Meeting not found');
  });

  it('reassigns the same task and records before/after audit metadata', async () => {
    const prisma = createPrismaService();
    const current = task({ assignedToId: user.userId });
    const updated = task({ assignedToId: 'user-2', assignmentScope: TaskAssignmentScope.ORGANIZATION });
    prisma.task.findFirst.mockResolvedValue(current);
    prisma.user.findFirst.mockResolvedValue({ id: 'user-2', isActive: true, role: UserRole.MANAGER, teamId: null });
    prisma.task.update.mockResolvedValue(updated);
    const audit = { record: jest.fn() };
    const notifications = { notifyUser: jest.fn() };
    const service = new TasksService(prisma as any, audit as any, notifications as any);

    await service.reassign('task-1', { assignmentScope: TaskAssignmentScope.ORGANIZATION, assigneeId: 'user-2', reason: 'Capacity' }, user);

    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'task.reassigned', before: expect.objectContaining({ assignedToId: user.userId }), after: expect.objectContaining({ assignedToId: 'user-2' }), metadata: { reason: 'Capacity' } }));
    expect(notifications.notifyUser).toHaveBeenCalled();
  });

  it('creates a linked child without changing the parent assignment', async () => {
    const prisma = createPrismaService();
    const parent = task({ opportunityId: 'opportunity-1' });
    const child = task({ id: 'task-2', parentTaskId: 'task-1', opportunityId: 'opportunity-1' });
    prisma.task.findFirst.mockResolvedValue(parent);
    prisma.task.create.mockResolvedValue(child);
    const service = createService(prisma);

    await service.createSubtask('task-1', { title: 'Child', inheritLinkedEntity: true }, user);

    expect(prisma.task.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ parentTaskId: 'task-1', opportunityId: 'opportunity-1' }) }));
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it('enforces the maximum hierarchy depth of three', async () => {
    const prisma = createPrismaService();
    prisma.task.findFirst
      .mockResolvedValueOnce(task({ id: 'task-3', parentTaskId: 'task-2' }))
      .mockResolvedValueOnce({ parentTaskId: 'task-1' })
      .mockResolvedValueOnce({ parentTaskId: null });
    const service = createService(prisma);
    await expect(service.createSubtask('task-3', { title: 'Too deep', inheritLinkedEntity: true }, user))
      .rejects.toMatchObject({ response: expect.objectContaining({ code: 'TASK_MAX_DEPTH_EXCEEDED' }) });
  });

  it('blocks parent completion while an incomplete subtask remains', async () => {
    const prisma = createPrismaService();
    prisma.task.findFirst.mockResolvedValue(task());
    prisma.task.count.mockResolvedValue(2);
    const service = createService(prisma);
    await expect(service.complete('task-1', {}, user))
      .rejects.toMatchObject({ response: expect.objectContaining({ code: 'TASK_INCOMPLETE_SUBTASKS', details: { incompleteSubtaskCount: 2 } }) });
  });

  it('allows parent completion after every subtask is resolved', async () => {
    const prisma = createPrismaService();
    prisma.task.findFirst.mockResolvedValue(task());
    prisma.task.count.mockResolvedValue(0);
    prisma.task.update.mockResolvedValue(task({ status: TaskStatus.DONE, completedAt: new Date() }));
    const service = createService(prisma);
    await expect(service.complete('task-1', { completionNote: 'Done' }, user)).resolves.toMatchObject({ status: TaskStatus.DONE });
  });
});
