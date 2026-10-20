import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { CrmAssistantService } from './crm-assistant.service';

describe('CrmAssistantService deterministic performance comparison', () => {
  it('routes the default task-list suggestion to the task MCP tool', async () => {
    const mcp = {
      listFor: jest.fn().mockReturnValue([{ name: 'search_tasks' }]),
      call: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue({ data: [], meta: { total: 0 } }),
    };
    const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new CrmAssistantService(config as never, mcp as never, audit as never);

    await service.ask({ message: 'آخرین ۱۰ کار ثبت‌شده را نشان بده.', history: [] }, currentUser());

    expect(mcp.call).toHaveBeenCalledWith('search_tasks', { search: null, limit: 10 }, expect.anything());
    expect(config.get).not.toHaveBeenCalled();
  });

  it.each([
    'لیست فرصت های پرتو داچک رو بده',
    'فهرست فرصت‌های شرکت پرتو داچک را بده',
    'فرصت‌های مربوط به شرکت پرتو داچک را نمایش بده',
    'فرصت‌های فروش برای پرتو داچک رو نشان بده',
  ])('passes the company filter from opportunity-list wording to MCP search: %s', async (message) => {
    const opportunityResult = { data: [{ id: 'opportunity-1', title: 'خرید توکن فایدو', company: 'پرتو داچک' }], meta: { total: 1 } };
    const mcp = {
      listFor: jest.fn().mockReturnValue([{ name: 'search_opportunities' }]),
      call: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(opportunityResult),
    };
    const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new CrmAssistantService(config as never, mcp as never, audit as never);

    const result = await service.ask({ message, history: [] }, currentUser());

    expect(mcp.call).toHaveBeenCalledWith('search_opportunities', { search: 'پرتو داچک', limit: 10 }, expect.anything());
    expect(result.answer).toContain('فرصت‌های فروش مرتبط با «پرتو داچک»');
    expect(config.get).not.toHaveBeenCalled();
  });

  it('returns the requested recent company list as structured MCP data without an LLM provider', async () => {
    const companyResult = {
      data: Array.from({ length: 10 }, (_, index) => ({ id: `company-${index}`, name: `شرکت ${index + 1}`, status: 'ACTIVE' })),
      meta: { total: 25, limit: 10 },
    };
    const mcp = {
      listFor: jest.fn().mockReturnValue([{ name: 'search_companies' }]),
      call: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(companyResult),
    };
    const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new CrmAssistantService(config as never, mcp as never, audit as never);

    const result = await service.ask({ message: 'لیست ده شرکت آخر سیستم رو بده', history: [] }, currentUser());

    expect(mcp.call).toHaveBeenCalledWith('search_companies', { search: null, limit: 10 }, expect.anything());
    expect(result.answer).toContain('آخرین ۱۰ شرکت');
    expect((result as any).toolData).toEqual([{ tool: 'search_companies', data: companyResult }]);
    expect(config.get).not.toHaveBeenCalled();
  });

  it('finds meetings by organizer or assignee name instead of searching meeting titles', async () => {
    const userId = '22222222-2222-4222-8222-222222222222';
    const mcp = {
      listFor: jest.fn().mockReturnValue([{ name: 'search_meeting_users' }, { name: 'get_user_meetings' }]),
      call: jest.fn<(...args: any[]) => Promise<any>>(async (name: string, args: Record<string, unknown>) => {
        if (name === 'search_meeting_users') {
          expect(args.search).toBe('اسدی');
          return { data: [{ id: userId, fullName: 'مرتضی اسدی', teamName: 'فنی نشانه' }] };
        }
        expect(args.userId).toBe(userId);
        return { data: [{ title: 'دیدار دوستانه', startAt: '2026-10-04T05:00:00.000Z', company: 'رهسا', status: 'SCHEDULED', involvement: 'ASSIGNEE' }] };
      }),
    };
    const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new CrmAssistantService(config as never, mcp as never, audit as never);

    const result = await service.ask({ message: 'جلسات آقای اسدی رو بهم میگی؟', history: [] }, currentUser());

    expect(result.answer).toContain('جلسات مرتضی اسدی');
    expect(result.answer).toContain('دیدار دوستانه');
    expect(result.answer).toContain('مسئول');
    expect(result.toolsUsed).toEqual(['search_meeting_users', 'get_user_meetings']);
    expect(config.get).not.toHaveBeenCalled();
  });

  it('answers a meeting-participants follow-up through MCP tools without an LLM provider', async () => {
    const meetingId = '11111111-1111-4111-8111-111111111111';
    const mcp = {
      listFor: jest.fn().mockReturnValue([{ name: 'search_meetings' }, { name: 'get_meeting_details' }]),
      call: jest.fn<(...args: any[]) => Promise<any>>(async (name: string) => name === 'search_meetings'
        ? { data: [{ id: meetingId, title: 'دیدار دوستانه', startAt: '2026-10-04T05:00:00.000Z' }] }
        : {
          id: meetingId,
          title: 'دیدار دوستانه',
          organizer: { name: 'فرزاد نوروزی فرد' },
          assignees: [{ name: 'مهتاب امیری' }],
          attendees: [{ name: 'مخاطب نمونه', title: 'مدیرعامل' }],
        }),
    };
    const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new CrmAssistantService(config as never, mcp as never, audit as never);

    const result = await service.ask({
      message: 'شرکت کنندگان جلسه چه کسانی هستن؟',
      history: [{
        role: 'assistant',
        content: '| تاریخ و زمان شروع (UTC) | عنوان جلسه | شرکت | برگزارکننده | وضعیت |\n|---|---|---|---|---|\n| 2026-10-04 | دیدار دوستانه | رهسا | فرزاد نوروزی فرد | SCHEDULED |',
      }],
    }, currentUser());

    expect(result.answer).toContain('شرکت‌کنندگان جلسه دیدار دوستانه');
    expect(result.answer).toContain('فرزاد نوروزی فرد');
    expect(result.answer).toContain('مخاطب نمونه');
    expect(result.toolsUsed).toEqual(['search_meetings', 'get_meeting_details']);
    expect(config.get).not.toHaveBeenCalled();
  });

  it('creates a confirmation proposal for a task without calling an LLM provider', async () => {
    const proposal = { token: 'signed-token', actionType: 'task.create', title: 'ایجاد کار' };
    const mcp = {
      listFor: jest.fn().mockReturnValue([
        { name: 'search_assignment_users' },
        { name: 'propose_create_task' },
      ]),
      call: jest.fn<(...args: any[]) => Promise<any>>(async (name: string, args: Record<string, unknown>) => {
        if (name === 'search_assignment_users') {
          return { data: [{ id: 'farzad-id', fullName: 'فرزاد نوروزی فرد', teamName: 'فنی نشانه' }] };
        }
        expect(args).toMatchObject({ title: 'تهیه مستندات sso', assignedToId: 'farzad-id' });
        return proposal;
      }),
    };
    const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new CrmAssistantService(config as never, mcp as never, audit as never);

    const result = await service.ask({
      message: 'میتونی یک کار جدید برای فرزاد نوروزی فرد برای تهیه مستندات sso بسازی؟',
      history: [],
    }, currentUser());

    expect(result.answer).toContain('پیش‌نویس کار «تهیه مستندات sso»');
    expect(result.pendingActions).toEqual([proposal]);
    expect(result.toolsUsed).toEqual(['search_assignment_users', 'propose_create_task']);
    expect(config.get).not.toHaveBeenCalled();
  });

  it('uses conversation context and internal reports without calling an LLM provider', async () => {
    const reports: Record<string, Record<string, unknown>> = {
      'user-mahtab': performanceReport('مهتاب امیری', 16, 3, 19, 118, 100),
      'user-peer': performanceReport('کارشناس هم‌تیم', 10, 1, 10, 80, 75),
    };
    const mcp = {
      listFor: jest.fn().mockReturnValue([
        { name: 'search_report_users' },
        { name: 'get_sales_rep_performance' },
      ]),
      call: jest.fn<(...args: any[]) => Promise<any>>(async (name: string, args: Record<string, string>) => {
        if (name === 'search_report_users') {
          return {
            data: [
              { id: 'user-mahtab', fullName: 'مهتاب امیری', teamId: 'sales', teamName: 'فروش سازمانی' },
              { id: 'user-peer', fullName: 'کارشناس هم‌تیم', teamId: 'sales', teamName: 'فروش سازمانی' },
            ],
          };
        }
        return reports[args.userId];
      }),
    };
    const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const service = new CrmAssistantService(config as never, mcp as never, audit as never);

    const result = await service.ask({
      message: 'میتونی با کارشناس های فروش دیگه مقایسش کنی؟',
      history: [
        { role: 'user', content: 'یک گزارش از عملکرد مهتاب بده' },
        { role: 'assistant', content: '### گزارش عملکرد مهتاب امیری\nبازه گزارش: ۳۰ روز اخیر' },
      ],
    }, currentUser());

    expect(result.answer).toContain('مقایسه عملکرد مهتاب امیری');
    expect(result.answer).toContain('کارشناس هم‌تیم');
    expect(result.answer).toContain('رتبه');
    expect(result.toolsUsed).toEqual(['search_report_users', 'get_sales_rep_performance']);
    expect(config.get).not.toHaveBeenCalled();
  });
});

