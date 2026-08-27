"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyOverviewDto = exports.CompanyOverviewSummaryDto = void 0;
const openapi = require("@nestjs/swagger");
class CompanyOverviewSummaryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { peopleCount: { required: true, type: () => Number }, branchCount: { required: true, type: () => Number }, socialChannelCount: { required: true, type: () => Number }, opportunityCount: { required: true, type: () => Number }, openOpportunityCount: { required: true, type: () => Number }, taskCount: { required: true, type: () => Number }, activeTaskCount: { required: true, type: () => Number }, meetingCount: { required: true, type: () => Number }, upcomingMeetingCount: { required: true, type: () => Number }, activityCount: { required: true, type: () => Number }, legalDocumentCount: { required: true, type: () => Number } };
    }
}
exports.CompanyOverviewSummaryDto = CompanyOverviewSummaryDto;
class CompanyOverviewDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { companyId: { required: true, type: () => String }, generatedAt: { required: true, type: () => String }, summary: { required: true, type: () => require("./company-overview.dto").CompanyOverviewSummaryDto } };
    }
}
exports.CompanyOverviewDto = CompanyOverviewDto;
//# sourceMappingURL=company-overview.dto.js.map