import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConversationEntityType } from '@prisma/client';
import { ActivitiesService } from '../activities/activities.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CompanyAccessService } from '../companies/company-access.service';
import { TasksService } from '../tasks/tasks.service';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { MeetingsService } from '../meetings/meetings.service';

export type ConversationEntityAccess = {
  entityType: ConversationEntityType;
  entityId: string;
  label: string;
  responsibleUserIds: string[];
  actionUrl: string;
};

@Injectable()
export class ConversationAccessService {
  constructor(
    private readonly companies: CompanyAccessService,
    private readonly tasks: TasksService,
    private readonly activities: ActivitiesService,
    private readonly opportunities: OpportunitiesService,
    private readonly meetings: MeetingsService,
  ) {}

  async assertReadable(entityType: ConversationEntityType, entityId: string, user: CurrentUserPayload): Promise<ConversationEntityAccess> {
    if (entityType === ConversationEntityType.COMPANY) {
      const company = await this.companies.assertCompanyReadable(entityId, user);
      return {
        entityType,
        entityId,
        label: company.brandName || company.legalName,
        responsibleUserIds: company.ownerId ? [company.ownerId] : [],
        actionUrl: `/companies/${entityId}#conversation`,
      };
    }
    if (entityType === ConversationEntityType.TASK) {
      const task = await this.tasks.assertReadable(entityId, user);
      return {
        entityType,
        entityId,
        label: task.title,
        responsibleUserIds: [task.assignedToId, task.reviewerId].filter((id): id is string => Boolean(id)),
        actionUrl: `/tasks/${entityId}#conversation`,
      };
    }
    if (entityType === ConversationEntityType.OPPORTUNITY) {
      this.assertPermission(user, 'opportunity:view');
      const opportunity = await this.opportunities.findOne(entityId, user);
      return {
        entityType,
        entityId,
        label: opportunity.title,
        responsibleUserIds: opportunity.ownerId ? [opportunity.ownerId] : [],
        actionUrl: `/opportunities/${entityId}#conversation`,
      };
    }
    if (entityType === ConversationEntityType.MEETING) {
      this.assertPermission(user, 'meeting:view');
      const meeting = await this.meetings.findOne(entityId, user);
      return {
        entityType,
        entityId,
        label: meeting.title,
        responsibleUserIds: [
          meeting.organizerId,
          ...(meeting.assignees ?? []).map((item) => item.userId),
        ].filter((id, index, values) => Boolean(id) && values.indexOf(id) === index),
        actionUrl: `/meetings/${entityId}#conversation`,
      };
    }
    const activity = await this.activities.assertReadable(entityId, user);
    return {
      entityType,
      entityId,
      label: activity.outcome || activity.notes || activity.type,
      responsibleUserIds: [activity.userId],
      actionUrl: `/activities?activityId=${encodeURIComponent(entityId)}&conversation=1`,
    };
  }

  private assertPermission(user: CurrentUserPayload, permission: string) {
    if (!user.tenantContext?.permissions.includes(permission)) {
      throw new ForbiddenException('شما اجازه مشاهده این گفتگو را ندارید');
    }
  }
}
