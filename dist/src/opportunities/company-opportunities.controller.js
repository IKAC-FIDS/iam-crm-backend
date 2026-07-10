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
exports.CompanyOpportunitiesController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const create_company_opportunity_dto_1 = require("./dto/create-company-opportunity.dto");
const find_opportunities_dto_1 = require("./dto/find-opportunities.dto");
const opportunities_service_1 = require("./opportunities.service");
let CompanyOpportunitiesController = class CompanyOpportunitiesController {
    constructor(service) {
        this.service = service;
    }
    findAll(companyId, query, user) {
        return this.service.findByCompany(companyId, query, user);
    }
    create(companyId, dto, user) {
        return this.service.create({ ...dto, companyId }, user);
    }
};
exports.CompanyOpportunitiesController = CompanyOpportunitiesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('opportunity:view'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, find_opportunities_dto_1.FindOpportunitiesDto, Object]),
    __metadata("design:returntype", void 0)
], CompanyOpportunitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('opportunity:create'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_company_opportunity_dto_1.CreateCompanyOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], CompanyOpportunitiesController.prototype, "create", null);
exports.CompanyOpportunitiesController = CompanyOpportunitiesController = __decorate([
    (0, common_1.Controller)('companies/:companyId/opportunities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [opportunities_service_1.OpportunitiesService])
], CompanyOpportunitiesController);
//# sourceMappingURL=company-opportunities.controller.js.map