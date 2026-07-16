# 🚀 IAM CRM Backend

**Backend for the IAM Sales Process Management System** — a comprehensive backend platform for B2B sales teams, covering authentication, user management, company and pipeline management, people/contact management, activity and follow-up lifecycle, strategic Call Cards, catalog/libraries, reporting, admin permissions, pipeline configuration, and audit logging.

The system is built with **NestJS**, **PostgreSQL**, and **Prisma**, and is optimized for deployment on internal/on-premise servers using **Docker**.

---

## 🎯 Service Goals (Business Goals)

| Service                        | Main Goal and Use Case                                                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**                       | User authentication and JWT token issuance. The secure entry point to the system.                                                                                                         |
| **Users**                      | User management for admins, including creating users, activating/deactivating users, changing roles/teams, and listing users with filters.                                                |
| **Owner Options**              | Provides scoped active REP/MANAGER owner candidates for company assignment without exposing full user management APIs to non-admin workflows.                                             |
| **Companies**                  | **Core of the system**: company/lead management, pipeline stage changes with history tracking, ownership changes, bulk owner assignment, and scoped access by role/team.                  |
| **Company Archive / Restore**  | Safe company lifecycle management. Companies can be archived/restored without deleting related CRM records such as people, activities, branches, social channels, call cards, or history. |
| **People**                     | Management of each company's contacts, including key people, titles, departments, persona tags, seniority levels, and primary-contact indicators.                                         |
| **Person Contacts**            | Management of each person's phone numbers, emails, and other contact methods.                                                                                                             |
| **Person Socials**             | Management of each person's social profiles and handles.                                                                                                                                  |
| **Activities**                 | Recording interactions with companies/contacts, including calls, emails, LinkedIn messages, meetings, notes, and stage-change records.                                                    |
| **Activity Lifecycle**         | Editing activities, completing follow-ups, rescheduling follow-ups, and excluding completed follow-ups from due reminders.                                                                |
| **Due Follow-ups**             | Lists due follow-up reminders based on `nextActionDate`, role visibility, and completion state.                                                                                           |
| **Call Cards**                 | **Strategic call card**: a living document for each company with entry angle, pain points, product use cases, discovery questions, objections, and responses.                             |
| **Persona Library**            | A library of organizational roles/personas such as CIO, CISO, and IT Manager. It helps sales reps understand each role's likely challenges and relevant value propositions.               |
| **Industries**                 | Admin-managed industry catalog used for company classification and Call Card suggestions.                                                                                                 |
| **Pain Points**                | Reusable pain point library, linkable to industries and call-card suggestions.                                                                                                            |
| **Use Cases**                  | Reusable product use-case library, linkable to industries and call-card suggestions.                                                                                                      |
| **Lead Sources**               | Admin-managed catalog for company acquisition sources. Used to avoid free-text source values and support controlled frontend dropdowns.                                                   |
| **Lookup Options**             | Generic grouped lookup service for teams, departments, seniority levels, persona tags, contact types, social platforms, and other controlled values.                                      |
| **Import SAM List**            | Bulk import of company lists from Excel files. Admins can create many companies at once and then distribute them among sales reps.                                                        |
| **Company Branches**           | Management of a company's branches, including headquarters, regional offices, addresses, and phone numbers.                                                                               |
| **Company Social Channels**    | Management of company social channels such as LinkedIn, Instagram, Telegram, Aparat, YouTube, website, and local platforms.                                                               |
| **Reports**                    | Analytical reporting for conversion rates, average stage duration, pipeline summary, and activity reports.                                                                                |
| **Advanced Reports**           | Reporting endpoints with filters by users, owners, teams, stages, priorities, industries, sources, companies, dates, and activity types.                                                  |
| **Admin Permissions (Policy)** | Dynamic access-control system. Admins can manage permissions for each role without code changes.                                                                                          |
| **Permission Matrix**          | Frontend-friendly role-permission matrix for ADMIN, MANAGER, REP, and BOARDS.                                                                                                             |
| **Pipeline Settings**          | Admin-managed pipeline stage display configuration, including labels, ordering, active status, terminal status, and colors.                                                               |
| **Pipeline Transition Rules**  | Admin-managed allowed stage transitions with optional role-specific rules, enforced during company stage changes.                                                                         |
| **Audit Logs**                 | Persistent audit trail for important administrative and operational changes, with sensitive-field sanitization.                                                                           |

---

## ✨ Key Features

- **Full sales pipeline management**: 17 stages from LEAD to DONE, with stage-change history.
- **Pipeline configuration**: admin-managed stage labels, display order, active status, terminal status, and colors.
- **Pipeline transition rules**: role-aware allowed transitions enforced by the backend during company stage changes.
- **Activity lifecycle management**: edit activities, complete follow-ups, and reschedule follow-ups.
- **Due follow-up management**: completed follow-ups are excluded from due reminders.
- **Smart Call Card**: automatic Pain Point and Use Case suggestions based on contact persona and company industry.
- **Advanced contact management**: multiple phone numbers, emails, and social networks per person.
- **Advanced reporting**: report filters by users, owners, teams, stages, priorities, industries, sources, companies, dates, and activity types.
- **Activity reports by user** and **pipeline reports by owner**.
- **Report filter options endpoint** for frontend filter dropdowns.
- **Bulk import from Excel**: import SAM/company lists in a single upload.
- **Admin-managed catalogs**: industries, pain points, use cases, personas, lead sources, and grouped lookup options.
- **Owner options for assignment**: scoped active REP/MANAGER candidates for company ownership workflows.
- **Safe company archive/restore**: no destructive company deletion.
- **Dynamic permission system**: role-permission matrix and assign/revoke APIs.
- **Audit log**: persistent trace of important administrative and operational changes.
- **High security**: JWT, rate limiting, environment validation, permission cache, password hashing, audit-log sanitization, and database indexes.

---

## 🚀 Quick Start with Docker (Recommended for Internal Servers)

```bash
docker compose up -d --build
```

This command:

1. Starts a PostgreSQL database
2. Builds the backend application
3. Runs database migrations according to the Docker Compose API startup command
4. Starts the API on port `3000`

The API will be available at:

```text
http://localhost:3000/api
```

After the services are up, run the seed command to populate permissions, libraries/catalogs, pipeline configuration, transition rules, and the initial admin user.

If the API container includes the required runtime dependencies for seeding:

```bash
docker compose exec api npm run seed
```

If seeding should be run locally against the Docker database, use:

```bash
DATABASE_URL="postgresql://iam_crm:changeme@localhost:15432/iam_crm?schema=public" npm run seed
```

PowerShell:

```powershell
$env:DATABASE_URL="postgresql://iam_crm:changeme@localhost:15432/iam_crm?schema=public"
npm run seed
```

Default admin user, if created by the seed script:

```text
Email: admin@yourcompany.com
Password: ChangeMe123!
```

Change this password immediately after the first login.

---

## 💻 Local Development Setup

```bash
cp .env.example .env
# Configure DATABASE_URL and JWT_SECRET in .env

npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000/api
```

---

## 🖥️ Frontend Application

The frontend application for this backend is maintained in a separate repository:

- Frontend repository: https://github.com/IKAC-FIDS/iam-crm-frontend-mui

The frontend is built with React and MUI and communicates with this backend through the `/api` routes documented below.

For local development, configure the frontend API base URL to point to this backend, for example:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Make sure the backend is running and database migrations/seeds have been applied before testing frontend flows.

---

## 📂 Project Structure (Main Modules)

```text
prisma/
├── schema.prisma          Complete database model
├── seed.ts                Initial data: admin user, permissions, libraries, catalogs, pipeline config, and transition rules
└── migrations/            Migration files

src/
├── auth/                  JWT authentication: login and token issuance
├── users/                 User management, role/team updates, activation/deactivation, and owner options
├── companies/             Company management, pipeline, history, ownership, archive, and restore
├── people/                Company-scoped contact/person management
├── activities/            Activity logging, editing, completion, rescheduling, and due follow-up reminders
├── call-cards/            Strategic Call Card and automatic suggestions
├── persona-library/       Persona library: CIO, CISO, IT Manager, and similar roles
├── industries/            Industry catalog and industry relations
├── pain-points/           Reusable pain point management
├── use-cases/             Reusable use case management
├── lead-sources/          Admin-managed company acquisition source catalog
├── lookups/               Generic grouped lookup options
├── import/                Bulk import from Excel: SAM List
├── company-branches/      Company branch management
├── company-social-channels/ Company social channel management
├── reports/               Reporting, advanced filters, activity-by-user, and pipeline-by-owner reports
├── admin/                 Admin APIs for permissions, permission matrix, pipeline config, and audit logs
├── common/                Guards, decorators, shared DTOs, validations, and shared utilities
└── app.module.ts          Main module
```

---

## 🛡️ Permission System (Policy)

The permission system is designed to be **dynamic** and manageable from the admin panel.

### Defined Roles

| Role        | Description                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **ADMIN**   | Full access to all sections, including user management, libraries, permissions, pipeline settings, audit logs, and system administration |
| **MANAGER** | Manages companies belonging to their own team, views scoped reports, assigns owners within scope, and manages sales activities           |
| **REP**     | Manages their own companies, records activities, manages Call Cards, and views contacts within their scope                               |
| **BOARDS**  | Read-only/reporting-oriented role, without operational write access unless explicitly granted                                            |

### Main Permission List

| Permission                   | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| `user:create`                | Create users                                    |
| `user:view`                  | View users                                      |
| `user:deactivate`            | Deactivate users                                |
| `user:activate`              | Activate users                                  |
| `user:manage`                | General user-management capability              |
| `company:view`               | View companies                                  |
| `company:create`             | Create companies                                |
| `company:update`             | Update company data                             |
| `company:change-stage`       | Change company pipeline stage                   |
| `company:change-owner`       | Change company owner                            |
| `company:bulk-change-owner`  | Bulk owner assignment                           |
| `company:assign-owner`       | Fetch scoped owner options and assign ownership |
| `company:archive`            | Archive companies safely                        |
| `company:restore`            | Restore archived companies                      |
| `person:view`                | View people/contacts                            |
| `person:create`              | Create people/contacts                          |
| `person:update`              | Update people/contacts                          |
| `person:delete`              | Delete people/contacts                          |
| `activity:view`              | View activities                                 |
| `activity:create`            | Create activities                               |
| `activity:update`            | Edit activities                                 |
| `follow-up:complete`         | Mark follow-ups as completed                    |
| `follow-up:reschedule`       | Reschedule follow-ups                           |
| `call-card:view`             | View Call Cards                                 |
| `call-card:manage`           | Create/update Call Cards                        |
| `report:view`                | View reports                                    |
| `report:advanced-filter`     | Use advanced report filters                     |
| `import:sam`                 | Upload and import SAM lists                     |
| `library:persona:view`       | View Persona Library                            |
| `library:persona:manage`     | Manage Persona Library                          |
| `library:industry:view`      | View Industry Library                           |
| `library:industry:manage`    | Manage Industry Library                         |
| `library:pain-point:view`    | View Pain Point Library                         |
| `library:pain-point:manage`  | Manage Pain Point Library                       |
| `library:use-case:view`      | View Use Case Library                           |
| `library:use-case:manage`    | Manage Use Case Library                         |
| `library:lead-source:view`   | View Lead Source catalog                        |
| `library:lead-source:manage` | Manage Lead Source catalog                      |
| `lookup:view`                | View grouped lookup options                     |
| `lookup:manage`              | Manage grouped lookup options                   |
| `pipeline:config:view`       | View pipeline stage configuration               |
| `pipeline:config:manage`     | Manage pipeline stage configuration             |
| `pipeline:transition:view`   | View pipeline transition rules                  |
| `pipeline:transition:manage` | Manage pipeline transition rules                |
| `branch:manage`              | Manage company branches                         |
| `social-channel:manage`      | Manage company social channels                  |
| `permission:view`            | View permissions and permission matrix          |
| `permission:manage`          | Assign/revoke permissions                       |
| `audit-log:view`             | View audit logs                                 |

---

## 🌐 API Routes (Summary)

| Method | Path              | Description           |
| ------ | ----------------- | --------------------- |
| `POST` | `/api/auth/login` | Login and receive JWT |

### Passkeys

| Method   | Path                                             | Description                                      |
| -------- | ------------------------------------------------ | ------------------------------------------------ |
| `GET`    | `/api/me/passkeys`                               | List current user's registered passkeys          |
| `POST`   | `/api/me/passkeys/registration/options`          | Start authenticated passkey registration         |
| `POST`   | `/api/me/passkeys/registration/verify`           | Verify and save a new passkey                    |
| `DELETE` | `/api/me/passkeys/:id`                           | Delete current user's passkey                    |
| `POST`   | `/api/auth/passkeys/authentication/options`      | Start usernameless passkey login                 |
| `POST`   | `/api/auth/passkeys/authentication/verify`       | Verify passkey login and return JWT login shape  |
| `GET`    | `/api/admin/users/:id/passkeys`                  | Admin list of a user's passkeys                  |
| `DELETE` | `/api/admin/users/:id/passkeys/:passkeyId`       | Admin delete/reset of a user's passkey           |

