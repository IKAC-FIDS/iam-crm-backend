"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentPlatform = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentPlatform = (0, common_1.createParamDecorator)((_data, context) => context.switchToHttp().getRequest().platformContext);
//# sourceMappingURL=current-platform.decorator.js.map