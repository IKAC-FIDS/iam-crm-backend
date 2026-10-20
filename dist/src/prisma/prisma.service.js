"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const tenant_context_util_1 = require("../common/tenant/tenant-context.util");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async withTenantTransaction(context, callback, options) {
        (0, tenant_context_util_1.assertActiveTenantContext)(context);
        return this.$transaction(async (tx) => {
            await this.installTenantContext(tx, context);
            return callback(tx);
        }, options);
    }
    async installTenantContext(tx, context) {
        (0, tenant_context_util_1.assertActiveTenantContext)(context);
        const [row] = await tx.$queryRaw(client_1.Prisma.sql `
        SELECT set_config(
          'app.current_organization_id',
          ${context.organizationId},
          true
        ) AS "organizationId"
      `);
        if (row?.organizationId !== context.organizationId) {
            throw new Error('PostgreSQL Tenant context was not installed');
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map