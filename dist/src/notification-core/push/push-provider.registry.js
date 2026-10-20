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
exports.PushProviderRegistry = void 0;
const common_1 = require("@nestjs/common");
const web_push_provider_1 = require("./web-push.provider");
let PushProviderRegistry = class PushProviderRegistry {
    constructor(webPush) { this.providers = new Map([[webPush.code, webPush]]); }
    get(code) {
        const provider = this.providers.get(code);
        if (!provider)
            throw new common_1.BadRequestException("ارائه‌دهنده اعلان پوش پشتیبانی نمی‌شود");
        return provider;
    }
    list() { return [...this.providers.keys()]; }
};
exports.PushProviderRegistry = PushProviderRegistry;
exports.PushProviderRegistry = PushProviderRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web_push_provider_1.WebPushProvider])
], PushProviderRegistry);
//# sourceMappingURL=push-provider.registry.js.map