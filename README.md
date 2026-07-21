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
| `GET`   | `/api/users/owner-options/v2` | Paginated, searchable owner candidates with explicit team filtering and selected-value hydration |

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
GET /api/companies/options?search=&page=&limit=&excludeId=&selectedId=&includeArchived=
GET /api/companies/options/:id
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
- The API continues to accept Gregorian ISO 8601 values or `YYYY-MM-DD` for business/date-only fields. Jalali date strings such as `1403/05/20` are invalid and must not be sent to the backend.
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

### fix 000049 - Correct commercial document upload with multipart/form-data

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

### fix 000050 - Fix attachment downloads from MinIO

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

### fix 000051 - Allow StreamableFile to bypass the standardized response envelope

- Fixed the binary download response path by making `ApiResponseInterceptor` pass through `StreamableFile` payloads unchanged.
- Cause of the HTTP 500: the global `ApiResponseInterceptor` wrapped every payload as JSON (`{ success: true, data: payload }`), which is correct for normal APIs but breaks NestJS file-streaming responses.
- Normal JSON responses, paginated responses, and already-standard responses keep the existing standardized API envelope.
- Updated CORS exposed headers so the frontend can read download metadata: `x-request-id`, `Content-Disposition`, `Content-Length`, and `Content-Type`.
- Verified that the attachment download controller still sets `Content-Type`, `Content-Length`, and RFC 5987-compatible `Content-Disposition`.
- Important changed files:
  - `src/common/interceptors/api-response.interceptor.ts`
  - `src/main.ts`
  - `README.md`
- Frontend dependency: continue using `GET /api/attachments/:id/download`; the frontend can now read `Content-Disposition` to obtain the filename.
- No migration was required; the schema was unchanged.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed and was needed to refresh the stale local Prisma Client before build; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run build` passed after generation.

---

### fix 000052 - Replace the Alpine apk dependency in the backend Dockerfile

- The build failure was caused by the Dockerfile using `node:20-alpine` and `apk add --no-cache openssl`, while Alpine repositories failed during the build with TLS and `openssl (no such package)` errors.
- Changed the Dockerfile base images from Alpine to Debian slim: `node:20-bookworm-slim` is now used for both the build and runtime stages.
- Replaced `apk` package installation with the safer pattern `apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*`.
- Preserved the multi-stage structure: dependencies are installed with `npm ci` in the build stage, followed by `npx prisma generate`, the NestJS build, and runtime dependency installation with `npm ci --omit=dev`.
- Preserved the existing startup behavior; the container still runs `npx prisma migrate deploy` before starting the application.
- Added `.dockerignore` to exclude `node_modules`, `dist`, `.git`, logs, storage/uploads/cache/tmp directories, and `.env` files from the build context.
- No Prisma schema or migration changes were made, and no destructive database command was executed.
- Important changed files:
  - `Dockerfile`
  - `.dockerignore`
  - `README.md`
- Validation status: `docker compose config --services` returned `db`, `minio`, `minio-init`, and `api`; `docker compose build --no-cache --progress=plain api` passed and reduced the build context to approximately `135KB`; `docker compose up -d` passed; `docker compose ps` showed `iam-crm-backend-api-1` as `Up`; and `docker logs --tail 120 iam-crm-backend-api-1` confirmed that NestJS started successfully on port `3000`.

---

### fix 000053 - Add secure diagnostic logging for backend HTTP 500 errors

- Added global HTTP request logging to stdout/stderr, including `requestId`, method, URL and route, status code, duration, IP address, proxy/browser headers, and sanitized body/query/params data.
- Extended the global exception filter without changing the API response contract. Exception name, message, and stack trace are logged only on the server together with safe request context; stack traces are never returned to clients.
- Added login-stage logging for request receipt, user lookup result, inactive/locked-user rejection, password-verification result, token creation start/success/failure, and refresh-cookie configuration. Passwords, hashes, tokens, and cookies are never logged.
- Moved `requestId` generation ahead of CORS and route middleware. An incoming `x-request-id` is reused; otherwise, `crypto.randomUUID()` generates one and the value is returned in the response header.
- Added recursive redaction for passwords, tokens, authorization/cookie values, secrets, JWTs, API keys, private keys, and nested, array, or circular structures.
- Enabled Express `trust proxy` with a value of `1` so the real client IP can be resolved behind Nginx.
- Important changed or new files: `src/main.ts`, `src/audit-log/audit-log.module.ts`, `src/audit-log/audit-request-context.middleware.ts`, files under `src/common/logging/`, `src/common/filters/api-exception.filter.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, and `README.md`.
- Live log command: `docker logs -f iam-crm-backend-api-1`.
- Validation status: `npm run lint` passed with 0 errors and 10 existing warnings. The first build failed because the Prisma Client was stale; `npx prisma generate` passed, the first build retry stopped because of a temporary `dist` lock with `EBUSY`, and a later `npm run build` retry passed.
- Docker validation: the `db`, `minio`, `minio-init`, and `api` services were detected, and `docker compose up -d --build api` successfully built the image and recreated the API container. A direct login test after deployment returned HTTP 200 and produced a safe log entry containing the request ID and `[REDACTED]` for the password. Testing through the frontend/Nginx address returned HTTP 500, but no matching request appeared in backend logs; therefore, the proxy error occurred before reaching the backend in that environment and requires frontend/Nginx configuration review.

---

### fix 000054 - Correct CORS documentation and logging for production frontend deployment

