"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeriodComparisonService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const api_date_util_1 = require("../common/dates/api-date.util");
const timezone_boundary_util_1 = require("../common/dates/timezone-boundary.util");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const period_comparison_dto_1 = require("./dto/period-comparison.dto");
const reporting_scope_service_1 = require("./reporting-scope.service");
let PeriodComparisonService = class PeriodComparisonService {
    constructor(prisma, scopes) {
        this.prisma = prisma;
        this.scopes = scopes;
    }
    async compare(f, user) {
        const timezone = (await this.prisma.organization.findUnique({
            where: { id: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            select: { timezone: true },
        }))?.timezone ?? "UTC", ranges = this.resolve(f, timezone), scope = this.scopes.opportunity(f, user);
        const [opportunities, activities, meetings, tasks, payments, lines] = await Promise.all([
            this.prisma.opportunity.findMany({
                where: scope,
                select: {
                    id: true,
                    createdAt: true,
                    wonAt: true,
                    lostAt: true,
                    estimatedValue: true,
                },
            }),
            this.prisma.activity.findMany({
                where: {
                    company: { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
                    ...(f.companyIds?.length && { companyId: { in: f.companyIds } }),
                },
                select: { id: true, occurredAt: true, companyId: true },
            }),
            this.prisma.meeting.findMany({
                where: {
                    organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                    ...(f.companyIds?.length && { companyId: { in: f.companyIds } }),
                },
                select: { id: true, startAt: true, endAt: true, status: true },
            }),
            this.prisma.task.findMany({
                where: {
                    organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                    ...(f.companyIds?.length && { companyId: { in: f.companyIds } }),
                },
                select: {
                    id: true,
                    createdAt: true,
                    completedAt: true,
                    dueAt: true,
                    status: true,
                },
            }),
            this.prisma.opportunityPayment.findMany({
                where: { currency: "IRR", opportunity: scope },
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    createdAt: true,
                    paidAt: true,
                },
            }),
            this.prisma.opportunityLineItem.findMany({
                where: { opportunity: scope },
                select: {
                    id: true,
                    opportunityId: true,
                    quantity: true,
                    lineTotal: true,
                    salesChannel: true,
                    opportunity: { select: { wonAt: true } },
                },
            }),
        ]);
        const raw = { opportunities, activities, meetings, tasks, payments, lines }, current = this.values(raw, ranges.current), comparison = this.values(raw, ranges.comparison);
        return {
            currentPeriod: this.out(ranges.current),
            comparisonPeriod: { ...this.out(ranges.comparison), mode: ranges.mode },
            groups: this.groups(current, comparison),
        };
    }
    values(r, p) {
        const inside = (d) => Boolean(d && d >= p.start && d < p.end), created = r.opportunities.filter((o) => inside(o.createdAt)), won = r.opportunities.filter((o) => inside(o.wonAt)), lost = r.opportunities.filter((o) => inside(o.lostAt)), acts = r.activities.filter((a) => inside(a.occurredAt)), meetings = r.meetings.filter((m) => inside(m.startAt)), completedMeetings = meetings.filter((m) => m.status === client_1.MeetingStatus.COMPLETED), executionDenom = meetings.filter((m) => m.status === client_1.MeetingStatus.COMPLETED ||
            m.status === client_1.MeetingStatus.CANCELLED ||
            (m.status === client_1.MeetingStatus.SCHEDULED && m.endAt < new Date())), taskCreated = r.tasks.filter((t) => inside(t.createdAt)), taskCompleted = r.tasks.filter((t) => inside(t.completedAt)), withDue = taskCompleted.filter((t) => t.dueAt), onTime = withDue.filter((t) => t.completedAt <= t.dueAt), paid = r.payments.filter((x) => x.status === client_1.PaymentStatus.PAID && inside(x.paidAt)), receivables = r.payments.filter((x) => inside(x.createdAt)), lines = r.lines.filter((x) => inside(x.opportunity.wonAt));
        const sum = (rows, field) => rows.reduce((s, x) => s.plus(x[field] ?? 0), new client_1.Prisma.Decimal(0)), rate = (n, d) => d ? new client_1.Prisma.Decimal(n).div(d).mul(100) : new client_1.Prisma.Decimal(0), channel = (c) => sum(lines.filter((x) => x.salesChannel === c), "lineTotal");
        return {
            createdCount: new client_1.Prisma.Decimal(created.length),
            createdValue: sum(created, "estimatedValue"),
            wonCount: new client_1.Prisma.Decimal(won.length),
            wonValue: sum(won, "estimatedValue"),
            lostCount: new client_1.Prisma.Decimal(lost.length),
            winRate: rate(won.length, won.length + lost.length),
            activities: new client_1.Prisma.Decimal(acts.length),
            companiesTouched: new client_1.Prisma.Decimal(new Set(acts.map((a) => a.companyId)).size),
            meetingsStarted: new client_1.Prisma.Decimal(meetings.length),
            meetingsCompleted: new client_1.Prisma.Decimal(completedMeetings.length),
            meetingExecution: rate(completedMeetings.length, executionDenom.length),
            tasksCreated: new client_1.Prisma.Decimal(taskCreated.length),
            tasksCompleted: new client_1.Prisma.Decimal(taskCompleted.length),
            taskOnTime: rate(onTime.length, withDue.length),
            collectedAmount: sum(paid, "amount"),
            collectedCount: new client_1.Prisma.Decimal(paid.length),
            receivableAmount: sum(receivables, "amount"),
            wonProductValue: sum(lines, "lineTotal"),
            wonProductItems: new client_1.Prisma.Decimal(lines.length),
            wonProductQuantity: sum(lines, "quantity"),
            inPerson: channel(client_1.SalesChannel.IN_PERSON),
            digikala: channel(client_1.SalesChannel.DIGIKALA),
            other: channel(client_1.SalesChannel.OTHER),
            legacy: channel(client_1.SalesChannel.LEGACY_UNKNOWN),
        };
    }
    groups(c, p) {
        const metricKeys = {
            createdCount: "OPPORTUNITIES_CREATED",
            createdValue: "OPPORTUNITIES_CREATED_VALUE_IRR",
            wonCount: "OPPORTUNITIES_WON",
            wonValue: "OPPORTUNITIES_WON_VALUE_IRR",
            lostCount: "OPPORTUNITIES_LOST",
            winRate: "CLOSED_WIN_RATE",
            activities: "ACTIVITIES_RECORDED",
            companiesTouched: "COMPANIES_TOUCHED",
            meetingsStarted: "MEETINGS_STARTED",
            meetingsCompleted: "MEETINGS_COMPLETED",
            meetingExecution: "MEETING_EXECUTION_RATE",
            tasksCreated: "TASKS_CREATED",
            tasksCompleted: "TASKS_COMPLETED",
            taskOnTime: "TASK_ON_TIME_COMPLETION_RATE",
            collectedAmount: "PAYMENTS_COLLECTED_IRR",
            collectedCount: "PAYMENTS_COLLECTED_COUNT",
            receivableAmount: "RECEIVABLES_CREATED_IRR",
            wonProductValue: "WON_PRODUCT_VALUE_IRR",
            wonProductItems: "WON_LINE_ITEMS",
            wonProductQuantity: "WON_PRODUCT_QUANTITY",
            inPerson: "WON_IN_PERSON_VALUE_IRR",
            digikala: "WON_DIGIKALA_VALUE_IRR",
            other: "WON_OTHER_VALUE_IRR",
            legacy: "WON_LEGACY_UNKNOWN_VALUE_IRR",
        };
        const metric = (key, label, type, polarity, dateBasis) => {
            const a = c[key], b = p[key], diff = a.minus(b), percent = b.isZero()
                ? a.isZero()
                    ? 0
                    : null
                : diff.div(b.abs()).mul(100).toDecimalPlaces(2).toNumber(), direction = diff.gt(0) ? "UP" : diff.lt(0) ? "DOWN" : "UNCHANGED", isImprovement = polarity === "NEUTRAL" || direction === "UNCHANGED"
                ? null
                : (polarity === "HIGHER_IS_BETTER") === (direction === "UP");
            const string = type === "IRR" || type === "DECIMAL";
            return {
                key: metricKeys[key],
                label,
                valueType: type,
                currentValue: string ? a.toString() : a.toNumber(),
                comparisonValue: string ? b.toString() : b.toNumber(),
                absoluteChange: string ? diff.toString() : diff.toNumber(),
                percentChange: percent,
                direction,
                polarity,
                isImprovement,
                dateBasis,
            };
        };
        return [
            {
                key: "SALES",
                title: "Sales",
                metrics: [
                    metric("createdCount", "Opportunities created", "COUNT", "HIGHER_IS_BETTER", "OPPORTUNITY_CREATED_AT"),
                    metric("createdValue", "Created value", "IRR", "HIGHER_IS_BETTER", "OPPORTUNITY_CREATED_AT"),
                    metric("wonCount", "Opportunities won", "COUNT", "HIGHER_IS_BETTER", "OPPORTUNITY_WON_AT"),
                    metric("wonValue", "Won value", "IRR", "HIGHER_IS_BETTER", "OPPORTUNITY_WON_AT"),
                    metric("lostCount", "Opportunities lost", "COUNT", "LOWER_IS_BETTER", "OPPORTUNITY_LOST_AT"),
                    metric("winRate", "Closed win rate", "PERCENT", "HIGHER_IS_BETTER", "OPPORTUNITY_WON_AT_LOST_AT"),
                ],
            },
            {
                key: "ACTIVITIES",
                title: "Activities",
                metrics: [
                    metric("activities", "Activities", "COUNT", "HIGHER_IS_BETTER", "ACTIVITY_OCCURRED_AT"),
                    metric("companiesTouched", "Companies touched", "COUNT", "HIGHER_IS_BETTER", "ACTIVITY_OCCURRED_AT"),
                ],
            },
            {
                key: "MEETINGS",
                title: "Meetings",
                metrics: [
                    metric("meetingsStarted", "Meetings started", "COUNT", "NEUTRAL", "MEETING_START_AT"),
                    metric("meetingsCompleted", "Meetings completed", "COUNT", "HIGHER_IS_BETTER", "MEETING_START_AT"),
                    metric("meetingExecution", "Meeting execution rate", "PERCENT", "HIGHER_IS_BETTER", "MEETING_START_AT"),
                ],
            },
            {
                key: "TASKS",
                title: "Tasks",
                metrics: [
                    metric("tasksCreated", "Tasks created", "COUNT", "NEUTRAL", "TASK_CREATED_AT"),
                    metric("tasksCompleted", "Tasks completed", "COUNT", "HIGHER_IS_BETTER", "TASK_COMPLETED_AT"),
                    metric("taskOnTime", "On-time completion rate", "PERCENT", "HIGHER_IS_BETTER", "TASK_COMPLETED_AT"),
                ],
            },
            {
                key: "FINANCE",
                title: "Finance",
                metrics: [
                    metric("collectedAmount", "Collected amount", "IRR", "HIGHER_IS_BETTER", "PAYMENT_PAID_AT"),
                    metric("collectedCount", "Collected payments", "COUNT", "HIGHER_IS_BETTER", "PAYMENT_PAID_AT"),
                    metric("receivableAmount", "Receivables created", "IRR", "NEUTRAL", "PAYMENT_CREATED_AT"),
                ],
            },
            {
                key: "PRODUCTS",
                title: "Products and channels",
                metrics: [
                    metric("wonProductValue", "Won product net value", "IRR", "HIGHER_IS_BETTER", "OPPORTUNITY_WON_AT"),
                    metric("wonProductItems", "Won line items", "COUNT", "HIGHER_IS_BETTER", "OPPORTUNITY_WON_AT"),
                    metric("wonProductQuantity", "Won quantity", "DECIMAL", "HIGHER_IS_BETTER", "OPPORTUNITY_WON_AT"),
                    metric("inPerson", "Won in-person value", "IRR", "NEUTRAL", "OPPORTUNITY_WON_AT"),
                    metric("digikala", "Won Digikala value", "IRR", "NEUTRAL", "OPPORTUNITY_WON_AT"),
                    metric("other", "Won other value", "IRR", "NEUTRAL", "OPPORTUNITY_WON_AT"),
                    metric("legacy", "Won legacy-unknown value", "IRR", "NEUTRAL", "OPPORTUNITY_WON_AT"),
                ],
            },
        ];
    }
    resolve(f, tz) {
        const current = f.startDate || f.endDate
            ? this.input(f.startDate, f.endDate, tz)
            : this.defaultRange(tz), mode = f.comparisonMode ?? period_comparison_dto_1.ComparisonMode.PREVIOUS_PERIOD;
        let comparison;
        if (mode === period_comparison_dto_1.ComparisonMode.CUSTOM) {
            if (!f.compareStartDate || !f.compareEndDate)
                throw new common_1.BadRequestException("compareStartDate and compareEndDate are required for CUSTOM");
            comparison = this.input(f.compareStartDate, f.compareEndDate, tz);
        }
        else if (mode === period_comparison_dto_1.ComparisonMode.PREVIOUS_PERIOD) {
            const span = current.end.getTime() - current.start.getTime();
            comparison = {
                start: new Date(current.start.getTime() - span),
                end: current.start,
            };
        }
        else {
            comparison = {
                start: this.shiftYear(current.start, tz),
                end: this.shiftYear(current.end, tz),
            };
        }
        if (comparison.start < current.end && comparison.end > current.start)
            throw new common_1.BadRequestException("Comparison periods must not overlap");
        return { current, comparison, mode };
    }
    input(start, end, tz) {
        if (!start || !end)
            throw new common_1.BadRequestException("startDate and endDate must be provided together");
        const s = this.boundary(start, tz, false), e = this.boundary(end, tz, true);
        if (s >= e)
            throw new common_1.BadRequestException("Invalid report period");
        return { start: s, end: e };
    }
    boundary(value, tz, end) {
        if (!(0, api_date_util_1.isDateOnlyString)(value))
            return new Date(value);
        const [y, m, d] = value.split("-").map(Number), date = new Date(Date.UTC(y, m - 1, d + (end ? 1 : 0)));
        return (0, timezone_boundary_util_1.zonedMidnightUtc)(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), tz);
    }
    defaultRange(tz) {
        const today = (0, timezone_boundary_util_1.organizationDayBounds)(new Date(), tz).start, parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(today), get = (x) => Number(parts.find((p) => p.type === x)?.value), d = new Date(Date.UTC(get("year"), get("month") - 1, get("day") - 30));
        return {
            start: (0, timezone_boundary_util_1.zonedMidnightUtc)(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), tz),
            end: today,
        };
    }
    shiftYear(date, tz) {
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: tz,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(date), get = (x) => Number(parts.find((p) => p.type === x)?.value), year = get("year") - 1, month = get("month"), day = Math.min(get("day"), new Date(Date.UTC(year, month, 0)).getUTCDate());
        return (0, timezone_boundary_util_1.zonedMidnightUtc)(year, month, day, tz);
    }
    out(r) {
        return { startDate: r.start.toISOString(), endDate: r.end.toISOString() };
    }
};
exports.PeriodComparisonService = PeriodComparisonService;
exports.PeriodComparisonService = PeriodComparisonService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        reporting_scope_service_1.ReportingScopeService])
], PeriodComparisonService);
//# sourceMappingURL=period-comparison.service.js.map