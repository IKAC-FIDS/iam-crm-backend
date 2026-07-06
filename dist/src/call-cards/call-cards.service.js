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
exports.CallCardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CallCardsService = class CallCardsService {
    constructor(prisma) {
        this.prisma = prisma;
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
            throw new common_1.ForbiddenException('شما دسترسی به Call Cards را ندارید');
        }
    }
    async findByCompany(companyId, user) {
        await this.validateCompanyAccess(companyId, user);
        return this.prisma.callCard.findUnique({ where: { companyId } });
    }
    async upsert(companyId, dto, user) {
        await this.validateCompanyAccess(companyId, user);
        const data = { ...dto };
        if (data.discoveryQs) {
            data.discoveryQs = data.discoveryQs;
        }
        if (data.objections) {
            data.objections = data.objections;
        }
        return this.prisma.callCard.upsert({
            where: { companyId },
            create: { companyId, ...data },
            update: { ...data },
        });
    }
    async suggest(companyId, user) {
        await this.validateCompanyAccess(companyId, user);
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            include: { people: true },
        });
        if (!company)
            throw new common_1.NotFoundException('شرکت پیدا نشد');
        const personaTags = company.people.map((p) => p.personaTag).filter(Boolean);
        const personaMatches = personaTags.length
            ? await this.prisma.personaLibrary.findMany({
                where: { titlePattern: { in: personaTags } },
            })
            : [];
        const industryData = company.industry
            ? await this.prisma.industry.findFirst({
                where: { name: company.industry },
                include: {
                    painPoints: {
                        include: { painPoint: true },
                        orderBy: { priority: 'asc' },
                    },
                    useCases: {
                        include: { useCase: true },
                        orderBy: { priority: 'asc' },
                    },
                },
            })
            : null;
        return {
            suggestedPainPoints: [
                ...personaMatches.map((m) => m.defaultPainPoint).filter(Boolean),
                ...(industryData?.painPoints.map((p) => p.painPoint.title) || []),
            ].filter(Boolean),
            suggestedUseCases: [
                ...personaMatches.map((m) => m.defaultUseCase).filter(Boolean),
                ...(industryData?.useCases.map((u) => u.useCase.title) || []),
            ].filter(Boolean),
            matchedPersonas: personaMatches,
            matchedIndustry: industryData,
        };
    }
};
exports.CallCardsService = CallCardsService;
exports.CallCardsService = CallCardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CallCardsService);
//# sourceMappingURL=call-cards.service.js.map