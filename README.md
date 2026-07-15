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

* **Full sales pipeline management**: 17 stages from LEAD to DONE, with stage-change history.
* **Pipeline configuration**: admin-managed stage labels, display order, active status, terminal status, and colors.
* **Pipeline transition rules**: role-aware allowed transitions enforced by the backend during company stage changes.
* **Activity lifecycle management**: edit activities, complete follow-ups, and reschedule follow-ups.
* **Due follow-up management**: completed follow-ups are excluded from due reminders.
* **Smart Call Card**: automatic Pain Point and Use Case suggestions based on contact persona and company industry.
* **Advanced contact management**: multiple phone numbers, emails, and social networks per person.
* **Advanced reporting**: report filters by users, owners, teams, stages, priorities, industries, sources, companies, dates, and activity types.
* **Activity reports by user** and **pipeline reports by owner**.
* **Report filter options endpoint** for frontend filter dropdowns.
* **Bulk import from Excel**: import SAM/company lists in a single upload.
* **Admin-managed catalogs**: industries, pain points, use cases, personas, lead sources, and grouped lookup options.
* **Owner options for assignment**: scoped active REP/MANAGER candidates for company ownership workflows.
* **Safe company archive/restore**: no destructive company deletion.
* **Dynamic permission system**: role-permission matrix and assign/revoke APIs.
* **Audit log**: persistent trace of important administrative and operational changes.
* **High security**: JWT, rate limiting, environment validation, permission cache, password hashing, audit-log sanitization, and database indexes.

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

* Frontend repository: https://github.com/IKAC-FIDS/iam-crm-frontend-mui

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

| Persian Column Name | English Column Name |
| ------------------- | ------------------- |
| نام شرکت            | legalName           |
| نام تجاری           | brandName           |
| صنعت                | industry            |
| وبسایت              | website             |
| شهر                 | headOfficeCity      |
| اولویت              | priority            |
| نام مخاطب           | personName          |
| سمت                 | title               |
| ایمیل               | email               |
| تلفن                | phone               |
| نقش (Persona)       | personaTag          |

---

## 🔐 Security and Optimization

* **JWT authentication** with configurable token lifetime
* **Optional WebAuthn/Passkey authentication** for discoverable usernameless login
* **Password hashing** before storing user credentials
* **Rate limiting** for API protection
* **Login throttling** if enabled in the current throttler configuration
* **Environment validation** at startup with Joi
* **Database indexes** on frequently queried fields
* **Role/permission-based access control**
* **Dynamic permission cache** for role permissions
* **Audit-log sanitization** for sensitive fields such as password, token, secret, hash, and authorization data

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

* [ ] People Directory endpoint: `GET /api/people/directory`
* [ ] Notification system for due follow-up reminders
* [ ] Data export to Excel/PDF
* [ ] Unit, integration, and E2E tests
* [ ] Runtime Swagger UI inside the NestJS app, if required
* [ ] Optional advanced dashboard visualizations

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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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
- Important changed/new files:
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

### backend fix 000038 - Add tenant/organization foundation

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
- Important changed/new files: `prisma/schema.prisma`, `prisma/migrations/20260710203701_add_tenant_organization_foundation/migration.sql`, `prisma/seed.ts`, `src/auth/auth.service.ts`, `src/auth/jwt.strategy.ts`, `src/common/decorators/current-user.decorator.ts`, `src/common/tenant/*`, `src/organizations/*`, `src/companies/companies.service.ts`, `src/opportunities/opportunities.service.ts`, `src/tasks/tasks.service.ts`, `src/notifications/notifications.service.ts`, `src/attachments/attachments.service.ts`, and `src/audit-log/audit-log.service.ts`.
- Assumptions: existing `User.email @unique` remains global for now; this is only the foundation, and full tenant scoping for library/configuration models will be handled later.
- Validation status: `npx prisma validate` passed; `npx prisma generate` passed; `npm run build` passed; `npm run lint` passed with 10 existing warnings and 0 errors; `npm run test` passed with 1 suite and 4 tests.

---

### fix 000039 - اصلاح تفکیک دپارتمان، سمت سازمانی و نقش فروش در اشخاص

