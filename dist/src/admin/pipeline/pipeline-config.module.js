"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineConfigModule = void 0;
const common_1 = require("@nestjs/common");
const pipeline_config_controller_1 = require("./pipeline-config.controller");
const pipeline_config_service_1 = require("./pipeline-config.service");
let PipelineConfigModule = class PipelineConfigModule {
};
exports.PipelineConfigModule = PipelineConfigModule;
exports.PipelineConfigModule = PipelineConfigModule = __decorate([
    (0, common_1.Module)({
        controllers: [pipeline_config_controller_1.PipelineConfigController],
        providers: [pipeline_config_service_1.PipelineConfigService],
        exports: [pipeline_config_service_1.PipelineConfigService],
    })
], PipelineConfigModule);
//# sourceMappingURL=pipeline-config.module.js.map