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
exports.LeadSourcesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LeadSourcesService = class LeadSourcesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(active = true) {
        return this.prisma.leadSource.findMany({
            where: { isActive: active },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });
    }
    async create(dto) {
        const existing = await this.prisma.leadSource.findUnique({ where: { code: dto.code } });
        if (existing)
            throw new common_1.ConflictException('Lead source code already exists');
        return this.prisma.leadSource.create({ data: dto });
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.code) {
            const existing = await this.prisma.leadSource.findFirst({ where: { code: dto.code, NOT: { id } } });
            if (existing)
                throw new common_1.ConflictException('Lead source code already exists');
        }
        return this.prisma.leadSource.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.leadSource.update({ where: { id }, data: { isActive: false } });
    }
    async findOne(id) {
        const item = await this.prisma.leadSource.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Lead source not found');
        return item;
    }
};
exports.LeadSourcesService = LeadSourcesService;
exports.LeadSourcesService = LeadSourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadSourcesService);
//# sourceMappingURL=lead-sources.service.js.map