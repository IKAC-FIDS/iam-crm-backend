import { Injectable, NotFoundException } from '@nestjs/common';
import { CollaborationChannelVisibility } from '@prisma/client';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { getCurrentOrganizationId, tenantScope } from '../common/tenant/tenant-scope.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CollaborationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertReadable(channelId: string, user: CurrentUserPayload) {
    const organizationId = getCurrentOrganizationId(user);
    const channel = await this.prisma.withTenantTransaction(tenantScope.require(user), (tx) =>
      tx.collaborationChannel.findFirst({
        where: {
          id: channelId,
          organizationId,
          archivedAt: null,
          topic: { archivedAt: null },
          OR: [
            { visibility: CollaborationChannelVisibility.PUBLIC },
            { members: { some: { userId: user.userId } } },
          ],
        },
        include: { topic: { select: { id: true, name: true } }, members: { where: { userId: user.userId }, select: { role: true } } },
      }),
    );
    if (!channel) throw new NotFoundException('کانال یافت نشد');
    return channel;
  }
}
