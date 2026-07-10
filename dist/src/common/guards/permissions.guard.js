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
const node_cache_1 = __importDefault(require("node-cache"));
const prisma_service_1 = require("../../prisma/prisma.service");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const cache = new node_cache_1.default({ stdTTL: 600 });
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const policy = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        const normalizedPolicy = this.normalizePolicy(policy);
        if (!normalizedPolicy || normalizedPolicy.actions.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const requestUser = request.user;
        if (!requestUser?.userId) {
            throw new common_1.ForbiddenException('کاربر احراز هویت نشده است');
        }
        const dbUser = await this.prisma.user.findUnique({
            where: { id: requestUser.userId },
            select: {
                id: true,
                role: true,
                isActive: true,
            },
        });
        if (!dbUser || !dbUser.isActive) {
            throw new common_1.ForbiddenException('حساب کاربری فعال نیست');
        }
        const userPermissions = await this.getPermissionsForRole(dbUser.role);
        const allowed = normalizedPolicy.mode === 'any'
            ? normalizedPolicy.actions.some((permission) => userPermissions.has(permission))
            : normalizedPolicy.actions.every((permission) => userPermissions.has(permission));
        if (!allowed) {
            const missingPermissions = normalizedPolicy.actions.filter((permission) => !userPermissions.has(permission));
            throw new common_1.ForbiddenException(`شما دسترسی لازم برای این عملیات را ندارید: ${missingPermissions.join(', ')}`);
        }
        return true;
    }
    normalizePolicy(policy) {
        if (!policy) {
            return null;
        }
        if (Array.isArray(policy)) {
            return {
                actions: policy,
                mode: 'all',
            };
        }
        return {
            actions: policy.actions ?? [],
            mode: policy.mode ?? 'all',
        };
    }
    async getPermissionsForRole(role) {
        const cacheKey = `permissions:${role}`;
        let permissions = cache.get(cacheKey);
        if (!permissions) {
            const rolePermissions = await this.prisma.rolePermission.findMany({
                where: { role },
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
            return;
        }
        cache.flushAll();
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map