### Users

| Method  | Path                        | Description                                     |
| ------- | --------------------------- | ----------------------------------------------- |
| `GET`   | `/api/users`                | List users with pagination and optional filters |
| `POST`  | `/api/users`                | Create user                                     |
| `GET`   | `/api/users/:id`            | Get user by ID                                  |
| `PATCH` | `/api/users/:id/role`       | Update user role/team                           |
| `PATCH` | `/api/users/:id/deactivate` | Deactivate user                                 |
| `PATCH` | `/api/users/:id/activate`   | Activate user                                   |
| `GET`   | `/api/users/owner-options`  | Get scoped active REP/MANAGER owner candidates  |

User list filters, if enabled:

```http
GET /api/users?page=&limit=&search=&role=&team=&isActive=
```

### Companies

| Method  | Path                                | Description                                |
| ------- | ----------------------------------- | ------------------------------------------ |
| `GET`   | `/api/companies`                    | List companies with pagination and filters |
| `POST`  | `/api/companies`                    | Create company                             |
| `GET`   | `/api/companies/:companyId`         | Get company detail                         |
| `PATCH` | `/api/companies/:companyId`         | Update company                             |
| `PATCH` | `/api/companies/:companyId/stage`   | Change pipeline stage                      |
| `PATCH` | `/api/companies/:companyId/owner`   | Change company owner                       |
| `PATCH` | `/api/companies/bulk/owner`         | Bulk ownership change                      |
| `PATCH` | `/api/companies/:companyId/archive` | Archive company safely                     |
| `PATCH` | `/api/companies/:companyId/restore` | Restore archived company                   |

Company list filters:

```http
GET /api/companies?page=&limit=&stage=&priority=&search=&ownerId=&withoutOwner=&includeArchived=&archivedOnly=
```

### People

| Method   | Path                     | Description               |
| -------- | ------------------------ | ------------------------- |
| `GET`    | `/api/people?companyId=` | List people for a company |
| `POST`   | `/api/people`            | Create person             |
| `GET`    | `/api/people/:personId`  | Get person detail         |
| `PATCH`  | `/api/people/:personId`  | Update person             |
| `DELETE` | `/api/people/:personId`  | Delete person             |

### Person Contacts

| Method   | Path                                        | Description           |
| -------- | ------------------------------------------- | --------------------- |
| `GET`    | `/api/people/:personId/contacts`            | List person contacts  |
| `GET`    | `/api/people/:personId/contacts/:contactId` | Get contact detail    |
| `POST`   | `/api/people/:personId/contacts`            | Create person contact |
| `PATCH`  | `/api/people/:personId/contacts/:contactId` | Update person contact |
| `DELETE` | `/api/people/:personId/contacts/:contactId` | Delete person contact |

### Person Socials

| Method   | Path                                      | Description          |
| -------- | ----------------------------------------- | -------------------- |
| `GET`    | `/api/people/:personId/socials`           | List person socials  |
| `GET`    | `/api/people/:personId/socials/:socialId` | Get social detail    |
| `POST`   | `/api/people/:personId/socials`           | Create person social |
| `PATCH`  | `/api/people/:personId/socials/:socialId` | Update person social |
| `DELETE` | `/api/people/:personId/socials/:socialId` | Delete person social |

### Activities and Follow-ups

| Method  | Path                                     | Description                   |
| ------- | ---------------------------------------- | ----------------------------- |
| `GET`   | `/api/activities?companyId=`             | List activities for a company |
| `POST`  | `/api/activities`                        | Create activity               |
| `PATCH` | `/api/activities/:activityId`            | Edit activity                 |
| `PATCH` | `/api/activities/:activityId/complete`   | Mark follow-up as completed   |
| `PATCH` | `/api/activities/:activityId/reschedule` | Reschedule follow-up          |
| `GET`   | `/api/activities/follow-ups/due`         | List due follow-up reminders  |

### Call Cards

| Method | Path                                          | Description                       |
| ------ | --------------------------------------------- | --------------------------------- |
| `GET`  | `/api/companies/:companyId/call-card`         | View company Call Card            |
| `PUT`  | `/api/companies/:companyId/call-card`         | Create/update company Call Card   |
| `GET`  | `/api/companies/:companyId/call-card/suggest` | Suggest Pain Points and Use Cases |

### Company Branches

| Method   | Path                                           | Description           |
| -------- | ---------------------------------------------- | --------------------- |
| `GET`    | `/api/companies/:companyId/branches`           | List company branches |
| `POST`   | `/api/companies/:companyId/branches`           | Create branch         |
| `PATCH`  | `/api/companies/:companyId/branches/:branchId` | Update branch         |
| `DELETE` | `/api/companies/:companyId/branches/:branchId` | Delete branch         |

### Company Social Channels

| Method   | Path                                                   | Description                  |
| -------- | ------------------------------------------------------ | ---------------------------- |
| `GET`    | `/api/companies/:companyId/social-channels`            | List company social channels |
| `POST`   | `/api/companies/:companyId/social-channels`            | Create social channel        |
| `PATCH`  | `/api/companies/:companyId/social-channels/:channelId` | Update social channel        |
| `DELETE` | `/api/companies/:companyId/social-channels/:channelId` | Delete social channel        |

### Reports

| Method | Path                              | Description                       |
| ------ | --------------------------------- | --------------------------------- |
| `GET`  | `/api/reports/pipeline-summary`   | Pipeline status summary           |
| `GET`  | `/api/reports/conversion-rates`   | Conversion rates between stages   |
| `GET`  | `/api/reports/stage-durations`    | Average time spent in each stage  |
| `GET`  | `/api/reports/activities`         | Activity report over a date range |
| `GET`  | `/api/reports/activities/by-user` | Activity breakdown by user        |
| `GET`  | `/api/reports/pipeline/by-owner`  | Pipeline breakdown by owner       |
| `GET`  | `/api/reports/filter-options`     | Filter options for report UI      |

Reports may support filters such as:

```http
startDate=&endDate=&userIds=&ownerIds=&companyIds=&teams=&stages=&priorities=&industries=&sources=&activityTypes=
```

### Pipeline Runtime

| Method | Path                        | Description                                      |
| ------ | --------------------------- | ------------------------------------------------ |
| `GET`  | `/api/pipeline/stages`      | List active pipeline stages for opportunity UI   |
| `GET`  | `/api/pipeline/transitions` | List configured stage transitions for runtime UI |

### Admin Permissions

| Method   | Path                                              | Description                           |
| -------- | ------------------------------------------------- | ------------------------------------- |
| `GET`    | `/api/admin/permissions`                          | List permissions                      |
| `GET`    | `/api/admin/permissions/matrix`                   | Get role-permission matrix            |
| `GET`    | `/api/admin/permissions/roles/:role`              | Get permissions for a role            |
| `GET`    | `/api/admin/permissions/roles/:role/with-details` | Get role permissions with details     |
| `POST`   | `/api/admin/permissions/create`                   | Create permission                     |
| `POST`   | `/api/admin/permissions/assign`                   | Assign permission to role             |
| `DELETE` | `/api/admin/permissions/revoke`                   | Revoke permission from role           |
| `POST`   | `/api/admin/permissions/bulk-assign`              | Assign multiple permissions to role   |
| `POST`   | `/api/admin/permissions/bulk-revoke`              | Revoke multiple permissions from role |

### Admin Pipeline

| Method   | Path                                  | Description                         |
| -------- | ------------------------------------- | ----------------------------------- |
| `GET`    | `/api/admin/pipeline/stages`          | List pipeline stage configurations  |
| `PATCH`  | `/api/admin/pipeline/stages/:stage`   | Update pipeline stage configuration |
| `GET`    | `/api/admin/pipeline/transitions`     | List transition rules               |
| `POST`   | `/api/admin/pipeline/transitions`     | Create transition rule              |
| `PATCH`  | `/api/admin/pipeline/transitions/:id` | Update transition rule              |
| `DELETE` | `/api/admin/pipeline/transitions/:id` | Delete transition rule              |

### Libraries and Catalogs

| Method   | Path                       | Description                        |
| -------- | -------------------------- | ---------------------------------- |
| `GET`    | `/api/persona-library`     | List persona records               |
| `POST`   | `/api/persona-library`     | Create persona record              |
| `PATCH`  | `/api/persona-library/:id` | Update persona record              |
| `DELETE` | `/api/persona-library/:id` | Delete persona record              |
| `GET`    | `/api/industries`          | List industries                    |
| `POST`   | `/api/industries`          | Create industry                    |
| `PATCH`  | `/api/industries/:id`      | Update industry                    |
| `DELETE` | `/api/industries/:id`      | Delete industry                    |
| `GET`    | `/api/pain-points`         | List pain points                   |
| `POST`   | `/api/pain-points`         | Create pain point                  |
| `PATCH`  | `/api/pain-points/:id`     | Update pain point                  |
| `DELETE` | `/api/pain-points/:id`     | Delete pain point                  |
| `GET`    | `/api/use-cases`           | List use cases                     |
| `POST`   | `/api/use-cases`           | Create use case                    |
| `PATCH`  | `/api/use-cases/:id`       | Update use case                    |
| `DELETE` | `/api/use-cases/:id`       | Delete use case                    |
| `GET`    | `/api/lead-sources`        | List lead sources                  |
| `POST`   | `/api/lead-sources`        | Create lead source                 |
| `PATCH`  | `/api/lead-sources/:id`    | Update lead source                 |
| `DELETE` | `/api/lead-sources/:id`    | Delete or deactivate lead source   |
| `GET`    | `/api/lookups/:group`      | List lookup options by group       |
| `POST`   | `/api/lookups/:group`      | Create lookup option               |
| `PATCH`  | `/api/lookups/:group/:id`  | Update lookup option               |
| `DELETE` | `/api/lookups/:group/:id`  | Delete or deactivate lookup option |

### Import

| Method | Path              | Description                              |
| ------ | ----------------- | ---------------------------------------- |
| `POST` | `/api/import/sam` | Upload Excel and perform bulk SAM import |

### Audit Logs

| Method | Path                    | Description                                 |
| ------ | ----------------------- | ------------------------------------------- |
| `GET`  | `/api/admin/audit-logs` | List audit logs with pagination and filters |

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

| Accepted Excel Header | English Meaning | Internal Field |
| --------------------- | --------------- | -------------- |
| `نام شرکت`            | Company Legal Name | `legalName` |
| `نام تجاری`           | Brand Name | `brandName` |
| `صنعت`                | Industry | `industry` |
| `وبسایت`              | Website | `website` |
| `شهر`                 | Head Office City | `headOfficeCity` |
| `اولویت`              | Priority | `priority` |
| `نام مخاطب`           | Contact Name | `personName` |
| `سمت`                 | Job Title | `title` |
| `ایمیل`               | Email | `email` |
| `تلفن`                | Phone | `phone` |
| `نقش (Persona)`       | Persona Role | `personaTag` |

---

## 🔐 Security and Optimization

- **JWT authentication** with configurable token lifetime
- **Optional WebAuthn/Passkey authentication** for discoverable usernameless login
- **Password hashing** before storing user credentials
- **Rate limiting** for API protection
- **Login throttling** if enabled in the current throttler configuration
- **Environment validation** at startup with Joi
- **Database indexes** on frequently queried fields
- **Role/permission-based access control**
- **Dynamic permission cache** for role permissions
- **Audit-log sanitization** for sensitive fields such as password, token, secret, hash, and authorization data

WebAuthn/passkey configuration:

```env
WEBAUTHN_RP_NAME="IAM CRM"
WEBAUTHN_RP_ID="localhost"
WEBAUTHN_ORIGIN="http://localhost:5173"
```

Production should use the actual HTTPS origin and domain, for example `WEBAUTHN_RP_ID="crm.example.com"` and `WEBAUTHN_ORIGIN="https://crm.example.com"`.

---

## 📦 Main Dependencies

| Library           | Purpose                               |
| ----------------- | ------------------------------------- |
| NestJS 10         | Main backend framework                |
| Prisma 5          | ORM and database migration management |
| PostgreSQL 16     | Main relational database              |
| JWT + Passport    | Authentication                        |
| class-validator   | DTO validation                        |
| multer + xlsx     | Excel upload and processing           |
| @nestjs/throttler | Rate limiting                         |
| joi               | Environment validation                |
| node-cache        | Permission cache                      |
| @simplewebauthn/server | WebAuthn/passkey verification     |

