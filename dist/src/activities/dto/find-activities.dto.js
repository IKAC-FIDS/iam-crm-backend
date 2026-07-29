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
exports.FindActivitiesDto = exports.ActivityListStatus = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const ownership_scope_dto_1 = require("../../common/dto/ownership-scope.dto");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
const booleanValue = ({ value }) => value === true || value === 'true'
    ? true
    : value === false || value === 'false'
        ? false
        : value;
const emptyToUndefined = ({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value;
var ActivityListStatus;
(function (ActivityListStatus) {
    ActivityListStatus["RECORDED"] = "RECORDED";
    ActivityListStatus["COMPLETED"] = "COMPLETED";
})(ActivityListStatus || (exports.ActivityListStatus = ActivityListStatus = {}));
class FindActivitiesDto extends pagination_dto_1.PaginationDto {
    constructor() {
        super(...arguments);
        this.sortBy = 'activityDate';
        this.sortOrder = 'desc';
    }
}
exports.FindActivitiesDto = FindActivitiesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ActivityType),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "activityType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ActivityListStatus),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "createdById", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "personId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(emptyToUndefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "dateFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "dateTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ownership_scope_dto_1.OwnershipScope),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "ownershipScope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "team", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(booleanValue),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FindActivitiesDto.prototype, "mine", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(booleanValue),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FindActivitiesDto.prototype, "unassigned", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['activityDate', 'createdAt']),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], FindActivitiesDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=find-activities.dto.js.map