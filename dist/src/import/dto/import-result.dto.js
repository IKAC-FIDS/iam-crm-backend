"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportResultDto = exports.ImportSummaryDto = exports.ImportRowErrorDto = void 0;
const openapi = require("@nestjs/swagger");
class ImportRowErrorDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { row: { required: true, type: () => Number }, message: { required: true, type: () => String } };
    }
}
exports.ImportRowErrorDto = ImportRowErrorDto;
class ImportSummaryDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { companiesCreated: { required: true, type: () => Number }, peopleCreated: { required: true, type: () => Number } };
    }
}
exports.ImportSummaryDto = ImportSummaryDto;
class ImportResultDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { totalRows: { required: true, type: () => Number }, successful: { required: true, type: () => Number }, failed: { required: true, type: () => Number }, errors: { required: true, type: () => [require("./import-result.dto").ImportRowErrorDto] }, summary: { required: true, type: () => require("./import-result.dto").ImportSummaryDto } };
    }
}
exports.ImportResultDto = ImportResultDto;
//# sourceMappingURL=import-result.dto.js.map