- تفکیک معنایی فیلدهای شخص/مخاطب اصلاح شد:
  - `department` برای دپارتمان یا واحد سازمانی.
  - `title` برای سمت سازمانی / Job Title.
  - `personaTag` برای نقش در فرآیند فروش / Buying Role.
  - `seniorityLevel` برای سطح ارشدیت.
- برای سازگاری API، نام‌های جدید و شفاف هم پشتیبانی می‌شوند: `jobTitle` به `title` و `personaRole` به `personaTag` نگاشت می‌شود.
- پاسخ‌های People API اکنون aliasهای `jobTitle` و `personaRole` را هم کنار فیلدهای قدیمی برمی‌گردانند.
- فیلترهای Global People Directory برای `jobTitle`, `personaRole`, و `seniorityLevel` اضافه شد.
- گروه‌های lookup جدید `job-titles` و `persona-roles` اضافه شدند.
- گروه‌های موجود `departments` و `seniority-levels` تکمیل شدند.
- گروه `persona-tags` برای سازگاری با کلاینت‌های قبلی حفظ شد و با همان نقش‌های فروش seed می‌شود.
- مقدارهای شغلی مثل `CEO`, `CIO`, `CISO`, `IT_MANAGER` و موارد مشابه دیگر به عنوان persona فروش seed نمی‌شوند؛ این‌ها در `job-titles` قرار گرفتند.
- Persona Library به عنوان کتابخانه محتوای استراتژیک مبتنی بر الگوی سمت حفظ شد و با فیلد فرم شخص جایگزین یا ادغام نشد.
- Migration جدید `20260712120000_separate_person_domain_lookups` lookupهای دپارتمان، سمت سازمانی، سطح ارشدیت و نقش فروش را upsert می‌کند.
- Migration به صورت غیرمخرب، اگر `title` خالی باشد و `personaTag` مقدار شبیه سمت سازمانی داشته باشد، همان مقدار را در `title` کپی می‌کند و مقدار قدیمی `personaTag` را حذف نمی‌کند.
- فایل‌های مهم تغییرکرده/جدید: `prisma/seed.ts`, `prisma/migrations/20260712120000_separate_person_domain_lookups/migration.sql`, `src/lookups/lookup-groups.ts`, `src/lookups/lookups.service.ts`, `src/people/dto/create-person.dto.ts`, `src/people/dto/find-people-directory.dto.ts`, `src/people/people.service.ts`, و `README.md`.
- وابستگی فرانت‌اند: برای dropdownهای جدید از گروه‌های `departments`, `job-titles`, `persona-roles`, و `seniority-levels` استفاده شود. aliasهای `JOB_TITLES`, `POSITIONS`, `PERSONA_ROLES`, و `SENIORITY_LEVELS` هم به slugهای canonical نگاشت می‌شوند. endpoint lookup به صورت پیش‌فرض فقط گزینه‌های فعال را برمی‌گرداند.
- وضعیت بررسی‌ها: `npx prisma validate` موفق بود؛ `npx prisma generate` موفق بود؛ `npm run build` موفق بود؛ `npm run lint` موفق بود با 10 warning غیرمسدودکننده موجود؛ `npm run test` موفق بود: 1 suite و 4 test.

---


### fix 000040 - تکمیل و شفاف‌سازی فیلدهای تعریف فرصت فروش

- تفاوت دامنه‌ای `Company.source` و منبع ایجاد فرصت فروش شفاف شد:
  - `Company.source` / `sourceId` همچنان منبع ورود شرکت یا لید به CRM است.
  - `Opportunity.sourceOptionId` / `sourceOption` منبع ایجاد همان فرصت فروش است.
  - `Opportunity.source` به عنوان snapshot متنی سازگار با نسخه‌های قبلی حفظ شد.
