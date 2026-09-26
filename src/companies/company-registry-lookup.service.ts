import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type CompanyRegistryLookupResult = {
  legalName?: string;
  brandName?: string;
  registrationNumber?: string;
  nationalId: string;
  economicCode?: string;
  establishmentDate?: string;
  registeredCapital?: string;
  headOfficeCity?: string;
  headOfficeAddress?: string;
  centralPhone?: string;
  website?: string;
  activityStatus?: 'ACTIVE' | 'INACTIVE' | 'UNKNOWN';
  publicEmail?: string;
  postalCode?: string;
  companyType?: string;
  activityDescription?: string;
  signatureAuthority?: string;
  director?: CompanyRegistryPerson;
  people: CompanyRegistryPerson[];
  licenses: unknown[];
  cache?: { hit: boolean; fetchedAt: string; expiresAt: string };
};

export type CompanyRegistryPerson = {
  fullName: string;
  firstName?: string;
  lastName?: string;
  nationalCode?: string;
  postDescription?: string;
  postCategoryTitle?: string;
  personTypeDescription?: string;
  representedOrganizationName?: string;
  representedOrganizationNationalCode?: string;
  startDate?: string;
  endDate?: string;
  active?: boolean;
};

@Injectable()
export class CompanyRegistryLookupService {
  private cachedToken?: { value: string; expiresAt: number };

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async lookup(
    nationalId: string,
    organizationId: string,
    forceRefresh = false,
  ): Promise<CompanyRegistryLookupResult> {
    if (!forceRefresh) {
      const cached = await this.prisma.companyRegistrySnapshot.findUnique({
        where: {
          organizationId_nationalId_provider: {
            organizationId,
            nationalId,
            provider: 'LINKA',
          },
        },
      });
      if (cached && cached.expiresAt > new Date()) {
        return withCacheMetadata(
          cached.normalizedData as unknown as CompanyRegistryLookupResult,
          true,
          cached.fetchedAt,
          cached.expiresAt,
        );
      }
    }

    const token = await this.getAccessToken();
    if (!token) {
      throw new ServiceUnavailableException({
        code: 'COMPANY_LOOKUP_NOT_CONFIGURED',
        message: 'سرویس استعلام شرکت هنوز پیکربندی نشده است',
      });
    }

    const baseUrl = this.config
      .get<string>('LINKA_BASE_URL', 'https://api.linka.ir')
      .replace(/\/$/, '');
    const [base, communications, director, people, licenses] = await Promise.all([
      this.fetchLinka('/API/V1/CompanyBaseInfo', nationalId, token, baseUrl),
      this.fetchLinka('/API/V1/Communication', nationalId, token, baseUrl),
      this.fetchLinka('/API/V1/CompanyDirector', nationalId, token, baseUrl),
      this.fetchLinka('/API/V1/CompanyPerson', nationalId, token, baseUrl),
      this.fetchLinka('/API/V1/License', nationalId, token, baseUrl),
    ]);

    const source = findCompanyRecord(base);
    if (!source) {
      throw new NotFoundException({
        code: 'COMPANY_LOOKUP_NOT_FOUND',
        message: 'اطلاعات شرکت برای این شناسه ملی پیدا نشد',
      });
    }

    const communicationRows = findRows(communications);
    const personRows = findRows(people).map(mapPerson).filter(isRegistryPerson);
    const directorRecord = findCompanyRecord(director);
    const normalized = mapCompanyRecord(
      source,
      nationalId,
      communicationRows,
      directorRecord ? mapPerson(directorRecord) : undefined,
      personRows,
      findRows(licenses),
    );
    const fetchedAt = new Date();
    const expiresAt = new Date(fetchedAt.getTime() + 24 * 60 * 60_000);
    await this.prisma.companyRegistrySnapshot.upsert({
      where: {
        organizationId_nationalId_provider: { organizationId, nationalId, provider: 'LINKA' },
      },
      create: {
        organizationId,
        nationalId,
        provider: 'LINKA',
        normalizedData: normalized as unknown as Prisma.InputJsonValue,
        rawData: { base, communications, director, people, licenses } as Prisma.InputJsonValue,
        fetchedAt,
        expiresAt,
      },
      update: {
        normalizedData: normalized as unknown as Prisma.InputJsonValue,
        rawData: { base, communications, director, people, licenses } as Prisma.InputJsonValue,
        fetchedAt,
        expiresAt,
      },
    });
    return withCacheMetadata(normalized, false, fetchedAt, expiresAt);
  }

