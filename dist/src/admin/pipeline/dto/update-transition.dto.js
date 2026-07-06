"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTransitionDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_transition_dto_1 = require("./create-transition.dto");
class UpdateTransitionDto extends (0, mapped_types_1.PartialType)(create_transition_dto_1.CreateTransitionDto) {
}
exports.UpdateTransitionDto = UpdateTransitionDto;
//# sourceMappingURL=update-transition.dto.js.map