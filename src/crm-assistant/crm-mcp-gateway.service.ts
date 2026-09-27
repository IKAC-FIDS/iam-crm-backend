import { Injectable } from '@nestjs/common';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CrmAssistantActionsService } from './crm-assistant-actions.service';
import { CrmAssistantToolsService } from './crm-assistant-tools.service';

/**
 * Single permission-aware tool gateway shared by the chat agent and MCP transport.
 * Mutations never execute here: action tools only create signed confirmation drafts.
 */
@Injectable()
export class CrmMcpGatewayService {
  constructor(
    private readonly tools: CrmAssistantToolsService,
    private readonly actions: CrmAssistantActionsService,
  ) {}

  listFor(user: CurrentUserPayload) {
    return [...this.tools.listFor(user), ...this.actions.listFor(user)];
  }

  async call(name: string, args: unknown, user: CurrentUserPayload) {
    return name.startsWith('propose_')
      ? this.actions.propose(name, args, user)
      : this.tools.call(name, args, user);
  }

  isAction(name: string) {
    return name.startsWith('propose_');
  }
}
