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
exports.CompanyOverviewController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const company_overview_service_1 = require("./company-overview.service");
let CompanyOverviewController = class CompanyOverviewController {
    constructor(companyOverviewService) {
        this.companyOverviewService = companyOverviewService;
    }
    getOverview(id, user) {
        return this.companyOverviewService.getOverview(id, user);
    }
};
exports.CompanyOverviewController = CompanyOverviewController;
__decorate([
    (0, common_1.Get)(':id/overview'),
    (0, permissions_decorator_1.Permissions)('company:view'),
    openapi.ApiResponse({ status: 200, type: require("./dto/company-overview.dto").CompanyOverviewDto }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompanyOverviewController.prototype, "getOverview", null);
exports.CompanyOverviewController = CompanyOverviewController = __decorate([
    (0, common_1.Controller)('companies'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [company_overview_service_1.CompanyOverviewService])
], CompanyOverviewController);
//# sourceMappingURL=company-overview.controller.js.map