"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerAccessModule = void 0;
const common_1 = require("@nestjs/common");
const customer_access_service_1 = require("./customer-access.service");
const portal_jwt_strategy_1 = require("./portal-jwt.strategy");
const portal_roles_guard_1 = require("./portal-roles.guard");
let CustomerAccessModule = class CustomerAccessModule {
};
exports.CustomerAccessModule = CustomerAccessModule;
exports.CustomerAccessModule = CustomerAccessModule = __decorate([
    (0, common_1.Module)({
        providers: [customer_access_service_1.CustomerAccessService, portal_jwt_strategy_1.PortalJwtStrategy, portal_roles_guard_1.PortalRolesGuard],
        exports: [customer_access_service_1.CustomerAccessService, portal_roles_guard_1.PortalRolesGuard],
    })
], CustomerAccessModule);
//# sourceMappingURL=customer-access.module.js.map