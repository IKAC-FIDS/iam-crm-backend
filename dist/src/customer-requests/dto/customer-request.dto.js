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
exports.CreateLinkedTechnicalDocumentDto = exports.CreateLinkedOpportunityDto = exports.CreateLinkedTaskDto = exports.UnlinkCustomerRequestRecordDto = exports.LinkCustomerRequestRecordDto = exports.UpdateRequestTriageDto = exports.ShareRequestDto = exports.UpdateRequestStatusDto = exports.PortalRequestListDto = exports.RequestListDto = exports.UpdateDraftDto = exports.CreatePortalRequestDto = exports.FormSchemaDto = exports.ConfigureAvailabilityDto = exports.UpdateRequestTypeDto = exports.CreateRequestTypeDto = exports.RequestTypeListDto = void 0;
const openapi = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class RequestTypeListDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { includeRetired: { required: false, type: () => Boolean } };
    }
}
exports.RequestTypeListDto = RequestTypeListDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true'),
    __metadata("design:type", Boolean)
], RequestTypeListDto.prototype, "includeRetired", void 0);
class CreateRequestTypeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: true, type: () => String, minLength: 2, maxLength: 64 }, displayName: { required: true, type: () => String, minLength: 1, maxLength: 160 }, description: { required: false, type: () => String, minLength: 0, maxLength: 2000 }, presentation: { required: false, type: () => Object }, displayOrder: { required: false, type: () => Number, minimum: 0, maximum: 100000 }, availabilityPolicy: { required: false, type: () => Object }, defaultRoutingDestination: { required: false, type: () => Object } };
    }
}
exports.CreateRequestTypeDto = CreateRequestTypeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 64),
    __metadata("design:type", String)
], CreateRequestTypeDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 160),
    __metadata("design:type", String)
], CreateRequestTypeDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], CreateRequestTypeDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateRequestTypeDto.prototype, "presentation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100000),
    __metadata("design:type", Number)
], CreateRequestTypeDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestAvailabilityPolicy),
    __metadata("design:type", String)
], CreateRequestTypeDto.prototype, "availabilityPolicy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestRoutingDestination),
    __metadata("design:type", String)
], CreateRequestTypeDto.prototype, "defaultRoutingDestination", void 0);
class UpdateRequestTypeDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { displayName: { required: false, type: () => String, minLength: 1, maxLength: 160 }, description: { required: false, type: () => String, minLength: 0, maxLength: 2000 }, presentation: { required: false, type: () => Object }, displayOrder: { required: false, type: () => Number, minimum: 0, maximum: 100000 }, isEnabled: { required: false, type: () => Boolean }, retired: { required: false, type: () => Boolean }, availabilityPolicy: { required: false, type: () => Object }, defaultRoutingDestination: { required: false, type: () => Object } };
    }
}
exports.UpdateRequestTypeDto = UpdateRequestTypeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 160),
    __metadata("design:type", String)
], UpdateRequestTypeDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], UpdateRequestTypeDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateRequestTypeDto.prototype, "presentation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100000),
    __metadata("design:type", Number)
], UpdateRequestTypeDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateRequestTypeDto.prototype, "isEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateRequestTypeDto.prototype, "retired", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestAvailabilityPolicy),
    __metadata("design:type", String)
], UpdateRequestTypeDto.prototype, "availabilityPolicy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestRoutingDestination),
    __metadata("design:type", String)
], UpdateRequestTypeDto.prototype, "defaultRoutingDestination", void 0);
class ConfigureAvailabilityDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { companyIds: { required: true, type: () => [String] } };
    }
}
exports.ConfigureAvailabilityDto = ConfigureAvailabilityDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], ConfigureAvailabilityDto.prototype, "companyIds", void 0);
class FormSchemaDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { schema: { required: true, type: () => Object } };
    }
}
exports.FormSchemaDto = FormSchemaDto;
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], FormSchemaDto.prototype, "schema", void 0);
class CreatePortalRequestDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { requestTypeId: { required: true, type: () => String }, title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, answers: { required: false, type: () => Object } };
    }
}
exports.CreatePortalRequestDto = CreatePortalRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePortalRequestDto.prototype, "requestTypeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreatePortalRequestDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePortalRequestDto.prototype, "answers", void 0);
class UpdateDraftDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: false, type: () => String, minLength: 1, maxLength: 200 }, answers: { required: true, type: () => Object } };
    }
}
exports.UpdateDraftDto = UpdateDraftDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], UpdateDraftDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateDraftDto.prototype, "answers", void 0);
class RequestListDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number, minimum: 1 }, limit: { required: false, type: () => Number, minimum: 1, maximum: 100 }, status: { required: false, type: () => Object }, requestTypeId: { required: false, type: () => String }, companyId: { required: false, type: () => String }, search: { required: false, type: () => String, minLength: 1, maxLength: 120 }, submittedFrom: { required: false, type: () => String }, submittedTo: { required: false, type: () => String }, priority: { required: false, type: () => Object }, triageStatus: { required: false, type: () => Object }, assignedToId: { required: false, type: () => String }, responsibleTeamId: { required: false, type: () => String }, routingDestination: { required: false, type: () => Object }, sortBy: { required: false, type: () => Object, enum: ['submittedAt', 'updatedAt'] }, sortOrder: { required: false, type: () => Object, enum: ['asc', 'desc'] } };
    }
}
exports.RequestListDto = RequestListDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RequestListDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], RequestListDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestStatus),
    __metadata("design:type", String)
], RequestListDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestListDto.prototype, "requestTypeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestListDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    __metadata("design:type", String)
], RequestListDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestListDto.prototype, "submittedFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestListDto.prototype, "submittedTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestPriority),
    __metadata("design:type", String)
], RequestListDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestTriageStatus),
    __metadata("design:type", String)
], RequestListDto.prototype, "triageStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestListDto.prototype, "assignedToId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestListDto.prototype, "responsibleTeamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestRoutingDestination),
    __metadata("design:type", String)
], RequestListDto.prototype, "routingDestination", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['submittedAt', 'updatedAt']),
    __metadata("design:type", String)
], RequestListDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], RequestListDto.prototype, "sortOrder", void 0);
class PortalRequestListDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: false, type: () => Number, minimum: 1 }, limit: { required: false, type: () => Number, minimum: 1, maximum: 100 }, status: { required: false, type: () => Object }, requestTypeId: { required: false, type: () => String }, companyId: { required: false, type: () => String }, search: { required: false, type: () => String, minLength: 1, maxLength: 120 }, submittedFrom: { required: false, type: () => String }, submittedTo: { required: false, type: () => String } };
    }
}
exports.PortalRequestListDto = PortalRequestListDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PortalRequestListDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PortalRequestListDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestStatus),
    __metadata("design:type", String)
], PortalRequestListDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PortalRequestListDto.prototype, "requestTypeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PortalRequestListDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    __metadata("design:type", String)
], PortalRequestListDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PortalRequestListDto.prototype, "submittedFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PortalRequestListDto.prototype, "submittedTo", void 0);
class UpdateRequestStatusDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, type: () => Object }, customerVisibleExplanation: { required: false, type: () => String, minLength: 0, maxLength: 2000 }, internalReason: { required: false, type: () => String, minLength: 0, maxLength: 2000 } };
    }
}
exports.UpdateRequestStatusDto = UpdateRequestStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestStatus),
    __metadata("design:type", String)
], UpdateRequestStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], UpdateRequestStatusDto.prototype, "customerVisibleExplanation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], UpdateRequestStatusDto.prototype, "internalReason", void 0);
class ShareRequestDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { membershipId: { required: true, type: () => String } };
    }
}
exports.ShareRequestDto = ShareRequestDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareRequestDto.prototype, "membershipId", void 0);
class UpdateRequestTriageDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { expectedRevision: { required: true, type: () => Number, minimum: 1 }, priority: { required: false, type: () => Object }, assignedToId: { required: false, type: () => String, nullable: true }, responsibleTeamId: { required: false, type: () => String, nullable: true }, routingDestination: { required: false, type: () => Object }, internalReason: { required: false, type: () => String, minLength: 0, maxLength: 2000 }, completeTriage: { required: false, type: () => Boolean } };
    }
}
exports.UpdateRequestTriageDto = UpdateRequestTriageDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateRequestTriageDto.prototype, "expectedRevision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestPriority),
    __metadata("design:type", String)
], UpdateRequestTriageDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdateRequestTriageDto.prototype, "assignedToId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdateRequestTriageDto.prototype, "responsibleTeamId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestRoutingDestination),
    __metadata("design:type", String)
], UpdateRequestTriageDto.prototype, "routingDestination", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], UpdateRequestTriageDto.prototype, "internalReason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateRequestTriageDto.prototype, "completeTriage", void 0);
class LinkCustomerRequestRecordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { targetType: { required: true, type: () => Object }, targetId: { required: true, type: () => String }, purpose: { required: false, type: () => String, minLength: 0, maxLength: 500 } };
    }
}
exports.LinkCustomerRequestRecordDto = LinkCustomerRequestRecordDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CustomerRequestCrmTargetType),
    __metadata("design:type", String)
], LinkCustomerRequestRecordDto.prototype, "targetType", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LinkCustomerRequestRecordDto.prototype, "targetId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 500),
    __metadata("design:type", String)
], LinkCustomerRequestRecordDto.prototype, "purpose", void 0);
class UnlinkCustomerRequestRecordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, minLength: 2, maxLength: 1000 } };
    }
}
exports.UnlinkCustomerRequestRecordDto = UnlinkCustomerRequestRecordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 1000),
    __metadata("design:type", String)
], UnlinkCustomerRequestRecordDto.prototype, "reason", void 0);
class CreateLinkedTaskDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, description: { required: false, type: () => String }, priority: { required: false, type: () => Object }, dueAt: { required: false, type: () => String }, assignedToId: { required: false, type: () => String }, purpose: { required: false, type: () => String }, idempotencyKey: { required: true, type: () => String, minLength: 8, maxLength: 120 } };
    }
}
exports.CreateLinkedTaskDto = CreateLinkedTaskDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreateLinkedTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLinkedTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Priority),
    __metadata("design:type", String)
], CreateLinkedTaskDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLinkedTaskDto.prototype, "dueAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateLinkedTaskDto.prototype, "assignedToId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLinkedTaskDto.prototype, "purpose", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 120),
    __metadata("design:type", String)
], CreateLinkedTaskDto.prototype, "idempotencyKey", void 0);
class CreateLinkedOpportunityDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, description: { required: false, type: () => String }, ownerId: { required: false, type: () => String }, stageId: { required: false, type: () => String }, priority: { required: false, type: () => Object }, expectedCloseDate: { required: false, type: () => String }, purpose: { required: false, type: () => String }, idempotencyKey: { required: true, type: () => String, minLength: 8, maxLength: 120 } };
    }
}
exports.CreateLinkedOpportunityDto = CreateLinkedOpportunityDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreateLinkedOpportunityDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLinkedOpportunityDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateLinkedOpportunityDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateLinkedOpportunityDto.prototype, "stageId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.Priority),
    __metadata("design:type", String)
], CreateLinkedOpportunityDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLinkedOpportunityDto.prototype, "expectedCloseDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLinkedOpportunityDto.prototype, "purpose", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 120),
    __metadata("design:type", String)
], CreateLinkedOpportunityDto.prototype, "idempotencyKey", void 0);
class CreateLinkedTechnicalDocumentDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 200 }, documentType: { required: true, type: () => String, minLength: 1, maxLength: 100 }, ownerId: { required: true, type: () => String }, description: { required: false, type: () => String }, confidentiality: { required: false, type: () => Object }, purpose: { required: false, type: () => String }, idempotencyKey: { required: true, type: () => String, minLength: 8, maxLength: 120 } };
    }
}
exports.CreateLinkedTechnicalDocumentDto = CreateLinkedTechnicalDocumentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 200),
    __metadata("design:type", String)
], CreateLinkedTechnicalDocumentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 100),
    __metadata("design:type", String)
], CreateLinkedTechnicalDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateLinkedTechnicalDocumentDto.prototype, "ownerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLinkedTechnicalDocumentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TechnicalConfidentiality),
    __metadata("design:type", String)
], CreateLinkedTechnicalDocumentDto.prototype, "confidentiality", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLinkedTechnicalDocumentDto.prototype, "purpose", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(8, 120),
    __metadata("design:type", String)
], CreateLinkedTechnicalDocumentDto.prototype, "idempotencyKey", void 0);
//# sourceMappingURL=customer-request.dto.js.map