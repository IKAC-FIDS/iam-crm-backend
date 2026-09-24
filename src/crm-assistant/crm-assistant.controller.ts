import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AnyPermission } from '../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CrmAssistantService } from './crm-assistant.service';
import { AskCrmAssistantDto } from './dto/ask-crm-assistant.dto';

@Controller('assistant')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmAssistantController {
  constructor(private readonly assistant: CrmAssistantService) {}

  @Post('ask')
  @AnyPermission('company:view', 'opportunity:view', 'task:view', 'meeting:view')
  ask(@Body() dto: AskCrmAssistantDto, @CurrentUser() user: CurrentUserPayload) {
    return this.assistant.ask(dto, user);
  }
}
