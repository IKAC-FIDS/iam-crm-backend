import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { userMatchesTeam } from '../common/tenant/team-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePersonContactDto,
  UpdatePersonContactDto,
} from '../people/dto/person-contact.dto';

@Injectable()
export class PersonContactsService {
  constructor(private prisma: PrismaService) {}

  private async validatePersonAccess(personId: string, user: CurrentUserPayload) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      include: {
        company: {
          select: {
            ownerId: true,
            owner: { select: { team: true, teamId: true } },
          },
        },
      },
    });

    if (!person) throw new NotFoundException('مخاطب پیدا نشد');

    if (user.role === UserRole.ADMIN) return;

    if (user.role === UserRole.MANAGER) {
      if (!person.company.owner || !userMatchesTeam(person.company.owner, user)) {
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

  async create(
    personId: string,
    dto: CreatePersonContactDto,
    user: CurrentUserPayload,
  ) {
    await this.validatePersonAccess(personId, user);

    const normalizedType = await this.resolveContactTypeReference(
      dto.typeOptionId,
      dto.type,
      true,
    );

    const value = dto.value.trim();

    if (!value) {
      throw new BadRequestException('مقدار تماس الزامی است');
    }

    await this.assertNoDuplicateContact(
      personId,
      normalizedType.typeOptionId,
      normalizedType.typeCode,
      value,
    );

    if (dto.isPrimary) {
      await this.prisma.personContact.updateMany({
        where: { personId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.personContact.create({
      data: {
        personId,
        typeOptionId: normalizedType.typeOptionId,
        type: normalizedType.typeCode,
        value,
        isPrimary: dto.isPrimary ?? false,
        note: dto.note?.trim() || undefined,
      },
      include: {
        typeOption: true,
      },
    });
  }

  async findByPerson(personId: string, user: CurrentUserPayload) {
    await this.validatePersonAccess(personId, user);

    return this.prisma.personContact.findMany({
      where: { personId },
      include: {
        typeOption: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { type: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async findOne(id: string, user: CurrentUserPayload) {
    const contact = await this.prisma.personContact.findUnique({
      where: { id },
      include: {
        person: true,
        typeOption: true,
      },
    });

    if (!contact) throw new NotFoundException('اطلاعات تماس پیدا نشد');

    await this.validatePersonAccess(contact.personId, user);

    return contact;
  }

  async update(
    id: string,
    dto: UpdatePersonContactDto,
    user: CurrentUserPayload,
  ) {
    const contact = await this.prisma.personContact.findUnique({
      where: { id },
      include: {
        person: true,
        typeOption: true,
      },
    });

    if (!contact) throw new NotFoundException('اطلاعات تماس پیدا نشد');

    await this.validatePersonAccess(contact.personId, user);

    const updateData: {
      typeOptionId?: string | null;
      type?: string;
      value?: string;
      isPrimary?: boolean;
      note?: string | null;
    } = {};

    let nextTypeOptionId = contact.typeOptionId;
    let nextTypeCode = contact.type;
    let nextValue = contact.value;

    if (dto.typeOptionId !== undefined || dto.type !== undefined) {
      const normalizedType = await this.resolveContactTypeReference(
        dto.typeOptionId,
        dto.type,
        true,
      );

      nextTypeOptionId = normalizedType.typeOptionId;
      nextTypeCode = normalizedType.typeCode;

      updateData.typeOptionId = normalizedType.typeOptionId;
      updateData.type = normalizedType.typeCode;
    }

    if (dto.value !== undefined) {
      nextValue = dto.value.trim();

      if (!nextValue) {
        throw new BadRequestException('مقدار تماس الزامی است');
      }

      updateData.value = nextValue;
    }

    if (dto.isPrimary !== undefined) {
      updateData.isPrimary = dto.isPrimary;
    }

    if (dto.note !== undefined) {
      updateData.note = dto.note?.trim() || null;
    }

    if (dto.typeOptionId !== undefined || dto.type !== undefined || dto.value !== undefined) {
      await this.assertNoDuplicateContact(
        contact.personId,
        nextTypeOptionId,
        nextTypeCode,
        nextValue,
        id,
      );
    }

    if (dto.isPrimary) {
      await this.prisma.personContact.updateMany({
        where: {
          personId: contact.personId,
          isPrimary: true,
          NOT: { id },
        },
        data: { isPrimary: false },
      });
    }

    return this.prisma.personContact.update({
      where: { id },
      data: updateData,
      include: {
        typeOption: true,
      },
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

  private async resolveContactTypeReference(
    typeOptionId?: string,
    type?: string,
    required = false,
  ): Promise<{
    typeOptionId: string | null;
    typeCode: string;
  }> {
    if (typeOptionId) {
      const option = await this.prisma.lookupOption.findFirst({
        where: {
          id: typeOptionId,
          group: 'contact_types',
          isActive: true,
        },
      });

      if (!option) {
        throw new BadRequestException('نوع تماس انتخاب‌شده معتبر یا فعال نیست');
      }

      return {
        typeOptionId: option.id,
        typeCode: option.code,
      };
    }

    const normalizedType = type?.trim();

    if (normalizedType) {
      const option = await this.prisma.lookupOption.findFirst({
        where: {
          group: 'contact_types',
          isActive: true,
          OR: [
            {
              code: {
                equals: normalizedType,
                mode: 'insensitive',
              },
            },
            {
              label: {
                equals: normalizedType,
                mode: 'insensitive',
              },
            },
          ],
        },
      });

      if (!option) {
        throw new BadRequestException(
          'نوع تماس باید از گزینه‌های پایه contact_types انتخاب شود. مقدار متنی آزاد مجاز نیست',
        );
      }

      return {
        typeOptionId: option.id,
        typeCode: option.code,
      };
    }

    if (required) {
      throw new BadRequestException('typeOptionId یا type الزامی است');
    }

    return {
      typeOptionId: null,
      typeCode: '',
    };
  }

  private async assertNoDuplicateContact(
    personId: string,
    typeOptionId: string | null,
    typeCode: string,
    value: string,
    excludeId?: string,
  ) {
    const duplicate = await this.prisma.personContact.findFirst({
      where: {
        personId,
        value,
        OR: [
          ...(typeOptionId ? [{ typeOptionId }] : []),
          { type: typeCode },
        ],
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (duplicate) {
      throw new BadRequestException('این راه تماس برای این مخاطب قبلاً ثبت شده است');
    }
  }
}
