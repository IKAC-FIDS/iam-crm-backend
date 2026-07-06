"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCompanyOpportunityDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_opportunity_dto_1 = require("./create-opportunity.dto");
class CreateCompanyOpportunityDto extends (0, mapped_types_1.OmitType)(create_opportunity_dto_1.CreateOpportunityDto, ['companyId']) {
}
exports.CreateCompanyOpportunityDto = CreateCompanyOpportunityDto;
//# sourceMappingURL=create-company-opportunity.dto.js.map