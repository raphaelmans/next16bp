-- Reservation chat mapping + transcript snapshots (evidence)

CREATE TABLE IF NOT EXISTS "reservation_chat_thread" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reservation_id" uuid NOT NULL,
  "provider_id" varchar(20) NOT NULL,
  "provider_channel_type" varchar(32) NOT NULL,
  "provider_channel_id" varchar(128) NOT NULL,
  "created_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "reservation_chat_thread_reservation_id_unique" UNIQUE ("reservation_id"),
  CONSTRAINT "reservation_chat_thread_provider_channel_unique" UNIQUE ("provider_id", "provider_channel_type", "provider_channel_id")
);

DO $$ BEGIN
 ALTER TABLE "reservation_chat_thread" ADD CONSTRAINT "reservation_chat_thread_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "reservation_chat_thread" ADD CONSTRAINT "reservation_chat_thread_created_by_user_id_auth_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_reservation_chat_thread_reservation_id" ON "reservation_chat_thread" ("reservation_id");
CREATE INDEX IF NOT EXISTS "idx_reservation_chat_thread_provider_channel" ON "reservation_chat_thread" ("provider_id", "provider_channel_type", "provider_channel_id");

CREATE TABLE IF NOT EXISTS "reservation_chat_transcript" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reservation_id" uuid NOT NULL,
  "provider_id" varchar(20) NOT NULL,
  "provider_channel_type" varchar(32) NOT NULL,
  "provider_channel_id" varchar(128) NOT NULL,
  "captured_by_user_id" uuid,
  "captured_at" timestamp with time zone DEFAULT now() NOT NULL,
  "message_count" integer NOT NULL,
  "first_message_at" timestamp with time zone,
  "last_message_at" timestamp with time zone,
  "transcript_sha256" varchar(64) NOT NULL,
  "transcript_json" jsonb NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "reservation_chat_transcript" ADD CONSTRAINT "reservation_chat_transcript_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "reservation_chat_transcript" ADD CONSTRAINT "reservation_chat_transcript_captured_by_user_id_auth_users_id_fk" FOREIGN KEY ("captured_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_reservation_chat_transcript_reservation_id_captured_at" ON "reservation_chat_transcript" ("reservation_id", "captured_at");
