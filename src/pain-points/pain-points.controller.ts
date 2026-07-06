import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PainPointsService } from './pain-points.service';
import { CreatePainPointDto } from './dto/create-pain-point.dto';
import { UpdatePainPointDto } from './dto/update-pain-point.dto';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('pain-points')
export class PainPointsController {
  constructor(private painPointsService: PainPointsService) {}

  @Get()
  @Permissions('library:pain-point:view')
  findAll() {
    return this.painPointsService.findAll();
  }

  @Get(':id')
  @Permissions('library:pain-point:view')
  findOne(@Param('id') id: string) {
    return this.painPointsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:pain-point:manage')
  @Post()
  create(@Body() dto: CreatePainPointDto) {
    return this.painPointsService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:pain-point:manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePainPointDto) {
    return this.painPointsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:pain-point:manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.painPointsService.remove(id);
  }
}