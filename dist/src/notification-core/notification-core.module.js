"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCoreModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const notification_core_service_1 = require("./notification-core.service");
const notification_rule_engine_service_1 = require("./notification-rule-engine.service");
const notification_rules_controller_1 = require("./notification-rules.controller");
const notification_rules_service_1 = require("./notification-rules.service");
let NotificationCoreModule = class NotificationCoreModule {
};
exports.NotificationCoreModule = NotificationCoreModule;
exports.NotificationCoreModule = NotificationCoreModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [notification_rules_controller_1.NotificationRulesController],
        providers: [notification_core_service_1.NotificationCoreService, notification_rules_service_1.NotificationRulesService, notification_rule_engine_service_1.NotificationRuleEngineService],
        exports: [notification_core_service_1.NotificationCoreService, notification_rules_service_1.NotificationRulesService, notification_rule_engine_service_1.NotificationRuleEngineService],
    })
], NotificationCoreModule);
//# sourceMappingURL=notification-core.module.js.map