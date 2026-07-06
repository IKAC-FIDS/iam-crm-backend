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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 600 });
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('کاربر احراز هویت نشده است');
        }
        const userPermissions = await this.getPermissionsForRole(user.role);
        const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.has(perm));
        if (!hasAllPermissions) {
            throw new common_1.ForbiddenException(`شما دسترسی لازم برای این عملیات را ندارید: ${requiredPermissions.join(', ')}`);
        }
        return true;
    }
    async getPermissionsForRole(role) {
        const cacheKey = `permissions:${role}`;
        let permissions = cache.get(cacheKey);
        if (!permissions) {
            const rolePermissions = await this.prisma.rolePermission.findMany({
                where: { role: role },
                include: { permission: true },
            });
            permissions = rolePermissions.map((rp) => rp.permission.action);
            cache.set(cacheKey, permissions);
        }
        return new Set(permissions);
    }
    static clearCache(role) {
        if (role) {
            cache.del(`permissions:${role}`);
        }
        else {
            cache.flushAll();
        }
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map