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
const sso_admin_controller_1 = require("./sso-admin.controller");
const sso_public_controller_1 = require("./sso-public.controller");
const sso_provider_service_1 = require("./sso-provider.service");
const sso_secret_service_1 = require("./sso-secret.service");
const sso_ticket_service_1 = require("./sso-ticket.service");
let SsoModule = class SsoModule {
};
exports.SsoModule = SsoModule;
exports.SsoModule = SsoModule = __decorate([
    (0, common_1.Module)({
        controllers: [sso_public_controller_1.SsoPublicController, sso_admin_controller_1.SsoAdminController],
        providers: [sso_provider_service_1.SsoProviderService, sso_secret_service_1.SsoSecretService, sso_ticket_service_1.SsoTicketService],
        exports: [sso_provider_service_1.SsoProviderService, sso_secret_service_1.SsoSecretService, sso_ticket_service_1.SsoTicketService],
    })
], SsoModule);
//# sourceMappingURL=sso.module.js.map