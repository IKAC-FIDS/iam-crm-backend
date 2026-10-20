"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureRuntimeOpenApi = configureRuntimeOpenApi;
const swagger_1 = require("@nestjs/swagger");
const openapi_document_1 = require("./openapi.document");
const openapi_constants_1 = require("./openapi.constants");
function configureRuntimeOpenApi(app, enabled) {
    if (!enabled)
        return;
    swagger_1.SwaggerModule.setup(openapi_constants_1.SWAGGER_PATH, app, (0, openapi_document_1.createOpenApiDocument)(app), {
        jsonDocumentUrl: `/${openapi_constants_1.SWAGGER_PATH}/openapi.json`,
        swaggerOptions: { persistAuthorization: false },
    });
}
//# sourceMappingURL=openapi.runtime.js.map