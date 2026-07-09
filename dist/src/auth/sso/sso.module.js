"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SsoModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth.module");
const oidc_controller_1 = require("./oidc.controller");
const oidc_service_1 = require("./oidc.service");
const sso_admin_controller_1 = require("./sso-admin.controller");
const sso_exchange_controller_1 = require("./sso-exchange.controller");
const sso_public_controller_1 = require("./sso-public.controller");
const sso_provider_service_1 = require("./sso-provider.service");
const sso_secret_service_1 = require("./sso-secret.service");
const sso_ticket_service_1 = require("./sso-ticket.service");
const saml_controller_1 = require("./saml.controller");
const saml_service_1 = require("./saml.service");
let SsoModule = class SsoModule {
};
exports.SsoModule = SsoModule;
exports.SsoModule = SsoModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [
            sso_public_controller_1.SsoPublicController,
            sso_admin_controller_1.SsoAdminController,
            oidc_controller_1.OidcController,
            saml_controller_1.SamlController,
            sso_exchange_controller_1.SsoExchangeController,
        ],
        providers: [
            sso_provider_service_1.SsoProviderService,
            sso_secret_service_1.SsoSecretService,
            sso_ticket_service_1.SsoTicketService,
            oidc_service_1.OidcService,
            saml_service_1.SamlService,
        ],
        exports: [
            sso_provider_service_1.SsoProviderService,
            sso_secret_service_1.SsoSecretService,
            sso_ticket_service_1.SsoTicketService,
            oidc_service_1.OidcService,
            saml_service_1.SamlService,
        ],
    })
], SsoModule);
//# sourceMappingURL=sso.module.js.map