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
exports.SmsRecipientResolver = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const MOBILE_TYPES = ["MOBILE", "PHONE", "WORK_PHONE"];
let SmsRecipientResolver = class SmsRecipientResolver {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async resolve(organizationId, userId) {
        const user = await this.prisma.user.findFirst({ where: { id: userId, organizationId, isActive: true }, select: { email: true } });
        if (!user)
            return null;
        const person = await this.prisma.person.findFirst({
            where: { email: { equals: user.email, mode: "insensitive" }, company: { organizationId, archivedAt: null } },
            orderBy: [{ isPrimaryContact: "desc" }, { updatedAt: "desc" }],
            select: { phone: true, contacts: { where: { type: { in: MOBILE_TYPES } }, orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], select: { value: true } } },
        });
        return this.normalize(person?.phone || person?.contacts[0]?.value || "");
    }
    normalize(value) {
        let phone = value.trim().replace(/[\s()-]/g, "");
        if (phone.startsWith("0098"))
            phone = `+98${phone.slice(4)}`;
        else if (phone.startsWith("989"))
            phone = `+${phone}`;
        else if (/^09\d{9}$/.test(phone))
            phone = `+98${phone.slice(1)}`;
        if (/^\+989\d{9}$/.test(phone))
            return phone;
        if (phone.startsWith("+98"))
            return null;
        if (/^\+[1-9]\d{7,14}$/.test(phone))
            return phone;
        return null;
    }
    mask(value) { return value.length > 7 ? `${value.slice(0, 4)}***${value.slice(-4)}` : "***"; }
};
exports.SmsRecipientResolver = SmsRecipientResolver;
exports.SmsRecipientResolver = SmsRecipientResolver = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SmsRecipientResolver);
//# sourceMappingURL=sms-recipient-resolver.service.js.map