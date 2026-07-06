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
exports.PipelineConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_log_service_1 = require("../../audit-log/audit-log.service");
let PipelineConfigService = class PipelineConfigService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    getStages() {
        return this.prisma.pipelineStageConfig.findMany({ orderBy: [{ sortOrder: 'asc' }, { stage: 'asc' }] });
    }
    async updateStage(stage, dto) {
        const config = await this.prisma.pipelineStageConfig.findUnique({ where: { stage } });
        if (!config)
            throw new common_1.NotFoundException('Pipeline stage config not found');
        return this.prisma.pipelineStageConfig.update({ where: { stage }, data: dto });
    }
    getTransitions() {
        return this.prisma.pipelineStageTransition.findMany({
            orderBy: [{ fromStage: 'asc' }, { toStage: 'asc' }, { role: 'asc' }],
        });
    }
    async createTransition(dto, actorId) {
        this.validateDifferentStages(dto.fromStage, dto.toStage);
        await this.assertUnique(dto.fromStage ?? null, dto.toStage, dto.role ?? null);
        const created = await this.prisma.pipelineStageTransition.create({
            data: { fromStage: dto.fromStage ?? null, toStage: dto.toStage, role: dto.role ?? null, isAllowed: dto.isAllowed },
        });
        await this.audit.record({ actorId, entityType: 'pipeline_transition', entityId: created.id, action: 'pipeline.transition_rule_created', after: created });
        return created;
    }
    async updateTransition(id, dto, actorId) {
        const current = await this.findTransition(id);
        const fromStage = dto.fromStage === undefined ? current.fromStage : dto.fromStage;
        const toStage = dto.toStage ?? current.toStage;
        const role = dto.role === undefined ? current.role : dto.role;
        this.validateDifferentStages(fromStage, toStage);
        await this.assertUnique(fromStage, toStage, role, id);
        const updated = await this.prisma.pipelineStageTransition.update({
            where: { id },
            data: {
                ...(dto.fromStage !== undefined && { fromStage: dto.fromStage }),
                ...(dto.toStage !== undefined && { toStage: dto.toStage }),
                ...(dto.role !== undefined && { role: dto.role }),
                ...(dto.isAllowed !== undefined && { isAllowed: dto.isAllowed }),
            },
        });
        await this.audit.record({ actorId, entityType: 'pipeline_transition', entityId: id, action: 'pipeline.transition_rule_updated', before: current, after: updated });
        return updated;
    }
    async deleteTransition(id, actorId) {
        const current = await this.findTransition(id);
        const deleted = await this.prisma.pipelineStageTransition.delete({ where: { id } });
        await this.audit.record({ actorId, entityType: 'pipeline_transition', entityId: id, action: 'pipeline.transition_rule_deleted', before: current });
        return deleted;
    }
    async assertTransitionAllowed(fromStage, toStage, role) {
        const target = await this.prisma.pipelineStageConfig.findUnique({ where: { stage: toStage } });
        const rules = await this.prisma.pipelineStageTransition.findMany({
            where: { fromStage, toStage, OR: [{ role }, { role: null }] },
        });
        const roleRule = rules.find((rule) => rule.role === role);
        const genericRule = rules.find((rule) => rule.role === null);
        if (!target?.isActive || !(roleRule ?? genericRule)?.isAllowed) {
            throw new common_1.BadRequestException('انتقال از این مرحله به مرحله انتخاب‌شده مجاز نیست.');
        }
    }
    async findTransition(id) {
        const transition = await this.prisma.pipelineStageTransition.findUnique({ where: { id } });
        if (!transition)
            throw new common_1.NotFoundException('Pipeline stage transition not found');
        return transition;
    }
    async assertUnique(fromStage, toStage, role, excludeId) {
        const existing = await this.prisma.pipelineStageTransition.findFirst({
            where: { fromStage, toStage, role, ...(excludeId && { NOT: { id: excludeId } }) },
        });
        if (existing)
            throw new common_1.ConflictException('This pipeline transition rule already exists');
    }
    validateDifferentStages(fromStage, toStage) {
        if (fromStage === toStage)
            throw new common_1.BadRequestException('fromStage and toStage must be different');
    }
};
exports.PipelineConfigService = PipelineConfigService;
exports.PipelineConfigService = PipelineConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_log_service_1.AuditLogService])
], PipelineConfigService);
//# sourceMappingURL=pipeline-config.service.js.map