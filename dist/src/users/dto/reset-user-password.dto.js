"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetUserPasswordDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ResetUserPasswordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { newPassword: { required: true, type: () => String, minLength: 8, maxLength: 128, pattern: "/[a-z]/" } };
    }
}
exports.ResetUserPasswordDto = ResetUserPasswordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(128),
    (0, class_validator_1.Matches)(/[a-z]/, { message: 'رمز عبور باید حداقل یک حرف کوچک داشته باشد' }),
    (0, class_validator_1.Matches)(/[A-Z]/, { message: 'رمز عبور باید حداقل یک حرف بزرگ داشته باشد' }),
    (0, class_validator_1.Matches)(/[0-9]/, { message: 'رمز عبور باید حداقل یک عدد داشته باشد' }),
    (0, class_validator_1.Matches)(/[^A-Za-z0-9]/, { message: 'رمز عبور باید حداقل یک کاراکتر خاص داشته باشد' }),
    __metadata("design:type", String)
], ResetUserPasswordDto.prototype, "newPassword", void 0);
//# sourceMappingURL=reset-user-password.dto.js.map