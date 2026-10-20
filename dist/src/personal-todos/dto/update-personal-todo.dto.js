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
exports.UpdatePersonalTodoDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
class UpdatePersonalTodoDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: false, type: () => String, maxLength: 200 }, note: { required: false, type: () => String, nullable: true, maxLength: 4000 }, dueAt: { required: false, type: () => String, nullable: true }, reminderAt: { required: false, type: () => String, nullable: true }, recurrenceType: { required: false, type: () => Object }, recurrenceInterval: { required: false, type: () => Number, minimum: 1, maximum: 365 }, companyId: { required: false, type: () => String, nullable: true }, opportunityId: { required: false, type: () => String, nullable: true }, taskId: { required: false, type: () => String, nullable: true } };
    }
}
exports.UpdatePersonalTodoDto = UpdatePersonalTodoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdatePersonalTodoDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", Object)
], UpdatePersonalTodoDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", Object)
], UpdatePersonalTodoDto.prototype, "dueAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", Object)
], UpdatePersonalTodoDto.prototype, "reminderAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PersonalTodoRecurrenceType),
    __metadata("design:type", String)
], UpdatePersonalTodoDto.prototype, "recurrenceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(365),
    __metadata("design:type", Number)
], UpdatePersonalTodoDto.prototype, "recurrenceInterval", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdatePersonalTodoDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdatePersonalTodoDto.prototype, "opportunityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdatePersonalTodoDto.prototype, "taskId", void 0);
//# sourceMappingURL=update-personal-todo.dto.js.map