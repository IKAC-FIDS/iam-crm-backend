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
exports.PersonSocialsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let PersonSocialsService = class PersonSocialsService {
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
        const normalizedPlatform = await this.resolveSocialPlatformReference(dto.platformOptionId, dto.platform, true);
        const handle = dto.handle.trim();
        if (!handle) {
            throw new common_1.BadRequestException('شناسه یا لینک شبکه اجتماعی الزامی است');
        }
        await this.assertNoDuplicateSocial(personId, normalizedPlatform.platformOptionId, normalizedPlatform.platformCode, handle);
        if (dto.isPrimary) {
            await this.prisma.personSocial.updateMany({
                where: { personId, isPrimary: true },
                data: { isPrimary: false },
            });
        }
        return this.prisma.personSocial.create({
            data: {
                personId,
                platformOptionId: normalizedPlatform.platformOptionId,
                platform: normalizedPlatform.platformCode,
                handle,
                isPrimary: dto.isPrimary ?? false,
                note: dto.note?.trim() || undefined,
            },
            include: {
                platformOption: true,
            },
        });
    }
    async findByPerson(personId, user) {
        await this.validatePersonAccess(personId, user);
        return this.prisma.personSocial.findMany({
            where: { personId },
            include: {
                platformOption: true,
            },
            orderBy: [
                { isPrimary: 'desc' },
                { platform: 'asc' },
                { createdAt: 'asc' },
            ],
        });
    }
    async findOne(id, user) {
        const social = await this.prisma.personSocial.findUnique({
            where: { id },
            include: {
                person: true,
                platformOption: true,
            },
        });
        if (!social)
            throw new common_1.NotFoundException('شبکه اجتماعی پیدا نشد');
        await this.validatePersonAccess(social.personId, user);
        return social;
    }
    async update(id, dto, user) {
        const social = await this.prisma.personSocial.findUnique({
            where: { id },
            include: {
                person: true,
                platformOption: true,
            },
        });
        if (!social)
            throw new common_1.NotFoundException('شبکه اجتماعی پیدا نشد');
        await this.validatePersonAccess(social.personId, user);
        const updateData = {};
        let nextPlatformOptionId = social.platformOptionId;
        let nextPlatformCode = social.platform;
        let nextHandle = social.handle;
        if (dto.platformOptionId !== undefined || dto.platform !== undefined) {
            const normalizedPlatform = await this.resolveSocialPlatformReference(dto.platformOptionId, dto.platform, true);
            nextPlatformOptionId = normalizedPlatform.platformOptionId;
            nextPlatformCode = normalizedPlatform.platformCode;
            updateData.platformOptionId = normalizedPlatform.platformOptionId;
            updateData.platform = normalizedPlatform.platformCode;
        }
        if (dto.handle !== undefined) {
            nextHandle = dto.handle.trim();
            if (!nextHandle) {
                throw new common_1.BadRequestException('شناسه یا لینک شبکه اجتماعی الزامی است');
            }
            updateData.handle = nextHandle;
        }
        if (dto.isPrimary !== undefined) {
            updateData.isPrimary = dto.isPrimary;
        }
        if (dto.note !== undefined) {
            updateData.note = dto.note?.trim() || null;
        }
        if (dto.platformOptionId !== undefined ||
            dto.platform !== undefined ||
            dto.handle !== undefined) {
            await this.assertNoDuplicateSocial(social.personId, nextPlatformOptionId, nextPlatformCode, nextHandle, id);
        }
        if (dto.isPrimary) {
            await this.prisma.personSocial.updateMany({
                where: {
                    personId: social.personId,
                    isPrimary: true,
                    NOT: { id },
                },
                data: { isPrimary: false },
            });
        }
        return this.prisma.personSocial.update({
            where: { id },
            data: updateData,
            include: {
                platformOption: true,
            },
        });
    }
    async remove(id, user) {
        const social = await this.prisma.personSocial.findUnique({
            where: { id },
            include: { person: true },
        });
        if (!social)
            throw new common_1.NotFoundException('شبکه اجتماعی پیدا نشد');
        await this.validatePersonAccess(social.personId, user);
        return this.prisma.personSocial.delete({
            where: { id },
        });
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
    async assertNoDuplicateSocial(personId, platformOptionId, platformCode, handle, excludeId) {
        const duplicate = await this.prisma.personSocial.findFirst({
            where: {
                personId,
                handle,
                OR: [
                    ...(platformOptionId ? [{ platformOptionId }] : []),
                    { platform: platformCode },
                ],
                ...(excludeId ? { NOT: { id: excludeId } } : {}),
            },
        });
        if (duplicate) {
            throw new common_1.BadRequestException('این شبکه اجتماعی برای این مخاطب قبلاً ثبت شده است');
        }
    }
};
exports.PersonSocialsService = PersonSocialsService;
exports.PersonSocialsService = PersonSocialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PersonSocialsService);
//# sourceMappingURL=person-socials.service.js.map