CREATE TABLE IF NOT EXISTS "team_invitations" (
  "token_hash" varchar(64) PRIMARY KEY,
  "team_id" varchar NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "email" varchar NOT NULL,
  "role" varchar NOT NULL,
  "invited_by" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "team_invitations_role_check" CHECK ("role" IN ('parent', 'coach'))
);

CREATE INDEX IF NOT EXISTS "IDX_team_invitations_team" ON "team_invitations" ("team_id");
CREATE INDEX IF NOT EXISTS "IDX_team_invitations_email" ON "team_invitations" ("email");
CREATE INDEX IF NOT EXISTS "IDX_team_invitations_expiry" ON "team_invitations" ("expires_at");
