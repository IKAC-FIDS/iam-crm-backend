"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PainPointsModule = void 0;
const common_1 = require("@nestjs/common");
const pain_points_service_1 = require("./pain-points.service");
const pain_points_controller_1 = require("./pain-points.controller");
let PainPointsModule = class PainPointsModule {
};
exports.PainPointsModule = PainPointsModule;
exports.PainPointsModule = PainPointsModule = __decorate([
    (0, common_1.Module)({
        providers: [pain_points_service_1.PainPointsService],
        controllers: [pain_points_controller_1.PainPointsController],
        exports: [pain_points_service_1.PainPointsService],
    })
], PainPointsModule);
//# sourceMappingURL=pain-points.module.js.map