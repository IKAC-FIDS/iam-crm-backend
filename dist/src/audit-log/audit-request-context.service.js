"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRequestContextService = void 0;
const common_1 = require("@nestjs/common");
const node_async_hooks_1 = require("node:async_hooks");
let AuditRequestContextService = class AuditRequestContextService {
    constructor() {
        this.storage = new node_async_hooks_1.AsyncLocalStorage();
    }
    run(context, callback) {
        this.storage.run(context, callback);
    }
    getContext() {
        return this.storage.getStore();
    }
};
exports.AuditRequestContextService = AuditRequestContextService;
exports.AuditRequestContextService = AuditRequestContextService = __decorate([
    (0, common_1.Injectable)()
], AuditRequestContextService);
//# sourceMappingURL=audit-request-context.service.js.map