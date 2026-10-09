import { TaskStatus, UserRole } from '@prisma/client';
import { OpportunitiesService } from '../src/opportunities/opportunities.service';
import { TasksService } from '../src/tasks/tasks.service';
import { tenantUser } from './helpers/tenant-user';
import { quotaMock } from './helpers/quota';
import { validate } from 'class-validator';
import { CreateStageDto } from '../src/admin/pipeline/dto/create-stage.dto';
import { UpdateStageConfigDto } from '../src/admin/pipeline/dto/update-stage-config.dto';

const organizationId = '00000000-0000-4000-8000-000000000001';
const user = tenantUser({
  userId: 'user-1',
  email: 'a@example.com',
  role: UserRole.ADMIN,
  organizationId,
});

describe('activeOnly opportunity filtering', () => {
  function setup() {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'Asia/Tehran' }),
      },
      pipelineStage: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      opportunity: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    return {
      prisma,
      service: new OpportunitiesService(
        prisma as any,
        {} as any,
        {} as any,
        quotaMock() as any,
        {} as any,
      ),
    };
  }
  it('requires a non-archived, non-terminal stage while retaining organization and owner filters', async () => {
    const { prisma, service } = setup();
    await service.findAll(
      { activeOnly: 'true', ownerId: '00000000-0000-4000-8000-000000000002' },
      user as any,
    );
    const where = prisma.opportunity.findMany.mock.calls[0][0].where;
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { organizationId },
        { ownerId: '00000000-0000-4000-8000-000000000002' },
        {
          archivedAt: null,
          company: { archivedAt: null },
          stage: { isTerminal: false },
        },
      ]),
    );
  });
  it('rejects activeOnly with archivedOnly', async () => {
    const { service } = setup();
    await expect(
      service.findAll(
        { activeOnly: 'true', archivedOnly: 'true' },
        user as any,
      ),
    ).rejects.toThrow('activeOnly=true cannot be combined');
  });
  it('preserves prior archive behavior when activeOnly is omitted', async () => {
    const { prisma, service } = setup();
    await service.findAll({}, user as any);
    expect(
      prisma.opportunity.findMany.mock.calls[0][0].where.AND,
    ).toContainEqual({ archivedAt: null });
  });
  it('uses the lightweight relation set for list results', async () => {
    const { prisma, service } = setup();

    await service.findAll({}, user as any);

    const include = prisma.opportunity.findMany.mock.calls[0][0].include;
    expect(include.company).toBeDefined();
    expect(include.stage).toBeDefined();
    expect(include.commercialDocuments).toBeUndefined();
    expect(include.payments).toBeUndefined();
  });
  it('returns the same three-opportunity active population used by report reconciliation fixtures', async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'Asia/Tehran' }),
      },
      opportunity: {
        findMany: jest.fn().mockResolvedValue(Array.from({ length: 3 }, (_, index) => ({
          id: `opportunity-${index}`,
          stageId: 'stage-1',
          createdAt: new Date('2026-10-01T00:00:00Z'),
          archivedAt: null,
          stage: { isTerminal: false, maxDurationDays: null },
          stageHistories: [],
        }))),
        count: jest.fn().mockResolvedValue(3),
      },
    };
    const service = new OpportunitiesService(
      prisma as any,
      {} as any,
      {} as any,
      quotaMock() as any,
      {} as any,
    );
    const result = await service.findAll(
      { activeOnly: 'true', page: 1, limit: 20 },
      user as any,
    );
    expect(result.meta.total).toBe(3);
    expect(result.data).toHaveLength(3);
    expect(prisma.opportunity.count.mock.calls[0][0].where).toEqual(
      prisma.opportunity.findMany.mock.calls[0][0].where,
    );
  });

  it('calculates total and current-stage calendar age from the latest stage entry', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T12:00:00Z'));
    const { prisma, service } = setup();
    prisma.opportunity.findMany.mockResolvedValue([{
      id: 'opportunity-1',
      stageId: 'stage-1',
      createdAt: new Date('2026-09-28T12:00:00Z'),
      archivedAt: null,
      stage: { isTerminal: false, maxDurationDays: 3 },
      stageHistories: [
        { toStageId: 'stage-1', changedAt: new Date('2026-10-04T12:00:00Z') },
        { toStageId: 'stage-1', changedAt: new Date('2026-09-29T12:00:00Z') },
      ],
    }]);

    const result = await service.findAll({}, user as any);

    expect(result.data[0]).toMatchObject({
      ageDays: 10,
      currentStageAgeDays: 4,
      maxDurationDays: 3,
      isStageOverdue: true,
      stageOverdueDays: 1,
    });
    jest.useRealTimers();
  });

  it('never flags terminal or archived opportunities as stage overdue', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T12:00:00Z'));
    const { prisma, service } = setup();
    prisma.opportunity.findMany.mockResolvedValue([
      {
        id: 'terminal-opportunity',
        stageId: 'stage-1',
        createdAt: new Date('2026-09-01T12:00:00Z'),
        archivedAt: null,
        stage: { isTerminal: true, maxDurationDays: 3 },
        stageHistories: [{ toStageId: 'stage-1', changedAt: new Date('2026-09-20T12:00:00Z') }],
      },
      {
        id: 'archived-opportunity',
        stageId: 'stage-1',
        createdAt: new Date('2026-09-01T12:00:00Z'),
        archivedAt: new Date('2026-10-01T12:00:00Z'),
        stage: { isTerminal: false, maxDurationDays: 3 },
        stageHistories: [{ toStageId: 'stage-1', changedAt: new Date('2026-09-20T12:00:00Z') }],
      },
    ]);

    const result = await service.findAll({}, user as any);

    expect(result.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'terminal-opportunity', isStageOverdue: false, stageOverdueDays: 0 }),
      expect.objectContaining({ id: 'archived-opportunity', isStageOverdue: false, stageOverdueDays: 0 }),
    ]));
    jest.useRealTimers();
  });

  it('applies stage-overdue filtering before pagination and total count', async () => {
    const { prisma, service } = setup();
    prisma.pipelineStage.findMany.mockResolvedValue([{ id: 'stage-1', maxDurationDays: 2 }]);

    await service.findAll({ stageOverdueOnly: 'true' }, user as any);

    const where = prisma.opportunity.findMany.mock.calls[0][0].where;
    expect(where.AND).toEqual(expect.arrayContaining([
      expect.objectContaining({
        OR: expect.arrayContaining([
          expect.objectContaining({ stageId: 'stage-1', archivedAt: null }),
        ]),
      }),
    ]));
    expect(prisma.opportunity.count).toHaveBeenCalledWith({ where });
  });
});

