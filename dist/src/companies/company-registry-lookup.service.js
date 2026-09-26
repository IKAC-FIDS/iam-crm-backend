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
let CompanyRegistryLookupService = class CompanyRegistryLookupService {
    constructor(config) {
        this.config = config;
    }
    async lookup(nationalId) {
        const token = this.config.get('LINKA_API_TOKEN')?.trim();
        if (!token) {
            throw new common_1.ServiceUnavailableException({
                code: 'COMPANY_LOOKUP_NOT_CONFIGURED',
                message: 'سرویس استعلام شرکت هنوز پیکربندی نشده است',
            });
        }
        const baseUrl = this.config
            .get('LINKA_BASE_URL', 'https://api.linka.ir')
            .replace(/\/$/, '');
        const url = new URL('/API/V1/CompanyBaseInfo', baseUrl);
        url.searchParams.set('nationalCode', nationalId);
        let response;
        try {
            response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                signal: AbortSignal.timeout(12_000),
            });
        }
        catch {
            throw new common_1.BadGatewayException({
                code: 'COMPANY_LOOKUP_UNAVAILABLE',
                message: 'ارتباط با سرویس استعلام شرکت برقرار نشد',
            });
        }
        if (response.status === 404) {
            throw new common_1.NotFoundException({
                code: 'COMPANY_LOOKUP_NOT_FOUND',
                message: 'شرکتی با این شناسه ملی پیدا نشد',
            });
        }
        if (!response.ok) {
            throw new common_1.BadGatewayException({
                code: 'COMPANY_LOOKUP_FAILED',
                message: 'سرویس استعلام شرکت پاسخ معتبری نداد',
            });
        }
        const payload = await response.json().catch(() => null);
        const source = findCompanyRecord(payload);
        if (!source) {
            throw new common_1.NotFoundException({
                code: 'COMPANY_LOOKUP_NOT_FOUND',
                message: 'اطلاعات شرکت برای این شناسه ملی پیدا نشد',
            });
        }
        return mapCompanyRecord(source, nationalId);
    }
};
exports.CompanyRegistryLookupService = CompanyRegistryLookupService;
exports.CompanyRegistryLookupService = CompanyRegistryLookupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CompanyRegistryLookupService);
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
function mapCompanyRecord(source, requestedNationalId) {
    const read = (...keys) => {
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
function normalizeDate(value) {
    if (!value)
        return undefined;
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    return match?.[0];
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
//# sourceMappingURL=company-registry-lookup.service.js.map