"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentPortalPrincipal = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentPortalPrincipal = (0, common_1.createParamDecorator)((_data, ctx) => ctx.switchToHttp().getRequest().user);
//# sourceMappingURL=current-portal-principal.decorator.js.map