import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PersonaLibraryService } from './persona-library.service';
import { UpsertPersonaDto } from './dto/upsert-persona.dto';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('persona-library')
export class PersonaLibraryController {
  constructor(private personaLibraryService: PersonaLibraryService) {}

  @Get()
  @Permissions('library:persona:view')
  findAll() {
    return this.personaLibraryService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:persona:manage')
  @Post()
  create(@Body() dto: UpsertPersonaDto) {
    return this.personaLibraryService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:persona:manage')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertPersonaDto) {
    return this.personaLibraryService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Permissions('library:persona:manage')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personaLibraryService.remove(id);
  }
}
