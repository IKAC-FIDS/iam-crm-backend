"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkScheduleResolverService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let WorkScheduleResolverService = class WorkScheduleResolverService {
    async resolve(db, input) {
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
            throw new common_1.BadRequestException({
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
                            { scope: client_1.WorkScheduleScope.USER, membershipId: input.membershipId },
                            ...(team
                                ? [{ scope: client_1.WorkScheduleScope.TEAM, teamId: team.id }]
                                : []),
                            { scope: client_1.WorkScheduleScope.ORGANIZATION },
                        ],
                    },
                ],
            },
            include: { days: true },
            orderBy: [{ scope: "desc" }, { effectiveFrom: "desc" }],
        });
        const timezone = schedule?.timezoneOverride ?? settings?.timezone ?? "Asia/Tehran";
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
    date(value) {
        const date = new Date(`${value}T00:00:00.000Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== value)
            throw new common_1.BadRequestException({
                code: "INVALID_DATE",
                message: "Date must be valid Gregorian YYYY-MM-DD",
            });
        return date;
    }
};
exports.WorkScheduleResolverService = WorkScheduleResolverService;
exports.WorkScheduleResolverService = WorkScheduleResolverService = __decorate([
    (0, common_1.Injectable)()
], WorkScheduleResolverService);
//# sourceMappingURL=work-schedule-resolver.service.js.map