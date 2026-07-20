import { DashboardController } from "../src/dashboard/dashboard.controller";

describe("DashboardController commercial sections", () => {
  it("adds finance, catalog and channel snapshots without removing the existing summary", async () => {
    const advanced = {
      dashboard: jest
        .fn()
        .mockResolvedValue({ generatedAt: "now", current: { tasks: {} } }),
    };
    const commercial = {
      financial: jest
        .fn()
        .mockResolvedValue({
          current: {
            outstandingAmountIrr: "100",
            overdueAmountIrr: "20",
            overduePaymentCount: 1,
          },
          periodFlow: { collectedAmountIrr: "80" },
        }),
      products: jest.fn().mockResolvedValue({
        byChannel: [
          { salesChannel: "IN_PERSON", netValueIrr: "70" },
          { salesChannel: "LEGACY_UNKNOWN", netValueIrr: "10" },
        ],
      }),
      exchangeImpact: jest
        .fn()
        .mockResolvedValue({
          current: {
            usdProductCount: 2,
            irrProductCount: 3,
            currentRate: "2000000",
            currentValidFrom: "date",
            staleUsdProductCount: 1,
          },
        }),
    };
    const result = await new DashboardController(
      advanced as any,
      commercial as any,
    ).getSummary(
      { page: 1, limit: 20 },
      { userId: "u", email: "e", role: "ADMIN", organizationId: "org" },
    );
    expect(result.current).toEqual({ tasks: {} });
    expect(result.finance).toMatchObject({
      outstandingAmountIrr: "100",
      collectedInPeriodAmountIrr: "80",
    });
    expect(result.catalog).toMatchObject({
      activeProductCount: 5,
      staleUsdProductCount: 1,
    });
    expect(result.salesChannels).toEqual({
      wonInPersonAmountIrr: "70",
      wonDigikalaAmountIrr: "0",
      wonOtherAmountIrr: "0",
      wonLegacyUnknownAmountIrr: "10",
    });
  });
});
