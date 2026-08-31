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
exports.TaskReviewDecisionDto = exports.SubmitTaskReviewDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SubmitTaskReviewDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reviewerId: { required: false, type: () => String }, note: { required: false, type: () => String, maxLength: 4000 }, artifactIds: { required: false, type: () => [String] } };
    }
}
exports.SubmitTaskReviewDto = SubmitTaskReviewDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitTaskReviewDto.prototype, "reviewerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], SubmitTaskReviewDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], SubmitTaskReviewDto.prototype, "artifactIds", void 0);
class TaskReviewDecisionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { comment: { required: false, type: () => String, maxLength: 4000 } };
    }
}
exports.TaskReviewDecisionDto = TaskReviewDecisionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], TaskReviewDecisionDto.prototype, "comment", void 0);
//# sourceMappingURL=task-review.dto.js.map