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
exports.PersonContactsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let PersonContactsService = class PersonContactsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validatePersonAccess(personId, user) {
        const person = await this.prisma.person.findUnique({
            where: { id: personId },
            include: {
                company: {
                    select: {
                        ownerId: true,
                        owner: { select: { team: true } },
                    },
                },
            },
        });
        if (!person)
            throw new common_1.NotFoundException('مخاطب پیدا نشد');
        if (user.role === client_1.UserRole.ADMIN)
            return;
        if (user.role === client_1.UserRole.MANAGER) {
            const companyTeam = person.company.owner?.team;
            if (!companyTeam || companyTeam !== user.team) {
                throw new common_1.ForbiddenException('شما به این مخاطب دسترسی ندارید');
            }
            return;
        }
        if (user.role === client_1.UserRole.REP && person.company.ownerId !== user.userId) {
            throw new common_1.ForbiddenException('شما به این مخاطب دسترسی ندارید');
        }
        if (user.role === client_1.UserRole.BOARDS) {
            throw new common_1.ForbiddenException('شما دسترسی به مخاطبین را ندارید');
        }
    }
    async create(personId, dto, user) {
        await this.validatePersonAccess(personId, user);
        const normalizedType = await this.resolveContactTypeReference(dto.typeOptionId, dto.type, true);
        const value = dto.value.trim();
        if (!value) {
            throw new common_1.BadRequestException('مقدار تماس الزامی است');
        }
        await this.assertNoDuplicateContact(personId, normalizedType.typeOptionId, normalizedType.typeCode, value);
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
    async findByPerson(personId, user) {
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
    async findOne(id, user) {
        const contact = await this.prisma.personContact.findUnique({
            where: { id },
            include: {
                person: true,
                typeOption: true,
            },
        });
        if (!contact)
            throw new common_1.NotFoundException('اطلاعات تماس پیدا نشد');
        await this.validatePersonAccess(contact.personId, user);
        return contact;
    }
    async update(id, dto, user) {
        const contact = await this.prisma.personContact.findUnique({
            where: { id },
            include: {
                person: true,
                typeOption: true,
            },
        });
        if (!contact)
            throw new common_1.NotFoundException('اطلاعات تماس پیدا نشد');
        await this.validatePersonAccess(contact.personId, user);
        const updateData = {};
        let nextTypeOptionId = contact.typeOptionId;
        let nextTypeCode = contact.type;
        let nextValue = contact.value;
        if (dto.typeOptionId !== undefined || dto.type !== undefined) {
            const normalizedType = await this.resolveContactTypeReference(dto.typeOptionId, dto.type, true);
            nextTypeOptionId = normalizedType.typeOptionId;
            nextTypeCode = normalizedType.typeCode;
            updateData.typeOptionId = normalizedType.typeOptionId;
            updateData.type = normalizedType.typeCode;
        }
        if (dto.value !== undefined) {
            nextValue = dto.value.trim();
            if (!nextValue) {
                throw new common_1.BadRequestException('مقدار تماس الزامی است');
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
            await this.assertNoDuplicateContact(contact.personId, nextTypeOptionId, nextTypeCode, nextValue, id);
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
    async remove(id, user) {
        const contact = await this.prisma.personContact.findUnique({
            where: { id },
            include: { person: true },
        });
        if (!contact)
            throw new common_1.NotFoundException('اطلاعات تماس پیدا نشد');
        await this.validatePersonAccess(contact.personId, user);
        return this.prisma.personContact.delete({
            where: { id },
        });
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
    async assertNoDuplicateContact(personId, typeOptionId, typeCode, value, excludeId) {
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
            throw new common_1.BadRequestException('این راه تماس برای این مخاطب قبلاً ثبت شده است');
        }
    }
};
exports.PersonContactsService = PersonContactsService;
exports.PersonContactsService = PersonContactsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PersonContactsService);
//# sourceMappingURL=person-contacts.service.js.map