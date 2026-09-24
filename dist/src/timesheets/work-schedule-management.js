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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkScheduleManagementController = exports.WorkScheduleManagementService = exports.CreateOrganizationScheduleDto = void 0;
exports.validateSchedule = validateSchedule;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_log_service_1 = require("../audit-log/audit-log.service");
class ScheduleDayDto {
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], ScheduleDayDto.prototype, "weekday", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1440),
    __metadata("design:type", Number)
], ScheduleDayDto.prototype, "regularMinutes", void 0);
class CreateOrganizationScheduleDto {
}
exports.CreateOrganizationScheduleDto = CreateOrganizationScheduleDto;
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], CreateOrganizationScheduleDto.prototype, "effectiveFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], CreateOrganizationScheduleDto.prototype, "effectiveTo", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(7),
    (0, class_validator_1.ArrayMaxSize)(7),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ScheduleDayDto),
    __metadata("design:type", Array)
], CreateOrganizationScheduleDto.prototype, "days", void 0);
function validateSchedule(dto) {
    const parse = (value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value)
            throw new common_1.BadRequestException('تاریخ اعتبار برنامه کاری معتبر نیست.');
        return date;
    };
    const effectiveFrom = parse(dto.effectiveFrom), effectiveTo = dto.effectiveTo ? parse(dto.effectiveTo) : null;
    if (effectiveTo && effectiveTo < effectiveFrom)
        throw new common_1.BadRequestException('پایان اعتبار نباید قبل از شروع باشد.');
    if (dto.days?.length !== 7 || new Set(dto.days.map(day => day.weekday)).size !== 7 || dto.days.some(day => !Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6 || !Number.isInteger(day.regularMinutes) || day.regularMinutes < 0 || day.regularMinutes > 1440))
        throw new common_1.BadRequestException('برای هر روز هفته یک مدت معتبر وارد کنید.');
    return { effectiveFrom, effectiveTo };
}
let WorkScheduleManagementService = class WorkScheduleManagementService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    authority(user) {
        const tenant = tenant_scope_util_1.tenantScope.require(user);
        if (!tenant.permissions.includes('organization:manage'))
            throw new common_1.ForbiddenException('مجوز مدیریت سازمان لازم است.');
        return tenant;
    }
    list(user) {
        const tenant = this.authority(user);
        return this.prisma.withTenantTransaction(tenant, db => db.workSchedule.findMany({
            where: { organizationId: tenant.organizationId, scope: 'ORGANIZATION' }, include: { days: { orderBy: { weekday: 'asc' } } }, orderBy: { effectiveFrom: 'desc' }, take: 100,
        }));
    }
    async create(dto, user) {
        const tenant = this.authority(user), dates = validateSchedule(dto);
        try {
            return await this.prisma.withTenantTransaction(tenant, async (db) => {
                const overlap = await db.workSchedule.findFirst({ where: { organizationId: tenant.organizationId, scope: 'ORGANIZATION',
                        ...(dates.effectiveTo ? { effectiveFrom: { lte: dates.effectiveTo } } : {}),
                        OR: [{ effectiveTo: null }, { effectiveTo: { gte: dates.effectiveFrom } }],
                    }, select: { id: true } });
                if (overlap)
                    throw new common_1.ConflictException({ code: 'WORK_SCHEDULE_OVERLAP', message: 'بازه اعتبار با برنامه کاری موجود هم‌پوشانی دارد.' });
                const row = await db.workSchedule.create({ data: { organizationId: tenant.organizationId, scope: 'ORGANIZATION', ...dates,
                        days: { create: dto.days.filter(day => day.regularMinutes > 0).map(day => ({ weekday: day.weekday, regularMinutes: day.regularMinutes })) },
                    }, include: { days: true } });
                await this.audit.record({ actorId: tenant.userId, actorMembershipId: tenant.membershipId, organizationId: tenant.organizationId,
                    entityType: 'work-schedule', entityId: row.id, action: 'work-schedule.created', after: row }, db);
                return row;
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && ['P2004', 'P2034'].includes(error.code))
                throw new common_1.ConflictException({ code: 'WORK_SCHEDULE_CONFLICT', message: 'برنامه کاری هم‌زمان تغییر کرده یا بازه تداخل دارد؛ فهرست را تازه کنید.' });
            throw error;
        }
    }
};
exports.WorkScheduleManagementService = WorkScheduleManagementService;
exports.WorkScheduleManagementService = WorkScheduleManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_log_service_1.AuditLogService])
], WorkScheduleManagementService);
let WorkScheduleManagementController = class WorkScheduleManagementController {
    constructor(service) {
        this.service = service;
    }
    list(user) { return this.service.list(user); }
    create(dto, user) { return this.service.create(dto, user); }
};
exports.WorkScheduleManagementController = WorkScheduleManagementController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WorkScheduleManagementController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateOrganizationScheduleDto, Object]),
    __metadata("design:returntype", void 0)
], WorkScheduleManagementController.prototype, "create", null);
exports.WorkScheduleManagementController = WorkScheduleManagementController = __decorate([
    (0, common_1.Controller)('admin/work-schedules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('organization:manage'),
    __metadata("design:paramtypes", [WorkScheduleManagementService])
], WorkScheduleManagementController);
//# sourceMappingURL=work-schedule-management.js.map