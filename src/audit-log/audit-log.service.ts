import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CurrentUserPayload } from "../common/decorators/current-user.decorator";
import { parseApiDateRange } from "../common/dates/api-date.util";
import { ReportExportService } from "../common/export/report-export.service";
import { getCurrentOrganizationId } from "../common/tenant/tenant-scope.util";
import { PrismaService } from "../prisma/prisma.service";
import { AuditRequestContextService } from "./audit-request-context.service";
import { FindAuditLogsDto } from "./dto/find-audit-logs.dto";

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
  organizationId?: string | null;
}
@Injectable()
export class AuditLogService {
  constructor(
    private prisma: PrismaService,
    private requestContext: AuditRequestContextService,
    private exporter: ReportExportService,
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
        organizationId: input.organizationId ?? context?.organizationId ?? null,
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
  async findAll(query: FindAuditLogsDto, user: CurrentUserPayload) {
    const page = query.page ?? 1,
      limit = query.limit ?? 20,
      where = this.where(query, user);
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return {
      data: await this.present(rows, Boolean(query.compact)),
      meta: this.meta(total, page, limit),
    };
  }
  async findOne(id: string, user: CurrentUserPayload) {
    const row = await this.prisma.auditLog.findFirst({
      where: { id, organizationId: getCurrentOrganizationId(user) },
    });
    if (!row) throw new NotFoundException("Audit log not found");
    return (await this.present([row], false))[0];
  }
  async summary(query: FindAuditLogsDto, user: CurrentUserPayload) {
    const where = this.where(query, user);
    const rows = await this.prisma.auditLog.findMany({
      where,
      select: {
        actorId: true,
        action: true,
        entityType: true,
        createdAt: true,
      },
    });
    const actors = await this.actors(rows.map((r) => r.actorId));
    const count = (key: "action" | "entityType") =>
      [...this.group(rows, (r) => r[key])]
        .map(([value, items]) => ({ [key]: value, count: items.length }))
        .sort((a, b) => b.count - a.count);
    const byActor = [...this.group(rows, (r) => r.actorId ?? "SYSTEM")]
      .map(([id, items]) => ({
        actorId: id === "SYSTEM" ? null : id,
        actorName:
          id === "SYSTEM" ? "System" : (actors.get(id)?.fullName ?? "Unknown"),
        count: items.length,
      }))
      .sort((a, b) => b.count - a.count);
    return {
      period: this.period(query),
      totalEvents: rows.length,
      uniqueActors: new Set(rows.map((r) => r.actorId).filter(Boolean)).size,
      byAction: count("action"),
      byEntityType: count("entityType"),
      byActor,
      trend: this.trend(rows),
    };
  }
  async filterOptions(query: FindAuditLogsDto, user: CurrentUserPayload) {
    const rows = await this.prisma.auditLog.findMany({
      where: this.where(query, user),
      select: {
        actorId: true,
        entityType: true,
        action: true,
        requestMethod: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
    const actorMap = await this.actors(rows.map((r) => r.actorId));
    return {
      actors: [...actorMap.values()],
      entityTypes: [...new Set(rows.map((r) => r.entityType))].sort(),
      actions: [...new Set(rows.map((r) => r.action))].sort(),
      requestMethods: [
        ...new Set(rows.map((r) => r.requestMethod).filter(Boolean)),
      ].sort(),
    };
  }
  async export(query: FindAuditLogsDto, user: CurrentUserPayload) {
    const format = query.format ?? "csv",
      max = query.includePayload ? 5000 : format === "csv" ? 50000 : 20000,
      where = this.where(query, user),
      total = await this.prisma.auditLog.count({ where });
    if (total > max)
      throw new BadRequestException({
        code: "EXPORT_ROW_LIMIT_EXCEEDED",
        message: `Export is limited to ${max} rows`,
        maxRows: max,
        totalRows: total,
      });
    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: max,
    });
    const data = await this.present(rows, !query.includePayload);
    const flat = data.map((r: any) => ({
      id: r.id,
      createdAt: r.createdAt,
      actor: r.actor?.fullName ?? "System",
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      requestId: r.request?.requestId,
      method: r.request?.method,
      path: r.request?.path,
      ipAddress: r.request?.ipAddress,
      changedFields: r.changedFields.join(", "),
      ...(query.includePayload
        ? {
            before: this.cap(r.before),
            after: this.cap(r.after),
            metadata: this.cap(r.metadata),
          }
        : {}),
    }));
    const file = this.exporter.create(
      format,
      "audit-logs",
      [{ name: "Audit Logs", rows: flat }],
      max,
    );
    await this.record({
      actorId: user.userId,
      organizationId: getCurrentOrganizationId(user),
      entityType: "audit-log",
      action: "audit-log.exported",
      metadata: {
        format,
        rowCount: file.rowCount,
        filters: this.filterSummary(query),
      },
    });
    return file;
  }
  private where(
    q: FindAuditLogsDto,
    user: CurrentUserPayload,
  ): Prisma.AuditLogWhereInput {
    const range = parseApiDateRange(
      q.startDate,
      q.endDate,
      "startDate",
      "endDate",
    );
    const actorIds = q.actorIds ?? (q.actorId ? [q.actorId] : undefined),
      entityTypes =
        q.entityTypes ?? (q.entityType ? [q.entityType] : undefined),
      actions = q.actions ?? (q.action ? [q.action] : undefined),
      methods =
        q.requestMethods?.map((x) => x.toUpperCase()) ??
        (q.requestMethod ? [q.requestMethod.toUpperCase()] : undefined);
    return {
      organizationId: getCurrentOrganizationId(user),
      ...(actorIds && { actorId: { in: actorIds } }),
      ...(entityTypes && { entityType: { in: entityTypes } }),
      ...(q.entityId && { entityId: q.entityId }),
      ...(actions && { action: { in: actions } }),
      ...(q.requestId && { requestId: q.requestId }),
      ...(q.ipAddress && {
        ipAddress: { contains: q.ipAddress, mode: "insensitive" },
      }),
      ...(methods && { requestMethod: { in: methods } }),
      ...(q.requestPath && {
        requestPath: { contains: q.requestPath, mode: "insensitive" },
      }),
      ...(range && { createdAt: range }),
      ...(q.search && {
        OR: [
          { action: { contains: q.search, mode: "insensitive" } },
          { entityType: { contains: q.search, mode: "insensitive" } },
          { entityId: { contains: q.search, mode: "insensitive" } },
          { requestPath: { contains: q.search, mode: "insensitive" } },
          { requestId: { contains: q.search, mode: "insensitive" } },
        ],
      }),
    };
  }
  private async present(rows: any[], compact: boolean) {
    const actorMap = await this.actors(rows.map((r) => r.actorId));
    return rows.map((row) => {
      const before = this.sanitize(row.before),
        after = this.sanitize(row.after),
        metadata = this.sanitize(row.metadata),
        base = {
          id: row.id,
          actorId: row.actorId,
          actor: row.actorId ? (actorMap.get(row.actorId) ?? null) : null,
          entityType: row.entityType,
          entityId: row.entityId,
          action: row.action,
          createdAt: row.createdAt,
          changedFields: this.changed(before, after),
          request: {
            requestId: row.requestId,
            ipAddress: row.ipAddress,
            userAgent: row.userAgent,
            method: row.requestMethod,
            path: row.requestPath,
          },
        };
      return compact ? base : { ...base, before, after, metadata };
    });
  }
  private async actors(ids: (string | null)[]) {
    const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
    const rows = unique.length
      ? await this.prisma.user.findMany({
          where: { id: { in: unique } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    return new Map(rows.map((r) => [r.id, r]));
  }
  sanitize(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "bigint") return value.toString();
    if (Array.isArray(value)) return value.map((v) => this.sanitize(v));
    if (value && typeof value === "object") {
      const json = value as { toJSON?: () => unknown };
      if (typeof json.toJSON === "function")
        return this.sanitize(json.toJSON());
      return Object.fromEntries(
        Object.entries(value)
          .filter(
            ([key]) =>
              !/(password|hash|token|secret|authorization|cookie|credential|session|private.?key)/i.test(
                key,
              ),
          )
          .map(([key, item]) => [key, this.sanitize(item)]),
      );
    }
    return value;
  }
  private changed(before: unknown, after: unknown) {
    const out: string[] = [];
    const walk = (a: any, b: any, path: string, depth: number) => {
      if (out.length >= 100 || depth > 4) return;
      if (Array.isArray(a) || Array.isArray(b)) {
        if (JSON.stringify(a) !== JSON.stringify(b)) out.push(path || "$");
        return;
      }
      if (a && b && typeof a === "object" && typeof b === "object") {
        for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
          walk(a[key], b[key], path ? `${path}.${key}` : key, depth + 1);
        return;
      }
      if (JSON.stringify(a) !== JSON.stringify(b)) out.push(path || "$");
    };
    walk(before, after, "", 0);
    return out;
  }
  private trend(rows: { createdAt: Date }[]) {
    if (!rows.length) return [];
    const min = Math.min(...rows.map((r) => r.createdAt.getTime())),
      max = Math.max(...rows.map((r) => r.createdAt.getTime())) + 1,
      step = max - min <= 31 * 86400000 ? 86400000 : 7 * 86400000,
      out: Array<{ periodStart: string; periodEnd: string; count: number }> =
        [];
    for (let t = min; t < max; t += step) {
      const end = Math.min(max, t + step);
      out.push({
        periodStart: new Date(t).toISOString(),
        periodEnd: new Date(end).toISOString(),
        count: rows.filter(
          (r) => r.createdAt.getTime() >= t && r.createdAt.getTime() < end,
        ).length,
      });
    }
    return out;
  }
  private group<T>(rows: T[], key: (row: T) => string) {
    const m = new Map<string, T[]>();
    for (const row of rows) {
      const k = key(row);
      m.set(k, [...(m.get(k) ?? []), row]);
    }
    return m;
  }
  private meta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }
  private period(q: FindAuditLogsDto) {
    const r = parseApiDateRange(q.startDate, q.endDate);
    return {
      startDate: r?.gte?.toISOString() ?? null,
      endDate: (r?.lt ?? r?.lte)?.toISOString() ?? null,
    };
  }
  private cap(value: unknown) {
    const text = JSON.stringify(this.sanitize(value));
    return text.length > 10000 ? `${text.slice(0, 10000)}...[TRUNCATED]` : text;
  }
  private filterSummary(q: FindAuditLogsDto) {
    return {
      startDate: q.startDate,
      endDate: q.endDate,
      actorIds: q.actorIds,
      entityTypes: q.entityTypes,
      actions: q.actions,
      requestMethods: q.requestMethods,
      requestId: q.requestId,
      entityId: q.entityId,
    };
  }
}
