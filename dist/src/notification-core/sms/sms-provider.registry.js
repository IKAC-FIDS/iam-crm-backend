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
exports.SmsProviderRegistry = void 0;
const common_1 = require("@nestjs/common");
const generic_http_sms_provider_1 = require("./generic-http-sms.provider");
let SmsProviderRegistry = class SmsProviderRegistry {
    constructor(generic) { this.providers = new Map([[generic.code, generic]]); }
    get(code) {
        const provider = this.providers.get(code);
        if (!provider)
            throw new common_1.BadRequestException(`ارائه‌دهنده پیامک پشتیبانی نمی‌شود: ${code}`);
        return provider;
    }
    list() { return [...this.providers.keys()]; }
};
exports.SmsProviderRegistry = SmsProviderRegistry;
exports.SmsProviderRegistry = SmsProviderRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [generic_http_sms_provider_1.GenericHttpSmsProvider])
], SmsProviderRegistry);
//# sourceMappingURL=sms-provider.registry.js.map