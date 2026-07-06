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
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PersonSocialsService = class PersonSocialsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validatePersonAccess(personId, user) {
        const person = await this.prisma.person.findUnique({
            where: { id: personId },
            include: { company: { select: { ownerId: true, owner: { select: { team: true } } } } },
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
    async findByPerson(personId, user) {
        await this.validatePersonAccess(personId, user);
        return this.prisma.personSocial.findMany({
            where: { personId },
            orderBy: { platform: 'asc' },
        });
    }
    async findOne(id, user) {
        const social = await this.prisma.personSocial.findUnique({
            where: { id },
            include: { person: true },
        });
        if (!social)
            throw new common_1.NotFoundException('شبکه اجتماعی پیدا نشد');
        await this.validatePersonAccess(social.personId, user);
        return social;
    }
    async update(id, dto, user) {
        const social = await this.prisma.personSocial.findUnique({
            where: { id },
            include: { person: true },
        });
        if (!social)
            throw new common_1.NotFoundException('شبکه اجتماعی پیدا نشد');
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
};
exports.PersonSocialsService = PersonSocialsService;
exports.PersonSocialsService = PersonSocialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PersonSocialsService);
//# sourceMappingURL=person-socials.service.js.map