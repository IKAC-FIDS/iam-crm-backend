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
exports.RejectDecisionDto = exports.FindAdminLeaveRequestsDto = exports.FindMyLeaveRequestsDto = exports.UpdateLeaveRequestDto = exports.CreateLeaveRequestDto = exports.FindAdminTimesheetsDto = exports.FindMyTimesheetsDto = exports.UpdateTimesheetDto = exports.CreateTimesheetDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const api_date_string_validator_1 = require("../../common/validators/api-date-string.validator");
class CreateTimesheetDto {
    constructor() {
        this.breakMinutes = 0;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { workDate: { required: true, type: () => String }, type: { required: true, type: () => Object }, startMinute: { required: false, type: () => Number, minimum: 0, maximum: 1439 }, endMinute: { required: false, type: () => Number, minimum: 0, maximum: 1439 }, spansMidnight: { required: false, type: () => Boolean }, durationMinutes: { required: false, type: () => Number, minimum: 1, maximum: 2880 }, breakMinutes: { required: true, type: () => Object, default: 0, minimum: 0, maximum: 1440 }, description: { required: false, type: () => String, maxLength: 4000 }, taskId: { required: false, type: () => String }, companyId: { required: false, type: () => String } };
    }
}
exports.CreateTimesheetDto = CreateTimesheetDto;
__decorate([
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateTimesheetDto.prototype, "workDate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TimeEntryType),
    __metadata("design:type", String)
], CreateTimesheetDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1439),
    __metadata("design:type", Number)
], CreateTimesheetDto.prototype, "startMinute", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1439),
    __metadata("design:type", Number)
], CreateTimesheetDto.prototype, "endMinute", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTimesheetDto.prototype, "spansMidnight", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.startMinute == null && o.endMinute == null),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(2880),
    __metadata("design:type", Number)
], CreateTimesheetDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1440),
    __metadata("design:type", Object)
], CreateTimesheetDto.prototype, "breakMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], CreateTimesheetDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTimesheetDto.prototype, "taskId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTimesheetDto.prototype, "companyId", void 0);
class UpdateTimesheetDto extends CreateTimesheetDto {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateTimesheetDto = UpdateTimesheetDto;
class FindMyTimesheetsDto extends pagination_dto_1.PaginationDto {
    constructor() {
        super(...arguments);
        this.sort = "desc";
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { startDate: { required: false, type: () => String }, endDate: { required: false, type: () => String }, type: { required: false, type: () => Object }, status: { required: false, type: () => Object }, sort: { required: false, type: () => Object, default: "desc", enum: ['asc', 'desc'] } };
    }
}
exports.FindMyTimesheetsDto = FindMyTimesheetsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], FindMyTimesheetsDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], FindMyTimesheetsDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TimeEntryType),
    __metadata("design:type", String)
], FindMyTimesheetsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.TimeEntryStatus),
    __metadata("design:type", String)
], FindMyTimesheetsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], FindMyTimesheetsDto.prototype, "sort", void 0);
class FindAdminTimesheetsDto extends FindMyTimesheetsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { employeeId: { required: false, type: () => String }, teamId: { required: false, type: () => String } };
    }
}
exports.FindAdminTimesheetsDto = FindAdminTimesheetsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindAdminTimesheetsDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindAdminTimesheetsDto.prototype, "teamId", void 0);
class CreateLeaveRequestDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => Object }, unit: { required: true, type: () => Object }, startDate: { required: true, type: () => String }, endDate: { required: true, type: () => String }, startMinute: { required: false, type: () => Number, minimum: 0, maximum: 1439 }, endMinute: { required: false, type: () => Number, minimum: 1, maximum: 1440 }, reason: { required: false, type: () => String, maxLength: 4000 } };
    }
}
exports.CreateLeaveRequestDto = CreateLeaveRequestDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.LeaveType),
    __metadata("design:type", String)
], CreateLeaveRequestDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.LeaveUnit),
    __metadata("design:type", String)
], CreateLeaveRequestDto.prototype, "unit", void 0);
__decorate([
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateLeaveRequestDto.prototype, "startDate", void 0);
__decorate([
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], CreateLeaveRequestDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1439),
    __metadata("design:type", Number)
], CreateLeaveRequestDto.prototype, "startMinute", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1440),
    __metadata("design:type", Number)
], CreateLeaveRequestDto.prototype, "endMinute", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], CreateLeaveRequestDto.prototype, "reason", void 0);
class UpdateLeaveRequestDto extends CreateLeaveRequestDto {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateLeaveRequestDto = UpdateLeaveRequestDto;
class FindMyLeaveRequestsDto extends pagination_dto_1.PaginationDto {
    constructor() {
        super(...arguments);
        this.sort = "desc";
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { startDate: { required: false, type: () => String }, endDate: { required: false, type: () => String }, type: { required: false, type: () => Object }, status: { required: false, type: () => Object }, sort: { required: false, type: () => Object, default: "desc", enum: ['asc', 'desc'] } };
    }
}
exports.FindMyLeaveRequestsDto = FindMyLeaveRequestsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], FindMyLeaveRequestsDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, api_date_string_validator_1.IsApiDateString)(),
    __metadata("design:type", String)
], FindMyLeaveRequestsDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.LeaveType),
    __metadata("design:type", String)
], FindMyLeaveRequestsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.LeaveStatus),
    __metadata("design:type", String)
], FindMyLeaveRequestsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], FindMyLeaveRequestsDto.prototype, "sort", void 0);
class FindAdminLeaveRequestsDto extends FindMyLeaveRequestsDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { employeeId: { required: false, type: () => String }, teamId: { required: false, type: () => String } };
    }
}
exports.FindAdminLeaveRequestsDto = FindAdminLeaveRequestsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindAdminLeaveRequestsDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindAdminLeaveRequestsDto.prototype, "teamId", void 0);
class RejectDecisionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, maxLength: 2000, pattern: "/\\S/" } };
    }
}
exports.RejectDecisionDto = RejectDecisionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/\S/),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], RejectDecisionDto.prototype, "reason", void 0);
//# sourceMappingURL=timesheet.dto.js.map