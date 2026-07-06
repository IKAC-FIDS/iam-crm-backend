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
exports.PersonContactsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const person_contacts_service_1 = require("./person-contacts.service");
const person_contact_dto_1 = require("../people/dto/person-contact.dto");
let PersonContactsController = class PersonContactsController {
    constructor(contactsService) {
        this.contactsService = contactsService;
    }
    create(personId, dto, user) {
        return this.contactsService.create(personId, dto, user);
    }
    findAll(personId, user) {
        return this.contactsService.findByPerson(personId, user);
    }
    findOne(id, user) {
        return this.contactsService.findOne(id, user);
    }
    update(id, dto, user) {
        return this.contactsService.update(id, dto, user);
    }
    remove(id, user) {
        return this.contactsService.remove(id, user);
    }
};
exports.PersonContactsController = PersonContactsController;
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, person_contact_dto_1.CreatePersonContactDto, Object]),
    __metadata("design:returntype", void 0)
], PersonContactsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('person:view'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonContactsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('person:view'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonContactsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, person_contact_dto_1.UpdatePersonContactDto, Object]),
    __metadata("design:returntype", void 0)
], PersonContactsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('person:delete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonContactsController.prototype, "remove", null);
exports.PersonContactsController = PersonContactsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('people/:personId/contacts'),
    __metadata("design:paramtypes", [person_contacts_service_1.PersonContactsService])
], PersonContactsController);
//# sourceMappingURL=person-contacts.controller.js.map