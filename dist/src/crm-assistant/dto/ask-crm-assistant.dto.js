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
exports.AskCrmAssistantDto = exports.CrmAssistantHistoryItemDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CrmAssistantHistoryItemDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { role: { required: true, type: () => Object, enum: ['user', 'assistant'] }, content: { required: true, type: () => String, maxLength: 4000 } };
    }
}
exports.CrmAssistantHistoryItemDto = CrmAssistantHistoryItemDto;
__decorate([
    (0, class_validator_1.IsIn)(['user', 'assistant']),
    __metadata("design:type", String)
], CrmAssistantHistoryItemDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], CrmAssistantHistoryItemDto.prototype, "content", void 0);
class AskCrmAssistantDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { message: { required: true, type: () => String, maxLength: 4000 }, history: { required: false, type: () => [require("./ask-crm-assistant.dto").CrmAssistantHistoryItemDto] } };
    }
}
exports.AskCrmAssistantDto = AskCrmAssistantDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], AskCrmAssistantDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(10),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CrmAssistantHistoryItemDto),
    __metadata("design:type", Array)
], AskCrmAssistantDto.prototype, "history", void 0);
//# sourceMappingURL=ask-crm-assistant.dto.js.map