- گروه lookup جدید `opportunity-sources` اضافه شد و alias `OPPORTUNITY_SOURCES` به آن نگاشت می‌شود.
- مقدارهای پیش‌فرض منبع ایجاد فرصت seed شدند: `CUSTOMER_REQUEST`, `DEMO_MEETING`, `DISCOVERY_MEETING`, `UPSELL`, `CROSS_SELL`, `RENEWAL`, `RFP_TENDER`, `PARTNER_REFERRAL`, `INTERNAL_REFERRAL`, `CAMPAIGN_FOLLOWUP`, و `OTHER`.
- فیلدهای اختیاری زیر به Opportunity اضافه شدند: `sourceOptionId`, `primaryContactId`, `probability`, و `competitor`.
- `primaryContactId` فقط مخاطبی را قبول می‌کند که متعلق به همان شرکت فرصت باشد.
- `probability` اختیاری است و در DTO و migration به بازه 0 تا 100 محدود شد.
- Create/Update Opportunity همچنان `source` قدیمی را می‌پذیرد؛ اگر مقدار آن با lookup منبع فرصت match شود، `sourceOptionId` هم پر می‌شود، و اگر match نشود مقدار متنی قدیمی حفظ می‌شود.
- List/Detail Opportunity اکنون summaryهای `sourceOption` و `primaryContact` را برمی‌گردانند.
- فیلترهای فرصت فروش تکمیل شدند: `source`, `opportunitySource`, `sourceOptionId`, `primaryContactId`, `expectedCloseFrom`, و `expectedCloseTo`.
- Migration جدید `20260712123000_clarify_opportunity_definition_fields` ستون‌های nullable جدید، lookupهای منبع فرصت، backfill امن `sourceOptionId` از `source`، ایندکس‌ها و foreign keyها را اضافه می‌کند.
- داده‌های قدیمی حذف یا rename نشدند. اگر `Opportunity.source` شامل مقدارهای lead-source باشد که با opportunity-source match نمی‌شوند، به صورت متن legacy حفظ می‌شود و نیاز به تصمیم/backfill دستی دارد.
- محصولات مرتبط از مسیر موجود line item و `ProductCatalogItem` در detail فرصت نمایش داده می‌شوند؛ رابطه مستقیم Opportunity به Use Case در این fix اضافه نشد و بهبود آینده محسوب می‌شود.
- فایل‌های مهم تغییرکرده/جدید: `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/20260712123000_clarify_opportunity_definition_fields/migration.sql`, `src/lookups/lookup-groups.ts`, `src/lookups/lookups.service.ts`, `src/opportunities/dto/create-opportunity.dto.ts`, `src/opportunities/dto/update-opportunity.dto.ts`, `src/opportunities/dto/find-opportunities.dto.ts`, `src/opportunities/opportunities.service.ts`, و `README.md`.
- وابستگی فرانت‌اند: برای dropdown منبع ایجاد فرصت از `/api/lookups/opportunity-sources` یا alias `OPPORTUNITY_SOURCES` استفاده شود. `estimatedValue` و `expectedCloseDate` همان نام‌های قبلی را حفظ کرده‌اند.
- وضعیت بررسی‌ها: `npx prisma validate` موفق بود؛ `npx prisma generate` موفق بود؛ `npm run build` موفق بود؛ `npm run lint` موفق بود با 10 warning غیرمسدودکننده موجود؛ `npm run test` موفق بود: 1 suite و 4 test.

---


### fix 000041 - استانداردسازی قرارداد تاریخ‌ها برای پشتیبانی از نمایش شمسی در فرانت

