"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_CONDITION_OPERATORS = void 0;
exports.isConditionGroup = isConditionGroup;
exports.NOTIFICATION_CONDITION_OPERATORS = ["EQ", "NEQ", "IN", "NOT_IN", "EXISTS", "NOT_EXISTS", "GT", "GTE", "LT", "LTE"];
function isConditionGroup(node) {
    return Object.prototype.hasOwnProperty.call(node, "logic");
}
//# sourceMappingURL=notification-policy.types.js.map