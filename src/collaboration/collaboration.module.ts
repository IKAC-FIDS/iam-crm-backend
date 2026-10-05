import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CollaborationAccessService } from './collaboration-access.service';
import { CollaborationController } from './collaboration.controller';
import { CollaborationService } from './collaboration.service';

@Module({ imports: [AuditLogModule], controllers: [CollaborationController], providers: [CollaborationAccessService, CollaborationService], exports: [CollaborationAccessService] })
export class CollaborationModule {}
