"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const XLSX = __importStar(require("xlsx"));
let ImportService = class ImportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async importSAMList(fileBuffer, userId) {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        if (!data || data.length === 0) {
            throw new common_1.BadRequestException('فایل اکسل خالی است یا فرمت آن صحیح نیست');
        }
        const result = {
            totalRows: data.length,
            successful: 0,
            failed: 0,
            errors: [],
            summary: {
                companiesCreated: 0,
                peopleCreated: 0,
            },
        };
        for (let index = 0; index < data.length; index++) {
            const row = data[index];
            const rowNumber = index + 2;
            try {
                await this.processRow(row, userId);
                result.successful++;
                result.summary.companiesCreated++;
            }
            catch (error) {
                result.failed++;
                result.errors.push({
                    row: rowNumber,
                    message: error.message || 'خطای ناشناخته',
                });
            }
        }
        return result;
    }
    async processRow(row, userId) {
        const legalName = row['نام شرکت'] || row['legalName'] || row['نام'];
        const brandName = row['نام تجاری'] || row['brandName'];
        const industry = row['صنعت'] || row['industry'];
        const website = row['وبسایت'] || row['website'];
        const headOfficeCity = row['شهر'] || row['headOfficeCity'] || row['شهر دفتر مرکزی'];
        const priority = row['اولویت'] || row['priority'] || 'MEDIUM';
        const source = 'SAM_IMPORT';
        const personFullName = row['نام مخاطب'] || row['personName'] || row['نام کامل'];
        const personTitle = row['سمت'] || row['title'];
        const personEmail = row['ایمیل'] || row['email'];
        let personPhone = row['تلفن'] || row['phone'];
        if (personPhone !== undefined && personPhone !== null) {
            personPhone = String(personPhone);
        }
        const personaTag = row['نقش'] || row['personaTag'];
        if (!legalName) {
            throw new Error('نام شرکت الزامی است');
        }
        const company = await this.prisma.company.create({
            data: {
                legalName,
                brandName,
                industry,
                website,
                headOfficeCity,
                priority: this.mapPriority(priority),
                source,
                ownerId: userId,
            },
        });
        if (personFullName) {
            await this.prisma.person.create({
                data: {
                    companyId: company.id,
                    fullName: personFullName,
                    title: personTitle,
                    email: personEmail,
                    phone: personPhone,
                    personaTag: personaTag,
                    isPrimaryContact: true,
                },
            });
        }
        return company;
    }
    mapPriority(priority) {
        const normalized = priority?.toLowerCase() || 'medium';
        if (normalized.includes('strategic') || normalized.includes('استراتژیک')) {
            return 'STRATEGIC';
        }
        if (normalized.includes('high') || normalized.includes('بالا')) {
            return 'HIGH';
        }
        if (normalized.includes('low') || normalized.includes('پایین')) {
            return 'LOW';
        }
        return 'MEDIUM';
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImportService);
//# sourceMappingURL=import.service.js.map