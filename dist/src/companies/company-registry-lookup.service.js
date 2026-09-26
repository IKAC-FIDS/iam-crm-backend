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
exports.CompanyRegistryLookupService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let CompanyRegistryLookupService = class CompanyRegistryLookupService {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
    }
    async lookup(nationalId, organizationId, forceRefresh = false) {
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
                return withCacheMetadata(cached.normalizedData, true, cached.fetchedAt, cached.expiresAt);
            }
        }
        const token = await this.getAccessToken();
        if (!token) {
            throw new common_1.ServiceUnavailableException({
                code: 'COMPANY_LOOKUP_NOT_CONFIGURED',
                message: 'سرویس استعلام شرکت هنوز پیکربندی نشده است',
            });
        }
        const baseUrl = this.config
            .get('LINKA_BASE_URL', 'https://api.linka.ir')
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
            throw new common_1.NotFoundException({
                code: 'COMPANY_LOOKUP_NOT_FOUND',
                message: 'اطلاعات شرکت برای این شناسه ملی پیدا نشد',
            });
        }
        const communicationRows = findRows(communications);
        const personRows = findRows(people).map(mapPerson).filter(isRegistryPerson);
        const directorRecord = findCompanyRecord(director);
        const normalized = mapCompanyRecord(source, nationalId, communicationRows, directorRecord ? mapPerson(directorRecord) : undefined, personRows, findRows(licenses));
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
                normalizedData: normalized,
                rawData: { base, communications, director, people, licenses },
                fetchedAt,
                expiresAt,
            },
            update: {
                normalizedData: normalized,
                rawData: { base, communications, director, people, licenses },
                fetchedAt,
                expiresAt,
            },
        });
        return withCacheMetadata(normalized, false, fetchedAt, expiresAt);
    }
    async importCachedPeople(companyId, nationalId, organizationId) {
        const snapshot = await this.prisma.companyRegistrySnapshot.findUnique({
            where: {
                organizationId_nationalId_provider: { organizationId, nationalId, provider: 'LINKA' },
            },
        });
        if (!snapshot)
            return { imported: 0, updated: 0 };
        const normalized = snapshot.normalizedData;
        let imported = 0;
        let updated = 0;
        const naturalPeople = new Map();
        const candidates = [
            ...(normalized.people ?? []),
            ...(normalized.director ? [normalized.director] : []),
        ];
        for (const person of candidates) {
            if (!person.fullName?.trim() ||
                !person.nationalCode?.trim() ||
                person.personTypeDescription === 'حقوقی' ||
                person.active === false)
                continue;
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
    async fetchLinka(path, nationalId, token, baseUrl) {
        const url = new URL(path, baseUrl);
        url.searchParams.set('nationalCode', nationalId);
        url.searchParams.set('PageIndex', '1');
        let response;
        try {
            response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                signal: AbortSignal.timeout(12_000),
            });
        }
        catch {
            throw new common_1.BadGatewayException({ code: 'COMPANY_LOOKUP_UNAVAILABLE', message: 'ارتباط با سرویس استعلام شرکت برقرار نشد' });
        }
        if (!response.ok) {
            throw new common_1.BadGatewayException({ code: 'COMPANY_LOOKUP_FAILED', message: `سرویس استعلام شرکت پاسخ معتبر نداد (${path})` });
        }
        const payload = await response.json().catch(() => null);
        if (payload && typeof payload === 'object' && payload.success === false) {
            throw new common_1.BadGatewayException({ code: 'COMPANY_LOOKUP_FAILED', message: `استعلام Linka ناموفق بود (${path})` });
        }
        return payload;
    }
    async getAccessToken() {
        const configuredToken = this.config.get('LINKA_API_TOKEN')?.trim();
        if (configuredToken)
            return configuredToken;
        if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
            return this.cachedToken.value;
        }
        const username = this.config.get('LINKA_API_USERNAME')?.trim();
        const password = this.config.get('LINKA_API_PASSWORD')?.trim();
        if (!username || !password)
            return undefined;
        const baseUrl = this.config
            .get('LINKA_BASE_URL', 'https://api.linka.ir')
            .replace(/\/$/, '');
        let response;
        try {
            response = await fetch(new URL('/Api/V1/Auth/Login', baseUrl), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ username, password, isForce: true, refresh: null, captchaCode: null }),
                signal: AbortSignal.timeout(12_000),
            });
        }
        catch {
            throw new common_1.BadGatewayException({
                code: 'COMPANY_LOOKUP_AUTH_FAILED',
                message: 'ورود به سرویس استعلام شرکت انجام نشد',
            });
        }
        if (!response.ok) {
            throw new common_1.BadGatewayException({
                code: 'COMPANY_LOOKUP_AUTH_FAILED',
                message: 'اطلاعات ورود سرویس استعلام شرکت پذیرفته نشد',
            });
        }
        const rawBody = await response.text().catch(() => '');
        let payload = rawBody;
        try {
            payload = rawBody ? JSON.parse(rawBody) : null;
        }
        catch {
        }
        const authorizationHeader = response.headers?.get('authorization');
        const token = normalizeToken(authorizationHeader) ??
            findToken(payload, typeof payload === 'string');
        if (!token) {
            throw new common_1.BadGatewayException({
                code: 'COMPANY_LOOKUP_AUTH_FAILED',
                message: 'سرویس استعلام شرکت توکن معتبری برنگرداند',
            });
        }
        this.cachedToken = { value: token, expiresAt: Date.now() + 10 * 60_000 };
        return token;
    }
};
exports.CompanyRegistryLookupService = CompanyRegistryLookupService;
exports.CompanyRegistryLookupService = CompanyRegistryLookupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], CompanyRegistryLookupService);
function findToken(value, allowOpaque = false) {
    if (typeof value === 'string') {
        const token = normalizeToken(value);
        return token && (allowOpaque || token.split('.').length === 3) ? token : undefined;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const token = findToken(item);
            if (token)
                return token;
        }
        return undefined;
    }
    if (!value || typeof value !== 'object')
        return undefined;
    const record = value;
    for (const [key, candidate] of Object.entries(record)) {
        if (/token|jwt|authorization/i.test(key) && typeof candidate === 'string') {
            const token = normalizeToken(candidate);
            if (token)
                return token;
        }
    }
    for (const candidate of Object.values(record)) {
        const nested = findToken(candidate);
        if (nested)
            return nested;
    }
    return undefined;
}
function normalizeToken(value) {
    if (!value)
        return undefined;
    const normalized = value.trim().replace(/^Bearer\s+/i, '').replace(/^['"]|['"]$/g, '');
    if (!normalized)
        return undefined;
    return normalized;
}
function findCompanyRecord(value) {
    if (Array.isArray(value)) {
        return value.length ? findCompanyRecord(value[0]) : null;
    }
    if (!value || typeof value !== 'object')
        return null;
    const record = value;
    for (const key of ['data', 'result', 'value', 'company', 'items']) {
        if (record[key] != null) {
            const nested = findCompanyRecord(record[key]);
            if (nested)
                return nested;
        }
    }
    return record;
}
function mapCompanyRecord(source, requestedNationalId, communications, director, people, licenses) {
    const read = (...keys) => {
        for (const key of keys) {
            const value = source[key];
            if (value !== null && value !== undefined && String(value).trim()) {
                return String(value).trim();
            }
        }
        return undefined;
    };
    const status = read('companyStateDescription', 'tagTypeDescription', 'status', 'companyStatus');
    const communication = (type) => communications.find((row) => String(row.fieldTypeDescription).toLowerCase() === type.toLowerCase())?.value?.toString().trim();
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
function normalizeDate(value) {
    if (!value)
        return undefined;
    const iso = value.match(/\d{4}-\d{2}-\d{2}/);
    if (iso)
        return iso[0];
    const us = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!us)
        return undefined;
    return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`;
}
function normalizeNumber(value) {
    if (!value)
        return undefined;
    const normalized = value.replace(/[,،\s]/g, '').replace(/[^\d.]/g, '');
    return /^\d+(\.\d{1,2})?$/.test(normalized) ? normalized : undefined;
}
function normalizeStatus(value) {
    if (!value)
        return undefined;
    const normalized = value.trim().toLowerCase();
    if (/فعال|active/.test(normalized) && !/غیرفعال|inactive/.test(normalized))
        return 'ACTIVE';
    if (/غیرفعال|منحل|inactive|dissolved/.test(normalized))
        return 'INACTIVE';
    return 'UNKNOWN';
}
function compact(value) {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
function findRows(value) {
    if (!value || typeof value !== 'object')
        return [];
    const record = value;
    const data = record.data && typeof record.data === 'object' ? record.data : record;
    return Array.isArray(data.rows) ? data.rows.filter((row) => Boolean(row && typeof row === 'object')) : [];
}
function mapPerson(source) {
    const text = (key) => source[key] == null ? undefined : String(source[key]).trim() || undefined;
    const fullName = text('fullName') ?? [text('firstName'), text('lastName')].filter(Boolean).join(' ');
    if (!fullName)
        return undefined;
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
function isRegistryPerson(value) {
    return Boolean(value);
}
function uniqueText(values) {
    const unique = [...new Set(values.map((value) => value?.trim()).filter((value) => Boolean(value)))];
    return unique.length ? unique.join('، ') : undefined;
}
function normalizeWebsite(value) {
    if (!value)
        return undefined;
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
function withCacheMetadata(result, hit, fetchedAt, expiresAt) {
    return { ...result, cache: { hit, fetchedAt: fetchedAt.toISOString(), expiresAt: expiresAt.toISOString() } };
}
//# sourceMappingURL=company-registry-lookup.service.js.map