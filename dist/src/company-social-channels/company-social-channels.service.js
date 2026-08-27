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
exports.CompanySocialChannelsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const company_access_service_1 = require("../companies/company-access.service");
const pagination_response_1 = require("../common/pagination/pagination.response");
const pagination_util_1 = require("../common/pagination/pagination.util");
let CompanySocialChannelsService = class CompanySocialChannelsService {
    constructor(prisma, companyAccess) {
        this.prisma = prisma;
        this.companyAccess = companyAccess;
    }
    async validateCompanyAccess(companyId, user) {
        await this.companyAccess.assertCompanyMutable(companyId, user);
    }
    async create(companyId, dto, user) {
        await this.validateCompanyAccess(companyId, user);
        return this.prisma.companySocialChannel.create({
            data: {
                companyId,
                platform: dto.platform,
                handle: dto.handle,
            },
        });
    }
    async findByCompany(companyId, query, user) {
        await this.validateCompanyAccess(companyId, user);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const { skip, take } = (0, pagination_util_1.getPaginationOffset)(page, limit);
        const search = query.search?.trim();
        const where = {
            companyId,
            ...(query.platform ? { platform: query.platform } : {}),
            ...(search
                ? {
                    handle: {
                        contains: search,
                        mode: 'insensitive',
                    },
                }
                : {}),
        };
        const [data, total] = await Promise.all([
            this.prisma.companySocialChannel.findMany({
                where,
                orderBy: [{ platform: 'asc' }, { id: 'asc' }],
                skip,
                take,
            }),
            this.prisma.companySocialChannel.count({ where }),
        ]);
        return new pagination_response_1.PaginationResponseDto(data, (0, pagination_util_1.createPaginationMeta)(page, limit, total));
    }
    async findOne(id, user) {
        const channel = await this.prisma.companySocialChannel.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!channel) {
            throw new common_1.NotFoundException('کانال اجتماعی پیدا نشد');
        }
        await this.validateCompanyAccess(channel.companyId, user);
        return channel;
    }
    async update(id, dto, user) {
        const channel = await this.prisma.companySocialChannel.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!channel) {
            throw new common_1.NotFoundException('کانال اجتماعی پیدا نشد');
        }
        await this.validateCompanyAccess(channel.companyId, user);
        return this.prisma.companySocialChannel.update({
            where: { id },
            data: {
                platform: dto.platform,
                handle: dto.handle,
            },
        });
    }
    async remove(id, user) {
        const channel = await this.prisma.companySocialChannel.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!channel) {
            throw new common_1.NotFoundException('کانال اجتماعی پیدا نشد');
        }
        await this.validateCompanyAccess(channel.companyId, user);
        return this.prisma.companySocialChannel.delete({
            where: { id },
        });
    }
};
exports.CompanySocialChannelsService = CompanySocialChannelsService;
exports.CompanySocialChannelsService = CompanySocialChannelsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        company_access_service_1.CompanyAccessService])
], CompanySocialChannelsService);
//# sourceMappingURL=company-social-channels.service.js.map