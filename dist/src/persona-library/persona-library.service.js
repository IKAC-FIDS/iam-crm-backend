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
exports.PersonaLibraryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PersonaLibraryService = class PersonaLibraryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.personaLibrary.findMany({ orderBy: { titlePattern: 'asc' } });
    }
    create(dto) {
        return this.prisma.personaLibrary.create({ data: dto });
    }
    async update(id, dto) {
        const exists = await this.prisma.personaLibrary.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Persona پیدا نشد');
        return this.prisma.personaLibrary.update({ where: { id }, data: dto });
    }
    async remove(id) {
        const exists = await this.prisma.personaLibrary.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Persona پیدا نشد');
        return this.prisma.personaLibrary.delete({ where: { id } });
    }
};
exports.PersonaLibraryService = PersonaLibraryService;
exports.PersonaLibraryService = PersonaLibraryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PersonaLibraryService);
//# sourceMappingURL=persona-library.service.js.map