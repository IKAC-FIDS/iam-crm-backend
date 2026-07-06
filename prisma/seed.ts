import { PipelineStage, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ============================================================
  // ۱. کاربر ادمین پیش‌فرض
  // ============================================================
  const adminEmail = 'admin@yourcompany.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        fullName: 'مدیر سیستم',
        email: adminEmail,
        passwordHash: await bcrypt.hash('ChangeMe123!', 10),
        role: UserRole.ADMIN,
      },
    });
    console.log(`✅ کاربر ادمین ساخته شد: ${adminEmail} / ChangeMe123!`);
  }

  // ============================================================
  // ۲. کتابخانه Persona (قدیمی)
  // ============================================================
  const personas = [
    { titlePattern: 'CIO', defaultPainPoint: 'استانداردسازی دسترسی، کاهش پیچیدگی IT', defaultUseCase: 'SSO، یکپارچه‌سازی سامانه‌ها', notes: 'مالک اصلی پروژه IAM' },
    { titlePattern: 'CISO', defaultPainPoint: 'ریسک Credential، کنترل دسترسی، Audit', defaultUseCase: 'MFA، کاهش ریسک Credential', notes: 'محرک اصلی MFA و SSO' },
    { titlePattern: 'مدیر IT', defaultPainPoint: 'کاهش Ticket رمز عبور، مدیریت کاربران', defaultUseCase: 'ساده‌سازی ورود', notes: 'اجرای عملیاتی و نیازهای روزمره' },
    { titlePattern: 'مدیر زیرساخت', defaultPainPoint: 'اتصال امن به زیرساخت', defaultUseCase: 'On-premise، Windows Login، شبکه', notes: null },
    { titlePattern: 'مدیرعامل', defaultPainPoint: 'کاهش ریسک سازمانی، کنترل مدیریتی، آمادگی رشد', defaultUseCase: null, notes: 'مهم برای سازمان‌های کوچک‌تر' },
    { titlePattern: 'CFO', defaultPainPoint: 'کاهش هزینه پشتیبانی، کاهش ریسک رخداد امنیتی', defaultUseCase: null, notes: 'بودجه و ROI' },
    { titlePattern: 'مدیر منابع انسانی', defaultPainPoint: 'ورود و خروج کارکنان، تغییر نقش، کنترل دسترسی داخلی', defaultUseCase: null, notes: null },
    { titlePattern: 'مدیر تدارکات', defaultPainPoint: 'مسیر خرید، مستندات، RFP، شرایط تامین', defaultUseCase: null, notes: null },
    { titlePattern: 'مدیر حراست', defaultPainPoint: 'کنترل کاربران، ممیزی', defaultUseCase: null, notes: 'در سازمان‌های دولتی و حساس' },
    { titlePattern: 'مدیر تحول دیجیتال', defaultPainPoint: 'معماری آینده، پروژه‌های جدید', defaultUseCase: null, notes: null },
  ];

  for (const persona of personas) {
    const existing = await prisma.personaLibrary.findFirst({
      where: { titlePattern: persona.titlePattern },
    });
    if (!existing) {
      await prisma.personaLibrary.create({ data: persona });
    }
  }

  // ============================================================
  // ۳. داده‌های نمونه برای Pain Points و Use Cases
  // ============================================================
  // ۳.۱. ایجاد Pain Points
  const painPointData = [
    { title: 'مدیریت کاربران در خطوط تولید', description: 'نیروی انسانی زیاد با دسترسی‌های متنوع و نیاز به کنترل امنیتی', category: 'امنیت' },
    { title: 'مدیریت دسترسی پیمانکاران و تأمین‌کنندگان', description: 'دسترسی موقت و کنترل‌شده برای نیروهای خارج از سازمان', category: 'مدیریت' },
    { title: 'یکپارچه‌سازی سامانه‌های داخلی', description: 'اتصال سامانه‌های مختلف و مدیریت یکپارچه کاربران', category: 'فنی' },
    { title: 'کاهش هزینه‌های پشتیبانی IT', description: 'کاهش Ticketهای پشتیبانی مرتبط با رمز عبور و دسترسی', category: 'هزینه' },
    { title: 'تطابق با قوانین و استانداردها (Compliance)', description: 'نیاز به رعایت استانداردهای امنیتی و حریم خصوصی', category: 'قانونی' },
  ];

  const painPointIds: string[] = [];
  for (const pp of painPointData) {
    const existing = await prisma.painPoint.findFirst({
      where: { title: pp.title },
    });
    if (!existing) {
      const created = await prisma.painPoint.create({ data: pp });
      painPointIds.push(created.id);
      console.log(`✅ Pain Point ایجاد شد: ${pp.title}`);
    } else {
      painPointIds.push(existing.id);
    }
  }

  // ۳.۲. ایجاد Use Cases
  const useCaseData = [
    { title: 'پیاده‌سازی SSO (Single Sign-On)', description: 'یکپارچه‌سازی سامانه‌های داخلی و خارجی با پروتکل‌های SAML و OIDC', category: 'SSO' },
    { title: 'MFA (Multi-Factor Authentication)', description: 'احراز هویت چندعاملی برای افزایش امنیت دسترسی', category: 'MFA' },
    { title: 'Passwordless Authentication', description: 'حذف رمز عبور و استفاده از روش‌های بیومتریک یا توکن', category: 'امنیت' },
    { title: 'Identity Governance & Administration', description: 'مدیریت چرخه حیات هویت و دسترسی‌ها', category: 'Governance' },
    { title: 'Secure File Exchange', description: 'تبادل امن فایل‌ها بین کاربران و سازمان‌ها', category: 'امنیت' },
  ];

  const useCaseIds: string[] = [];
  for (const uc of useCaseData) {
    const existing = await prisma.useCase.findFirst({
      where: { title: uc.title },
    });
    if (!existing) {
      const created = await prisma.useCase.create({ data: uc });
      useCaseIds.push(created.id);
      console.log(`✅ Use Case ایجاد شد: ${uc.title}`);
    } else {
      useCaseIds.push(existing.id);
    }
  }

  // ============================================================
  // ۴. ایجاد صنایع نمونه با ارتباط با Pain Points و Use Cases
  // ============================================================
  const industryData = [
    { name: 'خودروسازی', description: 'صنایع تولیدی خودرو و قطعات', painPointTitles: ['مدیریت کاربران در خطوط تولید', 'مدیریت دسترسی پیمانکاران و تأمین‌کنندگان'], useCaseTitles: ['پیاده‌سازی SSO', 'MFA'] },
    { name: 'بانکداری دیجیتال', description: 'بانک‌های آنلاین و نئوبانک‌ها', painPointTitles: ['تطابق با قوانین و استانداردها', 'یکپارچه‌سازی سامانه‌های داخلی'], useCaseTitles: ['MFA', 'Identity Governance & Administration'] },
    { name: 'نفت و گاز', description: 'شرکت‌های پتروشیمی و پالایشگاهی', painPointTitles: ['مدیریت کاربران در خطوط تولید', 'تطابق با قوانین و استانداردها'], useCaseTitles: ['Secure File Exchange', 'MFA'] },
  ];

  for (const ind of industryData) {
    const existingIndustry = await prisma.industry.findUnique({
      where: { name: ind.name },
    });
    if (!existingIndustry) {
      // پیدا کردن شناسه‌های Pain Points و Use Cases بر اساس عنوان
      const selectedPainPointIds = await Promise.all(
        ind.painPointTitles.map(async (title) => {
          const pp = await prisma.painPoint.findFirst({ where: { title } });
          return pp?.id;
        })
      );
      const selectedUseCaseIds = await Promise.all(
        ind.useCaseTitles.map(async (title) => {
          const uc = await prisma.useCase.findFirst({ where: { title } });
          return uc?.id;
        })
      );

      await prisma.industry.create({
        data: {
          name: ind.name,
          description: ind.description,
          painPoints: {
            create: selectedPainPointIds
              .filter((id): id is string => !!id)
              .map((id) => ({ painPointId: id })),
          },
          useCases: {
            create: selectedUseCaseIds
              .filter((id): id is string => !!id)
              .map((id) => ({ useCaseId: id })),
          },
        },
      });
      console.log(`✅ صنعت ایجاد شد: ${ind.name}`);
    }
  }

  // ============================================================
  // ۵. دسترسی‌های اولیه (Policy)
  // ============================================================
  const stageConfigs = [
    [PipelineStage.LEAD, 'سرنخ'],
    [PipelineStage.CONTACTED, 'تماس گرفته شده'],
    [PipelineStage.INTERESTED, 'علاقه‌مند'],
    [PipelineStage.QUALIFIED, 'واجد شرایط'],
    [PipelineStage.NEEDS_ASSESSMENT, 'نیازسنجی'],
    [PipelineStage.PENDING_PRE_INVOICE_APPROVAL, 'در انتظار تأیید پیش‌فاکتور'],
    [PipelineStage.POC_PILOT_SCHEDULED, 'پایلوت زمان‌بندی شده'],
    [PipelineStage.POC_PILOT_IN_PROGRESS, 'پایلوت در حال اجرا'],
    [PipelineStage.PENDING_POC_PILOT_APPROVAL, 'در انتظار تأیید پایلوت'],
    [PipelineStage.PENDING_PAYMENT_INVOICE_APPROVAL, 'در انتظار تأیید فاکتور پرداخت'],
    [PipelineStage.INSTALLATION_SCHEDULED, 'نصب زمان‌بندی شده'],
    [PipelineStage.INSTALLATION_IN_PROGRESS, 'نصب در حال اجرا'],
    [PipelineStage.PENDING_CUSTOMER_ACCEPTANCE, 'در انتظار پذیرش مشتری'],
    [PipelineStage.DONE, 'انجام شده'],
    [PipelineStage.ON_HOLD, 'متوقف شده'],
    [PipelineStage.LOST, 'از دست رفته'],
    [PipelineStage.NO_RESPONSE, 'بدون پاسخ'],
  ] as const;

  for (const [sortOrder, [stage, label]] of stageConfigs.entries()) {
    await prisma.pipelineStageConfig.upsert({
      where: { stage },
      update: {},
      create: {
        stage,
        label,
        sortOrder,
        isActive: true,
        isTerminal: stage === PipelineStage.DONE || stage === PipelineStage.LOST || stage === PipelineStage.NO_RESPONSE,
      },
    });
  }

  const defaultTransitions: Array<[PipelineStage, PipelineStage]> = [
    [PipelineStage.LEAD, PipelineStage.CONTACTED],
    [PipelineStage.CONTACTED, PipelineStage.INTERESTED],
    [PipelineStage.CONTACTED, PipelineStage.NO_RESPONSE],
    [PipelineStage.INTERESTED, PipelineStage.QUALIFIED],
    [PipelineStage.QUALIFIED, PipelineStage.NEEDS_ASSESSMENT],
    [PipelineStage.NEEDS_ASSESSMENT, PipelineStage.PENDING_PRE_INVOICE_APPROVAL],
    [PipelineStage.PENDING_PRE_INVOICE_APPROVAL, PipelineStage.POC_PILOT_SCHEDULED],
    [PipelineStage.POC_PILOT_SCHEDULED, PipelineStage.POC_PILOT_IN_PROGRESS],
    [PipelineStage.POC_PILOT_IN_PROGRESS, PipelineStage.PENDING_POC_PILOT_APPROVAL],
    [PipelineStage.PENDING_POC_PILOT_APPROVAL, PipelineStage.PENDING_PAYMENT_INVOICE_APPROVAL],
    [PipelineStage.PENDING_PAYMENT_INVOICE_APPROVAL, PipelineStage.INSTALLATION_SCHEDULED],
    [PipelineStage.INSTALLATION_SCHEDULED, PipelineStage.INSTALLATION_IN_PROGRESS],
    [PipelineStage.INSTALLATION_IN_PROGRESS, PipelineStage.PENDING_CUSTOMER_ACCEPTANCE],
    [PipelineStage.PENDING_CUSTOMER_ACCEPTANCE, PipelineStage.DONE],
    [PipelineStage.ON_HOLD, PipelineStage.CONTACTED],
  ];

  for (const [fromStage, toStage] of defaultTransitions) {
    const existing = await prisma.pipelineStageTransition.findFirst({ where: { fromStage, toStage, role: null } });
    if (!existing) {
      await prisma.pipelineStageTransition.create({ data: { fromStage, toStage, role: null, isAllowed: true } });
    }
  }

  const permissions = [
    // ... (همان دسترسی‌های قبلی)
    { action: 'user:create', description: 'ایجاد کاربر جدید' },
    { action: 'user:view', description: 'مشاهده لیست کاربران' },
    { action: 'user:manage', description: 'Manage users' },
    { action: 'permission:view', description: 'View permission matrix' },
    { action: 'permission:manage', description: 'Manage role permissions' },
    { action: 'user:deactivate', description: 'غیرفعال کردن کاربر' },
    { action: 'user:activate', description: 'فعال‌سازی مجدد کاربر' },
    { action: 'company:view', description: 'مشاهده شرکت‌ها' },
    { action: 'company:create', description: 'ایجاد شرکت جدید' },
    { action: 'company:update', description: 'ویرایش شرکت' },
    { action: 'company:delete', description: 'حذف شرکت' },
    { action: 'company:change-stage', description: 'تغییر مرحله پایپ‌لاین' },
    { action: 'company:change-owner', description: 'تغییر مالکیت شرکت' },
    { action: 'company:assign-owner', description: 'View eligible company owners' },
    { action: 'company:bulk-change-owner', description: 'تغییر مالکیت گروهی' },
    { action: 'import:sam', description: 'آپلود لیست SAM' },
    { action: 'library:persona:manage', description: 'مدیریت کتابخانه Persona' },
    { action: 'library:persona:view', description: 'مشاهده کتابخانه Persona' },
    // دسترسی‌های جدید برای کتابخانه‌های ماژولار
    { action: 'library:industry:view', description: 'مشاهده صنایع' },
    { action: 'library:industry:manage', description: 'مدیریت صنایع' },
    { action: 'library:pain-point:view', description: 'مشاهده نقاط درد' },
    { action: 'library:pain-point:manage', description: 'مدیریت نقاط درد' },
    { action: 'library:use-case:view', description: 'مشاهده کاربردها' },
    { action: 'library:use-case:manage', description: 'مدیریت کاربردها' },
    { action: 'library:lead-source:view', description: 'View lead sources' },
    { action: 'library:lead-source:manage', description: 'Manage lead sources' },
    { action: 'lookup:view', description: 'View lookup options' },
    { action: 'lookup:manage', description: 'Manage lookup options' },
    { action: 'pipeline:config:view', description: 'View pipeline stage configuration' },
    { action: 'pipeline:config:manage', description: 'Manage pipeline stage configuration' },
    { action: 'pipeline:transition:view', description: 'View pipeline transition rules' },
    { action: 'pipeline:transition:manage', description: 'Manage pipeline transition rules' },
    // دسترسی‌های قدیمی صنعت (برای سازگاری - می‌توان حذف کرد)
    // { action: 'library:industry:manage', description: 'مدیریت کتابخانه صنعت' },
    // { action: 'library:industry:view', description: 'مشاهده کتابخانه صنعت' },
    { action: 'report:view', description: 'مشاهده گزارش‌ها' },
    { action: 'report:advanced-filter', description: 'Use advanced report filters' },
    { action: 'call-card:view', description: 'مشاهده Call Card' },
    { action: 'call-card:manage', description: 'مدیریت Call Card' },
    { action: 'activity:view', description: 'مشاهده فعالیت‌ها' },
    { action: 'activity:create', description: 'ثبت فعالیت جدید' },
    { action: 'activity:update', description: 'ویرایش فعالیت' },
    { action: 'follow-up:complete', description: 'تکمیل پیگیری' },
    { action: 'follow-up:reschedule', description: 'زمان‌بندی مجدد پیگیری' },
    { action: 'person:view', description: 'مشاهده مخاطبین' },
    { action: 'people:directory:view', description: 'View people directory' },
    { action: 'person:create', description: 'ایجاد مخاطب جدید' },
    { action: 'person:update', description: 'ویرایش مخاطب' },
    { action: 'person:delete', description: 'حذف مخاطب' },
    { action: 'branch:manage', description: 'مدیریت شعب' },
    { action: 'social-channel:manage', description: 'مدیریت کانال‌های اجتماعی' },
  ];

  // ایجاد Permissions
  for (const perm of permissions) {
    const existing = await prisma.permission.findUnique({
      where: { action: perm.action },
    });
    if (!existing) {
      await prisma.permission.create({ data: perm });
      console.log(`✅ Permission ایجاد شد: ${perm.action}`);
    }
  }

  // اختصاص دسترسی‌ها به نقش‌ها
  const rolePermissions = [
    { role: UserRole.ADMIN, actions: permissions.map(p => p.action) },
    {
      role: UserRole.MANAGER,
      actions: [
        'company:view',
        'company:create',
        'company:update',
        'company:change-stage',
        'company:change-owner',
        'company:assign-owner',
        'company:bulk-change-owner',
        'report:view',
        'report:advanced-filter',
        'call-card:view',
        'call-card:manage',
        'activity:view',
        'activity:create',
        'activity:update',
        'follow-up:complete',
        'follow-up:reschedule',
        'person:view',
        'people:directory:view',
        'person:create',
        'person:update',
        'library:persona:view',
        'library:industry:view',
        'library:pain-point:view',
        'library:use-case:view',
        'library:lead-source:view',
        'lookup:view',
        'branch:manage',
        'social-channel:manage',
      ],
    },
    {
      role: UserRole.REP,
      actions: [
        'company:view',
        'company:create',
        'company:update',
        'company:change-stage',
        'call-card:view',
        'call-card:manage',
        'activity:view',
        'activity:create',
        'activity:update',
        'follow-up:complete',
        'follow-up:reschedule',
        'person:view',
        'people:directory:view',
        'person:create',
        'person:update',
        // فقط مشاهده کتابخانه‌ها
        'library:persona:view',
        'library:industry:view',
        'library:pain-point:view',
        'library:use-case:view',
        'library:lead-source:view',
        'lookup:view',
      ],
    },
    {
      role: UserRole.BOARDS,
      actions: [
        'report:view',
        'report:advanced-filter',
        'library:persona:view',
        'library:industry:view',
        'library:pain-point:view',
        'library:use-case:view',
        'library:lead-source:view',
        'lookup:view',
        // سایر دسترسی‌ها را ندارد
      ],
    },
  ];

  for (const rp of rolePermissions) {
    for (const action of rp.actions) {
      const permission = await prisma.permission.findUnique({
        where: { action },
      });
      if (!permission) continue;

      const existing = await prisma.rolePermission.findUnique({
        where: {
          role_permissionId: {
            role: rp.role,
            permissionId: permission.id,
          },
        },
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            role: rp.role,
            permissionId: permission.id,
          },
        });
        console.log(`✅ ${rp.role} -> ${action}`);
      }
    }
  }

  console.log('🎉 Seed کامل شد.');
}

main()
  .catch((e) => {
    console.error('❌ خطا در Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
