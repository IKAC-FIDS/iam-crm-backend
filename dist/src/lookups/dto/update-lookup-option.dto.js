"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLookupOptionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_lookup_option_dto_1 = require("./create-lookup-option.dto");
class UpdateLookupOptionDto extends (0, mapped_types_1.PartialType)(create_lookup_option_dto_1.CreateLookupOptionDto) {
}
exports.UpdateLookupOptionDto = UpdateLookupOptionDto;
//# sourceMappingURL=update-lookup-option.dto.js.map