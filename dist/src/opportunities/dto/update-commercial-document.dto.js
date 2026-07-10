"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCommercialDocumentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_commercial_document_dto_1 = require("./create-commercial-document.dto");
class UpdateCommercialDocumentDto extends (0, mapped_types_1.PartialType)(create_commercial_document_dto_1.CreateCommercialDocumentDto) {
}
exports.UpdateCommercialDocumentDto = UpdateCommercialDocumentDto;
//# sourceMappingURL=update-commercial-document.dto.js.map