---

## 🔜 Not Built Yet / Next Phase

- [ ] People Directory endpoint: `GET /api/people/directory`
- [ ] Notification system for due follow-up reminders
- [ ] Data export to Excel/PDF
- [ ] Unit, integration, and E2E tests
- [ ] Runtime Swagger UI inside the NestJS app, if required
- [ ] Optional advanced dashboard visualizations

---
## Changelog

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

### fix 000011 - Global People Directory endpoint

- Added the separate paginated `GET /api/people/directory` endpoint without changing the existing company-scoped People API.
- Added search plus company, owner, team, department, persona, primary-contact, email, and phone filters.
- Applied role visibility using `people:directory:view`: ADMIN sees all active-company people, MANAGER sees the manager's team, REP sees owned-company people, and BOARDS remains unauthorized by default.
- Included safe company owner, contact, and social details with derived primary email and phone summaries.

### fix 000012 - Introduce Opportunity as the pipeline-moving entity

- Company remains the account/master organization; Opportunity is now the sales process that moves through the pipeline, and each company can own multiple opportunities.
- Added Opportunity CRUD, stage, owner, archive/restore, global listing, and company-scoped listing/creation APIs.
- Added opportunity stage history and optional Activity-to-Opportunity linkage.
- Phase-1 migrations create a primary opportunity for every existing company, copy owner/stage/priority/source, and preserve legacy company stage history.
- Pipeline summary, conversion, duration, and owner reports now count opportunities. Legacy response property names such as `totalCompanies` remain temporarily for frontend compatibility but represent opportunity counts.
- Existing Company pipeline fields and `PATCH /api/companies/:companyId/stage` remain operational but are deprecated for new integrations; they do not automatically mutate opportunities.
- Added scoped Opportunity permissions and audit events for create, update, stage, owner, archive, and restore operations.

### fix 000013 - Make pipeline stages fully dynamic

- Replaced enum-based Opportunity stages with database stage IDs while retaining `LegacyPipelineStage` only for deprecated Company compatibility fields.
- Admins can create, inspect, edit, reorder, and safely deactivate stages; stage codes are normalized and immutable.
- Dynamic stages define label, color, order, active/default state, terminal behavior, and `WON`, `LOST`, `ON_HOLD`, or `NONE` semantics.
- Transition rules now reference stage IDs and return expanded stage code/label data.
- Deactivating an in-use stage requires an active replacement and moves active opportunities with stage-history records; archived opportunities remain untouched.
- Opportunity stage changes, terminal timestamps, reports, and filter options now use database-driven stages and ordering.
- Existing broad `pipeline:config:*` and `pipeline:transition:*` permissions remain the enforced contract.

### fix 000014 - Opportunity frontend contract helpers

- Added runtime pipeline metadata endpoints: `GET /api/pipeline/stages` for active stages and `GET /api/pipeline/transitions` for configured transitions.
- Extended pipeline report responses with opportunity-native summary fields while keeping legacy company-named fields for frontend compatibility.
- Added stage IDs, labels, sort ordering, and terminal-aware won/lost metrics to pipeline summary, conversion, duration, and owner reports.
- Returned frontend-friendly report filter options with `{ value, label }` shapes for users, owners, teams, industries, lead sources, stages, priorities, and activity types.
- No Prisma schema, migration, seed, or permission changes were required.

### fix 000015 - Add optional usernameless WebAuthn passkey authentication

- Added optional WebAuthn/passkey login without changing `POST /api/auth/login`.
- Added `UserPasskey` storage with credential ID, public key bytes, counter, device metadata, backup state, transports, and last-used timestamp.
- Added authenticated passkey management endpoints under `/api/me/passkeys`.
- Added usernameless discoverable passkey login endpoints under `/api/auth/passkeys/authentication/*`; successful verification returns the same `{ accessToken, user }` shape as password login.
- Added optional admin passkey list/delete endpoints under `/api/admin/users/:id/passkeys`.
- Added WebAuthn RP config defaults and validation for `WEBAUTHN_RP_NAME`, `WEBAUTHN_RP_ID`, and `WEBAUTHN_ORIGIN`.
- Added audit logs for passkey registration, deletion, admin deletion, login success, and login failure.

### fix 000016 - Harden JWT strategy and production security logs

- Removed unsafe runtime logging of `JWT_SECRET` from the JWT strategy.
- Removed JWT payload console logging from token validation to avoid exposing user/session data in production logs.
- Added a typed JWT payload shape for strategy validation.
- Added explicit startup protection if `JWT_SECRET` is missing.
- Preserved the existing JWT payload contract: `sub`, `email`, `role`, and optional `team`.

### fix 000017 - Add production-safe CORS configuration

- Replaced unrestricted `app.enableCors()` with an environment-driven CORS configuration.
- Added `CORS_ORIGINS` support for comma-separated allowed frontend origins.
- Added `CORS_CREDENTIALS` support with a safe default of `false`.
- Added Joi validation defaults for the new CORS environment variables.
- Updated `.env.example` and `docker-compose.yml` with local development CORS defaults.

### fix 000018 - Add HTTP security headers with Helmet

- Added Helmet middleware to apply standard HTTP security headers for the backend API.
- Disabled Helmet Content Security Policy for now because the backend serves JSON APIs rather than browser-rendered pages.
- Disabled Cross-Origin-Embedder-Policy to avoid unnecessary frontend integration issues for API, WebAuthn, and browser-based flows.
- Preserved the production-safe CORS configuration from fix 000017.
- Added the `helmet` dependency.

### fix 000019 - Add refresh tokens and session management

- Added persistent refresh token sessions with hashed refresh tokens.
- Added refresh token rotation on every refresh request.
- Added HttpOnly cookie handling for refresh tokens.
- Added `POST /api/auth/refresh`.
- Added `POST /api/auth/logout`.
- Added `POST /api/auth/logout-all`.
- Added `GET /api/auth/sessions` for listing active user sessions.
- Added `DELETE /api/auth/sessions/:sessionId` for revoking an active user session.
- Updated SSO ticket exchange to create a refresh session and set the refresh cookie.
- Added refresh-session Prisma model and migration.
- Added `REFRESH_TOKEN_EXPIRES_IN` environment setting.
- Reduced default access-token lifetime to `15m`.
- Added session-related permissions to seed data.
- Important changed or new files:
  - `prisma/schema.prisma`
  - `src/auth/auth.service.ts`
  - `src/auth/auth.controller.ts`
  - `src/auth/auth.module.ts`
  - `src/auth/refresh-token.service.ts`
  - `src/auth/sessions.service.ts`
  - `src/auth/sessions.controller.ts`
  - `src/auth/sso/sso-exchange.controller.ts`
  - `src/common/cookies/refresh-token-cookie.ts`
  - `src/common/validators/env.validator.ts`
  - `.env.example`
  - `prisma/seed.ts`

### fix 000020 - Add account security endpoints

- Added account security overview endpoint: `GET /api/auth/account/security`.
- Added authenticated password change endpoint: `POST /api/auth/account/change-password`.
- Added logout-other-sessions endpoint: `POST /api/auth/account/logout-other-sessions`.
- Added account security fields to `User`:
  - `passwordChangedAt`
  - `lastLoginAt`
  - `lastLoginIp`
  - `failedLoginAttempts`
  - `lockedUntil`
- Added failed-login tracking.
- Added temporary account lock after repeated failed login attempts.
- Added successful-login metadata update.
- Added refresh-session revocation for password changes.
- Added support for revoking all other sessions while keeping the current session.
- Important changed or new files:
  - `prisma/schema.prisma`
  - `src/auth/account-security.controller.ts`
  - `src/auth/account-security.service.ts`
  - `src/auth/dto/change-password.dto.ts`
  - `src/auth/auth.service.ts`
  - `src/auth/auth.module.ts`
  - `src/auth/refresh-token.service.ts`

### fix 000021 - Add SSO relying-party foundation

- Added the initial Prisma foundation for SSO relying-party support.
- Added `SsoProviderType` with `OIDC` and `SAML` provider types.
- Added `SsoProvider` for external IdP configuration.
- Added `ExternalIdentity` for mapping external IdP subjects to internal CRM users.
- Added `SsoLoginTicket` for future one-time SSO callback ticket exchange.
- Added SSO environment variables for secret encryption, ticket TTL, and frontend callback URL.
- Added `sso-provider:view` and `sso-provider:manage` permissions for ADMIN.
- Full OIDC login, SAML login, admin SSO APIs, and public provider endpoints are not implemented yet in this phase.
- Prisma migration is required: `add_sso_relying_party_foundation`.

### fix 000022 - Add OIDC relying-party login

- Added OIDC login redirect endpoint: `GET /api/auth/oidc/:providerId/login`.
- Added OIDC callback endpoint: `GET /api/auth/oidc/:providerId/callback`.
- Added one-time SSO ticket exchange endpoint: `POST /api/auth/sso/exchange`.
- Added OIDC state and nonce validation.
- Added OIDC user resolution through `ExternalIdentity`.
- Added optional auto-provisioning of internal CRM users based on provider configuration.
- Added allowed-domain enforcement for auto-provisioned users.
- Reused `AuthService.buildLoginResponse` for issuing the internal CRM JWT.
- Added `BACKEND_PUBLIC_URL` environment configuration for OIDC redirect URI generation.
- Added `openid-client` dependency.
- No Prisma schema migration was required in this fix.

### fix 000023 - Add SAML service-provider login

- Added SAML service-provider login endpoint: `GET /api/auth/saml/:providerId/login`.
- Added SAML Assertion Consumer Service endpoint: `POST /api/auth/saml/:providerId/acs`.
- Added SAML service-provider metadata endpoint: `GET /api/auth/saml/:providerId/metadata`.
- Added SAML response validation using the configured IdP X.509 certificate.
- Added SAML user resolution through `ExternalIdentity`.
- Added optional auto-provisioning of internal CRM users based on provider configuration.
- Reused the existing one-time SSO ticket exchange flow.
- Reused `AuthService.buildLoginResponse` indirectly through `POST /api/auth/sso/exchange`.
- No Prisma schema migration was required because SAML provider fields already existed in the SSO foundation schema.
- Added `@node-saml/node-saml` dependency.

### fix 000024 - Make permission system truly policy-driven

- Removed hardcoded role dependency from permission-protected admin permission endpoints.
- Updated `PermissionsGuard` to evaluate access from database-backed role permissions.
- Updated permission evaluation to use the current user role from the database instead of trusting only the JWT role claim.
- Added support for `all` and `any` permission-check modes.
- Added `AnyPermission` decorator for endpoints where one of several permissions is sufficient.
- Kept permission cache with explicit invalidation after permission changes.
- No Prisma schema migration was required.
- Important changed or new files:
  - `src/common/decorators/permissions.decorator.ts`
  - `src/common/guards/permissions.guard.ts`
  - `src/admin/admin-permissions.controller.ts`

### fix 000025 - Add granular passkey administration permissions

- Replaced legacy admin role checks in passkey administration routes with granular permissions.
- Kept self-service passkey routes under authenticated-user access only:
  - `GET /api/me/passkeys`
  - `POST /api/me/passkeys/registration/options`
  - `POST /api/me/passkeys/registration/verify`
  - `DELETE /api/me/passkeys/:id`
- Kept passkey authentication routes public:
  - `POST /api/auth/passkeys/authentication/options`
  - `POST /api/auth/passkeys/authentication/verify`
- Protected admin passkey routes with policy-driven permissions:
  - `GET /api/admin/users/:id/passkeys` requires `user:passkey:view`
  - `DELETE /api/admin/users/:id/passkeys/:passkeyId` requires `user:passkey:manage`
- Confirmed passkey administration permissions are seeded:
  - `user:passkey:view`
  - `user:passkey:manage`
- No Prisma schema migration was required.
- Important changed or new files:
  - `src/auth/passkeys/passkeys.controller.ts`
  - `prisma/seed.ts`

### fix 000026 - Deprecate company pipeline mutation and enforce opportunity pipeline

- Deprecated legacy company-stage mutation endpoint:
  - `PATCH /api/companies/:id/stage`
- Kept the deprecated endpoint available only to return `410 Gone` with migration guidance.
- Removed company-stage mutation from `CompaniesService`.
- Removed legacy `ChangeStageDto` for company-stage mutation.
- Enforced opportunity pipeline as the only supported sales pipeline mutation path:
  - `PATCH /api/opportunities/:id/stage`
  - required permission: `opportunity:change-stage`
- Kept legacy company pipeline fields as read-only compatibility fields:
  - `Company.stage`
  - `Company.priority`
  - `Company.source`
