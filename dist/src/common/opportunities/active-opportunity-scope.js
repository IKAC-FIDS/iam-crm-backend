"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeOpportunityStateWhere = activeOpportunityStateWhere;
function activeOpportunityStateWhere() {
    return {
        archivedAt: null,
        company: { archivedAt: null },
        stage: { isTerminal: false },
    };
}
//# sourceMappingURL=active-opportunity-scope.js.map