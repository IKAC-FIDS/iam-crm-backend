import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Injectable, Post, UseGuards } from '@nestjs/common';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { tenantScope } from '../common/tenant/tenant-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

class ScheduleDayDto {
  @IsInt() @Min(0) @Max(6) weekday!: number;
  @IsInt() @Min(0) @Max(1440) regularMinutes!: number;
}
export class CreateOrganizationScheduleDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) effectiveFrom!: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) effectiveTo?: string;
  @IsArray() @ArrayMinSize(7) @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => ScheduleDayDto) days!: ScheduleDayDto[];
}

export function validateSchedule(dto: CreateOrganizationScheduleDto) {
  const parse = (value: string) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(+date) || date.toISOString().slice(0, 10) !== value)
      throw new BadRequestException('تاریخ اعتبار برنامه کاری معتبر نیست.');
    return date;
  };
  const effectiveFrom = parse(dto.effectiveFrom), effectiveTo = dto.effectiveTo ? parse(dto.effectiveTo) : null;
  if (effectiveTo && effectiveTo < effectiveFrom) throw new BadRequestException('پایان اعتبار نباید قبل از شروع باشد.');
  if (dto.days?.length !== 7 || new Set(dto.days.map(day => day.weekday)).size !== 7 || dto.days.some(day => !Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6 || !Number.isInteger(day.regularMinutes) || day.regularMinutes < 0 || day.regularMinutes > 1440))
    throw new BadRequestException('برای هر روز هفته یک مدت معتبر وارد کنید.');
  return { effectiveFrom, effectiveTo };
}

@Injectable()
export class WorkScheduleManagementService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditLogService) {}
  private authority(user: CurrentUserPayload) {
    const tenant = tenantScope.require(user);
    if (!tenant.permissions.includes('organization:manage')) throw new ForbiddenException('مجوز مدیریت سازمان لازم است.');
    return tenant;
  }
  list(user: CurrentUserPayload) {
    const tenant = this.authority(user);
    return this.prisma.withTenantTransaction(tenant, db => db.workSchedule.findMany({
      where: { organizationId: tenant.organizationId, scope: 'ORGANIZATION' }, include: { days: { orderBy: { weekday: 'asc' } } }, orderBy: { effectiveFrom: 'desc' }, take: 100,
    }));
  }
  async create(dto: CreateOrganizationScheduleDto, user: CurrentUserPayload) {
    const tenant = this.authority(user), dates = validateSchedule(dto);
    try {
      return await this.prisma.withTenantTransaction(tenant, async db => {
        const overlap = await db.workSchedule.findFirst({ where: { organizationId: tenant.organizationId, scope: 'ORGANIZATION',
          ...(dates.effectiveTo ? { effectiveFrom: { lte: dates.effectiveTo } } : {}),
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: dates.effectiveFrom } }],
        }, select: { id: true } });
        if (overlap) throw new ConflictException({ code: 'WORK_SCHEDULE_OVERLAP', message: 'بازه اعتبار با برنامه کاری موجود هم‌پوشانی دارد.' });
        const row = await db.workSchedule.create({ data: { organizationId: tenant.organizationId, scope: 'ORGANIZATION', ...dates,
          // Prisma inherits both composite relation keys from the parent schedule.
          // Non-working days are absent rows: the database requires positive minutes.
          days: { create: dto.days.filter(day => day.regularMinutes > 0).map(day => ({ weekday: day.weekday, regularMinutes: day.regularMinutes } satisfies Prisma.WorkScheduleDayCreateWithoutScheduleInput)) },
        }, include: { days: true } });
        await this.audit.record({ actorId: tenant.userId, actorMembershipId: tenant.membershipId, organizationId: tenant.organizationId,
          entityType: 'work-schedule', entityId: row.id, action: 'work-schedule.created', after: row }, db);
        return row;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2004', 'P2034'].includes(error.code))
        throw new ConflictException({ code: 'WORK_SCHEDULE_CONFLICT', message: 'برنامه کاری هم‌زمان تغییر کرده یا بازه تداخل دارد؛ فهرست را تازه کنید.' });
      throw error;
    }
  }
}

@Controller('admin/work-schedules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('organization:manage')
export class WorkScheduleManagementController {
  constructor(private readonly service: WorkScheduleManagementService) {}
  @Get() list(@CurrentUser() user: CurrentUserPayload) { return this.service.list(user); }
  @Post() create(@Body() dto: CreateOrganizationScheduleDto, @CurrentUser() user: CurrentUserPayload) { return this.service.create(dto, user); }
}
