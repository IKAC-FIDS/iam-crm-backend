import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import * as z from 'zod/v4';
import { AnyPermission } from '../common/decorators/permissions.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import type { CrmAssistantToolDefinition } from './crm-assistant-tools.service';
import { CrmMcpGatewayService } from './crm-mcp-gateway.service';

@Controller('mcp')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CrmMcpController {
  constructor(private readonly gateway: CrmMcpGatewayService) {}

  @Post()
  @AnyPermission('company:view', 'opportunity:view', 'task:view', 'meeting:view')
  async handle(@Req() request: Request, @Res() response: Response) {
    const user = request.user as CurrentUserPayload;
    const server = new McpServer({ name: 'neshane-crm', version: '2.0.0' });

    for (const definition of this.gateway.listFor(user)) {
      const action = this.gateway.isAction(definition.name);
      server.registerTool(
        definition.name,
        {
          description: definition.description,
          inputSchema: inputShape(definition),
          annotations: {
            readOnlyHint: !action,
            destructiveHint: action,
            idempotentHint: !action,
            openWorldHint: false,
          },
        },
        async (args) => ({
          content: [{
            type: 'text' as const,
            text: JSON.stringify(await this.gateway.call(definition.name, args, user)),
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

function inputShape(definition: CrmAssistantToolDefinition): z.ZodRawShape {
  const schema = definition.inputSchema;
  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = new Set(Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === 'string') : []);
  return Object.fromEntries(Object.entries(properties).map(([name, value]) => {
    const field = jsonSchemaToZod(isRecord(value) ? value : {});
    return [name, required.has(name) ? field : field.optional()];
  }));
}

function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodType {
  const description = typeof schema.description === 'string' ? schema.description : undefined;
  const rawTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
  const nullable = rawTypes.includes('null');
  const type = rawTypes.find((item) => item !== 'null');
  const enumValues = Array.isArray(schema.enum)
    ? schema.enum.filter((item): item is string => typeof item === 'string')
    : [];
  let field: z.ZodType;

  if (enumValues.length) {
    field = z.enum(enumValues as [string, ...string[]]);
  } else if (type === 'integer' || type === 'number') {
    let numberField = z.number();
    if (type === 'integer') numberField = numberField.int();
    if (typeof schema.minimum === 'number') numberField = numberField.min(schema.minimum);
    if (typeof schema.maximum === 'number') numberField = numberField.max(schema.maximum);
    field = numberField;
  } else if (type === 'boolean') {
    field = z.boolean();
  } else if (type === 'array') {
    field = z.array(jsonSchemaToZod(isRecord(schema.items) ? schema.items : {}));
  } else {
    let stringField = z.string();
    if (typeof schema.minLength === 'number') stringField = stringField.min(schema.minLength);
    if (typeof schema.maxLength === 'number') stringField = stringField.max(schema.maxLength);
    field = stringField;
  }

  if (description) field = field.describe(description);
  return nullable ? field.nullable() : field;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
