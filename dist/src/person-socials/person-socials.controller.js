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
exports.PersonSocialsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const person_socials_service_1 = require("./person-socials.service");
const person_social_dto_1 = require("../people/dto/person-social.dto");
let PersonSocialsController = class PersonSocialsController {
    constructor(socialsService) {
        this.socialsService = socialsService;
    }
    create(personId, dto, user) {
        return this.socialsService.create(personId, dto, user);
    }
    findAll(personId, user) {
        return this.socialsService.findByPerson(personId, user);
    }
    findOne(id, user) {
        return this.socialsService.findOne(id, user);
    }
    update(id, dto, user) {
        return this.socialsService.update(id, dto, user);
    }
    remove(id, user) {
        return this.socialsService.remove(id, user);
    }
};
exports.PersonSocialsController = PersonSocialsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, person_social_dto_1.CreatePersonSocialDto, Object]),
    __metadata("design:returntype", void 0)
], PersonSocialsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('person:view'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonSocialsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('person:view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonSocialsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, person_social_dto_1.UpdatePersonSocialDto, Object]),
    __metadata("design:returntype", void 0)
], PersonSocialsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('person:delete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonSocialsController.prototype, "remove", null);
exports.PersonSocialsController = PersonSocialsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('people/:personId/socials'),
    __metadata("design:paramtypes", [person_socials_service_1.PersonSocialsService])
], PersonSocialsController);
//# sourceMappingURL=person-socials.controller.js.map