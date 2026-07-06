import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CompanySocialChannelsService } from './company-social-channels.service';
import { CreateCompanySocialChannelDto } from './dto/create-company-social-channel.dto';
import { UpdateCompanySocialChannelDto } from './dto/update-company-social-channel.dto';

@UseGuards(JwtAuthGuard)
@Controller('companies/:companyId/social-channels')
export class CompanySocialChannelsController {
  constructor(private channelsService: CompanySocialChannelsService) {}

  @Post()
  create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCompanySocialChannelDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.channelsService.create(companyId, dto, user); // ✅ اصلاح شد
  }

  @Get()
  findAll(
    @Param('companyId') companyId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.channelsService.findByCompany(companyId, user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.channelsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanySocialChannelDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.channelsService.update(id, dto, user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.channelsService.remove(id, user);
  }
}