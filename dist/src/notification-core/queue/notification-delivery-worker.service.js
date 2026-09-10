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
var NotificationDeliveryWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationDeliveryWorkerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const notification_delivery_dispatcher_service_1 = require("../notification-delivery-dispatcher.service");
const notification_delivery_queue_service_1 = require("./notification-delivery-queue.service");
let NotificationDeliveryWorkerService = NotificationDeliveryWorkerService_1 = class NotificationDeliveryWorkerService {
    constructor(prisma, queue, dispatcher) {
        this.prisma = prisma;
        this.queue = queue;
        this.dispatcher = dispatcher;
        this.logger = new common_1.Logger(NotificationDeliveryWorkerService_1.name);
        this.running = false;
        this.lastRunAt = 0;
    }
    async tick() {
        if (!this.enabled() || this.running || Date.now() - this.lastRunAt < this.intervalMs())
            return;
        this.running = true;
        this.lastRunAt = Date.now();
        try {
            const organizations = await this.prisma.organization.findMany({ where: { status: client_1.OrganizationStatus.ACTIVE }, select: { id: true } });
            for (const organization of organizations)
                await this.processOrganization(organization.id);
        }
        catch (error) {
            this.logger.error(`Notification queue scan failed category=${error instanceof Error ? error.name : "UNKNOWN"}`);
        }
        finally {
            this.running = false;
        }
    }
    async processOrganization(organizationId, now = new Date()) {
        const recovered = await this.queue.recoverStale(organizationId, now);
        if (recovered.count)
            this.logger.warn(`Recovered ${recovered.count} stale notification jobs organizationId=${organizationId}`);
        const jobs = await this.queue.due(organizationId, now);
        const results = await Promise.allSettled(jobs.map(job => this.dispatcher.dispatch(job.id, organizationId)));
        const rejected = results.filter(result => result.status === "rejected").length;
        if (rejected)
            this.logger.warn(`Notification worker failures organizationId=${organizationId} count=${rejected}`);
        return { queued: jobs.length, rejected, recovered: recovered.count };
    }
    enabled() { return !["false", "0", "off"].includes((process.env.NOTIFICATION_WORKER_ENABLED ?? "true").toLowerCase()); }
    intervalMs() { const value = Number(process.env.NOTIFICATION_WORKER_INTERVAL_MS ?? 5000); return Number.isInteger(value) && value >= 1000 && value <= 60000 ? value : 5000; }
};
exports.NotificationDeliveryWorkerService = NotificationDeliveryWorkerService;
__decorate([
    (0, schedule_1.Interval)(1_000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationDeliveryWorkerService.prototype, "tick", null);
exports.NotificationDeliveryWorkerService = NotificationDeliveryWorkerService = NotificationDeliveryWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, notification_delivery_queue_service_1.NotificationDeliveryQueueService, notification_delivery_dispatcher_service_1.NotificationDeliveryDispatcher])
], NotificationDeliveryWorkerService);
//# sourceMappingURL=notification-delivery-worker.service.js.map