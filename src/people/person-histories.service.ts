import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { parseApiDate } from '../common/dates/api-date.util';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import { userMatchesTeam } from '../common/tenant/team-scope.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonEducationHistoryDto, CreatePersonEmploymentHistoryDto, CreatePersonEmploymentPositionDto, UpdatePersonEducationHistoryDto, UpdatePersonEmploymentHistoryDto, UpdatePersonEmploymentPositionDto } from './dto/person-history.dto';

const employmentInclude = { company: { select: { id: true, legalName: true, brandName: true } }, positions: { orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }] } } satisfies Prisma.PersonEmploymentHistoryInclude;

@Injectable()
export class PersonHistoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findEmployment(personId: string, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user);
    return this.prisma.personEmploymentHistory.findMany({ where: { personId }, include: employmentInclude, orderBy: { createdAt: 'desc' } });
  }

  async createEmployment(personId: string, dto: CreatePersonEmploymentHistoryDto, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user);
    const company = await this.assertCompanyAccess(dto.companyId, user);
    const duplicate = await this.prisma.personEmploymentHistory.findUnique({ where: { personId_companyId: { personId, companyId: dto.companyId } } });
    if (duplicate) throw new BadRequestException('Employment history already exists for this company');
    return this.prisma.personEmploymentHistory.create({ data: { personId, companyId: company.id, companyNameSnapshot: company.legalName, description: dto.description?.trim() || undefined }, include: employmentInclude });
  }

  async updateEmployment(personId: string, id: string, dto: UpdatePersonEmploymentHistoryDto, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user);
    const current = await this.getEmployment(personId, id);
    let companyNameSnapshot: string | undefined;
    if (dto.companyId !== undefined) {
      companyNameSnapshot = (await this.assertCompanyAccess(dto.companyId, user)).legalName;
      const duplicate = await this.prisma.personEmploymentHistory.findFirst({ where: { personId, companyId: dto.companyId, NOT: { id } } });
      if (duplicate) throw new BadRequestException('Employment history already exists for this company');
    }
    return this.prisma.personEmploymentHistory.update({ where: { id: current.id }, data: {
      ...(dto.companyId !== undefined && { companyId: dto.companyId, companyNameSnapshot }),
      ...(dto.description !== undefined && { description: dto.description.trim() || null }),
    }, include: employmentInclude });
  }

  async removeEmployment(personId: string, id: string, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user); await this.getEmployment(personId, id);
    return this.prisma.personEmploymentHistory.delete({ where: { id } });
  }

  async createPosition(personId: string, employmentId: string, dto: CreatePersonEmploymentPositionDto, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user); await this.getEmployment(personId, employmentId);
    const data = this.positionData(dto, true);
    return this.prisma.personEmploymentPosition.create({ data: { employmentHistoryId: employmentId, ...data, title: data.title! } });
  }

  async updatePosition(personId: string, employmentId: string, positionId: string, dto: UpdatePersonEmploymentPositionDto, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user); await this.getEmployment(personId, employmentId);
    const current = await this.prisma.personEmploymentPosition.findFirst({ where: { id: positionId, employmentHistoryId: employmentId } });
    if (!current) throw new NotFoundException('Employment position not found');
    const data = this.positionData(dto, false, current);
    return this.prisma.personEmploymentPosition.update({ where: { id: positionId }, data });
  }

  async removePosition(personId: string, employmentId: string, positionId: string, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user); await this.getEmployment(personId, employmentId);
    const result = await this.prisma.personEmploymentPosition.deleteMany({ where: { id: positionId, employmentHistoryId: employmentId } });
    if (!result.count) throw new NotFoundException('Employment position not found');
    return { id: positionId, deleted: true };
  }

  async findEducation(personId: string, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user);
    return this.prisma.personEducationHistory.findMany({ where: { personId }, orderBy: [{ year: 'desc' }, { createdAt: 'desc' }] });
  }

  async createEducation(personId: string, dto: CreatePersonEducationHistoryDto, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user); this.assertMeaningfulEducation(dto);
    return this.prisma.personEducationHistory.create({ data: { personId, degree: dto.degree?.trim() || undefined, university: dto.university?.trim() || undefined, year: dto.year, description: dto.description?.trim() || undefined } });
  }

  async updateEducation(personId: string, id: string, dto: UpdatePersonEducationHistoryDto, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user);
    const current = await this.prisma.personEducationHistory.findFirst({ where: { id, personId } });
    if (!current) throw new NotFoundException('Education history not found');
    const next = { degree: dto.degree !== undefined ? dto.degree.trim() || null : current.degree, university: dto.university !== undefined ? dto.university.trim() || null : current.university, year: dto.year !== undefined ? dto.year : current.year, description: dto.description !== undefined ? dto.description.trim() || null : current.description };
    this.assertMeaningfulEducation(next);
    return this.prisma.personEducationHistory.update({ where: { id }, data: next });
  }

  async removeEducation(personId: string, id: string, user: CurrentUserPayload) {
    await this.assertPersonAccess(personId, user);
    const result = await this.prisma.personEducationHistory.deleteMany({ where: { id, personId } });
    if (!result.count) throw new NotFoundException('Education history not found');
    return { id, deleted: true };
  }

  private positionData(dto: UpdatePersonEmploymentPositionDto, creating: boolean, current?: { title: string; startDate: Date | null; endDate: Date | null; isCurrent: boolean; description: string | null }) {
    const title = dto.title !== undefined ? dto.title.trim() : current?.title;
    if ((creating || dto.title !== undefined) && !title) throw new BadRequestException('Position title is required');
    const startDate = dto.startDate !== undefined ? (dto.startDate ? parseApiDate(dto.startDate, 'startDate') : null) : current?.startDate;
    let endDate = dto.endDate !== undefined ? (dto.endDate ? parseApiDate(dto.endDate, 'endDate') : null) : current?.endDate;
    const isCurrent = dto.isCurrent ?? current?.isCurrent ?? false;
    if (isCurrent) endDate = null;
    if (startDate && endDate && endDate < startDate) throw new BadRequestException('endDate must not be before startDate');
    return { ...(title !== undefined && { title }), startDate, endDate, isCurrent, ...(dto.description !== undefined && { description: dto.description.trim() || null }) };
  }

  private assertMeaningfulEducation(dto: { degree?: string | null; university?: string | null; year?: number | null; description?: string | null }) {
    if (!dto.degree?.trim() && !dto.university?.trim() && dto.year == null && !dto.description?.trim()) throw new BadRequestException('At least one education field is required');
  }

  private async getEmployment(personId: string, id: string) {
    const item = await this.prisma.personEmploymentHistory.findFirst({ where: { id, personId } });
    if (!item) throw new NotFoundException('Employment history not found');
    return item;
  }

  private async assertPersonAccess(personId: string, user: CurrentUserPayload) {
    const person = await this.prisma.person.findFirst({ where: { id: personId, company: { organizationId: getCurrentOrganizationId(user) } }, include: { company: { select: { ownerId: true, owner: { select: { team: true, teamId: true } } } } } });
    if (!person) throw new NotFoundException('Person not found');
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.MANAGER && person.company.owner && userMatchesTeam(person.company.owner, user)) return;
    if (user.role === UserRole.REP && person.company.ownerId === user.userId) return;
    throw new ForbiddenException('You do not have access to this person');
  }

  private async assertCompanyAccess(companyId: string, user: CurrentUserPayload) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, organizationId: getCurrentOrganizationId(user) }, select: { id: true, legalName: true, ownerId: true, owner: { select: { team: true, teamId: true } } } });
    if (!company) throw new NotFoundException('Company not found');
    if (user.role === UserRole.ADMIN || (user.role === UserRole.MANAGER && company.owner && userMatchesTeam(company.owner, user)) || (user.role === UserRole.REP && company.ownerId === user.userId)) return company;
    throw new ForbiddenException('You do not have access to this company');
  }
}