- The browser login failure was caused by the production frontend origin, `http://89.42.199.159:8080`, being absent from the backend `CORS_ORIGINS` allowlist.
- Required production configuration: `CORS_ORIGINS=http://localhost:5173,http://89.42.199.159:8080` and `CORS_CREDENTIALS=true`.
- A curl request without an `Origin` header may succeed while a browser request to the same endpoint fails because CORS is enforced. Production tests must therefore include the actual frontend Origin header.
- Rejected origins now return HTTP 403 with code `CORS_ORIGIN_REJECTED`. Server logs record the rejected origin, `requestId`, request path, and the count/list of allowed origins. Stack traces are not sent to the client.
- Using `*` together with `CORS_CREDENTIALS=true` is prohibited and causes a safe startup failure. CORS, Helmet, and environment validation remain enabled.
- Corrected the Docker environment configuration and removed the duplicate, conflicting `CORS_CREDENTIALS` definition from `.env.docker`. Every production frontend URL must be explicitly listed in `CORS_ORIGINS` in the environment file used by Docker.
- Important changed files: `src/main.ts`, `.env.example`, `.env.docker`, and `README.md`.
- After changing the environment file, recreate the API container without rebuilding by running `docker compose up -d --force-recreate api`.
- Validation status: `npm run lint` passed with 0 errors and 10 existing warnings. The initial `npm run build` failed because a stale Prisma Client caused type errors related to the Team model; after `npx prisma generate` passed, the subsequent `npm run build` passed.

---

### fix 000055 - Add company registration, legal, and ownership-structure data

- Added optional `registrationNumber`, `nationalId`, `economicCode`, and `establishmentDate` fields to company profiles. Persian and Arabic digits in registration and numeric inputs are normalized to English digits, and legal identifiers are validated only for reasonable length.
- Added the `CompanyActivityStatus` enum with `ACTIVE`, `INACTIVE`, `MERGED`, and `UNKNOWN`. It is independent from sales stage, priority, and archive state.
- Registered capital is stored as `Decimal(24,2)` with IRR as the default assumed currency, and input is converted directly to `Prisma.Decimal` without passing through JavaScript floating-point values. `employeeCount` is an optional non-negative integer.
- Added multi-parent and multi-subsidiary relationships through `CompanyHierarchyRelation`. Company create/update APIs accept optional `parentCompanyIds` and `subsidiaryCompanyIds` arrays. Related companies must belong to the current organization; self-links, direct duplicates, and direct inverse relationships are rejected. Company details return `parentCompanies` and `subsidiaryCompanies`.
- Added company legal-document types `OFFICIAL_GAZETTE` and `LATEST_CHANGES`. Endpoints include `GET /api/companies/:companyId/legal-documents`, `POST /api/companies/:companyId/legal-documents/upload` with multipart field `file`, `PATCH .../:documentId`, and `DELETE .../:documentId`.
- Uploads reuse the existing `AttachmentsService` storage and validation logic. Raw path, bucket, and object-key values are not exposed in legal-document responses; downloads use the existing secure `GET /api/attachments/:id/download` endpoint through `attachmentId`.
- No new permission was introduced: viewing requires `company:view`, while update/upload/delete operations require `company:update`. Existing organization scope and REP/MANAGER access rules remain in effect.
- Added migration `20260716130000_add_company_legal_registry_hierarchy_fields`. BigInt capital values are converted to Decimal and previous text activity statuses are converted to the enum non-destructively; unknown statuses map to `UNKNOWN`.
- Important changed or new files: `prisma/schema.prisma`, the migration above, `src/companies/companies.service.ts`, `src/companies/companies.module.ts`, `src/companies/company-legal-documents.controller.ts`, `src/companies/company-legal-documents.service.ts`, company/legal-document DTOs, `src/attachments/attachments.service.ts`, and `README.md`.
- Assumptions and dependencies: registered capital uses IRR; files depend on the current `ATTACHMENT_STORAGE_DRIVER`, `MAX_ATTACHMENT_SIZE_BYTES`, and `ALLOWED_ATTACHMENT_MIME_TYPES` settings; the legacy single-value `parentCompanyId` field remains for compatibility, while the new API uses the multi-value relation table.
- Validation status: `npx prisma format`, `npx prisma validate`, and `npx prisma generate` passed; `npm run lint` passed with 0 errors and 10 existing warnings; `npm run build` passed. `npx prisma migrate status` showed the new migration as unapplied and reported that database migration `20260710203701_` is missing from local files. Because migration history was inconsistent and database safety was uncertain, the migration was not applied. Manual API testing was also not performed without the migration.

---

### fix 000056 - Add employment and education history for people

- Added company-based employment history for each person. Each record links to an existing Company in the current organization, stores a company-name snapshot, and allows only one record per person/company pair.
- Each employment record supports multiple positions with `title`, `startDate`, `endDate`, `isCurrent`, and `description`. Empty titles are rejected, an end date cannot precede the start date, and current positions cannot have an end date. These rules are enforced in the service and by a non-destructive database constraint.
- Added multiple education-history records with `degree`, `university`, `year`, and `description`. At least one meaningful field is required, and the optional year is normalized from Persian/Arabic digits and validated within the reasonable range 1000–3000.
- Employment endpoints: `GET/POST /api/people/:personId/employment-history`, `PATCH/DELETE /api/people/:personId/employment-history/:employmentId`, and nested create/update/delete endpoints under `.../:employmentId/positions`.
- Education endpoints: `GET/POST /api/people/:personId/education-history` and `PATCH/DELETE /api/people/:personId/education-history/:educationId`.
- Person-detail responses now include `employmentHistory` with company summaries and `positions`, as well as `educationHistory`. Existing Person API fields and names were not changed.
- Added `PersonEmploymentHistory`, `PersonEmploymentPosition`, and `PersonEducationHistory` models and migration `20260716140000_add_person_employment_education_history`.
- No new permission was introduced: viewing requires `person:view`, while create/update/delete operations require `person:update`. Existing ADMIN/MANAGER/REP access scope and BOARDS restrictions follow the current People policy.
- Important changed or new files: `prisma/schema.prisma`, the migration above, `src/people/person-histories.controller.ts`, `src/people/person-histories.service.ts`, `src/people/dto/person-history.dto.ts`, `src/people/people.module.ts`, `src/people/people.service.ts`, and `README.md`.
- Validation status: `npx prisma format`, `npx prisma validate`, and `npx prisma generate` passed; `npm run lint` passed with 0 errors and 10 existing warnings; `npm run build` passed after correcting one local type error. `npx prisma migrate status` showed the local `20260716130000_add_company_legal_registry_hierarchy_fields` and `20260716140000_add_person_employment_education_history` migrations as unapplied, while database migration `20260710203701_` is missing from local files. Because migration history was inconsistent, no migration or manual API test was run, and no destructive reset or `db push` was executed.

