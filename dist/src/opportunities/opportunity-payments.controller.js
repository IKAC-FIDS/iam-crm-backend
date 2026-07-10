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
exports.OpportunityPaymentsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const create_opportunity_payment_dto_1 = require("./dto/create-opportunity-payment.dto");
const find_opportunity_payments_dto_1 = require("./dto/find-opportunity-payments.dto");
const mark_payment_paid_dto_1 = require("./dto/mark-payment-paid.dto");
const update_opportunity_payment_dto_1 = require("./dto/update-opportunity-payment.dto");
const opportunity_payments_service_1 = require("./opportunity-payments.service");
let OpportunityPaymentsController = class OpportunityPaymentsController {
    constructor(service) {
        this.service = service;
    }
    findAll(opportunityId, query, user) {
        return this.service.findAll(opportunityId, query, user);
    }
    create(opportunityId, dto, user) {
        return this.service.create(opportunityId, dto, user);
    }
    findOne(opportunityId, paymentId, user) {
        return this.service.findOne(opportunityId, paymentId, user);
    }
    update(opportunityId, paymentId, dto, user) {
        return this.service.update(opportunityId, paymentId, dto, user);
    }
    markPaid(opportunityId, paymentId, dto, user) {
        return this.service.markPaid(opportunityId, paymentId, dto, user);
    }
    cancel(opportunityId, paymentId, user) {
        return this.service.cancel(opportunityId, paymentId, user);
    }
    remove(opportunityId, paymentId, user) {
        return this.service.remove(opportunityId, paymentId, user);
    }
};
exports.OpportunityPaymentsController = OpportunityPaymentsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('payment:view'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, find_opportunity_payments_dto_1.FindOpportunityPaymentsDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunityPaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('payment:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_opportunity_payment_dto_1.CreateOpportunityPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunityPaymentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':paymentId'),
    (0, permissions_decorator_1.Permissions)('payment:view'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OpportunityPaymentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':paymentId'),
    (0, permissions_decorator_1.Permissions)('payment:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_opportunity_payment_dto_1.UpdateOpportunityPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunityPaymentsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':paymentId/mark-paid'),
    (0, permissions_decorator_1.Permissions)('payment:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, mark_payment_paid_dto_1.MarkPaymentPaidDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunityPaymentsController.prototype, "markPaid", null);
__decorate([
    (0, common_1.Patch)(':paymentId/cancel'),
    (0, permissions_decorator_1.Permissions)('payment:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OpportunityPaymentsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Delete)(':paymentId'),
    (0, permissions_decorator_1.Permissions)('payment:manage'),
    __param(0, (0, common_1.Param)('opportunityId')),
    __param(1, (0, common_1.Param)('paymentId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OpportunityPaymentsController.prototype, "remove", null);
exports.OpportunityPaymentsController = OpportunityPaymentsController = __decorate([
    (0, common_1.Controller)('opportunities/:opportunityId/payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [opportunity_payments_service_1.OpportunityPaymentsService])
], OpportunityPaymentsController);
//# sourceMappingURL=opportunity-payments.controller.js.map