import { Prisma, UserRole } from "@prisma/client";
import { organizationDayBounds } from "../src/common/dates/timezone-boundary.util";
import { AdvancedReportsService } from "../src/reports/advanced-reports.service";

const organizationId = "00000000-0000-4000-8000-000000000001";
const user = {
  userId: "user-1",
  email: "admin@example.com",
  role: UserRole.ADMIN,
  organizationId,
};

describe("AdvancedReportsService", () => {
  it("uses the organization timezone for calendar-day boundaries", () => {
    const result = organizationDayBounds(
      new Date("2026-07-20T12:00:00.000Z"),
      "Asia/Tehran",
    );

    expect(result.start.toISOString()).toBe("2026-07-19T20:30:00.000Z");
    expect(result.end.toISOString()).toBe("2026-07-20T20:30:00.000Z");
  });

  it("handles daylight-saving calendar days without assuming 24 hours", () => {
    const result = organizationDayBounds(
      new Date("2026-03-08T17:00:00.000Z"),
      "America/New_York",
    );

    expect(result.start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(result.end.toISOString()).toBe("2026-03-09T04:00:00.000Z");
  });

  it("keeps forecast values decimal-safe and applies active organization scope", async () => {
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ timezone: "UTC" }),
      },
      opportunity: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "opp-1",
            estimatedValue: new Prisma.Decimal("9007199254740993.25"),
            probability: 25,
            expectedCloseDate: new Date("2026-08-01T00:00:00.000Z"),
            stageId: "stage-1",
            stage: { code: "OPEN", label: "Open", sortOrder: 1 },
            ownerId: null,
            owner: null,
          },
        ]),
      },
    };
    const service = new AdvancedReportsService(prisma as any);

    const result = await service.forecast(
      { startDate: "2026-07-01", endDate: "2026-08-31", page: 1, limit: 20 },
      user as any,
    );

    expect(result.summary.estimatedValueIrr).toBe("9007199254740993.25");
    expect(result.summary.weightedValueIrr).toBe("2251799813685248.3125");
    expect(
      prisma.opportunity.findMany.mock.calls[0][0].where.AND,
    ).toContainEqual({
      organizationId,
      archivedAt: null,
      company: { archivedAt: null },
      stage: { isTerminal: false, terminalType: null },
    });
  });
});
