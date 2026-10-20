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
exports.UniversitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UniversitiesService = class UniversitiesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(includeInactive = false) { return this.prisma.university.findMany({ where: includeInactive ? {} : { isActive: true }, orderBy: { name: 'asc' } }); }
    async findOne(id) { const item = await this.prisma.university.findUnique({ where: { id } }); if (!item)
        throw new common_1.NotFoundException('University not found'); return item; }
    async create(dto) {
        const name = dto.name.trim();
        const code = dto.code?.trim().toUpperCase() || null;
        if (!name)
            throw new common_1.ConflictException('University name is required');
        const duplicate = await this.prisma.university.findFirst({ where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, ...(code ? [{ code }] : [])] } });
        if (duplicate)
            throw new common_1.ConflictException('University name or code already exists');
        return this.prisma.university.create({ data: { name, code, description: dto.description?.trim() || undefined, isActive: dto.isActive ?? true } });
    }
    async update(id, dto) {
        await this.findOne(id);
        const name = dto.name?.trim();
        const code = dto.code !== undefined ? dto.code.trim().toUpperCase() || null : undefined;
        if (name || code) {
            const duplicate = await this.prisma.university.findFirst({ where: { NOT: { id }, OR: [...(name ? [{ name: { equals: name, mode: 'insensitive' } }] : []), ...(code ? [{ code }] : [])] } });
            if (duplicate)
                throw new common_1.ConflictException('University name or code already exists');
        }
        return this.prisma.university.update({ where: { id }, data: { ...(name !== undefined && { name }), ...(code !== undefined && { code }), ...(dto.description !== undefined && { description: dto.description.trim() || null }), ...(dto.isActive !== undefined && { isActive: dto.isActive }) } });
    }
    async deactivate(id) { await this.findOne(id); return this.prisma.university.update({ where: { id }, data: { isActive: false } }); }
};
exports.UniversitiesService = UniversitiesService;
exports.UniversitiesService = UniversitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UniversitiesService);
//# sourceMappingURL=universities.service.js.map