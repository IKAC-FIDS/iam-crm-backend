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
exports.SsoTicketService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
let SsoTicketService = class SsoTicketService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async createTicket(userId, providerId) {
        const ticket = (0, crypto_1.randomBytes)(48).toString('base64url');
        const ticketHash = this.hashTicket(ticket);
        const ttlSeconds = this.config.get('SSO_TICKET_TTL', 120);
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
        await this.prisma.ssoLoginTicket.create({
            data: {
                ticketHash,
                userId,
                providerId: providerId ?? null,
                expiresAt,
            },
        });
        return ticket;
    }
    async consumeTicket(ticket) {
        const ticketHash = this.hashTicket(ticket);
        const found = await this.prisma.ssoLoginTicket.findUnique({
            where: { ticketHash },
        });
        if (!found) {
            throw new common_1.BadRequestException('Invalid SSO ticket');
        }
        if (found.consumedAt) {
            throw new common_1.BadRequestException('SSO ticket has already been consumed');
        }
        if (found.expiresAt.getTime() <= Date.now()) {
            throw new common_1.BadRequestException('SSO ticket has expired');
        }
        await this.prisma.ssoLoginTicket.update({
            where: { id: found.id },
            data: { consumedAt: new Date() },
        });
        return {
            userId: found.userId,
            providerId: found.providerId,
        };
    }
    hashTicket(ticket) {
        return (0, crypto_1.createHash)('sha256').update(ticket).digest('hex');
    }
};
exports.SsoTicketService = SsoTicketService;
exports.SsoTicketService = SsoTicketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], SsoTicketService);
//# sourceMappingURL=sso-ticket.service.js.map