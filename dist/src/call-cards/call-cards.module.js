"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallCardsModule = void 0;
const common_1 = require("@nestjs/common");
const call_cards_service_1 = require("./call-cards.service");
const call_cards_controller_1 = require("./call-cards.controller");
let CallCardsModule = class CallCardsModule {
};
exports.CallCardsModule = CallCardsModule;
exports.CallCardsModule = CallCardsModule = __decorate([
    (0, common_1.Module)({
        providers: [call_cards_service_1.CallCardsService],
        controllers: [call_cards_controller_1.CallCardsController],
    })
], CallCardsModule);
//# sourceMappingURL=call-cards.module.js.map