---

### fix 000057 - Refine education history and add the university library

- Changed education degree from free text to the optional `PersonEducationDegree` enum with exactly `DIPLOMA`, `ASSOCIATE`, `BACHELOR`, `PHD`, and `POSTDOC`; a Master's value was not added. Education-history endpoints also return a Persian `degreeLabel` alongside the enum.
- Added the managed `University` library with a unique name, optional unique code, active status, description, and timestamps. Implemented `GET /api/universities`, `GET /api/universities/:id`, `POST /api/universities`, `PATCH /api/universities/:id`, and `DELETE /api/universities/:id` following existing library conventions. DELETE deactivates a university, and normal lists return only active universities.
- Replaced the free-text university field with `universityId` and an optional relation. Education responses include a university summary (`id` and `name`) and retain `universityNameSnapshot` for historical data. Create/update operations accept only existing, active universities.
- Replaced the numeric year with optional `educationDate DateTime?` and an ISO/Gregorian date input. The new DTO accepts only the `degree` enum, `universityId` UUID, valid `educationDate`, and `description`.
- Added data-aware migration `20260716150000_refine_person_education_history_university_library`. It preserves legacy degree/university text in snapshots, maps recognized degree values to the enum, and converts an existing year to January 1 of that year. Legacy data is not silently deleted.
- Added `library:university:view` and `library:university:manage` permissions to the seed. MANAGER, REP, and BOARDS receive view permission in line with other libraries, while ADMIN receives all seeded permissions, including manage.
- Important models/files: `University`, the updated `PersonEducationHistory`, `prisma/schema.prisma`, the migration above, `prisma/seed.ts`, modules/controllers/services/DTOs under `src/universities/`, person-history DTOs and services, `src/people/people.service.ts`, `src/app.module.ts`, and `README.md`.
- Validation status: `npx prisma format`, `npx prisma validate`, and `npx prisma generate` passed; `npm run lint` passed with 0 errors and 10 existing warnings; `npm run build` passed. `npx prisma migrate status` reported local migrations 13000, 14000, and 15000 as unapplied, while database migration `20260710203701_` has no matching local file. Because migration history was inconsistent, the migration and manual API tests were not run, and no destructive reset or `db push` was executed.

---

### fix 000058 - Correct university-library permissions

- The ADMIN HTTP 403 issue was caused by a mismatch between permissions present in the seed/database and the JWT: the token contained legacy `university:view`, while the controller correctly required the library-convention permission `library:university:view`.
- Standardized the canonical university permissions in the seed as `library:university:view` and `library:university:manage`. University endpoints do not use `university:view` or `university:manage`.
- `GET /api/universities` and `GET /api/universities/:id` require `library:university:view`; create/update/delete (deactivate) operations require `library:university:manage`.
- ADMIN continues to receive both permissions through `allActions`. MANAGER, REP, and BOARDS receive view permission, matching the policy for industry, lead-source, pain-point, use-case, and persona libraries; management remains ADMIN-only.
- Affected files: `prisma/seed.ts` and `README.md`. Decorators in `src/universities/universities.controller.ts` were reviewed and already used the correct canonical names.
- Database action: rerun the seed with `npm run seed`. Because permissions are included in login responses/JWTs, users must log out and log back in after seeding so the new token contains `library:university:view` and `library:university:manage`.
- Validation status: `npm run lint` passed with 0 errors and 10 existing warnings. The initial build failed because the Prisma Client was stale; `npx prisma generate` passed, and the subsequent `npm run build` passed. The seed was not run against the database.

---

### fix 000059 - Complete role and permission management

- Added permission CRUD through `GET/POST /api/permissions` and `GET/PATCH/DELETE /api/permissions/:id`. Permission actions are normalized, validated, and made unique using the `module:action` pattern, with support for name, description, group, active, and system metadata.
- Added the database-backed `Role` model and role CRUD under `/api/roles`. The fixed `ADMIN`, `MANAGER`, `REP`, and `BOARDS` roles are seeded/backfilled as system roles and cannot be deleted, deactivated, or assigned a different base scope. Custom roles support code, name, description, `baseRole`, and active status.
- Permission-assignment screens can retrieve all active permissions and assigned state through `GET /api/roles/:id/permissions` and atomically replace the `permissionIds` array through `PUT /api/roles/:id/permissions`.
- Seeded `role:view` and `role:manage`; ADMIN receives both through `allActions`. Existing `permission:view` and `permission:manage` continue to govern permission administration.
- Security protections: system permissions cannot be deleted; assigned permissions cannot be deleted; `permission:manage` and `role:manage` cannot be deactivated; ADMIN must retain both during replacement; system roles cannot be deleted or deactivated; roles assigned to users cannot be deleted; and the current ADMIN cannot remove their own RBAC access by assigning a role that lacks these two permissions.
- User/auth compatibility: the existing `User.role` enum remains the source for row/tenant scope and the `user.role` contract. `User.roleId` stores the assignable database role. `PATCH /api/users/:id/role` now also accepts `roleId` and applies that role's `baseRole` to the compatible enum. Login continues to return `role` and permissions and now also returns `roleId`, `roleCode`, and `roleName`. When `roleId` exists, the guard reads permissions from the database-backed role.
- The idempotent seed synchronizes system roles, `roleId` for predefined users, and `roleId` links in RolePermission records, while keeping seeded permissions system-owned and active. After migration/seed, users must log out and log back in to receive the new login response; the guard also checks permissions from the database.
- Added migration `20260716160000_add_dynamic_role_permission_management`, which backfills existing users and enum-based assignments into corresponding system Role records without deletion.
- Important files: `prisma/schema.prisma`, the migration above, `prisma/seed.ts`, new RBAC controllers/services/DTOs under `src/admin/`, `admin-permissions.module.ts`, `permissions.guard.ts`, `auth.service.ts`, user DTOs/services, and `README.md`.
- Validation status: `npx prisma format`, `npx prisma validate`, and `npx prisma generate` passed; `npm run lint` passed with 0 errors and 10 existing warnings; `npm run build` passed. `npx prisma migrate status` reported migrations 13000 through 16000 as unapplied and database migration `20260710203701_` as missing locally. Because migration history was inconsistent, migration/seed and manual API tests were not run, and no destructive reset or `db push` was executed.

