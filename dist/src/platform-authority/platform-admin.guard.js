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
exports.PlatformAdminGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const prisma_service_1 = require("../prisma/prisma.service");
let PlatformAdminGuard = class PlatformAdminGuard extends (0, passport_1.AuthGuard)('platform-jwt') {
    constructor(prisma) {
        super();
        this.prisma = prisma;
    }
    async canActivate(context) {
        const authenticated = await super.canActivate(context);
        if (!authenticated)
            return false;
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;
        if (!userId) {
            throw new common_1.ForbiddenException('Platform administration access denied');
        }
        const authority = await this.prisma.platformAuthority.findUnique({
            where: { userId },
            select: { role: true, user: { select: { isActive: true } } },
        });
        if (!authority?.user.isActive || authority.role !== 'PLATFORM_ADMIN') {
            throw new common_1.ForbiddenException('Platform administration access denied');
        }
        request.platformContext = {
            userId,
            platformAdmin: true,
            platformRole: authority.role,
            requestId: request.requestId ?? null,
        };
        return true;
    }
};
exports.PlatformAdminGuard = PlatformAdminGuard;
exports.PlatformAdminGuard = PlatformAdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlatformAdminGuard);
//# sourceMappingURL=platform-admin.guard.js.map