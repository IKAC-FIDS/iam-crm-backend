"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCompanyBranchDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_company_branch_dto_1 = require("./create-company-branch.dto");
class UpdateCompanyBranchDto extends (0, mapped_types_1.PartialType)(create_company_branch_dto_1.CreateCompanyBranchDto) {
}
exports.UpdateCompanyBranchDto = UpdateCompanyBranchDto;
//# sourceMappingURL=update-company-branch.dto.js.map