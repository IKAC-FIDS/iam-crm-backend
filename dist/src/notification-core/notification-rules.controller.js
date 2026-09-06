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
exports.NotificationRulesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const notification_rule_dto_1 = require("./dto/notification-rule.dto");
const notification_rules_service_1 = require("./notification-rules.service");
let NotificationRulesController = class NotificationRulesController {
    constructor(rules) {
        this.rules = rules;
    }
    catalog() {
        return this.rules.catalog();
    }
    userTargets(user, search) {
        return this.rules.userTargets(user, search);
    }
    teamTargets(user) {
        return this.rules.teamTargets(user);
    }
    roleTargets(user) {
        return this.rules.roleTargets(user);
    }
    list(user) {
        return this.rules.list(user);
    }
    get(id, user) {
        return this.rules.get(id, user);
    }
    create(dto, user) {
        return this.rules.create(dto, user);
    }
    update(id, dto, user) {
        return this.rules.update(id, dto, user);
    }
    remove(id, user) {
        return this.rules.remove(id, user);
    }
};
exports.NotificationRulesController = NotificationRulesController;
__decorate([
    (0, common_1.Get)("catalog"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NotificationRulesController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)("targets/users"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotificationRulesController.prototype, "userTargets", null);
__decorate([
    (0, common_1.Get)("targets/teams"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationRulesController.prototype, "teamTargets", null);
__decorate([
    (0, common_1.Get)("targets/roles"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationRulesController.prototype, "roleTargets", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationRulesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationRulesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_rule_dto_1.CreateNotificationRuleDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationRulesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notification_rule_dto_1.UpdateNotificationRuleDto, Object]),
    __metadata("design:returntype", void 0)
], NotificationRulesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificationRulesController.prototype, "remove", null);
exports.NotificationRulesController = NotificationRulesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)("notification:manage"),
    (0, common_1.Controller)("admin/notification-rules"),
    __metadata("design:paramtypes", [notification_rules_service_1.NotificationRulesService])
], NotificationRulesController);
//# sourceMappingURL=notification-rules.controller.js.map