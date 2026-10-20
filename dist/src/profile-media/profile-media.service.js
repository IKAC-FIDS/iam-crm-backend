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
exports.ProfileMediaService = exports.PROFILE_MEDIA_MAX_BYTES = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const node_path_1 = require("node:path");
const attachment_storage_types_1 = require("../attachments/storage/attachment-storage.types");
exports.PROFILE_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Map([
    ['image/png', '.png'],
    ['image/jpeg', '.jpg'],
    ['image/webp', '.webp'],
]);
let ProfileMediaService = class ProfileMediaService {
    constructor(storage) {
        this.storage = storage;
    }
    async save(scope, entityId, file) {
        if (!file)
            throw new common_1.BadRequestException('فایل تصویر الزامی است');
        const extension = ALLOWED_MEDIA_TYPES.get(file.mimetype);
        if (!extension) {
            throw new common_1.BadRequestException('فرمت تصویر باید PNG، JPG، JPEG یا WEBP باشد');
        }
        if (!file.size || file.size > exports.PROFILE_MEDIA_MAX_BYTES) {
            throw new common_1.BadRequestException('حجم تصویر باید حداکثر ۵ مگابایت باشد');
        }
        const saved = await this.storage.save({
            buffer: file.buffer,
            storedFileName: `${(0, node_crypto_1.randomUUID)()}${extension}`,
            relativeDirectory: (0, node_path_1.join)('profile-media', scope, entityId),
            mimeType: file.mimetype,
        });
        return {
            ...saved,
            mimeType: file.mimetype,
            originalName: this.safeName(file.originalname, extension),
        };
    }
    getStream(media) {
        return this.storage.getStream(media.objectKey, media.storagePath, media.bucket);
    }
    async delete(media) {
        if (!media.objectKey)
            return;
        await this.storage.delete(media.objectKey, media.storagePath, media.bucket);
    }
    safeName(name, fallbackExtension) {
        const base = name.replace(/[\\/\0\r\n]/g, '_').trim();
        return base ? `${base.slice(0, 180)}${(0, node_path_1.extname)(base) ? '' : fallbackExtension}` : `image${fallbackExtension}`;
    }
};
exports.ProfileMediaService = ProfileMediaService;
exports.ProfileMediaService = ProfileMediaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(attachment_storage_types_1.ATTACHMENT_STORAGE)),
    __metadata("design:paramtypes", [Object])
], ProfileMediaService);
//# sourceMappingURL=profile-media.service.js.map