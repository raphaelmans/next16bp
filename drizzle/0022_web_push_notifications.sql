-- Web Push support (browser notifications)

DO $$ BEGIN
  ALTER TYPE "notification_delivery_channel" ADD VALUE 'WEB_PUSH';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "push_subscription" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "endpoint" text NOT NULL,
  "p256dh" text NOT NULL,
  "auth" text NOT NULL,
  "expiration_time" text,
  "user_agent" text,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_push_subscription_endpoint_unique" ON "push_subscription" ("endpoint");
CREATE INDEX IF NOT EXISTS "idx_push_subscription_user_revoked" ON "push_subscription" ("user_id", "revoked_at");
