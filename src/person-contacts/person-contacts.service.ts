import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreatePersonContactDto, UpdatePersonContactDto } from '../people/dto/person-contact.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class PersonContactsService {
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

  async create(personId: string, dto: CreatePersonContactDto, user: CurrentUserPayload) {
    await this.validatePersonAccess(personId, user);

    // اگر isPrimary = true، سایر مخاطبین اصلی را غیرفعال کن
    if (dto.isPrimary) {
      await this.prisma.personContact.updateMany({
        where: { personId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.personContact.create({
      data: {
        personId,
        type: dto.type,
        value: dto.value,
        isPrimary: dto.isPrimary || false,
        note: dto.note,
      },
    });
  }

  async findByPerson(personId: string, user: CurrentUserPayload) {
    await this.validatePersonAccess(personId, user);

    return this.prisma.personContact.findMany({
      where: { personId },
      orderBy: { type: 'asc' },
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const contact = await this.prisma.personContact.findUnique({
      where: { id },
      include: { person: true },
    });

    if (!contact) throw new NotFoundException('اطلاعات تماس پیدا نشد');

    await this.validatePersonAccess(contact.personId, user);
    return contact;
  }

  async update(id: string, dto: UpdatePersonContactDto, user: CurrentUserPayload) {
    const contact = await this.prisma.personContact.findUnique({
      where: { id },
      include: { person: true },
    });

    if (!contact) throw new NotFoundException('اطلاعات تماس پیدا نشد');

    await this.validatePersonAccess(contact.personId, user);

    if (dto.isPrimary) {
      await this.prisma.personContact.updateMany({
        where: { personId: contact.personId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.personContact.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, user: CurrentUserPayload) {
    const contact = await this.prisma.personContact.findUnique({
      where: { id },
      include: { person: true },
    });

    if (!contact) throw new NotFoundException('اطلاعات تماس پیدا نشد');

    await this.validatePersonAccess(contact.personId, user);

    return this.prisma.personContact.delete({
      where: { id },
    });
  }
}