- Marked `company:change-stage` permission as deprecated in seed data.
- No Prisma schema migration was required.
- Important changed or new files:
  - `src/companies/companies.controller.ts`
  - `src/companies/companies.service.ts`
  - `src/companies/dto/change-stage.dto.ts`
  - `prisma/seed.ts`

### fix 000027 - Normalize company industry and source references

- Added normalized company references:
  - `Company.industryId` -> `Industry`
  - `Company.sourceId` -> `LeadSource`
- Kept legacy string fields as compatibility snapshots:
  - `Company.industry`
  - `Company.source`
- Updated company create/update flows to resolve `industryId` and `sourceId`.
- Added backward-compatible resolution for legacy `industry` and `source` inputs when they match existing reference data.
- Rejected free-text industry/source values that do not exist in reference tables.
- Updated company list/detail responses to include:
  - `industryRef`
  - `sourceRef`
- Added company filters:
  - `industryId`
  - `sourceId`
  - legacy `industry`
  - legacy `source`
- Added migration backfill from existing company string values to normalized references.
- Important changed or new files:
  - `prisma/schema.prisma`
  - `src/companies/dto/create-company.dto.ts`
  - `src/companies/dto/find-companies.dto.ts`
  - `src/companies/companies.controller.ts`
  - `src/companies/companies.service.ts`

### fix 000028 - Complete person contact/social normalization

- Added normalized lookup references for person contacts and socials:
  - `PersonContact.typeOptionId` -> `LookupOption(group = contact_types)`
  - `PersonSocial.platformOptionId` -> `LookupOption(group = social_types)`
- Kept legacy string snapshots for backward compatibility:
  - `PersonContact.type`
  - `PersonSocial.platform`
- Updated contact/social DTOs to accept normalized lookup IDs:
  - `typeOptionId`
  - `platformOptionId`
- Kept legacy `type` and `platform` inputs as compatibility fields when they match active lookup options.
- Rejected free-text contact types and social platforms that do not exist in lookup options.
- Updated contact/social create and update flows to resolve lookup references and store canonical codes.
- Updated person detail and directory responses to include lookup reference metadata:
  - `typeOption`
  - `platformOption`
- Added migration backfill from existing string values to lookup references.
- No role or permission changes were required.
- Important changed or new files:
  - `prisma/schema.prisma`
  - `src/people/dto/person-contact.dto.ts`
  - `src/people/dto/person-social.dto.ts`
  - `src/person-contacts/person-contacts.service.ts`
  - `src/person-socials/person-socials.service.ts`
  - `src/people/people.service.ts`

### fix 000029 - Enrich audit logs with request context

- Added request-context fields to audit logs:
  - `requestId`
  - `ipAddress`
  - `userAgent`
  - `requestMethod`
  - `requestPath`
- Added request context middleware using AsyncLocalStorage.
- Added automatic request ID resolution from `x-request-id`.
- Generated a request ID when the client does not provide one.
- Returned `x-request-id` on the response for traceability.
- Updated `AuditLogService.record()` to automatically enrich records with request context.
- Kept explicit override support for request-context fields when records are created outside an HTTP request.
- Extended audit-log filtering:
  - `requestId`
  - `ipAddress`
  - `requestMethod`
  - `requestPath`
- Expanded audit sanitization to remove sensitive fields such as:
  - password
  - hash
  - token
  - secret
  - authorization
  - cookie
  - credential
- Important changed or new files:
  - `prisma/schema.prisma`
  - `src/audit-log/audit-request-context.service.ts`
  - `src/audit-log/audit-request-context.middleware.ts`
  - `src/audit-log/audit-log.module.ts`
  - `src/audit-log/audit-log.service.ts`
  - `src/audit-log/dto/find-audit-logs.dto.ts`

### fix 000030 - Standardize API response and error contract

- Added a global API response interceptor.
- Standardized successful API responses to:
  - `success`
  - `data`
  - `meta`
  - `requestId`
  - `timestamp`
- Preserved existing paginated service responses by lifting existing `meta` to the top-level response.
- Added a global API exception filter.
- Standardized error responses to:
  - `success: false`
  - `error.code`
  - `error.message`
  - `error.details`
  - `requestId`
  - `timestamp`
  - `path`
  - `method`
  - `statusCode`
- Normalized validation errors under `VALIDATION_ERROR`.
- Normalized selected Prisma errors:
  - `P2002` -> `UNIQUE_CONSTRAINT_FAILED`
  - `P2003` -> `FOREIGN_KEY_CONSTRAINT_FAILED`
  - `P2025` -> `RECORD_NOT_FOUND`
- Added `x-request-id` to CORS allowed and exposed headers.
- Important changed or new files:
  - `src/common/http/api-response.types.ts`
  - `src/common/interceptors/api-response.interceptor.ts`
  - `src/common/filters/api-exception.filter.ts`
  - `src/main.ts`

### fix 000031 - Add health, readiness, and version endpoints

- Added public operational endpoints:
  - `GET /api/health`
  - `GET /api/ready`
  - `GET /api/version`
- Added liveness response with:
  - service name
  - environment
  - uptime
  - start timestamp
  - current timestamp
- Added readiness response with dependency checks:
  - API status
  - database status
  - database latency
- Made readiness return `503 Service Unavailable` when the database check fails.
- Added version endpoint with:
  - package name
  - app version
  - environment
  - commit SHA
  - build time
  - Node.js version
- Added optional environment variables:
  - `APP_VERSION`
  - `APP_COMMIT_SHA`
  - `APP_BUILD_TIME`
- Updated standardized error code mapping for `503 Service Unavailable`.
- Important changed or new files:
  - `src/health/health.module.ts`
  - `src/health/health.controller.ts`
  - `src/health/health.service.ts`
  - `src/app.module.ts`
  - `src/common/validators/env.validator.ts`
  - `src/common/filters/api-exception.filter.ts`

### fix 000032 - Add lint, test, and GitHub Actions CI

- Added ESLint configuration using the modern flat config format.
- Added lint scripts:
  - `npm run lint`
  - `npm run lint:fix`
- Added Jest test configuration.
- Added a dedicated `tsconfig.spec.json` for Jest tests.
- Added initial unit tests for `HealthService`.
- Added CI script:
  - `npm run ci`
- Added GitHub Actions workflow:
  - `.github/workflows/backend-ci.yml`
- CI runs:
  - dependency install
  - Prisma Client generation
  - lint
  - unit tests
  - build
- Configured CI test environment variables for backend startup/build validation.
- Added PostgreSQL service container for future DB-backed tests.
- No Prisma schema migration was required.
- Important changed or new files:
  - `package.json`
  - `package-lock.json`
  - `eslint.config.mjs`
  - `jest.config.cjs`
  - `tsconfig.spec.json`
  - `test/health/health.service.spec.ts`
  - `.github/workflows/backend-ci.yml`

### fix 000033 - Add opportunity line items and product catalog

- Added product catalog data model:
  - `ProductCatalogItem`
- Added opportunity line item data model:
  - `OpportunityLineItem`
- Connected opportunity line items to:
  - `Opportunity`
  - `ProductCatalogItem`
- Added product snapshots on line items:
  - `productCodeSnapshot`
  - `productNameSnapshot`
- Added financial line item fields:
  - `quantity`
  - `unitPrice`
  - `discountAmount`
  - `taxAmount`
  - `lineTotal`
- Added automatic line total calculation.
- Added automatic recalculation of `Opportunity.estimatedValue` from line items.
- Added product catalog API:
  - `GET /api/product-catalog`
  - `POST /api/product-catalog`
  - `GET /api/product-catalog/:id`
  - `PATCH /api/product-catalog/:id`
  - `PATCH /api/product-catalog/:id/activate`
  - `PATCH /api/product-catalog/:id/deactivate`
- Added opportunity line item API:
  - `GET /api/opportunities/:opportunityId/line-items`
  - `POST /api/opportunities/:opportunityId/line-items`
  - `GET /api/opportunities/:opportunityId/line-items/:lineItemId`
  - `PATCH /api/opportunities/:opportunityId/line-items/:lineItemId`
  - `DELETE /api/opportunities/:opportunityId/line-items/:lineItemId`
- Added permissions:
  - `product:view`
  - `product:manage`
  - `opportunity-line-item:view`
  - `opportunity-line-item:manage`
- Updated opportunity detail response to include line items.
- Added audit logs for product catalog and opportunity line item changes.
- Important changed or new files:
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `src/product-catalog/dto/create-product-catalog-item.dto.ts`
  - `src/product-catalog/dto/update-product-catalog-item.dto.ts`
  - `src/product-catalog/dto/find-product-catalog-items.dto.ts`
  - `src/product-catalog/product-catalog.controller.ts`
  - `src/product-catalog/product-catalog.service.ts`
  - `src/product-catalog/product-catalog.module.ts`
  - `src/opportunities/dto/create-opportunity-line-item.dto.ts`
  - `src/opportunities/dto/update-opportunity-line-item.dto.ts`
  - `src/opportunities/opportunity-line-items.controller.ts`
  - `src/opportunities/opportunity-line-items.service.ts`
  - `src/opportunities/opportunities.module.ts`
  - `src/opportunities/opportunities.service.ts`
  - `src/app.module.ts`

### fix 000034 - Add proposal, proforma, contract, and payment tracking

- Added commercial document tracking for opportunities.
- Added supported commercial document types:
  - `PROPOSAL`
  - `PROFORMA`
  - `CONTRACT`
- Added commercial document lifecycle statuses:
  - `DRAFT`
  - `SENT`
  - `ACCEPTED`
  - `REJECTED`
  - `SIGNED`
  - `CANCELLED`
  - `EXPIRED`
- Added payment tracking for opportunities.
- Added payment statuses:
  - `PENDING`
  - `PARTIAL`
  - `PAID`
  - `OVERDUE`
  - `CANCELLED`
  - `REFUNDED`
- Added payment methods:
  - `BANK_TRANSFER`
  - `CASH`
  - `CHECK`
  - `CARD`
  - `OTHER`
- Added commercial document API:
  - `GET /api/opportunities/:opportunityId/commercial-documents`
  - `POST /api/opportunities/:opportunityId/commercial-documents`
  - `GET /api/opportunities/:opportunityId/commercial-documents/:documentId`
  - `PATCH /api/opportunities/:opportunityId/commercial-documents/:documentId`
  - `PATCH /api/opportunities/:opportunityId/commercial-documents/:documentId/status`
  - `DELETE /api/opportunities/:opportunityId/commercial-documents/:documentId`
- Added payment API:
  - `GET /api/opportunities/:opportunityId/payments`
  - `POST /api/opportunities/:opportunityId/payments`
  - `GET /api/opportunities/:opportunityId/payments/:paymentId`
  - `PATCH /api/opportunities/:opportunityId/payments/:paymentId`
  - `PATCH /api/opportunities/:opportunityId/payments/:paymentId/mark-paid`
  - `PATCH /api/opportunities/:opportunityId/payments/:paymentId/cancel`
  - `DELETE /api/opportunities/:opportunityId/payments/:paymentId`
- Added permissions:
  - `commercial-document:view`
  - `commercial-document:manage`
  - `payment:view`
  - `payment:manage`
- Updated opportunity detail response to include:
  - `commercialDocuments`
  - `payments`
- Added audit logs for document and payment changes.
- Important changed or new files:
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `src/opportunities/dto/create-commercial-document.dto.ts`
  - `src/opportunities/dto/update-commercial-document.dto.ts`
  - `src/opportunities/dto/change-commercial-document-status.dto.ts`
  - `src/opportunities/dto/find-commercial-documents.dto.ts`
  - `src/opportunities/dto/create-opportunity-payment.dto.ts`
  - `src/opportunities/dto/update-opportunity-payment.dto.ts`
  - `src/opportunities/dto/mark-payment-paid.dto.ts`
  - `src/opportunities/dto/find-opportunity-payments.dto.ts`
  - `src/opportunities/opportunity-commercial-documents.controller.ts`
  - `src/opportunities/opportunity-commercial-documents.service.ts`
  - `src/opportunities/opportunity-payments.controller.ts`
  - `src/opportunities/opportunity-payments.service.ts`
  - `src/opportunities/opportunities.module.ts`
  - `src/opportunities/opportunities.service.ts`

### fix 000035 - Add secure file attachments with Local and MinIO-ready storage

- Added secure file attachment support for CRM entities.
- Added attachment entity types:
  - `OPPORTUNITY`
  - `COMMERCIAL_DOCUMENT`
  - `PAYMENT`
- Added storage provider enum:
  - `LOCAL`
  - `MINIO`