- همه فیلدهای `DateTime` در Prisma بررسی شدند و هیچ فیلدی برای پشتیبانی از نمایش شمسی از `DateTime` به `String` تغییر نکرد.
- قرارداد ورودی تاریخ‌ها در DTOهای فعالیت، کار، فرصت فروش، سند تجاری، پرداخت، گزارش و Audit Log به validator مشترک `IsApiDateString` منتقل شد.
- API همچنان مقدارهای تاریخ را به صورت Gregorian/ISO 8601 یا `YYYY-MM-DD` برای تاریخ‌های business/date-only می‌پذیرد؛ رشته‌های جلالی/فارسی مثل `۱۴۰۳/۰۵/۲۰` معتبر نیستند و نباید به backend ارسال شوند.
- مقدارهای `YYYY-MM-DD` برای persistence به UTC midnight تبدیل می‌شوند تا خطای timezone/off-by-one کاهش پیدا کند.
- فیلترهای بازه‌ای تاریخ برای `to` date-only به صورت exclusive next-day ساخته می‌شوند؛ بنابراین `dueTo=2026-07-12` کل روز 12 جولای 2026 را پوشش می‌دهد.
- تبدیل Jalali فقط مسئولیت فرانت‌اند است: فرانت باید تاریخ انتخاب‌شده در UI شمسی را پیش از ارسال به backend به Gregorian `YYYY-MM-DD` یا ISO date-time تبدیل کند.
- خروجی API به رشته جلالی تبدیل نشد و مقدارهای `DateTime` همچنان به شکل استاندارد سریالایز می‌شوند.
- Import اکسل SAM تاریخ business قابل parse نداشت و تغییری در رفتار import/export داده نشد.
- migration لازم نبود؛ schema و نوع ستون‌های دیتابیس بدون تغییر ماندند.
- فایل‌های مهم تغییرکرده/جدید:
  - `src/common/dates/api-date.util.ts`
  - `src/common/validators/api-date-string.validator.ts`
  - `src/activities/dto/*` و `src/activities/activities.service.ts`
  - `src/tasks/dto/*` و `src/tasks/tasks.service.ts`
  - `src/opportunities/dto/*`
  - `src/opportunities/opportunities.service.ts`
  - `src/opportunities/opportunity-commercial-documents.service.ts`
  - `src/opportunities/opportunity-payments.service.ts`
  - `src/reports/dto/report-filters.dto.ts`
  - `src/reports/reports.service.ts`
  - `src/audit-log/dto/find-audit-logs.dto.ts`
  - `src/audit-log/audit-log.service.ts`
  - `test/api-date.util.spec.ts`
- وضعیت بررسی‌ها: `npx prisma validate` موفق بود؛ `npx prisma generate` موفق بود؛ `npm run lint` موفق بود با 10 warning غیرمسدودکننده موجود؛ `npm run test` موفق بود: 2 suite و 9 test؛ `npm run build` موفق بود.
- هشدار غیرمسدودکننده: `npx prisma validate` پیام در دسترس بودن نسخه major جدید Prisma را نمایش داد؛ این پیام خطا نبود.

---

### fix 000042 - بازبینی قرارداد تاریخ و زمان برای انتخابگر شمسی فرانت

- DTOهای ورودی تاریخ/زمان برای activity، task، opportunity، payment، commercial document، report و audit log بازبینی شدند؛ قرارداد فعلی همچنان `IsApiDateString` و مقدار Gregorian `YYYY-MM-DD` یا ISO 8601 date-time است.
- ذخیره‌سازی دیتابیس بدون تغییر ماند: هیچ فیلد `DateTime` به `String` تبدیل نشد و هیچ رشته Jalali/Persian در persistence اضافه نشد.
- خروجی‌های API همچنان machine-readable هستند و تبدیل/نمایش Jalali مسئولیت فرانت‌اند باقی ماند.
- اصلاح کمینه انجام شد: در گزارش activity، وقتی `endDate` به شکل date-only ارسال شود، فیلتر دیتابیس همچنان از upper-bound انحصاری روز بعد استفاده می‌کند، اما metadata خروجی `endDate` همان تاریخ انتخاب‌شده Gregorian را برمی‌گرداند تا فرانت با off-by-one نمایشی روبه‌رو نشود.
- تست واحد اضافه شد تا ثابت کند `endDate=2026-07-12` در query به `lt: 2026-07-13T00:00:00.000Z` تبدیل می‌شود ولی response metadata مقدار `2026-07-12T00:00:00.000Z` را نگه می‌دارد.
- فیلدهای date-only/business طبق convention فعلی: `expectedCloseDate`، payment `dueDate`، document `validUntil` و report range endpoints می‌توانند با `YYYY-MM-DD` ارسال شوند؛ فیلدهای true date-time مثل `reminderAt`، `paidAt`، `sentAt`، `acceptedAt`، `rejectedAt`، `signedAt` و lifecycle timestamps همچنان ISO date-time را هم می‌پذیرند.
- فایل‌های مهم تغییرکرده:
  - `src/reports/reports.service.ts`
  - `test/reports.service.spec.ts`
  - `README.md`
- وابستگی فرانت‌اند: انتخابگر شمسی باید مقدار انتخاب‌شده را پیش از ارسال به backend به Gregorian `YYYY-MM-DD` برای date-only یا ISO 8601 برای date-time تبدیل کند؛ backend رشته Jalali مثل `1403/05/20` را نمی‌پذیرد.
- migration لازم نبود؛ schema و نوع ستون‌های دیتابیس بدون تغییر ماندند.
- وضعیت بررسی‌ها: `npx prisma validate` موفق بود؛ `npx prisma generate` موفق بود؛ `npm run lint` موفق بود با 10 warning موجود و 0 error؛ `npm run test` موفق بود: 3 suite و 10 test؛ `npm run build` موفق بود.

