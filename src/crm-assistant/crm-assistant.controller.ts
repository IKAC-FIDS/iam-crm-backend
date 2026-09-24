import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AnyPermission } from '../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CrmAssistantService } from './crm-assistant.service';
import { AskCrmAssistantDto } from './dto/ask-crm-assistant.dto';
import { ConfirmCrmAssistantActionDto } from './dto/confirm-crm-assistant-action.dto';
import { CrmAssistantActionsService } from './crm-assistant-actions.service';

@Controller('assistant')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmAssistantController {
  constructor(private readonly assistant: CrmAssistantService, private readonly actions: CrmAssistantActionsService) {}

  @Post('ask')
  @AnyPermission('company:view', 'opportunity:view', 'task:view', 'meeting:view', 'people:directory:view', 'activity:view', 'timesheet:view', 'leave:view')
  ask(@Body() dto: AskCrmAssistantDto, @CurrentUser() user: CurrentUserPayload) {
    return this.assistant.ask(dto, user);
  }

  @Post('actions/confirm')
  @AnyPermission('company:create', 'opportunity:create', 'task:create', 'person:create', 'activity:create', 'meeting:create', 'timesheet:manage', 'leave:manage')
  confirm(@Body() dto: ConfirmCrmAssistantActionDto, @CurrentUser() user: CurrentUserPayload) {
    return this.actions.confirm(dto.token, user);
  }
}
