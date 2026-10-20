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
exports.CompanyOverviewService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
let CompanyOverviewService = class CompanyOverviewService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview(companyId, user) {
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        const company = await this.prisma.company.findFirst({
            where: {
                id: companyId,
                organizationId,
            },
            select: {
                id: true,
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        const now = new Date();
        const [peopleCount, branchCount, socialChannelCount, opportunityCount, openOpportunityCount, taskCount, activeTaskCount, meetingCount, upcomingMeetingCount, activityCount, legalDocumentCount,] = await Promise.all([
            this.prisma.person.count({
                where: {
                    companyId,
                    company: { organizationId },
                },
            }),
            this.prisma.companyBranch.count({
                where: {
                    companyId,
                    company: { organizationId },
                },
            }),
            this.prisma.companySocialChannel.count({
                where: {
                    companyId,
                    company: { organizationId },
                },
            }),
            this.prisma.opportunity.count({
                where: {
                    companyId,
                    organizationId,
                },
            }),
            this.prisma.opportunity.count({
                where: {
                    companyId,
                    organizationId,
                    stage: {
                        isTerminal: false,
                    },
                },
            }),
            this.prisma.task.count({
                where: {
                    companyId,
                    organizationId,
                },
            }),
            this.prisma.task.count({
                where: {
                    companyId,
                    organizationId,
                    status: {
                        in: [client_1.TaskStatus.TODO, client_1.TaskStatus.IN_PROGRESS],
                    },
                },
            }),
            this.prisma.meeting.count({
                where: {
                    companyId,
                    organizationId,
                },
            }),
            this.prisma.meeting.count({
                where: {
                    companyId,
                    organizationId,
                    status: client_1.MeetingStatus.SCHEDULED,
                    startAt: {
                        gte: now,
                    },
                },
            }),
            this.prisma.activity.count({
                where: {
                    companyId,
                    company: { organizationId },
                },
            }),
            this.prisma.companyLegalDocument.count({
                where: {
                    companyId,
                    company: { organizationId },
                },
            }),
        ]);
        return {
            companyId,
            generatedAt: new Date().toISOString(),
            summary: {
                peopleCount,
                branchCount,
                socialChannelCount,
                opportunityCount,
                openOpportunityCount,
                taskCount,
                activeTaskCount,
                meetingCount,
                upcomingMeetingCount,
                activityCount,
                legalDocumentCount,
            },
        };
    }
};
exports.CompanyOverviewService = CompanyOverviewService;
exports.CompanyOverviewService = CompanyOverviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyOverviewService);
//# sourceMappingURL=company-overview.service.js.map