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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const activities_service_1 = require("../activities/activities.service");
const prisma_service_1 = require("../prisma/prisma.service");
const reporting_scope_service_1 = require("../reports/reporting-scope.service");
let DashboardService = class DashboardService {
    constructor(activities, prisma, scopes) {
        this.activities = activities;
        this.prisma = prisma;
        this.scopes = scopes;
    }
    latestActivities(user) {
        return this.activities.latestActivities(user);
    }
    async managementSummary(filters, user) {
        const now = new Date();
        const portfolioScope = {
            AND: [
                this.scopes.opportunity(filters, user),
                {
                    archivedAt: null,
                    company: { archivedAt: null },
                },
            ],
        };
        const currentJalaliMonth = this.getJalaliDate(now);
        const monthBuckets = Array.from({ length: 12 }, (_, index) => {
            const monthOffset = index - 11;
            const startJalali = this.addJalaliMonths(currentJalaliMonth.year, currentJalaliMonth.month, monthOffset);
            const endJalali = this.addJalaliMonths(currentJalaliMonth.year, currentJalaliMonth.month, monthOffset + 1);
            return {
                start: this.jalaliMonthStartUtc(startJalali.year, startJalali.month),
                end: this.jalaliMonthStartUtc(endJalali.year, endJalali.month),
            };
        });
        const trendStart = monthBuckets[0].start;
        const [portfolioOpportunities, createdTrendOpportunities, wonTrendOpportunities, lostTrendOpportunities,] = await Promise.all([
            this.prisma.opportunity.findMany({
                where: portfolioScope,
                select: {
                    estimatedValue: true,
                    stage: {
                        select: {
                            isTerminal: true,
                            terminalType: true,
                        },
                    },
                },
            }),
            this.prisma.opportunity.findMany({
                where: {
                    AND: [portfolioScope, { createdAt: { gte: trendStart } }],
                },
                select: {
                    createdAt: true,
                    estimatedValue: true,
                },
            }),
            this.prisma.opportunity.findMany({
                where: {
                    AND: [
                        portfolioScope,
                        {
                            wonAt: { gte: trendStart },
                            stage: { terminalType: "WON" },
                        },
                    ],
                },
                select: {
                    wonAt: true,
                    estimatedValue: true,
                },
            }),
            this.prisma.opportunity.findMany({
                where: {
                    AND: [
                        portfolioScope,
                        {
                            lostAt: { gte: trendStart },
                            stage: { terminalType: "LOST" },
                        },
                    ],
                },
                select: {
                    lostAt: true,
                    estimatedValue: true,
                },
            }),
        ]);
        const activePortfolio = portfolioOpportunities.filter((opportunity) => !opportunity.stage.isTerminal);
        const wonPortfolio = portfolioOpportunities.filter((opportunity) => opportunity.stage.terminalType === "WON");
        const lostPortfolio = portfolioOpportunities.filter((opportunity) => opportunity.stage.terminalType === "LOST");
        const totalPortfolioCount = portfolioOpportunities.length;
        const inBucket = (date, start, end) => Boolean(date && date >= start && date < end);
        const opportunityTrend12m = monthBuckets.map(({ start, end }) => {
            const createdRows = createdTrendOpportunities.filter((opportunity) => inBucket(opportunity.createdAt, start, end));
            const wonRows = wonTrendOpportunities.filter((opportunity) => inBucket(opportunity.wonAt, start, end));
            const lostRows = lostTrendOpportunities.filter((opportunity) => inBucket(opportunity.lostAt, start, end));
            return {
                periodStart: start.toISOString(),
                periodEnd: end.toISOString(),
                createdCount: createdRows.length,
                wonCount: wonRows.length,
                lostCount: lostRows.length,
                createdValueIrr: this.money(createdRows).toString(),
                wonValueIrr: this.money(wonRows).toString(),
                lostValueIrr: this.money(lostRows).toString(),
            };
        });
        return {
            portfolio: {
                total: {
                    count: totalPortfolioCount,
                    estimatedValueIrr: this.money(portfolioOpportunities).toString(),
                },
                active: {
                    count: activePortfolio.length,
                    estimatedValueIrr: this.money(activePortfolio).toString(),
                    percentage: this.percent(activePortfolio.length, totalPortfolioCount),
                },
                won: {
                    count: wonPortfolio.length,
                    estimatedValueIrr: this.money(wonPortfolio).toString(),
                    percentage: this.percent(wonPortfolio.length, totalPortfolioCount),
                },
                lost: {
                    count: lostPortfolio.length,
                    estimatedValueIrr: this.money(lostPortfolio).toString(),
                    percentage: this.percent(lostPortfolio.length, totalPortfolioCount),
                },
            },
            opportunityTrend12m,
        };
    }
    getJalaliDate(date) {
        const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian-nu-latn", {
            timeZone: "UTC",
            year: "numeric",
            month: "numeric",
            day: "numeric",
        });
        const parts = formatter.formatToParts(date);
        const value = (type) => {
            const part = parts.find((item) => item.type === type)?.value;
            const parsed = Number(part);
            if (!Number.isInteger(parsed)) {
                throw new Error(`Unable to resolve Persian calendar ${type}`);
            }
            return parsed;
        };
        return {
            year: value("year"),
            month: value("month"),
            day: value("day"),
        };
    }
    addJalaliMonths(year, month, offset) {
        const zeroBasedMonth = year * 12 + (month - 1) + offset;
        const targetYear = Math.floor(zeroBasedMonth / 12);
        const targetMonth = ((zeroBasedMonth % 12) + 12) % 12;
        return {
            year: targetYear,
            month: targetMonth + 1,
        };
    }
    jalaliMonthStartUtc(year, month) {
        const gregorian = this.jalaliToGregorian(year, month, 1);
        return new Date(Date.UTC(gregorian.year, gregorian.month - 1, gregorian.day, 0, 0, 0, 0));
    }
    jalaliToGregorian(jalaliYear, jalaliMonth, jalaliDay) {
        let jy = jalaliYear + 1595;
        let days = -355668 +
            365 * jy +
            Math.floor(jy / 33) * 8 +
            Math.floor(((jy % 33) + 3) / 4) +
            jalaliDay +
            (jalaliMonth < 7
                ? (jalaliMonth - 1) * 31
                : (jalaliMonth - 7) * 30 + 186);
        let year = 400 * Math.floor(days / 146097);
        days %= 146097;
        if (days > 36524) {
            year += 100 * Math.floor(--days / 36524);
            days %= 36524;
            if (days >= 365) {
                days++;
            }
        }
        year += 4 * Math.floor(days / 1461);
        days %= 1461;
        if (days > 365) {
            year += Math.floor((days - 1) / 365);
            days = (days - 1) % 365;
        }
        let day = days + 1;
        const monthLengths = [
            0,
            31,
            this.isGregorianLeapYear(year) ? 29 : 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31,
        ];
        let month = 1;
        while (month <= 12 && day > monthLengths[month]) {
            day -= monthLengths[month];
            month++;
        }
        return { year, month, day };
    }
    isGregorianLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    money(rows) {
        return rows.reduce((sum, row) => sum.plus(row.estimatedValue ?? 0), new client_1.Prisma.Decimal(0));
    }
    percent(part, total) {
        return total ? Math.round((part / total) * 100) : 0;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [activities_service_1.ActivitiesService,
        prisma_service_1.PrismaService,
        reporting_scope_service_1.ReportingScopeService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map