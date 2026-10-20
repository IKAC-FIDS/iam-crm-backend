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
exports.PortalJwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const customer_access_service_1 = require("./customer-access.service");
let PortalJwtStrategy = class PortalJwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'portal-jwt') {
    constructor(config, access) {
        const secret = config.get('JWT_SECRET');
        if (!secret)
            throw new Error('JWT_SECRET is not configured');
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
            audience: 'neshane-op-portal',
        });
        this.access = access;
    }
    async validate(payload) {
        if (!payload.sub || !payload.email || payload.principalType !== 'CUSTOMER' || !payload.customerMembershipId) {
            throw new common_1.UnauthorizedException('Invalid portal token');
        }
        const membership = await this.access.resolve(payload.sub, payload.customerMembershipId);
        return {
            userId: membership.userId,
            email: membership.user.email,
            principalType: 'CUSTOMER',
            organizationId: membership.organizationId,
            companyId: membership.companyId,
            membershipId: membership.id,
            role: membership.role,
        };
    }
};
exports.PortalJwtStrategy = PortalJwtStrategy;
exports.PortalJwtStrategy = PortalJwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, customer_access_service_1.CustomerAccessService])
], PortalJwtStrategy);
//# sourceMappingURL=portal-jwt.strategy.js.map