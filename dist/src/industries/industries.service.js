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
exports.IndustriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let IndustriesService = class IndustriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existing = await this.prisma.industry.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException('صنعتی با این نام قبلاً وجود دارد');
        }
        return this.prisma.industry.create({
            data: {
                name: dto.name,
                description: dto.description,
                painPoints: {
                    create: dto.painPointIds?.map((id) => ({ painPointId: id })) || [],
                },
                useCases: {
                    create: dto.useCaseIds?.map((id) => ({ useCaseId: id })) || [],
                },
            },
            include: {
                painPoints: { include: { painPoint: true } },
                useCases: { include: { useCase: true } },
            },
        });
    }
    async findAll() {
        return this.prisma.industry.findMany({
            orderBy: { name: 'asc' },
            include: {
                painPoints: { include: { painPoint: true } },
                useCases: { include: { useCase: true } },
            },
        });
    }
    async findOne(id) {
        const industry = await this.prisma.industry.findUnique({
            where: { id },
            include: {
                painPoints: { include: { painPoint: true } },
                useCases: { include: { useCase: true } },
            },
        });
        if (!industry) {
            throw new common_1.NotFoundException('صنعت پیدا نشد');
        }
        return industry;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.name) {
            const existing = await this.prisma.industry.findFirst({
                where: { name: dto.name, NOT: { id } },
            });
            if (existing) {
                throw new common_1.ConflictException('صنعتی با این نام قبلاً وجود دارد');
            }
        }
        const updateData = {
            name: dto.name,
            description: dto.description,
        };
        if (dto.painPointIds !== undefined) {
            updateData.painPoints = {
                deleteMany: {},
                create: dto.painPointIds.map((id) => ({ painPointId: id })),
            };
        }
        if (dto.useCaseIds !== undefined) {
            updateData.useCases = {
                deleteMany: {},
                create: dto.useCaseIds.map((id) => ({ useCaseId: id })),
            };
        }
        return this.prisma.industry.update({
            where: { id },
            data: updateData,
            include: {
                painPoints: { include: { painPoint: true } },
                useCases: { include: { useCase: true } },
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.industry.delete({ where: { id } });
    }
};
exports.IndustriesService = IndustriesService;
exports.IndustriesService = IndustriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IndustriesService);
//# sourceMappingURL=industries.service.js.map