"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAuthorityModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const platform_admin_guard_1 = require("./platform-admin.guard");
const platform_jwt_strategy_1 = require("./platform-jwt.strategy");
let PlatformAuthorityModule = class PlatformAuthorityModule {
};
exports.PlatformAuthorityModule = PlatformAuthorityModule;
exports.PlatformAuthorityModule = PlatformAuthorityModule = __decorate([
    (0, common_1.Module)({
        imports: [passport_1.PassportModule],
        providers: [platform_jwt_strategy_1.PlatformJwtStrategy, platform_admin_guard_1.PlatformAdminGuard],
        exports: [platform_admin_guard_1.PlatformAdminGuard],
    })
], PlatformAuthorityModule);
//# sourceMappingURL=platform-authority.module.js.map