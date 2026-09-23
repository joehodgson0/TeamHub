DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'users'
      AND column_name = 'welcome_email_sent_at'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "welcome_email_sent_at" timestamp;

    -- Existing accounts pre-date welcome emails and should not receive one on
    -- their next login. New accounts leave this value null until delivery.
    UPDATE "users"
    SET "welcome_email_sent_at" = COALESCE("created_at", now());
  END IF;
END $$;
