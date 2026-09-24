import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { getCurrentOrganizationId } from '../common/tenant/tenant-scope.util';
import { CompaniesService } from '../companies/companies.service';
import { CreateCompanyDto } from '../companies/dto/create-company.dto';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { CreateOpportunityDto } from '../opportunities/dto/create-opportunity.dto';
import { TasksService } from '../tasks/tasks.service';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import type { CrmAssistantToolDefinition } from './crm-assistant-tools.service';

type ActionType = 'company.create' | 'opportunity.create' | 'task.create';
type TokenState = 'executing' | 'executed';

interface ActionTokenPayload {
  v: 1;
  action: ActionType;
  args: Record<string, unknown>;
  userId: string;
  organizationId: string;
  membershipId: string | null;
  iat: number;
  exp: number;
  nonce: string;
}

interface ActionDefinition extends CrmAssistantToolDefinition {
  action: ActionType;
  title: string;
}

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'STRATEGIC'];
const nullableString = (description: string) => ({ type: ['string', 'null'], description });

@Injectable()
export class CrmAssistantActionsService {
  private readonly tokenStates = new Map<string, { state: TokenState; expiresAt: number }>();

  readonly definitions: readonly ActionDefinition[] = [
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

  constructor(
    private readonly config: ConfigService,
    private readonly companies: CompaniesService,
    private readonly opportunities: OpportunitiesService,
    private readonly tasks: TasksService,
    private readonly audit: AuditLogService,
  ) {}

  listFor(user: CurrentUserPayload) {
    return this.definitions.filter((definition) => this.hasPermission(user, definition.permission));
  }

  async propose(name: string, rawArguments: unknown, user: CurrentUserPayload) {
    const definition = this.definitions.find((item) => item.name === name);
    if (!definition || !this.hasPermission(user, definition.permission)) throw new ForbiddenException('اجازه اجرای این عملیات را ندارید');
    const args = this.cleanArguments(rawArguments);
    await this.validateAction(definition.action, args);
    const now = Date.now();
    const payload: ActionTokenPayload = {
      v: 1, action: definition.action, args, userId: user.userId,
      organizationId: getCurrentOrganizationId(user), membershipId: user.membershipId ?? null,
      iat: now, exp: now + 5 * 60_000, nonce: randomUUID(),
    };
    return {
      token: this.sign(payload), actionType: definition.action, title: definition.title,
      description: 'این عملیات هنوز اجرا نشده است و به تأیید صریح شما نیاز دارد.',
      fields: this.previewFields(definition.action, args), expiresAt: new Date(payload.exp).toISOString(),
    };
  }

  async confirm(token: string, user: CurrentUserPayload) {
    this.cleanupStates();
    const payload = this.verify(token, user);
    const permission = this.permissionFor(payload.action);
    if (!this.hasPermission(user, permission)) throw new ForbiddenException('دسترسی لازم برای این عملیات را ندارید');
    if (this.tokenStates.has(payload.nonce)) throw new ConflictException('این عملیات قبلاً اجرا شده یا هم‌اکنون در حال اجرا است');
    this.tokenStates.set(payload.nonce, { state: 'executing', expiresAt: payload.exp });
    try {
      const dto = await this.validateAction(payload.action, payload.args);
      let entity: { id: string; label: string; href: string };
      if (payload.action === 'company.create') {
        const created = await this.companies.create(dto as CreateCompanyDto, user);
        entity = { id: created.id, label: created.brandName || created.legalName, href: `/companies/${created.id}` };
      } else if (payload.action === 'opportunity.create') {
        const created = await this.opportunities.create(dto as CreateOpportunityDto, user);
        entity = { id: created.id, label: created.title, href: `/opportunities/${created.id}` };
      } else {
        const created = await this.tasks.create(dto as CreateTaskDto, user);
        entity = { id: created.id, label: created.title, href: `/tasks/${created.id}` };
      }
      this.tokenStates.set(payload.nonce, { state: 'executed', expiresAt: payload.exp });
      await this.audit.recordTenantEvent({
        actorId: user.userId, actorMembershipId: user.membershipId,
        organizationId: payload.organizationId, entityType: 'crm-assistant', entityId: entity.id,
        action: 'crm-assistant.action_confirmed', metadata: { actionType: payload.action, nonce: payload.nonce },
      });
      return { actionType: payload.action, entity, message: `${this.titleFor(payload.action)} با موفقیت انجام شد.` };
    } catch (error) {
      if (this.tokenStates.get(payload.nonce)?.state === 'executing') this.tokenStates.delete(payload.nonce);
      throw error;
    }
  }

  private async validateAction(action: ActionType, args: Record<string, unknown>) {
    const dto = action === 'company.create'
      ? plainToInstance(CreateCompanyDto, args)
      : action === 'opportunity.create'
        ? plainToInstance(CreateOpportunityDto, args)
        : plainToInstance(CreateTaskDto, args);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true, stopAtFirstError: false });
    if (errors.length) {
      const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));
      throw new BadRequestException({ code: 'ASSISTANT_ACTION_INVALID', message: 'اطلاعات پیشنهادی معتبر نیست', details: messages });
    }
    return dto;
  }

  private cleanArguments(value: unknown) {
    const input = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return Object.fromEntries(Object.entries(input).flatMap(([key, raw]) => {
      if (raw == null || raw === '') return [];
      return [[key, typeof raw === 'string' ? raw.trim() : raw]];
    }));
  }

  private previewFields(action: ActionType, args: Record<string, unknown>) {
    const labels: Record<string, string> = {
      legalName: 'نام حقوقی', brandName: 'نام تجاری', companyId: 'شناسه شرکت', title: 'عنوان', description: 'شرح',
      priority: 'اولویت', website: 'وب‌سایت', headOfficeCity: 'شهر', centralPhone: 'تلفن', estimatedValue: 'ارزش تخمینی',
      expectedCloseDate: 'تاریخ بستن', dueAt: 'سررسید', ownerId: 'مالک', assignedToId: 'مسئول', stageId: 'مرحله', opportunityId: 'فرصت مرتبط',
    };
    return Object.entries(args).filter(([, value]) => value !== undefined).map(([key, value]) => ({ label: labels[key] ?? key, value: String(value) }));
  }

  private sign(payload: ActionTokenPayload) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${createHmac('sha256', this.secret()).update(encoded).digest('base64url')}`;
  }

  private verify(token: string, user: CurrentUserPayload): ActionTokenPayload {
    const [encoded, signature, extra] = token.split('.');
    if (!encoded || !signature || extra) throw new UnauthorizedException('توکن تأیید معتبر نیست');
    const expected = createHmac('sha256', this.secret()).update(encoded).digest();
    let received: Buffer;
    try { received = Buffer.from(signature, 'base64url'); } catch { throw new UnauthorizedException('توکن تأیید معتبر نیست'); }
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new UnauthorizedException('توکن تأیید معتبر نیست');
    let payload: ActionTokenPayload;
    try { payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as ActionTokenPayload; }
    catch { throw new UnauthorizedException('توکن تأیید معتبر نیست'); }
    const organizationId = getCurrentOrganizationId(user);
    if (payload.v !== 1 || payload.exp <= Date.now()) throw new UnauthorizedException('مهلت تأیید این عملیات تمام شده است');
    if (payload.userId !== user.userId || payload.organizationId !== organizationId || payload.membershipId !== (user.membershipId ?? null)) {
      throw new UnauthorizedException('این عملیات متعلق به نشست جاری نیست');
    }
    return payload;
  }

  private secret() {
    const value = this.config.get<string>('ASSISTANT_ACTION_SECRET')?.trim() || this.config.get<string>('JWT_SECRET')?.trim();
    if (!value) throw new BadRequestException('کلید امضای عملیات دستیار پیکربندی نشده است');
    return `crm-assistant-action:${value}`;
  }

  private hasPermission(user: CurrentUserPayload, permission: string) {
    const permissions = user.tenantContext?.permissions;
    if (permissions) return permissions.includes(permission);
    return user.role === 'ADMIN';
  }

  private permissionFor(action: ActionType) { return action === 'company.create' ? 'company:create' : action === 'opportunity.create' ? 'opportunity:create' : 'task:create'; }
  private titleFor(action: ActionType) { return action === 'company.create' ? 'ایجاد شرکت' : action === 'opportunity.create' ? 'ایجاد فرصت فروش' : 'ایجاد کار'; }
  private cleanupStates() { const now = Date.now(); for (const [nonce, value] of this.tokenStates) if (value.expiresAt <= now) this.tokenStates.delete(nonce); }
}
