"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUseCaseDto = void 0;
const openapi = require("@nestjs/swagger");
const mapped_types_1 = require("@nestjs/mapped-types");
const create_use_case_dto_1 = require("./create-use-case.dto");
class UpdateUseCaseDto extends (0, mapped_types_1.PartialType)(create_use_case_dto_1.CreateUseCaseDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateUseCaseDto = UpdateUseCaseDto;
//# sourceMappingURL=update-use-case.dto.js.map