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
exports.FindTasksDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
class FindTasksDto extends pagination_dto_1.PaginationDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, type: () => Object }, priority: { required: false, type: () => Object }, assignedToId: { required: false, type: () => String }, createdById: { required: false, type: () => String }, companyId: { required: false, type: () => String }, personId: { required: false, type: () => String }, opportunityId: { required: false, type: () => String }, commercialDocumentId: { required: false, type: () => String }, paymentId: { required: false, type: () => String }, dueFrom: { required: false, type: () => String }, dueTo: { required: false, type: () => String }, search: { required: false, type: () => String }, overdueOnly: { required: false, type: () => String }, assignmentScope: { required: false, type: () => Object }, teamId: { required: false, type: () => String }, parentTaskId: { required: false, type: () => String }, meetingId: { required: false, type: () => String }, activityId: { required: false, type: () => String }, productId: { required: false, type: () => String }, view: { required: false, type: () => Object, enum: ['all', 'mine', 'team', 'organization', 'created'] }, dueState: { required: false, type: () => Object, enum: ['none', 'upcoming', 'today', 'overdue', 'completed'] }, linkedEntityType: { required: false, type: () => Object, enum: ['COMPANY', 'OPPORTUNITY', 'PERSON', 'MEETING', 'ACTIVITY', 'PRODUCT'] }, reviewStatus: { required: false, type: () => Object }, reviewerId: { required: false, type: () => String }, awaitingMyReview: { required: false, type: () => String } };
    }
}
exports.FindTasksDto = FindTasksDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TaskStatus),
    __metadata("design:type", String)
], FindTasksDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Priority),
    __metadata("design:type", String)
], FindTasksDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "assignedToId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "createdById", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "personId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "opportunityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "commercialDocumentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "paymentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "dueFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "dueTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "overdueOnly", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TaskAssignmentScope),
    __metadata("design:type", String)
], FindTasksDto.prototype, "assignmentScope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "teamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "parentTaskId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "meetingId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "activityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['all', 'mine', 'team', 'organization', 'created']),
    __metadata("design:type", String)
], FindTasksDto.prototype, "view", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['none', 'upcoming', 'today', 'overdue', 'completed']),
    __metadata("design:type", String)
], FindTasksDto.prototype, "dueState", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['COMPANY', 'OPPORTUNITY', 'PERSON', 'MEETING', 'ACTIVITY', 'PRODUCT']),
    __metadata("design:type", String)
], FindTasksDto.prototype, "linkedEntityType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TaskReviewStatus),
    __metadata("design:type", String)
], FindTasksDto.prototype, "reviewStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "reviewerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], FindTasksDto.prototype, "awaitingMyReview", void 0);
//# sourceMappingURL=find-tasks.dto.js.map