"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaginationMeta = createPaginationMeta;
exports.getPaginationOffset = getPaginationOffset;
const pagination_meta_1 = require("./pagination.meta");
function createPaginationMeta(page, limit, total) {
    return new pagination_meta_1.PaginationMetaDto(page, limit, total);
}
function getPaginationOffset(page = 1, limit = 20) {
    return {
        skip: (page - 1) * limit,
        take: limit,
    };
}
//# sourceMappingURL=pagination.util.js.map