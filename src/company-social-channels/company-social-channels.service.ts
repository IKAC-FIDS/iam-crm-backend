import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanySocialChannelDto } from './dto/create-company-social-channel.dto';
import { UpdateCompanySocialChannelDto } from './dto/update-company-social-channel.dto';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { userMatchesTeam } from '../common/tenant/team-scope.util';

@Injectable()
export class CompanySocialChannelsService {
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
  async create(companyId: string, dto: CreateCompanySocialChannelDto, user: CurrentUserPayload) {
    await this.validateCompanyAccess(companyId, user);

    return this.prisma.companySocialChannel.create({
      data: {
        companyId,
        platform: dto.platform,
        handle: dto.handle,
      },
    });
  }

  async findByCompany(companyId: string, user: CurrentUserPayload) {
    await this.validateCompanyAccess(companyId, user);

    return this.prisma.companySocialChannel.findMany({
      where: { companyId },
      orderBy: { platform: 'asc' },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const channel = await this.prisma.companySocialChannel.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!channel) {
      throw new NotFoundException('کانال اجتماعی پیدا نشد');
    }

    await this.validateCompanyAccess(channel.companyId, user);
    return channel;
  }

  async update(id: string, dto: UpdateCompanySocialChannelDto, user: CurrentUserPayload) {
    const channel = await this.prisma.companySocialChannel.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!channel) {
      throw new NotFoundException('کانال اجتماعی پیدا نشد');
    }

    await this.validateCompanyAccess(channel.companyId, user);

    return this.prisma.companySocialChannel.update({
      where: { id },
      data: {
        platform: dto.platform,
        handle: dto.handle,
      },
    });
  }

  async remove(id: string, user: CurrentUserPayload) {
    const channel = await this.prisma.companySocialChannel.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!channel) {
      throw new NotFoundException('کانال اجتماعی پیدا نشد');
    }

    await this.validateCompanyAccess(channel.companyId, user);

    return this.prisma.companySocialChannel.delete({
      where: { id },
    });
  }
}
