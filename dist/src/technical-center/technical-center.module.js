"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalCenterModule = void 0;
const common_1 = require("@nestjs/common");
const technical_center_controller_1 = require("./technical-center.controller");
const technical_center_service_1 = require("./technical-center.service");
const notifications_module_1 = require("../notifications/notifications.module");
let TechnicalCenterModule = class TechnicalCenterModule {
};
exports.TechnicalCenterModule = TechnicalCenterModule;
exports.TechnicalCenterModule = TechnicalCenterModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule],
        controllers: [
            technical_center_controller_1.TechnicalReleasesController,
            technical_center_controller_1.TechnicalKnowledgeController,
            technical_center_controller_1.TechnicalDocumentsController,
            technical_center_controller_1.TechnicalResourcesController,
            technical_center_controller_1.TechnicalTendersController,
        ],
        providers: [technical_center_service_1.TechnicalCenterService],
        exports: [technical_center_service_1.TechnicalCenterService],
    })
], TechnicalCenterModule);
//# sourceMappingURL=technical-center.module.js.map