"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_QUALITY_RULE_MAP = exports.DATA_QUALITY_RULES = void 0;
const data_quality_dto_1 = require("./dto/data-quality.dto");
const rule = (ruleKey, entityType, scope, severity, fieldNames, title) => ({
    ruleKey,
    entityType,
    scope,
    severity,
    title,
    description: title,
    fieldNames,
});
exports.DATA_QUALITY_RULES = [
    rule("COMPANY_MISSING_OWNER", "COMPANY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.HIGH, ["ownerId"], "Company owner is missing"),
    rule("COMPANY_MISSING_INDUSTRY", "COMPANY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.MEDIUM, ["industryId", "industry"], "Company industry is missing"),
    rule("COMPANY_MISSING_SOURCE", "COMPANY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.MEDIUM, ["sourceId", "source"], "Company source is missing"),
    rule("COMPANY_MISSING_PRIMARY_CONTACT", "COMPANY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.HIGH, ["people.isPrimaryContact"], "Primary contact is missing"),
    rule("COMPANY_MISSING_CONTACT_CHANNEL", "COMPANY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.HIGH, ["publicEmail", "centralPhone", "people.email", "people.phone"], "Contact channel is missing"),
    rule("COMPANY_MISSING_NATIONAL_ID", "COMPANY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.MEDIUM, ["nationalId"], "National ID is missing"),
    rule("OPPORTUNITY_MISSING_OWNER", "OPPORTUNITY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.HIGH, ["ownerId"], "Opportunity owner is missing"),
    rule("OPPORTUNITY_MISSING_ESTIMATED_VALUE", "OPPORTUNITY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.HIGH, ["estimatedValue"], "Estimated value is missing"),
    rule("OPPORTUNITY_MISSING_PROBABILITY", "OPPORTUNITY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.MEDIUM, ["probability"], "Probability is missing"),
    rule("OPPORTUNITY_MISSING_EXPECTED_CLOSE_DATE", "OPPORTUNITY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.MEDIUM, ["expectedCloseDate"], "Expected close date is missing"),
    rule("OPPORTUNITY_MISSING_PRIMARY_CONTACT", "OPPORTUNITY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.MEDIUM, ["primaryContactId"], "Primary contact is missing"),
    rule("OPPORTUNITY_WITHOUT_LINE_ITEMS", "OPPORTUNITY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.LOW, ["lineItems"], "Opportunity has no line items"),
    rule("OPPORTUNITY_CURRENT_STAGE_HISTORY_MISSING", "OPPORTUNITY", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.MEDIUM, ["stageHistories"], "Current stage history is missing"),
    rule("OPEN_TASK_MISSING_ASSIGNEE", "TASK", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.HIGH, ["assignedToId"], "Open task assignee is missing"),
    rule("OPEN_TASK_MISSING_DUE_DATE", "TASK", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.MEDIUM, ["dueAt"], "Open task due date is missing"),
    rule("PAST_SCHEDULED_MEETING", "MEETING", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.HIGH, ["status", "endAt"], "Scheduled meeting is in the past"),
    rule("PAID_PAYMENT_MISSING_PAID_AT", "PAYMENT", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.HIGH, ["status", "paidAt"], "Paid payment timestamp is missing"),
    rule("UNPAID_PAYMENT_HAS_PAID_AT", "PAYMENT", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.HIGH, ["status", "paidAt"], "Unpaid payment has a paid timestamp"),
    rule("OPEN_PAYMENT_MISSING_DUE_DATE", "PAYMENT", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.MEDIUM, ["status", "dueDate"], "Open payment due date is missing"),
    rule("FINAL_DOCUMENT_MISSING_AMOUNT", "COMMERCIAL_DOCUMENT", data_quality_dto_1.ReportingScope.ORGANIZATION, data_quality_dto_1.DataQualitySeverity.HIGH, ["status", "amount"], "Final commercial document amount is missing"),
    rule("ACTIVE_PRODUCT_NON_POSITIVE_IN_PERSON_PRICE", "PRODUCT", data_quality_dto_1.ReportingScope.GLOBAL_CATALOG, data_quality_dto_1.DataQualitySeverity.CRITICAL, ["inPersonPriceIrr"], "In-person price is not positive"),
    rule("ACTIVE_PRODUCT_NON_POSITIVE_DIGIKALA_PRICE", "PRODUCT", data_quality_dto_1.ReportingScope.GLOBAL_CATALOG, data_quality_dto_1.DataQualitySeverity.CRITICAL, ["digikalaPriceIrr"], "Digikala price is not positive"),
    rule("USD_PRODUCT_STALE_EXCHANGE_RATE", "PRODUCT", data_quality_dto_1.ReportingScope.GLOBAL_CATALOG, data_quality_dto_1.DataQualitySeverity.HIGH, ["calculatedExchangeRateId"], "USD product exchange rate is stale"),
    rule("PRODUCT_MISSING_CATEGORY", "PRODUCT", data_quality_dto_1.ReportingScope.GLOBAL_CATALOG, data_quality_dto_1.DataQualitySeverity.LOW, ["category"], "Product category is missing"),
];
exports.DATA_QUALITY_RULE_MAP = new Map(exports.DATA_QUALITY_RULES.map((rule) => [rule.ruleKey, rule]));
//# sourceMappingURL=data-quality-rules.js.map