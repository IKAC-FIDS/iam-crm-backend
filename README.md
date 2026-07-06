# 🚀 IAM CRM Backend

**Backend for the IAM Sales Process Management System** – a comprehensive tool for B2B sales teams: from importing SAM (Service Addressable Market) lists and company/person research, to sales pipeline management (Kanban), smart call logging (Call Card), and analytical reporting.

The system is built with **NestJS**, **PostgreSQL**, and **Prisma**, and is optimized for deployment on internal/on-premise servers using **Docker**.

---

## 🎯 Service Goals (Business Goals)

| Service | Main Goal and Use Case |
|---------|-------------------------|
| **Auth** | User authentication and JWT token issuance. The secure entry point to the system. |
| **Users** | User management (sales rep, sales manager, admin, reporting user). Only admins can create or deactivate users. |
| **Companies** | **Core of the system**: company/lead management, sales pipeline stage changes with history tracking, and ownership changes/assignment to sales reps. |
| **People** | Management of each company's contacts, including key people, titles, and contact information. Supports multiple phone numbers, emails, and social networks. |
| **Activities** | Recording all interactions with a company/contact, including calls, emails, LinkedIn messages, meetings, and notes. Also manages due follow-up reminders. |
| **Call Cards** | **Strategic call card**: a living document for each company that includes the entry angle, pain points, product use cases, discovery questions, objections, and responses. It helps sales reps prepare for and run professional calls. |
| **Persona Library** | A library of organizational roles/personas such as CIO, CISO, and IT Manager. It tells the sales rep what challenges each role usually has and what solution is attractive to that role. Only admins can manage it. |
| **Industry Playbook** (new: Industries + PainPoints + UseCases) | **Industry library**: each industry, such as banking, automotive, insurance, and others, has its own pain points and use cases. This service helps the sales rep prepare relevant suggestions for calls based on the company's industry. |
| **Import SAM List** | Bulk import of company lists from Excel files. Admins can create hundreds of companies at once and then distribute them among sales reps. |
| **Company Branches** | Management of a company's branches, including headquarters, regional offices, addresses, and phone numbers. |
| **Company Social Channels** | Management of company social channels such as LinkedIn, Instagram, Telegram, and website. |
| **Reports** | **Analytical dashboard**: conversion rates between pipeline stages, average time spent in each stage, pipeline status summary, and activity reports across different date ranges. |
| **Admin Permissions (Policy)** | **Dynamic access-control system**: admins can manage the permissions of each role (ADMIN, MANAGER, REP, BOARDS) precisely without changing code. |

---

## ✨ Key Features

- **Full sales pipeline management**: 17 stages from LEAD to DONE, with stage-change history
- **Smart Call Card**: automatic Pain Point and Use Case suggestions based on contact persona and company industry
- **Advanced contact management**: multiple phone numbers, emails, and social networks per person
- **Analytical reporting**: conversion rates, average stage duration, pipeline summary
- **Bulk import from Excel**: import hundreds of companies in a single upload
- **Dynamic permission system (Policy)**: manage roles and permissions from the admin panel without code changes
- **High security**: JWT, rate limiting, environment validation, and database indexes

---

## 🚀 Quick Start with Docker (Recommended for Internal Servers)

```bash
docker compose up -d --build
```

This command:

1. Starts a PostgreSQL database
2. Builds the application
3. Runs database migrations
4. Starts the API on port 3000

After the services are up, run the following command to populate libraries and create the initial admin user:

```bash
docker compose exec api npm run seed
```

Default admin user: `admin@yourcompany.com` / `ChangeMe123!` — make sure to change it immediately after the first login.

---

## 💻 Local Development Setup

```bash
cp .env.example .env
# Configure DATABASE_URL and JWT_SECRET in .env

npm install
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

The API will be available at `http://localhost:3000/api`.

---

## 📂 Project Structure (Main Modules)

