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
var MinioAttachmentStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinioAttachmentStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const node_path_1 = require("node:path");
let MinioAttachmentStorageService = MinioAttachmentStorageService_1 = class MinioAttachmentStorageService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(MinioAttachmentStorageService_1.name);
        const endpoint = this.config.get('S3_ENDPOINT');
        const accessKeyId = this.config.get('S3_ACCESS_KEY_ID');
        const secretAccessKey = this.config.get('S3_SECRET_ACCESS_KEY');
        if (!endpoint || !accessKeyId || !secretAccessKey) {
            throw new common_1.BadRequestException('MinIO/S3 storage requires S3_ENDPOINT, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY');
        }
        this.bucket = this.config.get('S3_BUCKET', 'iam-crm-attachments');
        this.client = new client_s3_1.S3Client({
            endpoint,
            region: this.config.get('S3_REGION', 'us-east-1'),
            forcePathStyle: this.config.get('S3_FORCE_PATH_STYLE', true),
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }
    async save(input) {
        const objectKey = node_path_1.posix.join(input.relativeDirectory.replace(/\\/g, '/'), input.storedFileName);
        try {
            await this.client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: objectKey,
                Body: input.buffer,
                ContentType: input.mimeType,
                Metadata: {
                    originalStoredFileName: input.storedFileName,
                },
            }));
        }
        catch (error) {
            this.logger.error(`Failed to upload attachment object ${objectKey} to bucket ${this.bucket}`, error instanceof Error ? error.stack : String(error));
            throw new common_1.ServiceUnavailableException({
                code: 'ATTACHMENT_STORAGE_UPLOAD_FAILED',
                message: 'Failed to upload attachment to object storage',
                details: this.normalizeStorageError(error),
            });
        }
        return {
            storageProvider: client_1.AttachmentStorageProvider.MINIO,
            bucket: this.bucket,
            objectKey,
            storagePath: null,
        };
    }
    async getStream(objectKey, _storagePath, bucket) {
        const resolvedBucket = bucket || this.bucket;
        try {
            const response = await this.client.send(new client_s3_1.GetObjectCommand({
                Bucket: resolvedBucket,
                Key: objectKey,
            }));
            if (!response.Body) {
                throw new common_1.NotFoundException('File was not found in object storage');
            }
            return response.Body;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            if (error instanceof client_s3_1.NoSuchKey || this.isObjectNotFoundError(error)) {
                throw new common_1.NotFoundException('File was not found in object storage');
            }
            this.logger.error(`Failed to download attachment object ${objectKey} from bucket ${resolvedBucket}`, error instanceof Error ? error.stack : String(error));
            throw new common_1.ServiceUnavailableException({
                code: 'ATTACHMENT_STORAGE_DOWNLOAD_FAILED',
                message: 'Failed to download attachment from object storage',
                details: this.normalizeStorageError(error),
            });
        }
    }
    async delete(objectKey, _storagePath, bucket) {
        await this.client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: bucket || this.bucket,
            Key: objectKey,
        }));
    }
    isObjectNotFoundError(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        const candidate = error;
        const code = candidate.name ?? candidate.Code ?? candidate.code;
        return ((error instanceof client_s3_1.S3ServiceException &&
            error.$metadata?.httpStatusCode === 404) ||
            code === 'NoSuchKey' ||
            code === 'NotFound' ||
            code === 'NoSuchBucket' ||
            code === 'NotFoundError' ||
            code === 'NoSuchObject' ||
            candidate.$metadata?.httpStatusCode === 404);
    }
    normalizeStorageError(error) {
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
            };
        }
        return {
            message: 'Unknown object storage error',
        };
    }
};
exports.MinioAttachmentStorageService = MinioAttachmentStorageService;
exports.MinioAttachmentStorageService = MinioAttachmentStorageService = MinioAttachmentStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MinioAttachmentStorageService);
//# sourceMappingURL=minio-attachment-storage.service.js.map