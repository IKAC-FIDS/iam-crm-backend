"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPolicyEvaluatorService = void 0;
const common_1 = require("@nestjs/common");
const notification_policy_field_resolver_1 = require("./notification-policy-field-resolver");
const notification_policy_types_1 = require("./notification-policy.types");
let NotificationPolicyEvaluatorService = class NotificationPolicyEvaluatorService {
    hasConditions(value) {
        return Boolean(value && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.conditions) && value.conditions.length);
    }
    evaluate(value, context) {
        if (!this.hasConditions(value))
            return { matches: true, reason: "no_conditions", checks: [] };
        const checks = [];
        const matches = this.evaluateGroup(value, context, checks);
        return { matches, reason: matches ? "all_conditions_matched" : "condition_failed", checks };
    }
    evaluateGroup(group, context, checks) {
        const results = group.conditions.map(node => (0, notification_policy_types_1.isConditionGroup)(node) ? this.evaluateGroup(node, context, checks) : this.evaluateLeaf(node, context, checks));
        return group.logic === "OR" ? results.some(Boolean) : results.every(Boolean);
    }
    evaluateLeaf(condition, context, checks) {
        const actual = (0, notification_policy_field_resolver_1.resolveNotificationPolicyField)(context, condition.field);
        const expected = condition.value;
        let result = false;
        switch (condition.operator) {
            case "EXISTS":
                result = actual !== undefined && actual !== null;
                break;
            case "NOT_EXISTS":
                result = actual === undefined || actual === null;
                break;
            case "EQ":
                result = actual === expected;
                break;
            case "NEQ":
                result = actual !== expected;
                break;
            case "IN":
                result = Array.isArray(expected) && expected.includes(actual);
                break;
            case "NOT_IN":
                result = Array.isArray(expected) && !expected.includes(actual);
                break;
            case "GT":
                result = this.compare(actual, expected, (left, right) => left > right);
                break;
            case "GTE":
                result = this.compare(actual, expected, (left, right) => left >= right);
                break;
            case "LT":
                result = this.compare(actual, expected, (left, right) => left < right);
                break;
            case "LTE":
                result = this.compare(actual, expected, (left, right) => left <= right);
                break;
        }
        checks.push({ field: condition.field, operator: condition.operator, ...(condition.operator === "EXISTS" || condition.operator === "NOT_EXISTS" ? {} : { expected }), result });
        return result;
    }
    compare(actual, expected, comparator) {
        return typeof actual === "number" && typeof expected === "number" && Number.isFinite(actual) && Number.isFinite(expected) && comparator(actual, expected);
    }
};
exports.NotificationPolicyEvaluatorService = NotificationPolicyEvaluatorService;
exports.NotificationPolicyEvaluatorService = NotificationPolicyEvaluatorService = __decorate([
    (0, common_1.Injectable)()
], NotificationPolicyEvaluatorService);
//# sourceMappingURL=notification-policy-evaluator.service.js.map