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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasskeysService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const server_1 = require("@simplewebauthn/server");
const crypto_1 = require("crypto");
const node_cache_1 = __importDefault(require("node-cache"));
const audit_log_service_1 = require("../../audit-log/audit-log.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const auth_service_1 = require("../auth.service");
const CHALLENGE_TTL_SECONDS = 5 * 60;
let PasskeysService = class PasskeysService {
    constructor(prisma, config, authService, audit) {
        this.prisma = prisma;
        this.config = config;
        this.authService = authService;
        this.audit = audit;
        this.challenges = new node_cache_1.default({ stdTTL: CHALLENGE_TTL_SECONDS, checkperiod: 60 });
    }
    async listMine(user) {
        const passkeys = await this.prisma.userPasskey.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: 'desc' },
        });
        return passkeys.map((item) => this.toMetadata(item));
    }
    async startRegistration(user, dto) {
        const account = await this.prisma.user.findUnique({
            where: { id: user.userId },
            include: { passkeys: true },
        });
        if (!account || !account.isActive)
            throw new common_1.UnauthorizedException('User is not active');
        const options = await (0, server_1.generateRegistrationOptions)({
            rpName: this.rpName,
            rpID: this.rpID,
            userID: Buffer.from(account.id),
            userName: account.email,
            userDisplayName: account.fullName,
            attestationType: 'none',
            excludeCredentials: account.passkeys.map((item) => ({
                id: item.credentialId,
                transports: item.transports,
            })),
            authenticatorSelection: {
                residentKey: 'required',
                requireResidentKey: true,
                userVerification: 'required',
            },
        });
        this.challenges.set(this.registrationKey(user.userId), options.challenge);
        return options;
    }
    async verifyRegistration(user, dto) {
        const expectedChallenge = this.challenges.get(this.registrationKey(user.userId));
        if (!expectedChallenge)
            throw new common_1.BadRequestException('Passkey registration challenge expired');
        const verification = await (0, server_1.verifyRegistrationResponse)({
            response: dto.response,
            expectedChallenge,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
            requireUserVerification: true,
        }).catch(() => {
            throw new common_1.BadRequestException('Passkey registration failed');
        });
        if (!verification.verified)
            throw new common_1.BadRequestException('Passkey registration failed');
        const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;
        const existing = await this.prisma.userPasskey.findUnique({ where: { credentialId: credential.id } });
        if (existing)
            throw new common_1.BadRequestException('Passkey is already registered');
        const created = await this.prisma.userPasskey.create({
            data: {
                userId: user.userId,
                credentialId: credential.id,
                credentialPublicKey: Buffer.from(credential.publicKey),
                counter: credential.counter,
                transports: credential.transports?.map(String) ?? [],
                backedUp: credentialBackedUp,
                credentialDeviceType,
                deviceName: dto.deviceName?.trim() || undefined,
            },
        });
        this.challenges.del(this.registrationKey(user.userId));
        await this.audit.record({
            actorId: user.userId,
            entityType: 'user_passkey',
            entityId: created.id,
            action: 'passkey.registered',
            after: this.toMetadata(created),
        });
        return this.toMetadata(created);
    }
    async deleteMine(user, id) {
        const passkey = await this.prisma.userPasskey.findFirst({ where: { id, userId: user.userId } });
        if (!passkey)
            throw new common_1.NotFoundException('Passkey not found');
        await this.prisma.userPasskey.delete({ where: { id } });
        await this.audit.record({
            actorId: user.userId,
            entityType: 'user_passkey',
            entityId: id,
            action: 'passkey.deleted',
            before: this.toMetadata(passkey),
        });
        return { id, deleted: true };
    }
    async startAuthentication() {
        const challengeId = (0, crypto_1.randomUUID)();
        const options = await (0, server_1.generateAuthenticationOptions)({
            rpID: this.rpID,
            userVerification: 'required',
        });
        this.challenges.set(this.authenticationKey(challengeId), options.challenge);
        return { challengeId, options };
    }
    async verifyAuthentication(dto) {
        const expectedChallenge = this.challenges.get(this.authenticationKey(dto.challengeId));
        if (!expectedChallenge)
            throw new common_1.BadRequestException('Passkey authentication challenge expired');
        const response = dto.response;
        const credentialId = typeof response.id === 'string' ? response.id : undefined;
        if (!credentialId)
            throw new common_1.UnauthorizedException('Passkey authentication failed');
        const passkey = await this.prisma.userPasskey.findUnique({
            where: { credentialId },
            include: { user: true },
        });
        if (!passkey || !passkey.user?.isActive) {
            await this.recordLoginFailure(credentialId);
            throw new common_1.UnauthorizedException('Passkey authentication failed');
        }
        const verification = await (0, server_1.verifyAuthenticationResponse)({
            response,
            expectedChallenge,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
            credential: {
                id: passkey.credentialId,
                publicKey: new Uint8Array(passkey.credentialPublicKey),
                counter: passkey.counter,
                transports: passkey.transports,
            },
            requireUserVerification: true,
        }).catch(async () => {
            await this.recordLoginFailure(credentialId, passkey.id, passkey.userId);
            throw new common_1.UnauthorizedException('Passkey authentication failed');
        });
        if (!verification.verified) {
            await this.recordLoginFailure(credentialId, passkey.id, passkey.userId);
            throw new common_1.UnauthorizedException('Passkey authentication failed');
        }
        await this.prisma.userPasskey.update({
            where: { id: passkey.id },
            data: {
                counter: verification.authenticationInfo.newCounter,
                backedUp: verification.authenticationInfo.credentialBackedUp,
                credentialDeviceType: verification.authenticationInfo.credentialDeviceType,
                lastUsedAt: new Date(),
            },
        });
        this.challenges.del(this.authenticationKey(dto.challengeId));
        await this.audit.record({
            actorId: passkey.userId,
            entityType: 'user_passkey',
            entityId: passkey.id,
            action: 'passkey.login_success',
            metadata: { credentialId: passkey.credentialId },
        });
        return this.authService.buildLoginResponse(passkey.user);
    }
    async listForUser(userId) {
        await this.assertUserExists(userId);
        const passkeys = await this.prisma.userPasskey.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return passkeys.map((item) => this.toMetadata(item));
    }
    async adminDelete(userId, passkeyId, actorId) {
        await this.assertUserExists(userId);
        const passkey = await this.prisma.userPasskey.findFirst({ where: { id: passkeyId, userId } });
        if (!passkey)
            throw new common_1.NotFoundException('Passkey not found');
        await this.prisma.userPasskey.delete({ where: { id: passkeyId } });
        await this.audit.record({
            actorId,
            entityType: 'user_passkey',
            entityId: passkeyId,
            action: 'passkey.admin_deleted',
            before: this.toMetadata(passkey),
            metadata: { userId },
        });
        return { id: passkeyId, deleted: true };
    }
    toMetadata(passkey) {
        return {
            id: passkey.id,
            deviceName: passkey.deviceName,
            createdAt: passkey.createdAt,
            updatedAt: passkey.updatedAt,
            lastUsedAt: passkey.lastUsedAt,
            transports: passkey.transports,
            backedUp: passkey.backedUp,
            credentialDeviceType: passkey.credentialDeviceType,
        };
    }
    async assertUserExists(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
    }
    async recordLoginFailure(credentialId, passkeyId, userId) {
        await this.audit.record({
            actorId: userId,
            entityType: 'user_passkey',
            entityId: passkeyId,
            action: 'passkey.login_failed',
            metadata: { credentialId },
        });
    }
    registrationKey(userId) {
        return `passkey:registration:${userId}`;
    }
    authenticationKey(challengeId) {
        return `passkey:authentication:${challengeId}`;
    }
    get rpName() {
        return this.config.get('WEBAUTHN_RP_NAME', 'IAM CRM');
    }
    get rpID() {
        return this.config.get('WEBAUTHN_RP_ID', 'localhost');
    }
    get origin() {
        return this.config.get('WEBAUTHN_ORIGIN', 'http://localhost:5173');
    }
};
exports.PasskeysService = PasskeysService;
exports.PasskeysService = PasskeysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        auth_service_1.AuthService,
        audit_log_service_1.AuditLogService])
], PasskeysService);
//# sourceMappingURL=passkeys.service.js.map