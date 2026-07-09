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
exports.SsoPublicController = void 0;
const common_1 = require("@nestjs/common");
const sso_provider_service_1 = require("./sso-provider.service");
let SsoPublicController = class SsoPublicController {
    constructor(service) {
        this.service = service;
    }
    listProviders() {
        return this.service.listPublicProviders();
    }
};
exports.SsoPublicController = SsoPublicController;
__decorate([
    (0, common_1.Get)('providers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SsoPublicController.prototype, "listProviders", null);
exports.SsoPublicController = SsoPublicController = __decorate([
    (0, common_1.Controller)('auth/sso'),
    __metadata("design:paramtypes", [sso_provider_service_1.SsoProviderService])
], SsoPublicController);
//# sourceMappingURL=sso-public.controller.js.map