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
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const prisma_service_1 = require("../prisma/prisma.service");
let HealthService = class HealthService {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        this.startedAt = new Date();
        this.packageInfo = this.readPackageInfo();
    }
    getHealth() {
        return {
            status: 'ok',
            service: this.getServiceName(),
            environment: this.config.get('NODE_ENV', 'development'),
            uptimeSeconds: Math.floor(process.uptime()),
            startedAt: this.startedAt.toISOString(),
            timestamp: new Date().toISOString(),
        };
    }
    async getReadiness() {
        const database = await this.checkDatabase();
        const isReady = database.status === 'up';
        const payload = {
            status: isReady ? 'ready' : 'not_ready',
            service: this.getServiceName(),
            environment: this.config.get('NODE_ENV', 'development'),
            uptimeSeconds: Math.floor(process.uptime()),
            checks: {
                api: {
                    status: 'up',
                },
                database,
            },
            timestamp: new Date().toISOString(),
        };
        if (!isReady) {
            throw new common_1.ServiceUnavailableException({
                code: 'READINESS_CHECK_FAILED',
                message: 'Service is not ready',
                details: payload,
            });
        }
        return payload;
    }
    getVersion() {
        return {
            service: this.getServiceName(),
            version: this.getVersionValue(),
            packageName: this.packageInfo.name ?? 'iam-crm-backend',
            environment: this.config.get('NODE_ENV', 'development'),
            commit: this.config.get('APP_COMMIT_SHA') ?? null,
            buildTime: this.config.get('APP_BUILD_TIME') ?? null,
            nodeVersion: process.version,
        };
    }
    async checkDatabase() {
        const started = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                status: 'up',
                latencyMs: Date.now() - started,
            };
        }
        catch (error) {
            return {
                status: 'down',
                latencyMs: Date.now() - started,
                error: this.normalizeError(error),
            };
        }
    }
    getServiceName() {
        return this.packageInfo.name ?? 'iam-crm-backend';
    }
    getVersionValue() {
        return (this.config.get('APP_VERSION') ??
            this.packageInfo.version ??
            '0.0.0');
    }
    readPackageInfo() {
        try {
            return JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(process.cwd(), 'package.json'), 'utf8'));
        }
        catch {
            return {};
        }
    }
    normalizeError(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return 'Unknown readiness error';
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], HealthService);
//# sourceMappingURL=health.service.js.map