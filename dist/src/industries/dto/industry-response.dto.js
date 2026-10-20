"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndustryResponseDto = void 0;
const openapi = require("@nestjs/swagger");
class IndustryResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, name: { required: true, type: () => String }, description: { required: false, type: () => String }, painPoints: { required: true }, useCases: { required: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
}
exports.IndustryResponseDto = IndustryResponseDto;
//# sourceMappingURL=industry-response.dto.js.map