```
prisma/
├── schema.prisma          Complete database model, including the new Industry, PainPoint, and UseCase models
├── seed.ts                Initial data: admin, Persona, Industry, PainPoint, UseCase, and permissions
└── migrations/            Migration files

src/
├── auth/                  JWT authentication: login and token issuance
├── users/                 User management, admin-only
├── companies/             Company management, pipeline, history, and ownership changes
├── people/                Contact management with multiple phones/emails/social networks
├── activities/            Activity logging and due follow-up reminders
├── call-cards/            Call Card: strategic call card + automatic suggestions
├── persona-library/       Persona library: CIO, CISO, and others
├── industries/            New: industry management with many-to-many relations
├── pain-points/           New: reusable pain point management
├── use-cases/             New: reusable use case management
├── import/                Bulk import from Excel: SAM List
├── company-branches/      Company branch management
├── company-social-channels/ Company social channel management
├── reports/               Reporting: conversion rate, average stage duration, pipeline summary
├── admin/                 Dynamic permission management: Policy, admin-only
├── common/                Guards, decorators, shared DTOs, and validations
└── app.module.ts          Main module
```

---

## 🛡️ Permission System (Policy)

The permission system is designed to be **dynamic** and manageable from the admin panel.

### Defined Roles

| Role | Description |
|------|-------------|
| **ADMIN** | Full access to all sections, including user management, libraries, permissions, and settings |
| **MANAGER** | Manages companies belonging to their own team, views reports, and manages Call Cards and activities |
| **REP** | Manages their own companies, records activities and Call Cards, and views contacts |
| **BOARDS** | Read-only access to reports and dashboards, without access to company or user management |

### Main Permission List

| Permission | Description |
|------------|-------------|
| `user:create`, `user:view`, `user:deactivate`, `user:activate` | User management |
| `company:view`, `create`, `update`, `delete`, `change-stage`, `change-owner`, `bulk-change-owner` | Company management |
| `person:view`, `create`, `update`, `delete` | Contact management |
| `activity:view`, `create` | Activity management |
| `call-card:view`, `manage` | Call Card management |
| `report:view` | View reports |
| `import:sam` | Upload SAM list |
| `library:persona:view`, `manage` | Persona Library |
| `library:industry:view`, `manage` | Industry library: new model |
| `library:pain-point:view`, `manage` | Pain point management |
| `library:use-case:view`, `manage` | Use case management |
| `branch:manage` | Branch management |
| `social-channel:manage` | Social channel management |

---

## 🌐 API Routes (Summary)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET/POST` | `/api/users` | List/create users, ADMIN only |
| `GET/PATCH` | `/api/users/:id` | View/deactivate user |
| `GET/POST` | `/api/companies` | List/create companies, with pagination |
| `GET/PATCH` | `/api/companies/:id` | View/edit company |
| `PATCH` | `/api/companies/:id/stage` | Change pipeline stage |
| `PATCH` | `/api/companies/:id/owner` | Change company ownership |
| `PATCH` | `/api/companies/bulk/owner` | Bulk ownership change |
| `GET/POST` | `/api/people?companyId=` | List/create contacts, with pagination |
| `GET/PATCH/DELETE` | `/api/people/:id` | View/edit/delete contact |
| `GET/POST` | `/api/activities?companyId=` | List/create activities, with pagination |
| `GET` | `/api/activities/follow-ups/due` | Due follow-up reminders for the current user |
| `GET/PUT` | `/api/companies/:companyId/call-card` | View/create Call Card |
| `GET` | `/api/companies/:companyId/call-card/suggest` | Automatic Pain Point/Use Case suggestions |
| `GET/POST` | `/api/persona-library` | List/create Persona records; write access is ADMIN only |
| `GET/POST` | `/api/industries` | List/create industries; management is ADMIN only |
| `GET/POST` | `/api/pain-points` | List/create pain points; management is ADMIN only |
| `GET/POST` | `/api/use-cases` | List/create use cases; management is ADMIN only |
| `POST` | `/api/import/sam` | Upload Excel and perform bulk import, ADMIN only |
| `GET` | `/api/reports/conversion-rates` | Conversion rates between stages |
| `GET` | `/api/reports/stage-durations` | Average time spent in each stage |
| `GET` | `/api/reports/pipeline-summary` | Pipeline status summary |
| `GET` | `/api/reports/activities` | Activity report over a date range |
| `GET/POST` | `/api/admin/permissions` | Permission management, ADMIN only |

---

## 🧪 Import SAM List (Bulk Import from Excel)

### File Upload

```http
POST /api/import/sam
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data
Body: form-data → Key: file (Type: File)
```

### Recognized Columns in the Excel File

| Persian Column Name | English Column Name |
|---------------------|---------------------|
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

