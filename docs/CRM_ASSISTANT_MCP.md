# CRM assistant MCP architecture

The CRM assistant and the authenticated MCP endpoint share
`CrmMcpGatewayService` as their only tool gateway.

## Request flow

1. The authenticated request resolves the active tenant and membership.
2. The gateway exposes only tools allowed by the user's effective permissions.
3. Read tools call the existing tenant-aware application services.
4. Write tools create a signed, five-minute confirmation proposal only.
5. A write is executed only through `/api/assistant/actions/confirm` by the same
   user, membership, and organization that created the proposal.

The MCP endpoint is `/api/mcp` and requires the normal CRM bearer token. Tool
schemas and MCP read/destructive annotations are generated from the same
definitions supplied to the chat reasoning model.

## Why the standalone MCP package is not run directly

The reviewed standalone package authenticates with one shared CRM account and
does not carry the current web user's tenant context through MCP requests. It is
therefore used as an architecture and coverage reference, not as a privileged
sidecar. Running it directly would weaken tenant isolation and audit identity.

MCP provides data and actions; it is not a language model. An LLM provider is
still required to select tools and compose the Persian answer. Provider keys
remain server-side.
