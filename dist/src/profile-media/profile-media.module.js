"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileMediaModule = void 0;
const common_1 = require("@nestjs/common");
const attachments_module_1 = require("../attachments/attachments.module");
const profile_media_service_1 = require("./profile-media.service");
let ProfileMediaModule = class ProfileMediaModule {
};
exports.ProfileMediaModule = ProfileMediaModule;
exports.ProfileMediaModule = ProfileMediaModule = __decorate([
    (0, common_1.Module)({
        imports: [attachments_module_1.AttachmentsModule],
        providers: [profile_media_service_1.ProfileMediaService],
        exports: [profile_media_service_1.ProfileMediaService],
    })
], ProfileMediaModule);
//# sourceMappingURL=profile-media.module.js.map