"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsModule = void 0;
const common_1 = require("@nestjs/common");
const organizations_controller_1 = require("./organizations.controller");
const organizations_service_1 = require("./organizations.service");
const platform_authority_module_1 = require("../platform-authority/platform-authority.module");
const platform_organizations_controller_1 = require("./platform-organizations.controller");
const organization_configuration_service_1 = require("./organization-configuration.service");
const organization_domain_verification_service_1 = require("./organization-domain-verification.service");
let OrganizationsModule = class OrganizationsModule {
};
exports.OrganizationsModule = OrganizationsModule;
exports.OrganizationsModule = OrganizationsModule = __decorate([
    (0, common_1.Module)({
        imports: [platform_authority_module_1.PlatformAuthorityModule],
        controllers: [organizations_controller_1.OrganizationsController, platform_organizations_controller_1.PlatformOrganizationsController],
        providers: [organizations_service_1.OrganizationsService, organization_configuration_service_1.OrganizationConfigurationService, organization_domain_verification_service_1.OrganizationDomainVerificationService],
        exports: [organizations_service_1.OrganizationsService, organization_configuration_service_1.OrganizationConfigurationService],
    })
], OrganizationsModule);
//# sourceMappingURL=organizations.module.js.map