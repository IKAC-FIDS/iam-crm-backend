"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FINANCIAL_VIEW_PERMISSION = void 0;
exports.canViewFinancials = canViewFinancials;
exports.redactFinancialResponse = redactFinancialResponse;
exports.FINANCIAL_VIEW_PERMISSION = "financial:view";
const FINANCIAL_FIELD_NAMES = new Set([
    "amount",
    "estimatedValue",
    "unitPrice",
    "defaultUnitPrice",
    "inPersonPrice",
    "onlinePrice",
    "digikalaPrice",
    "inPersonInputPrice",
    "digikalaInputPrice",
    "inPersonProfitPercent",
    "digikalaProfitPercent",
    "discountAmount",
    "taxAmount",
    "lineTotal",
    "catalogUnitPriceIrrSnapshot",
    "catalogPrice",
    "collectedAmount",
    "receivableAmount",
    "pipelineValue",
    "avgOpportunityValue",
]);
function isFinancialField(key) {
    return (FINANCIAL_FIELD_NAMES.has(key) ||
        /(?:Amount|Value|Price)Irr$/.test(key));
}
function isPlainObject(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
function canViewFinancials(user) {
    return Boolean(user?.tenantContext?.permissions?.includes(exports.FINANCIAL_VIEW_PERMISSION));
}
function redactFinancialResponse(value, user) {
    if (canViewFinancials(user))
        return value;
    if (Array.isArray(value)) {
        return value.map((item) => redactFinancialResponse(item, user));
    }
    if (!isPlainObject(value))
        return value;
    const isFinancialMetric = value.valueType === "IRR";
    const financialMetricFields = new Set([
        "currentValue",
        "comparisonValue",
        "absoluteChange",
        "percentChange",
    ]);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        isFinancialField(key) ||
            (isFinancialMetric && financialMetricFields.has(key))
            ? null
            : redactFinancialResponse(item, user),
    ]));
}
//# sourceMappingURL=financial-visibility.js.map