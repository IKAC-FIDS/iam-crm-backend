import { Controller, Get, UseGuards, Query, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard'; // ← اضافه شد
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator'; // ← اضافه شد
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { IsDateString, IsOptional } from 'class-validator';

class ActivityReportQueryDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.BOARDS) // ← نقش‌های مجاز
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // ============================================================
  // ۱. نرخ تبدیل بین مراحل
  // ============================================================
  @Get('conversion-rates')
  @Permissions('report:view') // ← دسترسی مورد نیاز
  getConversionRates() {
    return this.reportsService.getConversionRates();
  }

  // ============================================================
  // ۲. میانگین زمان ماندگاری در هر مرحله
  // ============================================================
  @Get('stage-durations')
  @Permissions('report:view')
  getAverageStageDuration() {
    return this.reportsService.getAverageStageDuration();
  }

  // ============================================================
  // ۳. گزارش جامع پایپ‌لاین
  // ============================================================
  @Get('pipeline-summary')
  @Permissions('report:view')
  getPipelineSummary() {
    return this.reportsService.getPipelineSummary();
  }

  // ============================================================
  // ۴. گزارش فعالیت‌ها در بازه زمانی
  // ============================================================
  @Get('activities')
  @Permissions('report:view')
  getActivityReport(
    @Query(new ValidationPipe({ transform: true })) 
    query: ActivityReportQueryDto,
  ) {
    const startDate = query.startDate 
      ? new Date(query.startDate) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // ۳۰ روز پیش
    const endDate = query.endDate 
      ? new Date(query.endDate) 
      : new Date();

    return this.reportsService.getActivityReport(startDate, endDate);
  }
}