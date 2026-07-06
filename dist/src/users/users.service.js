"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const safeUserSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    team: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};
let UsersService = class UsersService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto, actorId) {
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                fullName: dto.fullName,
                email: dto.email,
                passwordHash,
                role: dto.role,
                team: dto.team,
            },
        });
        const { passwordHash: _omit, ...safeUser } = user;
        await this.audit.record({ actorId, entityType: 'user', entityId: user.id, action: 'user.created', after: safeUser });
        return safeUser;
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const search = query.search?.trim();
        const where = {
            ...(query.role && { role: query.role }),
            ...(query.team?.trim() && { team: query.team.trim() }),
            ...(query.isActive !== undefined && { isActive: query.isActive }),
            ...(search && {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: safeUserSelect,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 },
        };
    }
    getOwnerOptions(user) {
        if (user.role !== client_1.UserRole.ADMIN && user.role !== client_1.UserRole.MANAGER) {
            throw new common_1.ForbiddenException('You do not have access to owner options');
        }
        const teamScope = user.role === client_1.UserRole.MANAGER
            ? user.team ? { team: user.team } : { id: { in: [] } }
            : {};
        return this.prisma.user.findMany({
            where: {
                isActive: true,
                role: { in: [client_1.UserRole.REP, client_1.UserRole.MANAGER] },
                ...teamScope,
            },
            select: { id: true, fullName: true, email: true, role: true, team: true, isActive: true },
            orderBy: [{ fullName: 'asc' }, { email: 'asc' }],
        });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: safeUserSelect,
        });
        if (!user) {
            throw new common_1.NotFoundException('کاربر پیدا نشد');
        }
        return user;
    }
    async deactivate(id, actorId) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('کاربر پیدا نشد');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                team: true,
                isActive: true,
            },
        });
        await this.audit.record({ actorId, entityType: 'user', entityId: id, action: 'user.deactivated', before: user, after: updated });
        return updated;
    }
    async activate(id, actorId) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('کاربر پیدا نشد');
        }
        if (user.isActive) {
            throw new common_1.BadRequestException('کاربر قبلاً فعال است');
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: { isActive: true },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                team: true,
                isActive: true,
            },
        });
        await this.audit.record({ actorId, entityType: 'user', entityId: id, action: 'user.activated', before: user, after: updated });
        return updated;
    }
    async updateUserRole(id, dto, actorId) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { ownedCompanies: { select: { id: true } } },
        });
        if (!user) {
            throw new common_1.NotFoundException('کاربر پیدا نشد');
        }
        if (dto.role === client_1.UserRole.MANAGER && user.ownedCompanies.length > 0 && !dto.team) {
            throw new common_1.BadRequestException('برای تبدیل به MANAGER، باید تیم مشخص شود');
        }
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                role: dto.role,
                team: dto.team ?? user.team,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                team: true,
                isActive: true,
            },
        });
        permissions_guard_1.PermissionsGuard.clearCache(dto.role);
        permissions_guard_1.PermissionsGuard.clearCache(user.role);
        await this.audit.record({ actorId, entityType: 'user', entityId: id, action: 'user.role_changed', before: user, after: updatedUser });
        return updatedUser;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_log_service_1.AuditLogService])
], UsersService);
//# sourceMappingURL=users.service.js.map