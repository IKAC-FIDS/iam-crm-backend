import { Injectable } from '@nestjs/common';

export type DeterministicAssistantHandler =
  | 'entity-list'
  | 'task-proposal'
  | 'user-meetings'
  | 'performance-report';

export type AssistantRoutingDecision =
  | { mode: 'deterministic'; handler: DeterministicAssistantHandler; reason: string }
  | { mode: 'llm'; reason: string };

export type AssistantRoutingContext = {
  collaboration: boolean;
  historyLength: number;
  message: string;
};

/**
 * Small, deliberately conservative allowlist for requests that can be handled
 * completely without model inference. Everything uncertain remains LLM-first.
 */
@Injectable()
export class CrmAssistantIntentRouter {
  route(context: AssistantRoutingContext): AssistantRoutingDecision {
    const message = context.message.normalize('NFKC').replace(/\s+/gu, ' ').trim();

    if (context.collaboration) return { mode: 'llm', reason: 'collaboration-context-required' };
    if (context.historyLength > 0) return { mode: 'llm', reason: 'conversation-context-required' };
    if (this.requiresReasoning(message)) return { mode: 'llm', reason: 'reasoning-or-analysis-requested' };
    if (this.hasMultipleEntityIntents(message)) return { mode: 'llm', reason: 'multiple-entity-intents' };

    if (this.isCompleteTaskProposal(message)) {
      return { mode: 'deterministic', handler: 'task-proposal', reason: 'complete-supported-task-proposal' };
    }
    if (this.isNamedUserMeetingList(message)) {
      return { mode: 'deterministic', handler: 'user-meetings', reason: 'named-user-meeting-list' };
    }
    if (this.isSimpleEntityList(message)) {
      return { mode: 'deterministic', handler: 'entity-list', reason: 'single-entity-list' };
    }
    if (this.isNamedPerformanceReport(message)) {
      return { mode: 'deterministic', handler: 'performance-report', reason: 'named-user-factual-report' };
    }

    return { mode: 'llm', reason: 'not-in-deterministic-allowlist' };
  }

  private requiresReasoning(message: string) {
    return /(تحلیل|مقایسه|نسبت\s+به|پیشنهاد|راهکار|توصیه|چرا|علت|ریسک|اولویت(?:‌|\s)*بندی|پیش(?:‌|\s)*بینی|نقاط?\s*(?:ضعف|قوت)|بهتر|بهبود|خلاصه|توضیح|بدون\s+(?:جلسه|پیگیری|اقدام)|کدام.*چرا)/u.test(message)
      || /(?:هم|همچنین|و)\s+(?:تحلیل|خلاصه|مقایسه|توضیح|پیشنهاد)/u.test(message)
      || /(فعال|برنده|از\s*دست\s*رفته|عقب(?:‌|\s)*افتاده|امروز|این\s*هفته|اولویت\s+(?:بالا|زیاد)|مالک|مسئول).*(?:لیست|فهرست|بده|نمایش|نشان)|(?:لیست|فهرست|نمایش|نشان).*(فعال|برنده|از\s*دست\s*رفته|عقب(?:‌|\s)*افتاده|امروز|این\s*هفته|اولویت\s+(?:بالا|زیاد)|مالک|مسئول)/u.test(message);
  }

  private hasMultipleEntityIntents(message: string) {
    const opportunityTarget = /فرصت(?:‌|\s)*(?:ها|های)/u.test(message);
    const companyTarget = /شرکت(?:‌|\s)*ها/u.test(message)
      || (!opportunityTarget && /(?:لیست|فهرست|آخر(?:ین)?|اخیر).{0,20}شرکت/u.test(message));
    const entityTargets = [
      companyTarget,
      opportunityTarget,
      /(?:کارها|کارهای|وظایف|تسک(?:‌|\s)*(?:ها|های))/u,
      /جلس(?:ات|ه(?:‌|\s)*های)/u,
      /(?:افراد|مخاطب(?:‌|\s)*(?:ها|های))/u,
      /فعالیت(?:‌|\s)*(?:ها|های)/u,
    ];
    return entityTargets.filter((target) => typeof target === 'boolean' ? target : target.test(message)).length > 1;
  }

  private isSimpleEntityList(message: string) {
    return /(لیست|فهرست|آخر(?:ین)?|اخیر|(?:بده|نمایش بده|نشان بده))/u.test(message)
      && /(شرکت|فرصت|(?:کار(?=\s|$)|کارها|کارهای|وظایف|تسک)|جلس|افراد|مخاطب|فعالیت)/u.test(message);
  }

  private isNamedUserMeetingList(message: string) {
    return /(?:جلسات|جلسه‌های)\s+(?:آقای|خانم)?\s*\S.+?(?:\s+(?:رو|را|بهم|برایم|بگو|میگی|می‌گی)|[؟?]|$)/u.test(message);
  }

  private isCompleteTaskProposal(message: string) {
    return /(?:کار|وظیفه|تسک)/u.test(message)
      && /(?:بساز|بسازی|ایجاد|ثبت)/u.test(message)
      && /برای\s+.+?\s+برای\s+.+?(?:بساز|بسازی|ایجاد|ثبت)/u.test(message);
  }

  private isNamedPerformanceReport(message: string) {
    return /(عملکرد|کارنامه|ارزیابی)\s+(?!کل\s*تیم|تیم\s*فروش|تیم(?:\s|$))\S+/u.test(message);
  }
}