---

### fix 000060 - Make the refresh-token cookie configurable for HTTP and HTTPS deployments

- Root cause: cookie behavior depended only on `NODE_ENV`. With `NODE_ENV=production` on a temporary HTTP/IP deployment, the cookie became `Secure`, so the browser did not store it. Login could therefore succeed while the refresh-token flow failed.
- Added `REFRESH_TOKEN_COOKIE_SECURE` with `true|false`, `REFRESH_TOKEN_COOKIE_SAME_SITE` with `lax|strict|none`, and `REFRESH_TOKEN_COOKIE_PATH` with the default `/api/auth`.
- When the new variables are unset, existing behavior is preserved: production uses `secure=true` and `sameSite=none`; other environments use `secure=false` and `sameSite=lax`.
- Temporary HTTP/IP deployment example:
  ```env
  REFRESH_TOKEN_COOKIE_SECURE=false
  REFRESH_TOKEN_COOKIE_SAME_SITE=lax
  REFRESH_TOKEN_COOKIE_PATH=/api/auth
  ```
- HTTPS production deployment example:
  ```env
  REFRESH_TOKEN_COOKIE_SECURE=true
  REFRESH_TOKEN_COOKIE_SAME_SITE=none
  REFRESH_TOKEN_COOKIE_PATH=/api/auth
  ```
- The combination `sameSite=none` with `secure=false` is insecure and incompatible with modern browsers. The backend logs a warning for this combination because browsers require `Secure` for `SameSite=None`.
- Refresh tokens remain stored only in an `HttpOnly` cookie and are never returned in JSON responses.
- Important changed files: `src/common/cookies/refresh-token-cookie.ts`, `src/common/validators/env.validator.ts`, `.env.example`, `.env.docker`, and `README.md`.
- Validation status: `npm run lint` passed with 0 errors and 10 existing warnings. The initial `npm run build` failed because the stale Prisma Client caused 124 type errors for newer models/fields; `npx prisma generate` then passed, and the subsequent `npm run build` passed.

---

### fix 000061 - Correct CRM record visibility and add Mine/All filters

- The missing-record issue was not caused by absent permissions; read visibility in services was tied to role, record ownership, and the owner's team. As a result, a company created by ADMIN was automatically owned by ADMIN and remained invisible to sales users/REP even when they had `company:view`.
- Company lists and details are now visible organization-wide to users with `company:view`. Hidden REP/MANAGER/BOARDS owner/team restrictions were removed from read paths.
- Company creation no longer assigns the creator as owner automatically. `ownerId` is stored only when provided and validated; otherwise, it remains `null`. The actor is still recorded from `user.userId` in audit events.
- Opportunity lists and details are now organization-wide by default for users with `opportunity:view`. Creating an opportunity under a company no longer requires the user to own that company; when `ownerId` is omitted, the current user remains the default opportunity owner.
- Added `ownershipScope=all|mine|team|unassigned` to company-list, opportunity-list, and report APIs. The default is `all`. Existing filters such as `ownerId`, `teamId`, stage, priority, source, archive state, company, and search retain their names.
- Mutation restrictions were not relaxed: update/delete/archive/change-owner/change-stage operations continue to use previous strict checks. This fix changes read visibility, not edit authorization.
- Similar modules were reviewed: People and Activity reads tied to companies became organization-wide with explicit tenant checks; report/pipeline data no longer applies hidden owner/team scope and instead uses the selected scope. Tasks retain user/team scope because they are assignment/private records. Opportunity child resources and company legal documents keep mutation restrictions because their shared helpers protect both read and mutation paths.
- No migration or schema change was made, and existing ownership data was not automatically cleared or rewritten.
- Important changed files: `src/common/dto/ownership-scope.dto.ts`, company DTOs/controllers/services, opportunity DTOs/controllers/services, `src/reports/`, `src/people/people.service.ts`, `src/activities/activities.service.ts`, and `README.md`.
- Manual verification checklist: create a company without `ownerId` as ADMIN and view its list/detail as REP; verify `all`, `mine`, and `unassigned`; view an ADMIN-owned opportunity as REP in default/all scope and confirm mine scope is restricted; verify pipeline/report visibility; confirm records from another organization remain hidden and users without permission are rejected; and confirm mutation restrictions remain active.
- Validation status: `npm run lint` passed with 0 errors and 10 existing warnings. `npm run build` failed because the Prisma Client was stale, producing 124 type errors for existing models/fields such as Role, Team, and University. Because this fix did not change the schema and the task permitted `prisma generate` only for schema changes, neither `npx prisma generate` nor `npx prisma migrate status` was run.

---

### fix 000062 - Correct visibility for person subresources

