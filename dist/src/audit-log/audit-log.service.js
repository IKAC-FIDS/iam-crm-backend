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
const audit_request_context_service_1 = require("./audit-request-context.service");
const api_date_util_1 = require("../common/dates/api-date.util");
let AuditLogService = class AuditLogService {
    constructor(prisma, requestContext) {
        this.prisma = prisma;
        this.requestContext = requestContext;
    }
    record(input) {
        const context = this.requestContext.getContext();
        return this.prisma.auditLog.create({
            data: {
                actorId: input.actorId ?? null,
                entityType: input.entityType,
                entityId: input.entityId ?? null,
                action: input.action,
                requestId: input.requestId ?? context?.requestId ?? null,
                ipAddress: input.ipAddress ?? context?.ipAddress ?? null,
                userAgent: input.userAgent ?? context?.userAgent ?? null,
                requestMethod: input.requestMethod ?? context?.requestMethod ?? null,
                requestPath: input.requestPath ?? context?.requestPath ?? null,
                organizationId: input.organizationId ?? context?.organizationId ?? null,
                ...(input.before !== undefined && {
                    before: this.sanitize(input.before),
                }),
                ...(input.after !== undefined && {
                    after: this.sanitize(input.after),
                }),
                ...(input.metadata !== undefined && {
                    metadata: this.sanitize(input.metadata),
                }),
            },
        });
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const createdAtRange = (0, api_date_util_1.parseApiDateRange)(query.startDate, query.endDate, 'startDate', 'endDate');
        const where = {
            ...(query.actorId && { actorId: query.actorId }),
            ...(query.entityType && { entityType: query.entityType }),
            ...(query.entityId && { entityId: query.entityId }),
            ...(query.action && { action: query.action }),
            ...(query.requestId && { requestId: query.requestId }),
            ...(query.ipAddress && {
                ipAddress: {
                    contains: query.ipAddress,
                    mode: 'insensitive',
                },
            }),
            ...(query.requestMethod && {
                requestMethod: query.requestMethod.toUpperCase(),
            }),
            ...(query.requestPath && {
                requestPath: {
                    contains: query.requestPath,
                    mode: 'insensitive',
                },
            }),
            ...(createdAtRange && { createdAt: createdAtRange }),
        };
        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
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
    sanitize(value) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (typeof value === 'bigint') {
            return value.toString();
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.sanitize(item));
        }
        if (value && typeof value === 'object') {
            const jsonValue = value;
            if (typeof jsonValue.toJSON === 'function') {
                return this.sanitize(jsonValue.toJSON());
            }
            return Object.fromEntries(Object.entries(value)
                .filter(([key]) => !/(password|hash|token|secret|authorization|cookie|credential)/i.test(key))
                .map(([key, item]) => [key, this.sanitize(item)]));
        }
        return value;
    }
};
exports.AuditLogService = AuditLogService;
exports.AuditLogService = AuditLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_request_context_service_1.AuditRequestContextService])
], AuditLogService);
//# sourceMappingURL=audit-log.service.js.map