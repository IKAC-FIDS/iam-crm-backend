import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface AuditRequestContext {
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestMethod?: string | null;
  requestPath?: string | null;
}

@Injectable()
export class AuditRequestContextService {
  private readonly storage = new AsyncLocalStorage<AuditRequestContext>();

  run(context: AuditRequestContext, callback: () => void) {
    this.storage.run(context, callback);
  }

  getContext(): AuditRequestContext | undefined {
    return this.storage.getStore();
  }
}