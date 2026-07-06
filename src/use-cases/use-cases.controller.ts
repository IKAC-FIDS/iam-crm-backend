import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UseCasesService } from './use-cases.service';
import { CreateUseCaseDto } from './dto/create-use-case.dto';
import { UpdateUseCaseDto } from './dto/update-use-case.dto';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('use-cases')
export class UseCasesController {
  constructor(private useCasesService: UseCasesService) {}

  @Get()
  @Permissions('library:use-case:view')
  findAll() {
    return this.useCasesService.findAll();
  }

  @Get(':id')
  @Permissions('library:use-case:view')
  findOne(@Param('id') id: string) {
    return this.useCasesService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:use-case:manage')
  @Post()
  create(@Body() dto: CreateUseCaseDto) {
    return this.useCasesService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:use-case:manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUseCaseDto) {
    return this.useCasesService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:use-case:manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.useCasesService.remove(id);
  }
}