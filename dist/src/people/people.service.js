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
exports.PeopleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PeopleService = class PeopleService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findDirectory(query, user) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const and = [{ company: { archivedAt: null } }];
        if (user.role === client_1.UserRole.MANAGER) {
            and.push(user.team ? { company: { owner: { team: user.team } } } : { id: { in: [] } });
        }
        else if (user.role === client_1.UserRole.REP) {
            and.push({ company: { ownerId: user.userId } });
        }
        else if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما دسترسی به فهرست مخاطبین را ندارید');
        }
        if (query.companyId)
            and.push({ companyId: query.companyId });
        if (query.ownerId)
            and.push({ company: { ownerId: query.ownerId } });
        if (query.team?.trim())
            and.push({ company: { owner: { team: query.team.trim() } } });
        if (query.department?.trim())
            and.push({ department: query.department.trim() });
        if (query.jobTitle?.trim())
            and.push({ title: query.jobTitle.trim() });
        if (query.seniorityLevel?.trim())
            and.push({ seniorityLevel: query.seniorityLevel.trim() });
        const personaRoleFilter = query.personaRole?.trim() || query.personaTag?.trim();
        if (personaRoleFilter)
            and.push({ personaTag: personaRoleFilter });
        if (query.isPrimaryContact !== undefined)
            and.push({ isPrimaryContact: query.isPrimaryContact === 'true' });
        const emailAvailability = {
            OR: [
                { AND: [{ email: { not: null } }, { email: { not: '' } }] },
                { contacts: { some: { type: { contains: 'EMAIL', mode: 'insensitive' } } } },
            ],
        };
        const phoneTypes = ['MOBILE', 'WORK', 'HOME', 'INTERNAL', 'PHONE', 'WORK_PHONE'];
        const phoneAvailability = {
            OR: [
                { AND: [{ phone: { not: null } }, { phone: { not: '' } }] },
                { contacts: { some: { type: { in: phoneTypes } } } },
            ],
        };
        if (query.hasEmail !== undefined)
            and.push(query.hasEmail === 'true' ? emailAvailability : { NOT: emailAvailability });
        if (query.hasPhone !== undefined)
            and.push(query.hasPhone === 'true' ? phoneAvailability : { NOT: phoneAvailability });
        const search = query.search?.trim();
        if (search) {
            and.push({ OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { title: { contains: search, mode: 'insensitive' } },
                    { department: { contains: search, mode: 'insensitive' } },
                    { personaTag: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search, mode: 'insensitive' } },
                    { contacts: { some: { value: { contains: search, mode: 'insensitive' } } } },
                    { company: { legalName: { contains: search, mode: 'insensitive' } } },
                    { company: { brandName: { contains: search, mode: 'insensitive' } } },
                ] });
        }
        const where = { AND: and };
        const [people, total] = await Promise.all([
            this.prisma.person.findMany({
                where,
                select: {
                    id: true, companyId: true, fullName: true, title: true, department: true, personaTag: true, seniorityLevel: true,
                    email: true, phone: true, isPrimaryContact: true, createdAt: true, updatedAt: true,
                    company: { select: { id: true, legalName: true, brandName: true, owner: { select: { id: true, fullName: true, email: true, team: true } } } },
                    contacts: {
                        select: {
                            id: true,
                            type: true,
                            typeOption: true,
                            value: true,
                            isPrimary: true,
                        },
                        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
                    },
                    socials: {
                        select: {
                            id: true,
                            platform: true,
                            platformOption: true,
                            handle: true,
                        },
                    },
                },
                orderBy: [{ fullName: 'asc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.person.count({ where }),
        ]);
        const emailContact = (contacts) => contacts.find((item) => item.type.toUpperCase().includes('EMAIL'))?.value ?? null;
        const phoneContact = (contacts) => contacts.find((item) => phoneTypes.includes(item.type.toUpperCase()))?.value ?? null;
        const data = people.map((person) => ({
            ...this.withDomainAliases(person),
            emailSummary: person.email || emailContact(person.contacts),
            phoneSummary: person.phone || phoneContact(person.contacts),
        }));
        const totalPages = Math.ceil(total / limit);
        return { data, meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrevious: page > 1 } };
    }
    async findByCompany(companyId, pagination, user) {
        if (!companyId) {
            throw new common_1.BadRequestException('شناسه شرکت الزامی است');
        }
        await this.validateCompanyAccess(companyId, user);
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 20;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.person.findMany({
                where: { companyId },
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.person.count({ where: { companyId } }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: data.map((person) => this.withDomainAliases(person)),
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
    async findOne(id, user) {
        const person = await this.prisma.person.findUnique({
            where: { id },
            include: {
                company: true,
                contacts: true,
                socials: true,
            },
        });
        if (!person)
            throw new common_1.NotFoundException('مخاطب پیدا نشد');
        await this.validateCompanyAccess(person.companyId, user);
        return this.withDomainAliases(person);
    }
    async create(dto, user) {
        await this.validateCompanyAccess(dto.companyId, user);
        const { contacts, socials, jobTitle, personaRole, ...personData } = dto;
        const normalizedContacts = await Promise.all((contacts ?? []).map(async (contact) => {
            const normalizedType = await this.resolveContactTypeReference(contact.typeOptionId, contact.type, true);
            const value = contact.value.trim();
            if (!value) {
                throw new common_1.BadRequestException('مقدار تماس الزامی است');
            }
            return {
                typeOptionId: normalizedType.typeOptionId,
                type: normalizedType.typeCode,
                value,
                isPrimary: contact.isPrimary ?? false,
                note: contact.note?.trim() || undefined,
            };
        }));
        const normalizedSocials = await Promise.all((socials ?? []).map(async (social) => {
            const normalizedPlatform = await this.resolveSocialPlatformReference(social.platformOptionId, social.platform, true);
            const handle = social.handle.trim();
            if (!handle) {
                throw new common_1.BadRequestException('شناسه یا لینک شبکه اجتماعی الزامی است');
            }
            return {
                platformOptionId: normalizedPlatform.platformOptionId,
                platform: normalizedPlatform.platformCode,
                handle,
                isPrimary: social.isPrimary ?? false,
                note: social.note?.trim() || undefined,
            };
        }));
        return this.prisma.person.create({
            data: {
                ...personData,
                title: jobTitle ?? personData.title,
                personaTag: personaRole ?? personData.personaTag,
                contacts: {
                    create: normalizedContacts,
                },
                socials: {
                    create: normalizedSocials,
                },
            },
            include: {
                contacts: {
                    include: {
                        typeOption: true,
                    },
                },
                socials: {
                    include: {
                        platformOption: true,
                    },
                },
            },
        }).then((person) => this.withDomainAliases(person));
    }
    async update(id, dto, user) {
        const person = await this.prisma.person.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!person)
            throw new common_1.NotFoundException('مخاطب پیدا نشد');
        await this.validateCompanyAccess(person.companyId, user);
        const { jobTitle, personaRole, ...personData } = dto;
        return this.prisma.person.update({
            where: { id },
            data: {
                ...personData,
                ...(jobTitle !== undefined && { title: jobTitle }),
                ...(personaRole !== undefined && { personaTag: personaRole }),
            },
        }).then((updated) => this.withDomainAliases(updated));
    }
    async remove(id, user) {
        const person = await this.prisma.person.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!person)
            throw new common_1.NotFoundException('مخاطب پیدا نشد');
        await this.validateCompanyAccess(person.companyId, user);
        return this.prisma.person.delete({
            where: { id },
        });
    }
    withDomainAliases(person) {
        return {
            ...person,
            jobTitle: person.title ?? null,
            personaRole: person.personaTag ?? null,
        };
    }
    async validateCompanyAccess(companyId, user) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: { ownerId: true, owner: { select: { team: true } } },
        });
        if (!company) {
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        }
        if (user.role === client_1.UserRole.ADMIN)
            return;
        if (user.role === client_1.UserRole.MANAGER) {
            const companyTeam = company.owner?.team;
            if (!companyTeam || companyTeam !== user.team) {
                throw new common_1.ForbiddenException('شما به این شرکت دسترسی ندارید');
            }
            return;
        }
        if (user.role === client_1.UserRole.REP && company.ownerId !== user.userId) {
            throw new common_1.ForbiddenException('شما به این شرکت دسترسی ندارید');
        }
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما دسترسی به مخاطبین را ندارید');
        }
    }
    async resolveContactTypeReference(typeOptionId, type, required = false) {
        if (typeOptionId) {
            const option = await this.prisma.lookupOption.findFirst({
                where: {
                    id: typeOptionId,
                    group: 'contact_types',
                    isActive: true,
                },
            });
            if (!option) {
                throw new common_1.BadRequestException('نوع تماس انتخاب‌شده معتبر یا فعال نیست');
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
                throw new common_1.BadRequestException('نوع تماس باید از گزینه‌های پایه contact_types انتخاب شود. مقدار متنی آزاد مجاز نیست');
            }
            return {
                typeOptionId: option.id,
                typeCode: option.code,
            };
        }
        if (required) {
            throw new common_1.BadRequestException('typeOptionId یا type الزامی است');
        }
        return {
            typeOptionId: null,
            typeCode: '',
        };
    }
    async resolveSocialPlatformReference(platformOptionId, platform, required = false) {
        if (platformOptionId) {
            const option = await this.prisma.lookupOption.findFirst({
                where: {
                    id: platformOptionId,
                    group: 'social_types',
                    isActive: true,
                },
            });
            if (!option) {
                throw new common_1.BadRequestException('پلتفرم انتخاب‌شده معتبر یا فعال نیست');
            }
            return {
                platformOptionId: option.id,
                platformCode: option.code,
            };
        }
        const normalizedPlatform = platform?.trim();
        if (normalizedPlatform) {
            const option = await this.prisma.lookupOption.findFirst({
                where: {
                    group: 'social_types',
                    isActive: true,
                    OR: [
                        {
                            code: {
                                equals: normalizedPlatform,
                                mode: 'insensitive',
                            },
                        },
                        {
                            label: {
                                equals: normalizedPlatform,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            });
            if (!option) {
                throw new common_1.BadRequestException('پلتفرم باید از گزینه‌های پایه social_types انتخاب شود. مقدار متنی آزاد مجاز نیست');
            }
            return {
                platformOptionId: option.id,
                platformCode: option.code,
            };
        }
        if (required) {
            throw new common_1.BadRequestException('platformOptionId یا platform الزامی است');
        }
        return {
            platformOptionId: null,
            platformCode: '',
        };
    }
};
exports.PeopleService = PeopleService;
exports.PeopleService = PeopleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PeopleService);
//# sourceMappingURL=people.service.js.map