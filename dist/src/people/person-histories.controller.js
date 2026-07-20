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
exports.PersonHistoriesController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const person_history_dto_1 = require("./dto/person-history.dto");
const person_histories_service_1 = require("./person-histories.service");
let PersonHistoriesController = class PersonHistoriesController {
    constructor(service) {
        this.service = service;
    }
    employment(p, u) { return this.service.findEmployment(p, u); }
    createEmployment(p, d, u) { return this.service.createEmployment(p, d, u); }
    updateEmployment(p, e, d, u) { return this.service.updateEmployment(p, e, d, u); }
    removeEmployment(p, e, u) { return this.service.removeEmployment(p, e, u); }
    createPosition(p, e, d, u) { return this.service.createPosition(p, e, d, u); }
    updatePosition(p, e, i, d, u) { return this.service.updatePosition(p, e, i, d, u); }
    removePosition(p, e, i, u) { return this.service.removePosition(p, e, i, u); }
    education(p, u) { return this.service.findEducation(p, u); }
    createEducation(p, d, u) { return this.service.createEducation(p, d, u); }
    updateEducation(p, e, d, u) { return this.service.updateEducation(p, e, d, u); }
    removeEducation(p, e, u) { return this.service.removeEducation(p, e, u); }
};
exports.PersonHistoriesController = PersonHistoriesController;
__decorate([
    (0, common_1.Get)('employment-history'),
    (0, permissions_decorator_1.Permissions)('person:view'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "employment", null);
__decorate([
    (0, common_1.Post)('employment-history'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, person_history_dto_1.CreatePersonEmploymentHistoryDto, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "createEmployment", null);
__decorate([
    (0, common_1.Patch)('employment-history/:employmentId'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Param)('employmentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, person_history_dto_1.UpdatePersonEmploymentHistoryDto, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "updateEmployment", null);
__decorate([
    (0, common_1.Delete)('employment-history/:employmentId'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Param)('employmentId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "removeEmployment", null);
__decorate([
    (0, common_1.Post)('employment-history/:employmentId/positions'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Param)('employmentId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, person_history_dto_1.CreatePersonEmploymentPositionDto, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "createPosition", null);
__decorate([
    (0, common_1.Patch)('employment-history/:employmentId/positions/:positionId'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Param)('employmentId')),
    __param(2, (0, common_1.Param)('positionId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, person_history_dto_1.UpdatePersonEmploymentPositionDto, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "updatePosition", null);
__decorate([
    (0, common_1.Delete)('employment-history/:employmentId/positions/:positionId'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Param)('employmentId')),
    __param(2, (0, common_1.Param)('positionId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "removePosition", null);
__decorate([
    (0, common_1.Get)('education-history'),
    (0, permissions_decorator_1.Permissions)('person:view'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "education", null);
__decorate([
    (0, common_1.Post)('education-history'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, person_history_dto_1.CreatePersonEducationHistoryDto, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "createEducation", null);
__decorate([
    (0, common_1.Patch)('education-history/:educationId'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Param)('educationId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, person_history_dto_1.UpdatePersonEducationHistoryDto, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "updateEducation", null);
__decorate([
    (0, common_1.Delete)('education-history/:educationId'),
    (0, permissions_decorator_1.Permissions)('person:update'),
    __param(0, (0, common_1.Param)('personId')),
    __param(1, (0, common_1.Param)('educationId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PersonHistoriesController.prototype, "removeEducation", null);
exports.PersonHistoriesController = PersonHistoriesController = __decorate([
    (0, common_1.Controller)('people/:personId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [person_histories_service_1.PersonHistoriesService])
], PersonHistoriesController);
//# sourceMappingURL=person-histories.controller.js.map