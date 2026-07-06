# 🚀 IAM CRM Backend

**بک‌اند سیستم مدیریت فرآیند فروش IAM** – ابزاری جامع برای تیم‌های فروش B2B: از وارد کردن لیست SAM (Service Addressable Market) و تحقیق شرکت/شخص، تا مدیریت پایپ‌لاین فروش (Kanban)، ثبت تماس‌های هوشمند (Call Card) و گزارش‌گیری تحلیلی.

سیستم با **NestJS**، **PostgreSQL** و **Prisma** ساخته شده و برای اجرا روی سرورهای داخلی (On-Premise) با **Docker** بهینه شده است.

---

## 🎯 هدف هر سرویس (Business Goals)

| سرویس | هدف و کاربرد اصلی |
|-------|-------------------|
| **Auth** | احراز هویت کاربران و صدور توکن JWT. نقطه‌ی ورود امن به سیستم. |
| **Users** | مدیریت کاربران (فروشنده، مدیر فروش، ادمین، کاربر گزارش‌گیر). فقط ادمین می‌تواند کاربر ایجاد/غیرفعال کند. |
| **Companies** | **هسته‌ی سیستم**: مدیریت شرکت‌ها (لیدها)، تغییر مرحله در پایپ‌لاین فروش با ثبت تاریخچه، تغییر مالکیت (اختصاص به فروشنده). |
| **People** | مدیریت مخاطبین هر شرکت (افراد کلیدی، سمت‌ها، اطلاعات تماس). امکان ثبت چند شماره/ایمیل و شبکه‌های اجتماعی. |
| **Activities** | ثبت تمام تعاملات با شرکت/مخاطب (تماس، ایمیل، پیام لینکدین، جلسه، یادداشت). مدیریت یادآوری‌های سررسید (Follow-up). |
| **Call Cards** | **کارت تماس استراتژیک**: یک سند زنده برای هر شرکت که شامل زاویه‌ی ورود، نقاط درد، کاربرد محصول، سوالات اکتشافی، اعتراضات و پاسخ‌ها است. به فروشنده در آماده‌سازی و اجرای تماس‌های حرفه‌ای کمک می‌کند. |
| **Persona Library** | کتابخانه‌ی سمت‌های سازمانی (مثل CIO، CISO، مدیر IT). به فروشنده می‌گوید هر سمت معمولاً چه چالش‌هایی دارد و چه راه‌حلی برای او جذاب است. مدیریت آن فقط با ادمین است. |
| **Industry Playbook** (جدید: Industries + PainPoints + UseCases) | **کتابخانه‌ی صنایع**: هر صنعت (بانک، خودروسازی، بیمه، ...) نقاط درد و کاربردهای خاص خود را دارد. این سرویس به فروشنده کمک می‌کند بر اساس نوع شرکت، پیشنهادات مناسبی برای تماس آماده کند. |
| **Import SAM List** | وارد کردن گروهی لیست شرکت‌ها از فایل Excel. ادمین می‌تواند صدها شرکت را یکجا ایجاد کند و سپس آنها را بین فروشنده‌ها توزیع کند. |
| **Company Branches** | مدیریت شعب یک شرکت (دفاتر مرکزی، شعبات شهرستان‌ها، آدرس و تلفن). |
| **Company Social Channels** | مدیریت کانال‌های اجتماعی شرکت (لینکدین، اینستاگرام، تلگرام، وبسایت). |
| **Reports** | **داشبورد تحلیلی**: نرخ تبدیل بین مراحل پایپ‌لاین، میانگین زمان ماندگاری در هر مرحله، خلاصه وضعیت پایپ‌لاین و گزارش فعالیت‌ها در بازه‌های زمانی مختلف. |
| **Admin Permissions (Policy)** | **سیستم مدیریت دسترسی پویا**: ادمین می‌تواند بدون تغییر کد، دسترسی‌های هر نقش (ADMIN, MANAGER, REP, BOARDS) را به‌صورت دقیق مدیریت کند. |

---

## ✨ قابلیت‌های کلیدی

