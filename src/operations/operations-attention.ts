import { OperationsAttentionState } from "./dto/operations-companies-query.dto";

export interface AttentionFacts {
  overdueTasks: number;
  dueTodayTasks: number;
  hasFutureTask: boolean;
  hasFutureMeeting: boolean;
  activeOpportunities: number;
}

export function classifyOperationsAttention(facts: AttentionFacts): {
  state: OperationsAttentionState;
  reason: string | null;
} {
  if (facts.overdueTasks > 0) {
    return {
      state: OperationsAttentionState.OVERDUE,
      reason: "OPEN_OVERDUE_TASK",
    };
  }
  if (facts.dueTodayTasks > 0) {
    return {
      state: OperationsAttentionState.TODAY,
      reason: "TASK_DUE_TODAY",
    };
  }
  if (
    facts.activeOpportunities > 0 &&
    !facts.hasFutureTask &&
    !facts.hasFutureMeeting
  ) {
    return {
      state: OperationsAttentionState.NO_NEXT_ACTION,
      reason: "ACTIVE_OPPORTUNITY_WITHOUT_NEXT_ACTION",
    };
  }
  if (facts.hasFutureTask || facts.hasFutureMeeting) {
    return {
      state: OperationsAttentionState.UPCOMING,
      reason: "SCHEDULED_FOLLOW_UP",
    };
  }
  return { state: OperationsAttentionState.NORMAL, reason: null };
}
