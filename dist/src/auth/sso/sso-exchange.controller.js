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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SsoExchangeController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth.service");
const exchange_sso_ticket_dto_1 = require("./dto/exchange-sso-ticket.dto");
const sso_ticket_service_1 = require("./sso-ticket.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_2 = require("@nestjs/common");
let SsoExchangeController = class SsoExchangeController {
    constructor(ticketService, prisma, authService) {
        this.ticketService = ticketService;
        this.prisma = prisma;
        this.authService = authService;
    }
    async exchange(dto) {
        const consumed = await this.ticketService.consumeTicket(dto.ticket);
        const user = await this.prisma.user.findUnique({
            where: { id: consumed.userId },
        });
        if (!user || !user.isActive) {
            throw new common_2.UnauthorizedException('SSO user is not active');
        }
        return this.authService.buildLoginResponse(user);
    }
};
exports.SsoExchangeController = SsoExchangeController;
__decorate([
    (0, common_1.Post)('exchange'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exchange_sso_ticket_dto_1.ExchangeSsoTicketDto]),
    __metadata("design:returntype", Promise)
], SsoExchangeController.prototype, "exchange", null);
exports.SsoExchangeController = SsoExchangeController = __decorate([
    (0, common_1.Controller)('auth/sso'),
    __metadata("design:paramtypes", [sso_ticket_service_1.SsoTicketService,
        prisma_service_1.PrismaService,
        auth_service_1.AuthService])
], SsoExchangeController);
//# sourceMappingURL=sso-exchange.controller.js.map