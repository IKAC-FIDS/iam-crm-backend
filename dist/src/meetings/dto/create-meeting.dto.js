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
exports.CreateMeetingDto = void 0;
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
const trim = ({ value }) => typeof value === 'string' ? value.trim() : value;
class CreateMeetingDto {
}
exports.CreateMeetingDto = CreateMeetingDto;
__decorate([
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "opportunityId", void 0);
__decorate([
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "agenda", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.MeetingMode),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "mode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsUrl)({ require_protocol: true }),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "meetingUrl", void 0);
__decorate([
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "startAt", void 0);
__decorate([
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "endAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateMeetingDto.prototype, "reminderAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateMeetingDto.prototype, "assigneeUserIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateMeetingDto.prototype, "attendeePersonIds", void 0);
//# sourceMappingURL=create-meeting.dto.js.map