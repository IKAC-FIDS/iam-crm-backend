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
exports.FeatureKey = exports.EntitlementMaintenanceDto = exports.SetEntitlementOverrideDto = exports.UpdateSubscriptionDto = exports.TransitionSubscriptionDto = exports.CreateSubscriptionDto = exports.SetPlanFeatureDto = exports.UpdatePlanDto = exports.CreatePlanDto = void 0;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "FeatureKey", { enumerable: true, get: function () { return client_1.FeatureKey; } });
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const trim = ({ value }) => typeof value === 'string' ? value.trim() : value;
const code = ({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value;
class CreatePlanDto {
}
exports.CreatePlanDto = CreatePlanDto;
__decorate([
    (0, class_transformer_1.Transform)(code),
    (0, class_validator_1.Matches)(/^[A-Z][A-Z0-9_]*$/),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreatePlanDto.prototype, "code", void 0);
__decorate([
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreatePlanDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreatePlanDto.prototype, "description", void 0);
class UpdatePlanDto {
}
exports.UpdatePlanDto = UpdatePlanDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdatePlanDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdatePlanDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePlanDto.prototype, "isActive", void 0);
class SetPlanFeatureDto {
}
exports.SetPlanFeatureDto = SetPlanFeatureDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetPlanFeatureDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SetPlanFeatureDto.prototype, "value", void 0);
class CreateSubscriptionDto {
}
exports.CreateSubscriptionDto = CreateSubscriptionDto;
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "planId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SubscriptionType),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SubscriptionStatus),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "startAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "endAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "gracePeriodEndAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "contractReference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateSubscriptionDto.prototype, "internalNote", void 0);
class TransitionSubscriptionDto {
}
exports.TransitionSubscriptionDto = TransitionSubscriptionDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SubscriptionStatus),
    __metadata("design:type", String)
], TransitionSubscriptionDto.prototype, "status", void 0);
class UpdateSubscriptionDto {
}
exports.UpdateSubscriptionDto = UpdateSubscriptionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], UpdateSubscriptionDto.prototype, "planId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateSubscriptionDto.prototype, "startAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], UpdateSubscriptionDto.prototype, "endAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], UpdateSubscriptionDto.prototype, "gracePeriodEndAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateSubscriptionDto.prototype, "contractReference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateSubscriptionDto.prototype, "internalNote", void 0);
class SetEntitlementOverrideDto {
}
exports.SetEntitlementOverrideDto = SetEntitlementOverrideDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.EntitlementOverrideState),
    __metadata("design:type", String)
], SetEntitlementOverrideDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], SetEntitlementOverrideDto.prototype, "reason", void 0);
class EntitlementMaintenanceDto {
}
exports.EntitlementMaintenanceDto = EntitlementMaintenanceDto;
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], EntitlementMaintenanceDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    __metadata("design:type", String)
], EntitlementMaintenanceDto.prototype, "planId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SubscriptionType),
    __metadata("design:type", String)
], EntitlementMaintenanceDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], EntitlementMaintenanceDto.prototype, "durationDays", void 0);
//# sourceMappingURL=entitlement.dto.js.map