"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const attachments_controller_1 = require("./attachments.controller");
const attachments_service_1 = require("./attachments.service");
const attachment_storage_types_1 = require("./storage/attachment-storage.types");
const local_attachment_storage_service_1 = require("./storage/local-attachment-storage.service");
const minio_attachment_storage_service_1 = require("./storage/minio-attachment-storage.service");
let AttachmentsModule = class AttachmentsModule {
};
exports.AttachmentsModule = AttachmentsModule;
exports.AttachmentsModule = AttachmentsModule = __decorate([
    (0, common_1.Module)({
        controllers: [attachments_controller_1.AttachmentsController],
        providers: [
            attachments_service_1.AttachmentsService,
            {
                provide: attachment_storage_types_1.ATTACHMENT_STORAGE,
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const driver = config.get('ATTACHMENT_STORAGE_DRIVER', 'local');
                    if (driver === 'minio') {
                        return new minio_attachment_storage_service_1.MinioAttachmentStorageService(config);
                    }
                    return new local_attachment_storage_service_1.LocalAttachmentStorageService(config);
                },
            },
        ],
    })
], AttachmentsModule);
//# sourceMappingURL=attachments.module.js.map