---

### fix 000043 - اصلاح انتساب شرکت در ایجاد کار از داخل فرصت

- رفتار ایجاد و ویرایش task بازبینی شد تا وقتی `opportunityId` ارسال می‌شود، `companyId` همیشه از `opportunity.companyId` مشتق شود و مقدار ارسالی کاربر منبع حقیقت نباشد.
- اگر در create/update همزمان `opportunityId` و `companyId` ناسازگار ارسال شوند، API با پیام روشن `Task company must match the selected opportunity company.` خطای `BadRequestException` برمی‌گرداند.
- ایجاد task عمومی از صفحه Tasks همچنان با `companyId` مستقل پشتیبانی می‌شود و task مستقل بدون company/opportunity طبق رفتار قبلی مجاز باقی ماند.
- اعتبارسنجی رابطه‌ها متمرکز شد: person باید با شرکت task هم‌خوان باشد؛ commercial document و payment باید با همان opportunity/company context سازگار باشند و لینک cross-company/cross-opportunity پذیرفته نمی‌شود.
- lookupهای company، opportunity، person، commercial document و payment همچنان با scope سازمان فعلی و visibility نقش کاربر انجام می‌شوند؛ `organizationId` خود task مثل قبل از کاربر فعلی تنظیم می‌شود.
- پاسخ‌های list/detail task همچنان context لازم برای فرانت را دارد: summary شرکت، فرصت، شخص، سند تجاری و پرداخت در `taskInclude` حفظ شد و `opportunity.archivedAt` برای منطق داخلی scope/consistency اضافه شد.
- فایل‌های مهم تغییرکرده/جدید:
  - `src/tasks/tasks.service.ts`
  - `test/tasks.service.spec.ts`
  - `README.md`
- وابستگی فرانت‌اند: در فرم ایجاد task داخل Opportunity کافی است `opportunityId` ارسال شود؛ ارسال `companyId` اختیاری و فقط در صورت تطابق با شرکت فرصت پذیرفته می‌شود. برای task عمومی، `companyId` همچنان قابل استفاده است.
- migration لازم نبود؛ schema و داده‌های موجود تغییر نکردند و هیچ داده‌ای حذف نشد.
- وضعیت بررسی‌ها: `npx prisma validate` موفق بود؛ `npx prisma generate` موفق بود؛ `npm run lint` موفق بود با 10 warning موجود و 0 error؛ `npm run test` موفق بود: 4 suite و 14 test؛ `npm run build` موفق بود.
- هشدار غیرمسدودکننده: `npx prisma validate` پیام در دسترس بودن نسخه major جدید Prisma را نمایش داد؛ این پیام خطا نبود.

---

### fix 000044 - افزودن ماژول مدیریت تیم‌ها و حذف وابستگی به تیم تایپی کاربران