- **مدیریت کامل پایپ‌لاین فروش**: ۱۷ مرحله از LEAD تا DONE با تاریخچه‌ی تغییرات
- **Call Card هوشمند**: پیشنهاد خودکار Pain Point و Use Case بر اساس سمت مخاطب و صنعت شرکت
- **مدیریت مخاطبین پیشرفته**: ثبت چند شماره تماس، چند ایمیل و چند شبکه‌ی اجتماعی برای هر فرد
- **گزارش‌گیری تحلیلی**: نرخ تبدیل، میانگین زمان مراحل، خلاصه پایپ‌لاین
- **Import گروهی از Excel**: ورود صدها شرکت در یک بار آپلود
- **سیستم دسترسی‌های پویا (Policy)**: مدیریت نقش‌ها و دسترسی‌ها در پنل ادمین بدون نیاز به تغییر کد
- **امنیت بالا**: JWT، Rate Limiting، اعتبارسنجی محیط، ایندکس‌های دیتابیس

---

## 🚀 اجرای سریع با Docker (پیشنهادی برای سرور داخلی)

```bash
docker compose up -d --build
```

این دستور:
1. یک دیتابیس PostgreSQL بالا می‌آورد
2. اپلیکیشن را build می‌کند
3. مایگریشن‌های دیتابیس را اجرا می‌کند
4. API را روی پورت 3000 بالا می‌آورد

بعد از بالا آمدن، برای پر کردن کتابخانه‌ها و ساخت کاربر ادمین اولیه:

```bash
docker compose exec api npm run seed
```

کاربر ادمین پیش‌فرض: `admin@yourcompany.com` / `ChangeMe123!` — حتماً بلافاصله بعد از اولین ورود عوض کنید.

---

## 💻 اجرای محلی برای توسعه

```bash
cp .env.example .env
# مقادیر DATABASE_URL و JWT_SECRET را در .env تنظیم کنید

npm install
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

API روی `http://localhost:3000/api` در دسترس است.

---

## 📂 ساختار پروژه (ماژول‌های اصلی)

```
prisma/
├── schema.prisma          مدل کامل دیتابیس (شامل مدل‌های جدید Industry, PainPoint, UseCase)
├── seed.ts                داده‌های اولیه (ادمین، Persona، Industry، PainPoint، UseCase، دسترسی‌ها)
└── migrations/            فایل‌های Migration

src/
├── auth/                  احراز هویت JWT (ورود، صدور توکن)
├── users/                 مدیریت کاربران (فقط ادمین)
├── companies/             مدیریت شرکت‌ها، پایپ‌لاین، تاریخچه، تغییر مالکیت
├── people/                مدیریت مخاطبین (با قابلیت چند شماره/ایمیل/شبکه اجتماعی)
├── activities/            ثبت فعالیت‌ها و یادآوری‌های سررسید
├── call-cards/            Call Card (کارت تماس استراتژیک) + پیشنهاد خودکار
├── persona-library/       کتابخانه سمت‌ها (CIO, CISO, ...)
├── industries/            **جدید**: مدیریت صنایع (با ارتباط Many-to-Many)
├── pain-points/           **جدید**: مدیریت نقاط درد (قابل استفاده مجدد)
├── use-cases/             **جدید**: مدیریت کاربردها (قابل استفاده مجدد)
├── import/                Import گروهی از Excel (SAM List)
├── company-branches/      مدیریت شعب شرکت‌ها
├── company-social-channels/ مدیریت کانال‌های اجتماعی شرکت‌ها
├── reports/               گزارش‌گیری (نرخ تبدیل، میانگین زمان، خلاصه پایپ‌لاین)
├── admin/                 مدیریت دسترسی‌های پویا (Policy) – فقط ادمین
├── common/                گاردها، دکوراتورها، DTOهای مشترک، اعتبارسنجی‌ها
└── app.module.ts          ماژول اصلی
```

---

## 🛡️ سیستم دسترسی‌ها (Policy)

سیستم دسترسی‌ها به‌صورت **پویا** طراحی شده و قابل مدیریت در پنل ادمین است.

### نقش‌های تعریف‌شده

