import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CompanyBranchesService } from './company-branches.service';
import { CreateCompanyBranchDto } from './dto/create-company-branch.dto';
import { UpdateCompanyBranchDto } from './dto/update-company-branch.dto';

@UseGuards(JwtAuthGuard)
@Controller('companies/:companyId/branches')
export class CompanyBranchesController {
  constructor(private branchesService: CompanyBranchesService) {}

@Post()
create(
  @Param('companyId') companyId: string,
  @Body() dto: CreateCompanyBranchDto,
  @CurrentUser() user: CurrentUserPayload,
) {
  return this.branchesService.create(companyId, dto, user); 
}

  @Get()
  findAll(
    @Param('companyId') companyId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.branchesService.findByCompany(companyId, user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.branchesService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyBranchDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.branchesService.update(id, dto, user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.branchesService.remove(id, user);
  }
}