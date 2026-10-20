"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalAuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const customer_access_module_1 = require("../customer-access/customer-access.module");
const refresh_token_service_1 = require("../auth/refresh-token.service");
const portal_auth_controller_1 = require("./portal-auth.controller");
const portal_auth_service_1 = require("./portal-auth.service");
let PortalAuthModule = class PortalAuthModule {
};
exports.PortalAuthModule = PortalAuthModule;
exports.PortalAuthModule = PortalAuthModule = __decorate([
    (0, common_1.Module)({
        imports: [customer_access_module_1.CustomerAccessModule, jwt_1.JwtModule.registerAsync({ imports: [config_1.ConfigModule], inject: [config_1.ConfigService], useFactory: (config) => ({ secret: config.get('JWT_SECRET') }) })],
        controllers: [portal_auth_controller_1.PortalAuthController],
        providers: [portal_auth_service_1.PortalAuthService, refresh_token_service_1.RefreshTokenService],
        exports: [portal_auth_service_1.PortalAuthService],
    })
], PortalAuthModule);
//# sourceMappingURL=portal-auth.module.js.map