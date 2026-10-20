"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLeadSourceDto = void 0;
const openapi = require("@nestjs/swagger");
const mapped_types_1 = require("@nestjs/mapped-types");
const create_lead_source_dto_1 = require("./create-lead-source.dto");
class UpdateLeadSourceDto extends (0, mapped_types_1.PartialType)(create_lead_source_dto_1.CreateLeadSourceDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateLeadSourceDto = UpdateLeadSourceDto;
//# sourceMappingURL=update-lead-source.dto.js.map