"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsApiDateString = IsApiDateString;
exports.isValidApiDateString = isValidApiDateString;
const class_validator_1 = require("class-validator");
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
function IsApiDateString(validationOptions) {
    return (object, propertyName) => {
        (0, class_validator_1.registerDecorator)({
            name: 'isApiDateString',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value) {
                    return typeof value === 'string' && isValidApiDateString(value);
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid Gregorian YYYY-MM-DD date or ISO 8601 date-time string`;
                },
            },
        });
    };
}
function isValidApiDateString(value) {
    const dateOnly = DATE_ONLY_PATTERN.exec(value);
    if (dateOnly) {
        const year = Number(dateOnly[1]);
        const month = Number(dateOnly[2]);
        const day = Number(dateOnly[3]);
        const date = new Date(Date.UTC(year, month - 1, day));
        return (date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day);
    }
    return (0, class_validator_1.isISO8601)(value, { strict: true });
}
//# sourceMappingURL=api-date-string.validator.js.map