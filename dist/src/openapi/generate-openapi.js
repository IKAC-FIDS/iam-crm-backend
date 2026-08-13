"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const app_module_1 = require("../app.module");
const openapi_document_1 = require("./openapi.document");
const openapi_constants_1 = require("./openapi.constants");
async function generate() {
    process.env.NODE_ENV ??= 'test';
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: false });
    app.setGlobalPrefix('api');
    const document = (0, openapi_document_1.createOpenApiDocument)(app);
    const output = (0, node_path_1.resolve)(process.cwd(), openapi_constants_1.OPENAPI_JSON_PATH);
    await (0, promises_1.mkdir)((0, node_path_1.dirname)(output), { recursive: true });
    await (0, promises_1.writeFile)(output, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    await app.close();
    process.stdout.write(`${output}\n`);
}
generate().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
});
//# sourceMappingURL=generate-openapi.js.map