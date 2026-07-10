"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const jwt_strategy_1 = require("./jwt.strategy");
const refresh_token_service_1 = require("./refresh-token.service");
const sessions_controller_1 = require("./sessions.controller");
const sessions_service_1 = require("./sessions.service");
const account_security_controller_1 = require("./account-security.controller");
const account_security_service_1 = require("./account-security.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRES_IN') || '15m',
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            refresh_token_service_1.RefreshTokenService,
            sessions_service_1.SessionsService,
            account_security_service_1.AccountSecurityService,
        ],
        controllers: [
            auth_controller_1.AuthController,
            sessions_controller_1.SessionsController,
            account_security_controller_1.AccountSecurityController,
        ],
        exports: [
            auth_service_1.AuthService,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map