"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.envValidationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.envValidationSchema = Joi.object({
    DATABASE_URL: Joi.string()
        .required()
        .uri({ scheme: ['postgresql', 'postgres'] })
        .messages({
        'any.required': 'DATABASE_URL اجباری است',
        'string.uri': 'DATABASE_URL باید یک URI معتبر با پروتکل postgresql یا postgres باشد',
    }),
    JWT_SECRET: Joi.string()
        .required()
        .min(32)
        .messages({
        'any.required': 'JWT_SECRET اجباری است',
        'string.min': 'JWT_SECRET باید حداقل ۳۲ کاراکتر باشد',
    }),
    PORT: Joi.number()
        .default(3000)
        .integer()
        .min(1)
        .max(65535)
        .messages({
        'number.base': 'PORT باید یک عدد باشد',
        'number.integer': 'PORT باید عدد صحیح باشد',
        'number.min': 'PORT باید حداقل ۱ باشد',
        'number.max': 'PORT باید حداکثر ۶۵۵۳۵ باشد',
    }),
    JWT_EXPIRES_IN: Joi.string()
        .default('15m')
        .pattern(/^\d+[smhdw]$/)
        .messages({
        'string.pattern.base': 'JWT_EXPIRES_IN باید فرمت زمان معتبر داشته باشد (مثلاً 15m, 8h, 7d)',
    }),
    REFRESH_TOKEN_EXPIRES_IN: Joi.string()
        .default('30d')
        .pattern(/^\d+[smhdw]$/)
        .messages({
        'string.pattern.base': 'REFRESH_TOKEN_EXPIRES_IN باید فرمت زمان معتبر داشته باشد (مثلاً 30d, 12h, 4w)',
    }),
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development')
        .messages({
        'any.only': 'NODE_ENV باید یکی از مقادیر development, production, test باشد',
    }),
    APP_VERSION: Joi.string()
        .optional()
        .messages({
        'string.base': 'APP_VERSION باید رشته باشد',
    }),
    APP_COMMIT_SHA: Joi.string()
        .optional()
        .messages({
        'string.base': 'APP_COMMIT_SHA باید رشته باشد',
    }),
    APP_BUILD_TIME: Joi.string()
        .optional()
        .messages({
        'string.base': 'APP_BUILD_TIME باید رشته باشد',
    }),
    CORS_ORIGINS: Joi.string()
        .default('http://localhost:5173')
        .messages({
        'string.base': 'CORS_ORIGINS باید یک رشته شامل originهای مجاز باشد',
    }),
    CORS_CREDENTIALS: Joi.boolean()
        .truthy('true')
        .falsy('false')
        .default(true)
        .messages({
        'boolean.base': 'CORS_CREDENTIALS باید true یا false باشد',
    }),
    SSO_SECRET_ENCRYPTION_KEY: Joi.string()
        .min(32)
        .optional()
        .messages({
        'string.base': 'SSO_SECRET_ENCRYPTION_KEY باید رشته باشد',
        'string.min': 'SSO_SECRET_ENCRYPTION_KEY باید حداقل ۳۲ کاراکتر باشد',
    }),
    SSO_TICKET_TTL: Joi.number()
        .default(120)
        .integer()
        .min(30)
        .messages({
        'number.base': 'SSO_TICKET_TTL باید یک عدد باشد',
        'number.integer': 'SSO_TICKET_TTL باید عدد صحیح باشد',
        'number.min': 'SSO_TICKET_TTL باید حداقل ۳۰ ثانیه باشد',
    }),
    FRONTEND_SSO_CALLBACK_URL: Joi.string()
        .uri()
        .default('http://localhost:5173/auth/sso/callback')
        .messages({
        'string.uri': 'FRONTEND_SSO_CALLBACK_URL باید یک URL معتبر باشد',
    }),
    BACKEND_PUBLIC_URL: Joi.string()
        .uri()
        .default('http://localhost:3000')
        .messages({
        'string.uri': 'BACKEND_PUBLIC_URL باید یک URL معتبر باشد',
    }),
    THROTTLE_TTL: Joi.number()
        .default(60000)
        .integer()
        .min(1000)
        .messages({
        'number.base': 'THROTTLE_TTL باید یک عدد باشد',
        'number.min': 'THROTTLE_TTL باید حداقل ۱۰۰۰ (۱ ثانیه) باشد',
    }),
    THROTTLE_LIMIT: Joi.number()
        .default(100)
        .integer()
        .min(1)
        .messages({
        'number.base': 'THROTTLE_LIMIT باید یک عدد باشد',
        'number.min': 'THROTTLE_LIMIT باید حداقل ۱ باشد',
    }),
    WEBAUTHN_RP_NAME: Joi.string().default('IAM CRM'),
    WEBAUTHN_RP_ID: Joi.string().default('localhost'),
    WEBAUTHN_ORIGIN: Joi.string().uri().default('http://localhost:5173'),
});
//# sourceMappingURL=env.validator.js.map