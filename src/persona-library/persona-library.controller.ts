import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PersonaLibraryService } from './persona-library.service';
import { UpsertPersonaDto } from './dto/upsert-persona.dto';

@UseGuards(JwtAuthGuard)
@Controller('persona-library')
export class PersonaLibraryController {
  constructor(private personaLibraryService: PersonaLibraryService) {}

  @Get()
  findAll() {
    return this.personaLibraryService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: UpsertPersonaDto) {
    return this.personaLibraryService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertPersonaDto) {
    return this.personaLibraryService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.personaLibraryService.remove(id);
  }
}