- The HTTP 403 issue was caused by contact, social, employment-history, and education-history services still applying legacy role/company-owner/team checks to read paths after the core CRM visibility change.
- `GET /api/people/:personId/contacts`, `GET /api/people/:personId/socials`, `GET /api/people/:personId/employment-history`, and `GET /api/people/:personId/education-history` are now readable with `person:view` when the person belongs to the current organization, independent of the company owner or the user's team.
- Single contact/social reads and person detail/list endpoints enforce the same organization boundary. Archived companies cannot be used for these read paths, and records from another organization are hidden with a not-found response.
- Split read and mutation checks into `assertPersonReadable` and `assertPersonMutable`. POST/PATCH/DELETE operations for contacts, socials, employment history, positions, and education history retain the previous strict role/owner/team rules.
- All person-subresource mutation endpoints are protected by `person:update`; this fix does not allow users without that permission to create, update, or delete records.
- Important changed files: `src/person-contacts/person-contacts.service.ts`, `src/person-contacts/person-contacts.controller.ts`, `src/person-socials/person-socials.service.ts`, `src/person-socials/person-socials.controller.ts`, `src/people/person-histories.service.ts`, `src/people/people.service.ts`, and `README.md`.
- Manual verification checklist: read the four endpoints above as a REP with `person:view` for a company created by ADMIN; load details without failed requests; confirm cross-organization access is rejected; confirm users without `person:view` are rejected for GET requests; and confirm users without `person:update` are rejected for mutations.
- Validation status: `npm run lint` passed with 0 errors and 10 existing warnings. `npm run build` failed because the Prisma Client was stale, producing 124 type errors related to existing models/fields such as Role, Team, University, and person-history models; these errors prevented build verification.

---

### fix 000063 - Correct company subresource access for branches and legal documents

- The HTTP 403 issue was caused by branch and legal-document services, plus the attachment path for legal documents, continuing to apply hidden owner/team scope after company visibility became organization-wide.
- Branch endpoints now validate companies only by current `organizationId` and non-archived status. `POST/PATCH/DELETE /api/companies/:companyId/branches` require the existing `branch:manage` permission; branch GET endpoints require `company:view`. Added the `PermissionsGuard`, which was previously missing from the branch controller.
- `GET /api/companies/:companyId/legal-documents`, `POST /api/companies/:companyId/legal-documents/upload`, and legal-document PATCH/DELETE operations now validate the company in the current organization without an owner/team condition. Existing permissions remain unchanged: `company:view` for reads and `company:update` for upload/update/delete.
- Internal `AttachmentsService` checks for `COMPANY_LEGAL_DOCUMENT` are now organization-scoped and reject archived companies, preventing a permitted REP from being denied again by owner scope during file persistence.
- A successful upload returns the created legal-document record together with file metadata (`id`, original filename, MIME type, size, and creation time), while preserving `companyId` on the document record. Storage/attachment/link failures cannot produce false success: the error is rethrown, the document record is rolled back, any created attachment is cleaned up when possible, and the failure is logged with `requestId`, `companyId`, and `documentId`; the exception filter records and returns a standardized non-2xx response.
- No new permission or schema was introduced. Users without `branch:manage` or `company:update` remain blocked by the guard, and archived or cross-organization companies cannot be used.
- Important changed files: `src/company-branches/company-branches.controller.ts`, `src/company-branches/company-branches.service.ts`, `src/companies/company-legal-documents.controller.ts`, `src/companies/company-legal-documents.service.ts`, `src/attachments/attachments.service.ts`, and `README.md`.
- Manual verification checklist: create/list/update/delete branches as a non-owner REP with permission; upload and list a legal document and verify metadata; reject users without permission; reject cross-organization companies; and confirm non-2xx responses plus logging when storage/database operations fail.
- Validation status: `npm run lint` passed with 0 errors and 9 existing warnings. `npm run build` failed because the Prisma Client was stale, producing 124 type errors related to existing models/fields such as Role, Team, University, and CompanyLegalDocument; the build could not be confirmed.

---

### fix 000064 - Centralize company-operation access by permission and organization

- The remaining HTTP 403 errors were caused by legacy owner/team checks in company mutations and subresources, which blocked permitted non-owner users.
- Centralized access in `CompanyAccessService`: company existence, current organization, and archive state are checked, while owner/team membership is no longer treated as an implicit permission.
- Covered branches, company social channels, Call Cards, legal documents, activities, people and their contact/social/employment/education subresources, company edit/priority changes, and opportunity creation.
- Owner changes, archive, and restore operations remain protected by explicit permissions; a new owner must also belong to the same organization.
- Preserved `JwtAuthGuard`, `PermissionsGuard`, and organization isolation. Missing permissions still produce HTTP 403, while a company from another organization remains hidden with HTTP 404.
- Legal-document upload/persistence failures are logged, incomplete records are removed, and a non-2xx response is returned; successful requests return the created document.
- Important files: `src/app.module.ts`, the company-access helper/module, and services for companies/legal documents, branches, social channels, Call Cards, activities, people, and person subresources.
- Validation status: `npm run lint` passed with pre-existing warnings; `npm run build` passed. The schema was unchanged and no migration was required; only `npx prisma generate` was run to synchronize the client.
- Manual ADMIN/REP verification was not performed because credentials and a runnable API environment were unavailable.

---

### fix 000065 - Add server-side search and pagination for company options

