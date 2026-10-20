"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyOperationsAttention = classifyOperationsAttention;
const operations_companies_query_dto_1 = require("./dto/operations-companies-query.dto");
function classifyOperationsAttention(facts) {
    if (facts.overdueTasks > 0) {
        return {
            state: operations_companies_query_dto_1.OperationsAttentionState.OVERDUE,
            reason: "OPEN_OVERDUE_TASK",
        };
    }
    if (facts.dueTodayTasks > 0) {
        return {
            state: operations_companies_query_dto_1.OperationsAttentionState.TODAY,
            reason: "TASK_DUE_TODAY",
        };
    }
    if (facts.activeOpportunities > 0 &&
        !facts.hasFutureTask &&
        !facts.hasFutureMeeting) {
        return {
            state: operations_companies_query_dto_1.OperationsAttentionState.NO_NEXT_ACTION,
            reason: "ACTIVE_OPPORTUNITY_WITHOUT_NEXT_ACTION",
        };
    }
    if (facts.hasFutureTask || facts.hasFutureMeeting) {
        return {
            state: operations_companies_query_dto_1.OperationsAttentionState.UPCOMING,
            reason: "SCHEDULED_FOLLOW_UP",
        };
    }
    return { state: operations_companies_query_dto_1.OperationsAttentionState.NORMAL, reason: null };
}
//# sourceMappingURL=operations-attention.js.map