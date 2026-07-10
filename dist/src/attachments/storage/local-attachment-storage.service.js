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
exports.LocalAttachmentStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
let LocalAttachmentStorageService = class LocalAttachmentStorageService {
    constructor(config) {
        this.config = config;
    }
    async save(input) {
        const objectKey = (0, node_path_1.join)(input.relativeDirectory, input.storedFileName);
        const absoluteDirectory = this.resolveStoragePath(input.relativeDirectory);
        const absolutePath = this.resolveStoragePath(objectKey);
        await (0, promises_1.mkdir)(absoluteDirectory, { recursive: true });
        await (0, promises_1.writeFile)(absolutePath, input.buffer, { flag: 'wx' });
        return {
            storageProvider: client_1.AttachmentStorageProvider.LOCAL,
            bucket: null,
            objectKey,
            storagePath: objectKey,
        };
    }
    async getStream(objectKey) {
        const absolutePath = this.resolveStoragePath(objectKey);
        try {
            await (0, promises_1.access)(absolutePath);
        }
        catch {
            throw new common_1.NotFoundException('فایل ذخیره‌شده روی دیسک پیدا نشد');
        }
        return (0, node_fs_1.createReadStream)(absolutePath);
    }
    getStorageRoot() {
        return (0, node_path_1.resolve)(process.cwd(), this.config.get('ATTACHMENT_STORAGE_ROOT', 'storage/attachments'));
    }
    resolveStoragePath(storagePath) {
        const storageRoot = this.getStorageRoot();
        const absolutePath = (0, node_path_1.resolve)(storageRoot, storagePath);
        if (absolutePath !== storageRoot &&
            !absolutePath.startsWith(`${storageRoot}${node_path_1.sep}`)) {
            throw new common_1.ForbiddenException('Invalid attachment storage path');
        }
        return absolutePath;
    }
};
exports.LocalAttachmentStorageService = LocalAttachmentStorageService;
exports.LocalAttachmentStorageService = LocalAttachmentStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LocalAttachmentStorageService);
//# sourceMappingURL=local-attachment-storage.service.js.map