| نقش | توضیح |
|-----|-------|
| **ADMIN** | دسترسی کامل به همه بخش‌ها (مدیریت کاربران، کتابخانه‌ها، دسترسی‌ها، تنظیمات) |
| **MANAGER** | مدیریت شرکت‌های تیم خود، مشاهده گزارش‌ها، مدیریت Call Card و فعالیت‌ها |
| **REP** | مدیریت شرکت‌های خود، ثبت فعالیت‌ها و Call Card، مشاهده مخاطبین |
| **BOARDS** | فقط مشاهده گزارش‌ها و داشبورد (بدون دسترسی به مدیریت شرکت‌ها و کاربران) |

### لیست دسترسی‌های اصلی

| دسترسی | توضیح |
|--------|-------|
| `user:create`, `user:view`, `user:deactivate`, `user:activate` | مدیریت کاربران |
| `company:view`, `create`, `update`, `delete`, `change-stage`, `change-owner`, `bulk-change-owner` | مدیریت شرکت‌ها |
| `person:view`, `create`, `update`, `delete` | مدیریت مخاطبین |
| `activity:view`, `create` | مدیریت فعالیت‌ها |
| `call-card:view`, `manage` | مدیریت Call Card |
| `report:view` | مشاهده گزارش‌ها |
| `import:sam` | آپلود لیست SAM |
| `library:persona:view`, `manage` | کتابخانه Persona |
| `library:industry:view`, `manage` | کتابخانه صنعت (مدل جدید) |
| `library:pain-point:view`, `manage` | مدیریت نقاط درد |
| `library:use-case:view`, `manage` | مدیریت کاربردها |
| `branch:manage` | مدیریت شعب |
| `social-channel:manage` | مدیریت کانال‌های اجتماعی |

---

## 🌐 مسیرهای API (خلاصه)

| Method | Path | توضیح |
|--------|------|-------|
| `POST` | `/api/auth/login` | ورود و دریافت JWT |
| `GET/POST` | `/api/users` | لیست/ایجاد کاربر (فقط ADMIN) |
| `GET/PATCH` | `/api/users/:id` | مشاهده/غیرفعال‌سازی کاربر |
| `GET/POST` | `/api/companies` | لیست/ساخت شرکت (با صفحه‌بندی) |
| `GET/PATCH` | `/api/companies/:id` | مشاهده/ویرایش شرکت |
| `PATCH` | `/api/companies/:id/stage` | تغییر مرحله پایپ‌لاین |
| `PATCH` | `/api/companies/:id/owner` | تغییر مالکیت شرکت |
| `PATCH` | `/api/companies/bulk/owner` | تغییر مالکیت گروهی |
| `GET/POST` | `/api/people?companyId=` | لیست/ساخت مخاطبین (با صفحه‌بندی) |
| `GET/PATCH/DELETE` | `/api/people/:id` | مشاهده/ویرایش/حذف مخاطب |
| `GET/POST` | `/api/activities?companyId=` | لیست/ساخت فعالیت‌ها (با صفحه‌بندی) |
| `GET` | `/api/activities/follow-ups/due` | یادآوری‌های سررسید کاربر جاری |
| `GET/PUT` | `/api/companies/:companyId/call-card` | مشاهده/ایجاد Call Card |
| `GET` | `/api/companies/:companyId/call-card/suggest` | پیشنهاد خودکار Pain Point/Use Case |
| `GET/POST` | `/api/persona-library` | لیست/ساخت Persona (نوشتن فقط ADMIN) |
| `GET/POST` | `/api/industries` | لیست/ساخت صنایع (مدیریت فقط ADMIN) |
| `GET/POST` | `/api/pain-points` | لیست/ساخت نقاط درد (مدیریت فقط ADMIN) |
| `GET/POST` | `/api/use-cases` | لیست/ساخت کاربردها (مدیریت فقط ADMIN) |
| `POST` | `/api/import/sam` | آپلود Excel و Import گروهی (فقط ADMIN) |
| `GET` | `/api/reports/conversion-rates` | نرخ تبدیل بین مراحل |
| `GET` | `/api/reports/stage-durations` | میانگین زمان ماندگاری در هر مرحله |
| `GET` | `/api/reports/pipeline-summary` | خلاصه وضعیت پایپ‌لاین |
| `GET` | `/api/reports/activities` | گزارش فعالیت‌ها در بازه زمانی |
| `GET/POST` | `/api/admin/permissions` | مدیریت دسترسی‌ها (فقط ADMIN) |