  async importCachedPeople(companyId: string, nationalId: string, organizationId: string) {
    const snapshot = await this.prisma.companyRegistrySnapshot.findUnique({
      where: {
        organizationId_nationalId_provider: { organizationId, nationalId, provider: 'LINKA' },
      },
    });
    if (!snapshot) return { imported: 0, updated: 0 };
    const normalized = snapshot.normalizedData as unknown as CompanyRegistryLookupResult;
    let imported = 0;
    let updated = 0;
    const naturalPeople = new Map<string, CompanyRegistryPerson[]>();
    const candidates = [
      ...(normalized.people ?? []),
      ...(normalized.director ? [normalized.director] : []),
    ];
    for (const person of candidates) {
      if (
        !person.fullName?.trim() ||
        !person.nationalCode?.trim() ||
        person.personTypeDescription === 'حقوقی' ||
        person.active === false
      ) continue;
      const roles = naturalPeople.get(person.nationalCode) ?? [];
      roles.push(person);
      naturalPeople.set(person.nationalCode, roles);
    }
    for (const [personNationalCode, roles] of naturalPeople) {
      const preferred = roles.find((person) => person.postDescription === 'مدیرعامل') ?? roles[0];
      const title = uniqueText(roles.map((person) => person.postDescription));
      const department = uniqueText(roles.map((person) => person.postCategoryTitle));
      const existing = await this.prisma.person.findUnique({
        where: { companyId_nationalCode: { companyId, nationalCode: personNationalCode } },
      });
      await this.prisma.person.upsert({
        where: { companyId_nationalCode: { companyId, nationalCode: personNationalCode } },
        create: {
          companyId,
          fullName: preferred.fullName,
          nationalCode: personNationalCode,
          registrySource: 'LINKA',
          title,
          department,
          isPrimaryContact: roles.some((person) => person.postDescription === 'مدیرعامل'),
        },
        update: {
          fullName: preferred.fullName,
          title,
          department,
          registrySource: 'LINKA',
          isPrimaryContact: roles.some((person) => person.postDescription === 'مدیرعامل') || undefined,
        },
      });
      existing ? updated++ : imported++;
    }
    return { imported, updated };
  }

  private async fetchLinka(path: string, nationalId: string, token: string, baseUrl: string) {
    const url = new URL(path, baseUrl);
    url.searchParams.set('nationalCode', nationalId);
    url.searchParams.set('PageIndex', '1');
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new BadGatewayException({ code: 'COMPANY_LOOKUP_UNAVAILABLE', message: 'ارتباط با سرویس استعلام شرکت برقرار نشد' });
    }
    if (!response.ok) {
      throw new BadGatewayException({ code: 'COMPANY_LOOKUP_FAILED', message: `سرویس استعلام شرکت پاسخ معتبر نداد (${path})` });
    }
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload === 'object' && (payload as { success?: boolean }).success === false) {
      throw new BadGatewayException({ code: 'COMPANY_LOOKUP_FAILED', message: `استعلام Linka ناموفق بود (${path})` });
    }
    return payload;
  }

  private async getAccessToken(): Promise<string | undefined> {
    const configuredToken = this.config.get<string>('LINKA_API_TOKEN')?.trim();
    if (configuredToken) return configuredToken;
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value;
    }

    const username = this.config.get<string>('LINKA_API_USERNAME')?.trim();
    const password = this.config.get<string>('LINKA_API_PASSWORD')?.trim();
    if (!username || !password) return undefined;

    const baseUrl = this.config
      .get<string>('LINKA_BASE_URL', 'https://api.linka.ir')
      .replace(/\/$/, '');
    let response: Response;
    try {
      response = await fetch(new URL('/Api/V1/Auth/Login', baseUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username, password, isForce: true, refresh: null, captchaCode: null }),
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new BadGatewayException({
        code: 'COMPANY_LOOKUP_AUTH_FAILED',
        message: 'ورود به سرویس استعلام شرکت انجام نشد',
      });
    }
    if (!response.ok) {
      throw new BadGatewayException({
        code: 'COMPANY_LOOKUP_AUTH_FAILED',
        message: 'اطلاعات ورود سرویس استعلام شرکت پذیرفته نشد',
      });
    }
    const rawBody = await response.text().catch(() => '');
    let payload: unknown = rawBody;
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      // Some Linka deployments return the access token as plain text.
    }
    const authorizationHeader = response.headers?.get('authorization');
    const token =
      normalizeToken(authorizationHeader) ??
      findToken(payload, typeof payload === 'string');
    if (!token) {
      throw new BadGatewayException({
        code: 'COMPANY_LOOKUP_AUTH_FAILED',
        message: 'سرویس استعلام شرکت توکن معتبری برنگرداند',
      });
    }
    this.cachedToken = { value: token, expiresAt: Date.now() + 10 * 60_000 };
    return token;
  }
}

function findToken(value: unknown, allowOpaque = false): string | undefined {
  if (typeof value === 'string') {
    const token = normalizeToken(value);
    return token && (allowOpaque || token.split('.').length === 3) ? token : undefined;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const token = findToken(item);
      if (token) return token;
    }
    return undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const [key, candidate] of Object.entries(record)) {
    if (/token|jwt|authorization/i.test(key) && typeof candidate === 'string') {
      const token = normalizeToken(candidate);
      if (token) return token;
    }
  }
  for (const candidate of Object.values(record)) {
    const nested = findToken(candidate);
    if (nested) return nested;
  }
  return undefined;
}

