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
exports.FindPersonalTodosDto = exports.PersonalTodoDateState = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
var PersonalTodoDateState;
(function (PersonalTodoDateState) {
    PersonalTodoDateState["TODAY"] = "today";
    PersonalTodoDateState["UPCOMING"] = "upcoming";
    PersonalTodoDateState["OVERDUE"] = "overdue";
    PersonalTodoDateState["COMPLETED"] = "completed";
})(PersonalTodoDateState || (exports.PersonalTodoDateState = PersonalTodoDateState = {}));
class FindPersonalTodosDto extends pagination_dto_1.PaginationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, type: () => Object }, dateState: { required: false, enum: require("./find-personal-todos.dto").PersonalTodoDateState }, companyId: { required: false, type: () => String }, opportunityId: { required: false, type: () => String } };
    }
}
exports.FindPersonalTodosDto = FindPersonalTodosDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PersonalTodoStatus),
    __metadata("design:type", String)
], FindPersonalTodosDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PersonalTodoDateState),
    __metadata("design:type", String)
], FindPersonalTodosDto.prototype, "dateState", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindPersonalTodosDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindPersonalTodosDto.prototype, "opportunityId", void 0);
//# sourceMappingURL=find-personal-todos.dto.js.map