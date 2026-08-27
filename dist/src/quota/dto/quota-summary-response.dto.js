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
exports.QuotaSummaryDto = exports.QuotaSummaryMetricDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const quota_resolver_service_1 = require("../quota-resolver.service");
class QuotaSummaryMetricDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { metric: { required: true, type: () => Object }, state: { required: true, type: () => Object }, current: { required: true, type: () => String }, softLimit: { required: true, type: () => String, nullable: true }, hardLimit: { required: true, type: () => String, nullable: true }, resetPeriod: { required: true, type: () => Object }, resetAt: { required: true, type: () => String, nullable: true }, threshold: { required: true, type: () => Number, nullable: true } };
    }
}
exports.QuotaSummaryMetricDto = QuotaSummaryMetricDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.QuotaMetric, enumName: 'QuotaMetric' }),
    __metadata("design:type", String)
], QuotaSummaryMetricDto.prototype, "metric", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: quota_resolver_service_1.QUOTA_CONFIGURATION_STATES, enumName: 'QuotaConfigurationState' }),
    __metadata("design:type", String)
], QuotaSummaryMetricDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, pattern: '^(0|[1-9]\\d*)$' }),
    __metadata("design:type", String)
], QuotaSummaryMetricDto.prototype, "current", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true, pattern: '^(0|[1-9]\\d*)$' }),
    __metadata("design:type", Object)
], QuotaSummaryMetricDto.prototype, "softLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, nullable: true, pattern: '^(0|[1-9]\\d*)$' }),
    __metadata("design:type", Object)
], QuotaSummaryMetricDto.prototype, "hardLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.QuotaResetPeriod, enumName: 'QuotaResetPeriod' }),
    __metadata("design:type", String)
], QuotaSummaryMetricDto.prototype, "resetPeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, format: 'date-time', nullable: true }),
    __metadata("design:type", Object)
], QuotaSummaryMetricDto.prototype, "resetAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Number, nullable: true, enum: [80, 90] }),
    __metadata("design:type", Object)
], QuotaSummaryMetricDto.prototype, "threshold", void 0);
class QuotaSummaryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String }, generatedAt: { required: true, type: () => String }, metrics: { required: true, type: () => [require("./quota-summary-response.dto").QuotaSummaryMetricDto] } };
    }
}
exports.QuotaSummaryDto = QuotaSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, format: 'uuid' }),
    __metadata("design:type", String)
], QuotaSummaryDto.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String, format: 'date-time' }),
    __metadata("design:type", String)
], QuotaSummaryDto.prototype, "generatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [QuotaSummaryMetricDto] }),
    __metadata("design:type", Array)
], QuotaSummaryDto.prototype, "metrics", void 0);
//# sourceMappingURL=quota-summary-response.dto.js.map