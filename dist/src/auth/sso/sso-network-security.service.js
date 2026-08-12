"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SsoNetworkSecurityService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("node:dns/promises");
const node_net_1 = require("node:net");
let SsoNetworkSecurityService = class SsoNetworkSecurityService {
    assertPublicHttpsUrl(raw) {
        let url;
        try {
            url = new URL(raw);
        }
        catch {
            throw new common_1.BadRequestException("Invalid SSO endpoint URL");
        }
        if (url.protocol !== "https:" ||
            url.username ||
            url.password ||
            !url.hostname)
            throw new common_1.BadRequestException("SSO endpoints must use public HTTPS without embedded credentials");
        const host = url.hostname.toLowerCase();
        if (host === "localhost" ||
            host.endsWith(".localhost") ||
            this.isBlockedIp(host))
            throw new common_1.BadRequestException("SSO endpoint destination is not permitted");
        return url;
    }
    async assertResolvablePublicUrl(raw) {
        const url = this.assertPublicHttpsUrl(raw);
        const addresses = await (0, promises_1.lookup)(url.hostname, { all: true, verbatim: true });
        if (!addresses.length ||
            addresses.some((item) => this.isBlockedIp(item.address)))
            throw new common_1.BadRequestException("SSO endpoint resolved to a blocked network");
        return url;
    }
    async probe(raw) {
        const url = await this.assertResolvablePublicUrl(raw);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
            const response = await fetch(url, {
                method: "GET",
                redirect: "manual",
                signal: controller.signal,
                headers: {
                    accept: "application/json, application/xml, text/xml;q=0.8",
                },
            });
            const length = Number(response.headers.get("content-length") ?? 0);
            if (length > 1_048_576)
                throw new common_1.BadRequestException("SSO endpoint response is too large");
            if (response.status >= 300 && response.status < 400)
                throw new common_1.BadRequestException("SSO endpoint redirects are not accepted");
            return {
                reachable: response.ok,
                statusCode: response.status,
                endpointOrigin: url.origin,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.BadRequestException("SSO endpoint connection failed");
        }
        finally {
            clearTimeout(timer);
        }
    }
    isBlockedIp(value) {
        if (!(0, node_net_1.isIP)(value))
            return false;
        const ip = value.toLowerCase();
        if (ip === "::1" ||
            ip === "::" ||
            ip.startsWith("fe80:") ||
            ip.startsWith("fc") ||
            ip.startsWith("fd"))
            return true;
        const parts = ip.split(".").map(Number);
        return (parts.length === 4 &&
            (parts[0] === 10 ||
                parts[0] === 127 ||
                parts[0] === 0 ||
                (parts[0] === 169 && parts[1] === 254) ||
                (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
                (parts[0] === 192 && parts[1] === 168) ||
                (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
                parts[0] >= 224));
    }
};
exports.SsoNetworkSecurityService = SsoNetworkSecurityService;
exports.SsoNetworkSecurityService = SsoNetworkSecurityService = __decorate([
    (0, common_1.Injectable)()
], SsoNetworkSecurityService);
//# sourceMappingURL=sso-network-security.service.js.map