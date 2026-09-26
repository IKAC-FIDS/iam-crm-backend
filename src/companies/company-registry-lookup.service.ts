import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
};

@Injectable()
export class CompanyRegistryLookupService {
  private cachedToken?: { value: string; expiresAt: number };

  constructor(private readonly config: ConfigService) {}

  async lookup(nationalId: string): Promise<CompanyRegistryLookupResult> {
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
    const url = new URL('/API/V1/CompanyBaseInfo', baseUrl);
    url.searchParams.set('nationalCode', nationalId);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new BadGatewayException({
        code: 'COMPANY_LOOKUP_UNAVAILABLE',
        message: 'ارتباط با سرویس استعلام شرکت برقرار نشد',
      });
    }

    if (response.status === 404) {
      throw new NotFoundException({
        code: 'COMPANY_LOOKUP_NOT_FOUND',
        message: 'شرکتی با این شناسه ملی پیدا نشد',
      });
    }
    if (!response.ok) {
      throw new BadGatewayException({
        code: 'COMPANY_LOOKUP_FAILED',
        message: 'سرویس استعلام شرکت پاسخ معتبری نداد',
      });
    }

    const payload = await response.json().catch(() => null);
    const source = findCompanyRecord(payload);
    if (!source) {
      throw new NotFoundException({
        code: 'COMPANY_LOOKUP_NOT_FOUND',
        message: 'اطلاعات شرکت برای این شناسه ملی پیدا نشد',
      });
    }

    return mapCompanyRecord(source, nationalId);
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

  const status = read('status', 'companyStatus', 'activityStatus', 'Status');
  return compact({
    legalName: read('name', 'companyName', 'legalName', 'Name', 'CompanyName'),
    brandName: read('brandName', 'tradeName', 'BrandName'),
    registrationNumber: read('registerNumber', 'registrationNumber', 'registerNo', 'RegisterNumber'),
    nationalId: read('nationalCode', 'nationalId', 'NationalCode') ?? requestedNationalId,
    economicCode: read('economicCode', 'taxCode', 'EconomicCode'),
    establishmentDate: normalizeDate(read('registerDate', 'registrationDate', 'establishmentDate', 'RegisterDate')),
    registeredCapital: normalizeNumber(read('capital', 'registeredCapital', 'Capital')),
    headOfficeCity: read('city', 'province', 'location', 'City'),
    headOfficeAddress: read('address', 'fullAddress', 'Address'),
    centralPhone: read('phone', 'telephone', 'centralPhone', 'Phone'),
    website: read('website', 'webSite', 'url', 'Website'),
    activityStatus: normalizeStatus(status),
  });
}

function normalizeDate(value?: string) {
  if (!value) return undefined;
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0];
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
