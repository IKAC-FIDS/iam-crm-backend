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
exports.AdvancedReportFiltersDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const report_filters_dto_1 = require("./report-filters.dto");
const csv = ({ value }) => value == null || value === ""
    ? undefined
    : (Array.isArray(value) ? value : String(value).split(","))
        .map(String)
        .map((v) => v.trim())
        .filter(Boolean);
class AdvancedReportFiltersDto extends report_filters_dto_1.ReportFiltersDto {
    constructor() {
        super(...arguments);
        this.page = 1;
        this.limit = 20;
    }
}
exports.AdvancedReportFiltersDto = AdvancedReportFiltersDto;
__decorate([
    (0, class_transformer_1.Transform)(csv),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.MeetingStatus, { each: true }),
    __metadata("design:type", Array)
], AdvancedReportFiltersDto.prototype, "meetingStatuses", void 0);
__decorate([
    (0, class_transformer_1.Transform)(csv),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.MeetingMode, { each: true }),
    __metadata("design:type", Array)
], AdvancedReportFiltersDto.prototype, "meetingModes", void 0);
__decorate([
    (0, class_transformer_1.Transform)(csv),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.TaskStatus, { each: true }),
    __metadata("design:type", Array)
], AdvancedReportFiltersDto.prototype, "taskStatuses", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Object)
], AdvancedReportFiltersDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Object)
], AdvancedReportFiltersDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdvancedReportFiltersDto.prototype, "trend", void 0);
//# sourceMappingURL=advanced-report-filters.dto.js.map