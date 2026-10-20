"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOMER_REQUEST_FIELD_TYPES = void 0;
exports.parseCustomerRequestFormSchema = parseCustomerRequestFormSchema;
exports.validateCustomerRequestAnswers = validateCustomerRequestAnswers;
const common_1 = require("@nestjs/common");
exports.CUSTOMER_REQUEST_FIELD_TYPES = [
    'TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'PHONE', 'DATE',
    'SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX', 'BOOLEAN', 'INFO', 'SECTION',
];
const KEY = /^[a-z][a-z0-9_]{0,63}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[0-9۰-۹٠-٩ ()-]{7,20}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const INPUT_TYPES = new Set(exports.CUSTOMER_REQUEST_FIELD_TYPES);
const DISPLAY_TYPES = new Set(['INFO', 'SECTION']);
function fail(message, field) {
    throw new common_1.BadRequestException({ code: 'INVALID_REQUEST_FORM', message, ...(field && { field }) });
}
function plainRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
function parseCustomerRequestFormSchema(input) {
    if (!plainRecord(input) || !Array.isArray(input.fields) || input.fields.length > 50)
        fail('فرم باید شامل حداکثر ۵۰ فیلد باشد.');
    const keys = new Set();
    const fields = input.fields.map((raw, index) => {
        if (!plainRecord(raw))
            fail(`تعریف فیلد ${index + 1} معتبر نیست.`);
        const key = raw.key;
        const type = raw.type;
        const label = raw.label;
        if (typeof key !== 'string' || !KEY.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key))
            fail('کلید فیلد معتبر نیست.');
        if (keys.has(key))
            fail('کلید فیلد تکراری است.', key);
        keys.add(key);
        if (typeof type !== 'string' || !INPUT_TYPES.has(type))
            fail('نوع فیلد پشتیبانی نمی‌شود.', key);
        if (typeof label !== 'string' || !label.trim() || label.length > 160)
            fail('عنوان فیلد معتبر نیست.', key);
        const field = raw;
        if (field.options) {
            if (!Array.isArray(field.options) || field.options.length > 100 || field.options.some((o) => !plainRecord(o) || typeof o.value !== 'string' || !o.value || o.value.length > 120 || typeof o.label !== 'string' || !o.label || o.label.length > 160))
                fail('گزینه‌های فیلد معتبر نیستند.', key);
            if (new Set(field.options.map((o) => o.value)).size !== field.options.length)
                fail('مقدار گزینه تکراری است.', key);
        }
        if (['SELECT', 'MULTI_SELECT', 'RADIO'].includes(type) && !field.options?.length)
            fail('این فیلد به گزینه نیاز دارد.', key);
        for (const property of ['minLength', 'maxLength', 'min', 'max']) {
            if (field[property] !== undefined && (typeof field[property] !== 'number' || !Number.isFinite(field[property])))
                fail('محدودیت عددی فرم معتبر نیست.', key);
        }
        return JSON.parse(JSON.stringify(field));
    });
    for (const field of fields)
        for (const condition of [field.visibleWhen, field.requiredWhen]) {
            if (condition && (!keys.has(condition.field) || condition.field === field.key))
                fail('شرط فیلد به کلید نامعتبر اشاره می‌کند.', field.key);
        }
    return { fields };
}
function validateCustomerRequestAnswers(schemaInput, input, allowIncomplete = false) {
    const schema = parseCustomerRequestFormSchema(schemaInput);
    if (!plainRecord(input))
        fail('پاسخ‌های فرم باید یک شیء باشند.');
    const serialized = JSON.stringify(input);
    if (Buffer.byteLength(serialized, 'utf8') > 65_536)
        fail('حجم پاسخ‌های فرم بیش از حد مجاز است.');
    const allowed = new Set(schema.fields.filter((f) => !DISPLAY_TYPES.has(f.type)).map((f) => f.key));
    for (const key of Object.keys(input))
        if (!allowed.has(key) || ['__proto__', 'constructor', 'prototype'].includes(key))
            fail('پاسخ شامل فیلد ناشناخته است.', key);
    const output = Object.create(null);
    for (const field of schema.fields) {
        if (DISPLAY_TYPES.has(field.type))
            continue;
        const visible = !field.visibleWhen || input[field.visibleWhen.field] === field.visibleWhen.equals;
        const required = visible && (field.required || (field.requiredWhen && input[field.requiredWhen.field] === field.requiredWhen.equals));
        const value = input[field.key];
        const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
        if (!visible) {
            if (!empty)
                fail('ارسال پاسخ برای فیلد پنهان مجاز نیست.', field.key);
            continue;
        }
        if (required && empty && !allowIncomplete)
            fail('تکمیل این فیلد الزامی است.', field.key);
        if (empty)
            continue;
        const options = new Set(field.options?.map((o) => o.value) ?? []);
        if (['TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'DATE', 'SELECT', 'RADIO'].includes(field.type) && typeof value !== 'string')
            fail('نوع پاسخ معتبر نیست.', field.key);
        if (typeof value === 'string') {
            if (value.length > (field.maxLength ?? 4000) || value.length < (field.minLength ?? 0))
                fail('طول پاسخ معتبر نیست.', field.key);
            if (field.type === 'EMAIL' && !EMAIL.test(value))
                fail('ایمیل معتبر نیست.', field.key);
            if (field.type === 'PHONE' && !PHONE.test(value))
                fail('شماره تماس معتبر نیست.', field.key);
            if (field.type === 'DATE' && (!DATE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))))
                fail('تاریخ معتبر نیست.', field.key);
            if (['SELECT', 'RADIO'].includes(field.type) && !options.has(value))
                fail('گزینه انتخاب‌شده معتبر نیست.', field.key);
        }
        if (field.type === 'NUMBER' && (typeof value !== 'number' || !Number.isFinite(value) || (field.min !== undefined && value < field.min) || (field.max !== undefined && value > field.max)))
            fail('عدد واردشده معتبر نیست.', field.key);
        if (['BOOLEAN', 'CHECKBOX'].includes(field.type) && typeof value !== 'boolean')
            fail('مقدار منطقی معتبر نیست.', field.key);
        if (field.type === 'MULTI_SELECT' && (!Array.isArray(value) || value.length > options.size || value.some((v) => typeof v !== 'string' || !options.has(v))))
            fail('گزینه‌های انتخاب‌شده معتبر نیستند.', field.key);
        output[field.key] = value;
    }
    return output;
}
//# sourceMappingURL=customer-request-form.js.map