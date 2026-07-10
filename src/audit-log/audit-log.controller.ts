import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AuditLogService } from './audit-log.service';
import { FindAuditLogsDto } from './dto/find-audit-logs.dto';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('audit-log:view')
export class AuditLogController {
  constructor(private service: AuditLogService) {}

  @Get()
  findAll(@Query() query: FindAuditLogsDto) { return this.service.findAll(query); }
}
