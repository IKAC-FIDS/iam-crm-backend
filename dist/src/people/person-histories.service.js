"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonHistoriesService = void 0;
const common_1 = require("@nestjs/common");
const api_date_util_1 = require("../common/dates/api-date.util");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
const employmentInclude = { company: { select: { id: true, legalName: true, brandName: true } }, positions: { orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }] } };
let PersonHistoriesService = class PersonHistoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findEmployment(personId, user) {
        await this.assertPersonReadable(personId, user);
        return this.prisma.personEmploymentHistory.findMany({ where: { personId }, include: employmentInclude, orderBy: { createdAt: 'desc' } });
    }
    async createEmployment(personId, dto, user) {
        await this.assertPersonMutable(personId, user);
        const company = await this.assertCompanyAccess(dto.companyId, user);
        const duplicate = await this.prisma.personEmploymentHistory.findUnique({ where: { personId_companyId: { personId, companyId: dto.companyId } } });
        if (duplicate)
            throw new common_1.BadRequestException('Employment history already exists for this company');
        return this.prisma.personEmploymentHistory.create({ data: { personId, companyId: company.id, companyNameSnapshot: company.legalName, description: dto.description?.trim() || undefined }, include: employmentInclude });
    }
    async updateEmployment(personId, id, dto, user) {
        await this.assertPersonMutable(personId, user);
        const current = await this.getEmployment(personId, id);
        let companyNameSnapshot;
        if (dto.companyId !== undefined) {
            companyNameSnapshot = (await this.assertCompanyAccess(dto.companyId, user)).legalName;
            const duplicate = await this.prisma.personEmploymentHistory.findFirst({ where: { personId, companyId: dto.companyId, NOT: { id } } });
            if (duplicate)
                throw new common_1.BadRequestException('Employment history already exists for this company');
        }
        return this.prisma.personEmploymentHistory.update({ where: { id: current.id }, data: {
                ...(dto.companyId !== undefined && { companyId: dto.companyId, companyNameSnapshot }),
                ...(dto.description !== undefined && { description: dto.description.trim() || null }),
            }, include: employmentInclude });
    }
    async removeEmployment(personId, id, user) {
        await this.assertPersonMutable(personId, user);
        await this.getEmployment(personId, id);
        return this.prisma.personEmploymentHistory.delete({ where: { id } });
    }
    async createPosition(personId, employmentId, dto, user) {
        await this.assertPersonMutable(personId, user);
        await this.getEmployment(personId, employmentId);
        const data = this.positionData(dto, true);
        return this.prisma.personEmploymentPosition.create({ data: { employmentHistoryId: employmentId, ...data, title: data.title } });
    }
    async updatePosition(personId, employmentId, positionId, dto, user) {
        await this.assertPersonMutable(personId, user);
        await this.getEmployment(personId, employmentId);
        const current = await this.prisma.personEmploymentPosition.findFirst({ where: { id: positionId, employmentHistoryId: employmentId } });
        if (!current)
            throw new common_1.NotFoundException('Employment position not found');
        const data = this.positionData(dto, false, current);
        return this.prisma.personEmploymentPosition.update({ where: { id: positionId }, data });
    }
    async removePosition(personId, employmentId, positionId, user) {
        await this.assertPersonMutable(personId, user);
        await this.getEmployment(personId, employmentId);
        const result = await this.prisma.personEmploymentPosition.deleteMany({ where: { id: positionId, employmentHistoryId: employmentId } });
        if (!result.count)
            throw new common_1.NotFoundException('Employment position not found');
        return { id: positionId, deleted: true };
    }
    async findEducation(personId, user) {
        await this.assertPersonReadable(personId, user);
        const items = await this.prisma.personEducationHistory.findMany({ where: { personId }, include: { university: { select: { id: true, name: true } } }, orderBy: [{ educationDate: 'desc' }, { createdAt: 'desc' }] });
        return items.map((item) => ({ ...item, degreeLabel: item.degree ? this.degreeLabel(item.degree) : null }));
    }
    async createEducation(personId, dto, user) {
        await this.assertPersonMutable(personId, user);
        this.assertMeaningfulEducation(dto);
        const university = dto.universityId ? await this.getActiveUniversity(dto.universityId) : null;
        const item = await this.prisma.personEducationHistory.create({ data: { personId, degree: dto.degree, universityId: university?.id, universityNameSnapshot: university?.name, educationDate: dto.educationDate ? (0, api_date_util_1.parseApiDate)(dto.educationDate, 'educationDate') : undefined, description: dto.description?.trim() || undefined }, include: { university: { select: { id: true, name: true } } } });
        return { ...item, degreeLabel: item.degree ? this.degreeLabel(item.degree) : null };
    }
    async updateEducation(personId, id, dto, user) {
        await this.assertPersonMutable(personId, user);
        const current = await this.prisma.personEducationHistory.findFirst({ where: { id, personId } });
        if (!current)
            throw new common_1.NotFoundException('Education history not found');
        const university = dto.universityId !== undefined ? await this.getActiveUniversity(dto.universityId) : undefined;
        const next = { degree: dto.degree !== undefined ? dto.degree : current.degree, universityId: university !== undefined ? university.id : current.universityId, universityNameSnapshot: university !== undefined ? university.name : current.universityNameSnapshot, educationDate: dto.educationDate !== undefined ? (dto.educationDate ? (0, api_date_util_1.parseApiDate)(dto.educationDate, 'educationDate') : null) : current.educationDate, description: dto.description !== undefined ? dto.description.trim() || null : current.description };
        this.assertMeaningfulEducation(next);
        const item = await this.prisma.personEducationHistory.update({ where: { id }, data: next, include: { university: { select: { id: true, name: true } } } });
        return { ...item, degreeLabel: item.degree ? this.degreeLabel(item.degree) : null };
    }
    async removeEducation(personId, id, user) {
        await this.assertPersonMutable(personId, user);
        const result = await this.prisma.personEducationHistory.deleteMany({ where: { id, personId } });
        if (!result.count)
            throw new common_1.NotFoundException('Education history not found');
        return { id, deleted: true };
    }
    positionData(dto, creating, current) {
        const title = dto.title !== undefined ? dto.title.trim() : current?.title;
        if ((creating || dto.title !== undefined) && !title)
            throw new common_1.BadRequestException('Position title is required');
        const startDate = dto.startDate !== undefined ? (dto.startDate ? (0, api_date_util_1.parseApiDate)(dto.startDate, 'startDate') : null) : current?.startDate;
        let endDate = dto.endDate !== undefined ? (dto.endDate ? (0, api_date_util_1.parseApiDate)(dto.endDate, 'endDate') : null) : current?.endDate;
        const isCurrent = dto.isCurrent ?? current?.isCurrent ?? false;
        if (isCurrent)
            endDate = null;
        if (startDate && endDate && endDate < startDate)
            throw new common_1.BadRequestException('endDate must not be before startDate');
        return { ...(title !== undefined && { title }), startDate, endDate, isCurrent, ...(dto.description !== undefined && { description: dto.description.trim() || null }) };
    }
    assertMeaningfulEducation(dto) {
        if (!dto.degree && !dto.universityId && !dto.educationDate && !dto.description?.trim())
            throw new common_1.BadRequestException('At least one education field is required');
    }
    async getActiveUniversity(id) {
        const university = await this.prisma.university.findFirst({ where: { id, isActive: true }, select: { id: true, name: true } });
        if (!university)
            throw new common_1.BadRequestException('Selected university does not exist or is inactive');
        return university;
    }
    degreeLabel(degree) {
        return { DIPLOMA: 'دیپلم', ASSOCIATE: 'کاردانی', BACHELOR: 'کارشناسی', PHD: 'دکتری', POSTDOC: 'پسا دکتری' }[degree];
    }
    async getEmployment(personId, id) {
        const item = await this.prisma.personEmploymentHistory.findFirst({ where: { id, personId } });
        if (!item)
            throw new common_1.NotFoundException('Employment history not found');
        return item;
    }
    async assertPersonMutable(personId, user) {
        const scopedPerson = await this.prisma.person.findFirst({ where: { id: personId, company: { organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), archivedAt: null } }, select: { id: true } });
        if (!scopedPerson)
            throw new common_1.NotFoundException('Person not found');
        return;
    }
    async assertPersonReadable(personId, user) {
        const person = await this.prisma.person.findFirst({
            where: {
                id: personId,
                company: {
                    organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                    archivedAt: null,
                },
            },
            select: { id: true },
        });
        if (!person)
            throw new common_1.NotFoundException('Person not found');
    }
    async assertCompanyAccess(companyId, user) {
        const scopedCompany = await this.prisma.company.findFirst({ where: { id: companyId, organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), archivedAt: null }, select: { id: true, legalName: true } });
        if (!scopedCompany)
            throw new common_1.NotFoundException('Company not found');
        return scopedCompany;
    }
};
exports.PersonHistoriesService = PersonHistoriesService;
exports.PersonHistoriesService = PersonHistoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PersonHistoriesService);
//# sourceMappingURL=person-histories.service.js.map