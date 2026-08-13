"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitlementsModule = void 0;
const common_1 = require("@nestjs/common");
const platform_authority_module_1 = require("../platform-authority/platform-authority.module");
const entitlement_service_1 = require("./entitlement.service");
const feature_guard_1 = require("./feature.guard");
const platform_entitlements_service_1 = require("./platform-entitlements.service");
const entitlements_controller_1 = require("./entitlements.controller");
let EntitlementsModule = class EntitlementsModule {
};
exports.EntitlementsModule = EntitlementsModule;
exports.EntitlementsModule = EntitlementsModule = __decorate([
    (0, common_1.Module)({ imports: [platform_authority_module_1.PlatformAuthorityModule], controllers: [entitlements_controller_1.PlatformPlansController, entitlements_controller_1.PlatformSubscriptionsController, entitlements_controller_1.PlatformSubscriptionTransitionsController, entitlements_controller_1.TenantEntitlementsController], providers: [entitlement_service_1.EntitlementService, platform_entitlements_service_1.PlatformEntitlementsService, feature_guard_1.FeatureGuard], exports: [entitlement_service_1.EntitlementService, feature_guard_1.FeatureGuard] })
], EntitlementsModule);
//# sourceMappingURL=entitlements.module.js.map