- مدل `Team` به Prisma اضافه شد و `User.teamId` به صورت nullable کنار `User.team` legacy نگه داشته شد؛ حذف یا تبدیل مخرب روی مقدارهای متنی قبلی انجام نشد.
- migration جدید `20260713120000_add_managed_teams` جدول `teams`، ایندکس‌ها، کلیدهای خارجی و backfill امن از مقدارهای distinct و غیرخالی `users.team` را اضافه می‌کند و کاربران هم‌نام را به تیم ساخته‌شده وصل می‌کند.
- ماژول `Teams` اضافه شد و APIهای مدیریت تیم، فعال/غیرفعال‌سازی، مشاهده اعضا و افزودن/حذف عضو را با permissionهای `team:view` و `team:manage` ارائه می‌کند.
- seed اولیه تیم‌ها اضافه شد: `ENTERPRISE_SALES`، `BANKING_SALES`، `PUBLIC_SECTOR_SALES` و `PARTNER_SALES`؛ permissionهای تیم نیز seed می‌شوند و `MANAGER` فقط `team:view` می‌گیرد.
- Create/Update کاربران همچنان `team` متنی legacy را می‌پذیرد، اما `teamId` را برای فرانت جدید ترجیح می‌دهد؛ در صورت ارسال `teamId`، فقط تیم فعال در organization فعلی قابل انتساب است و مقدار legacy `team` با `team.code` همگام می‌شود.
- payload احراز هویت و current user با `teamId`، `teamCode` و `teamName` تکمیل شد، در حالی که `team` قبلی برای سازگاری باقی ماند.
- visibility مدیران در کاربران، شرکت‌ها، فرصت‌ها، کارها، گزارش‌ها و resourceهای وابسته با `teamId` و fallback روی `team` legacy سازگار شد تا در دوره گذار نشتی cross-team یا قطع دسترسی ناخواسته ایجاد نشود.
- فیلترها و گزینه‌های گزارش اکنون تیم‌های واقعی را به عنوان منبع اصلی برمی‌گردانند و مقدارهای legacy باقی‌مانده را برای سازگاری حفظ می‌کنند؛ فیلتر `teams` می‌تواند id/code/name تیم واقعی یا مقدار legacy را بپذیرد.
- lookup group قدیمی `teams` حذف نشد و فقط به عنوان مسیر سازگاری باقی می‌ماند؛ منبع حقیقت جدید برای مدیریت تیم‌ها API تیم‌ها است.
- فایل‌های مهم تغییرکرده/جدید:
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
- وابستگی فرانت‌اند: فرم‌های جدید باید `teamId` را برای انتساب تیم ارسال کنند؛ نمایش نام/کد تیم می‌تواند از response کاربر یا `/api/teams` گرفته شود. `team` متنی فقط برای سازگاری با کلاینت‌های قدیمی باقی مانده است.
- migration لازم است و غیرمخرب است؛ اجرای deploy migration باید قبل از انتشار APIهای جدید انجام شود. داده‌های legacy `users.team` حذف یا پاک‌سازی نمی‌شوند.
- وضعیت بررسی‌ها: `npx prisma validate` موفق بود؛ `npx prisma generate` موفق بود؛ `npm run build` موفق بود؛ `npm run lint` موفق بود با 10 warning موجود و 0 error.
- تست واحد/API زنده اجرا نشد.

---

### fix 000045 - اصلاح مجوزهای دسترسی ماژول تیم‌ها

- کنترلر `TeamsController` بازبینی شد؛ endpointهای تیم همچنان پشت `JwtAuthGuard` و `PermissionsGuard` باقی ماندند و عمومی یا bypass نشدند.
- decoratorهای دسترسی تیم تأیید شدند:
  - مشاهده لیست، جزئیات و اعضا با `team:view`
  - ایجاد، ویرایش، فعال/غیرفعال‌سازی و افزودن/حذف عضو با `team:manage`
- seed مجوزها اصلاح شد تا `team:view` با توضیح `مشاهده تیم‌ها` و `team:manage` با توضیح `مدیریت تیم‌ها` ثبت یا به‌روزرسانی شود.
- migration داده‌ای غیرمخرب `20260714120000_fix_team_permissions` اضافه شد تا روی دیتابیس‌های موجود نیز `team:view` و `team:manage` ساخته/به‌روزرسانی شوند، هر دو مجوز به `ADMIN` داده شوند و `team:view` به `MANAGER` داده شود.
- `REP` و `BOARDS` در این اصلاح مجوز تیم دریافت نکردند؛ بنابراین کاربران عادی بدون permission همچنان 403 می‌گیرند.
- رفتار Auth/JWT بررسی شد: permissions در پاسخ login برای فرانت برگردانده می‌شود، اما `PermissionsGuard` مجوزها را از دیتابیس و cache نقش می‌خواند؛ بعد از migration/seed، برای نمایش درست permissionهای جدید در UI بهتر است کاربر دوباره login کند.
- نکته cache: cache داخلی `PermissionsGuard` ده دقیقه TTL دارد؛ پس بعد از اجرای migration/seed در یک پروسه در حال اجرا، restart سرویس یا صبر تا انقضای cache می‌تواند برای رفع 403های cacheشده لازم باشد.
- وابستگی فرانت‌اند: برای `GET /api/teams?includeInactive=true` کاربر باید `team:view` داشته باشد و برای `POST /api/teams` باید `team:manage` داشته باشد؛ ADMIN بعد از اعمال migration/seed هر دو را دارد.
- فایل‌های مهم تغییرکرده/جدید:
  - `prisma/seed.ts`
  - `prisma/migrations/20260714120000_fix_team_permissions/migration.sql`
  - `README.md`
