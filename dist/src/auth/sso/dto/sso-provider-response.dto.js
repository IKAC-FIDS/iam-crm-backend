"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSsoProviderResponse = toSsoProviderResponse;
exports.toPublicSsoProviderResponse = toPublicSsoProviderResponse;
function toSsoProviderResponse(provider) {
    return {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        isActive: provider.isActive,
        autoProvision: provider.autoProvision,
        defaultRole: provider.defaultRole,
        allowedDomains: provider.allowedDomains,
        issuer: provider.issuer,
        clientId: provider.clientId,
        authorizationUrl: provider.authorizationUrl,
        tokenUrl: provider.tokenUrl,
        userInfoUrl: provider.userInfoUrl,
        jwksUrl: provider.jwksUrl,
        scopes: provider.scopes,
        entityId: provider.entityId,
        ssoUrl: provider.ssoUrl,
        x509Certificate: provider.x509Certificate,
        signRequests: provider.signRequests,
        wantAssertionsSigned: provider.wantAssertionsSigned,
        wantResponseSigned: provider.wantResponseSigned,
        emailAttribute: provider.emailAttribute,
        nameAttribute: provider.nameAttribute,
        groupsAttribute: provider.groupsAttribute,
        hasClientSecret: Boolean(provider.clientSecretEnc),
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
    };
}
function toPublicSsoProviderResponse(provider) {
    return {
        id: provider.id,
        name: provider.name,
        type: provider.type,
    };
}
//# sourceMappingURL=sso-provider-response.dto.js.map