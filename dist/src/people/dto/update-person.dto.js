"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePersonDto = void 0;
const openapi = require("@nestjs/swagger");
const mapped_types_1 = require("@nestjs/mapped-types");
const create_person_dto_1 = require("./create-person.dto");
class UpdatePersonDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_person_dto_1.CreatePersonDto, ['companyId', 'contacts', 'socials'])) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdatePersonDto = UpdatePersonDto;
//# sourceMappingURL=update-person.dto.js.map