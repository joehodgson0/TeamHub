CREATE TABLE IF NOT EXISTS "player_guardians" (
  "player_id" varchar NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "player_guardians_player_id_user_id_pk" PRIMARY KEY("player_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "IDX_player_guardians_user"
  ON "player_guardians" ("user_id");

-- Backfill the primary parent on every existing dependant. This is idempotent so it
-- is safe to apply after a partial deployment.
INSERT INTO "player_guardians" ("player_id", "user_id")
SELECT "id", "parent_id" FROM "players"
ON CONFLICT ("player_id", "user_id") DO NOTHING;
