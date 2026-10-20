"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCustomerRequestTransition = assertCustomerRequestTransition;
exports.allowedCustomerRequestTransitions = allowedCustomerRequestTransitions;
const common_1 = require("@nestjs/common");
const transitions = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
    UNDER_REVIEW: ['IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CANCELLED'],
    IN_PROGRESS: ['WAITING_FOR_CUSTOMER', 'RESOLVED', 'CANCELLED'],
    WAITING_FOR_CUSTOMER: ['IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
    RESOLVED: ['IN_PROGRESS', 'CLOSED'],
    CLOSED: [], CANCELLED: [],
};
function assertCustomerRequestTransition(from, to) {
    if (!transitions[from].includes(to))
        throw new common_1.BadRequestException({ code: 'INVALID_REQUEST_STATUS_TRANSITION', message: `Transition from ${from} to ${to} is not permitted` });
}
function allowedCustomerRequestTransitions(status) { return [...transitions[status]]; }
//# sourceMappingURL=customer-request-lifecycle.js.map