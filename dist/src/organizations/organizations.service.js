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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
let OrganizationsService = class OrganizationsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async current(user) {
        const organization = await this.prisma.organization.findUnique({
            where: {
                id: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return organization;
    }
    async findAll(query, user) {
        this.assertAdmin(user);
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        const search = query.search?.trim();
        if (search) {
            where.OR = [
                {
                    code: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    name: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.organization.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrevious: page > 1,
            },
        };
    }
    async findOne(id, user) {
        this.assertAdmin(user);
        const organization = await this.prisma.organization.findUnique({
            where: { id },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return organization;
    }
    async create(dto, user) {
        this.assertAdmin(user);
        const code = this.normalizeCode(dto.code);
        const duplicate = await this.prisma.organization.findUnique({
            where: { code },
        });
        if (duplicate) {
            throw new common_1.ConflictException('Organization code already exists');
        }
        const organization = await this.prisma.organization.create({
            data: {
                code,
                name: this.requiredText(dto.name, 'نام سازمان الزامی است'),
                status: dto.status ?? client_1.OrganizationStatus.ACTIVE,
                timezone: dto.timezone?.trim() || 'Asia/Tehran',
                locale: dto.locale?.trim() || 'fa-IR',
                settings: dto.settings,
            },
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'organization',
            entityId: organization.id,
            action: 'organization.created',
            after: organization,
        });
        return organization;
    }
    async update(id, dto, user) {
        this.assertAdmin(user);
        const current = await this.findOne(id, user);
        const data = {};
        if (dto.code !== undefined) {
            const code = this.normalizeCode(dto.code);
            const duplicate = await this.prisma.organization.findFirst({
                where: {
                    code,
                    NOT: {
                        id,
                    },
                },
            });
            if (duplicate) {
                throw new common_1.ConflictException('Organization code already exists');
            }
            data.code = code;
        }
        if (dto.name !== undefined) {
            data.name = this.requiredText(dto.name, 'نام سازمان الزامی است');
        }
        if (dto.status !== undefined) {
            data.status = dto.status;
        }
        if (dto.timezone !== undefined) {
            data.timezone = dto.timezone?.trim() || 'Asia/Tehran';
        }
        if (dto.locale !== undefined) {
            data.locale = dto.locale?.trim() || 'fa-IR';
        }
        if (dto.settings !== undefined) {
            data.settings = dto.settings;
        }
        const updated = await this.prisma.organization.update({
            where: { id },
            data,
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'organization',
            entityId: id,
            action: 'organization.updated',
            before: current,
            after: updated,
        });
        return updated;
    }
    async activate(id, user) {
        this.assertAdmin(user);
        const current = await this.findOne(id, user);
        const updated = await this.prisma.organization.update({
            where: { id },
            data: {
                status: client_1.OrganizationStatus.ACTIVE,
            },
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'organization',
            entityId: id,
            action: 'organization.activated',
            before: current,
            after: updated,
        });
        return updated;
    }
    async suspend(id, user) {
        this.assertAdmin(user);
        const current = await this.findOne(id, user);
        const updated = await this.prisma.organization.update({
            where: { id },
            data: {
                status: client_1.OrganizationStatus.SUSPENDED,
            },
        });
        await this.audit.record({
            actorId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
            entityType: 'organization',
            entityId: id,
            action: 'organization.suspended',
            before: current,
            after: updated,
        });
        return updated;
    }
    assertAdmin(user) {
        if (user.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only ADMIN can manage organizations');
        }
    }
    normalizeCode(code) {
        const normalized = code.trim().toLowerCase();
        if (!normalized) {
            throw new common_1.BadRequestException('کد سازمان الزامی است');
        }
        return normalized;
    }
    requiredText(value, message) {
        const normalized = value.trim();
        if (!normalized) {
            throw new common_1.BadRequestException(message);
        }
        return normalized;
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map