describe('pipeline stage duration validation', () => {
  it.each([0, -1])('rejects a non-positive create limit: %s', async (maxDurationDays) => {
    const dto = Object.assign(new CreateStageDto(), { code: 'QUALIFIED', label: 'واجد شرایط', maxDurationDays });
    expect(await validate(dto)).toEqual(expect.arrayContaining([
      expect.objectContaining({ property: 'maxDurationDays' }),
    ]));
  });

  it('accepts a positive limit and allows clearing it on update', async () => {
    const create = Object.assign(new CreateStageDto(), { code: 'QUALIFIED', label: 'واجد شرایط', maxDurationDays: 5 });
    const update = Object.assign(new UpdateStageConfigDto(), { maxDurationDays: null });
    expect(await validate(create)).toHaveLength(0);
    expect(await validate(update)).toHaveLength(0);
  });
});

describe('overdueOnly task filtering', () => {
  function setup(total = 0) {
    const prisma = {
      task: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(total),
      },
    };
    return {
      prisma,
      service: new TasksService(prisma as any, {} as any, {} as any, { publishDomainEvent: jest.fn() } as any, { assertCompanyReadable: jest.fn() } as any),
    };
  }
  it('uses a database predicate for open tasks and exact count pagination', async () => {
    const { prisma, service } = setup(37);
    const result = await service.findAll(
      {
        overdueOnly: 'true',
        limit: 1,
        assignedToId: '00000000-0000-4000-8000-000000000002',
      },
      user as any,
    );
    const where = prisma.task.findMany.mock.calls[0][0].where;
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { organizationId },
        { assignedToId: '00000000-0000-4000-8000-000000000002' },
        {
          dueAt: { not: null, lt: expect.any(Date) },
          status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        },
      ]),
    );
    expect(prisma.task.count).toHaveBeenCalledWith({ where });
    expect(result.meta.total).toBe(37);
  });
  it('combines overdueOnly with an open explicit status', async () => {
    const { prisma, service } = setup();
    await service.findAll(
      { overdueOnly: 'true', status: TaskStatus.TODO },
      user as any,
    );
    expect(prisma.task.findMany.mock.calls[0][0].where.AND).toEqual(
      expect.arrayContaining([
        { status: TaskStatus.TODO },
        { dueAt: { not: null, lt: expect.any(Date) } },
      ]),
    );
  });
  it('rejects terminal status with overdueOnly', async () => {
    const { service } = setup();
    await expect(
      service.findAll(
        { overdueOnly: 'true', status: TaskStatus.DONE },
        user as any,
      ),
    ).rejects.toThrow('overdueOnly=true is only compatible');
  });
});