- وضعیت بررسی‌ها: `npx prisma validate` موفق بود؛ `npx prisma generate` موفق بود؛ `npm run lint` موفق بود با 10 warning موجود و 0 error؛ `npm run build` موفق بود.
- هشدار غیرمسدودکننده: `npx prisma generate` پیام در دسترس بودن نسخه major جدید Prisma را نمایش داد؛ این پیام خطا نبود.

---

### fix 000046 - اصلاح اعتبارسنجی پارامتر includeInactive در فهرست تیم‌ها

- DTO فهرست تیم‌ها اصلاح شد تا query parameter جدید `includeInactive` را بشناسد و مقدارهای boolean ارسالی به شکل string را درست parse کند.
- مقدارهای قابل قبول برای `includeInactive`: `true`، `false`، `1` و `0`؛ مقدار نامعتبر همچنان با validation خطای 400 می‌گیرد.
- علت 400 این بود که فرانت `includeInactive=true` می‌فرستاد اما DTO قبلی فقط `isActive` را تعریف کرده بود و در ValidationPipe سخت‌گیر، پارامتر ناشناخته رد می‌شد.
- منطق سرویس فهرست تیم‌ها اصلاح شد: در حالت پیش‌فرض فقط تیم‌های فعال برمی‌گردند، اما `includeInactive=true` تیم‌های فعال و غیرفعال را با هم برمی‌گرداند. فیلتر صریح `isActive` همچنان پشتیبانی می‌شود.
- فایل‌های مهم تغییرکرده:
  - `src/teams/dto/find-teams.dto.ts`
  - `src/teams/teams.service.ts`
  - `README.md`
- وابستگی فرانت‌اند: فراخوانی موجود `GET /api/teams?includeInactive=true` بدون تغییر در فرانت باید معتبر باشد.
- Prisma generate لازم نبود و اجرا نشد؛ `npx prisma validate` موفق بود.
- وضعیت بررسی‌ها: `npm run lint` موفق بود با 10 warning موجود و 0 error؛ `npm run build` موفق بود.

---

### fix 000047 - افزودن بارگذاری فایل سند روی MinIO

- جریان ایجاد سند تجاری تکمیل شد تا علاوه بر `fileUrl` قدیمی، امکان ارسال فایل واقعی با `multipart/form-data` وجود داشته باشد.
- endpoint جدید اضافه شد: `POST /api/opportunities/:opportunityId/commercial-documents/upload`
  - فیلد فایل: `file`
  - فیلدهای metadata همان قرارداد `CreateCommercialDocumentDto` هستند، مثل `type`, `title`, `status`, `amount`, `validUntil`, `externalRef`, `notes`.
- فایل از مسیر backend دریافت می‌شود و با همان زیرساخت موجود `AttachmentsService` در storage فعلی پروژه ذخیره می‌شود؛ اگر `ATTACHMENT_STORAGE_DRIVER=minio` باشد، ذخیره در MinIO/S3-compatible انجام می‌شود.
- فایل آپلودشده به صورت `FileAttachment` با `entityType=COMMERCIAL_DOCUMENT` و `entityId=document.id` ثبت می‌شود؛ metadata شامل نام اصلی فایل، نام ذخیره‌شده، bucket/objectKey یا مسیر local، MIME type، اندازه، sha256، uploader و `organizationId` ذخیره می‌شود.
- پاسخ endpoint جدید شامل داده سند و `fileAttachment` summary است. دانلود امن همچنان از مسیر موجود `GET /api/attachments/:id/download` انجام می‌شود و کلید خصوصی MinIO به فرانت داده نمی‌شود.
- قرارداد قدیمی `fileUrl` حذف نشد و endpoint JSON قبلی برای سندهای لینک‌محور یا داده‌های قدیمی باقی ماند.
- اعتبارسنجی فایل از مسیر موجود attachments استفاده می‌کند: محدودیت اندازه، رد فایل خالی، MIME typeهای مجاز و scope/permission سازمانی. MIME typeهای پیش‌فرض برای PDF، PNG/JPEG، Word و Excel تکمیل شدند.
- اگر upload فایل بعد از ساخت سند شکست بخورد، سند ساخته‌شده rollback/delete می‌شود تا رکورد سند بدون فایل از endpoint آپلود باقی نماند.
- فایل‌های مهم تغییرکرده:
  - `src/attachments/attachments.module.ts`
  - `src/attachments/attachments.service.ts`
  - `src/opportunities/opportunities.module.ts`
  - `src/opportunities/opportunity-commercial-documents.controller.ts`
  - `src/opportunities/opportunity-commercial-documents.service.ts`
  - `README.md`
