import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationStatus, Prisma, UserRole } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FindOrganizationsDto } from './dto/find-organizations.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async current(user: CurrentUserPayload) {
    const organization = await this.prisma.organization.findUnique({
      where: {
        id: getCurrentOrganizationId(user),
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async findAll(query: FindOrganizationsDto, user: CurrentUserPayload) {
    this.assertAdmin(user);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.OrganizationWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    const search = query.search?.trim();

    if (search) {
      where.OR = [
        {
          code: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
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
    this.assertAdmin(user);

    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async create(dto: CreateOrganizationDto, user: CurrentUserPayload) {
    this.assertAdmin(user);

    const code = this.normalizeCode(dto.code);

    const duplicate = await this.prisma.organization.findUnique({
      where: { code },
    });

    if (duplicate) {
      throw new ConflictException('Organization code already exists');
    }

    const organization = await this.prisma.organization.create({
      data: {
        code,
        name: this.requiredText(dto.name, 'نام سازمان الزامی است'),
        status: dto.status ?? OrganizationStatus.ACTIVE,
        timezone: dto.timezone?.trim() || 'Asia/Tehran',
        locale: dto.locale?.trim() || 'fa-IR',
        settings: dto.settings as Prisma.InputJsonValue | undefined,
      },
    });

    await this.audit.record({
      actorId: user.userId,
      organizationId: getCurrentOrganizationId(user),
      entityType: 'organization',
      entityId: organization.id,
      action: 'organization.created',
      after: organization,
    });

    return organization;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    user: CurrentUserPayload,
  ) {
    this.assertAdmin(user);

    const current = await this.findOne(id, user);

    const data: Prisma.OrganizationUpdateInput = {};

    if (dto.code !== undefined) {
      const code = this.normalizeCode(dto.code);

      const duplicate = await this.prisma.organization.findFirst({
        where: {
          code,
          NOT: {
            id,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException('Organization code already exists');
      }

      data.code = code;
    }

    if (dto.name !== undefined) {
      data.name = this.requiredText(dto.name, 'نام سازمان الزامی است');
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (dto.timezone !== undefined) {
      data.timezone = dto.timezone?.trim() || 'Asia/Tehran';
    }

    if (dto.locale !== undefined) {
      data.locale = dto.locale?.trim() || 'fa-IR';
    }

    if (dto.settings !== undefined) {
      data.settings = dto.settings as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data,
    });

    await this.audit.record({
      actorId: user.userId,
      organizationId: getCurrentOrganizationId(user),
      entityType: 'organization',
      entityId: id,
      action: 'organization.updated',
      before: current,
      after: updated,
    });

    return updated;
  }

  async activate(id: string, user: CurrentUserPayload) {
    this.assertAdmin(user);

    const current = await this.findOne(id, user);

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        status: OrganizationStatus.ACTIVE,
      },
    });

    await this.audit.record({
      actorId: user.userId,
      organizationId: getCurrentOrganizationId(user),
      entityType: 'organization',
      entityId: id,
      action: 'organization.activated',
      before: current,
      after: updated,
    });

    return updated;
  }

  async suspend(id: string, user: CurrentUserPayload) {
    this.assertAdmin(user);

    const current = await this.findOne(id, user);

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        status: OrganizationStatus.SUSPENDED,
      },
    });

    await this.audit.record({
      actorId: user.userId,
      organizationId: getCurrentOrganizationId(user),
      entityType: 'organization',
      entityId: id,
      action: 'organization.suspended',
      before: current,
      after: updated,
    });

    return updated;
  }

  private assertAdmin(user: CurrentUserPayload) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ADMIN can manage organizations');
    }
  }

  private normalizeCode(code: string) {
    const normalized = code.trim().toLowerCase();

    if (!normalized) {
      throw new BadRequestException('کد سازمان الزامی است');
    }

    return normalized;
  }

  private requiredText(value: string, message: string) {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }
}
