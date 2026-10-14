# Customer Request Stage 4

Stage 4 adds an internal operational layer to customer requests without changing the customer-visible request lifecycle or replacing any CRM domain model.

## Architecture

- `CustomerRequest` stores priority, triage state, optional internal assignee/team, routing recommendation, and an optimistic `revision`.
- `CustomerRequestOperationalHistory` is internal-only and records assignment, priority, routing, and link actions. Customer-visible progress remains in `CustomerRequestStatusHistory`.
- `CustomerRequestCrmLink` uses typed foreign keys for Task, Technical Document, and Opportunity. A database check constraint requires exactly one target matching `targetType`.
- Destination records are validated and created through their existing services. Company access, tenant scope, and destination permissions remain authoritative.
- `CustomerRequestCrmCreationAttempt` reserves an idempotency key before destination creation and stores the created target ID before linking it.

Request and CRM statuses are intentionally independent. Stage 4 does not automatically translate Task, Technical Center, or Opportunity status changes into customer-visible transitions.

## Creation recovery

Creating a destination record and linking it cannot be one database transaction because existing domain services own their own transactions. The attempt row therefore records `PENDING`, `TARGET_CREATED`, `COMPLETED`, or `FAILED`.

If link persistence fails after the target ID is stored, the API returns `CUSTOMER_REQUEST_LINK_RECOVERY_REQUIRED`. Retrying with the same idempotency key repairs the link without creating another target. A process crash in the narrow interval after destination creation but before storing its ID requires administrative reconciliation; the attempt remains `PENDING` and the API refuses duplicate creation.

## Migration and rollback

Migration `20261013100000_customer_request_triage` is additive: it creates enums/tables/indexes and adds nullable or defaulted columns. Existing requests receive `NORMAL`, `UNTRIAGED`, and revision `1`.

Before production deployment:

1. Back up the database and run the repository migration preflight against a production-like copy.
2. Verify no custom permission row conflicts with the four new permission actions.
3. Apply with the normal Prisma deployment command and deploy backend before frontend.

Rollback is application-first: redeploy the previous backend/frontend while leaving additive columns/tables in place. Dropping the Stage 4 schema is intentionally not automated because it would delete operational history and link metadata. A destructive schema rollback must be separately reviewed and backed up.

No migration was applied to a shared or production database during implementation.
