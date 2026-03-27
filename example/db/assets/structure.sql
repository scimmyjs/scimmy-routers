CREATE TABLE IF NOT EXISTS "users" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" varchar NOT NULL,
  "api_key" varchar UNIQUE,
  "picture" varchar
);

CREATE INDEX IF NOT EXISTS "index_users_on_api_key" ON "users"("api_key");

CREATE TABLE IF NOT EXISTS "logins" (
  "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users" ("id"), -- NB: ON DELETE CASCADE does not seem to work
  "email" varchar NOT NULL UNIQUE,
  "primary" boolean DEFAULT 'f'
);

CREATE INDEX IF NOT EXISTS "index_logins_on_emails" ON "logins"("email");
CREATE INDEX IF NOT EXISTS "index_logins_on_user_id" ON "logins"("user_id");
