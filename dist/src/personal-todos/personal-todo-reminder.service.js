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
var PersonalTodoReminderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalTodoReminderService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let PersonalTodoReminderService = PersonalTodoReminderService_1 = class PersonalTodoReminderService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PersonalTodoReminderService_1.name);
    }
    async processDueReminders() {
        try {
            await this.prisma.$transaction(async (tx) => {
                const lock = await tx.$queryRaw(client_1.Prisma.sql `SELECT pg_try_advisory_xact_lock(73644292) AS locked`);
                if (!lock[0]?.locked)
                    return;
                const todos = await tx.personalTodo.findMany({
                    where: {
                        status: client_1.PersonalTodoStatus.TODO,
                        reminderAt: { lte: new Date() },
                        reminderSentAt: null,
                        organization: { status: client_1.OrganizationStatus.ACTIVE },
                    },
                    orderBy: { reminderAt: "asc" },
                    take: 100,
                });
                for (const todo of todos) {
                    await this.prisma.installTenantContext(tx, {
                        tenantId: todo.organizationId,
                        organizationId: todo.organizationId,
                        userId: todo.userId,
                        membershipId: `personal-todo-reminder:${todo.id}`,
                        tenantRole: "SYSTEM",
                        permissions: [],
                        platformAdmin: false,
                        membershipStatus: "active",
                        resolutionSource: "authenticated-membership",
                    });
                    await tx.notification.create({
                        data: {
                            organizationId: todo.organizationId,
                            recipientId: todo.userId,
                            type: client_1.NotificationType.PERSONAL_TODO_REMINDER,
                            title: "یادآوری کار شخصی",
                            body: todo.title,
                            entityType: client_1.NotificationEntityType.PERSONAL_TODO,
                            entityId: todo.id,
                            actionUrl: "/operations",
                            metadata: { dueAt: todo.dueAt?.toISOString() ?? null },
                        },
                    });
                    await tx.personalTodo.update({ where: { id: todo.id }, data: { reminderSentAt: new Date() } });
                }
            }, { timeout: 30_000 });
        }
        catch (error) {
            this.logger.error("Personal todo reminder processing failed", error instanceof Error ? error.stack : undefined);
        }
    }
};
exports.PersonalTodoReminderService = PersonalTodoReminderService;
__decorate([
    (0, schedule_1.Cron)("0 * * * * *"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PersonalTodoReminderService.prototype, "processDueReminders", null);
exports.PersonalTodoReminderService = PersonalTodoReminderService = PersonalTodoReminderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PersonalTodoReminderService);
//# sourceMappingURL=personal-todo-reminder.service.js.map