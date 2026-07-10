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
exports.AdminUserPasskeysController = exports.AuthPasskeysController = exports.MyPasskeysController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const start_passkey_authentication_dto_1 = require("./dto/start-passkey-authentication.dto");
const start_passkey_registration_dto_1 = require("./dto/start-passkey-registration.dto");
const verify_passkey_authentication_dto_1 = require("./dto/verify-passkey-authentication.dto");
const verify_passkey_registration_dto_1 = require("./dto/verify-passkey-registration.dto");
const passkeys_service_1 = require("./passkeys.service");
let MyPasskeysController = class MyPasskeysController {
    constructor(passkeysService) {
        this.passkeysService = passkeysService;
    }
    list(user) {
        return this.passkeysService.listMine(user);
    }
    startRegistration(user, dto) {
        return this.passkeysService.startRegistration(user, dto);
    }
    verifyRegistration(user, dto) {
        return this.passkeysService.verifyRegistration(user, dto);
    }
    delete(user, id) {
        return this.passkeysService.deleteMine(user, id);
    }
};
exports.MyPasskeysController = MyPasskeysController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MyPasskeysController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('registration/options'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_passkey_registration_dto_1.StartPasskeyRegistrationDto]),
    __metadata("design:returntype", void 0)
], MyPasskeysController.prototype, "startRegistration", null);
__decorate([
    (0, common_1.Post)('registration/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_passkey_registration_dto_1.VerifyPasskeyRegistrationDto]),
    __metadata("design:returntype", void 0)
], MyPasskeysController.prototype, "verifyRegistration", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MyPasskeysController.prototype, "delete", null);
exports.MyPasskeysController = MyPasskeysController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('me/passkeys'),
    __metadata("design:paramtypes", [passkeys_service_1.PasskeysService])
], MyPasskeysController);
let AuthPasskeysController = class AuthPasskeysController {
    constructor(passkeysService) {
        this.passkeysService = passkeysService;
    }
    startAuthentication(_dto) {
        return this.passkeysService.startAuthentication();
    }
    verifyAuthentication(dto) {
        return this.passkeysService.verifyAuthentication(dto);
    }
};
exports.AuthPasskeysController = AuthPasskeysController;
__decorate([
    (0, common_1.Post)('authentication/options'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [start_passkey_authentication_dto_1.StartPasskeyAuthenticationDto]),
    __metadata("design:returntype", void 0)
], AuthPasskeysController.prototype, "startAuthentication", null);
__decorate([
    (0, common_1.Post)('authentication/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_passkey_authentication_dto_1.VerifyPasskeyAuthenticationDto]),
    __metadata("design:returntype", void 0)
], AuthPasskeysController.prototype, "verifyAuthentication", null);
exports.AuthPasskeysController = AuthPasskeysController = __decorate([
    (0, common_1.Controller)('auth/passkeys'),
    __metadata("design:paramtypes", [passkeys_service_1.PasskeysService])
], AuthPasskeysController);
let AdminUserPasskeysController = class AdminUserPasskeysController {
    constructor(passkeysService) {
        this.passkeysService = passkeysService;
    }
    listForUser(id) {
        return this.passkeysService.listForUser(id);
    }
    deleteForUser(id, passkeyId, actor) {
        return this.passkeysService.adminDelete(id, passkeyId, actor.userId);
    }
};
exports.AdminUserPasskeysController = AdminUserPasskeysController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('user:passkey:view'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminUserPasskeysController.prototype, "listForUser", null);
__decorate([
    (0, common_1.Delete)(':passkeyId'),
    (0, permissions_decorator_1.Permissions)('user:passkey:manage'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('passkeyId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AdminUserPasskeysController.prototype, "deleteForUser", null);
exports.AdminUserPasskeysController = AdminUserPasskeysController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('admin/users/:id/passkeys'),
    __metadata("design:paramtypes", [passkeys_service_1.PasskeysService])
], AdminUserPasskeysController);
//# sourceMappingURL=passkeys.controller.js.map