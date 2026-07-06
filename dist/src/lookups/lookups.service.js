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
exports.LookupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const lookup_groups_1 = require("./lookup-groups");
let LookupsService = class LookupsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(groupValue, active = true) {
        const group = this.parseGroup(groupValue);
        return this.prisma.lookupOption.findMany({
            where: { group, isActive: active },
            orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        });
    }
    async create(groupValue, dto) {
        const group = this.parseGroup(groupValue);
        const existing = await this.prisma.lookupOption.findUnique({ where: { group_code: { group, code: dto.code } } });
        if (existing)
            throw new common_1.ConflictException('Lookup code already exists in this group');
        return this.prisma.lookupOption.create({ data: { group, ...dto } });
    }
    async update(groupValue, id, dto) {
        const group = this.parseGroup(groupValue);
        await this.findOne(group, id);
        if (dto.code) {
            const existing = await this.prisma.lookupOption.findFirst({ where: { group, code: dto.code, NOT: { id } } });
            if (existing)
                throw new common_1.ConflictException('Lookup code already exists in this group');
        }
        return this.prisma.lookupOption.update({ where: { id }, data: dto });
    }
    async remove(groupValue, id) {
        const group = this.parseGroup(groupValue);
        await this.findOne(group, id);
        return this.prisma.lookupOption.update({ where: { id }, data: { isActive: false } });
    }
    async findOne(group, id) {
        const item = await this.prisma.lookupOption.findFirst({ where: { id, group } });
        if (!item)
            throw new common_1.NotFoundException('Lookup option not found in this group');
        return item;
    }
    parseGroup(value) {
        if (!lookup_groups_1.LOOKUP_GROUPS.includes(value)) {
            throw new common_1.BadRequestException(`Invalid lookup group. Allowed groups: ${lookup_groups_1.LOOKUP_GROUPS.join(', ')}`);
        }
        return value;
    }
};
exports.LookupsService = LookupsService;
exports.LookupsService = LookupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LookupsService);
//# sourceMappingURL=lookups.service.js.map