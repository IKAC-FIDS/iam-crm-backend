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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const client_1 = require("@prisma/client");
const reports_service_1 = require("./reports.service");
const class_validator_1 = require("class-validator");
class ActivityReportQueryDto {
}
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActivityReportQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActivityReportQueryDto.prototype, "endDate", void 0);
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getConversionRates() {
        return this.reportsService.getConversionRates();
    }
    getAverageStageDuration() {
        return this.reportsService.getAverageStageDuration();
    }
    getPipelineSummary() {
        return this.reportsService.getPipelineSummary();
    }
    getActivityReport(query) {
        const startDate = query.startDate
            ? new Date(query.startDate)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = query.endDate
            ? new Date(query.endDate)
            : new Date();
        return this.reportsService.getActivityReport(startDate, endDate);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('conversion-rates'),
    (0, permissions_decorator_1.Permissions)('report:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getConversionRates", null);
__decorate([
    (0, common_1.Get)('stage-durations'),
    (0, permissions_decorator_1.Permissions)('report:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getAverageStageDuration", null);
__decorate([
    (0, common_1.Get)('pipeline-summary'),
    (0, permissions_decorator_1.Permissions)('report:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPipelineSummary", null);
__decorate([
    (0, common_1.Get)('activities'),
    (0, permissions_decorator_1.Permissions)('report:view'),
    __param(0, (0, common_1.Query)(new common_1.ValidationPipe({ transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ActivityReportQueryDto]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getActivityReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.BOARDS),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map