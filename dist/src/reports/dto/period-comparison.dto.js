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
exports.PeriodComparisonDto = exports.ComparisonMode = void 0;
const class_validator_1 = require("class-validator");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
const report_filters_dto_1 = require("./report-filters.dto");
var ComparisonMode;
(function (ComparisonMode) {
    ComparisonMode["PREVIOUS_PERIOD"] = "PREVIOUS_PERIOD";
    ComparisonMode["PREVIOUS_YEAR"] = "PREVIOUS_YEAR";
    ComparisonMode["CUSTOM"] = "CUSTOM";
})(ComparisonMode || (exports.ComparisonMode = ComparisonMode = {}));
class PeriodComparisonDto extends report_filters_dto_1.ReportFiltersDto {
    constructor() {
        super(...arguments);
        this.comparisonMode = ComparisonMode.PREVIOUS_PERIOD;
    }
}
exports.PeriodComparisonDto = PeriodComparisonDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ComparisonMode),
    __metadata("design:type", String)
], PeriodComparisonDto.prototype, "comparisonMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], PeriodComparisonDto.prototype, "compareStartDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], PeriodComparisonDto.prototype, "compareEndDate", void 0);
//# sourceMappingURL=period-comparison.dto.js.map