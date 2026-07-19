import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { FindOwnerOptionsDto } from './dto/find-owner-options.dto';

const safeUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  roleId: true,
  assignedRole: { select: { id: true, code: true, name: true, baseRole: true, isSystem: true, isActive: true } },
  team: true,
  teamId: true,
  teamRef: {
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
    },
  },
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const ownerOptionSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  roleId: true,
  teamId: true,
  team: true,
  teamRef: { select: { id: true, code: true, name: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditLogService,
  ) {}

  async create(dto: CreateUserDto, actor?: CurrentUserPayload) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const teamAssignment = await this.resolveTeamAssignment(dto.teamId, dto.team, actor);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: dto.role,
        team: teamAssignment.team,
        teamId: teamAssignment.teamId,
        organizationId: actor ? getCurrentOrganizationId(actor) : undefined,
      },
      select: safeUserSelect,
    });

    await this.audit.record({
      actorId: actor?.userId,
      entityType: 'user',
      entityId: user.id,
      action: 'user.created',
      after: user,
    });

    return user;
  }

  async findAll(query: FindUsersDto, actor: CurrentUserPayload) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();
    const and: Prisma.UserWhereInput[] = [
      { organizationId: getCurrentOrganizationId(actor) },
    ];

    if (query.role) and.push({ role: query.role });
    if (query.teamId) and.push({ teamId: query.teamId });
    if (query.team?.trim()) {
      const team = query.team.trim();
      and.push({
        OR: [
          { team },
          { teamRef: { code: { equals: team, mode: 'insensitive' } } },
          { teamRef: { name: { equals: team, mode: 'insensitive' } } },
        ],
      });
    }
    if (query.isActive !== undefined) and.push({ isActive: query.isActive });
    if (search) {
      and.push({
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.UserWhereInput = and.length ? { AND: and } : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: safeUserSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
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

  getOwnerOptions(user: CurrentUserPayload) {
    return this.prisma.user.findMany({
      where: {
        organizationId: getCurrentOrganizationId(user),
        isActive: true,
        role: { in: [UserRole.REP, UserRole.MANAGER] },
      },
      select: ownerOptionSelect,
      orderBy: [{ fullName: 'asc' }, { email: 'asc' }],
    });
  }

  async findOwnerOptions(user: CurrentUserPayload, query: FindOwnerOptionsDto) {
    const organizationId = getCurrentOrganizationId(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const search = query.search?.trim();

    if (query.teamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: query.teamId, organizationId, isActive: true },
        select: { id: true },
      });
      if (!team) throw new NotFoundException('Team not found');
    }

    const where: Prisma.UserWhereInput = {
      organizationId,
      isActive: true,
      role: { in: [UserRole.REP, UserRole.MANAGER] },
      ...(query.teamId && { teamId: query.teamId }),
    };
    if (query.selectedId) {
      where.id = query.selectedId;
    } else if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: ownerOptionSelect,
        orderBy: [{ fullName: 'asc' }, { email: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
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

  async findOne(id: string, actor: CurrentUserPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId: getCurrentOrganizationId(actor) },
      select: safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deactivate(id: string, actor: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(actor);
    const user = await this.prisma.user.findFirst({ where: { id, organizationId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: safeUserSelect,
    });

    await this.audit.record({
      actorId: actor.userId,
      organizationId,
      entityType: 'user',
      entityId: id,
      action: 'user.deactivated',
      before: user,
      after: updated,
    });

    return updated;
  }

  async activate(id: string, actor: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(actor);
    const user = await this.prisma.user.findFirst({ where: { id, organizationId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: safeUserSelect,
    });

    await this.audit.record({
      actorId: actor.userId,
      organizationId,
      entityType: 'user',
      entityId: id,
      action: 'user.activated',
      before: user,
      after: updated,
    });

    return updated;
  }

  async updateUserRole(id: string, dto: UpdateUserRoleDto, actor?: CurrentUserPayload) {
    if (!dto.role && !dto.roleId) {
      throw new BadRequestException('role or roleId is required');
    }
    const organizationId = actor ? getCurrentOrganizationId(actor) : undefined;
    const user = await this.prisma.user.findFirst({
      where: { id, ...(organizationId && { organizationId }) },
      include: { ownedCompanies: { select: { id: true } } },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const assignedRole = dto.roleId
      ? await this.prisma.role.findFirst({ where: { id: dto.roleId, isActive: true }, include: { permissions: { include: { permission: true } } } })
      : null;
    if (dto.roleId && !assignedRole) throw new BadRequestException('Role does not exist or is inactive');
    const nextBaseRole = assignedRole?.baseRole ?? dto.role ?? user.role;
    if (actor?.userId === id && user.role === UserRole.ADMIN && assignedRole) {
      const actions = new Set(assignedRole.permissions.map((item) => item.permission.action));
      if (!actions.has('permission:manage') || !actions.has('role:manage')) throw new BadRequestException('You cannot remove your own RBAC management access');
    }

    const teamAssignment = await this.resolveTeamAssignment(
      dto.teamId,
      dto.team,
      actor,
      {
        teamId: user.teamId,
        team: user.team,
      },
    );

    if (
      nextBaseRole === UserRole.MANAGER &&
      user.ownedCompanies.length > 0 &&
      !teamAssignment.teamId &&
      !teamAssignment.team
    ) {
      throw new BadRequestException('A manager with owned companies must have a team');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        role: nextBaseRole,
        roleId: assignedRole?.id ?? (dto.role ? null : user.roleId),
        team: teamAssignment.team,
        teamId: teamAssignment.teamId,
      },
      select: safeUserSelect,
    });

    PermissionsGuard.clearCache(nextBaseRole);
    if (assignedRole) PermissionsGuard.clearCache(`role:${assignedRole.id}`);
    PermissionsGuard.clearCache(user.role);

    await this.audit.record({
      actorId: actor?.userId,
      organizationId,
      entityType: 'user',
      entityId: id,
      action: 'user.role_changed',
      before: user,
      after: updatedUser,
    });

    return updatedUser;
  }

  private async resolveTeamAssignment(
    teamId: string | null | undefined,
    legacyTeam: string | undefined,
    actor?: CurrentUserPayload,
    current: { teamId: string | null; team: string | null } = {
      teamId: null,
      team: null,
    },
  ): Promise<{ teamId: string | null; team: string | null }> {
    if (teamId !== undefined) {
      if (teamId === null) {
        return {
          teamId: null,
          team: legacyTeam !== undefined ? legacyTeam.trim() || null : null,
        };
      }

      const team = await this.prisma.team.findFirst({
        where: {
          id: teamId,
          isActive: true,
          ...(actor && { organizationId: getCurrentOrganizationId(actor) }),
        },
      });

      if (!team) {
        throw new BadRequestException('Selected team is invalid or inactive');
      }

      return {
        teamId: team.id,
        team: team.code,
      };
    }

    if (legacyTeam !== undefined) {
      return {
        teamId: current.teamId,
        team: legacyTeam.trim() || null,
      };
    }

    return current;
  }
}
