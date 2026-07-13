import { BadRequestException } from '@nestjs/common';
import { Priority, TaskStatus, UserRole } from '@prisma/client';
import { TasksService } from '../src/tasks/tasks.service';

const organizationId = '00000000-0000-4000-8000-000000000001';
const user = {
  userId: 'user-1',
  email: 'admin@example.com',
  role: UserRole.ADMIN,
  organizationId,
};

function createPrismaService() {
  return {
    task: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
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
      findUnique: jest.fn().mockResolvedValue({
        id: user.userId,
        isActive: true,
        role: UserRole.ADMIN,
      }),
    },
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
    title: 'Follow up',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    companyId: null,
    personId: null,
    opportunityId: null,
    commercialDocumentId: null,
    paymentId: null,
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
