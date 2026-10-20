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
exports.ConversionHealthService = void 0;
const common_1 = require("@nestjs/common");
const ownership_scope_dto_1 = require("../common/dto/ownership-scope.dto");
const api_date_util_1 = require("../common/dates/api-date.util");
const team_scope_util_1 = require("../common/tenant/team-scope.util");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const MILESTONES = [
    { key: "engagement", label: "تعامل اولیه", codes: ["LEAD", "CONTACTED", "INTERESTED"] },
    { key: "qualification", label: "احراز صلاحیت", codes: ["QUALIFIED", "NEEDS_ASSESSMENT"] },
    { key: "commercial", label: "تجاری", codes: ["PENDING_PRE_INVOICE_APPROVAL"] },
    { key: "pilot", label: "پایلوت / POC", codes: ["POC_PILOT_SCHEDULED", "POC_PILOT_IN_PROGRESS", "PENDING_POC_PILOT_APPROVAL"] },
    { key: "delivery", label: "پرداخت / تحویل", codes: ["PENDING_PAYMENT_INVOICE_APPROVAL", "INSTALLATION_SCHEDULED", "INSTALLATION_IN_PROGRESS"] },
    { key: "acceptance", label: "پذیرش مشتری", codes: ["PENDING_CUSTOMER_ACCEPTANCE"] },
    { key: "won", label: "مشتری", codes: ["DONE"] },
];
let ConversionHealthService = class ConversionHealthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    percent(part, total) {
        return total ? Math.round((part / total) * 1000) / 10 : 0;
    }
    round(value, digits = 1) {
        const factor = 10 ** digits;
        return Math.round(value * factor) / factor;
    }
    median(values) {
        if (!values.length)
            return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    }
    ownershipWhere(scope, user) {
        switch (scope ?? ownership_scope_dto_1.OwnershipScope.ALL) {
            case ownership_scope_dto_1.OwnershipScope.MINE:
                return { OR: [{ ownerId: user.userId }, { company: { ownerId: user.userId } }] };
            case ownership_scope_dto_1.OwnershipScope.TEAM:
                return { owner: (0, team_scope_util_1.userTeamScopeWhere)(user) };
            case ownership_scope_dto_1.OwnershipScope.UNASSIGNED:
                return { ownerId: null };
            default:
                return {};
        }
    }
    resolvePeriod(filters) {
        const explicit = (0, api_date_util_1.parseApiDateRange)(filters.startDate, filters.endDate, "startDate", "endDate");
        if (explicit?.gte || explicit?.lte) {
            const end = explicit.lte ?? new Date();
            const start = explicit.gte ?? new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
            return { start, end, isDefault: false };
        }
        const end = new Date();
        const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
        return { start, end, isDefault: true };
    }
    previousPeriod(start, end) {
        const span = Math.max(1, end.getTime() - start.getTime());
        return { start: new Date(start.getTime() - span), end: new Date(start.getTime() - 1) };
    }
    async loadCohort(filters, user, start, end) {
        const and = [
            { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user) },
            { archivedAt: null },
            { company: { archivedAt: null } },
            { createdAt: { gte: start, lte: end } },
            this.ownershipWhere(filters.ownershipScope, user),
        ];
        if (filters.ownerIds?.length)
            and.push({ ownerId: { in: filters.ownerIds } });
        if (filters.companyIds?.length)
            and.push({ companyId: { in: filters.companyIds } });
        if (filters.priorities?.length)
            and.push({ priority: { in: filters.priorities } });
        return this.prisma.opportunity.findMany({
            where: { AND: and },
            select: {
                id: true,
                createdAt: true,
                wonAt: true,
                lostAt: true,
                estimatedValue: true,
                owner: { select: { id: true, fullName: true } },
                stage: { select: { code: true, label: true, isTerminal: true, terminalType: true } },
                stageHistories: {
                    select: {
                        changedAt: true,
                        fromStage: { select: { code: true, terminalType: true } },
                        toStage: { select: { code: true, label: true, terminalType: true } },
                    },
                    orderBy: { changedAt: "asc" },
                },
            },
            orderBy: { createdAt: "asc" },
        });
    }
    analyze(rows, start, end) {
        const total = rows.length;
        const wonIds = new Set();
        const lostIds = new Set();
        const onHoldIds = new Set();
        const activeIds = new Set();
        const timeToWinDays = [];
        const milestoneReached = new Map();
        MILESTONES.forEach((m) => milestoneReached.set(m.key, new Set()));
        let onHoldEntered = 0;
        let onHoldRecovered = 0;
        const ownerMap = new Map();
        const monthMap = new Map();
        const ensureMonth = (date) => {
            const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
            if (!monthMap.has(key))
                monthMap.set(key, { month: key, leads: 0, won: 0 });
            return monthMap.get(key);
        };
        for (const row of rows) {
            ensureMonth(row.createdAt).leads += 1;
            const visitedCodes = new Set(["LEAD", row.stage.code, ...row.stageHistories.map((h) => h.toStage.code)]);
            for (const milestone of MILESTONES) {
                if (milestone.codes.some((code) => visitedCodes.has(code)))
                    milestoneReached.get(milestone.key).add(row.id);
            }
            const wonHistory = row.stageHistories.find((h) => h.toStage.terminalType === "WON" || h.toStage.code === "DONE");
            const isWon = row.stage.terminalType === "WON" || row.stage.code === "DONE" || Boolean(row.wonAt) || Boolean(wonHistory);
            const isLost = row.stage.terminalType === "LOST" || ["LOST", "NO_RESPONSE"].includes(row.stage.code);
            const isOnHold = row.stage.terminalType === "ON_HOLD" || row.stage.code === "ON_HOLD";
            if (isWon) {
                wonIds.add(row.id);
                const wonDate = row.wonAt ?? wonHistory?.changedAt;
                if (wonDate) {
                    const days = (wonDate.getTime() - row.createdAt.getTime()) / 86_400_000;
                    if (days >= 0)
                        timeToWinDays.push(days);
                    if (wonDate >= start && wonDate <= end)
                        ensureMonth(wonDate).won += 1;
                }
            }
            else if (isLost)
                lostIds.add(row.id);
            else if (isOnHold)
                onHoldIds.add(row.id);
            else
                activeIds.add(row.id);
            const enteredHold = row.stageHistories.some((h) => h.toStage.code === "ON_HOLD" || h.toStage.terminalType === "ON_HOLD");
            const recovered = row.stageHistories.some((h) => (h.fromStage?.code === "ON_HOLD" || h.fromStage?.terminalType === "ON_HOLD") && h.toStage.terminalType !== "ON_HOLD" && h.toStage.code !== "ON_HOLD");
            if (enteredHold)
                onHoldEntered += 1;
            if (recovered)
                onHoldRecovered += 1;
            if (row.owner) {
                const current = ownerMap.get(row.owner.id) ?? { ownerId: row.owner.id, ownerName: row.owner.fullName, total: 0, won: 0, pipelineValue: 0 };
                current.total += 1;
                if (isWon)
                    current.won += 1;
                current.pipelineValue += Number(row.estimatedValue ?? 0);
                ownerMap.set(row.owner.id, current);
            }
        }
        const milestones = MILESTONES.map((m) => {
            const reached = milestoneReached.get(m.key)?.size ?? 0;
            return { key: m.key, label: m.label, reached, reachRate: this.percent(reached, total) };
        });
        let biggestLeakage = null;
        for (let i = 0; i < milestones.length - 1; i += 1) {
            const from = milestones[i];
            const to = milestones[i + 1];
            if (!from.reached)
                continue;
            const dropCount = Math.max(0, from.reached - to.reached);
            const dropRate = this.percent(dropCount, from.reached);
            if (!biggestLeakage || dropRate > biggestLeakage.dropRate)
                biggestLeakage = { fromKey: from.key, fromLabel: from.label, toKey: to.key, toLabel: to.label, dropCount, dropRate };
        }
        const owners = [...ownerMap.values()].map((owner) => ({ ...owner, conversionRate: this.percent(owner.won, owner.total), avgOpportunityValue: owner.total ? Math.round(owner.pipelineValue / owner.total) : 0 })).sort((a, b) => b.pipelineValue - a.pipelineValue).slice(0, 12);
        return {
            total,
            won: wonIds.size,
            lost: lostIds.size,
            onHold: onHoldIds.size,
            active: activeIds.size,
            leadToCustomerRate: this.percent(wonIds.size, total),
            lostRate: this.percent(lostIds.size, total),
            onHoldRate: this.percent(onHoldIds.size, total),
            activeRate: this.percent(activeIds.size, total),
            medianTimeToWinDays: this.round(this.median(timeToWinDays)),
            recoveryRate: this.percent(onHoldRecovered, onHoldEntered),
            onHoldEntered,
            onHoldRecovered,
            milestones,
            biggestLeakage,
            trend: [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
            owners,
        };
    }
    delta(current, previous) {
        return { current, previous, delta: this.round(current - previous) };
    }
    async report(filters, user) {
        const period = this.resolvePeriod(filters);
        const previous = this.previousPeriod(period.start, period.end);
        const [currentRows, previousRows] = await Promise.all([
            this.loadCohort(filters, user, period.start, period.end),
            this.loadCohort(filters, user, previous.start, previous.end),
        ]);
        const current = this.analyze(currentRows, period.start, period.end);
        const previousAnalysis = this.analyze(previousRows, previous.start, previous.end);
        return {
            definition: {
                cohort: "Opportunityهایی که در بازه انتخابی ایجاد شده‌اند و نتیجه نهایی آن‌ها مستقل از مسیر میانی بررسی می‌شود.",
                conversion: "درصد Opportunityهای Cohort که نهایتاً به Stage با terminalType=WON رسیده‌اند.",
            },
            period: { startDate: period.start.toISOString(), endDate: period.end.toISOString(), defaultedToLast90Days: period.isDefault },
            comparisonPeriod: { startDate: previous.start.toISOString(), endDate: previous.end.toISOString() },
            summary: {
                totalLeads: current.total,
                won: current.won,
                lost: current.lost,
                onHold: current.onHold,
                active: current.active,
                leadToCustomer: this.delta(current.leadToCustomerRate, previousAnalysis.leadToCustomerRate),
                lostRate: this.delta(current.lostRate, previousAnalysis.lostRate),
                medianTimeToWinDays: this.delta(current.medianTimeToWinDays, previousAnalysis.medianTimeToWinDays),
                recoveryRate: this.delta(current.recoveryRate, previousAnalysis.recoveryRate),
            },
            outcomes: [
                { key: "won", label: "مشتری", count: current.won, rate: current.leadToCustomerRate },
                { key: "lost", label: "از دست رفته", count: current.lost, rate: current.lostRate },
                { key: "onHold", label: "متوقف", count: current.onHold, rate: current.onHoldRate },
                { key: "active", label: "در جریان", count: current.active, rate: current.activeRate },
            ],
            milestones: current.milestones,
            biggestLeakage: current.biggestLeakage,
            trend: current.trend,
            owners: current.owners,
            recovery: { enteredOnHold: current.onHoldEntered, recovered: current.onHoldRecovered, rate: current.recoveryRate },
        };
    }
};
exports.ConversionHealthService = ConversionHealthService;
exports.ConversionHealthService = ConversionHealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConversionHealthService);
//# sourceMappingURL=conversion-health.service.js.map