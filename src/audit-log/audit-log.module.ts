import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller';
import { AuditRequestContextMiddleware } from './audit-request-context.middleware';
import { AuditRequestContextService } from './audit-request-context.service';
import { AuditLogService } from './audit-log.service';

@Global()
@Module({
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    AuditRequestContextService,
    AuditRequestContextMiddleware,
  ],
  exports: [
    AuditLogService,
    AuditRequestContextService,
  ],
})
export class AuditLogModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditRequestContextMiddleware).forRoutes('*');
  }
}