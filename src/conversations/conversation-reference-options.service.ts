import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConversationMessageReferenceType } from '@prisma/client';
import { CompaniesService } from '../companies/companies.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { MeetingsService } from '../meetings/meetings.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { TasksService } from '../tasks/tasks.service';
import { FindConversationReferenceOptionsDto } from './dto/conversation.dto';

@Injectable()
export class ConversationReferenceOptionsService {
  constructor(
    private readonly companies: CompaniesService,
    private readonly opportunities: OpportunitiesService,
    private readonly tasks: TasksService,
    private readonly meetings: MeetingsService,
  ) {}

  async find(query: FindConversationReferenceOptionsDto, user: CurrentUserPayload) {
    const search = query.search?.trim();
    if (query.type === ConversationMessageReferenceType.COMPANY) {
      this.requirePermission(user, 'company:view');
      const result = await this.companies.findOptions(user, { search, page: 1, limit: 20 });
      return { data: result.data.map((item) => ({ id: item.id, label: item.brandName || item.legalName })) };
    }
    if (query.type === ConversationMessageReferenceType.OPPORTUNITY) {
      this.requirePermission(user, 'opportunity:view');
      const result = await this.opportunities.findAll({ search, page: 1, limit: 20, activeOnly: 'true' }, user);
      return { data: result.data.map((item) => ({ id: item.id, label: item.title })) };
    }
    if (query.type === ConversationMessageReferenceType.TASK) {
      this.requirePermission(user, 'task:view');
      const result = await this.tasks.findAll({ search, page: 1, limit: 20 }, user);
      return { data: result.data.map((item) => ({ id: item.id, label: item.title })) };
    }
    this.requirePermission(user, 'meeting:view');
    const result = await this.meetings.findAll({ search, page: 1, limit: 20 }, user);
    return { data: result.data.map((item) => ({ id: item.id, label: item.title })) };
  }

  private requirePermission(user: CurrentUserPayload, permission: string) {
    if (!user.tenantContext?.permissions.includes(permission)) {
      throw new ForbiddenException(
        'شما اجازه جست‌وجوی این نوع مرجع را ندارید.',
      );
    }
  }
}
