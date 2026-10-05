-- Existing rows retain USER identity; existing tenant RLS policies remain in force.
CREATE TYPE "ConversationSenderType" AS ENUM ('USER', 'ASSISTANT');
CREATE TYPE "ConversationBotStatus" AS ENUM ('PENDING', 'FAILED', 'COMPLETE');
ALTER TABLE "conversation_messages"
  ALTER COLUMN "authorId" DROP NOT NULL,
  ADD COLUMN "senderType" "ConversationSenderType" NOT NULL DEFAULT 'USER',
  ADD COLUMN "botRequestKey" TEXT,
  ADD COLUMN "botStatus" "ConversationBotStatus",
  ADD COLUMN "botResponseToId" TEXT;
CREATE UNIQUE INDEX "conversation_messages_botRequestKey_key" ON "conversation_messages"("botRequestKey");
CREATE UNIQUE INDEX "conversation_messages_botResponseToId_key" ON "conversation_messages"("botResponseToId");
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_sender_check"
  CHECK (("senderType" = 'USER' AND "authorId" IS NOT NULL) OR ("senderType" = 'ASSISTANT' AND "authorId" IS NULL));
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_botResponseToId_fkey"
  FOREIGN KEY ("botResponseToId") REFERENCES "conversation_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
