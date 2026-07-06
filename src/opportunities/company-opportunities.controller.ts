import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateCompanyOpportunityDto } from './dto/create-company-opportunity.dto';
import { FindOpportunitiesDto } from './dto/find-opportunities.dto';
import { OpportunitiesService } from './opportunities.service';

@Controller('companies/:companyId/opportunities')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CompanyOpportunitiesController {
  constructor(private service: OpportunitiesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.REP, UserRole.BOARDS)
  @Permissions('opportunity:view')
  findAll(@Param('companyId') companyId: string, @Query() query: FindOpportunitiesDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findByCompany(companyId, query, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.REP)
  @Permissions('opportunity:create')
  create(@Param('companyId') companyId: string, @Body() dto: CreateCompanyOpportunityDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.create({ ...dto, companyId }, user);
  }
}
