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
exports.DataQualityService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const ownership_scope_dto_1 = require("../common/dto/ownership-scope.dto");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const team_scope_util_1 = require("../common/tenant/team-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const data_quality_rules_1 = require("./data-quality-rules");
const data_quality_dto_1 = require("./dto/data-quality.dto");
const reporting_scope_service_1 = require("./reporting-scope.service");
let DataQualityService = class DataQualityService {
    constructor(prisma, scopes) {
        this.prisma = prisma;
        this.scopes = scopes;
    }
    async report(query, user) {
        const canCatalog = await this.hasPermission(user, "product:view");
        const snapshot = await this.snapshot(query, user, canCatalog);
        return {
            asOf: snapshot.asOf,
            organization: this.section(snapshot.items, data_quality_dto_1.ReportingScope.ORGANIZATION, query),
            globalCatalog: canCatalog
                ? this.section(snapshot.items, data_quality_dto_1.ReportingScope.GLOBAL_CATALOG, query)
                : null,
        };
    }
    async issues(query, user) {
        const rule = data_quality_rules_1.DATA_QUALITY_RULE_MAP.get(query.ruleKey);
        if (!rule)
            throw new common_1.BadRequestException("Invalid data-quality ruleKey");
        if (rule.scope === data_quality_dto_1.ReportingScope.GLOBAL_CATALOG &&
            !(await this.hasPermission(user, "product:view")))
            throw new common_1.ForbiddenException("product:view is required for global catalog quality");
        const snapshot = await this.snapshot(query, user, rule.scope === data_quality_dto_1.ReportingScope.GLOBAL_CATALOG);
        const issues = snapshot.items.filter((item) => item.entityType === rule.entityType &&
            this.failed(rule.ruleKey, item.data));
        const page = query.page ?? 1, limit = query.limit ?? 20, total = issues.length, totalPages = Math.ceil(total / limit);
        return {
            asOf: snapshot.asOf,
            rule,
            data: issues.slice((page - 1) * limit, page * limit).map((item) => ({
                entityId: item.id,
                entityType: item.entityType,
                scope: rule.scope,
                title: item.title,
                subtitle: item.subtitle,
                company: item.company,
                owner: item.owner,
                fieldNames: rule.fieldNames,
                message: rule.description,
                routeHint: this.route(rule.entityType, item.id, item.company?.id),
                detectedAt: snapshot.asOf,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    section(items, scope, q) {
        const rules = data_quality_rules_1.DATA_QUALITY_RULES.filter((r) => r.scope === scope &&
            (!q.ruleKeys?.length || q.ruleKeys.includes(r.ruleKey)) &&
            (!q.entityTypes?.length || q.entityTypes.includes(r.entityType)) &&
            (!q.severities?.length || q.severities.includes(r.severity)));
        const results = rules.map((rule) => {
            const eligible = items.filter((i) => i.entityType === rule.entityType), issues = eligible.filter((i) => this.failed(rule.ruleKey, i.data)).length;
            return {
                ...rule,
                eligibleCount: eligible.length,
                issueCount: issues,
                passRate: this.score(eligible.length - issues, eligible.length),
            };
        });
        const eligibleChecks = results.reduce((n, r) => n + r.eligibleCount, 0), issueOccurrences = results.reduce((n, r) => n + r.issueCount, 0), passedChecks = eligibleChecks - issueOccurrences;
        const entityTypes = [...new Set(results.map((r) => r.entityType))];
        return {
            score: {
                overall: this.score(passedChecks, eligibleChecks),
                eligibleChecks,
                passedChecks,
                issueOccurrences,
            },
            byEntityType: entityTypes.map((entityType) => {
                const rows = results.filter((r) => r.entityType === entityType), eligible = rows.reduce((n, r) => n + r.eligibleCount, 0), issues = rows.reduce((n, r) => n + r.issueCount, 0);
                return {
                    entityType,
                    eligibleChecks: eligible,
                    issueOccurrences: issues,
                    score: this.score(eligible - issues, eligible),
                };
            }),
            bySeverity: ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((severity) => ({
                severity,
                issueOccurrences: results
                    .filter((r) => r.severity === severity)
                    .reduce((n, r) => n + r.issueCount, 0),
            })),
            rules: results,
        };
    }
    async snapshot(q, user, includeCatalog) {
        const asOf = new Date().toISOString(), org = (0, tenant_scope_util_1.getCurrentOrganizationId)(user), companyWhere = this.scopes.company(q, user), opportunityWhere = this.scopes.opportunity(q, user, true);
        const [companies, opportunities, tasks, meetings, payments, documents, currentRate, products,] = await Promise.all([
            this.prisma.company.findMany({
                where: companyWhere,
                select: {
                    id: true,
                    legalName: true,
                    brandName: true,
                    ownerId: true,
                    owner: { select: { id: true, fullName: true } },
                    industryId: true,
                    industry: true,
                    sourceId: true,
                    source: true,
                    nationalId: true,
                    publicEmail: true,
                    centralPhone: true,
                    people: {
                        where: { isPrimaryContact: true },
                        select: {
                            email: true,
                            phone: true,
                            contacts: { select: { value: true } },
                        },
                        take: 1,
                    },
                },
            }),
            this.prisma.opportunity.findMany({
                where: opportunityWhere,
                select: {
                    id: true,
                    title: true,
                    ownerId: true,
                    owner: { select: { id: true, fullName: true } },
                    company: { select: { id: true, legalName: true, brandName: true } },
                    estimatedValue: true,
                    probability: true,
                    expectedCloseDate: true,
                    primaryContactId: true,
                    stageId: true,
                    _count: { select: { lineItems: true } },
                    stageHistories: { select: { toStageId: true } },
                },
            }),
            this.prisma.task.findMany({
                where: {
                    AND: [
                        {
                            organizationId: org,
                            status: { in: [client_1.TaskStatus.TODO, client_1.TaskStatus.IN_PROGRESS] },
                        },
                        ...this.taskFilters(q, user),
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    assignedToId: true,
                    dueAt: true,
                    assignedTo: { select: { id: true, fullName: true } },
                    company: { select: { id: true, legalName: true, brandName: true } },
                },
            }),
            this.prisma.meeting.findMany({
                where: {
                    AND: [
                        {
                            organizationId: org,
                            status: "SCHEDULED",
                            endAt: { lt: new Date() },
                        },
                        ...this.meetingFilters(q, user),
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    endAt: true,
                    organizer: { select: { id: true, fullName: true } },
                    company: { select: { id: true, legalName: true, brandName: true } },
                },
            }),
            this.prisma.opportunityPayment.findMany({
                where: { opportunity: opportunityWhere },
                select: {
                    id: true,
                    status: true,
                    paidAt: true,
                    dueDate: true,
                    opportunity: {
                        select: {
                            title: true,
                            owner: { select: { id: true, fullName: true } },
                            company: {
                                select: { id: true, legalName: true, brandName: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.opportunityCommercialDocument.findMany({
                where: { opportunity: opportunityWhere },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    amount: true,
                    opportunity: {
                        select: {
                            owner: { select: { id: true, fullName: true } },
                            company: {
                                select: { id: true, legalName: true, brandName: true },
                            },
                        },
                    },
                },
            }),
            includeCatalog
                ? this.prisma.currencyExchangeRate.findFirst({
                    where: { validTo: null, validFrom: { lte: new Date() } },
                    select: { id: true },
                    orderBy: { validFrom: "desc" },
                })
                : null,
            includeCatalog
                ? this.prisma.productCatalogItem.findMany({
                    where: { isActive: true },
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        category: true,
                        pricingCurrency: true,
                        inPersonPriceIrr: true,
                        digikalaPriceIrr: true,
                        calculatedExchangeRateId: true,
                    },
                })
                : [],
        ]);
        const company = (c) => ({
            id: c.id,
            legalName: c.legalName,
            brandName: c.brandName,
        });
        const items = [];
        for (const c of companies)
            items.push({
                id: c.id,
                entityType: "COMPANY",
                title: c.brandName ?? c.legalName,
                subtitle: null,
                company: company(c),
                owner: c.owner,
                data: {
                    ...c,
                    hasPrimary: c.people.length > 0,
                    hasContact: Boolean(c.publicEmail?.trim() ||
                        c.centralPhone?.trim() ||
                        c.people.some((p) => p.email?.trim() ||
                            p.phone?.trim() ||
                            p.contacts.some((x) => x.value?.trim()))),
                },
            });
        for (const o of opportunities)
            items.push({
                id: o.id,
                entityType: "OPPORTUNITY",
                title: o.title,
                subtitle: o.company.brandName ?? o.company.legalName,
                company: o.company,
                owner: o.owner,
                data: {
                    ...o,
                    lineCount: o._count.lineItems,
                    hasCurrentHistory: o.stageHistories.some((h) => h.toStageId === o.stageId),
                },
            });
        for (const t of tasks)
            items.push({
                id: t.id,
                entityType: "TASK",
                title: t.title,
                subtitle: null,
                company: t.company,
                owner: t.assignedTo,
                data: t,
            });
        for (const m of meetings)
            items.push({
                id: m.id,
                entityType: "MEETING",
                title: m.title,
                subtitle: null,
                company: m.company,
                owner: m.organizer,
                data: m,
            });
        for (const p of payments)
            items.push({
                id: p.id,
                entityType: "PAYMENT",
                title: p.opportunity.title,
                subtitle: null,
                company: p.opportunity.company,
                owner: p.opportunity.owner,
                data: p,
            });
        for (const d of documents)
            items.push({
                id: d.id,
                entityType: "COMMERCIAL_DOCUMENT",
                title: d.title,
                subtitle: null,
                company: d.opportunity.company,
                owner: d.opportunity.owner,
                data: d,
            });
        for (const p of products)
            items.push({
                id: p.id,
                entityType: "PRODUCT",
                title: p.name,
                subtitle: p.code,
                company: null,
                owner: null,
                data: { ...p, currentRateId: currentRate?.id ?? null },
            });
        return { asOf, items };
    }
    failed(key, d) {
        switch (key) {
            case "COMPANY_MISSING_OWNER":
                return !d.ownerId;
            case "COMPANY_MISSING_INDUSTRY":
                return !d.industryId && !d.industry?.trim();
            case "COMPANY_MISSING_SOURCE":
                return !d.sourceId && !d.source?.trim();
            case "COMPANY_MISSING_PRIMARY_CONTACT":
                return !d.hasPrimary;
            case "COMPANY_MISSING_CONTACT_CHANNEL":
                return !d.hasContact;
            case "COMPANY_MISSING_NATIONAL_ID":
                return !d.nationalId?.trim();
            case "OPPORTUNITY_MISSING_OWNER":
                return !d.ownerId;
            case "OPPORTUNITY_MISSING_ESTIMATED_VALUE":
                return d.estimatedValue == null;
            case "OPPORTUNITY_MISSING_PROBABILITY":
                return d.probability == null;
            case "OPPORTUNITY_MISSING_EXPECTED_CLOSE_DATE":
                return !d.expectedCloseDate;
            case "OPPORTUNITY_MISSING_PRIMARY_CONTACT":
                return !d.primaryContactId;
            case "OPPORTUNITY_WITHOUT_LINE_ITEMS":
                return d.lineCount === 0;
            case "OPPORTUNITY_CURRENT_STAGE_HISTORY_MISSING":
                return !d.hasCurrentHistory;
            case "OPEN_TASK_MISSING_ASSIGNEE":
                return !d.assignedToId;
            case "OPEN_TASK_MISSING_DUE_DATE":
                return !d.dueAt;
            case "PAST_SCHEDULED_MEETING":
                return true;
            case "PAID_PAYMENT_MISSING_PAID_AT":
                return d.status === client_1.PaymentStatus.PAID && !d.paidAt;
            case "UNPAID_PAYMENT_HAS_PAID_AT":
                return d.status !== client_1.PaymentStatus.PAID && Boolean(d.paidAt);
            case "OPEN_PAYMENT_MISSING_DUE_DATE":
                return ([
                    client_1.PaymentStatus.PENDING,
                    client_1.PaymentStatus.PARTIAL,
                    client_1.PaymentStatus.OVERDUE,
                ].includes(d.status) && !d.dueDate);
            case "FINAL_DOCUMENT_MISSING_AMOUNT":
                return ([
                    client_1.CommercialDocumentStatus.ACCEPTED,
                    client_1.CommercialDocumentStatus.SIGNED,
                ].includes(d.status) && d.amount == null);
            case "ACTIVE_PRODUCT_NON_POSITIVE_IN_PERSON_PRICE":
                return new client_1.Prisma.Decimal(d.inPersonPriceIrr).lte(0);
            case "ACTIVE_PRODUCT_NON_POSITIVE_DIGIKALA_PRICE":
                return new client_1.Prisma.Decimal(d.digikalaPriceIrr).lte(0);
            case "USD_PRODUCT_STALE_EXCHANGE_RATE":
                return (d.pricingCurrency === "USD" &&
                    (!d.currentRateId || d.calculatedExchangeRateId !== d.currentRateId));
            case "PRODUCT_MISSING_CATEGORY":
                return !d.category?.trim();
            default:
                return false;
        }
    }
    taskFilters(q, user) {
        return [
            ...(q.companyIds?.length ? [{ companyId: { in: q.companyIds } }] : []),
            ...(q.ownerIds?.length ? [{ assignedToId: { in: q.ownerIds } }] : []),
            ...(q.teams?.length
                ? [{ assignedTo: (0, team_scope_util_1.userTeamFilterWhere)(q.teams) }]
                : []),
            ...(q.ownershipScope === ownership_scope_dto_1.OwnershipScope.MINE
                ? [{ assignedToId: user.userId }]
                : q.ownershipScope === ownership_scope_dto_1.OwnershipScope.TEAM
                    ? [{ assignedTo: (0, team_scope_util_1.userTeamScopeWhere)(user) }]
                    : q.ownershipScope === ownership_scope_dto_1.OwnershipScope.UNASSIGNED
                        ? [{ assignedToId: null }]
                        : []),
        ];
    }
    meetingFilters(q, user) {
        return [
            ...(q.companyIds?.length ? [{ companyId: { in: q.companyIds } }] : []),
            ...(q.ownerIds?.length ? [{ organizerId: { in: q.ownerIds } }] : []),
            ...(q.teams?.length ? [{ organizer: (0, team_scope_util_1.userTeamFilterWhere)(q.teams) }] : []),
            ...(q.ownershipScope === ownership_scope_dto_1.OwnershipScope.MINE
                ? [{ organizerId: user.userId }]
                : q.ownershipScope === ownership_scope_dto_1.OwnershipScope.TEAM
                    ? [{ organizer: (0, team_scope_util_1.userTeamScopeWhere)(user) }]
                    : []),
        ];
    }
    score(passed, total) {
        return total ? Math.round((passed / total) * 10000) / 100 : null;
    }
    route(type, id, companyId) {
        return type === "COMPANY"
            ? `/companies/${id}`
            : type === "OPPORTUNITY"
                ? `/opportunities/${id}`
                : type === "PRODUCT"
                    ? `/product-catalog/${id}`
                    : companyId
                        ? `/companies/${companyId}`
                        : null;
    }
    async hasPermission(user, action) {
        const db = await this.prisma.user.findUnique({
            where: { id: user.userId },
            select: { role: true, roleId: true },
        });
        if (!db)
            return false;
        return Boolean(await this.prisma.rolePermission.findFirst({
            where: db.roleId
                ? { roleId: db.roleId, permission: { action, isActive: true } }
                : {
                    role: db.role,
                    permission: { action, isActive: true },
                },
            select: { id: true },
        }));
    }
};
exports.DataQualityService = DataQualityService;
exports.DataQualityService = DataQualityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        reporting_scope_service_1.ReportingScopeService])
], DataQualityService);
//# sourceMappingURL=data-quality.service.js.map