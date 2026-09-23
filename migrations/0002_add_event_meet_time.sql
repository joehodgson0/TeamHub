ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "meet_before_minutes" integer DEFAULT 0 NOT NULL;
