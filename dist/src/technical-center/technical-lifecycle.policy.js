"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenderTransitions = exports.documentTransitions = exports.knowledgeTransitions = exports.releaseTransitions = void 0;
exports.assertTransition = assertTransition;
const common_1 = require("@nestjs/common");
exports.releaseTransitions = {
    DRAFT: ['PLANNED', 'ARCHIVED'],
    PLANNED: ['DRAFT', 'RELEASED', 'ARCHIVED'],
    RELEASED: ['DEPRECATED', 'ARCHIVED'],
    DEPRECATED: ['END_OF_LIFE', 'ARCHIVED'],
    END_OF_LIFE: ['ARCHIVED'],
    ARCHIVED: [],
};
exports.knowledgeTransitions = {
    DRAFT: ['IN_REVIEW', 'ARCHIVED'],
    IN_REVIEW: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    PUBLISHED: ['IN_REVIEW', 'ARCHIVED'],
    ARCHIVED: [],
};
exports.documentTransitions = {
    DRAFT: ['IN_REVIEW', 'ARCHIVED'],
    IN_REVIEW: ['DRAFT', 'APPROVED', 'ARCHIVED'],
    APPROVED: ['ACTIVE', 'ARCHIVED'],
    ACTIVE: ['SUPERSEDED', 'EXPIRED', 'ARCHIVED'],
    SUPERSEDED: ['ARCHIVED'],
    EXPIRED: ['ARCHIVED'],
    ARCHIVED: [],
};
const cancellable = [
    'DRAFT', 'IDENTIFIED', 'QUALIFICATION', 'PREPARING', 'TECHNICAL_REVIEW',
    'COMMERCIAL_REVIEW', 'READY_FOR_SUBMISSION', 'SUBMITTED', 'UNDER_EVALUATION',
    'CLARIFICATION',
];
exports.tenderTransitions = {
    DRAFT: ['IDENTIFIED', 'CANCELLED'],
    IDENTIFIED: ['QUALIFICATION', 'CANCELLED'],
    QUALIFICATION: ['PREPARING', 'CANCELLED'],
    PREPARING: ['TECHNICAL_REVIEW', 'CANCELLED'],
    TECHNICAL_REVIEW: ['PREPARING', 'COMMERCIAL_REVIEW', 'CANCELLED'],
    COMMERCIAL_REVIEW: ['TECHNICAL_REVIEW', 'READY_FOR_SUBMISSION', 'CANCELLED'],
    READY_FOR_SUBMISSION: ['COMMERCIAL_REVIEW', 'SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['UNDER_EVALUATION', 'CANCELLED'],
    UNDER_EVALUATION: ['CLARIFICATION', 'WON', 'LOST', 'CANCELLED'],
    CLARIFICATION: ['UNDER_EVALUATION', 'CANCELLED'],
    WON: ['ARCHIVED'],
    LOST: ['ARCHIVED'],
    CANCELLED: ['ARCHIVED'],
    ARCHIVED: [],
};
if (!cancellable.every((status) => exports.tenderTransitions[status].includes('CANCELLED'))) {
    throw new Error('Tender cancellation lifecycle is incomplete');
}
function assertTransition(entity, graph, from, to) {
    if (!graph[from]?.includes(to)) {
        throw new common_1.BadRequestException({
            code: 'INVALID_LIFECYCLE_TRANSITION',
            message: `Invalid ${entity} transition from ${from} to ${to}`,
            details: { entity, from, to, allowed: graph[from] ?? [] },
        });
    }
}
//# sourceMappingURL=technical-lifecycle.policy.js.map