import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreatePersonSocialDto, UpdatePersonSocialDto } from '../people/dto/person-social.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class PersonSocialsService {
  constructor(private prisma: PrismaService) {}

  private async validatePersonAccess(personId: string, user: CurrentUserPayload) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      include: { company: { select: { ownerId: true, owner: { select: { team: true } } } } },
    });

    if (!person) throw new NotFoundException('مخاطب پیدا نشد');

    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.MANAGER) {
      const companyTeam = person.company.owner?.team;
      if (!companyTeam || companyTeam !== user.team) {
        throw new ForbiddenException('شما به این مخاطب دسترسی ندارید');
      }
      return;
    }

    if (user.role === UserRole.REP && person.company.ownerId !== user.userId) {
      throw new ForbiddenException('شما به این مخاطب دسترسی ندارید');
    }

    if (user.role === UserRole.BOARDS) {
      throw new ForbiddenException('شما دسترسی به مخاطبین را ندارید');
    }
  }

  async create(personId: string, dto: CreatePersonSocialDto, user: CurrentUserPayload) {
    await this.validatePersonAccess(personId, user);

    if (dto.isPrimary) {
      await this.prisma.personSocial.updateMany({
        where: { personId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.personSocial.create({
      data: {
        personId,
        platform: dto.platform,
        handle: dto.handle,
        isPrimary: dto.isPrimary || false,
        note: dto.note,
      },
    });
  }

  async findByPerson(personId: string, user: CurrentUserPayload) {
    await this.validatePersonAccess(personId, user);

    return this.prisma.personSocial.findMany({
      where: { personId },
      orderBy: { platform: 'asc' },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const social = await this.prisma.personSocial.findUnique({
      where: { id },
      include: { person: true },
    });

    if (!social) throw new NotFoundException('شبکه اجتماعی پیدا نشد');

    await this.validatePersonAccess(social.personId, user);
    return social;
  }

  async update(id: string, dto: UpdatePersonSocialDto, user: CurrentUserPayload) {
    const social = await this.prisma.personSocial.findUnique({
      where: { id },
      include: { person: true },
    });

    if (!social) throw new NotFoundException('شبکه اجتماعی پیدا نشد');

    await this.validatePersonAccess(social.personId, user);

    if (dto.isPrimary) {
      await this.prisma.personSocial.updateMany({
        where: { personId: social.personId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.personSocial.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, user: CurrentUserPayload) {
    const social = await this.prisma.personSocial.findUnique({
      where: { id },
      include: { person: true },
    });

    if (!social) throw new NotFoundException('شبکه اجتماعی پیدا نشد');

    await this.validatePersonAccess(social.personId, user);

    return this.prisma.personSocial.delete({
      where: { id },
    });
  }
}