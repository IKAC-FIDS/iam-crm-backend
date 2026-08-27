"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationMetaDto = void 0;
class PaginationMetaDto {
    constructor(page, limit, total) {
        this.page = page;
        this.limit = limit;
        this.total = total;
        this.totalPages = Math.ceil(total / limit);
        this.hasNext = page < this.totalPages;
        this.hasPrevious = page > 1;
    }
}
exports.PaginationMetaDto = PaginationMetaDto;
//# sourceMappingURL=pagination.meta.js.map