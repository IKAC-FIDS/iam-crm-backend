"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountWorkspaceModule = void 0;
const common_1 = require("@nestjs/common");
const account_workspace_controller_1 = require("./account-workspace.controller");
const account_workspace_service_1 = require("./account-workspace.service");
let AccountWorkspaceModule = class AccountWorkspaceModule {
};
exports.AccountWorkspaceModule = AccountWorkspaceModule;
exports.AccountWorkspaceModule = AccountWorkspaceModule = __decorate([
    (0, common_1.Module)({
        controllers: [account_workspace_controller_1.AccountWorkspaceController],
        providers: [account_workspace_service_1.AccountWorkspaceService],
    })
], AccountWorkspaceModule);
//# sourceMappingURL=account-workspace.module.js.map