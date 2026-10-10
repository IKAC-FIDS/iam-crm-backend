import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PipelineConfigService } from '../src/admin/pipeline/pipeline-config.service';

describe('PipelineConfigService transition rules', () => {
  const target = { id: 'target-stage', isActive: true };

  function createService(rules: Array<{ fromStageId: string | null; role: UserRole | null; isAllowed: boolean }>) {
    const prisma = {
      pipelineStage: { findUnique: jest.fn().mockResolvedValue(target) },
      pipelineStageTransition: { findMany: jest.fn().mockResolvedValue(rules) },
    };
    const service = new PipelineConfigService(prisma as any, {} as any);
    return { service, prisma };
  }

  it('applies a generic all-source-stages rule', async () => {
    const { service, prisma } = createService([
      { fromStageId: null, role: null, isAllowed: true },
    ]);

    await expect(
      service.assertTransitionAllowed('current-stage', target.id, UserRole.REP),
    ).resolves.toBe(target);
    expect(prisma.pipelineStageTransition.findMany).toHaveBeenCalledWith({
      where: {
        toStageId: target.id,
        AND: [
          { OR: [{ fromStageId: 'current-stage' }, { fromStageId: null }] },
          { OR: [{ role: UserRole.REP }, { role: null }] },
        ],
      },
    });
  });

  it('gives a role-specific all-source-stages rule precedence over a generic exact-source rule', async () => {
    const { service } = createService([
      { fromStageId: 'current-stage', role: null, isAllowed: true },
      { fromStageId: null, role: UserRole.REP, isAllowed: false },
    ]);

    await expect(
      service.assertTransitionAllowed('current-stage', target.id, UserRole.REP),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('gives an exact-source role rule precedence over an all-source-stages role rule', async () => {
    const { service } = createService([
      { fromStageId: null, role: UserRole.REP, isAllowed: false },
      { fromStageId: 'current-stage', role: UserRole.REP, isAllowed: true },
    ]);

    await expect(
      service.assertTransitionAllowed('current-stage', target.id, UserRole.REP),
    ).resolves.toBe(target);
  });
});
