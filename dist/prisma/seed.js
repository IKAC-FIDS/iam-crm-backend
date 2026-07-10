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
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function upsertPermission(permission) {
    return prisma.permission.upsert({
        where: { action: permission.action },
        update: { description: permission.description },
        create: permission,
    });
}
async function syncRolePermissions(role, actions) {
    for (const action of actions) {
        const permission = await prisma.permission.findUnique({
            where: { action },
        });
        if (!permission) {
            console.warn(`⚠️ Permission پیدا نشد و به نقش ${role} اختصاص داده نشد: ${action}`);
            continue;
        }
        await prisma.rolePermission.upsert({
            where: {
                role_permissionId: {
                    role,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                role,
                permissionId: permission.id,
            },
        });
        console.log(`✅ ${role} -> ${action}`);
    }
}
async function upsertPersonaByTitlePattern(persona) {
    const existing = await prisma.personaLibrary.findFirst({
        where: { titlePattern: persona.titlePattern },
    });
    if (existing) {
        return prisma.personaLibrary.update({
            where: { id: existing.id },
            data: {
                defaultPainPoint: persona.defaultPainPoint,
                defaultUseCase: persona.defaultUseCase,
                notes: persona.notes,
            },
        });
    }
    return prisma.personaLibrary.create({
        data: persona,
    });
}
async function upsertPainPointByTitle(item) {
    const existing = await prisma.painPoint.findFirst({
        where: { title: item.title },
    });
    if (existing) {
        return prisma.painPoint.update({
            where: { id: existing.id },
            data: {
                description: item.description,
                category: item.category,
            },
        });
    }
    return prisma.painPoint.create({
        data: item,
    });
}
async function upsertUseCaseByTitle(item) {
    const existing = await prisma.useCase.findFirst({
        where: { title: item.title },
    });
    if (existing) {
        return prisma.useCase.update({
            where: { id: existing.id },
            data: {
                description: item.description,
                category: item.category,
            },
        });
    }
    return prisma.useCase.create({
        data: item,
    });
}
async function main() {
    const adminEmail = 'admin@yourcompany.com';
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            fullName: 'مدیر سیستم',
            role: client_1.UserRole.ADMIN,
            isActive: true,
        },
        create: {
            fullName: 'مدیر سیستم',
            email: adminEmail,
            passwordHash: await bcrypt.hash('ChangeMe123!', 10),
            role: client_1.UserRole.ADMIN,
            isActive: true,
        },
    });
    console.log(`✅ کاربر ادمین آماده است: ${adminEmail} / ChangeMe123!`);
    const personas = [
        {
            titlePattern: 'CIO',
            defaultPainPoint: 'استانداردسازی دسترسی، کاهش پیچیدگی IT',
            defaultUseCase: 'SSO، یکپارچه‌سازی سامانه‌ها',
            notes: 'مالک اصلی پروژه IAM',
        },
        {
            titlePattern: 'CISO',
            defaultPainPoint: 'ریسک Credential، کنترل دسترسی، Audit',
            defaultUseCase: 'MFA، کاهش ریسک Credential',
            notes: 'محرک اصلی MFA و SSO',
        },
        {
            titlePattern: 'مدیر IT',
            defaultPainPoint: 'کاهش Ticket رمز عبور، مدیریت کاربران',
            defaultUseCase: 'ساده‌سازی ورود',
            notes: 'اجرای عملیاتی و نیازهای روزمره',
        },
        {
            titlePattern: 'مدیر زیرساخت',
            defaultPainPoint: 'اتصال امن به زیرساخت',
            defaultUseCase: 'On-premise، Windows Login، شبکه',
            notes: null,
        },
        {
            titlePattern: 'مدیرعامل',
            defaultPainPoint: 'کاهش ریسک سازمانی، کنترل مدیریتی، آمادگی رشد',
            defaultUseCase: null,
            notes: 'مهم برای سازمان‌های کوچک‌تر',
        },
        {
            titlePattern: 'CFO',
            defaultPainPoint: 'کاهش هزینه پشتیبانی، کاهش ریسک رخداد امنیتی',
            defaultUseCase: null,
            notes: 'بودجه و ROI',
        },
        {
            titlePattern: 'مدیر منابع انسانی',
            defaultPainPoint: 'ورود و خروج کارکنان، تغییر نقش، کنترل دسترسی داخلی',
            defaultUseCase: null,
            notes: null,
        },
        {
            titlePattern: 'مدیر تدارکات',
            defaultPainPoint: 'مسیر خرید، مستندات، RFP، شرایط تامین',
            defaultUseCase: null,
            notes: null,
        },
        {
            titlePattern: 'مدیر حراست',
            defaultPainPoint: 'کنترل کاربران، ممیزی',
            defaultUseCase: null,
            notes: 'در سازمان‌های دولتی و حساس',
        },
        {
            titlePattern: 'مدیر تحول دیجیتال',
            defaultPainPoint: 'معماری آینده، پروژه‌های جدید',
            defaultUseCase: null,
            notes: null,
        },
    ];
    for (const persona of personas) {
        await upsertPersonaByTitlePattern(persona);
    }
    console.log('✅ کتابخانه Persona آماده شد.');
    const painPointData = [
        {
            title: 'مدیریت کاربران در خطوط تولید',
            description: 'نیروی انسانی زیاد با دسترسی‌های متنوع و نیاز به کنترل امنیتی',
            category: 'امنیت',
        },
        {
            title: 'مدیریت دسترسی پیمانکاران و تأمین‌کنندگان',
            description: 'دسترسی موقت و کنترل‌شده برای نیروهای خارج از سازمان',
            category: 'مدیریت',
        },
        {
            title: 'یکپارچه‌سازی سامانه‌های داخلی',
            description: 'اتصال سامانه‌های مختلف و مدیریت یکپارچه کاربران',
            category: 'فنی',
        },
        {
            title: 'کاهش هزینه‌های پشتیبانی IT',
            description: 'کاهش Ticketهای پشتیبانی مرتبط با رمز عبور و دسترسی',
            category: 'هزینه',
        },
        {
            title: 'تطابق با قوانین و استانداردها (Compliance)',
            description: 'نیاز به رعایت استانداردهای امنیتی و حریم خصوصی',
            category: 'قانونی',
        },
    ];
    for (const item of painPointData) {
        await upsertPainPointByTitle(item);
    }
    console.log('✅ نقاط درد آماده شدند.');
    const useCaseData = [
        {
            title: 'پیاده‌سازی SSO (Single Sign-On)',
            description: 'یکپارچه‌سازی سامانه‌های داخلی و خارجی با پروتکل‌های SAML و OIDC',
            category: 'SSO',
        },
        {
            title: 'MFA (Multi-Factor Authentication)',
            description: 'احراز هویت چندعاملی برای افزایش امنیت دسترسی',
            category: 'MFA',
        },
        {
            title: 'Passwordless Authentication',
            description: 'حذف رمز عبور و استفاده از روش‌های بیومتریک یا توکن',
            category: 'امنیت',
        },
        {
            title: 'Identity Governance & Administration',
            description: 'مدیریت چرخه حیات هویت و دسترسی‌ها',
            category: 'Governance',
        },
        {
            title: 'Secure File Exchange',
            description: 'تبادل امن فایل‌ها بین کاربران و سازمان‌ها',
            category: 'امنیت',
        },
    ];
    for (const item of useCaseData) {
        await upsertUseCaseByTitle(item);
    }
    console.log('✅ کاربردها آماده شدند.');
    const industryData = [
        {
            name: 'خودروسازی',
            description: 'صنایع تولیدی خودرو و قطعات',
            painPointTitles: [
                'مدیریت کاربران در خطوط تولید',
                'مدیریت دسترسی پیمانکاران و تأمین‌کنندگان',
            ],
            useCaseTitles: [
                'پیاده‌سازی SSO (Single Sign-On)',
                'MFA (Multi-Factor Authentication)',
            ],
        },
        {
            name: 'بانکداری دیجیتال',
            description: 'بانک‌های آنلاین و نئوبانک‌ها',
            painPointTitles: [
                'تطابق با قوانین و استانداردها (Compliance)',
                'یکپارچه‌سازی سامانه‌های داخلی',
            ],
            useCaseTitles: [
                'MFA (Multi-Factor Authentication)',
                'Identity Governance & Administration',
            ],
        },
        {
            name: 'نفت و گاز',
            description: 'شرکت‌های پتروشیمی و پالایشگاهی',
            painPointTitles: [
                'مدیریت کاربران در خطوط تولید',
                'تطابق با قوانین و استانداردها (Compliance)',
            ],
            useCaseTitles: [
                'Secure File Exchange',
                'MFA (Multi-Factor Authentication)',
            ],
        },
        {
            name: 'فناوری اطلاعات',
            description: 'شرکت‌های نرم‌افزاری، زیرساختی و سرویس‌دهنده IT',
            painPointTitles: [
                'یکپارچه‌سازی سامانه‌های داخلی',
                'کاهش هزینه‌های پشتیبانی IT',
            ],
            useCaseTitles: [
                'پیاده‌سازی SSO (Single Sign-On)',
                'Passwordless Authentication',
            ],
        },
    ];
    for (const item of industryData) {
        const industry = await prisma.industry.upsert({
            where: { name: item.name },
            update: {
                description: item.description,
            },
            create: {
                name: item.name,
                description: item.description,
            },
        });
        for (const title of item.painPointTitles) {
            const painPoint = await prisma.painPoint.findFirst({
                where: { title },
            });
            if (!painPoint)
                continue;
            const existing = await prisma.industryPainPoint.findFirst({
                where: {
                    industryId: industry.id,
                    painPointId: painPoint.id,
                },
            });
            if (!existing) {
                await prisma.industryPainPoint.create({
                    data: {
                        industryId: industry.id,
                        painPointId: painPoint.id,
                    },
                });
            }
        }
        for (const title of item.useCaseTitles) {
            const useCase = await prisma.useCase.findFirst({
                where: { title },
            });
            if (!useCase)
                continue;
            const existing = await prisma.industryUseCase.findFirst({
                where: {
                    industryId: industry.id,
                    useCaseId: useCase.id,
                },
            });
            if (!existing) {
                await prisma.industryUseCase.create({
                    data: {
                        industryId: industry.id,
                        useCaseId: useCase.id,
                    },
                });
            }
        }
    }
    console.log('✅ صنایع آماده شدند.');
    const leadSources = [
        {
            code: 'SAM_LIST',
            name: 'فهرست سام',
            description: 'ورودی از فایل یا لیست SAM',
            sortOrder: 10,
        },
        {
            code: 'REFERRAL',
            name: 'معرفی',
            description: 'معرفی توسط مشتری یا همکار',
            sortOrder: 20,
        },
        {
            code: 'EVENT',
            name: 'رویداد / نمایشگاه',
            description: 'سرنخ حاصل از رویداد، نمایشگاه یا وبینار',
            sortOrder: 30,
        },
        {
            code: 'WEBSITE',
            name: 'وب‌سایت',
            description: 'ثبت درخواست یا تماس از وب‌سایت',
            sortOrder: 40,
        },
        {
            code: 'OUTBOUND',
            name: 'تماس خروجی',
            description: 'تلاش فروش outbound',
            sortOrder: 50,
        },
        {
            code: 'OTHER',
            name: 'سایر',
            description: 'سایر منابع جذب',
            sortOrder: 999,
        },
    ];
    for (const item of leadSources) {
        await prisma.leadSource.upsert({
            where: { code: item.code },
            update: {
                name: item.name,
                description: item.description,
                sortOrder: item.sortOrder,
                isActive: true,
            },
            create: {
                ...item,
                isActive: true,
            },
        });
    }
    console.log('✅ منابع جذب آماده شدند.');
    const lookupGroups = {
        departments: [
            { code: 'IT', label: 'فناوری اطلاعات', sortOrder: 10 },
            { code: 'SECURITY', label: 'امنیت', sortOrder: 20 },
            { code: 'INFRASTRUCTURE', label: 'زیرساخت', sortOrder: 30 },
            { code: 'FINANCE', label: 'مالی', sortOrder: 40 },
            { code: 'HR', label: 'منابع انسانی', sortOrder: 50 },
            { code: 'PROCUREMENT', label: 'تدارکات', sortOrder: 60 },
            { code: 'OPERATIONS', label: 'عملیات', sortOrder: 70 },
            { code: 'MANAGEMENT', label: 'مدیریت', sortOrder: 80 },
        ],
        contact_types: [
            { code: 'MOBILE', label: 'موبایل', sortOrder: 10 },
            { code: 'PHONE', label: 'تلفن', sortOrder: 20 },
            { code: 'EMAIL', label: 'ایمیل', sortOrder: 30 },
            { code: 'WORK_EMAIL', label: 'ایمیل کاری', sortOrder: 40 },
            { code: 'EXTENSION', label: 'داخلی', sortOrder: 50 },
            { code: 'FAX', label: 'فکس', sortOrder: 60 },
        ],
        social_types: [
            { code: 'LINKEDIN', label: 'لینکدین', sortOrder: 10 },
            { code: 'TELEGRAM', label: 'تلگرام', sortOrder: 20 },
            { code: 'WHATSAPP', label: 'واتساپ', sortOrder: 30 },
            { code: 'INSTAGRAM', label: 'اینستاگرام', sortOrder: 40 },
            { code: 'WEBSITE', label: 'وب‌سایت', sortOrder: 50 },
        ],
    };
    for (const [group, items] of Object.entries(lookupGroups)) {
        for (const item of items) {
            await prisma.lookupOption.upsert({
                where: {
                    group_code: {
                        group,
                        code: item.code,
                    },
                },
                update: {
                    label: item.label,
                    sortOrder: item.sortOrder,
                    isActive: true,
                },
                create: {
                    group,
                    code: item.code,
                    label: item.label,
                    sortOrder: item.sortOrder,
                    isActive: true,
                },
            });
        }
    }
    console.log('✅ گزینه‌های پایه آماده شدند.');
    const stageConfigs = [
        ['LEAD', 'سرنخ', false, 'NONE', '#607D8B'],
        ['CONTACTED', 'تماس گرفته شده', false, 'NONE', '#2196F3'],
        ['INTERESTED', 'علاقه‌مند', false, 'NONE', '#00BCD4'],
        ['QUALIFIED', 'واجد شرایط', false, 'NONE', '#3F51B5'],
        ['NEEDS_ASSESSMENT', 'نیازسنجی', false, 'NONE', '#673AB7'],
        ['PENDING_PRE_INVOICE_APPROVAL', 'در انتظار تأیید پیش‌فاکتور', false, 'NONE', '#9C27B0'],
        ['POC_PILOT_SCHEDULED', 'پایلوت زمان‌بندی شده', false, 'NONE', '#FF9800'],
        ['POC_PILOT_IN_PROGRESS', 'پایلوت در حال اجرا', false, 'NONE', '#FF5722'],
        ['PENDING_POC_PILOT_APPROVAL', 'در انتظار تأیید پایلوت', false, 'NONE', '#795548'],
        ['PENDING_PAYMENT_INVOICE_APPROVAL', 'در انتظار تأیید فاکتور پرداخت', false, 'NONE', '#CDDC39'],
        ['INSTALLATION_SCHEDULED', 'نصب زمان‌بندی شده', false, 'NONE', '#8BC34A'],
        ['INSTALLATION_IN_PROGRESS', 'نصب در حال اجرا', false, 'NONE', '#4CAF50'],
        ['PENDING_CUSTOMER_ACCEPTANCE', 'در انتظار پذیرش مشتری', false, 'NONE', '#009688'],
        ['DONE', 'انجام شده', true, 'WON', '#2E7D32'],
        ['ON_HOLD', 'متوقف شده', true, 'ON_HOLD', '#F9A825'],
        ['LOST', 'از دست رفته', true, 'LOST', '#C62828'],
        ['NO_RESPONSE', 'بدون پاسخ', true, 'LOST', '#757575'],
    ];
    for (const [sortOrder, [code, label, isTerminal, terminalType, color]] of stageConfigs.entries()) {
        await prisma.pipelineStage.upsert({
            where: { code },
            update: {
                label,
                sortOrder,
                color,
                isActive: true,
                isTerminal,
                terminalType,
                isDefault: code === 'LEAD',
            },
            create: {
                code,
                label,
                sortOrder,
                color,
                isActive: true,
                isTerminal,
                terminalType,
                isDefault: code === 'LEAD',
            },
        });
    }
    console.log('✅ مراحل پایپ‌لاین آماده شدند.');
    const defaultTransitions = [
        [null, 'LEAD'],
        ['LEAD', 'CONTACTED'],
        ['CONTACTED', 'INTERESTED'],
        ['CONTACTED', 'NO_RESPONSE'],
        ['INTERESTED', 'QUALIFIED'],
        ['QUALIFIED', 'NEEDS_ASSESSMENT'],
        ['NEEDS_ASSESSMENT', 'PENDING_PRE_INVOICE_APPROVAL'],
        ['PENDING_PRE_INVOICE_APPROVAL', 'POC_PILOT_SCHEDULED'],
        ['POC_PILOT_SCHEDULED', 'POC_PILOT_IN_PROGRESS'],
        ['POC_PILOT_IN_PROGRESS', 'PENDING_POC_PILOT_APPROVAL'],
        ['PENDING_POC_PILOT_APPROVAL', 'PENDING_PAYMENT_INVOICE_APPROVAL'],
        ['PENDING_PAYMENT_INVOICE_APPROVAL', 'INSTALLATION_SCHEDULED'],
        ['INSTALLATION_SCHEDULED', 'INSTALLATION_IN_PROGRESS'],
        ['INSTALLATION_IN_PROGRESS', 'PENDING_CUSTOMER_ACCEPTANCE'],
        ['PENDING_CUSTOMER_ACCEPTANCE', 'DONE'],
        ['INTERESTED', 'ON_HOLD'],
        ['QUALIFIED', 'ON_HOLD'],
        ['NEEDS_ASSESSMENT', 'ON_HOLD'],
        ['ON_HOLD', 'CONTACTED'],
        ['ON_HOLD', 'INTERESTED'],
        ['ON_HOLD', 'QUALIFIED'],
        ['CONTACTED', 'LOST'],
        ['INTERESTED', 'LOST'],
        ['QUALIFIED', 'LOST'],
        ['NEEDS_ASSESSMENT', 'LOST'],
        ['PENDING_CUSTOMER_ACCEPTANCE', 'LOST'],
    ];
    for (const [fromCode, toCode] of defaultTransitions) {
        const toStage = await prisma.pipelineStage.findUniqueOrThrow({
            where: { code: toCode },
        });
        const fromStage = fromCode
            ? await prisma.pipelineStage.findUniqueOrThrow({
                where: { code: fromCode },
            })
            : null;
        const existing = await prisma.pipelineStageTransition.findFirst({
            where: {
                fromStageId: fromStage?.id ?? null,
                toStageId: toStage.id,
                role: null,
            },
        });
        if (existing) {
            await prisma.pipelineStageTransition.update({
                where: { id: existing.id },
                data: { isAllowed: true },
            });
        }
        else {
            await prisma.pipelineStageTransition.create({
                data: {
                    fromStageId: fromStage?.id ?? null,
                    toStageId: toStage.id,
                    role: null,
                    isAllowed: true,
                },
            });
        }
    }
    console.log('✅ قوانین انتقال پایپ‌لاین آماده شدند.');
    const permissions = [
        { action: 'user:view', description: 'مشاهده کاربران' },
        { action: 'user:create', description: 'ایجاد کاربر' },
        { action: 'user:update', description: 'ویرایش کاربر' },
        { action: 'user:manage', description: 'مدیریت کاربران' },
        { action: 'user:activate', description: 'فعال‌سازی کاربر' },
        { action: 'user:deactivate', description: 'غیرفعال‌سازی کاربر' },
        { action: 'user:change-role', description: 'تغییر نقش کاربر' },
        { action: 'user:passkey:view', description: 'مشاهده Passkeyهای کاربران توسط ادمین' },
        { action: 'user:passkey:manage', description: 'مدیریت Passkeyهای کاربران توسط ادمین' },
        { action: 'permission:view', description: 'مشاهده ماتریس مجوزها' },
        { action: 'permission:manage', description: 'مدیریت مجوزهای نقش‌ها' },
        { action: 'audit-log:view', description: 'مشاهده لاگ ممیزی' },
        { action: 'company:view', description: 'مشاهده شرکت‌ها' },
        { action: 'company:create', description: 'ایجاد شرکت' },
        { action: 'company:update', description: 'ویرایش شرکت' },
        { action: 'company:delete', description: 'حذف شرکت' },
        { action: 'company:archive', description: 'بایگانی شرکت' },
        { action: 'company:restore', description: 'بازیابی شرکت بایگانی‌شده' },
        { action: 'company:change-owner', description: 'تغییر مالک شرکت' },
        { action: 'company:assign-owner', description: 'مشاهده مالکان قابل تخصیص شرکت' },
        { action: 'company:bulk-change-owner', description: 'تغییر گروهی مالک شرکت‌ها' },
        { action: 'company:change-stage', description: 'Deprecated: تغییر مرحله legacy شرکت - از opportunity:change-stage استفاده شود' },
        { action: 'opportunity:view', description: 'مشاهده فرصت‌ها' },
        { action: 'opportunity:create', description: 'ایجاد فرصت' },
        { action: 'opportunity:update', description: 'ویرایش فرصت' },
        { action: 'opportunity:change-stage', description: 'تغییر مرحله فرصت' },
        { action: 'opportunity:change-owner', description: 'تغییر مالک فرصت' },
        { action: 'opportunity:archive', description: 'بایگانی فرصت' },
        { action: 'opportunity:restore', description: 'بازیابی فرصت' },
        { action: 'person:view', description: 'مشاهده اشخاص' },
        { action: 'person:create', description: 'ایجاد شخص' },
        { action: 'person:update', description: 'ویرایش شخص' },
        { action: 'person:delete', description: 'حذف شخص' },
        { action: 'people:directory:view', description: 'مشاهده دفترچه همه اشخاص' },
        { action: 'person-contact:manage', description: 'مدیریت راه‌های تماس شخص' },
        { action: 'person-social:manage', description: 'مدیریت شبکه‌های اجتماعی شخص' },
        { action: 'branch:manage', description: 'مدیریت شعب شرکت' },
        { action: 'social-channel:manage', description: 'مدیریت کانال‌های اجتماعی شرکت' },
        { action: 'activity:view', description: 'مشاهده فعالیت‌ها' },
        { action: 'activity:create', description: 'ثبت فعالیت' },
        { action: 'activity:update', description: 'ویرایش فعالیت' },
        { action: 'follow-up:complete', description: 'تکمیل پیگیری' },
        { action: 'follow-up:reschedule', description: 'زمان‌بندی مجدد پیگیری' },
        { action: 'report:view', description: 'مشاهده گزارش‌ها' },
        { action: 'report:advanced-filter', description: 'استفاده از فیلترهای پیشرفته گزارش' },
        { action: 'call-card:view', description: 'مشاهده Call Card' },
        { action: 'call-card:manage', description: 'مدیریت Call Card' },
        { action: 'import:sam', description: 'آپلود و پردازش لیست SAM' },
        { action: 'library:persona:view', description: 'مشاهده کتابخانه پرسونا' },
        { action: 'library:persona:manage', description: 'مدیریت کتابخانه پرسونا' },
        { action: 'library:industry:view', description: 'مشاهده صنایع' },
        { action: 'library:industry:manage', description: 'مدیریت صنایع' },
        { action: 'library:pain-point:view', description: 'مشاهده نقاط درد' },
        { action: 'library:pain-point:manage', description: 'مدیریت نقاط درد' },
        { action: 'library:use-case:view', description: 'مشاهده کاربردها' },
        { action: 'library:use-case:manage', description: 'مدیریت کاربردها' },
        { action: 'library:lead-source:view', description: 'مشاهده منابع جذب' },
        { action: 'library:lead-source:manage', description: 'مدیریت منابع جذب' },
        { action: 'lookup:view', description: 'مشاهده گزینه‌های پایه' },
        { action: 'lookup:manage', description: 'مدیریت گزینه‌های پایه' },
        { action: 'pipeline:config:view', description: 'مشاهده تنظیمات مراحل پایپ‌لاین' },
        { action: 'pipeline:config:manage', description: 'مدیریت مراحل پایپ‌لاین' },
        { action: 'pipeline:transition:view', description: 'مشاهده قوانین انتقال پایپ‌لاین' },
        { action: 'pipeline:transition:manage', description: 'مدیریت قوانین انتقال پایپ‌لاین' },
        { action: 'sso-provider:view', description: 'مشاهده تنظیمات SSO Providerها', },
        { action: 'sso-provider:manage', description: 'مدیریت تنظیمات SSO Providerها', },
        { action: 'session:view', description: 'مشاهده نشست‌های فعال کاربر' },
        { action: 'session:revoke', description: 'لغو نشست‌های فعال کاربر' },
        { action: 'session:manage', description: 'مدیریت نشست‌های کاربران' },
        { action: 'product:view', description: 'مشاهده کاتالوگ محصولات و سرویس‌ها' },
        { action: 'product:manage', description: 'مدیریت کاتالوگ محصولات و سرویس‌ها' },
        { action: 'opportunity-line-item:view', description: 'مشاهده آیتم‌های مالی فرصت فروش' },
        { action: 'opportunity-line-item:manage', description: 'مدیریت آیتم‌های مالی فرصت فروش' },
        { action: 'commercial-document:view', description: 'مشاهده اسناد تجاری فرصت فروش' },
        { action: 'commercial-document:manage', description: 'مدیریت اسناد تجاری فرصت فروش' },
        { action: 'payment:view', description: 'مشاهده پرداخت‌های فرصت فروش' },
        { action: 'payment:manage', description: 'مدیریت پرداخت‌های فرصت فروش' },
        { action: 'attachment:view', description: 'مشاهده فایل‌های پیوست' },
        { action: 'attachment:manage', description: 'مدیریت فایل‌های پیوست' },
    ];
    for (const permission of permissions) {
        await upsertPermission(permission);
    }
    console.log('✅ مجوزها آماده شدند.');
    const allActions = permissions.map((permission) => permission.action);
    const managerActions = [
        'company:view',
        'company:create',
        'company:update',
        'company:archive',
        'company:restore',
        'company:change-owner',
        'company:assign-owner',
        'company:bulk-change-owner',
        'opportunity:view',
        'opportunity:create',
        'opportunity:update',
        'opportunity:change-stage',
        'opportunity:change-owner',
        'opportunity:archive',
        'opportunity:restore',
        'person:view',
        'person:create',
        'person:update',
        'person:delete',
        'people:directory:view',
        'person-contact:manage',
        'person-social:manage',
        'branch:manage',
        'social-channel:manage',
        'activity:view',
        'activity:create',
        'activity:update',
        'follow-up:complete',
        'follow-up:reschedule',
        'report:view',
        'report:advanced-filter',
        'call-card:view',
        'call-card:manage',
        'library:persona:view',
        'library:industry:view',
        'library:pain-point:view',
        'library:use-case:view',
        'library:lead-source:view',
        'lookup:view',
        'session:view',
        'session:revoke',
        'product:view',
        'opportunity-line-item:view',
        'opportunity-line-item:manage',
        'commercial-document:view',
        'commercial-document:manage',
        'payment:view',
        'payment:manage',
        'attachment:view',
        'attachment:manage',
    ];
    const repActions = [
        'company:view',
        'company:create',
        'company:update',
        'opportunity:view',
        'opportunity:create',
        'opportunity:update',
        'opportunity:change-stage',
        'person:view',
        'person:create',
        'person:update',
        'people:directory:view',
        'person-contact:manage',
        'person-social:manage',
        'activity:view',
        'activity:create',
        'activity:update',
        'follow-up:complete',
        'follow-up:reschedule',
        'call-card:view',
        'call-card:manage',
        'library:persona:view',
        'library:industry:view',
        'library:pain-point:view',
        'library:use-case:view',
        'library:lead-source:view',
        'lookup:view',
        'session:view',
        'session:revoke',
        'product:view',
        'opportunity-line-item:view',
        'opportunity-line-item:manage',
        'commercial-document:view',
        'commercial-document:manage',
        'payment:view',
        'payment:manage',
        'attachment:view',
        'attachment:manage',
    ];
    const boardsActions = [
        'report:view',
        'report:advanced-filter',
        'library:persona:view',
        'library:industry:view',
        'library:pain-point:view',
        'library:use-case:view',
        'library:lead-source:view',
        'lookup:view',
        'commercial-document:view',
        'payment:view',
        'attachment:view',
    ];
    await syncRolePermissions(client_1.UserRole.ADMIN, allActions);
    await syncRolePermissions(client_1.UserRole.MANAGER, managerActions);
    await syncRolePermissions(client_1.UserRole.REP, repActions);
    await syncRolePermissions(client_1.UserRole.BOARDS, boardsActions);
    console.log('🎉 Seed کامل شد.');
}
main()
    .catch((error) => {
    console.error('❌ خطا در Seed:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map