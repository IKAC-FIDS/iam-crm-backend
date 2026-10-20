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
exports.CustomerAccessService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomerAccessService = class CustomerAccessService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolve(userId, membershipId) {
        const membership = await this.prisma.customerCompanyMembership.findFirst({
            where: {
                id: membershipId,
                userId,
                status: client_1.CustomerMembershipStatus.ACTIVE,
                user: { isActive: true, principalType: client_1.UserPrincipalType.CUSTOMER },
                company: { portalEnabled: true, archivedAt: null },
                organization: { status: 'ACTIVE' },
            },
            include: {
                user: { select: { id: true, email: true, fullName: true } },
                company: { select: { id: true, organizationId: true, legalName: true, brandName: true, portalEnabled: true } },
            },
        });
        if (!membership || membership.company.organizationId !== membership.organizationId) {
            throw new common_1.UnauthorizedException('Portal membership is not active');
        }
        return membership;
    }
    async assertCompany(companyId, organizationId) {
        const company = await this.prisma.company.findFirst({
            where: { id: companyId, organizationId, archivedAt: null },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        return company;
    }
};
exports.CustomerAccessService = CustomerAccessService;
exports.CustomerAccessService = CustomerAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomerAccessService);
//# sourceMappingURL=customer-access.service.js.map