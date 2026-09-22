import { BadRequestException, Injectable } from "@nestjs/common";
import { WorkScheduleScope } from "@prisma/client";
import { TenantTransactionClient } from "../prisma/prisma.service";

export type ResolvedWorkSchedule = {
  scheduleId: string | null;
  scope: WorkScheduleScope | null;
  timezone: string;
  workDate: string;
  isWorkingDay: boolean;
  expectedRegularMinutes: number;
  team: { id: string; code: string; name: string } | null;
};

@Injectable()
export class WorkScheduleResolverService {
  async resolve(
    db: TenantTransactionClient,
    input: {
      organizationId: string;
      membershipId: string;
      workDate: string;
      historicalTeam?: {
        id: string | null;
        code: string | null;
        name: string | null;
      };
    },
  ): Promise<ResolvedWorkSchedule> {
    const date = this.date(input.workDate);
    const [settings, membership] = await Promise.all([
      db.organizationSettings.findUnique({
        where: { organizationId: input.organizationId },
        select: { timezone: true, firstDayOfWeek: true },
      }),
      db.organizationMembership.findFirst({
        where: { id: input.membershipId, organizationId: input.organizationId },
        select: { team: { select: { id: true, code: true, name: true } } },
      }),
    ]);
    if (!membership)
      throw new BadRequestException({
        code: "MEMBERSHIP_NOT_FOUND",
        message: "Active organization membership was not found",
      });
    const team = input.historicalTeam
      ? input.historicalTeam.id
        ? {
            id: input.historicalTeam.id,
            code: input.historicalTeam.code ?? "",
            name: input.historicalTeam.name ?? "",
          }
        : null
      : membership.team;
    const schedule = await db.workSchedule.findFirst({
      where: {
        organizationId: input.organizationId,
        effectiveFrom: { lte: date },
        AND: [
          { OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }] },
          {
            OR: [
              { scope: WorkScheduleScope.USER, membershipId: input.membershipId },
              ...(team
                ? [{ scope: WorkScheduleScope.TEAM, teamId: team.id }]
                : []),
              { scope: WorkScheduleScope.ORGANIZATION },
            ],
          },
        ],
      },
      include: { days: true },
      orderBy: [{ scope: "desc" }, { effectiveFrom: "desc" }],
    });
    const timezone =
      schedule?.timezoneOverride ?? settings?.timezone ?? "Asia/Tehran";
    if (!schedule)
      return {
        scheduleId: null,
        scope: null,
        timezone,
        workDate: input.workDate,
        isWorkingDay: false,
        expectedRegularMinutes: 0,
        team,
      };
    const day = schedule.days.find((item) => item.weekday === date.getUTCDay());
    return {
      scheduleId: schedule.id,
      scope: schedule.scope,
      timezone,
      workDate: input.workDate,
      isWorkingDay: Boolean(day && day.regularMinutes > 0),
      expectedRegularMinutes: day?.regularMinutes ?? 0,
      team,
    };
  }
  private date(value: string) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    )
      throw new BadRequestException({
        code: "INVALID_DATE",
        message: "Date must be valid Gregorian YYYY-MM-DD",
      });
    return date;
  }
}