- وابستگی فرانت‌اند: فرم Add Document باید برای آپلود واقعی از `multipart/form-data` و فیلد `file` استفاده کند؛ آپلود مستقیم به MinIO لازم نیست و نباید انجام شود.
- migration لازم نبود؛ schema موجود `FileAttachment` برای اتصال فایل به سند استفاده شد.
- وضعیت بررسی‌ها: `npx prisma validate` موفق بود؛ `npx prisma generate` موفق بود؛ `npm run lint` موفق بود با 10 warning موجود و 0 error؛ `npm run build` پس از یک retry به دلیل lock موقت فایل `dist/tsconfig.tsbuildinfo` موفق بود.
- هشدار غیرمسدودکننده: `npx prisma generate` پیام در دسترس بودن نسخه major جدید Prisma را نمایش داد؛ این پیام خطا نبود.

---

### fix 000048 - رفع خطای دانلود پیوست‌های ذخیره‌شده در MinIO

- مسیر دانلود `GET /api/attachments/:id/download` بازبینی و اصلاح شد تا فایل‌های ذخیره‌شده در MinIO از طریق backend به صورت stream امن دانلود شوند.
- دانلود اکنون bucket ذخیره‌شده روی رکورد `FileAttachment.bucket` را به storage adapter پاس می‌دهد؛ بنابراین اگر bucket آپلود با مقدار فعلی config تفاوت داشته باشد، دانلود همچنان از bucket صحیح انجام می‌شود.
- خطاهای قابل انتظار MinIO/S3 مثل `NoSuchKey`، `NotFound`، `NoSuchBucket` یا پاسخ 404 به `NotFoundException` تبدیل می‌شوند و دیگر به عنوان 500 عمومی برنمی‌گردند.
- خطاهای غیرمنتظره storage در سمت سرور log می‌شوند و با `ServiceUnavailableException` کنترل‌شده برمی‌گردند؛ credential یا جزئیات حساس MinIO به فرانت ارسال نمی‌شود.
- اگر رکورد پیوست objectKey ذخیره‌شده نداشته باشد، دانلود با `BadRequestException` متوقف می‌شود تا رکوردهای legacy/link-only به اشتباه از MinIO خوانده نشوند.
- هدر `Content-Disposition` اصلاح شد تا نام فایل‌های فارسی/دارای فاصله با fallback امن ASCII و `filename*` UTF-8 ارسال شود.
- scope سازمانی و permissionهای موجود تغییر نکردند: رکورد پیوست همچنان با `organizationId` کاربر فعلی پیدا می‌شود و دسترسی entity مربوطه قبل از stream بررسی می‌شود.
- فایل‌های مهم تغییرکرده:
  - `src/attachments/attachments.controller.ts`
  - `src/attachments/attachments.service.ts`
  - `src/attachments/storage/attachment-storage.types.ts`
  - `src/attachments/storage/minio-attachment-storage.service.ts`
  - `README.md`
- وابستگی فرانت‌اند: دانلود همچنان باید از مسیر backend یعنی `/api/attachments/:id/download` انجام شود؛ فرانت نباید از MinIO URL یا credential مستقیم استفاده کند.
- migration لازم نبود؛ schema تغییر نکرد. `npx prisma generate` برای هماهنگی local Prisma Client اجرا شد و موفق بود.
- وضعیت بررسی‌ها: `npx prisma validate` موفق بود؛ `npm run lint` موفق بود با 10 warning موجود و 0 error؛ `npm run build` پس از `npx prisma generate` موفق بود.

---

**Built with ❤️ for sales team**

---
