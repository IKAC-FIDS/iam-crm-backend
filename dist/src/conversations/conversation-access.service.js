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
exports.ConversationAccessService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const activities_service_1 = require("../activities/activities.service");
const company_access_service_1 = require("../companies/company-access.service");
const tasks_service_1 = require("../tasks/tasks.service");
let ConversationAccessService = class ConversationAccessService {
    constructor(companies, tasks, activities) {
        this.companies = companies;
        this.tasks = tasks;
        this.activities = activities;
    }
    async assertReadable(entityType, entityId, user) {
        if (entityType === client_1.ConversationEntityType.COMPANY) {
            const company = await this.companies.assertCompanyReadable(entityId, user);
            return {
                entityType,
                entityId,
                label: company.brandName || company.legalName,
                responsibleUserIds: company.ownerId ? [company.ownerId] : [],
                actionUrl: `/companies/${entityId}#conversation`,
            };
        }
        if (entityType === client_1.ConversationEntityType.TASK) {
            const task = await this.tasks.assertReadable(entityId, user);
            return {
                entityType,
                entityId,
                label: task.title,
                responsibleUserIds: [task.assignedToId, task.reviewerId].filter((id) => Boolean(id)),
                actionUrl: `/tasks/${entityId}#conversation`,
            };
        }
        const activity = await this.activities.assertReadable(entityId, user);
        return {
            entityType,
            entityId,
            label: activity.outcome || activity.notes || activity.type,
            responsibleUserIds: [activity.userId],
            actionUrl: `/activities?activityId=${encodeURIComponent(entityId)}&conversation=1`,
        };
    }
};
exports.ConversationAccessService = ConversationAccessService;
exports.ConversationAccessService = ConversationAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [company_access_service_1.CompanyAccessService,
        tasks_service_1.TasksService,
        activities_service_1.ActivitiesService])
], ConversationAccessService);
//# sourceMappingURL=conversation-access.service.js.map