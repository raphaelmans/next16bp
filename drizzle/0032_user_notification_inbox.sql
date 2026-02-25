-- User-facing in-app notification inbox

CREATE TABLE IF NOT EXISTS "user_notification" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "event_type" text NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "href" text,
  "payload" jsonb,
  "read_at" timestamp with time zone,
  "idempotency_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_notification_idempotency" ON "user_notification" ("idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_notification_user_read_created" ON "user_notification" ("user_id", "read_at", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_notification_user_created" ON "user_notification" ("user_id", "created_at");
