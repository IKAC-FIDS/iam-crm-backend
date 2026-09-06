import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { NotificationCoreService } from "./notification-core.service"

@Module({
  imports: [PrismaModule],
  providers: [NotificationCoreService],
  exports: [NotificationCoreService],
})
export class NotificationCoreModule {}
