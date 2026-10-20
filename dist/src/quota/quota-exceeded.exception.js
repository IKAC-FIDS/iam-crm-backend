"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotaExceededException = void 0;
const common_1 = require("@nestjs/common");
class QuotaExceededException extends common_1.HttpException {
    constructor(metric, current, requested, limit, resetAt) {
        super({
            code: 'QUOTA_EXCEEDED',
            message: 'Organization quota has been exceeded',
            details: {
                metric,
                current: current.toString(),
                requested: requested.toString(),
                limit: limit.toString(),
                resetAt: resetAt?.toISOString() ?? null,
            },
        }, common_1.HttpStatus.TOO_MANY_REQUESTS);
    }
}
exports.QuotaExceededException = QuotaExceededException;
//# sourceMappingURL=quota-exceeded.exception.js.map