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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SamlController = void 0;
const common_1 = require("@nestjs/common");
const saml_service_1 = require("./saml.service");
let SamlController = class SamlController {
    constructor(samlService) {
        this.samlService = samlService;
    }
    async login(providerId) {
        const url = await this.samlService.buildLoginUrl(providerId);
        return {
            url,
            statusCode: 302,
        };
    }
    async acs(providerId, req, res) {
        const redirectUrl = await this.samlService.handleAcs(providerId, req.body);
        return res.redirect(302, redirectUrl);
    }
    async metadata(providerId, res) {
        const xml = await this.samlService.generateMetadata(providerId);
        res.setHeader('Content-Type', 'application/samlmetadata+xml');
        return res.send(xml);
    }
};
exports.SamlController = SamlController;
__decorate([
    (0, common_1.Get)(':providerId/login'),
    (0, common_1.Redirect)(),
    __param(0, (0, common_1.Param)('providerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "login", null);
__decorate([
    (0, common_1.Post)(':providerId/acs'),
    __param(0, (0, common_1.Param)('providerId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "acs", null);
__decorate([
    (0, common_1.Get)(':providerId/metadata'),
    __param(0, (0, common_1.Param)('providerId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "metadata", null);
exports.SamlController = SamlController = __decorate([
    (0, common_1.Controller)('auth/saml'),
    __metadata("design:paramtypes", [saml_service_1.SamlService])
], SamlController);
//# sourceMappingURL=saml.controller.js.map