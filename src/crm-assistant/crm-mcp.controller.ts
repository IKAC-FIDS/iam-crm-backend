import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import * as z from 'zod/v4';
import { AnyPermission } from '../common/decorators/permissions.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CrmAssistantToolsService } from './crm-assistant-tools.service';

@Controller('mcp')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmMcpController {
  constructor(private readonly tools: CrmAssistantToolsService) {}

  @Post()
  @AnyPermission('company:view', 'opportunity:view', 'task:view', 'meeting:view')
  async handle(@Req() request: Request, @Res() response: Response) {
    const user = request.user as CurrentUserPayload;
    const server = new McpServer({ name: 'iam-crm-readonly', version: '1.0.0' });
    const inputSchema = {
      search: z.string().max(200).nullable().describe('عبارت جست‌وجو یا null'),
      limit: z.number().int().min(1).max(20).nullable().describe('حداکثر تعداد نتیجه یا null'),
    };

    for (const definition of this.tools.listFor(user)) {
      server.registerTool(
        definition.name,
        { description: definition.description, inputSchema },
        async (args) => ({
          content: [{
            type: 'text' as const,
            text: JSON.stringify(await this.tools.call(definition.name, args, user)),
          }],
        }),
      );
    }

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } finally {
      response.on('close', () => {
        void transport.close();
        void server.close();
      });
    }
  }
}
