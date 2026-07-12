"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDateOnlyString = isDateOnlyString;
exports.parseApiDate = parseApiDate;
exports.parseNullableApiDate = parseNullableApiDate;
exports.parseApiDateRange = parseApiDateRange;
const common_1 = require("@nestjs/common");
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
function isDateOnlyString(value) {
    return DATE_ONLY_PATTERN.test(value);
}
function parseApiDate(value, fieldName = 'date') {
    const dateOnly = DATE_ONLY_PATTERN.exec(value);
    if (dateOnly) {
        const year = Number(dateOnly[1]);
        const month = Number(dateOnly[2]);
        const day = Number(dateOnly[3]);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCFullYear() !== year ||
            date.getUTCMonth() !== month - 1 ||
            date.getUTCDate() !== day) {
            throw new common_1.BadRequestException(`${fieldName} must be a valid Gregorian date`);
        }
        return date;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new common_1.BadRequestException(`${fieldName} must be a valid ISO 8601 date`);
    }
    return date;
}
function parseNullableApiDate(value, fieldName = 'date') {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    return parseApiDate(value, fieldName);
}
function parseApiDateRange(from, to, fromFieldName = 'startDate', toFieldName = 'endDate') {
    const startDate = from ? parseApiDate(from, fromFieldName) : undefined;
    const endDate = to ? parseApiDate(to, toFieldName) : undefined;
    if (!startDate && !endDate)
        return undefined;
    const range = {};
    if (startDate) {
        range.gte = startDate;
    }
    if (to) {
        if (isDateOnlyString(to)) {
            range.lt = addUtcDays(endDate, 1);
        }
        else {
            range.lte = endDate;
        }
    }
    if (startDate && range.lt && startDate >= range.lt) {
        throw new common_1.BadRequestException(`${fromFieldName} must be before or equal to ${toFieldName}`);
    }
    if (startDate && range.lte && startDate > range.lte) {
        throw new common_1.BadRequestException(`${fromFieldName} must be before or equal to ${toFieldName}`);
    }
    return range;
}
function addUtcDays(date, days) {
    return new Date(date.getTime() + days * 86_400_000);
}
//# sourceMappingURL=api-date.util.js.map