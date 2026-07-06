import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PipelineStage, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransitionDto } from './dto/create-transition.dto';
import { UpdateStageConfigDto } from './dto/update-stage-config.dto';
import { UpdateTransitionDto } from './dto/update-transition.dto';

@Injectable()
export class PipelineConfigService {
  constructor(private prisma: PrismaService) {}

  getStages() {
    return this.prisma.pipelineStageConfig.findMany({ orderBy: [{ sortOrder: 'asc' }, { stage: 'asc' }] });
  }

  async updateStage(stage: PipelineStage, dto: UpdateStageConfigDto) {
    const config = await this.prisma.pipelineStageConfig.findUnique({ where: { stage } });
    if (!config) throw new NotFoundException('Pipeline stage config not found');
    return this.prisma.pipelineStageConfig.update({ where: { stage }, data: dto });
  }

  getTransitions() {
    return this.prisma.pipelineStageTransition.findMany({
      orderBy: [{ fromStage: 'asc' }, { toStage: 'asc' }, { role: 'asc' }],
    });
  }

  async createTransition(dto: CreateTransitionDto) {
    this.validateDifferentStages(dto.fromStage, dto.toStage);
    await this.assertUnique(dto.fromStage ?? null, dto.toStage, dto.role ?? null);
    return this.prisma.pipelineStageTransition.create({
      data: { fromStage: dto.fromStage ?? null, toStage: dto.toStage, role: dto.role ?? null, isAllowed: dto.isAllowed },
    });
  }

  async updateTransition(id: string, dto: UpdateTransitionDto) {
    const current = await this.findTransition(id);
    const fromStage = dto.fromStage === undefined ? current.fromStage : dto.fromStage;
    const toStage = dto.toStage ?? current.toStage;
    const role = dto.role === undefined ? current.role : dto.role;
    this.validateDifferentStages(fromStage, toStage);
    await this.assertUnique(fromStage, toStage, role, id);
    return this.prisma.pipelineStageTransition.update({
      where: { id },
      data: {
        ...(dto.fromStage !== undefined && { fromStage: dto.fromStage }),
        ...(dto.toStage !== undefined && { toStage: dto.toStage }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isAllowed !== undefined && { isAllowed: dto.isAllowed }),
      },
    });
  }

  async deleteTransition(id: string) {
    await this.findTransition(id);
    return this.prisma.pipelineStageTransition.delete({ where: { id } });
  }

  async assertTransitionAllowed(fromStage: PipelineStage, toStage: PipelineStage, role: UserRole) {
    const target = await this.prisma.pipelineStageConfig.findUnique({ where: { stage: toStage } });
    const rules = await this.prisma.pipelineStageTransition.findMany({
      where: { fromStage, toStage, OR: [{ role }, { role: null }] },
    });
    const roleRule = rules.find((rule) => rule.role === role);
    const genericRule = rules.find((rule) => rule.role === null);
    if (!target?.isActive || !(roleRule ?? genericRule)?.isAllowed) {
      throw new BadRequestException('انتقال از این مرحله به مرحله انتخاب‌شده مجاز نیست.');
    }
  }

  private async findTransition(id: string) {
    const transition = await this.prisma.pipelineStageTransition.findUnique({ where: { id } });
    if (!transition) throw new NotFoundException('Pipeline stage transition not found');
    return transition;
  }

  private async assertUnique(fromStage: PipelineStage | null, toStage: PipelineStage, role: UserRole | null, excludeId?: string) {
    const existing = await this.prisma.pipelineStageTransition.findFirst({
      where: { fromStage, toStage, role, ...(excludeId && { NOT: { id: excludeId } }) },
    });
    if (existing) throw new ConflictException('This pipeline transition rule already exists');
  }

  private validateDifferentStages(fromStage: PipelineStage | null | undefined, toStage: PipelineStage) {
    if (fromStage === toStage) throw new BadRequestException('fromStage and toStage must be different');
  }
}
