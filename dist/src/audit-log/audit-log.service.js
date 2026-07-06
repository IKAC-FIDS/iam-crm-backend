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
exports.AuditLogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditLogService = class AuditLogService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    record(input) {
        return this.prisma.auditLog.create({
            data: {
                actorId: input.actorId,
                entityType: input.entityType,
                entityId: input.entityId,
                action: input.action,
                ...(input.before !== undefined && { before: this.sanitize(input.before) }),
                ...(input.after !== undefined && { after: this.sanitize(input.after) }),
                ...(input.metadata !== undefined && { metadata: this.sanitize(input.metadata) }),
            },
        });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const startDate = query.startDate ? new Date(query.startDate) : undefined;
        const endDate = query.endDate ? new Date(query.endDate) : undefined;
        if (startDate && endDate && startDate > endDate)
            throw new common_1.BadRequestException('startDate must be before or equal to endDate');
        const where = {
            ...(query.actorId && { actorId: query.actorId }),
            ...(query.entityType && { entityType: query.entityType }),
            ...(query.entityId && { entityId: query.entityId }),
            ...(query.action && { action: query.action }),
            ...((startDate || endDate) && { createdAt: { gte: startDate, lte: endDate } }),
        };
        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
            this.prisma.auditLog.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    }
    sanitize(value) {
        if (value instanceof Date)
            return value.toISOString();
        if (typeof value === 'bigint')
            return value.toString();
        if (Array.isArray(value))
            return value.map((item) => this.sanitize(item));
        if (value && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).filter(([key]) => !/(password|hash|token|secret|authorization)/i.test(key)).map(([key, item]) => [key, this.sanitize(item)]));
        }
        return value;
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map