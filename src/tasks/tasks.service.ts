import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationEntityType,
  NotificationPriority,
  NotificationType,
  Prisma,
  TaskStatus,
  UserRole,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AssignTaskDto } from './dto/assign-task.dto';
import { ChangeTaskStatusDto } from './dto/change-task-status.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { FindTasksDto } from './dto/find-tasks.dto';
import { RescheduleTaskDto } from './dto/reschedule-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';

const taskInclude = {
  company: {
    select: {
      id: true,
      legalName: true,
      brandName: true,
      ownerId: true,
    },
  },
  person: {
    select: {
      id: true,
      fullName: true,
      title: true,
      companyId: true,
    },
  },
  opportunity: {
    select: {
      id: true,
      title: true,
      companyId: true,
      ownerId: true,
      priority: true,
    },
  },
  commercialDocument: {
    select: {
      id: true,
      type: true,
      status: true,
      number: true,
      title: true,
      opportunityId: true,
    },
  },
  payment: {
    select: {
      id: true,
      status: true,
      amount: true,
      currency: true,
      dueDate: true,
      opportunityId: true,
    },
  },
  assignedTo: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      team: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  completedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: FindTasksDto, user: CurrentUserPayload) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = this.buildWhere(query, user);

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: [
          { dueAt: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const task = await this.getTaskInScope(id, user);

    return task;
  }

  async create(dto: CreateTaskDto, user: CurrentUserPayload) {
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('Tasks are read-only for this role');
    }

    await this.validateLinkedEntities(dto, user);

    const assignedToId = dto.assignedToId ?? user.userId;

    if (assignedToId) {
      await this.validateAssignee(assignedToId, user);
    }

    const status = dto.status ?? TaskStatus.TODO;
    const now = new Date();

    const task = await this.prisma.task.create({
      data: {
        organizationId: getCurrentOrganizationId(user),
        title: this.requiredText(dto.title, 'عنوان کار الزامی است'),
        description: dto.description?.trim() || undefined,
        status,
        priority: dto.priority,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : undefined,
        companyId: dto.companyId,
        personId: dto.personId,
        opportunityId: dto.opportunityId,
        commercialDocumentId: dto.commercialDocumentId,
        paymentId: dto.paymentId,
        assignedToId,
        createdById: user.userId,
        completedAt: status === TaskStatus.DONE ? now : undefined,
        completedById: status === TaskStatus.DONE ? user.userId : undefined,
        cancelledAt: status === TaskStatus.CANCELLED ? now : undefined,
      },
      include: taskInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'task',
      entityId: task.id,
      action: 'task.created',
      after: task,
    });

    await this.notifyTaskAssigned(task, user);

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, user: CurrentUserPayload) {
    const current = await this.getTaskForMutation(id, user);

    await this.validateLinkedEntities(dto, user);

    const data: Prisma.TaskUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = this.requiredText(dto.title, 'عنوان کار الزامی است');
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() || null;
    }

    if (dto.status !== undefined) {
      Object.assign(data, this.buildStatusUpdate(dto.status, user));
    }

    if (dto.priority !== undefined) {
      data.priority = dto.priority;
    }

    if (dto.dueAt !== undefined) {
      data.dueAt = dto.dueAt ? new Date(dto.dueAt) : null;
    }

    if (dto.reminderAt !== undefined) {
      data.reminderAt = dto.reminderAt ? new Date(dto.reminderAt) : null;
    }

    if (dto.companyId !== undefined) {
      data.company = dto.companyId
        ? { connect: { id: dto.companyId } }
        : { disconnect: true };
    }

    if (dto.personId !== undefined) {
      data.person = dto.personId
        ? { connect: { id: dto.personId } }
        : { disconnect: true };
    }

    if (dto.opportunityId !== undefined) {
      data.opportunity = dto.opportunityId
        ? { connect: { id: dto.opportunityId } }
        : { disconnect: true };
    }

    if (dto.commercialDocumentId !== undefined) {
      data.commercialDocument = dto.commercialDocumentId
        ? { connect: { id: dto.commercialDocumentId } }
        : { disconnect: true };
    }

    if (dto.paymentId !== undefined) {
      data.payment = dto.paymentId
        ? { connect: { id: dto.paymentId } }
        : { disconnect: true };
    }

    if (dto.assignedToId !== undefined) {
      await this.validateAssignee(dto.assignedToId, user);

      data.assignedTo = {
        connect: {
          id: dto.assignedToId,
        },
      };
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
      include: taskInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'task',
      entityId: id,
      action: 'task.updated',
      before: current,
      after: updated,
    });

    await this.notifyTaskAssigned(updated, user);

    return updated;
  }

  async changeStatus(
    id: string,
    dto: ChangeTaskStatusDto,
    user: CurrentUserPayload,
  ) {
    const current = await this.getTaskForMutation(id, user);

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        ...this.buildStatusUpdate(dto.status, user, dto.note),
      },
      include: taskInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'task',
      entityId: id,
      action: 'task.status_changed',
      before: {
        status: current.status,
      },
      after: {
        status: updated.status,
      },
      metadata: {
        note: dto.note,
      },
    });

    return updated;
  }

  async assign(id: string, dto: AssignTaskDto, user: CurrentUserPayload) {
    const current = await this.getTaskForMutation(id, user);

    await this.validateAssignee(dto.assignedToId, user);

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        assignedToId: dto.assignedToId,
      },
      include: taskInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'task',
      entityId: id,
      action: 'task.assigned',
      before: {
        assignedToId: current.assignedToId,
      },
      after: {
        assignedToId: updated.assignedToId,
      },
    });

    return updated;
  }

  async complete(id: string, dto: CompleteTaskDto, user: CurrentUserPayload) {
    const current = await this.getTaskForMutation(id, user);

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.DONE,
        completedAt: new Date(),
        completedBy: {
          connect: {
            id: user.userId,
          },
        },
        completionNote: dto.completionNote?.trim() || null,
        cancelledAt: null,
        cancelReason: null,
      },
      include: taskInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'task',
      entityId: id,
      action: 'task.completed',
      before: current,
      after: updated,
    });

    return updated;
  }

  async reschedule(id: string, dto: RescheduleTaskDto, user: CurrentUserPayload) {
    const current = await this.getTaskForMutation(id, user);

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        dueAt: new Date(dto.dueAt),
        reminderAt:
          dto.reminderAt !== undefined ? new Date(dto.reminderAt) : undefined,
      },
      include: taskInclude,
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'task',
      entityId: id,
      action: 'task.rescheduled',
      before: {
        dueAt: current.dueAt,
        reminderAt: current.reminderAt,
      },
      after: {
        dueAt: updated.dueAt,
        reminderAt: updated.reminderAt,
      },
    });

    await this.notifyTaskRescheduled(updated, user);

    return updated;
  }

  async remove(id: string, user: CurrentUserPayload) {
    const current = await this.getTaskForMutation(id, user);

    const deleted = await this.prisma.task.delete({
      where: { id },
    });

    await this.audit.record({
      actorId: user.userId,
      entityType: 'task',
      entityId: id,
      action: 'task.deleted',
      before: current,
    });

    return deleted;
  }

  private buildWhere(
    query: FindTasksDto,
    user: CurrentUserPayload,
  ): Prisma.TaskWhereInput {
    const and: Prisma.TaskWhereInput[] = [
      {
        organizationId: getCurrentOrganizationId(user),
      },
      this.taskScopeWhere(user),
    ];

    if (query.status) and.push({ status: query.status });
    if (query.priority) and.push({ priority: query.priority });
    if (query.assignedToId) and.push({ assignedToId: query.assignedToId });
    if (query.createdById) and.push({ createdById: query.createdById });
    if (query.companyId) and.push({ companyId: query.companyId });
    if (query.personId) and.push({ personId: query.personId });
    if (query.opportunityId) and.push({ opportunityId: query.opportunityId });
    if (query.commercialDocumentId) {
      and.push({ commercialDocumentId: query.commercialDocumentId });
    }
    if (query.paymentId) and.push({ paymentId: query.paymentId });

    if (query.dueFrom || query.dueTo) {
      and.push({
        dueAt: {
          ...(query.dueFrom && { gte: new Date(query.dueFrom) }),
          ...(query.dueTo && { lte: new Date(query.dueTo) }),
        },
      });
    }

    const search = query.search?.trim();

    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { company: { legalName: { contains: search, mode: 'insensitive' } } },
          { company: { brandName: { contains: search, mode: 'insensitive' } } },
          { opportunity: { title: { contains: search, mode: 'insensitive' } } },
          { person: { fullName: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    return {
      AND: and,
    };
  }

  private async getTaskInScope(id: string, user: CurrentUserPayload) {
    const task = await this.prisma.task.findFirst({
      where: {
        AND: [
          { id },
          { organizationId: getCurrentOrganizationId(user) },
          this.taskScopeWhere(user),
        ],
      },
      include: taskInclude,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async getTaskForMutation(id: string, user: CurrentUserPayload) {
    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('Tasks are read-only for this role');
    }

    return this.getTaskInScope(id, user);
  }

  private taskScopeWhere(user: CurrentUserPayload): Prisma.TaskWhereInput {
    if (user.role === UserRole.ADMIN || user.role === UserRole.BOARDS) {
      return {};
    }

    if (user.role === UserRole.MANAGER) {
      if (!user.team) {
        return { id: { in: [] } };
      }

      return {
        OR: [
          { assignedTo: { team: user.team } },
          { createdBy: { team: user.team } },
          { company: { owner: { team: user.team } } },
          { opportunity: { company: { owner: { team: user.team } } } },
          { person: { company: { owner: { team: user.team } } } },
          {
            commercialDocument: {
              opportunity: {
                company: {
                  owner: {
                    team: user.team,
                  },
                },
              },
            },
          },
          {
            payment: {
              opportunity: {
                company: {
                  owner: {
                    team: user.team,
                  },
                },
              },
            },
          },
        ],
      };
    }

    return {
      OR: [
        { assignedToId: user.userId },
        { createdById: user.userId },
        { company: { ownerId: user.userId } },
        {
          opportunity: {
            OR: [
              { ownerId: user.userId },
              { company: { ownerId: user.userId } },
            ],
          },
        },
        { person: { company: { ownerId: user.userId } } },
        {
          commercialDocument: {
            opportunity: {
              OR: [
                { ownerId: user.userId },
                { company: { ownerId: user.userId } },
              ],
            },
          },
        },
        {
          payment: {
            opportunity: {
              OR: [
                { ownerId: user.userId },
                { company: { ownerId: user.userId } },
              ],
            },
          },
        },
      ],
    };
  }

  private async validateLinkedEntities(
    dto: Partial<CreateTaskDto>,
    user: CurrentUserPayload,
  ) {
    if (dto.companyId) {
      await this.assertCompanyAccess(dto.companyId, user);
    }

    if (dto.opportunityId) {
      await this.assertOpportunityAccess(dto.opportunityId, user);
    }

    if (dto.personId) {
      await this.assertPersonAccess(dto.personId, user);
    }

    if (dto.commercialDocumentId) {
      await this.assertCommercialDocumentAccess(dto.commercialDocumentId, user);
    }

    if (dto.paymentId) {
      await this.assertPaymentAccess(dto.paymentId, user);
    }
  }

  private async assertCompanyAccess(companyId: string, user: CurrentUserPayload) {
    const company = await this.prisma.company.findFirst({
      where: {
        AND: [
          {
            id: companyId,
            archivedAt: null,
            organizationId: getCurrentOrganizationId(user),
          },
          this.companyScopeWhere(user),
        ],
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }
  }

  private async assertOpportunityAccess(
    opportunityId: string,
    user: CurrentUserPayload,
  ) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: {
        AND: [
          { id: opportunityId, organizationId: getCurrentOrganizationId(user) },
          this.opportunityScopeWhere(user),
        ],
      },
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    if (opportunity.archivedAt) {
      throw new BadRequestException('Archived opportunities cannot be changed');
    }
  }

  private async assertPersonAccess(personId: string, user: CurrentUserPayload) {
    const person = await this.prisma.person.findFirst({
      where: {
        id: personId,
        company: {
          AND: [
            { organizationId: getCurrentOrganizationId(user) },
            this.companyScopeWhere(user),
          ],
        },
      },
    });

    if (!person) {
      throw new NotFoundException('Person not found');
    }
  }

  private async assertCommercialDocumentAccess(
    documentId: string,
    user: CurrentUserPayload,
  ) {
    const document = await this.prisma.opportunityCommercialDocument.findFirst({
      where: {
        id: documentId,
        opportunity: {
          AND: [
            { organizationId: getCurrentOrganizationId(user) },
            this.opportunityScopeWhere(user),
          ],
        },
      },
      include: {
        opportunity: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Commercial document not found');
    }

    if (document.opportunity.archivedAt) {
      throw new BadRequestException('Archived opportunities cannot be changed');
    }
  }

  private async assertPaymentAccess(paymentId: string, user: CurrentUserPayload) {
    const payment = await this.prisma.opportunityPayment.findFirst({
      where: {
        id: paymentId,
        opportunity: {
          AND: [
            { organizationId: getCurrentOrganizationId(user) },
            this.opportunityScopeWhere(user),
          ],
        },
      },
      include: {
        opportunity: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.opportunity.archivedAt) {
      throw new BadRequestException('Archived opportunities cannot be changed');
    }
  }

  private companyScopeWhere(user: CurrentUserPayload): Prisma.CompanyWhereInput {
    if (user.role === UserRole.ADMIN || user.role === UserRole.BOARDS) {
      return {};
    }

    if (user.role === UserRole.MANAGER) {
      return user.team
        ? {
            owner: {
              team: user.team,
            },
          }
        : {
            id: {
              in: [],
            },
          };
    }

    return {
      ownerId: user.userId,
    };
  }

  private opportunityScopeWhere(
    user: CurrentUserPayload,
  ): Prisma.OpportunityWhereInput {
    if (user.role === UserRole.ADMIN || user.role === UserRole.BOARDS) {
      return {};
    }

    if (user.role === UserRole.MANAGER) {
      return user.team
        ? {
            company: {
              owner: {
                team: user.team,
              },
            },
          }
        : {
            id: {
              in: [],
            },
          };
    }

    return {
      OR: [
        {
          ownerId: user.userId,
        },
        {
          company: {
            ownerId: user.userId,
          },
        },
      ],
    };
  }

  private async validateAssignee(
    assignedToId: string,
    user: CurrentUserPayload,
  ) {
    const assignee = await this.prisma.user.findUnique({
      where: {
        id: assignedToId,
        organizationId: getCurrentOrganizationId(user),
      },
    });

    if (!assignee || !assignee.isActive || assignee.role === UserRole.BOARDS) {
      throw new BadRequestException(
        'Task assignee must be an active internal user',
      );
    }

    if (user.role === UserRole.REP && assignee.id !== user.userId) {
      throw new ForbiddenException('REP can only assign tasks to self');
    }

    if (
      user.role === UserRole.MANAGER &&
      (!user.team || assignee.team !== user.team)
    ) {
      throw new ForbiddenException('Assignee must belong to the manager team');
    }
  }

  private buildStatusUpdate(
    status: TaskStatus,
    user: CurrentUserPayload,
    note?: string,
  ): Prisma.TaskUpdateInput {
    if (status === TaskStatus.DONE) {
      return {
        status,
        completedAt: new Date(),
        completedBy: {
          connect: {
            id: user.userId,
          },
        },
        completionNote: note?.trim() || undefined,
        cancelledAt: null,
        cancelReason: null,
      };
    }

    if (status === TaskStatus.CANCELLED) {
      return {
        status,
        cancelledAt: new Date(),
        cancelReason: note?.trim() || undefined,
        completedAt: null,
        completedBy: {
          disconnect: true,
        },
        completionNote: null,
      };
    }

    return {
      status,
      completedAt: null,
      completedBy: {
        disconnect: true,
      },
      completionNote: null,
      cancelledAt: null,
      cancelReason: null,
    };
  }

  private requiredText(value: string, message: string) {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

private async notifyTaskAssigned(
  task: {
    id: string;
    title: string;
    assignedToId: string | null;
  },
  user: CurrentUserPayload,
) {
  if (!task.assignedToId) {
    return;
  }

  await this.notifications.notifyUser({
    recipientId: task.assignedToId,
    actorId: user.userId,
    type: NotificationType.TASK_ASSIGNED,
    priority: NotificationPriority.NORMAL,
    title: 'کار جدید به شما ارجاع شد',
    body: task.title,
    entityType: NotificationEntityType.TASK,
    entityId: task.id,
    actionUrl: `/tasks/${task.id}`,
    skipSelf: true,
  });
}

private async notifyTaskCompleted(
  task: {
    id: string;
    title: string;
    createdById: string | null;
  },
  user: CurrentUserPayload,
) {
  if (!task.createdById) {
    return;
  }

  await this.notifications.notifyUser({
    recipientId: task.createdById,
    actorId: user.userId,
    type: NotificationType.TASK_COMPLETED,
    priority: NotificationPriority.NORMAL,
    title: 'یک کار تکمیل شد',
    body: task.title,
    entityType: NotificationEntityType.TASK,
    entityId: task.id,
    actionUrl: `/tasks/${task.id}`,
    skipSelf: true,
  });
}

private async notifyTaskRescheduled(
  task: {
    id: string;
    title: string;
    assignedToId: string | null;
    dueAt: Date | null;
  },
  user: CurrentUserPayload,
) {
  if (!task.assignedToId) {
    return;
  }

  await this.notifications.notifyUser({
    recipientId: task.assignedToId,
    actorId: user.userId,
    type: NotificationType.TASK_RESCHEDULED,
    priority: NotificationPriority.NORMAL,
    title: 'زمان‌بندی کار تغییر کرد',
    body: task.title,
    entityType: NotificationEntityType.TASK,
    entityId: task.id,
    actionUrl: `/tasks/${task.id}`,
    metadata: {
      dueAt: task.dueAt?.toISOString() ?? null,
    },
    skipSelf: true,
  });
}
}
