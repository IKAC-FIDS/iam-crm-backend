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
exports.PainPointsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PainPointsService = class PainPointsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.painPoint.create({
            data: {
                title: dto.title,
                description: dto.description,
                category: dto.category,
            },
        });
    }
    async findAll() {
        return this.prisma.painPoint.findMany({
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
        const painPoint = await this.prisma.painPoint.findUnique({
            where: { id },
            include: {
                industries: {
                    include: {
                        industry: true,
                    },
                },
            },
        });
        if (!painPoint) {
            throw new common_1.NotFoundException('Pain Point پیدا نشد');
        }
        return painPoint;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.painPoint.update({
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
        return this.prisma.painPoint.delete({ where: { id } });
    }
};
exports.PainPointsService = PainPointsService;
exports.PainPointsService = PainPointsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PainPointsService);
//# sourceMappingURL=pain-points.service.js.map