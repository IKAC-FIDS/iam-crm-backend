"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePainPointDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_pain_point_dto_1 = require("./create-pain-point.dto");
class UpdatePainPointDto extends (0, mapped_types_1.PartialType)(create_pain_point_dto_1.CreatePainPointDto) {
}
exports.UpdatePainPointDto = UpdatePainPointDto;
//# sourceMappingURL=update-pain-point.dto.js.map