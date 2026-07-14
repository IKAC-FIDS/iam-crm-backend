import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyBranchDto } from './dto/create-company-branch.dto';
import { UpdateCompanyBranchDto } from './dto/update-company-branch.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { userMatchesTeam } from '../common/tenant/team-scope.util';

@Injectable()
export class CompanyBranchesService {
  constructor(private prisma: PrismaService) {}

  private async validateCompanyAccess(companyId: string, user: CurrentUserPayload) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { ownerId: true, owner: { select: { team: true, teamId: true } } },
    });

    if (!company) {
      throw new NotFoundException('شرکت پیدا نشد');
    }

    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.MANAGER) {
      if (!company.owner || !userMatchesTeam(company.owner, user)) {
        throw new ForbiddenException('شما به این شرکت دسترسی ندارید');
      }
      return;
    }

    if (user.role === UserRole.REP && company.ownerId !== user.userId) {
      throw new ForbiddenException('شما به این شرکت دسترسی ندارید');
    }
  }

  // ✅ اصلاح: companyId به عنوان پارامتر جداگانه
  async create(companyId: string, dto: CreateCompanyBranchDto, user: CurrentUserPayload) {
    await this.validateCompanyAccess(companyId, user);

    return this.prisma.companyBranch.create({
      data: {
        companyId,
        name: dto.name,
        city: dto.city,
        address: dto.address,
        phone: dto.phone,
      },
    });
  }

  async findByCompany(companyId: string, user: CurrentUserPayload) {
    await this.validateCompanyAccess(companyId, user);

    return this.prisma.companyBranch.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const branch = await this.prisma.companyBranch.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!branch) {
      throw new NotFoundException('شعبه پیدا نشد');
    }

    await this.validateCompanyAccess(branch.companyId, user);
    return branch;
  }

  async update(id: string, dto: UpdateCompanyBranchDto, user: CurrentUserPayload) {
    const branch = await this.prisma.companyBranch.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!branch) {
      throw new NotFoundException('شعبه پیدا نشد');
    }

    await this.validateCompanyAccess(branch.companyId, user);

    return this.prisma.companyBranch.update({
      where: { id },
      data: {
        name: dto.name,
        city: dto.city,
        address: dto.address,
        phone: dto.phone,
      },
    });
  }

  async remove(id: string, user: CurrentUserPayload) {
    const branch = await this.prisma.companyBranch.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!branch) {
      throw new NotFoundException('شعبه پیدا نشد');
    }

    await this.validateCompanyAccess(branch.companyId, user);

    return this.prisma.companyBranch.delete({
      where: { id },
    });
  }
}