- Added `FileAttachment` model for storing attachment metadata.
- Attachment binary content is stored outside PostgreSQL.
- PostgreSQL stores only attachment metadata, including:
  - entity type
  - entity ID
  - storage provider
  - bucket
  - object key
  - local storage path
  - original file name
  - stored file name
  - MIME type
  - file size
  - SHA-256 hash
  - uploader
  - soft-delete metadata
- Added storage abstraction for attachments.
- Added local filesystem storage implementation.
- Added MinIO/S3-compatible storage implementation using AWS SDK v3.
- Added secure attachment APIs:
  - `GET /api/attachments`
  - `POST /api/attachments`
  - `GET /api/attachments/:id`
  - `GET /api/attachments/:id/download`
  - `DELETE /api/attachments/:id`
- Attachment upload and download are protected by:
  - JWT authentication
  - permission checks
  - scoped entity access checks
- Added scoped access validation for:
  - opportunity attachments
  - commercial document attachments
  - payment attachments
- Added upload validation:
  - maximum file size
  - allowed MIME types
  - empty file rejection
- Added standardized Multer upload error handling in the global API exception filter.
- Added audit logs for:
  - attachment upload
  - attachment download
  - attachment soft delete
- Added attachment permissions:
  - `attachment:view`
  - `attachment:manage`