- The root issue was that frontend selectors loaded only the first page—effectively the first 10 companies—so client-side search could not find companies outside that page. The general company-list endpoint was not changed because its response includes owner, industry, and source relations and is part of the Companies page contract.
- Added the lightweight `GET /api/companies/options` endpoint with the existing `company:view` permission. Parameters are `search`, `page`, `limit`, `excludeId`, `selectedId`, and `includeArchived`. Defaults are `page=1` and `limit=25`, with a maximum `limit=50`. The response uses the existing `data/meta` envelope with total, totalPages, hasNext, and hasPrevious and does not load heavy relations.
- After trimming, search runs directly in the database and is case-insensitive across `legalName`, `brandName`, `nationalId`, `registrationNumber`, and existing `economicCode`. Results are deterministically ordered by brandName, legalName, createdAt, and id.
- All queries are restricted by the current user's `organizationId` and apply no hidden owner/team scope. Archived companies are excluded by default and are returned only with `includeArchived=true`, consistent with currently permitted company-list behavior. `excludeId` is enforced by the backend.
- Selected-value hydration is supported through `selectedId` on the list endpoint and through `GET /api/companies/options/:id` using the same lightweight fields. The independent lookup is not tied to the search page, enforces organization scope, and returns HTTP 404 for a company from another organization.
- Strengthened existing multi-parent hierarchy validation: self-parent/self-subsidiary links, cross-organization relationships, archived parent/subsidiary companies, and direct or multi-level cycles are rejected. Cycle detection runs over the current organization's graph before relations are replaced and does not destructively alter existing valid data.
- Important changed or new files: `src/companies/dto/find-company-options.dto.ts`, `src/companies/companies.controller.ts`, `src/companies/companies.service.ts`, `test/companies.service.spec.ts`, and `README.md`.
- The schema was unchanged and no migration was required. `npx prisma generate` was run successfully to synchronize the workspace's stale Prisma Client with the existing schema; no `db push`, reset, or destructive database command was run.
- Validation status: `npm run lint` passed with 0 errors and 9 pre-existing warnings in unrelated files; `npm run build` passed after generation; the focused test suite passed with 1 suite and 16 tests; the complete `npm test -- --runInBand` run passed with 5 suites and 30 tests. The only non-blocking warning is the existing set of 9 lint warnings.

---

### fix 000066 - Correct owner-option permissions and organization scoping

- The HTTP 403 root cause was duplicate authorization: after `PermissionsGuard` verified `company:assign-owner`, `UsersService.getOwnerOptions` again limited callers to base roles ADMIN/MANAGER. That redundant check rejected REP or custom roles with valid permission and was removed. Authorization now depends only on authentication, `company:assign-owner`, and organization scope; callers without permission still receive HTTP 403 from the guard.
- Separated the caller role from the selectable owner role. A caller with any base role and the required permission may read the endpoint, while existing business rules still return only active users whose base role is REP or MANAGER. ADMIN, BOARDS, and inactive users are excluded.
- Preserved compatibility for `GET /api/users/owner-options`, which still returns a lightweight array for existing consumers. It is now restricted by the current user's `organizationId` and applies no hidden caller-role/team filter. Responses include only `id`, `fullName`, `email`, `role`, `roleId`, `teamId`, `team`, and a `teamRef` summary.
- Added `GET /api/users/owner-options/v2` with the same permission. Parameters are `search`, `page`, `limit`, `teamId`, and `selectedId`; defaults are `page=1` and `limit=25`, with maximum `limit=50`. Search is case-insensitive in the database over `fullName` and `email`. The standard `data/meta` response includes total, totalPages, hasNext, and hasPrevious.
- `selectedId` hydrates a selected value outside the first page under the same organization scope. `teamId` is an explicit filter and must reference an active team in the same organization before use; MANAGER or custom roles are not implicitly limited to their own team when the parameter is omitted.
- Audited tenant isolation in `UsersService`: `findAll`, `findOne`, `deactivate`, `activate`, and `updateUserRole` now receive the actor from the controller and restrict targets through `getCurrentOrganizationId(actor)`. Cross-organization targets remain hidden with HTTP 404, and mutation audit logs record `organizationId`. Create already used the actor's organization.
- Frontend dependency: existing consumers of the array endpoint continue to work unchanged. Search, pagination, and hydration consumers should migrate to `/api/users/owner-options/v2`, read options from `response.data`, and read pagination metadata from `response.meta`. The frontend repository was not present in this workspace and was not modified.
- Important changed or new files: `src/users/dto/find-owner-options.dto.ts`, `src/users/users.controller.ts`, `src/users/users.service.ts`, `test/users-owner-options.service.spec.ts`, and `README.md`.
- The Prisma schema was unchanged and no migration is required. `npx prisma generate` was run only to synchronize the existing workspace client and passed; no reset or `db push` was run.
- Validation status: the focused owner-options suite passed with 1 suite and 16 tests; the full `npm test -- --runInBand` run passed with 6 suites and 46 tests; `npm run lint` passed with 0 errors and 9 pre-existing warnings in unrelated files; `npm run build` passed.
- Non-blocking limitation: manual verification with real REP credentials and the frontend was not performed; automated service/guard coverage uses Prisma mocks.

---

### fix 000067 - Add the meeting module and meeting reminders

- Added Meeting as an independent entity with `SCHEDULED`, `COMPLETED`, and `CANCELLED` lifecycle states. `ActivityType.MEETING` remains only for activity-history records.
- Implemented a required company relation, optional opportunity relation, relational internal assignees, and external attendees of type `Person`. All validation and operations enforce organization scope.
- Added global create, paginated/filterable list, detail, update, complete, and cancel APIs under `/api/meetings`. Company and opportunity filters use the same global API.
- Added the lightweight `GET /api/users/assignee-options` endpoint with search and pagination for active users in the organization. Access uses an any-of permission rule for `meeting:create` or `meeting:update`.
- Integrated `reminderAt` with internal `MEETING_REMINDER` notifications and the `MEETING` entity reference. Minute-based processing uses a PostgreSQL transaction-level advisory lock, deduplicated recipients, and atomic notification plus `reminderSentAt` persistence.
- Added `meeting:view`, `meeting:create`, `meeting:update`, `meeting:complete`, and `meeting:cancel` to the seed. ADMIN receives all; MANAGER and REP receive all operational permissions; BOARDS receives view only. Hard deletion is not implemented.
- Migration: `20260720120000_add_meetings`. It has not been applied to the local database. `migrate status` also reported database migration `20260710203701_`, which has no matching local migration file.
- Important files: `prisma/schema.prisma`, the new migration, `prisma/seed.ts`, `src/meetings/*`, assignee-option endpoints under `src/users/*`, and module/scheduler registration in `src/app.module.ts`.
- Validation status: `npx prisma generate` passed; lint passed with 9 pre-existing warnings and no errors; build passed; all 7 suites and 51 tests passed.
- Limitation: the migration was not applied because of the local database migration-history mismatch, which must be investigated before deployment. Notifications are in-app only, and each processing run claims at most 100 meetings.

