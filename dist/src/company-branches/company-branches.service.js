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
exports.CompanyBranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CompanyBranchesService = class CompanyBranchesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validateCompanyAccess(companyId, user) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { ownerId: true, owner: { select: { team: true } } },
        });
        if (!company) {
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        }
        if (user.role === client_1.UserRole.ADMIN)
            return;
        if (user.role === client_1.UserRole.MANAGER) {
            const companyTeam = company.owner?.team;
            if (!companyTeam || companyTeam !== user.team) {
                throw new common_1.ForbiddenException('شما به این شرکت دسترسی ندارید');
            }
            return;
        }
        if (user.role === client_1.UserRole.REP && company.ownerId !== user.userId) {
            throw new common_1.ForbiddenException('شما به این شرکت دسترسی ندارید');
        }
    }
    async create(companyId, dto, user) {
        await this.validateCompanyAccess(companyId, user);
        return this.prisma.companyBranch.create({
            data: {
                companyId,
                name: dto.name,
                city: dto.city,
                address: dto.address,
                phone: dto.phone,
            },
        });
    }
    async findByCompany(companyId, user) {
        await this.validateCompanyAccess(companyId, user);
        return this.prisma.companyBranch.findMany({
            where: { companyId },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id, user) {
        const branch = await this.prisma.companyBranch.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!branch) {
            throw new common_1.NotFoundException('شعبه پیدا نشد');
        }
        await this.validateCompanyAccess(branch.companyId, user);
        return branch;
    }
    async update(id, dto, user) {
        const branch = await this.prisma.companyBranch.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!branch) {
            throw new common_1.NotFoundException('شعبه پیدا نشد');
        }
        await this.validateCompanyAccess(branch.companyId, user);
        return this.prisma.companyBranch.update({
            where: { id },
            data: {
                name: dto.name,
                city: dto.city,
                address: dto.address,
                phone: dto.phone,
            },
        });
    }
    async remove(id, user) {
        const branch = await this.prisma.companyBranch.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!branch) {
            throw new common_1.NotFoundException('شعبه پیدا نشد');
        }
        await this.validateCompanyAccess(branch.companyId, user);
        return this.prisma.companyBranch.delete({
            where: { id },
        });
    }
};
exports.CompanyBranchesService = CompanyBranchesService;
exports.CompanyBranchesService = CompanyBranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyBranchesService);
//# sourceMappingURL=company-branches.service.js.map