---

## 🧪 Import SAM List (ورود گروهی از Excel)

### آپلود فایل

```http
POST /api/import/sam
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data
Body: form-data → Key: file (Type: File)
```

### ستون‌های قابل‌شناسایی در فایل Excel

| نام ستون فارسی | نام ستون انگلیسی |
|----------------|------------------|
| نام شرکت | legalName |
| نام تجاری | brandName |
| صنعت | industry |
| وبسایت | website |
| شهر | headOfficeCity |
| اولویت | priority |
| نام مخاطب | personName |
| سمت | title |
| ایمیل | email |
| تلفن | phone |
| نقش (Persona) | personaTag |

---

## 🔐 امنیت و بهینه‌سازی

- **JWT** با طول عمر ۸ ساعت و `JWT_SECRET` حداقل ۳۲ کاراکتر
- **Rate Limiting**: ۱۰۰ درخواست در ۶۰ ثانیه (برای لاگین: ۵ درخواست)
- **اعتبارسنجی محیط** در زمان استارت (با Joi)
- **ایندکس‌های دیتابیس** روی فیلدهای پرکاربرد برای بهبود عملکرد
- **سیستم کش** برای دسترسی‌های هر نقش (TTL: ۱۰ دقیقه)

---

## 📦 وابستگی‌های اصلی

| کتابخانه | کاربرد |
|----------|--------|
| NestJS 10 | فریم‌ورک اصلی |
| Prisma 5 | ORM و مدیریت دیتابیس |
| PostgreSQL 16 | دیتابیس اصلی |
| JWT + Passport | احراز هویت |
| class-validator | اعتبارسنجی داده‌ها |
| multer + xlsx | آپلود و پردازش Excel |
| @nestjs/throttler | Rate Limiting |
| joi | اعتبارسنجی محیط |
| node-cache | کش دسترسی‌ها |

---

## 🔜 چیزهایی که هنوز ساخته نشده (فاز بعدی)

- [ ] فرانت‌اند (React) برای فرم‌های Research، Kanban و داشبورد
- [ ] داشبورد تخصصی با نمودارهای پیشرفته
- [ ] سیستم اعلان (Email/Push) برای یادآوری‌های سررسید
- [ ] خروجی گرفتن از داده‌ها به صورت Excel/PDF
- [ ] تست‌های واحد و یکپارچه‌سازی (Unit / Integration / E2E Tests)
- [ ] مستندات Swagger (OpenAPI) برای تست و توسعه‌ی فرانت‌اند

---

**ساخته‌شده با ❤️ برای تیم فروش IAM**

---

## Change log

### fix 000001 - Activity lifecycle backend

- Added activity editing through `PATCH /api/activities/:activityId` with company-scope access checks and protection for `STAGE_CHANGE` records.
- Added follow-up completion and rescheduling endpoints.
- Added completion metadata (`completedAt`, `completedById`, and `completionNote`) with a Prisma migration.
- Excluded completed follow-ups from the due list; future reschedules naturally leave the due list.
- Added DTO validation, safe empty-string normalization, and the `activity:update`, `follow-up:complete`, and `follow-up:reschedule` permissions for ADMIN, MANAGER, and REP.

### fix 000002 - Advanced report filters backend

- Added a shared validated report-filter DTO with comma-separated UUID and enum lists.
- Added owner, team, stage, priority, industry, source, company, user, date-range, and activity-type filters to the relevant reports.
- Added `GET /api/reports/activities/by-user`, `GET /api/reports/pipeline/by-owner`, and `GET /api/reports/filter-options`.
- Applied data visibility consistently: ADMIN and BOARDS can report across all data, MANAGER is limited to the manager's team, and REP is limited to the rep's own scope when granted `report:view`.
- Preserved existing unfiltered report response shapes and the activity report's default 30-day range.
