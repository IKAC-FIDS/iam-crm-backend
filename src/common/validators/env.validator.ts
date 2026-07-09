import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // ---------- اجباری ----------
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

  // ---------- اختیاری با مقدار پیش‌فرض ----------
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
    .default('8h')
    .pattern(/^\d+[smhdw]$/)
    .messages({
      'string.pattern.base': 'JWT_EXPIRES_IN باید فرمت زمان معتبر داشته باشد (مثلاً 8h, 30m, 7d)',
    }),

  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .messages({
      'any.only': 'NODE_ENV باید یکی از مقادیر development, production, test باشد',
    }),

  // ---------- CORS ----------
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:5173')
    .messages({
      'string.base': 'CORS_ORIGINS باید یک رشته شامل originهای مجاز باشد',
    }),

  CORS_CREDENTIALS: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false)
    .messages({
      'boolean.base': 'CORS_CREDENTIALS باید true یا false باشد',
    }),

  // ---------- SSO ----------
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

  // ---------- Rate Limiting (اختیاری) ----------
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