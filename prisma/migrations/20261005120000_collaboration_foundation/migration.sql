ALTER TYPE "ConversationEntityType" ADD VALUE 'COLLABORATION_CHANNEL';

CREATE TYPE "CollaborationChannelVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "CollaborationChannelMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

ALTER TABLE "users" ADD COLUMN "lastSeenAt" TIMESTAMP(3);

CREATE TABLE "collaboration_topics" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdById" TEXT NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "collaboration_topics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "collaboration_channels" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "visibility" "CollaborationChannelVisibility" NOT NULL DEFAULT 'PUBLIC',
  "createdById" TEXT NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "collaboration_channels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "collaboration_channel_members" (
  "channelId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "CollaborationChannelMemberRole" NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "addedById" TEXT,
  CONSTRAINT "collaboration_channel_members_pkey" PRIMARY KEY ("channelId", "userId")
);

CREATE UNIQUE INDEX "collaboration_topics_organizationId_name_key" ON "collaboration_topics"("organizationId", "name");
CREATE INDEX "collaboration_topics_organizationId_archivedAt_updatedAt_idx" ON "collaboration_topics"("organizationId", "archivedAt", "updatedAt");
CREATE UNIQUE INDEX "collaboration_channels_topicId_name_key" ON "collaboration_channels"("topicId", "name");
CREATE UNIQUE INDEX "collaboration_channels_id_organizationId_key" ON "collaboration_channels"("id", "organizationId");
CREATE INDEX "collaboration_channels_organizationId_topicId_archivedAt_idx" ON "collaboration_channels"("organizationId", "topicId", "archivedAt");
CREATE INDEX "collaboration_channel_members_userId_joinedAt_idx" ON "collaboration_channel_members"("userId", "joinedAt");
CREATE INDEX "collaboration_channel_members_channelId_role_idx" ON "collaboration_channel_members"("channelId", "role");

ALTER TABLE "collaboration_topics" ADD CONSTRAINT "collaboration_topics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collaboration_topics" ADD CONSTRAINT "collaboration_topics_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "collaboration_channels" ADD CONSTRAINT "collaboration_channels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collaboration_channels" ADD CONSTRAINT "collaboration_channels_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "collaboration_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collaboration_channels" ADD CONSTRAINT "collaboration_channels_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "collaboration_channel_members" ADD CONSTRAINT "collaboration_channel_members_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "collaboration_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collaboration_channel_members" ADD CONSTRAINT "collaboration_channel_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collaboration_channel_members" ADD CONSTRAINT "collaboration_channel_members_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "collaboration_topics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collaboration_topics" FORCE ROW LEVEL SECURITY;
CREATE POLICY "collaboration_topics_tenant_isolation" ON "collaboration_topics" USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), '')) WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));
ALTER TABLE "collaboration_channels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collaboration_channels" FORCE ROW LEVEL SECURITY;
CREATE POLICY "collaboration_channels_tenant_isolation" ON "collaboration_channels" USING ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), '')) WITH CHECK ("organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''));
ALTER TABLE "collaboration_channel_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collaboration_channel_members" FORCE ROW LEVEL SECURITY;
CREATE POLICY "collaboration_channel_members_tenant_isolation" ON "collaboration_channel_members" USING (EXISTS (SELECT 1 FROM "collaboration_channels" c WHERE c.id = "collaboration_channel_members"."channelId" AND c."organizationId" = NULLIF(current_setting('app.current_organization_id', true), ''))) WITH CHECK (EXISTS (SELECT 1 FROM "collaboration_channels" c WHERE c.id = "collaboration_channel_members"."channelId" AND c."organizationId" = NULLIF(current_setting('app.current_organization_id', true), '')));
