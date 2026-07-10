import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditRequestContextService } from './audit-request-context.service';
import { FindAuditLogsDto } from './dto/find-audit-logs.dto';

export interface RecordAuditInput {
  actorId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;

  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestMethod?: string | null;
  requestPath?: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    private prisma: PrismaService,
    private requestContext: AuditRequestContextService,
  ) {}

  record(input: RecordAuditInput) {
    const context = this.requestContext.getContext();

    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        action: input.action,

        requestId: input.requestId ?? context?.requestId ?? null,
        ipAddress: input.ipAddress ?? context?.ipAddress ?? null,
        userAgent: input.userAgent ?? context?.userAgent ?? null,
        requestMethod: input.requestMethod ?? context?.requestMethod ?? null,
        requestPath: input.requestPath ?? context?.requestPath ?? null,

        ...(input.before !== undefined && {
          before: this.sanitize(input.before) as Prisma.InputJsonValue,
        }),
        ...(input.after !== undefined && {
          after: this.sanitize(input.after) as Prisma.InputJsonValue,
        }),
        ...(input.metadata !== undefined && {
          metadata: this.sanitize(input.metadata) as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async findAll(query: FindAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const where: Prisma.AuditLogWhereInput = {
      ...(query.actorId && { actorId: query.actorId }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.action && { action: query.action }),
      ...(query.requestId && { requestId: query.requestId }),
      ...(query.ipAddress && {
        ipAddress: {
          contains: query.ipAddress,
          mode: 'insensitive',
        },
      }),
      ...(query.requestMethod && {
        requestMethod: query.requestMethod.toUpperCase(),
      }),
      ...(query.requestPath && {
        requestPath: {
          contains: query.requestPath,
          mode: 'insensitive',
        },
      }),
      ...((startDate || endDate) && {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
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

  private sanitize(value: unknown): unknown {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (value && typeof value === 'object') {
      const jsonValue = value as { toJSON?: () => unknown };

      if (typeof jsonValue.toJSON === 'function') {
        return this.sanitize(jsonValue.toJSON());
      }

      return Object.fromEntries(
        Object.entries(value)
          .filter(
            ([key]) =>
              !/(password|hash|token|secret|authorization|cookie|credential)/i.test(
                key,
              ),
          )
          .map(([key, item]) => [key, this.sanitize(item)]),
      );
    }

    return value;
  }
}