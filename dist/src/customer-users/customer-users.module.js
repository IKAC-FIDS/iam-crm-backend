"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerUsersModule = void 0;
const common_1 = require("@nestjs/common");
const customer_access_module_1 = require("../customer-access/customer-access.module");
const email_module_1 = require("../email/email.module");
const customer_users_service_1 = require("./customer-users.service");
const customer_users_controller_1 = require("./customer-users.controller");
let CustomerUsersModule = class CustomerUsersModule {
};
exports.CustomerUsersModule = CustomerUsersModule;
exports.CustomerUsersModule = CustomerUsersModule = __decorate([
    (0, common_1.Module)({ imports: [customer_access_module_1.CustomerAccessModule, email_module_1.EmailModule], providers: [customer_users_service_1.CustomerUsersService], controllers: [customer_users_controller_1.InternalCustomerUsersController, customer_users_controller_1.PortalCustomerUsersController], exports: [customer_users_service_1.CustomerUsersService] })
], CustomerUsersModule);
//# sourceMappingURL=customer-users.module.js.map