### fix 000068 - Add multi-currency, multi-channel product pricing and exchange-rate history

- Added independent in-person and Digikala selling prices to the product catalog, with `IRR` or `USD` input. USD calculations are performed in the backend with `Prisma.Decimal` and deterministic `ROUND_HALF_UP` rounding to whole rials.
- Preserved compatibility fields `defaultUnitPrice` and `currency`, synchronizing them on every create, update, or recalculation with the final in-person price and `IRR`, respectively. Opportunity line-item creation explicitly snapshots the final in-person IRR price as the default.
- Added an append-only USD-to-IRR rate model with `validFrom`/`validTo` periods and endpoints `GET /api/admin/exchange-rates/current`, `GET /api/admin/exchange-rates`, and `POST /api/admin/exchange-rates`.
- A new rate is recorded in one transaction under an advisory lock: the previous active rate is closed, the new rate is created, and all USD products are recalculated. IRR products and line-item, commercial-document, and payment snapshots remain unchanged.
- Added production-safe, additive migration `20260720160000_add_multi_channel_product_pricing`. It backfills every existing product to IRR without deletion; both input and final prices are copied from `defaultUnitPrice`, while profit and rate-reference fields remain empty. The SQL was reviewed and contains no `DROP TABLE`, `TRUNCATE`, or `DELETE`.
- The migration creates `exchange-rate:view` and `exchange-rate:manage` idempotently and assigns them only to the system ADMIN role. The seed was also updated for new environments and does not overwrite custom-role permissions.
- Important files: `prisma/schema.prisma`, the new migration, `prisma/seed.ts`, `src/product-catalog/*`, `src/admin/exchange-rates/*`, `src/opportunities/opportunity-line-items.service.ts`, `src/app.module.ts`, and pricing/rate/permission tests.
- Validation status: `prisma format`, `prisma validate`, and `prisma generate` passed; lint passed with no errors and 9 pre-existing warnings; build passed; 11 suites and 63 tests passed.
- Local migration status: `20260720120000_add_meetings` and `20260720160000_add_multi_channel_product_pricing` remain unapplied, while database migration `20260710203701_` has no matching local file; therefore, migrations were not run. Version-one assumption: the exchange rate is a global reference and only USD/IRR is supported.

### fix 000069 - Fix the Prisma P2010 error in the exchange-rate transaction lock

- The `Prisma P2010: Failed to deserialize column of type 'void'` error in `POST /api/admin/exchange-rates` was caused by returning the PostgreSQL `pg_advisory_xact_lock` function's `void` result directly.
- Preserved the transaction-level advisory lock and complete transaction ordering, but converted the function result to a Prisma-deserializable type with `CAST(... AS TEXT) AS "lockResult"`. No unsafe APIs were introduced.
- Regression tests cover the cast and non-void alias, lock execution before reading the active rate, closing the previous period, creating the new rate, selecting only USD products, recalculation, and omission of audit logging when the transaction fails.
- Important changed files: `src/admin/exchange-rates/exchange-rates.service.ts`, `test/exchange-rates.service.spec.ts`, corresponding build output at `dist/src/admin/exchange-rates/exchange-rates.service.js` and its source map, and `README.md`.
- This hotfix changes neither the Prisma schema nor the database and requires no migration.
- Validation status: two exchange-rate-related suites passed with 6 tests; lint passed with no errors and 9 pre-existing warnings; build passed.

### fix 000070 - Correct report date semantics and exact active-opportunity and overdue-task counts

- Added optional `activeOnly=true|false` to opportunity lists. When true, it returns only non-archived opportunities whose stage is non-terminal and has `terminalType=null`, while preserving all organization/owner/team/company filters and pagination. Combining it with `archivedOnly=true` is rejected with a clear error.
- Added optional `overdueOnly=true|false` to task lists. The database predicate is exactly `dueAt < now` with status in `TODO`/`IN_PROGRESS`; incompatible terminal statuses are rejected, and `meta.total` is calculated directly from the database count.
- Date basis is now `opportunity.createdAt` for `pipeline-summary` and `pipeline/by-owner`, `opportunityStageHistory.changedAt` for `conversion-rates`, stage-exit `changedAt` for stage-duration samples, and `activity.occurredAt` for both activity reports. Without dates, all available history is included, while existing inclusive day-range behavior remains.
- Conversion denominators and win counts now use distinct opportunities with qualifying transitions during the period; compatibility aliases were not removed or renamed. Stage duration preserves entries that occurred before the period start and filters samples only by exit time.
- `companyIds` and `ownershipScope` pass through existing organization/owner/team helpers in all opportunity and activity paths. Activity visibility remains company-scoped separately from actor/team filters. `filter-options` still avoids an unbounded company list, and the existing paginated company-options endpoint was not changed.
- Important files: opportunity DTOs/services, task DTOs/services, `src/reports/reports.service.ts`, `opportunity-task-list-filters` and `reports-correctness` tests, corresponding build output under `dist`, and `README.md`.
- Validation status: 13 suites and 75 tests passed; lint passed with no errors and 9 pre-existing warnings; build passed.
- This fix has no schema or migration change. Preserved assumption: reports continue to exclude archived opportunities and companies, matching previous behavior.

### fix 000071 - Add advanced sales and operations reports and a management dashboard

