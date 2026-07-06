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
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
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
        return safeUser;
    }
    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                team: true,
                isActive: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                team: true,
                isActive: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('کاربر پیدا نشد');
        }
        return user;
    }
    async deactivate(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('کاربر پیدا نشد');
        }
        return this.prisma.user.update({
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
    }
    async activate(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('کاربر پیدا نشد');
        }
        if (user.isActive) {
            throw new common_1.BadRequestException('کاربر قبلاً فعال است');
        }
        return this.prisma.user.update({
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
    }
    async updateUserRole(id, dto) {
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
        return updatedUser;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map