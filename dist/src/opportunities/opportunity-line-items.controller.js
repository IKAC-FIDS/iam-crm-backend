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
exports.OpportunityLineItemsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const create_opportunity_line_item_dto_1 = require("./dto/create-opportunity-line-item.dto");
const update_opportunity_line_item_dto_1 = require("./dto/update-opportunity-line-item.dto");
const opportunity_line_items_service_1 = require("./opportunity-line-items.service");
let OpportunityLineItemsController = class OpportunityLineItemsController {
    constructor(service) {
        this.service = service;
    }
    findAll(opportunityId, user) {
        return this.service.findAll(opportunityId, user);
    }
    create(opportunityId, dto, user) {
        return this.service.create(opportunityId, dto, user);
    }
    findOne(opportunityId, lineItemId, user) {
        return this.service.findOne(opportunityId, lineItemId, user);
    }
    update(opportunityId, lineItemId, dto, user) {
        return this.service.update(opportunityId, lineItemId, dto, user);
    }
    remove(opportunityId, lineItemId, user) {
        return this.service.remove(opportunityId, lineItemId, user);
    }
};
exports.OpportunityLineItemsController = OpportunityLineItemsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('opportunity-line-item:view'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpportunityLineItemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('opportunity-line-item:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_opportunity_line_item_dto_1.CreateOpportunityLineItemDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunityLineItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':lineItemId'),
    (0, permissions_decorator_1.Permissions)('opportunity-line-item:view'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('lineItemId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OpportunityLineItemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':lineItemId'),
    (0, permissions_decorator_1.Permissions)('opportunity-line-item:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('lineItemId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_opportunity_line_item_dto_1.UpdateOpportunityLineItemDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunityLineItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':lineItemId'),
    (0, permissions_decorator_1.Permissions)('opportunity-line-item:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('lineItemId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OpportunityLineItemsController.prototype, "remove", null);
exports.OpportunityLineItemsController = OpportunityLineItemsController = __decorate([
    (0, common_1.Controller)('opportunities/:opportunityId/line-items'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [opportunity_line_items_service_1.OpportunityLineItemsService])
], OpportunityLineItemsController);
//# sourceMappingURL=opportunity-line-items.controller.js.map