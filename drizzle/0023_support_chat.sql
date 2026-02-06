-- Support chat threads for owner <-> admin on claim/verification requests

CREATE TABLE IF NOT EXISTS "support_chat_thread" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "claim_request_id" uuid,
  "place_verification_request_id" uuid,
  "provider_id" varchar(20) NOT NULL,
  "provider_channel_type" varchar(32) NOT NULL,
  "provider_channel_id" varchar(128) NOT NULL,
  "created_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "support_chat_thread_one_request" CHECK (
    ("claim_request_id" IS NOT NULL AND "place_verification_request_id" IS NULL)
    OR
    ("claim_request_id" IS NULL AND "place_verification_request_id" IS NOT NULL)
  )
);

DO $$ BEGIN
  ALTER TABLE "support_chat_thread" ADD CONSTRAINT "support_chat_thread_claim_request_id_fk" FOREIGN KEY ("claim_request_id") REFERENCES "public"."claim_request"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_chat_thread" ADD CONSTRAINT "support_chat_thread_place_verification_request_id_fk" FOREIGN KEY ("place_verification_request_id") REFERENCES "public"."place_verification_request"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_chat_thread" ADD CONSTRAINT "support_chat_thread_created_by_user_id_auth_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_support_chat_thread_provider_channel" ON "support_chat_thread" ("provider_id", "provider_channel_type", "provider_channel_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_support_chat_thread_claim_request" ON "support_chat_thread" ("claim_request_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_support_chat_thread_verification_request" ON "support_chat_thread" ("place_verification_request_id");

CREATE INDEX IF NOT EXISTS "idx_support_chat_thread_claim_request" ON "support_chat_thread" ("claim_request_id");
CREATE INDEX IF NOT EXISTS "idx_support_chat_thread_verification_request" ON "support_chat_thread" ("place_verification_request_id");
