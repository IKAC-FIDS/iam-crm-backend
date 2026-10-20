import { describe, expect, it } from '@jest/globals';
import { CrmAssistantIntentRouter } from './crm-assistant-intent-router';

describe('CrmAssistantIntentRouter', () => {
  const router = new CrmAssistantIntentRouter();
  const route = (message: string, historyLength = 0) => router.route({ collaboration: false, historyLength, message });

  it.each([
    ['آخرین ۱۰ شرکت را نشان بده', 'entity-list'],
    ['فهرست فرصت‌های شرکت پرتو داچک را بده', 'entity-list'],
    ['جلسات آقای اسدی را بگو', 'user-meetings'],
    ['عملکرد مهتاب امیری را بده', 'performance-report'],
    ['یک کار برای فرزاد نوروزی فرد برای تهیه گزارش بساز', 'task-proposal'],
  ])('allows a complete supported request: %s', (message, handler) => {
    expect(route(message)).toMatchObject({ mode: 'deterministic', handler });
  });

  it.each([
    'شرکت‌های دارای فرصت فعال اما بدون جلسه اخیر را پیدا کن',
    'جلسات اخیر را نشان بده و ریسک فرصت‌ها را تحلیل کن',
    'عملکرد تیم فروش را تحلیل و راهکار بهبود بده',
    'مهتاب را با آتنا مقایسه کن و تفاوت‌ها را توضیح بده',
    'کدام مشتری‌ها را این هفته در اولویت بگذاریم و چرا؟',
    'آخرین فرصت‌ها را بده و ریسک‌ها را خلاصه کن',
    'فرصت‌های فعال را نمایش بده',
    'یک کار جدید بساز',
  ])('routes complex, analytical, or multi-intent requests to the model: %s', (message) => {
    expect(route(message)).toMatchObject({ mode: 'llm' });
  });

  it('routes contextual follow-ups to the model', () => {
    expect(route('شرکت‌کنندگان آن جلسه چه کسانی بودند؟', 2)).toMatchObject({
      mode: 'llm',
      reason: 'conversation-context-required',
    });
  });

  it('keeps collaboration requests model-routed', () => {
    expect(router.route({ collaboration: true, historyLength: 0, message: 'آخرین کارها را بده' }))
      .toMatchObject({ mode: 'llm', reason: 'collaboration-context-required' });
  });
});
