"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationDomainVerificationService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("node:dns/promises");
let OrganizationDomainVerificationService = class OrganizationDomainVerificationService {
    async readTxt(hostname) {
        const timeout = new Promise((_, reject) => {
            const timer = setTimeout(() => reject(new common_1.RequestTimeoutException("DNS verification timed out")), 5_000);
            timer.unref();
        });
        const rows = await Promise.race([(0, promises_1.resolveTxt)(hostname), timeout]);
        return rows
            .map((parts) => parts.join(""))
            .filter((value) => value.length <= 512);
    }
};
exports.OrganizationDomainVerificationService = OrganizationDomainVerificationService;
exports.OrganizationDomainVerificationService = OrganizationDomainVerificationService = __decorate([
    (0, common_1.Injectable)()
], OrganizationDomainVerificationService);
//# sourceMappingURL=organization-domain-verification.service.js.map