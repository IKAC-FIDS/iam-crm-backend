"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentTenant = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentTenant = (0, common_1.createParamDecorator)((_data, context) => {
    const request = context.switchToHttp().getRequest();
    if (!request.user?.tenantContext) {
        throw new common_1.UnauthorizedException('Validated Tenant context is required');
    }
    return request.user.tenantContext;
});
//# sourceMappingURL=current-tenant.decorator.js.map