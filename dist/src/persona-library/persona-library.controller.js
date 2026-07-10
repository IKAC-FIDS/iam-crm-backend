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
exports.PersonaLibraryController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const persona_library_service_1 = require("./persona-library.service");
const upsert_persona_dto_1 = require("./dto/upsert-persona.dto");
let PersonaLibraryController = class PersonaLibraryController {
    constructor(personaLibraryService) {
        this.personaLibraryService = personaLibraryService;
    }
    findAll() {
        return this.personaLibraryService.findAll();
    }
    create(dto) {
        return this.personaLibraryService.create(dto);
    }
    update(id, dto) {
        return this.personaLibraryService.update(id, dto);
    }
    remove(id) {
        return this.personaLibraryService.remove(id);
    }
};
exports.PersonaLibraryController = PersonaLibraryController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('library:persona:view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PersonaLibraryController.prototype, "findAll", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('library:persona:manage'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_persona_dto_1.UpsertPersonaDto]),
    __metadata("design:returntype", void 0)
], PersonaLibraryController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('library:persona:manage'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_persona_dto_1.UpsertPersonaDto]),
    __metadata("design:returntype", void 0)
], PersonaLibraryController.prototype, "update", null);
__decorate([
    (0, permissions_decorator_1.Permissions)('library:persona:manage'),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PersonaLibraryController.prototype, "remove", null);
exports.PersonaLibraryController = PersonaLibraryController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('persona-library'),
    __metadata("design:paramtypes", [persona_library_service_1.PersonaLibraryService])
], PersonaLibraryController);
//# sourceMappingURL=persona-library.controller.js.map