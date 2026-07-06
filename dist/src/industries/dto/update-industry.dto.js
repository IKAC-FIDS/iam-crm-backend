"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateIndustryDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_industry_dto_1 = require("./create-industry.dto");
class UpdateIndustryDto extends (0, mapped_types_1.PartialType)(create_industry_dto_1.CreateIndustryDto) {
}
exports.UpdateIndustryDto = UpdateIndustryDto;
//# sourceMappingURL=update-industry.dto.js.map