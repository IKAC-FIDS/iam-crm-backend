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
exports.FindNotificationsDto = exports.NotificationSortOrder = exports.NotificationSortBy = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
var NotificationSortBy;
(function (NotificationSortBy) {
    NotificationSortBy["CREATED_AT"] = "createdAt";
    NotificationSortBy["PRIORITY"] = "priority";
})(NotificationSortBy || (exports.NotificationSortBy = NotificationSortBy = {}));
var NotificationSortOrder;
(function (NotificationSortOrder) {
    NotificationSortOrder["ASC"] = "asc";
    NotificationSortOrder["DESC"] = "desc";
})(NotificationSortOrder || (exports.NotificationSortOrder = NotificationSortOrder = {}));
class FindNotificationsDto extends pagination_dto_1.PaginationDto {
    constructor() {
        super(...arguments);
        this.sortBy = NotificationSortBy.CREATED_AT;
        this.sortOrder = NotificationSortOrder.DESC;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: false, type: () => Object }, types: { required: false, type: () => [Object] }, priority: { required: false, type: () => Object }, priorities: { required: false, type: () => [Object] }, entityType: { required: false, type: () => Object }, entityId: { required: false, type: () => String }, status: { required: false, type: () => Object, enum: ['unread', 'read', 'all'] }, includeArchived: { required: false, type: () => Object }, archivedOnly: { required: false, type: () => Object }, search: { required: false, type: () => String }, dateFrom: { required: false, type: () => String }, dateTo: { required: false, type: () => String }, sortBy: { required: false, default: NotificationSortBy.CREATED_AT, enum: require("./find-notifications.dto").NotificationSortBy }, sortOrder: { required: false, default: NotificationSortOrder.DESC, enum: require("./find-notifications.dto").NotificationSortOrder } };
    }
}
exports.FindNotificationsDto = FindNotificationsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationType),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (Array.isArray(value) ? value : String(value).split(','))
        .map((item) => String(item).trim())
        .filter(Boolean)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationType, { each: true }),
    __metadata("design:type", Array)
], FindNotificationsDto.prototype, "types", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationPriority),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (Array.isArray(value) ? value : String(value).split(','))
        .map((item) => String(item).trim())
        .filter(Boolean)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationPriority, { each: true }),
    __metadata("design:type", Array)
], FindNotificationsDto.prototype, "priorities", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.NotificationEntityType),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "entityType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "entityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['unread', 'read', 'all']),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "includeArchived", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "archivedOnly", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "dateFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "dateTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NotificationSortBy),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NotificationSortOrder),
    __metadata("design:type", String)
], FindNotificationsDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=find-notifications.dto.js.map