## 🔐 Security and Optimization

- **JWT** with an 8-hour lifetime and a `JWT_SECRET` of at least 32 characters
- **Rate Limiting**: 100 requests per 60 seconds; login is limited to 5 requests
- **Environment validation** at startup with Joi
- **Database indexes** on frequently used fields for better performance
- **Permission cache** for each role with a 10-minute TTL

---

## 📦 Main Dependencies

| Library | Purpose |
|---------|---------|
| NestJS 10 | Main framework |
| Prisma 5 | ORM and database management |
| PostgreSQL 16 | Main database |
| JWT + Passport | Authentication |
| class-validator | Data validation |
| multer + xlsx | Excel upload and processing |
| @nestjs/throttler | Rate limiting |
| joi | Environment validation |
| node-cache | Permission cache |

---

## 🔜 Not Built Yet (Next Phase)

- [ ] Frontend (React) for Research forms, Kanban, and dashboard
- [ ] Specialized dashboard with advanced charts
- [ ] Notification system (Email/Push) for due follow-up reminders
- [ ] Data export to Excel/PDF
- [ ] Unit, integration, and E2E tests
- [ ] Swagger (OpenAPI) documentation for frontend testing and development

---

**Built with ❤️ for the IAM sales team**

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

### fix 000003 - Admin libraries and data catalogs backend

- Added admin-managed Lead Source CRUD with active/inactive filtering and soft deletion.
- Added grouped lookup CRUD for teams, departments, seniority levels, persona tags, contact types, person social platforms, and company sources.
- Added Prisma catalog models, indexes, uniqueness constraints, and a database migration.
- Added and assigned lead-source and lookup view/manage permissions; Persona Library now enforces its existing permissions.
- Catalog dropdown endpoints return active records by default and support `?active=false` for inactive records.

### fix 000004 - Pipeline stage config and transition rules backend

- Added editable display configuration for every existing `PipelineStage` enum value, including order, color, active visibility, and terminal status.
- Added generic and role-specific transition rules with role rules taking precedence over generic rules.
- Added admin stage-config and transition-rule CRUD endpoints with dedicated permissions.
- Seeded Persian stage labels, terminal stages, ordering, and the default allowed sales flow.
- Company stage changes now reject inactive targets and transitions that are not explicitly allowed.

### fix 000006 - Owner options and user management API cleanup

- Added `GET /api/users/owner-options` for active REP/MANAGER assignment candidates, scoped to the manager's own team.
- Added pagination and search, role, team, and active-status filters to the admin users list.
- User list responses now include `createdAt` and `updatedAt` with stable pagination metadata.
- Centralized safe user selection so list/detail APIs never expose password hashes.
- Added the `company:assign-owner` permission for ADMIN and MANAGER.

### fix 000007 - Permission matrix contract cleanup

- Added `GET /api/admin/permissions/matrix` with every permission and explicit booleans for ADMIN, MANAGER, REP, and BOARDS.
- Kept the existing permission list and per-role detail endpoints stable.
- Standardized permission administration endpoints on `permission:view` and `permission:manage`.
- The supported bulk revoke contract remains `POST /api/admin/permissions/bulk-revoke`; clients should send `{ role, actions }` in the request body.
- Seeded roadmap permissions for advanced reports, people directory access, user management, and permission management.

### fix 000008 - Company archive and restore backend

- Added company archive metadata with the archiving user and an optional reason; related CRM records are never deleted.
- Added `PATCH /api/companies/:companyId/archive` and `PATCH /api/companies/:companyId/restore` for ADMIN and team-scoped MANAGER users.
- Company lists hide archived records by default and support `includeArchived=true` or `archivedOnly=true`.
- Added and assigned `company:archive` and `company:restore` permissions.

### fix 000009 - Audit log backend

- Added persistent audit logs with actor, entity, action, before/after snapshots, metadata, and indexed timestamps.
- Added centralized recursive sanitization for password, hash, token, secret, and authorization fields.
- Recorded key user, permission, company, activity, follow-up, and pipeline-transition changes.
- Added the paginated and filterable `GET /api/admin/audit-logs` endpoint protected by `audit-log:view`.

### fix 000010 - Navigation return-state support

**Not applicable — frontend only.** No backend API, schema, or service changes are required.