- Added optional environment variables:
  - `ATTACHMENT_STORAGE_DRIVER`
  - `ATTACHMENT_STORAGE_ROOT`
  - `MAX_ATTACHMENT_SIZE_BYTES`
  - `ALLOWED_ATTACHMENT_MIME_TYPES`
  - `S3_ENDPOINT`
  - `S3_REGION`
  - `S3_BUCKET`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_FORCE_PATH_STYLE`
- Updated Docker Compose with:
  - MinIO service
  - MinIO console
  - MinIO bucket initialization service
  - API MinIO environment configuration
- Updated `.gitignore` to exclude local stored attachments.
- Important changed or new files:
  - `package.json`
  - `package-lock.json`
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `src/attachments/dto/upload-attachment.dto.ts`
  - `src/attachments/dto/find-attachments.dto.ts`
  - `src/attachments/storage/attachment-storage.types.ts`
  - `src/attachments/storage/local-attachment-storage.service.ts`
  - `src/attachments/storage/minio-attachment-storage.service.ts`
  - `src/attachments/attachments.controller.ts`
  - `src/attachments/attachments.service.ts`
  - `src/attachments/attachments.module.ts`
  - `src/app.module.ts`
  - `src/common/validators/env.validator.ts`
  - `src/common/filters/api-exception.filter.ts`
  - `docker-compose.yml`
  - `.gitignore`

### fix 000036 - Add dedicated task management

- Added dedicated task management separate from activity follow-ups.
- Added `TaskStatus` enum:
  - `TODO`
  - `IN_PROGRESS`
  - `DONE`
  - `CANCELLED`
- Added `Task` model with:
  - title
  - description
  - status
  - priority
  - due date
  - reminder date
  - assignment
  - creator
  - completion metadata
  - cancellation metadata
- Added task links to CRM entities:
  - company
  - person
  - opportunity
  - commercial document
  - payment
- Added task relations to:
  - `User`
  - `Company`
  - `Person`
  - `Opportunity`
  - `OpportunityCommercialDocument`
  - `OpportunityPayment`
- Added task APIs:
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `GET /api/tasks/:id`
  - `PATCH /api/tasks/:id`
  - `PATCH /api/tasks/:id/status`
  - `PATCH /api/tasks/:id/assign`
  - `PATCH /api/tasks/:id/complete`
  - `PATCH /api/tasks/:id/reschedule`
  - `DELETE /api/tasks/:id`
- Added task filters:
  - status
  - priority
  - assigned user
  - creator
  - company
  - person
  - opportunity
  - commercial document
  - payment
  - due date range
  - search
- Added scoped task visibility by role:
  - ADMIN can access all tasks.
  - MANAGER can access team-related tasks.
  - REP can access assigned, created, and owned-entity tasks.
  - BOARDS can view tasks only.
- Added task audit logs for:
  - create
  - update
  - status change
  - assign
  - complete
  - reschedule
  - delete
- Added task permissions:
  - `task:view`
  - `task:create`
  - `task:update`
  - `task:assign`
  - `task:complete`
  - `task:delete`
- Updated opportunity detail response to include task count and task list.
- Important changed or new files:
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `src/tasks/dto/create-task.dto.ts`
  - `src/tasks/dto/update-task.dto.ts`
  - `src/tasks/dto/find-tasks.dto.ts`
  - `src/tasks/dto/change-task-status.dto.ts`
  - `src/tasks/dto/assign-task.dto.ts`
  - `src/tasks/dto/complete-task.dto.ts`
  - `src/tasks/dto/reschedule-task.dto.ts`
  - `src/tasks/tasks.controller.ts`
  - `src/tasks/tasks.service.ts`
  - `src/tasks/tasks.module.ts`
  - `src/opportunities/opportunities.service.ts`

### fix 000037 - Add notification center

- Added internal notification center.
- Added notification enums:
  - `NotificationType`
  - `NotificationPriority`
  - `NotificationEntityType`
- Added `Notification` model.
- Added notification relations to `User`:
  - received notifications
  - actor notifications
- Added notification APIs:
  - `GET /api/notifications`
  - `GET /api/notifications/unread-count`
  - `POST /api/notifications`
  - `GET /api/notifications/:id`
  - `PATCH /api/notifications/read-all`
  - `PATCH /api/notifications/:id/read`
  - `PATCH /api/notifications/:id/unread`
  - `PATCH /api/notifications/:id/archive`
  - `PATCH /api/notifications/:id/unarchive`
  - `DELETE /api/notifications/:id`
- Added notification filters:
  - type
  - priority
  - entity type
  - entity ID
  - read/unread status
  - archived state
  - search
- Added unread notification count endpoint.
- Added manual internal notification sending API.
- Added notification permissions:
  - `notification:view`
  - `notification:manage`
  - `notification:send`
- Added notification audit logs for:
  - create
  - read
  - unread
  - read all
  - archive
  - unarchive
  - delete
- Integrated notification center with dedicated task management:
  - task assignment notification
  - task completion notification
  - task reschedule notification
- Important changed or new files:
  - `prisma/schema.prisma`
  - `prisma/seed.ts`
  - `src/notifications/dto/create-notification.dto.ts`
  - `src/notifications/dto/find-notifications.dto.ts`
  - `src/notifications/dto/read-all-notifications.dto.ts`
  - `src/notifications/notifications.controller.ts`
  - `src/notifications/notifications.service.ts`
  - `src/notifications/notifications.module.ts`
  - `src/tasks/tasks.module.ts`
  - `src/tasks/tasks.service.ts`
  - `src/app.module.ts`

---

### fix 000038 - Add tenant/organization foundation

- Added a clean tenant foundation with `OrganizationStatus`, `Organization`, and one `organizationId` relation/index set on core tenant-owned models: `User`, `Company`, `Opportunity`, `Task`, `Notification`, `FileAttachment`, and nullable `AuditLog`.
- Added migration `20260710203701_add_tenant_organization_foundation`.
- Migration requirement: run `npx prisma migrate dev` locally or `npx prisma migrate deploy` in deployed environments. The migration creates `organizations`, inserts the default organization, backfills existing core records, adds indexes, and then adds foreign keys.
- Added default organization `00000000-0000-4000-8000-000000000001` with code `default`, name `Default Organization`, timezone `Asia/Tehran`, and locale `fa-IR`.
- Updated auth/JWT current user payloads to carry `organizationId`.
- Added tenant helpers: `src/common/tenant/default-organization.constants.ts` and `src/common/tenant/tenant-scope.util.ts`.
- Added organization APIs: `GET /api/organizations/current`, `GET /api/admin/organizations`, `POST /api/admin/organizations`, `GET /api/admin/organizations/:id`, `PATCH /api/admin/organizations/:id`, `PATCH /api/admin/organizations/:id/activate`, and `PATCH /api/admin/organizations/:id/suspend`.
- Added permissions `organization:view` and `organization:manage`.
- Updated seed to upsert the default organization, assign seeded users to it, and grant organization view/manage permissions by role.
- Added tenant scoping foundation to companies, opportunities, tasks, notifications, and attachments while preserving existing role/team/owner visibility rules.
- Updated audit logging to optionally record `organizationId`.
- Important changed or new files: `prisma/schema.prisma`, `prisma/migrations/20260710203701_add_tenant_organization_foundation/migration.sql`, `prisma/seed.ts`, `src/auth/auth.service.ts`, `src/auth/jwt.strategy.ts`, `src/common/decorators/current-user.decorator.ts`, `src/common/tenant/*`, `src/organizations/*`, `src/companies/companies.service.ts`, `src/opportunities/opportunities.service.ts`, `src/tasks/tasks.service.ts`, `src/notifications/notifications.service.ts`, `src/attachments/attachments.service.ts`, and `src/audit-log/audit-log.service.ts`.
- Assumptions: existing `User.email @unique` remains global for now; this is only the foundation, and full tenant scoping for library/configuration models will be handled later.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed; `npm run build` passed; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run test` passed with 1 suite and 4 tests.

---

### fix 000039 - Clarify department, job title, and sales persona fields for people

- Clarified the semantic separation of person/contact fields:
  - `department` represents the organizational department or business unit.
  - `title` represents the organizational position or job title.
  - `personaTag` represents the buying role within the sales process.
  - `seniorityLevel` represents organizational seniority.
- Added clearer API-compatible aliases: `jobTitle` maps to `title`, and `personaRole` maps to `personaTag`.
- Updated People API responses to return the `jobTitle` and `personaRole` aliases alongside the legacy fields.
- Added Global People Directory filters for `jobTitle`, `personaRole`, and `seniorityLevel`.
- Added the `job-titles` and `persona-roles` lookup groups.
- Expanded the existing `departments` and `seniority-levels` lookup groups.
- Preserved the `persona-tags` group for backward compatibility and continued seeding it with the same buying-role values.
- Stopped seeding job-title values such as `CEO`, `CIO`, `CISO`, and `IT_MANAGER` as sales personas; these values now belong to `job-titles`.
- Preserved Persona Library as a strategic content library based on role patterns rather than replacing or merging it with the person form fields.
- Added migration `20260712120000_separate_person_domain_lookups` to upsert department, job-title, seniority-level, and buying-role lookup values.
- The migration is non-destructive: when `title` is empty and `personaTag` resembles a job title, it copies that value to `title` without removing the legacy `personaTag` value.
- Important changed or new files: `prisma/seed.ts`, `prisma/migrations/20260712120000_separate_person_domain_lookups/migration.sql`, `src/lookups/lookup-groups.ts`, `src/lookups/lookups.service.ts`, `src/people/dto/create-person.dto.ts`, `src/people/dto/find-people-directory.dto.ts`, `src/people/people.service.ts`, and `README.md`.
- Frontend dependency: use the `departments`, `job-titles`, `persona-roles`, and `seniority-levels` groups for the new dropdowns. The `JOB_TITLES`, `POSITIONS`, `PERSONA_ROLES`, and `SENIORITY_LEVELS` aliases also map to the canonical slugs. Lookup endpoints return active options by default.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed; `npm run build` passed; `npm run lint` passed with 10 existing non-blocking warnings; `npm run test` passed with 1 suite and 4 tests.

---

### fix 000040 - Complete and clarify opportunity definition fields

- Clarified the domain distinction between `Company.source` and the source that created a sales opportunity:
  - `Company.source` / `sourceId` continues to represent how the company or lead entered the CRM.
  - `Opportunity.sourceOptionId` / `sourceOption` represents how the specific sales opportunity was created.
  - `Opportunity.source` remains as a backward-compatible text snapshot.
- Added the `opportunity-sources` lookup group and mapped the `OPPORTUNITY_SOURCES` alias to it.
- Seeded default opportunity-source values: `CUSTOMER_REQUEST`, `DEMO_MEETING`, `DISCOVERY_MEETING`, `UPSELL`, `CROSS_SELL`, `RENEWAL`, `RFP_TENDER`, `PARTNER_REFERRAL`, `INTERNAL_REFERRAL`, `CAMPAIGN_FOLLOWUP`, and `OTHER`.
- Added optional Opportunity fields: `sourceOptionId`, `primaryContactId`, `probability`, and `competitor`.
- Restricted `primaryContactId` to contacts belonging to the same company as the opportunity.
- Kept `probability` optional and constrained it to the 0–100 range in both the DTO and migration.
- Opportunity create/update operations continue to accept the legacy `source` field. When its value matches an opportunity-source lookup option, `sourceOptionId` is populated; otherwise, the legacy text value is preserved.
- Updated Opportunity list/detail responses to include `sourceOption` and `primaryContact` summaries.
- Added Opportunity filters for `source`, `opportunitySource`, `sourceOptionId`, `primaryContactId`, `expectedCloseFrom`, and `expectedCloseTo`.
- Added migration `20260712123000_clarify_opportunity_definition_fields` with the new nullable columns, opportunity-source lookup values, safe `sourceOptionId` backfill from `source`, indexes, and foreign keys.
- No legacy data was deleted or renamed. When `Opportunity.source` contains a lead-source value that does not match an opportunity-source option, it remains as legacy text and requires an explicit manual decision or backfill.
- Related products continue to appear in Opportunity detail through the existing line-item and `ProductCatalogItem` flow. A direct Opportunity-to-Use Case relation was not added in this fix and remains a future enhancement.
- Important changed or new files: `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/20260712123000_clarify_opportunity_definition_fields/migration.sql`, `src/lookups/lookup-groups.ts`, `src/lookups/lookups.service.ts`, `src/opportunities/dto/create-opportunity.dto.ts`, `src/opportunities/dto/update-opportunity.dto.ts`, `src/opportunities/dto/find-opportunities.dto.ts`, `src/opportunities/opportunities.service.ts`, and `README.md`.
- Frontend dependency: use `/api/lookups/opportunity-sources` or the `OPPORTUNITY_SOURCES` alias for the opportunity-source dropdown. The existing `estimatedValue` and `expectedCloseDate` field names remain unchanged.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed; `npm run build` passed; `npm run lint` passed with 10 existing non-blocking warnings; `npm run test` passed with 1 suite and 4 tests.

---

### fix 000041 - Standardize date contracts for Jalali date display in the frontend

- Reviewed all Prisma `DateTime` fields and did not convert any field from `DateTime` to `String` for Jalali date display support.
- Moved date input validation for activity, task, opportunity, commercial document, payment, report, and audit-log DTOs to the shared `IsApiDateString` validator.
- The API continues to accept Gregorian ISO 8601 values or `YYYY-MM-DD` for business/date-only fields. Jalali/Persian strings such as `۱۴۰۳/۰۵/۲۰` are invalid and must not be sent to the backend.
- Normalized `YYYY-MM-DD` values to UTC midnight for persistence to reduce timezone and off-by-one errors.
- Date-range filters with a date-only `to` value use an exclusive upper bound on the following day. For example, `dueTo=2026-07-12` covers the entire day of July 12, 2026.
- Jalali conversion remains exclusively a frontend responsibility. The frontend must convert a date selected in a Jalali UI to Gregorian `YYYY-MM-DD` or an ISO date-time value before sending it to the backend.
- API responses were not converted to Jalali strings; `DateTime` values continue to use standard serialization.
- The SAM Excel import did not contain a parsable business-date field, so import/export behavior was unchanged.
- No migration was required; the Prisma schema and database column types remained unchanged.
- Important changed or new files:
  - `src/common/dates/api-date.util.ts`
  - `src/common/validators/api-date-string.validator.ts`
  - `src/activities/dto/*` and `src/activities/activities.service.ts`
  - `src/tasks/dto/*` and `src/tasks/tasks.service.ts`
  - `src/opportunities/dto/*`
  - `src/opportunities/opportunities.service.ts`
  - `src/opportunities/opportunity-commercial-documents.service.ts`
  - `src/opportunities/opportunity-payments.service.ts`
  - `src/reports/dto/report-filters.dto.ts`
  - `src/reports/reports.service.ts`
  - `src/audit-log/dto/find-audit-logs.dto.ts`
  - `src/audit-log/audit-log.service.ts`
  - `test/api-date.util.spec.ts`
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed; `npm run lint` passed with 10 existing non-blocking warnings; `npm run test` passed with 2 suites and 9 tests; `npm run build` passed.
- Non-blocking warning: `npx prisma validate` reported that a new Prisma major version was available; this was an informational message, not an error.

---

### fix 000042 - Review the date and time contract for the frontend Jalali date picker

- Reviewed date/time input DTOs for activities, tasks, opportunities, payments, commercial documents, reports, and audit logs. The contract remains based on `IsApiDateString` and Gregorian `YYYY-MM-DD` or ISO 8601 date-time values.
- Database persistence remained unchanged: no `DateTime` field was converted to `String`, and no Jalali/Persian string was introduced into persistence.
- API responses remain machine-readable, and Jalali conversion/display remains a frontend responsibility.
- Applied a minimal correction to activity reports: when `endDate` is date-only, the database filter still uses the exclusive upper bound of the following day, while response metadata returns the original selected Gregorian date to prevent frontend display off-by-one errors.
- Added a unit test proving that `endDate=2026-07-12` becomes `lt: 2026-07-13T00:00:00.000Z` in the query while response metadata retains `2026-07-12T00:00:00.000Z`.
- Under the current convention, business/date-only fields such as `expectedCloseDate`, payment `dueDate`, document `validUntil`, and report range endpoints accept `YYYY-MM-DD`. True date-time fields such as `reminderAt`, `paidAt`, `sentAt`, `acceptedAt`, `rejectedAt`, `signedAt`, and lifecycle timestamps also accept ISO date-time values.
- Important changed files:
  - `src/reports/reports.service.ts`
  - `test/reports.service.spec.ts`
  - `README.md`
- Frontend dependency: the Jalali date picker must convert the selected value to Gregorian `YYYY-MM-DD` for date-only fields or ISO 8601 for date-time fields before sending it to the backend. The backend does not accept Jalali strings such as `1403/05/20`.
- No migration was required; the Prisma schema and database column types remained unchanged.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run test` passed with 3 suites and 10 tests; `npm run build` passed.

---

### fix 000043 - Fix company assignment when creating tasks from opportunities

- Reviewed task create/update behavior so that when `opportunityId` is provided, `companyId` is always derived from `opportunity.companyId` rather than treated as user-controlled source-of-truth data.
- When create/update requests contain incompatible `opportunityId` and `companyId` values, the API returns a `BadRequestException` with the clear message `Task company must match the selected opportunity company.`
- General task creation from the Tasks page continues to support an independent `companyId`, and standalone tasks without a company or opportunity remain valid as before.
- Centralized relationship validation: a person must belong to the task company, and commercial documents and payments must match the same opportunity/company context. Cross-company and cross-opportunity links are rejected.
- Company, opportunity, person, commercial-document, and payment lookups continue to enforce the current organization scope and role visibility. The task `organizationId` continues to be assigned from the current user.
- Task list/detail responses retain the context required by the frontend: company, opportunity, person, commercial-document, and payment summaries remain in `taskInclude`, and `opportunity.archivedAt` was added for internal scope and consistency checks.
- Important changed or new files:
  - `src/tasks/tasks.service.ts`
  - `test/tasks.service.spec.ts`
  - `README.md`
- Frontend dependency: when creating a task inside an Opportunity, sending `opportunityId` is sufficient. Sending `companyId` is optional and accepted only when it matches the opportunity company. General tasks may continue to use `companyId`.
- No migration was required; the schema and existing data remained unchanged, and no data was deleted.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run test` passed with 4 suites and 14 tests; `npm run build` passed.
- Non-blocking warning: `npx prisma validate` reported that a new Prisma major version was available; this was an informational message, not an error.

---

### fix 000044 - Add managed teams and remove dependency on free-text user teams

- Added the `Team` model to Prisma and kept nullable `User.teamId` alongside the legacy `User.team` field. Existing text values were not removed or destructively converted.
- Added migration `20260713120000_add_managed_teams`, which creates the `teams` table, indexes, foreign keys, and a safe backfill from distinct non-empty `users.team` values, then links matching users to the created teams.
- Added the `Teams` module with APIs for team management, activation/deactivation, member listing, and member assignment/removal, protected by `team:view` and `team:manage`.
- Seeded initial teams: `ENTERPRISE_SALES`, `BANKING_SALES`, `PUBLIC_SECTOR_SALES`, and `PARTNER_SALES`. Team permissions are also seeded, and `MANAGER` receives only `team:view`.
- User create/update operations continue to accept the legacy text `team` field but prefer `teamId` for new frontend integrations. When `teamId` is supplied, only an active team in the current organization can be assigned, and the legacy `team` value is synchronized with `team.code`.
- Extended authentication and current-user payloads with `teamId`, `teamCode`, and `teamName`, while preserving the legacy `team` field for compatibility.
- Updated manager visibility across users, companies, opportunities, tasks, reports, and related resources to use `teamId` with a fallback to legacy `team`, preventing cross-team leakage or unintended access loss during the transition.
- Report filters and options now use managed teams as the primary source while retaining remaining legacy values for compatibility. The `teams` filter accepts a managed team ID, code, name, or legacy value.
- Preserved the legacy `teams` lookup group only as a compatibility path. The Teams API is now the source of truth for team management.
- Important changed or new files:
  - `prisma/schema.prisma`
  - `prisma/migrations/20260713120000_add_managed_teams/migration.sql`
  - `prisma/seed.ts`
  - `src/teams/*`
  - `src/common/tenant/team-scope.util.ts`
  - `src/users/*`
  - `src/auth/auth.service.ts`
  - `src/auth/jwt.strategy.ts`
  - `src/companies/companies.service.ts`
  - `src/opportunities/*`
  - `src/tasks/tasks.service.ts`
  - `src/reports/reports.service.ts`
  - `src/people/people.service.ts`
  - `src/activities/activities.service.ts`
  - `src/notifications/notifications.service.ts`
- Frontend dependency: new forms should send `teamId` for team assignment. Team names and codes can be read from user responses or `/api/teams`. The text `team` field remains only for legacy-client compatibility.
- Migration requirement: this migration is required and non-destructive. Deploy migrations must run before releasing the new APIs. Legacy `users.team` values are not removed or cleaned up.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed; `npm run build` passed; `npm run lint` passed with 10 existing warnings and 0 errors.
- Unit and live API tests were not run.

---

### fix 000045 - Fix access permissions for the Teams module

- Reviewed `TeamsController`; all team endpoints remain protected by `JwtAuthGuard` and `PermissionsGuard` and were not made public or bypassed.
- Verified the team access decorators:
  - Listing teams, viewing team details, and viewing members require `team:view`.
  - Creating, updating, activating/deactivating, and adding/removing members require `team:manage`.
- Updated the permission seed so `team:view` and `team:manage` are created or updated with the appropriate view/manage descriptions.
- Added non-destructive data migration `20260714120000_fix_team_permissions` to create or update `team:view` and `team:manage` in existing databases, grant both permissions to `ADMIN`, and grant `team:view` to `MANAGER`.
- `REP` and `BOARDS` did not receive team permissions in this fix, so regular users without the required permission continue to receive HTTP 403 responses.
- Reviewed Auth/JWT behavior: permissions are returned in the login response for the frontend, while `PermissionsGuard` reads permissions from the database-backed role cache. Users should log in again after migration/seed execution so the UI receives the new permissions.
- Cache note: the internal `PermissionsGuard` cache has a 10-minute TTL. After running the migration/seed in an active process, restarting the service or waiting for cache expiration may be necessary to clear cached HTTP 403 results.
- Frontend dependency: `GET /api/teams?includeInactive=true` requires `team:view`, and `POST /api/teams` requires `team:manage`. After migration/seed execution, `ADMIN` has both permissions.
- Important changed or new files:
  - `prisma/seed.ts`
  - `prisma/migrations/20260714120000_fix_team_permissions/migration.sql`
  - `README.md`
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run build` passed.
- Non-blocking warning: `npx prisma generate` reported that a new Prisma major version was available; this was an informational message, not an error.

---

### fix 000046 - Fix `includeInactive` validation in the team list

- Updated the team-list DTO to recognize the new `includeInactive` query parameter and correctly parse boolean values submitted as strings.
- Accepted `includeInactive` values are `true`, `false`, `1`, and `0`; invalid values continue to return an HTTP 400 validation error.
- The HTTP 400 occurred because the frontend sent `includeInactive=true`, while the previous DTO defined only `isActive`; the strict `ValidationPipe` rejected the unknown parameter.
- Updated team-list service behavior: active teams are returned by default, while `includeInactive=true` returns both active and inactive teams. The explicit `isActive` filter remains supported.
- Important changed files:
  - `src/teams/dto/find-teams.dto.ts`
  - `src/teams/teams.service.ts`
  - `README.md`
- Frontend dependency: the existing `GET /api/teams?includeInactive=true` request is now valid without frontend changes.
- Prisma Client generation was not required and was not run; `npx prisma validate` passed.
- Validation status: `npm run lint` passed with 10 existing warnings and 0 errors; `npm run build` passed.

---

### fix 000047 - Add MinIO-backed commercial document file uploads

- Extended commercial-document creation to support actual file uploads through `multipart/form-data` in addition to the legacy `fileUrl` field.
- Added endpoint: `POST /api/opportunities/:opportunityId/commercial-documents/upload`
  - File field: `file`
  - Metadata fields follow the existing `CreateCommercialDocumentDto` contract, including `type`, `title`, `status`, `amount`, `validUntil`, `externalRef`, and `notes`.
- The backend receives the file and stores it through the existing `AttachmentsService` infrastructure using the project's configured storage. When `ATTACHMENT_STORAGE_DRIVER=minio`, storage uses MinIO or another S3-compatible service.
- Registered each uploaded file as a `FileAttachment` with `entityType=COMMERCIAL_DOCUMENT` and `entityId=document.id`. Stored metadata includes the original and stored file names, bucket/object key or local path, MIME type, size, SHA-256 hash, uploader, and `organizationId`.
- The new endpoint response includes the commercial document and a `fileAttachment` summary. Secure downloads continue through `GET /api/attachments/:id/download`; MinIO credentials are never exposed to the frontend.
- Preserved the legacy `fileUrl` contract and the existing JSON endpoint for link-based documents and legacy data.
- Reused attachment validation for file-size limits, empty-file rejection, allowed MIME types, organization scope, and permissions. Default MIME-type support was expanded for PDF, PNG/JPEG, Word, and Excel files.
- If file upload fails after document creation, the newly created document is rolled back/deleted so the upload endpoint does not leave a document record without its file.
- Important changed files:
  - `src/attachments/attachments.module.ts`
  - `src/attachments/attachments.service.ts`
  - `src/opportunities/opportunities.module.ts`
  - `src/opportunities/opportunity-commercial-documents.controller.ts`
  - `src/opportunities/opportunity-commercial-documents.service.ts`
  - `README.md`
- Frontend dependency: the Add Document form must use `multipart/form-data` with a `file` field for actual uploads. Direct uploads from the frontend to MinIO are neither required nor permitted.
- No migration was required; the existing `FileAttachment` schema is used to associate files with commercial documents.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run build` passed after one retry caused by a temporary lock on `dist/tsconfig.tsbuildinfo`.
- Non-blocking warning: `npx prisma generate` reported that a new Prisma major version was available; this was an informational message, not an error.

---

### fix 000048 - Fix downloads for attachments stored in MinIO

- Reviewed and fixed `GET /api/attachments/:id/download` so files stored in MinIO are downloaded securely through the backend as a stream.
- The download flow now passes the bucket stored in `FileAttachment.bucket` to the storage adapter. Downloads therefore continue to use the correct bucket even when it differs from the current configuration value.
- Expected MinIO/S3 errors such as `NoSuchKey`, `NotFound`, `NoSuchBucket`, and HTTP 404 responses are converted to `NotFoundException` instead of returning generic HTTP 500 errors.
- Unexpected storage errors are logged on the server and returned as controlled `ServiceUnavailableException` responses. Credentials and sensitive MinIO details are not exposed to the frontend.
- Attachments without a stored object key are rejected with `BadRequestException`, preventing legacy or link-only records from being read incorrectly from MinIO.
- Updated the `Content-Disposition` header to support Persian/non-ASCII file names and names containing spaces by using a safe ASCII fallback and UTF-8 `filename*` value.
- Existing organization scope and permissions remain unchanged: attachments are still resolved using the current user's `organizationId`, and related entity access is verified before streaming.
- Important changed files:
  - `src/attachments/attachments.controller.ts`
  - `src/attachments/attachments.service.ts`
  - `src/attachments/storage/attachment-storage.types.ts`
  - `src/attachments/storage/minio-attachment-storage.service.ts`
  - `README.md`
- Frontend dependency: downloads must continue through the backend endpoint `/api/attachments/:id/download`. The frontend must not use a direct MinIO URL or credentials.
- No migration was required; the schema was unchanged. `npx prisma generate` was run successfully to synchronize the local Prisma Client.
- Validation status: `npx prisma validate` passed; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run build` passed after `npx prisma generate`.

---

### fix 000049 - اصلاح آپلود فایل سند تجاری با multipart/form-data

- Updated the commercial-document upload contract for `POST /api/opportunities/:opportunityId/commercial-documents/upload` so the multipart file field remains `file`, while metadata is validated with an upload-specific DTO.
- Fixed the likely HTTP 400 cause for browser `FormData`: optional empty strings are now normalized before validation, numeric and boolean multipart fields are parsed, and frontend aliases such as `documentType`, `issueDate`, `dueDate`, `expiresAt`, `externalUrl`, and `isSigned` are accepted for the upload endpoint.
- Kept `fileUrl`/`externalUrl` optional for legacy/link metadata. The upload endpoint no longer depends on a file URL when a real file is submitted.
- Added pre-create validation for the uploaded file so missing files return `Document file is required.` and unsupported MIME types return `Unsupported document file type.` before any document record is created.
- The upload flow still uses the existing opportunity scoping, `commercial-document:manage` permission, `AttachmentsService`, and `FileAttachment`/storage integration. MinIO credentials are not exposed, and the existing secure attachment download flow remains the frontend path for retrieving uploaded files.
- Important changed or new files:
  - `src/opportunities/dto/upload-commercial-document.dto.ts`
  - `src/opportunities/opportunity-commercial-documents.controller.ts`
  - `src/opportunities/opportunity-commercial-documents.service.ts`
  - `README.md`
- Frontend dependency: submit `multipart/form-data` to `/api/opportunities/:opportunityId/commercial-documents/upload` with a `file` field and metadata fields such as `type` or `documentType`, `title`, `amount`, and ISO/Gregorian date strings.
- No migration was required; the schema and existing document/link data were unchanged.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed and was needed to refresh the stale local Prisma Client; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run build` passed after generation.

---

### fix 000050 - رفع دانلود فایل‌های پیوست از MinIO

- Hardened `GET /api/attachments/:id/download` so a successful object-storage read is not turned into an HTTP 500 by a download audit-log write failure.
- Download audit logging is now best-effort for this endpoint: failures are logged server-side, while the already-authorized file stream can still be returned to the user.
- Expanded MinIO/S3-compatible not-found detection for download reads. Generic S3 404 responses and additional object/bucket missing error codes are now converted to `NotFoundException` instead of leaking as unexpected storage failures.
- The download path continues to resolve the attachment in the current organization scope, validate related entity access, require a stored `objectKey`, and read using the stored `bucket` plus `objectKey`.
- Response headers remain backend-controlled and safe for private storage: `Content-Type`, `Content-Length`, and RFC 5987-compatible `Content-Disposition` are set without exposing MinIO credentials or private object keys.
- Important changed files:
  - `src/attachments/attachments.service.ts`
  - `src/attachments/storage/minio-attachment-storage.service.ts`
  - `README.md`
- Frontend dependency: continue downloading through `/api/attachments/:id/download`; do not use direct MinIO URLs.
- No migration was required; the schema was unchanged.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed and was needed to refresh the stale local Prisma Client before build; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run build` passed after generation.

---

### fix 000051 - رفع دانلود فایل‌های پیوست با عبور StreamableFile از پاسخ استاندارد

- Fixed the binary download response path by making `ApiResponseInterceptor` pass through `StreamableFile` payloads unchanged.
- Cause of the HTTP 500: the global `ApiResponseInterceptor` wrapped every payload as JSON (`{ success: true, data: payload }`), which is correct for normal APIs but breaks NestJS file streaming responses.
- Normal JSON responses, paginated responses, and already-standard responses keep the existing standardized API envelope.
- Updated CORS exposed headers so the frontend can read download metadata: `x-request-id`, `Content-Disposition`, `Content-Length`, and `Content-Type`.
- Verified the attachment download controller still sets `Content-Type`, `Content-Length`, and RFC 5987-compatible `Content-Disposition`.
- Important changed files:
  - `src/common/interceptors/api-response.interceptor.ts`
  - `src/main.ts`
  - `README.md`
- Frontend dependency: continue using `GET /api/attachments/:id/download`; the frontend can now read `Content-Disposition` to get the filename.
- No migration was required; the schema was unchanged.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed and was needed to refresh the stale local Prisma Client before build; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run build` passed after generation.

---

### fix 000052 - اصلاح Dockerfile بک‌اند برای حذف وابستگی به Alpine apk

- علت خطای build این بود که Dockerfile از `node:20-alpine` و `apk add --no-cache openssl` استفاده می‌کرد و repositoryهای Alpine در زمان build با خطای TLS/`openssl (no such package)` شکست می‌خوردند.
- base imageهای Dockerfile از Alpine به Debian slim تغییر کردند: `node:20-bookworm-slim` برای stageهای build و runtime.
- نصب packageهای runtime/build از `apk` به الگوی امن `apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*` تغییر کرد.
- ساختار multi-stage حفظ شد: نصب dependencyها با `npm ci` در build، اجرای `npx prisma generate`، build NestJS، و نصب dependencyهای runtime با `npm ci --omit=dev`.
- رفتار startup فعلی حفظ شد و کانتینر همچنان قبل از اجرای برنامه `npx prisma migrate deploy` را اجرا می‌کند.
- `.dockerignore` اضافه شد تا `node_modules`, `dist`, `.git`, logها، storage/uploads/cache/tmp و فایل‌های `.env` وارد build context نشوند و حجم context کاهش پیدا کند.
- Prisma schema و migrationها تغییر نکردند و هیچ دستور destructive دیتابیس اجرا نشد.
- فایل‌های مهم تغییرکرده:
  - `Dockerfile`
  - `.dockerignore`
  - `README.md`
- وضعیت بررسی‌ها: `docker compose config --services` اجرا شد؛ نتیجه سرویس‌ها `db`, `minio`, `minio-init`, `api` بود. `docker compose build --no-cache --progress=plain api` موفق شد و build context به حدود `135KB` کاهش یافت. `docker compose up -d` موفق شد. `docker compose ps` کانتینر `iam-crm-backend-api-1` را `Up` نشان داد و `docker logs --tail 120 iam-crm-backend-api-1` شروع موفق NestJS روی پورت `3000` را نشان داد.

---

### fix 000053 - افزودن لاگ تشخیصی امن برای خطاهای 500 بک‌اند

- لاگ سراسری درخواست‌های HTTP به stdout/stderr اضافه شد؛ شامل `requestId`، متد، URL و route، status code، مدت اجرا، IP، هدرهای proxy/browser و body/query/params پاک‌سازی‌شده است.
- فیلتر سراسری خطا بدون تغییر قرارداد پاسخ API توسعه یافت تا نام، پیام و stack trace استثنا را فقط در لاگ سرور همراه context امن درخواست ثبت کند؛ stack trace به client برگردانده نمی‌شود.
- مراحل login شامل دریافت درخواست، نتیجه جست‌وجوی کاربر، رد کاربر غیرفعال/قفل‌شده، نتیجه بررسی رمز، شروع/موفقیت/شکست ساخت token و تنظیم refresh cookie لاگ می‌شوند؛ مقدار password، hash، token و cookie ثبت نمی‌شود.
- تولید `requestId` پیش از CORS و route middleware انجام می‌شود؛ `x-request-id` ورودی استفاده و در نبود آن `crypto.randomUUID()` تولید و در header پاسخ قرار می‌گیرد.
- redaction بازگشتی برای passwordها، tokenها، authorization/cookie، secretها، JWT/API key/private key و ساختارهای nested، array و circular اضافه شد.
- برای IP واقعی پشت Nginx، Express `trust proxy` با مقدار `1` فعال شد.
- فایل‌های تغییرکرده یا جدید مهم: `src/main.ts`، `src/audit-log/audit-log.module.ts`، `src/audit-log/audit-request-context.middleware.ts`، فایل‌های `src/common/logging/`، `src/common/filters/api-exception.filter.ts`، `src/auth/auth.controller.ts`، `src/auth/auth.service.ts` و `README.md`.
- مشاهده لاگ زنده: `docker logs -f iam-crm-backend-api-1`
- نتیجه بررسی: `npm run lint` با 0 خطا و 10 warning موجود موفق شد. build نخست به‌دلیل stale بودن Prisma Client ناموفق بود؛ `npx prisma generate` موفق شد، retry اول build به‌علت lock موقت `dist` با `EBUSY` متوقف شد و retry بعدی `npm run build` موفق بود.
- Docker: سرویس‌های `db`، `minio`، `minio-init` و `api` شناسایی شدند و `docker compose up -d --build api` با موفقیت image را build و کانتینر API را recreate کرد. تست مستقیم login پس از deploy پاسخ 200 گرفت و لاگ امن با requestId و password برابر `[REDACTED]` ثبت شد. تست آدرس frontend/Nginx پاسخ 500 گرفت اما هیچ درخواست متناظری در لاگ backend ثبت نشد؛ بنابراین در این محیط خطای proxy پیش از رسیدن درخواست به backend رخ می‌دهد و بررسی تنظیمات Nginx/frontend لازم است.

---

### fix 000054 - اصلاح مستندسازی و لاگ CORS برای استقرار فرانت production

- علت اصلی خطای login مرورگر این بود که Origin فرانت production یعنی `http://89.42.199.159:8080` در allowlist متغیر `CORS_ORIGINS` بک‌اند وجود نداشت.
- تنظیم لازم برای محیط production: `CORS_ORIGINS=http://localhost:5173,http://89.42.199.159:8080` و `CORS_CREDENTIALS=true`.
- درخواست curl بدون هدر `Origin` ممکن است موفق شود، درحالی‌که مرورگر همان endpoint را به‌دلیل اعمال CORS با خطا مواجه می‌کند؛ بنابراین تست production باید هدر Origin واقعی فرانت را نیز ارسال کند.
- رد شدن Origin اکنون با status 403 و کد `CORS_ORIGIN_REJECTED` پاسخ داده می‌شود و در لاگ سرور Origin ردشده، `requestId`، مسیر درخواست و تعداد/فهرست Originهای مجاز ثبت می‌شود. stack trace به client ارسال نمی‌شود.
- استفاده از `*` همراه `CORS_CREDENTIALS=true` مجاز نیست و باعث توقف امن startup می‌شود؛ CORS، Helmet و validation فعال باقی مانده‌اند.
- مقدار Docker اصلاح شد و تعریف تکراری و متناقض `CORS_CREDENTIALS` از `.env.docker` حذف شد. URL هر فرانت production باید صریحاً در `CORS_ORIGINS` فایل env مورد استفاده Docker قرار گیرد.
- فایل‌های تغییرکرده: `src/main.ts`، `.env.example`، `.env.docker` و `README.md`.
- پس از تغییر env، بازسازی کانتینر بدون build با این دستور انجام می‌شود: `docker compose up -d --force-recreate api`.
- نتیجه بررسی: `npm run lint` با 0 خطا و 10 warning موجود موفق شد. اجرای اولیه `npm run build` به‌دلیل stale بودن Prisma Client با خطاهای type مربوط به مدل Team ناموفق بود؛ پس از اجرای موفق `npx prisma generate`، اجرای مجدد `npm run build` موفق شد.

---

### fix 000055 - افزودن اطلاعات ثبتی، حقوقی و ساختار مالکیتی شرکت‌ها

- فیلدهای اختیاری `registrationNumber`، `nationalId`، `economicCode` و `establishmentDate` به پروفایل شرکت اضافه شدند. ارقام فارسی/عربی ورودی‌های ثبتی و عددی به انگلیسی تبدیل می‌شوند و شناسه‌های حقوقی فقط با طول معقول اعتبارسنجی می‌شوند.
- enum جدید `CompanyActivityStatus` با مقادیر `ACTIVE`، `INACTIVE`، `MERGED` و `UNKNOWN` اضافه شد و از stage، priority و archive فروش مستقل است.
- سرمایه ثبتی با `Decimal(24,2)` و فرض واحد پیش‌فرض ریال ذخیره می‌شود و ورودی آن بدون تبدیل به floating point جاوااسکریپت به `Prisma.Decimal` تبدیل می‌شود. `employeeCount` عدد صحیح نامنفی و اختیاری است.
- رابطه چندوالدی parent/subsidiary با مدل `CompanyHierarchyRelation` اضافه شد. create/update شرکت آرایه‌های اختیاری `parentCompanyIds` و `subsidiaryCompanyIds` را می‌پذیرد؛ شرکت‌های مرتبط باید در organization جاری باشند و self-link، تکرار مستقیم و رابطه معکوس مستقیم رد می‌شوند. جزئیات شرکت `parentCompanies` و `subsidiaryCompanies` را برمی‌گرداند.
- اسناد حقوقی شرکت با نوع‌های `OFFICIAL_GAZETTE` (روزنامه رسمی) و `LATEST_CHANGES` (آخرین تغییرات) اضافه شدند. endpointها: `GET /api/companies/:companyId/legal-documents`، `POST /api/companies/:companyId/legal-documents/upload` با فیلد multipart به نام `file`، `PATCH .../:documentId` و `DELETE .../:documentId`.
- آپلود از storage و validation موجود `AttachmentsService` استفاده می‌کند؛ مسیر، bucket و object key خام در پاسخ سند افشا نمی‌شوند و دانلود از endpoint امن موجود `GET /api/attachments/:id/download` با `attachmentId` انجام می‌شود.
- permission جدیدی اضافه نشد: مشاهده با `company:view` و تغییر/آپلود/حذف با `company:update` محافظت می‌شود. scope سازمان و دسترسی REP/MANAGER حفظ شده است.
- migration جدید: `20260716130000_add_company_legal_registry_hierarchy_fields`. تبدیل BigInt سرمایه به Decimal و تبدیل status متنی قبلی به enum به‌صورت non-destructive انجام می‌شود؛ statusهای ناشناخته به `UNKNOWN` نگاشت می‌شوند.
- فایل‌های مهم تغییرکرده/جدید: `prisma/schema.prisma`، migration بالا، `src/companies/companies.service.ts`، `src/companies/companies.module.ts`، `src/companies/company-legal-documents.controller.ts`، `src/companies/company-legal-documents.service.ts`، DTOهای company/legal document، `src/attachments/attachments.service.ts` و `README.md`.
- فرض‌ها و وابستگی‌ها: currency سرمایه ثبتی ریال است؛ فایل‌ها به تنظیمات فعلی `ATTACHMENT_STORAGE_DRIVER`، `MAX_ATTACHMENT_SIZE_BYTES` و `ALLOWED_ATTACHMENT_MIME_TYPES` وابسته‌اند؛ فیلد legacy تک‌والدی `parentCompanyId` برای سازگاری حذف نشد اما API جدید از جدول relation چندوالدی استفاده می‌کند.
- وضعیت بررسی: `npx prisma format`، `npx prisma validate` و `npx prisma generate` موفق شدند؛ `npm run lint` با 0 خطا و 10 warning موجود موفق شد؛ `npm run build` موفق شد. `npx prisma migrate status` اجرا شد و migration جدید را unapplied نشان داد، همچنین migration دیتابیس `20260710203701_` در فایل‌های local وجود ندارد. به‌دلیل اختلاف history و نامشخص بودن ایمن‌بودن دیتابیس، migration اعمال نشد. تست دستی API نیز بدون اعمال migration اجرا نشد.

---

### fix 000056 - افزودن سوابق شغلی و تحصیلی برای افراد

- سوابق شغلی شرکت‌محور برای هر شخص اضافه شد؛ هر رکورد به یک Company موجود در organization جاری متصل است، نام شرکت را به‌صورت snapshot نگه می‌دارد و برای هر person/company فقط یک رکورد مجاز است.
- هر سابقه شغلی چند سمت با `title`، `startDate`، `endDate`، `isCurrent` و `description` دارد. عنوان خالی رد می‌شود، تاریخ پایان نمی‌تواند قبل از شروع باشد و سمت جاری تاریخ پایان ندارد. این قواعد هم در service و هم با constraint غیرمخرب دیتابیس محافظت می‌شوند.
- سوابق تحصیلی چندگانه با `degree`، `university`، `year` و `description` اضافه شد. حداقل یک فیلد معنادار لازم است و سال اختیاری پس از تبدیل ارقام فارسی/عربی، در بازه معقول 1000 تا 3000 اعتبارسنجی می‌شود.
- endpointهای employment: `GET/POST /api/people/:personId/employment-history`، `PATCH/DELETE /api/people/:personId/employment-history/:employmentId` و endpointهای nested ایجاد/ویرایش/حذف زیر `.../:employmentId/positions`.
- endpointهای education: `GET/POST /api/people/:personId/education-history` و `PATCH/DELETE /api/people/:personId/education-history/:educationId`.
- پاسخ detail شخص اکنون `employmentHistory` همراه summary شرکت و `positions` و همچنین `educationHistory` را شامل می‌شود؛ APIها و نام فیلدهای قبلی Person تغییر نکردند.
- مدل‌های جدید: `PersonEmploymentHistory`، `PersonEmploymentPosition` و `PersonEducationHistory`. migration جدید: `20260716140000_add_person_employment_education_history`.
- permission جدیدی اضافه نشد: مشاهده با `person:view` و ایجاد/ویرایش/حذف با `person:update` انجام می‌شود. scope دسترسی ADMIN/MANAGER/REP و منع دسترسی BOARDS مطابق الگوی فعلی people حفظ شده است.
- فایل‌های مهم تغییرکرده/جدید: `prisma/schema.prisma`، migration بالا، `src/people/person-histories.controller.ts`، `src/people/person-histories.service.ts`، `src/people/dto/person-history.dto.ts`، `src/people/people.module.ts`، `src/people/people.service.ts` و `README.md`.
- وضعیت بررسی: `npx prisma format`، `npx prisma validate` و `npx prisma generate` موفق شدند؛ `npm run lint` با 0 خطا و 10 warning موجود موفق شد؛ `npm run build` پس از اصلاح یک خطای type محلی موفق شد. `npx prisma migrate status` اجرا شد و دو migration محلی `20260716130000_add_company_legal_registry_hierarchy_fields` و `20260716140000_add_person_employment_education_history` را unapplied نشان داد، درحالی‌که migration دیتابیس `20260710203701_` در فایل‌های local وجود ندارد. به‌علت اختلاف migration history، هیچ migration اعمال نشد و تست دستی API اجرا نشد؛ هیچ reset/db push مخربی انجام نشد.

---

### fix 000057 - اصلاح ساختار سوابق تحصیلی و افزودن کتابخانه دانشگاه‌ها

- مدرک تحصیلی از متن آزاد به enum اختیاری `PersonEducationDegree` با مقادیر دقیق `DIPLOMA`، `ASSOCIATE`، `BACHELOR`، `PHD` و `POSTDOC` تغییر کرد؛ مقدار Master's اضافه نشده است. endpoint سوابق تحصیلی علاوه بر enum، `degreeLabel` فارسی را برمی‌گرداند.
- کتابخانه مدیریت‌شده `University` با نام یکتا، code اختیاری یکتا، وضعیت فعال، توضیحات و timestampها اضافه شد. endpointهای `GET /api/universities`، `GET /api/universities/:id`، `POST /api/universities`، `PATCH /api/universities/:id` و `DELETE /api/universities/:id` مطابق الگوی library موجود پیاده شدند؛ DELETE دانشگاه را غیرفعال می‌کند و فهرست عادی فقط دانشگاه‌های فعال را نشان می‌دهد.
- فیلد متن آزاد university با `universityId` و relation اختیاری جایگزین شد. پاسخ education شامل summary دانشگاه (`id` و `name`) است و `universityNameSnapshot` برای حفظ داده تاریخی نگه داشته می‌شود؛ ایجاد/ویرایش رکورد فقط دانشگاه موجود و فعال را می‌پذیرد.
- سال عددی با `educationDate DateTime?` و ورودی ISO/Gregorian date picker جایگزین شد. DTO جدید فقط `degree` enum، `universityId` UUID، `educationDate` معتبر و `description` را می‌پذیرد.
- migration داده‌محور `20260716150000_refine_person_education_history_university_library` متن‌های قدیمی degree/university را در snapshotها حفظ می‌کند، degreeهای شناخته‌شده را به enum نگاشت می‌کند و year موجود را به اول ژانویه همان سال تبدیل می‌کند؛ داده قدیمی silently حذف نمی‌شود.
- permissionهای جدید `library:university:view` و `library:university:manage` به seed اضافه شدند. view مطابق سایر libraryها به MANAGER، REP و BOARDS داده می‌شود و ADMIN طبق الگوی seed همه permissionها، از جمله manage، را دریافت می‌کند.
- مدل‌ها/فایل‌های مهم: `University`، تغییر `PersonEducationHistory`، `prisma/schema.prisma`، migration بالا، `prisma/seed.ts`، ماژول/کنترلر/service/DTOهای `src/universities/`، DTO و service سوابق شخص، `src/people/people.service.ts`، `src/app.module.ts` و `README.md`.
- وضعیت بررسی: `npx prisma format`، `npx prisma validate` و `npx prisma generate` موفق شدند؛ `npm run lint` با 0 خطا و 10 warning موجود موفق شد؛ `npm run build` موفق شد. `npx prisma migrate status` اجرا شد و سه migration محلی 13000، 14000 و 15000 را unapplied نشان داد، درحالی‌که migration دیتابیس `20260710203701_` در فایل‌های local نیست. به‌علت اختلاف migration history، migration اعمال و تست دستی API اجرا نشد؛ هیچ reset یا db push مخربی انجام نشد.

---

**Built with ❤️ for the sales team**

---
