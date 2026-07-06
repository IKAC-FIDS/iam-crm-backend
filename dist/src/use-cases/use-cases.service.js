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
exports.UseCasesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UseCasesService = class UseCasesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.useCase.create({
            data: {
                title: dto.title,
                description: dto.description,
                category: dto.category,
            },
        });
    }
    async findAll() {
        return this.prisma.useCase.findMany({
            orderBy: { title: 'asc' },
            include: {
                industries: {
                    include: {
                        industry: true,
                    },
                },
            },
        });
    }
    async findOne(id) {
        const useCase = await this.prisma.useCase.findUnique({
            where: { id },
            include: {
                industries: {
                    include: {
                        industry: true,
                    },
                },
            },
        });
        if (!useCase) {
            throw new common_1.NotFoundException('Use Case پیدا نشد');
        }
        return useCase;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.useCase.update({
            where: { id },
            data: {
                title: dto.title,
                description: dto.description,
                category: dto.category,
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.useCase.delete({ where: { id } });
    }
};
exports.UseCasesService = UseCasesService;
exports.UseCasesService = UseCasesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UseCasesService);
//# sourceMappingURL=use-cases.service.js.map