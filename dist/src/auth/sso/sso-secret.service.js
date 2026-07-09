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
exports.SsoSecretService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let SsoSecretService = class SsoSecretService {
    constructor(config) {
        this.config = config;
        this.algorithm = 'aes-256-gcm';
    }
    encryptSecret(value) {
        const key = this.getKey();
        const iv = (0, crypto_1.randomBytes)(12);
        const cipher = (0, crypto_1.createCipheriv)(this.algorithm, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(value, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        return [
            'gcm',
            iv.toString('base64'),
            authTag.toString('base64'),
            encrypted.toString('base64'),
        ].join(':');
    }
    decryptSecret(value) {
        const key = this.getKey();
        const parts = value.split(':');
        if (parts.length !== 4 || parts[0] !== 'gcm') {
            throw new common_1.BadRequestException('Invalid encrypted SSO secret format');
        }
        const [, ivBase64, authTagBase64, encryptedBase64] = parts;
        try {
            const decipher = (0, crypto_1.createDecipheriv)(this.algorithm, key, Buffer.from(ivBase64, 'base64'));
            decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
            const decrypted = Buffer.concat([
                decipher.update(Buffer.from(encryptedBase64, 'base64')),
                decipher.final(),
            ]);
            return decrypted.toString('utf8');
        }
        catch {
            throw new common_1.BadRequestException('Invalid encrypted SSO secret');
        }
    }
    getKey() {
        const secret = this.config.get('SSO_SECRET_ENCRYPTION_KEY');
        console.log('SSO_SECRET_ENCRYPTION_KEY exists:', !!secret);
        console.log('SSO_SECRET length:', secret?.length);
        if (!secret || secret.length < 32) {
            throw new common_1.InternalServerErrorException('SSO secret encryption key is not configured');
        }
        return (0, crypto_1.createHash)('sha256').update(secret).digest();
    }
};
exports.SsoSecretService = SsoSecretService;
exports.SsoSecretService = SsoSecretService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SsoSecretService);
//# sourceMappingURL=sso-secret.service.js.map