describe('CrmAssistantService model intelligence and provider handling', () => {
  afterEach(() => { jest.restoreAllMocks(); });

  it('answers a general question directly without requiring a tool call', async () => {
    const { service, mcp } = modelService([{ name: 'search_companies', description: 'search', inputSchema: {} }]);
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(providerResponse({ output_text: 'اصل BATNA را توضیح می‌دهم.' }));

    const result = await service.ask({ message: 'مفهوم BATNA در مذاکره چیست؟', history: [] }, currentUser());

    expect(result.answer).toContain('BATNA');
    expect(mcp.call).not.toHaveBeenCalled();
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request.tool_choice).toBe('auto');
    expect(request.instructions).toContain('دانش عمومی و استدلال');
    expect(request.instructions).not.toContain('فقط بر اساس خروجی ابزارها پاسخ دهید');
  });

  it('uses an authorized CRM tool for current facts and returns the grounded answer', async () => {
    const definition = { name: 'search_opportunities', description: 'search', inputSchema: {} };
    const { service, mcp } = modelService([definition]);
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(providerResponse({ output: [{ type: 'function_call', name: definition.name, call_id: 'call-1', arguments: '{"search":"پرتو","limit":10}' }] }))
      .mockResolvedValueOnce(providerResponse({ output_text: 'طبق داده CRM، یک فرصت فعال وجود دارد.' }));
    mcp.call.mockResolvedValue({ data: [{ title: 'تمدید قرارداد', status: 'ACTIVE' }] });

    const result = await service.ask({ message: 'فرصت‌های فعلی پرتو چیست؟', history: [] }, currentUser());

    expect(mcp.call).toHaveBeenCalledWith('search_opportunities', { search: 'پرتو', limit: 10 }, expect.anything());
    expect(result.answer).toContain('طبق داده CRM');
    expect(result.toolsUsed).toEqual(['search_opportunities']);
  });

  it('routes performance improvement questions through model reasoning instead of the report-only shortcut', async () => {
    const definition = { name: 'get_sales_rep_performance', description: 'performance', inputSchema: {} };
    const unrelatedDefinition = { name: 'search_companies', description: 'companies', inputSchema: {} };
    const { service, mcp } = modelService([definition, unrelatedDefinition]);
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(providerResponse({
      output_text: 'نرخ تبدیل ۴٪ با وجود ۲۴ فرصت فعال نشان می‌دهد اولویت باید بر بازبینی فرصت‌ها و ثبت پیگیری باشد.',
    }));
    mcp.call.mockResolvedValue({
      ...performanceReport('مهتاب امیری', 29, 1, 4, 163, 0),
      internalLargeField: 'must-not-reach-the-model',
    });

    const result = await service.ask({
      message: 'میتونی عملکرد مهتاب رو بگی چطوری بهتر میشه؟',
      history: [],
    }, currentUser());

    expect(mcp.call).toHaveBeenCalledWith('get_sales_rep_performance', expect.objectContaining({ userName: expect.stringContaining('مهتاب') }), expect.anything());
    const firstRequest = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(firstRequest.tools).toEqual([]);
    expect(firstRequest.instructions).toContain('شما تحلیلگر فروش هستید');
    expect(firstRequest.instructions).not.toContain('ابزارهای propose');
    expect(firstRequest.input).toEqual(expect.arrayContaining([
      expect.objectContaining({ content: expect.stringContaining('authorizedCrmPerformanceData') }),
    ]));
    expect(JSON.stringify(firstRequest)).not.toContain('must-not-reach-the-model');
    expect(result.answer).toContain('نرخ تبدیل ۴٪');
    expect(result.toolsUsed).toEqual(['get_sales_rep_performance']);
  });

  it('falls back to a useful grounded performance analysis when the model provider is unavailable', async () => {
    immediateRetryTimers();
    const definition = { name: 'get_sales_rep_performance', description: 'performance', inputSchema: {} };
    const { service, mcp } = modelService([definition]);
    jest.spyOn(global, 'fetch').mockResolvedValue(providerError(503, 'server_error', 'upstream_unavailable', 'private provider detail'));
    mcp.call.mockResolvedValue({
      period: { startDate: '2026-09-20', endDate: '2026-10-20' },
      employee: { fullName: 'مهتاب امیری' },
      sales: {
        companiesCreated: 5,
        opportunities: { total: 29, active: 24, won: 1, lost: 4 },
        pipeline: { conversionRate: 4 },
      },
      activity: { total: 163 },
      meetings: { createdCount: 4, employee: { executionRate: 75 } },
      tasks: { assigned: { total: 0, completed: 0, incomplete: 0 }, employee: { onTimeCompletionRate: 0 } },
    });

    const result = await service.ask({
      message: 'میتونی عملکرد مهتاب رو بگی چطوری بهتر میشه؟',
      history: [],
    }, currentUser());

    expect(result.answer).toContain('تحلیل عملکرد مهتاب امیری');
    expect(result.answer).toContain('نرخ تبدیل ۴٪');
    expect(result.answer).toContain('صفر بودن کارهای محول‌شده');
    expect(result.toolsUsed).toEqual(['get_sales_rep_performance']);
  });

  it('uses an OpenAI-compatible chat-completions proxy when configured', async () => {
    const { service } = modelService([], {
      LLM_API_KEY: 'proxy-api-key',
      LLM_API_MODE: 'chat_completions',
      LLM_BASE_URL: 'http://10.10.20.123:20128/v1/',
      LLM_MODEL: 'ps/poolside/laguna-s-2.1',
      LLM_TIMEOUT_MS: 120000,
      OPENAI_API_KEY: '',
    });
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(providerResponse({
      choices: [{ message: { content: 'پاسخ مدل پروکسی' } }],
    }));

    const result = await service.ask({ message: 'سلام', history: [] }, currentUser());

    expect(fetchMock.mock.calls[0][0]).toBe('http://10.10.20.123:20128/v1/chat/completions');
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request).toMatchObject({
      model: 'ps/poolside/laguna-s-2.1',
      stream: false,
      messages: [
        expect.objectContaining({ role: 'system' }),
        { role: 'user', content: 'سلام' },
      ],
    });
    expect(request).not.toHaveProperty('tools');
    expect(request).not.toHaveProperty('tool_choice');
    expect(request).not.toHaveProperty('parallel_tool_calls');
    expect(result.answer).toBe('پاسخ مدل پروکسی');
  });

  it('round-trips chat-completions tool calls through the existing MCP gateway', async () => {
    const definition = { name: 'search_tasks', description: 'search', inputSchema: { type: 'object' } };
    const { service, mcp } = modelService([definition], {
      LLM_API_KEY: 'proxy-api-key',
      LLM_API_MODE: 'chat_completions',
      OPENAI_API_KEY: '',
    });
    const fetchMock = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(providerResponse({
        choices: [{ message: { content: null, tool_calls: [{
          id: 'call-1',
          type: 'function',
          function: { name: definition.name, arguments: '{"search":"پیگیری","limit":10}' },
        }] } }],
      }))
      .mockResolvedValueOnce(providerResponse({ choices: [{ message: { content: 'یک کار باز پیدا شد.' } }] }));
    mcp.call.mockResolvedValue({ data: [{ title: 'پیگیری' }] });

    const result = await service.ask({ message: 'کارهای پیگیری را پیدا کن', history: [] }, currentUser());

    expect(mcp.call).toHaveBeenCalledWith('search_tasks', { search: 'پیگیری', limit: 10 }, expect.anything());
    const secondRequest = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    const firstRequest = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(firstRequest.tools[0].function).not.toHaveProperty('strict');
    expect(firstRequest).not.toHaveProperty('parallel_tool_calls');
    expect(secondRequest.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: 'assistant', tool_calls: [expect.objectContaining({ id: 'call-1' })] }),
      expect.objectContaining({ role: 'tool', tool_call_id: 'call-1' }),
    ]));
    expect(result.answer).toContain('یک کار باز');
  });

  it('combines authorized CRM facts with model reasoning for a hybrid recommendation', async () => {
    const definition = { name: 'search_meetings', description: 'search', inputSchema: {} };
    const { service, mcp } = modelService([definition]);
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(providerResponse({ output: [{ type: 'function_call', name: definition.name, call_id: 'call-1', arguments: '{"search":"مشتری الف","limit":10}' }] }))
      .mockResolvedValueOnce(providerResponse({ output_text: 'واقعیت CRM: دو جلسه برگزار شده است. تحلیل: جلسه بعدی را روی تصمیم‌گیر اقتصادی متمرکز کنید.' }));
    mcp.call.mockResolvedValue({ data: [{ title: 'نیازسنجی' }, { title: 'دمو' }] });

    const result = await service.ask({ message: 'با توجه به جلسات مشتری الف چه راهبرد فروشی پیشنهاد می‌کنی؟', history: [] }, currentUser());

    expect(mcp.call).toHaveBeenCalledTimes(1);
    expect(result.answer).toContain('تحلیل:');
    expect(result.answer).toContain('تصمیم‌گیر اقتصادی');
  });

  it('keeps Collaboration read-only while allowing general knowledge', async () => {
    const definitions = [
      { name: 'search_tasks', description: 'search', inputSchema: {} },
      { name: 'propose_create_task', description: 'propose', inputSchema: {} },
    ];
    const { service, mcp } = modelService(definitions);
    mcp.isAction.mockImplementation((name: string) => name.startsWith('propose_'));
    const assertAccess = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(providerResponse({ output_text: 'برای مدیریت تعارض، ابتدا مسئله را از موضع افراد جدا کنید.' }));

    const result = await service.ask(
      { message: 'برای مدیریت تعارض تیمی چه پیشنهادی داری؟', history: [] },
      currentUser(),
      { context: { recentMessages: [] }, assertAccess },
    );

    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request.tools.map((tool: { name: string }) => tool.name)).toEqual(['search_tasks']);
    expect(request.instructions).toContain('دانش عمومی و استدلال');
    expect(request.instructions).toContain('فقط خواندنی');
    expect(assertAccess).toHaveBeenCalledTimes(1);
    expect(mcp.call).not.toHaveBeenCalled();
    expect(result.answer).toContain('مدیریت تعارض');
  });

  it('grounds Collaboration CRM facts with a read-only tool and revalidates access', async () => {
    const definition = { name: 'search_tasks', description: 'search', inputSchema: {} };
    const { service, mcp } = modelService([definition]);
    const assertAccess = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(providerResponse({ output: [{ type: 'function_call', name: definition.name, call_id: 'call-1', arguments: '{"search":"پیگیری","limit":10}' }] }))
      .mockResolvedValueOnce(providerResponse({ output_text: 'طبق داده مجاز CRM، یک کار پیگیری باز است.' }));
    mcp.call.mockResolvedValue({ data: [{ title: 'پیگیری', status: 'OPEN' }] });

    const result = await service.ask(
      { message: 'وضعیت کار پیگیری چیست؟', history: [] },
      currentUser(),
      { context: { recentMessages: [] }, assertAccess },
    );

    expect(mcp.call).toHaveBeenCalledWith('search_tasks', { search: 'پیگیری', limit: 10 }, expect.anything());
    expect(assertAccess).toHaveBeenCalledTimes(2);
    expect(result.answer).toContain('طبق داده مجاز CRM');
  });

  it.each([400, 401, 404])('does not retry non-transient provider status %s', async (status) => {
    const { service } = modelService([]);
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(providerError(status, 'invalid_request_error', 'bad_parameter', 'private provider detail'));

    await expect(service.ask({ message: 'یک متن عمومی بنویس', history: [] }, currentUser()))
      .rejects.toMatchObject({ response: expect.objectContaining({ message: 'در پردازش درخواست توسط سرویس هوش مصنوعی خطایی رخ داد' }) });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([408, 429, 500, 502, 503, 504])('retries transient provider status %s with a bounded attempt count', async (status) => {
    immediateRetryTimers();
    const { service } = modelService([]);
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async () => providerError(status, 'server_error', 'temporarily_unavailable', 'private provider detail'));

    await expect(service.ask({ message: 'یک متن عمومی بنویس', history: [] }, currentUser()))
      .rejects.toMatchObject({ response: expect.objectContaining({ message: expect.stringContaining(status === 429 ? 'پرترافیک' : 'موقتاً در دسترس نیست') }) });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries network failures without logging exception messages or request content', async () => {
    immediateRetryTimers();
    const { service } = modelService([]);
    const logger = { warn: jest.fn() };
    (service as any).logger = logger;
    const fetchMock = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('secret-url?token=api-key'));

    await expect(service.ask({ message: 'private CRM prompt', history: [] }, currentUser())).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const logs = logger.warn.mock.calls.flat().join(' ');
    expect(logs).toContain('errorName=Error');
    expect(logs).not.toContain('secret-url');
    expect(logs).not.toContain('private CRM prompt');
    expect(logs).not.toContain('api-key');
  });

  it('logs only sanitized provider metadata and never the raw provider message', async () => {
    const { service } = modelService([]);
    const logger = { warn: jest.fn() };
    (service as any).logger = logger;
    jest.spyOn(global, 'fetch').mockResolvedValue(providerError(400, 'invalid_request_error', 'unsupported_model', 'prompt and CRM data echoed here'));

    await expect(service.ask({ message: 'sensitive prompt', history: [] }, currentUser())).rejects.toBeDefined();
    const logs = logger.warn.mock.calls.flat().join(' ');
    expect(logs).toContain('status=400');
    expect(logs).toContain('requestId=req-safe-123');
    expect(logs).toContain('errorType=invalid_request_error');
    expect(logs).toContain('errorCode=unsupported_model');
    expect(logs).not.toContain('prompt and CRM data');
    expect(logs).not.toContain('sensitive prompt');
  });

  it('detects bounded tool-loop exhaustion instead of returning an empty answer', async () => {
    const definition = { name: 'search_tasks', description: 'search', inputSchema: {} };
    const { service, mcp } = modelService([definition]);
    jest.spyOn(global, 'fetch').mockImplementation(async () => providerResponse({ output: [{ type: 'function_call', name: definition.name, call_id: 'call', arguments: '{"search":null,"limit":10}' }] }));
    mcp.call.mockResolvedValue({ data: [] });

    await expect(service.ask({ message: 'درخواست پیچیده', history: [] }, currentUser()))
      .rejects.toMatchObject({ response: expect.objectContaining({ message: expect.stringContaining('مراحل بیشتری') }) });
    expect(mcp.call).toHaveBeenCalledTimes(4);
  });

  it('returns recoverable domain outcomes to the model but preserves authorization failures', async () => {
    const definition = { name: 'search_tasks', description: 'search', inputSchema: {} };
    const first = providerResponse({ output: [{ type: 'function_call', name: definition.name, call_id: 'call-1', arguments: '{"search":"ناموجود","limit":10}' }] });
    const { service, mcp } = modelService([definition]);
    const fetchMock = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(providerResponse({ output_text: 'موردی در محدوده دسترسی پیدا نشد.' }));
    mcp.call.mockRejectedValueOnce(new NotFoundException('internal entity detail'));

    const result = await service.ask({ message: 'وضعیت کار ناموجود چیست؟', history: [] }, currentUser());

    const secondRequest = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(secondRequest.input).toEqual(expect.arrayContaining([
      expect.objectContaining({ output: expect.stringContaining('NOT_FOUND') }),
    ]));
    expect(result.answer).toContain('پیدا نشد');

    jest.restoreAllMocks();
    const secured = modelService([definition]);
    jest.spyOn(global, 'fetch').mockResolvedValue(providerResponse({ output: [{ type: 'function_call', name: definition.name, call_id: 'call-2', arguments: '{"search":null,"limit":10}' }] }));
    secured.mcp.call.mockRejectedValue(new ForbiddenException('private authorization detail'));
    await expect(secured.service.ask({ message: 'همه کارها را بده', history: [] }, currentUser())).rejects.toBeInstanceOf(ForbiddenException);
  });
});

