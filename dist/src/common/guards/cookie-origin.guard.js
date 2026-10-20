"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CookieOriginGuard = void 0;
const common_1 = require("@nestjs/common");
let CookieOriginGuard = class CookieOriginGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method))
            return true;
        const origin = req.get('origin');
        const allowed = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map(value => value.trim());
        if (!origin && process.env.NODE_ENV !== 'production' && process.env.AUTH_ALLOW_MISSING_ORIGIN === 'true')
            return true;
        if (origin && origin !== 'null' && allowed.includes(origin))
            return true;
        throw new common_1.ForbiddenException({ code: 'AUTH_ORIGIN_REJECTED', message: 'A trusted Origin is required' });
    }
};
exports.CookieOriginGuard = CookieOriginGuard;
exports.CookieOriginGuard = CookieOriginGuard = __decorate([
    (0, common_1.Injectable)()
], CookieOriginGuard);
//# sourceMappingURL=cookie-origin.guard.js.map