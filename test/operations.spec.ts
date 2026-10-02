import { ForbiddenException } from "@nestjs/common";
import { Priority, UserRole } from "@prisma/client";
import {
  PERMISSIONS_KEY,
  PermissionPolicyMetadata,
} from "../src/common/decorators/permissions.decorator";
import { OwnershipScope } from "../src/common/dto/ownership-scope.dto";
import { OperationsAttentionState } from "../src/operations/dto/operations-companies-query.dto";
import { classifyOperationsAttention } from "../src/operations/operations-attention";
import { OperationsController } from "../src/operations/operations.controller";
import { OperationsService } from "../src/operations/operations.service";
import { tenantUser } from "./helpers/tenant-user";

const organizationId = "00000000-0000-4000-8000-000000000001";
const user = tenantUser({
  userId: "00000000-0000-4000-8000-000000000002",
  email: "rep@example.com",
  role: UserRole.REP,
  organizationId,
  teamId: "team-1",
});
(user as any).tenantContext.permissions = [
  "company:view",
  "task:view",
  "meeting:view",
  "opportunity:view",
  "activity:view",
];

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    organization: {
      findUnique: jest.fn().mockResolvedValue({ timezone: "Asia/Tehran" }),
    },
    company: {
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        {
          id: "company-1",
          legalName: "شرکت نمونه",
          brandName: null,
          logoObjectKey: null,
          priority: Priority.HIGH,
          activityStatus: "ACTIVE",
          owner: {
            id: user.userId,
            fullName: "کارشناس فروش",
            avatarObjectKey: null,
          },
        },
      ]),
    },
    opportunity: {
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    task: { findMany: jest.fn().mockResolvedValue([]) },
    meeting: { findMany: jest.fn().mockResolvedValue([]) },
    activity: { findMany: jest.fn().mockResolvedValue([]) },
    personalTodo: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    conversationThread: { findMany: jest.fn().mockResolvedValue([]) },
    $queryRaw: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function serviceFor(tx: ReturnType<typeof transaction>) {
  const prisma = {
    withTenantTransaction: jest.fn((_tenant, callback) => callback(tx)),
    user: {
      findFirst: jest.fn().mockResolvedValue({
        id: "00000000-0000-4000-8000-000000000099",
      }),
    },
  };
  return { service: new OperationsService(prisma as any), prisma };
}

describe("Operations workspace", () => {
  it("classifies overdue before every other attention state", () => {
    expect(
      classifyOperationsAttention({
        overdueTasks: 1,
        dueTodayTasks: 1,
        hasFutureTask: true,
        hasFutureMeeting: true,
        activeOpportunities: 2,
      }).state,
    ).toBe(OperationsAttentionState.OVERDUE);
  });

  it("classifies a due-today company after overdue", () => {
    expect(
      classifyOperationsAttention({
        overdueTasks: 0,
        dueTodayTasks: 1,
        hasFutureTask: true,
        hasFutureMeeting: false,
        activeOpportunities: 1,
      }).state,
    ).toBe(OperationsAttentionState.TODAY);
  });

  it("classifies an active account without a future action", () => {
    expect(
      classifyOperationsAttention({
        overdueTasks: 0,
        dueTodayTasks: 0,
        hasFutureTask: false,
        hasFutureMeeting: false,
        activeOpportunities: 1,
      }).state,
    ).toBe(OperationsAttentionState.NO_NEXT_ACTION);
  });

  it("classifies a company with a future action as upcoming", () => {
    expect(
      classifyOperationsAttention({
        overdueTasks: 0,
        dueTodayTasks: 0,
        hasFutureTask: true,
        hasFutureMeeting: false,
        activeOpportunities: 0,
      }).state,
    ).toBe(OperationsAttentionState.UPCOMING);
  });

  it("returns an owned company and defaults to current-user ownership", async () => {
    const tx = transaction();
    const { service } = serviceFor(tx);
    const result = await service.getCompanies({} as any, user);

    expect(result.data[0].company.id).toBe("company-1");
    expect(tx.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([{ ownerId: user.userId }]),
        }),
      }),
    );
  });

  it("excludes archived companies and enforces tenant isolation", async () => {
    const tx = transaction();
    const { service, prisma } = serviceFor(tx);
    await service.getCompanies({} as any, user);

    const where = tx.company.findMany.mock.calls[0][0].where;
    expect(where.AND).toContainEqual({ organizationId, archivedAt: null });
    expect(prisma.withTenantTransaction).toHaveBeenCalledWith(
      (user as any).tenantContext,
      expect.any(Function),
    );
  });

  it("counts and returns multiple active opportunities without financial values", async () => {
    const tx = transaction();
    tx.opportunity.groupBy.mockResolvedValue([
      { companyId: "company-1", _count: { id: 2 } },
    ]);
    tx.opportunity.findMany.mockResolvedValue([
      {
        id: "opp-1",
        companyId: "company-1",
        title: "فرصت اول",
        priority: Priority.HIGH,
        expectedCloseDate: null,
        stage: { id: "stage-1", label: "مذاکره", terminalType: null },
      },
      {
        id: "opp-2",
        companyId: "company-1",
        title: "فرصت دوم",
        priority: Priority.MEDIUM,
        expectedCloseDate: null,
        stage: { id: "stage-1", label: "مذاکره", terminalType: null },
      },
    ]);
    const { service } = serviceFor(tx);
    const result = await service.getCompanies({} as any, user);

    expect(result.data[0].activeOpportunities.count).toBe(2);
    expect(result.data[0].activeOpportunities.preview).toEqual([]);
    expect(result.data[0].activeOpportunities.hasMore).toBe(true);
  });

  it("uses the canonical non-terminal opportunity predicate", async () => {
    const tx = transaction();
    const { service } = serviceFor(tx);
    await service.getCompanies({} as any, user);

    const where = tx.opportunity.groupBy.mock.calls[0][0].where;
    expect(where.AND[0]).toMatchObject({
      archivedAt: null,
      company: { archivedAt: null },
      stage: { isTerminal: false },
    });
  });

  it("maps the nearest dated open task as the next task", async () => {
    const tx = transaction();
    const later = new Date("2099-02-01T00:00:00.000Z");
    const sooner = new Date("2099-01-01T00:00:00.000Z");
    tx.task.findMany.mockResolvedValue([
      {
        id: "task-later",
        companyId: "company-1",
        title: "بعدی",
        dueAt: later,
        priority: Priority.MEDIUM,
        opportunityId: null,
      },
      {
        id: "task-sooner",
        companyId: "company-1",
        title: "نزدیک",
        dueAt: sooner,
        priority: Priority.HIGH,
        opportunityId: null,
      },
    ]);
    const { service } = serviceFor(tx);
    const result = await service.getCompanies({} as any, user);
    expect(result.data[0].tasks.next?.id).toBe("task-sooner");
  });

  it("maps the latest meaningful activity", async () => {
    const tx = transaction();
    tx.activity.findMany.mockResolvedValue([
      {
        id: "activity-1",
        companyId: "company-1",
        type: "CALL",
        occurredAt: new Date("2026-09-01T00:00:00.000Z"),
      },
    ]);
    const { service } = serviceFor(tx);
    const result = await service.getCompanies({} as any, user);
    expect(result.data[0].lastActivity).toMatchObject({
      id: "activity-1",
      type: "CALL",
    });
    expect(tx.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: { not: "STAGE_CHANGE" } }),
      }),
    );
  });

  it("maps user-scoped unread counts without per-company queries", async () => {
    const tx = transaction();
    tx.$queryRaw.mockResolvedValue([
      { companyId: "company-1", unreadCount: 4 },
    ]);
    const { service } = serviceFor(tx);
    const result = await service.getCompanies({} as any, user);
    expect(result.data[0].conversation.unreadCount).toBe(4);
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns standard pagination metadata", async () => {
    const tx = transaction();
    tx.company.count.mockResolvedValue(45);
    const { service } = serviceFor(tx);
    const result = await service.getCompanies(
      { page: 2, limit: 20, ownershipScope: OwnershipScope.ALL } as any,
      user,
    );
    expect(result.meta).toEqual({
      total: 45,
      page: 2,
      limit: 20,
      totalPages: 3,
      hasNext: true,
      hasPrevious: true,
    });
    expect(tx.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
  });

  it("requires existing domain permissions on the companies endpoint", () => {
    const policy = Reflect.getMetadata(
      PERMISSIONS_KEY,
      OperationsController.prototype.getCompanies,
    ) as PermissionPolicyMetadata;
    expect(policy.mode).toBe("all");
    expect(policy.actions).toEqual(["company:view"]);
  });

  it("keeps the companies workspace available with partial permissions", async () => {
    const partial = tenantUser({ ...user, tenantContext: undefined } as any);
    (partial as any).tenantContext.permissions = ["company:view", "task:view", "opportunity:view"];
    const tx = transaction();
    const { service } = serviceFor(tx);
    const result = await service.getCompanies({} as any, partial);
    expect(result.data).toHaveLength(1);
    expect(tx.meeting.findMany).not.toHaveBeenCalled();
    expect(tx.activity.findMany).not.toHaveBeenCalled();
  });

  it("lets an admin inspect another active user without leaving the tenant", async () => {
    const admin = tenantUser({
      ...user,
      userId: "00000000-0000-4000-8000-000000000003",
      role: UserRole.ADMIN,
    } as any);
    (admin as any).tenantContext.permissions = (user as any).tenantContext.permissions;
    const targetUserId = "00000000-0000-4000-8000-000000000099";
    const tx = transaction();
    const { service, prisma } = serviceFor(tx);

    await service.getCompanies({ userId: targetUserId } as any, admin);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: targetUserId, organizationId, isActive: true },
      select: { id: true },
    });
    expect(tx.company.findMany.mock.calls[0][0].where.AND).toContainEqual({
      ownerId: targetUserId,
    });
  });

  it("rejects another-user operations access for non-admin users", async () => {
    const tx = transaction();
    const { service } = serviceFor(tx);
    await expect(
      service.getCompanies(
        { userId: "00000000-0000-4000-8000-000000000099" } as any,
        user,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("builds an explicit active-opportunity filter for no-next-action queries", async () => {
    const tx = transaction();
    const { service } = serviceFor(tx);
    await service.getCompanies(
      { attentionState: OperationsAttentionState.NO_NEXT_ACTION } as any,
      user,
    );
    expect(tx.company.findMany.mock.calls[0][0].where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ opportunities: expect.any(Object) }),
          ]),
        }),
      ]),
    );
  });
});
