"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollaborationModule = void 0;
const common_1 = require("@nestjs/common");
const audit_log_module_1 = require("../audit-log/audit-log.module");
const collaboration_access_service_1 = require("./collaboration-access.service");
const collaboration_controller_1 = require("./collaboration.controller");
const collaboration_service_1 = require("./collaboration.service");
let CollaborationModule = class CollaborationModule {
};
exports.CollaborationModule = CollaborationModule;
exports.CollaborationModule = CollaborationModule = __decorate([
    (0, common_1.Module)({ imports: [audit_log_module_1.AuditLogModule], controllers: [collaboration_controller_1.CollaborationController], providers: [collaboration_access_service_1.CollaborationAccessService, collaboration_service_1.CollaborationService], exports: [collaboration_access_service_1.CollaborationAccessService] })
], CollaborationModule);
//# sourceMappingURL=collaboration.module.js.map