"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOrganizationHostname = normalizeOrganizationHostname;
const common_1 = require("@nestjs/common");
const node_url_1 = require("node:url");
function normalizeOrganizationHostname(input) {
    const raw = input.trim().toLowerCase().replace(/\.$/, "");
    if (!raw || raw.includes("://") || /[/?#:@\s]/.test(raw))
        throw new common_1.BadRequestException("Invalid hostname");
    const hostname = (0, node_url_1.domainToASCII)(raw).toLowerCase();
    if (!hostname || hostname.length > 253 || hostname.split(".").length < 2)
        throw new common_1.BadRequestException("Invalid hostname");
    const labels = hostname.split(".");
    if (labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))
        throw new common_1.BadRequestException("Invalid hostname");
    return hostname;
}
//# sourceMappingURL=organization-domain-normalizer.js.map