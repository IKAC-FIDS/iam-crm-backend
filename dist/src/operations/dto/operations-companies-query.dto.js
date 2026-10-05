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
exports.OperationsCompaniesQueryDto = exports.OperationsAttentionState = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const ownership_scope_dto_1 = require("../../common/dto/ownership-scope.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
var OperationsAttentionState;
(function (OperationsAttentionState) {
    OperationsAttentionState["OVERDUE"] = "OVERDUE";
    OperationsAttentionState["TODAY"] = "TODAY";
    OperationsAttentionState["UPCOMING"] = "UPCOMING";
    OperationsAttentionState["NO_NEXT_ACTION"] = "NO_NEXT_ACTION";
    OperationsAttentionState["NORMAL"] = "NORMAL";
})(OperationsAttentionState || (exports.OperationsAttentionState = OperationsAttentionState = {}));
class OperationsCompaniesQueryDto extends pagination_dto_1.PaginationDto {
    constructor() {
        super(...arguments);
        this.ownershipScope = ownership_scope_dto_1.OwnershipScope.MINE;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { userId: { required: false, type: () => String }, search: { required: false, type: () => String }, priority: { required: false, type: () => Object }, engagementStatus: { required: false, type: () => Object }, pinnedOnly: { required: false, type: () => String }, includeInactivePortfolio: { required: false, type: () => String }, attentionState: { required: false, enum: require("./operations-companies-query.dto").OperationsAttentionState }, hasUnreadMessages: { required: false, type: () => String }, hasActiveOpportunity: { required: false, type: () => String }, hasNoNextAction: { required: false, type: () => String }, ownershipScope: { required: false, default: ownership_scope_dto_1.OwnershipScope.MINE, enum: require("../../common/dto/ownership-scope.dto").OwnershipScope } };
    }
}
exports.OperationsCompaniesQueryDto = OperationsCompaniesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Admin-only target user" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Priority),
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.Priority }),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CompanyEngagementStatus),
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.CompanyEngagementStatus }),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "engagementStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "pinnedOnly", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "includeInactivePortfolio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(OperationsAttentionState),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "attentionState", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "hasUnreadMessages", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "hasActiveOpportunity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "hasNoNextAction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ownership_scope_dto_1.OwnershipScope),
    (0, swagger_1.ApiPropertyOptional)({ enum: ownership_scope_dto_1.OwnershipScope, default: ownership_scope_dto_1.OwnershipScope.MINE }),
    __metadata("design:type", String)
], OperationsCompaniesQueryDto.prototype, "ownershipScope", void 0);
//# sourceMappingURL=operations-companies-query.dto.js.map