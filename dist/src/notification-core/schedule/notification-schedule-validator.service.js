"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationScheduleValidator = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const notification_schedule_catalog_1 = require("./notification-schedule.catalog");
let NotificationScheduleValidator = class NotificationScheduleValidator {
    validate(eventName, input) {
        const definition = (0, notification_schedule_catalog_1.scheduleDefinition)(eventName);
        if (!input) {
            if (definition)
                throw new common_1.BadRequestException(`Schedule is required for ${eventName}`);
            return null;
        }
        if (!definition)
            throw new common_1.BadRequestException(`Event does not support scheduling: ${eventName}`);
        if (input.type !== definition.scheduleType)
            throw new common_1.BadRequestException("Invalid schedule type");
        if (input.sourceField !== definition.sourceField)
            throw new common_1.BadRequestException("Invalid schedule source field");
        if (!definition.triggerModes.includes(input.triggerMode))
            throw new common_1.BadRequestException("Invalid schedule trigger mode");
        if (!Number.isInteger(input.offsetMinutes) || Math.abs(input.offsetMinutes) > 525600)
            throw new common_1.BadRequestException("Invalid schedule offset");
        if (input.triggerMode === client_1.NotificationScheduleTriggerMode.BEFORE && input.offsetMinutes >= 0)
            throw new common_1.BadRequestException("BEFORE schedule requires a negative offset");
        if (input.triggerMode === client_1.NotificationScheduleTriggerMode.AT_OR_AFTER && input.offsetMinutes !== 0)
            throw new common_1.BadRequestException("AT_OR_AFTER schedule requires zero offset");
        const grace = input.gracePeriodMinutes ?? definition.defaultGracePeriodMinutes;
        if (!Number.isInteger(grace) || grace < 1 || grace > 525600)
            throw new common_1.BadRequestException("Invalid schedule grace period");
        return { enabled: input.enabled ?? true, scheduleType: input.type, sourceField: input.sourceField, triggerMode: input.triggerMode, offsetMinutes: input.offsetMinutes, gracePeriodMinutes: grace };
    }
};
exports.NotificationScheduleValidator = NotificationScheduleValidator;
exports.NotificationScheduleValidator = NotificationScheduleValidator = __decorate([
    (0, common_1.Injectable)()
], NotificationScheduleValidator);
//# sourceMappingURL=notification-schedule-validator.service.js.map