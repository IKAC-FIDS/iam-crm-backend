"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPolicyConditionValidator = void 0;
const common_1 = require("@nestjs/common");
const notification_condition_catalog_1 = require("./notification-condition.catalog");
const notification_policy_types_1 = require("./notification-policy.types");
const MAX_DEPTH = 5;
const MAX_CONDITIONS = 50;
const MAX_IN_VALUES = 100;
const MAX_STRING_LENGTH = 500;
let NotificationPolicyConditionValidator = class NotificationPolicyConditionValidator {
    validate(eventName, input) {
        if (input === null || input === undefined || (typeof input === "object" && !Array.isArray(input) && Object.keys(input).length === 0))
            return null;
        const definition = (0, notification_condition_catalog_1.conditionDefinition)(eventName);
        if (!definition)
            throw new common_1.BadRequestException(`Conditions are not supported for event: ${eventName}`);
        if (!input || typeof input !== "object" || Array.isArray(input))
            throw new common_1.BadRequestException("ساختار شرایط قانون معتبر نیست");
        const root = input;
        if (root.version !== 1 || (root.logic !== "AND" && root.logic !== "OR") || !Array.isArray(root.conditions))
            throw new common_1.BadRequestException("شرایط باید دارای version=1، logic و آرایه conditions باشد");
        if (!root.conditions.length)
            return null;
        const count = { value: 0 };
        this.validateNodes(root.conditions, definition.conditionFields, 1, count);
        return input;
    }
    validateNodes(nodes, fields, depth, count) {
        if (depth > MAX_DEPTH)
            throw new common_1.BadRequestException(`حداکثر عمق گروه‌های شرط ${MAX_DEPTH} است`);
        for (const raw of nodes) {
            if (!raw || typeof raw !== "object" || Array.isArray(raw))
                throw new common_1.BadRequestException("هر شرط باید یک شیء معتبر باشد");
            const node = raw;
            if ((0, notification_policy_types_1.isConditionGroup)(node)) {
                if ((node.logic !== "AND" && node.logic !== "OR") || !Array.isArray(node.conditions) || !node.conditions.length)
                    throw new common_1.BadRequestException("گروه شرط باید logic و conditions معتبر داشته باشد");
                this.validateNodes(node.conditions, fields, depth + 1, count);
                continue;
            }
            count.value += 1;
            if (count.value > MAX_CONDITIONS)
                throw new common_1.BadRequestException(`حداکثر ${MAX_CONDITIONS} شرط در هر قانون مجاز است`);
            if (typeof node.field !== "string" || node.field.length > 120 || ["__proto__", "prototype", "constructor"].some(value => node.field.split(".").includes(value)))
                throw new common_1.BadRequestException("مسیر فیلد شرط ناامن یا نامعتبر است");
            const field = fields.find(item => item.field === node.field);
            if (!field)
                throw new common_1.BadRequestException(`فیلد شرط برای این رویداد مجاز نیست: ${node.field}`);
            if (!notification_policy_types_1.NOTIFICATION_CONDITION_OPERATORS.includes(node.operator) || !field.operators.includes(node.operator))
                throw new common_1.BadRequestException(`عملگر ${String(node.operator)} برای ${field.label} پشتیبانی نمی‌شود`);
            this.validateValue(node, field);
        }
    }
    validateValue(node, field) {
        if (node.operator === "EXISTS" || node.operator === "NOT_EXISTS") {
            if (node.value !== undefined && node.value !== null)
                throw new common_1.BadRequestException(`${node.operator} نباید مقدار داشته باشد`);
            return;
        }
        if (node.value === undefined || node.value === null)
            throw new common_1.BadRequestException(`مقدار شرط ${field.label} الزامی است`);
        const isSet = node.operator === "IN" || node.operator === "NOT_IN";
        const values = isSet ? node.value : [node.value];
        if (isSet && (!Array.isArray(node.value) || !node.value.length || node.value.length > MAX_IN_VALUES))
            throw new common_1.BadRequestException(`مقدار ${node.operator} باید آرایه‌ای با حداکثر ${MAX_IN_VALUES} عضو باشد`);
        if (!isSet && Array.isArray(node.value))
            throw new common_1.BadRequestException(`عملگر ${node.operator} مقدار آرایه‌ای نمی‌پذیرد`);
        for (const value of values) {
            if (field.type === "number" ? typeof value !== "number" || !Number.isFinite(value) : typeof value !== "string")
                throw new common_1.BadRequestException(`نوع مقدار ${field.label} معتبر نیست`);
            if (typeof value === "string" && value.length > MAX_STRING_LENGTH)
                throw new common_1.BadRequestException(`مقدار ${field.label} بیش از حد طولانی است`);
            if (field.values && !field.values.includes(String(value)))
                throw new common_1.BadRequestException(`مقدار ${String(value)} برای ${field.label} مجاز نیست`);
        }
    }
};
exports.NotificationPolicyConditionValidator = NotificationPolicyConditionValidator;
exports.NotificationPolicyConditionValidator = NotificationPolicyConditionValidator = __decorate([
    (0, common_1.Injectable)()
], NotificationPolicyConditionValidator);
//# sourceMappingURL=notification-policy-condition-validator.service.js.map