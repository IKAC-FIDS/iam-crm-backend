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
const audit_log_service_1 = require("../../audit-log/audit-log.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const update_stage_config_dto_1 = require("./dto/update-stage-config.dto");
const transitionInclude = {
    fromStage: { select: { id: true, code: true, label: true } },
    toStage: { select: { id: true, code: true, label: true } },
};
let PipelineConfigService = class PipelineConfigService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    getStages(activeOnly = false) {
        return this.prisma.pipelineStage.findMany({ where: activeOnly ? { isActive: true } : {}, orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] });
    }
    async getStage(id) {
        const stage = await this.prisma.pipelineStage.findUnique({ where: { id } });
        if (!stage)
            throw new common_1.NotFoundException('Pipeline stage not found');
        return stage;
    }
    async createStage(dto, actorId) {
        const code = this.normalizeCode(dto.code);
        this.validateTerminal(dto.isTerminal ?? false, dto.terminalType ?? 'NONE');
        if (dto.isDefault && (dto.isActive === false || dto.isTerminal))
            throw new common_1.BadRequestException('Default stage must be active and non-terminal');
        const existing = await this.prisma.pipelineStage.findUnique({ where: { code } });
        if (existing)
            throw new common_1.ConflictException('Pipeline stage code already exists');
        const created = await this.prisma.$transaction(async (tx) => {
            if (dto.isDefault)
                await tx.pipelineStage.updateMany({ data: { isDefault: false } });
            return tx.pipelineStage.create({ data: { ...dto, code, terminalType: dto.terminalType ?? 'NONE' } });
        });
        await this.audit.record({ actorId, entityType: 'pipeline_stage', entityId: created.id, action: 'pipeline.stage_created', after: created });
        return created;
    }
    async updateStage(id, dto, actorId) {
        const current = await this.getStage(id);
        const isActive = dto.isActive ?? current.isActive;
        const isTerminal = dto.isTerminal ?? current.isTerminal;
        const terminalType = dto.terminalType === undefined ? current.terminalType : dto.terminalType;
        const isDefault = dto.isDefault ?? current.isDefault;
        this.validateTerminal(isTerminal, terminalType ?? 'NONE');
        if (isDefault && (!isActive || isTerminal))
            throw new common_1.BadRequestException('Default stage must be active and non-terminal');
        if (current.isActive && !current.isTerminal && (!isActive || isTerminal))
            await this.assertAnotherActiveNonTerminal(id);
        if (dto.isActive === false) {
            const inUse = await this.prisma.opportunity.count({ where: { stageId: id, archivedAt: null } });
            if (inUse)
                throw new common_1.ConflictException(`Stage is used by ${inUse} active opportunities; use DELETE with replacementStageId`);
        }
        if (current.isDefault && dto.isDefault === false)
            throw new common_1.BadRequestException('Assign another default stage instead of clearing the only default');
        const updated = await this.prisma.$transaction(async (tx) => {
            if (dto.isDefault)
                await tx.pipelineStage.updateMany({ where: { NOT: { id } }, data: { isDefault: false } });
            return tx.pipelineStage.update({ where: { id }, data: dto });
        });
        await this.audit.record({ actorId, entityType: 'pipeline_stage', entityId: id, action: 'pipeline.stage_updated', before: current, after: updated });
        return updated;
    }
    async deactivateStage(id, replacementStageId, actorId) {
        const current = await this.getStage(id);
        const activeOpportunities = await this.prisma.opportunity.findMany({ where: { stageId: id, archivedAt: null }, select: { id: true } });
        let replacement = null;
        if (current.isDefault && !replacementStageId)
            throw new common_1.ConflictException('Default stage requires an active non-terminal replacement');
        if (replacementStageId) {
            if (replacementStageId === id)
                throw new common_1.BadRequestException('Replacement stage must be different');
            replacement = await this.getStage(replacementStageId);
            if (!replacement.isActive)
                throw new common_1.BadRequestException('Replacement stage must be active');
        }
        if (activeOpportunities.length && !replacement)
            throw new common_1.ConflictException(`Stage is used by ${activeOpportunities.length} active opportunities; replacementStageId is required`);
        if (current.isDefault && replacement?.isTerminal)
            throw new common_1.BadRequestException('Default replacement must be non-terminal');
        if (current.isActive && !current.isTerminal)
            await this.assertAnotherActiveNonTerminal(id);
        await this.prisma.$transaction(async (tx) => {
            if (replacement && activeOpportunities.length) {
                await tx.opportunity.updateMany({ where: { id: { in: activeOpportunities.map((item) => item.id) } }, data: { stageId: replacement.id, wonAt: replacement.terminalType === 'WON' ? new Date() : null, lostAt: replacement.terminalType === 'LOST' ? new Date() : null } });
                await tx.opportunityStageHistory.createMany({ data: activeOpportunities.map((item) => ({ opportunityId: item.id, fromStageId: id, toStageId: replacement.id, changedById: actorId })) });
            }
            await tx.pipelineStage.update({ where: { id }, data: { isActive: false, isDefault: false } });
            if (current.isDefault && replacement)
                await tx.pipelineStage.update({ where: { id: replacement.id }, data: { isDefault: true } });
        });
        const updated = await this.getStage(id);
        await this.audit.record({ actorId, entityType: 'pipeline_stage', entityId: id, action: 'pipeline.stage_deactivated', before: current, after: updated, metadata: { replacementStageId, movedOpportunities: activeOpportunities.length } });
        return updated;
    }
    async reorderStages(dto, actorId) {
        const ids = dto.items.map((item) => item.id);
        if (new Set(ids).size !== ids.length)
            throw new common_1.BadRequestException('Stage IDs must be unique');
        const found = await this.prisma.pipelineStage.count({ where: { id: { in: ids } } });
        if (found !== ids.length)
            throw new common_1.NotFoundException('One or more pipeline stages were not found');
        await this.prisma.$transaction(dto.items.map((item) => this.prisma.pipelineStage.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })));
        await this.audit.record({ actorId, entityType: 'pipeline_stage', action: 'pipeline.stages_reordered', metadata: dto });
        return this.getStages();
    }
    getTransitions() {
        return this.prisma.pipelineStageTransition.findMany({ include: transitionInclude, orderBy: [{ fromStageId: 'asc' }, { toStageId: 'asc' }, { role: 'asc' }] });
    }
    async createTransition(dto, actorId) {
        await this.validateTransitionStages(dto.fromStageId ?? null, dto.toStageId);
        await this.assertUnique(dto.fromStageId ?? null, dto.toStageId, dto.role ?? null);
        const created = await this.prisma.pipelineStageTransition.create({ data: { fromStageId: dto.fromStageId ?? null, toStageId: dto.toStageId, role: dto.role ?? null, isAllowed: dto.isAllowed }, include: transitionInclude });
        await this.audit.record({ actorId, entityType: 'pipeline_transition', entityId: created.id, action: 'pipeline.transition_rule_created', after: created });
        return created;
    }
    async updateTransition(id, dto, actorId) {
        const current = await this.findTransition(id);
        const fromStageId = dto.fromStageId === undefined ? current.fromStageId : dto.fromStageId;
        const toStageId = dto.toStageId ?? current.toStageId;
        const role = dto.role === undefined ? current.role : dto.role;
        await this.validateTransitionStages(fromStageId, toStageId);
        await this.assertUnique(fromStageId, toStageId, role, id);
        const updated = await this.prisma.pipelineStageTransition.update({ where: { id }, data: dto, include: transitionInclude });
        await this.audit.record({ actorId, entityType: 'pipeline_transition', entityId: id, action: 'pipeline.transition_rule_updated', before: current, after: updated });
        return updated;
    }
    async deleteTransition(id, actorId) {
        const current = await this.findTransition(id);
        const deleted = await this.prisma.pipelineStageTransition.delete({ where: { id } });
        await this.audit.record({ actorId, entityType: 'pipeline_transition', entityId: id, action: 'pipeline.transition_rule_deleted', before: current });
        return deleted;
    }
    async assertTransitionAllowed(fromStageId, toStageId, role) {
        const target = await this.getStage(toStageId);
        const rules = await this.prisma.pipelineStageTransition.findMany({ where: { fromStageId, toStageId, OR: [{ role }, { role: null }] } });
        const rule = rules.find((item) => item.role === role) ?? rules.find((item) => item.role === null);
        if (!target.isActive || !rule?.isAllowed)
            throw new common_1.BadRequestException('انتقال از این مرحله به مرحله انتخاب‌شده مجاز نیست.');
        return target;
    }
    async assertTransitionAllowedByCode(fromCode, toCode, role) {
        const stages = await this.prisma.pipelineStage.findMany({ where: { code: { in: [fromCode, toCode] } } });
        const from = stages.find((item) => item.code === fromCode);
        const to = stages.find((item) => item.code === toCode);
        if (!from || !to)
            throw new common_1.BadRequestException('Pipeline stage is not configured');
        return this.assertTransitionAllowed(from.id, to.id, role);
    }
    async findTransition(id) {
        const item = await this.prisma.pipelineStageTransition.findUnique({ where: { id }, include: transitionInclude });
        if (!item)
            throw new common_1.NotFoundException('Pipeline stage transition not found');
        return item;
    }
    async assertUnique(fromStageId, toStageId, role, excludeId) {
        const existing = await this.prisma.pipelineStageTransition.findFirst({ where: { fromStageId, toStageId, role, ...(excludeId && { NOT: { id: excludeId } }) } });
        if (existing)
            throw new common_1.ConflictException('This pipeline transition rule already exists');
    }
    async validateTransitionStages(fromStageId, toStageId) {
        if (fromStageId === toStageId)
            throw new common_1.BadRequestException('fromStageId and toStageId must be different');
        const count = await this.prisma.pipelineStage.count({ where: { id: { in: [fromStageId, toStageId].filter((id) => Boolean(id)) } } });
        if (count !== (fromStageId ? 2 : 1))
            throw new common_1.NotFoundException('Transition stage not found');
    }
    async assertAnotherActiveNonTerminal(excludeId) {
        const count = await this.prisma.pipelineStage.count({ where: { id: { not: excludeId }, isActive: true, isTerminal: false } });
        if (!count)
            throw new common_1.ConflictException('At least one active non-terminal stage must remain');
    }
    validateTerminal(isTerminal, terminalType) {
        if (!update_stage_config_dto_1.TERMINAL_TYPES.includes(terminalType))
            throw new common_1.BadRequestException('Invalid terminalType');
        if (isTerminal && terminalType === 'NONE')
            throw new common_1.BadRequestException('Terminal stages require a terminalType');
        if (!isTerminal && terminalType !== 'NONE')
            throw new common_1.BadRequestException('Non-terminal stages must use terminalType NONE');
    }
    normalizeCode(code) {
        return code.trim().toUpperCase().replace(/\s+/g, '_');
    }
};
exports.PipelineConfigService = PipelineConfigService;
exports.PipelineConfigService = PipelineConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_log_service_1.AuditLogService])
], PipelineConfigService);
//# sourceMappingURL=pipeline-config.service.js.map