function normalizeToken(value?: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace(/^Bearer\s+/i, '').replace(/^['"]|['"]$/g, '');
  if (!normalized) return undefined;
  // JWTs have three base64url segments. Named token properties may contain
  // opaque access tokens, so non-JWT strings are accepted only by findToken's
  // token-key branch or when returned as the whole plain-text response.
  return normalized;
}

function findCompanyRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    return value.length ? findCompanyRecord(value[0]) : null;
  }
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  for (const key of ['data', 'result', 'value', 'company', 'items']) {
    if (record[key] != null) {
      const nested = findCompanyRecord(record[key]);
      if (nested) return nested;
    }
  }
  return record;
}

function mapCompanyRecord(
  source: Record<string, unknown>,
  requestedNationalId: string,
  communications: Record<string, unknown>[],
  director: CompanyRegistryPerson | undefined,
  people: CompanyRegistryPerson[],
  licenses: unknown[],
): CompanyRegistryLookupResult {
  const read = (...keys: string[]) => {
    for (const key of keys) {
      const value = source[key];
      if (value !== null && value !== undefined && String(value).trim()) {
        return String(value).trim();
      }
    }
    return undefined;
  };

  const status = read('companyStateDescription', 'tagTypeDescription', 'status', 'companyStatus');
  const communication = (type: string) =>
    communications.find((row) => String(row.fieldTypeDescription).toLowerCase() === type.toLowerCase())?.value?.toString().trim();
  return compact({
    legalName: read('name', 'companyName', 'legalName', 'Name', 'CompanyName'),
    brandName: read('brandName', 'tradeName', 'BrandName'),
    registrationNumber: read('registerNumber', 'registrationNumber', 'registerNo', 'RegisterNumber'),
    nationalId: read('nationalCode', 'nationalId', 'NationalCode') ?? requestedNationalId,
    economicCode: read('economicCode', 'taxCode', 'EconomicCode'),
    establishmentDate: normalizeDate(read('registerDate', 'registrationDate', 'establishmentDate')),
    registeredCapital: normalizeNumber(read('totalStock', 'capital', 'registeredCapital')),
    headOfficeCity: read('cityTitle', 'provinceTitle', 'city', 'province'),
    headOfficeAddress: read('address', 'fullAddress', 'Address'),
    centralPhone: communication('PhoneNumber') ?? read('phone', 'telephone', 'centralPhone'),
    website: normalizeWebsite(communication('Website') ?? read('website', 'webSite', 'url')),
    activityStatus: normalizeStatus(status),
    publicEmail: communication('Email'),
    postalCode: read('postalCode'),
    companyType: read('companyTypeDescription'),
    activityDescription: read('activityDescription'),
    signatureAuthority: read('signatureAuthority'),
    director,
    people,
    licenses,
  });
}

function normalizeDate(value?: string) {
  if (!value) return undefined;
  const iso = value.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!us) return undefined;
  return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
}

function normalizeNumber(value?: string) {
  if (!value) return undefined;
  const normalized = value.replace(/[,،\s]/g, '').replace(/[^\d.]/g, '');
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? normalized : undefined;
}

function normalizeStatus(value?: string): CompanyRegistryLookupResult['activityStatus'] {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (/فعال|active/.test(normalized) && !/غیرفعال|inactive/.test(normalized)) return 'ACTIVE';
  if (/غیرفعال|منحل|inactive|dissolved/.test(normalized)) return 'INACTIVE';
  return 'UNKNOWN';
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as T;
}

function findRows(value: unknown): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  const data = record.data && typeof record.data === 'object' ? record.data as Record<string, unknown> : record;
  return Array.isArray(data.rows) ? data.rows.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object')) : [];
}

function mapPerson(source: Record<string, unknown>): CompanyRegistryPerson | undefined {
  const text = (key: string) => source[key] == null ? undefined : String(source[key]).trim() || undefined;
  const fullName = text('fullName') ?? [text('firstName'), text('lastName')].filter(Boolean).join(' ');
  if (!fullName) return undefined;
  return compact({
    fullName,
    firstName: text('firstName'),
    lastName: text('lastName'),
    nationalCode: text('nationalCode'),
    postDescription: text('postDescription'),
    postCategoryTitle: text('postCategoryTitle'),
    personTypeDescription: text('personTypeDescription'),
    representedOrganizationName: text('orginFullName'),
    representedOrganizationNationalCode: text('orginNationalCode'),
    startDate: normalizeDate(text('startDate')),
    endDate: normalizeDate(text('endDate')),
    active: text('personAttendanceStatusDescription') === 'فعال',
  });
}

function isRegistryPerson(value: CompanyRegistryPerson | undefined): value is CompanyRegistryPerson {
  return Boolean(value);
}

function uniqueText(values: Array<string | undefined>): string | undefined {
  const unique = [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
  return unique.length ? unique.join('، ') : undefined;
}

function normalizeWebsite(value?: string) {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function withCacheMetadata(
  result: CompanyRegistryLookupResult,
  hit: boolean,
  fetchedAt: Date,
  expiresAt: Date,
): CompanyRegistryLookupResult {
  return { ...result, cache: { hit, fetchedAt: fetchedAt.toISOString(), expiresAt: expiresAt.toISOString() } };
}
