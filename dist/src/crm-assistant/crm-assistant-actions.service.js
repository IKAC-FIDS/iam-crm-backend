"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmAssistantActionsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_crypto_1 = require("node:crypto");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const audit_log_service_1 = require("../audit-log/audit-log.service");
const tenant_scope_util_1 = require("../common/tenant/tenant-scope.util");
const companies_service_1 = require("../companies/companies.service");
const create_company_dto_1 = require("../companies/dto/create-company.dto");
const opportunities_service_1 = require("../opportunities/opportunities.service");
const create_opportunity_dto_1 = require("../opportunities/dto/create-opportunity.dto");
const tasks_service_1 = require("../tasks/tasks.service");
const create_task_dto_1 = require("../tasks/dto/create-task.dto");
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'STRATEGIC'];
const nullableString = (description) => ({ type: ['string', 'null'], description });
let CrmAssistantActionsService = class CrmAssistantActionsService {
    constructor(config, companies, opportunities, tasks, audit) {
        this.config = config;
        this.companies = companies;
        this.opportunities = opportunities;
        this.tasks = tasks;
        this.audit = audit;
        this.tokenStates = new Map();
        this.definitions = [
            {
                name: 'propose_create_company', action: 'company.create', title: 'ایجاد شرکت', permission: 'company:create',
                description: 'فقط یک پیش‌نویس قابل تأیید برای ایجاد شرکت می‌سازد؛ هیچ تغییری در CRM اعمال نمی‌کند.',
                inputSchema: {
                    type: 'object', additionalProperties: false,
                    properties: {
                        legalName: { type: 'string', description: 'نام حقوقی الزامی شرکت' },
                        brandName: nullableString('نام تجاری'),
                        priority: { type: ['string', 'null'], enum: [...priorities, null], description: 'اولویت' },
                        website: nullableString('وب‌سایت'), headOfficeCity: nullableString('شهر دفتر مرکزی'),
                        centralPhone: nullableString('تلفن مرکزی'), ownerId: nullableString('شناسه UUID مالک؛ فقط اگر با ابزارهای خواندن مشخص شده باشد'),
                    },
                    required: ['legalName', 'brandName', 'priority', 'website', 'headOfficeCity', 'centralPhone', 'ownerId'],
                },
            },
            {
                name: 'propose_create_opportunity', action: 'opportunity.create', title: 'ایجاد فرصت فروش', permission: 'opportunity:create',
                description: 'فقط یک پیش‌نویس قابل تأیید برای ایجاد فرصت می‌سازد؛ companyId باید از داده واقعی CRM آمده باشد.',
                inputSchema: {
                    type: 'object', additionalProperties: false,
                    properties: {
                        companyId: { type: 'string', description: 'شناسه UUID شرکت موجود' }, title: { type: 'string', description: 'عنوان فرصت' },
                        description: nullableString('شرح'), priority: { type: ['string', 'null'], enum: [...priorities, null] },
                        estimatedValue: { type: ['number', 'null'], minimum: 0 }, expectedCloseDate: nullableString('تاریخ API به شکل YYYY-MM-DD'),
                        ownerId: nullableString('شناسه UUID مالک'), stageId: nullableString('شناسه UUID مرحله پایپلاین'),
                    },
                    required: ['companyId', 'title', 'description', 'priority', 'estimatedValue', 'expectedCloseDate', 'ownerId', 'stageId'],
                },
            },
            {
                name: 'propose_create_task', action: 'task.create', title: 'ایجاد کار', permission: 'task:create',
                description: 'فقط یک پیش‌نویس قابل تأیید برای ایجاد کار می‌سازد و در این مرحله هیچ کاری ثبت نمی‌شود.',
                inputSchema: {
                    type: 'object', additionalProperties: false,
                    properties: {
                        title: { type: 'string', description: 'عنوان کار' }, description: nullableString('شرح'),
                        priority: { type: ['string', 'null'], enum: [...priorities, null] }, dueAt: nullableString('تاریخ یا زمان سررسید با قرارداد API'),
                        companyId: nullableString('شناسه UUID شرکت مرتبط'), opportunityId: nullableString('شناسه UUID فرصت مرتبط'),
                        assignedToId: nullableString('شناسه UUID مسئول'),
                    },
                    required: ['title', 'description', 'priority', 'dueAt', 'companyId', 'opportunityId', 'assignedToId'],
                },
            },
        ];
    }
    listFor(user) {
        return this.definitions.filter((definition) => this.hasPermission(user, definition.permission));
    }
    async propose(name, rawArguments, user) {
        const definition = this.definitions.find((item) => item.name === name);
        if (!definition || !this.hasPermission(user, definition.permission))
            throw new common_1.ForbiddenException('اجازه اجرای این عملیات را ندارید');
        const args = this.cleanArguments(rawArguments);
        await this.validateAction(definition.action, args);
        const now = Date.now();
        const payload = {
            v: 1, action: definition.action, args, userId: user.userId,
            organizationId: (0, tenant_scope_util_1.getCurrentOrganizationId)(user), membershipId: user.membershipId ?? null,
            iat: now, exp: now + 5 * 60_000, nonce: (0, node_crypto_1.randomUUID)(),
        };
        return {
            token: this.sign(payload), actionType: definition.action, title: definition.title,
            description: 'این عملیات هنوز اجرا نشده است و به تأیید صریح شما نیاز دارد.',
            fields: this.previewFields(definition.action, args), expiresAt: new Date(payload.exp).toISOString(),
        };
    }
    async confirm(token, user) {
        this.cleanupStates();
        const payload = this.verify(token, user);
        const permission = this.permissionFor(payload.action);
        if (!this.hasPermission(user, permission))
            throw new common_1.ForbiddenException('دسترسی لازم برای این عملیات را ندارید');
        if (this.tokenStates.has(payload.nonce))
            throw new common_1.ConflictException('این عملیات قبلاً اجرا شده یا هم‌اکنون در حال اجرا است');
        this.tokenStates.set(payload.nonce, { state: 'executing', expiresAt: payload.exp });
        try {
            const dto = await this.validateAction(payload.action, payload.args);
            let entity;
            if (payload.action === 'company.create') {
                const created = await this.companies.create(dto, user);
                entity = { id: created.id, label: created.brandName || created.legalName, href: `/companies/${created.id}` };
            }
            else if (payload.action === 'opportunity.create') {
                const created = await this.opportunities.create(dto, user);
                entity = { id: created.id, label: created.title, href: `/opportunities/${created.id}` };
            }
            else {
                const created = await this.tasks.create(dto, user);
                entity = { id: created.id, label: created.title, href: `/tasks/${created.id}` };
            }
            this.tokenStates.set(payload.nonce, { state: 'executed', expiresAt: payload.exp });
            await this.audit.recordTenantEvent({
                actorId: user.userId, actorMembershipId: user.membershipId,
                organizationId: payload.organizationId, entityType: 'crm-assistant', entityId: entity.id,
                action: 'crm-assistant.action_confirmed', metadata: { actionType: payload.action, nonce: payload.nonce },
            });
            return { actionType: payload.action, entity, message: `${this.titleFor(payload.action)} با موفقیت انجام شد.` };
        }
        catch (error) {
            if (this.tokenStates.get(payload.nonce)?.state === 'executing')
                this.tokenStates.delete(payload.nonce);
            throw error;
        }
    }
    async validateAction(action, args) {
        const dto = action === 'company.create'
            ? (0, class_transformer_1.plainToInstance)(create_company_dto_1.CreateCompanyDto, args)
            : action === 'opportunity.create'
                ? (0, class_transformer_1.plainToInstance)(create_opportunity_dto_1.CreateOpportunityDto, args)
                : (0, class_transformer_1.plainToInstance)(create_task_dto_1.CreateTaskDto, args);
        const errors = await (0, class_validator_1.validate)(dto, { whitelist: true, forbidNonWhitelisted: true, stopAtFirstError: false });
        if (errors.length) {
            const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));
            throw new common_1.BadRequestException({ code: 'ASSISTANT_ACTION_INVALID', message: 'اطلاعات پیشنهادی معتبر نیست', details: messages });
        }
        return dto;
    }
    cleanArguments(value) {
        const input = value && typeof value === 'object' ? value : {};
        return Object.fromEntries(Object.entries(input).flatMap(([key, raw]) => {
            if (raw == null || raw === '')
                return [];
            return [[key, typeof raw === 'string' ? raw.trim() : raw]];
        }));
    }
    previewFields(action, args) {
        const labels = {
            legalName: 'نام حقوقی', brandName: 'نام تجاری', companyId: 'شناسه شرکت', title: 'عنوان', description: 'شرح',
            priority: 'اولویت', website: 'وب‌سایت', headOfficeCity: 'شهر', centralPhone: 'تلفن', estimatedValue: 'ارزش تخمینی',
            expectedCloseDate: 'تاریخ بستن', dueAt: 'سررسید', ownerId: 'مالک', assignedToId: 'مسئول', stageId: 'مرحله', opportunityId: 'فرصت مرتبط',
        };
        return Object.entries(args).filter(([, value]) => value !== undefined).map(([key, value]) => ({ label: labels[key] ?? key, value: String(value) }));
    }
    sign(payload) {
        const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
        return `${encoded}.${(0, node_crypto_1.createHmac)('sha256', this.secret()).update(encoded).digest('base64url')}`;
    }
    verify(token, user) {
        const [encoded, signature, extra] = token.split('.');
        if (!encoded || !signature || extra)
            throw new common_1.UnauthorizedException('توکن تأیید معتبر نیست');
        const expected = (0, node_crypto_1.createHmac)('sha256', this.secret()).update(encoded).digest();
        let received;
        try {
            received = Buffer.from(signature, 'base64url');
        }
        catch {
            throw new common_1.UnauthorizedException('توکن تأیید معتبر نیست');
        }
        if (received.length !== expected.length || !(0, node_crypto_1.timingSafeEqual)(received, expected))
            throw new common_1.UnauthorizedException('توکن تأیید معتبر نیست');
        let payload;
        try {
            payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
        }
        catch {
            throw new common_1.UnauthorizedException('توکن تأیید معتبر نیست');
        }
        const organizationId = (0, tenant_scope_util_1.getCurrentOrganizationId)(user);
        if (payload.v !== 1 || payload.exp <= Date.now())
            throw new common_1.UnauthorizedException('مهلت تأیید این عملیات تمام شده است');
        if (payload.userId !== user.userId || payload.organizationId !== organizationId || payload.membershipId !== (user.membershipId ?? null)) {
            throw new common_1.UnauthorizedException('این عملیات متعلق به نشست جاری نیست');
        }
        return payload;
    }
    secret() {
        const value = this.config.get('ASSISTANT_ACTION_SECRET')?.trim() || this.config.get('JWT_SECRET')?.trim();
        if (!value)
            throw new common_1.BadRequestException('کلید امضای عملیات دستیار پیکربندی نشده است');
        return `crm-assistant-action:${value}`;
    }
    hasPermission(user, permission) {
        const permissions = user.tenantContext?.permissions;
        if (permissions)
            return permissions.includes(permission);
        return user.role === 'ADMIN';
    }
    permissionFor(action) { return action === 'company.create' ? 'company:create' : action === 'opportunity.create' ? 'opportunity:create' : 'task:create'; }
    titleFor(action) { return action === 'company.create' ? 'ایجاد شرکت' : action === 'opportunity.create' ? 'ایجاد فرصت فروش' : 'ایجاد کار'; }
    cleanupStates() { const now = Date.now(); for (const [nonce, value] of this.tokenStates)
        if (value.expiresAt <= now)
            this.tokenStates.delete(nonce); }
};
exports.CrmAssistantActionsService = CrmAssistantActionsService;
exports.CrmAssistantActionsService = CrmAssistantActionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        companies_service_1.CompaniesService,
        opportunities_service_1.OpportunitiesService,
        tasks_service_1.TasksService,
        audit_log_service_1.AuditLogService])
], CrmAssistantActionsService);
//# sourceMappingURL=crm-assistant-actions.service.js.map