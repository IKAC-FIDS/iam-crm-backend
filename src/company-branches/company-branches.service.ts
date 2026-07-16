import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyBranchDto } from './dto/create-company-branch.dto';
import { UpdateCompanyBranchDto } from './dto/update-company-branch.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CompanyAccessService } from '../companies/company-access.service';

@Injectable()
export class CompanyBranchesService {
  constructor(private prisma: PrismaService, private companyAccess: CompanyAccessService) {}

  private async validateCompanyAccess(companyId: string, user: CurrentUserPayload) {
    await this.companyAccess.assertCompanyMutable(companyId, user);
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