- Added `report:view`-protected endpoints: `GET /api/dashboard/summary`, `GET /api/reports/opportunities/forecast`, `GET /api/reports/opportunities/aging`, `GET /api/reports/meetings/performance`, and `GET /api/reports/tasks/performance`. All queries are restricted by `organizationId` and preserve company, owner/assignee, team, status, and date-range filters.
- Forecast reports include only active opportunities based on `expectedCloseDate` and return nominal and weighted totals using `Prisma.Decimal`, broken down by month, stage, and owner. Aging reports calculate total age, current-stage age, fixed buckets, overdue opportunities, and deterministic pagination using lightweight company/owner projections.
- Meeting reports provide completed/cancelled/past-scheduled metrics, completion/execution/cancellation rates, scheduled duration, breakdowns by status/mode/organizer, and daily trends for ranges up to 31 days or weekly trends for longer periods. Task reports separate current open/overdue/due-today/next-seven-days snapshots from created/completed/cancelled/due/on-time/late period flow.
- Calendar-day and “today” boundaries are calculated in the organization's timezone, including DST days closed at the next local midnight. By default, the dashboard combines 30 complete calendar days, current snapshots, period performance, a 90-day forecast, and attention lists limited to 5 records.
- Important files: `src/common/dates/timezone-boundary.util.ts`, `src/reports/advanced-reports.service.ts`, `src/reports/dto/advanced-report-filters.dto.ts`, report controller/module files, `src/dashboard/*`, `src/app.module.ts`, `test/advanced-reports.service.spec.ts`, and corresponding build output under `dist`.
- Validation status: three report-related suites passed with 8 tests; lint passed with no errors and the same 9 pre-existing warnings; build passed. `prisma generate` was run only to synchronize the workspace's stale client with the existing schema.
- The database schema was unchanged, no migration was created, and no destructive command or broad seed operation was run.

### fix 000072 - Add sales channels, product price history, and financial/commercial reports

- Added the additive migration `20260720210000_add_sales_channels_product_price_history`, introducing the `SalesChannel` and `ProductPriceHistoryReason` enums, an append-only price-history table, catalog channel/price snapshots, and a price-history reference. A PostgreSQL partial unique index allows only one open history record per product.
- The backfill does not fabricate historical sales or prices: existing line items are marked `LEGACY_UNKNOWN`, `catalogUnitPriceIrrSnapshot` is copied directly from `unitPrice`, the history reference remains `null`, and all other monetary values remain unchanged. Each product receives only one `MIGRATION_BASELINE` record based on its current state at the migration execution timestamp; records are not backdated.
- Line-item writes default an omitted sales channel to `IN_PERSON` for backward compatibility. `IN_PERSON` and `DIGIKALA` snapshot the relevant channel price and open history record while preserving the negotiated price. `OTHER` requires an explicit price, and `LEGACY_UNKNOWN` is rejected for new writes. Non-price updates preserve the existing snapshot.
- Product creation atomically creates a `PRODUCT_CREATED` history record. Effective price changes create a `PRODUCT_UPDATED` record under an advisory lock. The exchange-rate transaction and lock introduced in fix 000069 are preserved, and every affected USD product receives an `EXCHANGE_RATE_CHANGED` record with a rate snapshot. IRR products and existing line items remain unchanged.
- Added `GET /api/product-catalog/:id/price-history`, protected by `product:view`, and the `GET /api/reports/financial/collections`, `GET /api/reports/products/performance`, and `GET /api/reports/exchange-rates/impact` endpoints, protected by `report:view`. The Dashboard also receives the new `finance`, `catalog`, and `salesChannels` sections without changing its previous response contract.
- Important changed or new files include the Prisma schema and migration, product catalog and price-history modules, line-item DTOs and service, exchange-rate service, commercial reports, dashboard, tests, and the corresponding `dist` output.
- Validation status: `prisma format`, `prisma validate`, and `prisma generate` passed; 6 focused suites with 19 tests passed; the full 18-suite test run with 89 tests passed; lint passed with no errors and 9 pre-existing warnings; build passed.
- Assumption: because the payment model does not store separate paid and outstanding amounts, a `PARTIAL` payment row's amount is treated as the authoritative receivable amount. When no previous history exists, no synthetic prior impact is created and the delta remains `null`. The migration was not applied to the database, and no seed or destructive command was run.

### fix 000073 - Add tenant-safe audit analytics, data quality, comparisons, and report exports

- Added organization-scoped audit-log list, detail, summary, filter-options, and CSV/XLSX export APIs. Reads always force the authenticated organization, exclude global and foreign audit rows, batch actor summaries, support compact responses, recursively sanitize sensitive fields, and report bounded changed-field paths.
- Added a centralized typed data-quality rule catalog with separate `organization` and `globalCatalog` scores and paginated issue details. Companies, opportunities, tasks, meetings, payments, and commercial documents remain organization-scoped; the platform-global product catalog and exchange-rate checks are returned only to callers that also have `product:view`.
- Added period comparison for previous-period, previous-year, and explicit non-overlapping ranges. Metrics use their business event dates, Decimal-safe monetary calculations, explicit zero-baseline percentage semantics, stable uppercase keys, and organization-aware reporting filters.
- Extended the management dashboard additively with organization data quality, permission-gated catalog quality, and a concise comparison snapshot. Existing dashboard fields were preserved.
- Added whitelisted CSV/XLSX exports for the supported reports through one shared export utility. CSV output includes a UTF-8 BOM, CRLF rows, correct quoting, and spreadsheet-formula neutralization; XLSX output uses safe worksheet names, frozen headers, bounded widths, and format-specific row limits. Successful exports write sanitized audit records.
- Important changed or new files include `src/audit-log/*`, `src/common/export/report-export.service.ts`, `src/reports/data-quality*`, `src/reports/period-comparison.service.ts`, `src/reports/reporting-scope.service.ts`, `src/reports/report-exports.service.ts`, report/dashboard controllers and modules, focused regression tests, and corresponding tracked `dist` output.
- Validation status: 4 focused suites with 7 tests passed; the full 21-suite run with 95 tests passed; lint passed with no errors and 9 pre-existing warnings; build passed. `prisma generate` was used only to synchronize the stale local client with the already committed schema.
- No Prisma schema change or migration was required. No migration, destructive database command, or broad seed operation was run.

---

**Built with ❤️ for the sales team**

---
