-- Mobile push token support (Expo push notifications)

DO $$ BEGIN
  CREATE TYPE "mobile_push_token_platform" AS ENUM ('ios', 'android');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "mobile_push_token" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "token" text NOT NULL,
  "platform" "mobile_push_token_platform" NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "mobile_push_token" ADD CONSTRAINT "mobile_push_token_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_mobile_push_token_token_unique" ON "mobile_push_token" ("token");
CREATE INDEX IF NOT EXISTS "idx_mobile_push_token_user_revoked" ON "mobile_push_token" ("user_id", "revoked_at");