function currentUser() {
  return {
    userId: 'admin',
    membershipId: 'membership',
    organizationId: 'organization',
    tenantContext: {
      tenantId: 'organization',
      organizationId: 'organization',
      userId: 'admin',
      membershipId: 'membership',
      membershipStatus: 'active',
      resolutionSource: 'token-session',
      tenantRole: 'ADMIN',
      permissions: ['report:view', 'task:create', 'meeting:view'],
      platformAdmin: false,
    },
  } as never;
}

function performanceReport(
  fullName: string,
  opportunities: number,
  won: number,
  conversion: number,
  activities: number,
  taskRate: number,
) {
  return {
    period: { startDate: '2026-08-28T00:00:00.000Z', endDate: '2026-09-27T00:00:00.000Z' },
    employee: { fullName },
    sales: { opportunities: { total: opportunities, won }, pipeline: { conversionRate: conversion } },
    activity: { total: activities },
    tasks: { employee: { onTimeCompletionRate: taskRate } },
  };
}

function modelService(
  definitions: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>,
  overrides: Record<string, string | number> = {},
) {
  const configValues: Record<string, string | number> = {
    OPENAI_API_KEY: 'test-api-key',
    OPENAI_BASE_URL: 'https://provider.example/v1',
    OPENAI_MODEL: 'test-model',
    ...overrides,
  };
  const config = { get: jest.fn((key: string, fallback?: string | number) => configValues[key] ?? fallback) };
  const mcp = {
    listFor: jest.fn().mockReturnValue(definitions),
    isAction: jest.fn<(name: string) => boolean>().mockReturnValue(false),
    call: jest.fn<(...args: any[]) => Promise<any>>(),
  };
  const audit = { recordTenantEvent: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };
  return { service: new CrmAssistantService(config as never, mcp as never, audit as never), mcp, audit };
}

function providerResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify({ id: 'response-id', ...body }), {
    status,
    headers: { 'content-type': 'application/json', 'x-request-id': 'req-safe-123' },
  });
}

function providerError(status: number, type: string, code: string, message: string) {
  return new Response(JSON.stringify({ error: { type, code, message } }), {
    status,
    headers: { 'content-type': 'application/json', 'x-request-id': 'req-safe-123' },
  });
}

function immediateRetryTimers() {
  jest.spyOn(global, 'setTimeout').mockImplementation(((callback: (...args: any[]) => void) => {
    callback();
    return 0 as any;
  }) as typeof setTimeout);
}
