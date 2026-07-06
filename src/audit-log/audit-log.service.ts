import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FindAuditLogsDto } from './dto/find-audit-logs.dto';

export interface RecordAuditInput {
  actorId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  record(input: RecordAuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        ...(input.before !== undefined && { before: this.sanitize(input.before) as Prisma.InputJsonValue }),
        ...(input.after !== undefined && { after: this.sanitize(input.after) as Prisma.InputJsonValue }),
        ...(input.metadata !== undefined && { metadata: this.sanitize(input.metadata) as Prisma.InputJsonValue }),
      },
    });
  }

  async findAll(query: FindAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    if (startDate && endDate && startDate > endDate) throw new BadRequestException('startDate must be before or equal to endDate');
    const where: Prisma.AuditLogWhereInput = {
      ...(query.actorId && { actorId: query.actorId }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.action && { action: query.action }),
      ...((startDate || endDate) && { createdAt: { gte: startDate, lte: endDate } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.auditLog.count({ where }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
  }

  private sanitize(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'bigint') return value.toString();
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).filter(([key]) => !/(password|hash|token|secret|authorization)/i.test(key)).map(([key, item]) => [key, this.sanitize(item)]));
    }
    return value;
  }
}
