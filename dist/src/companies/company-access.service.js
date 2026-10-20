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
exports.CompanyAccessService = void 0;
const common_1 = require("@nestjs/common");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const prisma_service_1 = require("../prisma/prisma.service");
let CompanyAccessService = class CompanyAccessService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCompanyInOrganizationOrThrow(companyId, user, options = {}) {
        const company = await this.prisma.company.findFirst({
            where: {
                id: companyId,
                organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user),
                ...(!options.allowArchived && { archivedAt: null }),
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        return company;
    }
    assertCompanyReadable(companyId, user) {
        return this.getCompanyInOrganizationOrThrow(companyId, user);
    }
    assertCompanyMutable(companyId, user, options = {}) {
        return this.getCompanyInOrganizationOrThrow(companyId, user, options);
    }
};
exports.CompanyAccessService = CompanyAccessService;
exports.CompanyAccessService = CompanyAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompanyAccessService);
//# sourceMappingURL=company-access.service.js.map