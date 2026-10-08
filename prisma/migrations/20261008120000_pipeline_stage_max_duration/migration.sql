ALTER TABLE "pipeline_stages"
ADD COLUMN "maxDurationDays" INTEGER;

ALTER TABLE "pipeline_stages"
ADD CONSTRAINT "pipeline_stages_maxDurationDays_check"
CHECK ("maxDurationDays" IS NULL OR "maxDurationDays" > 0);
