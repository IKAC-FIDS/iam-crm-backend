ALTER TYPE "FileAttachmentEntityType" ADD VALUE 'COLLABORATION_CHANNEL';
ALTER TYPE "FileAttachmentEntityType" ADD VALUE 'CONVERSATION_MESSAGE';
CREATE TYPE "ConversationMessageReferenceType" AS ENUM ('COMPANY', 'OPPORTUNITY', 'TASK', 'MEETING');
CREATE TABLE "conversation_message_references" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "referenceType" "ConversationMessageReferenceType" NOT NULL,
  "referenceId" TEXT NOT NULL,
  "labelSnapshot" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_message_references_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "conversation_message_references_messageId_referenceType_referenceId_key" ON "conversation_message_references"("messageId", "referenceType", "referenceId");
CREATE INDEX "conversation_message_references_organizationId_referenceType_referenceId_idx" ON "conversation_message_references"("organizationId", "referenceType", "referenceId");
CREATE INDEX "conversation_message_references_messageId_idx" ON "conversation_message_references"("messageId");
ALTER TABLE "conversation_message_references" ADD CONSTRAINT "conversation_message_references_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_message_references" ADD CONSTRAINT "conversation_message_references_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "conversation_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_message_references" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversation_message_references" FORCE ROW LEVEL SECURITY;
CREATE POLICY "conversation_message_references_tenant_isolation" ON "conversation_message_references" USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), '')) WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));
