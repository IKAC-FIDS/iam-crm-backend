"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPANY_PHONE_PATTERN = void 0;
exports.normalizeCompanyPhone = normalizeCompanyPhone;
exports.transformCompanyPhone = transformCompanyPhone;
exports.isPhoneLikeSearch = isPhoneLikeSearch;
exports.COMPANY_PHONE_PATTERN = /^\+?\d{5,20}$/;
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
function normalizeCompanyPhone(value) {
    if (value == null) {
        return value;
    }
    const normalized = value
        .trim()
        .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
        .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
        .replace(/[\s\-()]/g, '');
    return normalized || null;
}
function transformCompanyPhone({ value }) {
    return typeof value === 'string' || value == null
        ? normalizeCompanyPhone(value)
        : value;
}
function isPhoneLikeSearch(value) {
    return Boolean(value && /^\+?\d+$/.test(value));
}
//# sourceMappingURL=company-phone.util.js.map