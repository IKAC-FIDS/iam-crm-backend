import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { IndustriesService } from './industries.service';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('industries')
export class IndustriesController {
  constructor(private industriesService: IndustriesService) {}

  @Get()
  @Permissions('library:industry:view')
  findAll() {
    return this.industriesService.findAll();
  }

  @Get(':id')
  @Permissions('library:industry:view')
  findOne(@Param('id') id: string) {
    return this.industriesService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:industry:manage')
  @Post()
  create(@Body() dto: CreateIndustryDto) {
    return this.industriesService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:industry:manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIndustryDto) {
    return this.industriesService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:industry:manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.industriesService.remove(id);
  }
}