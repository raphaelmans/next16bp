-- Notification delivery outbox (async jobs)

DO $$ BEGIN
  CREATE TYPE "notification_delivery_channel" AS ENUM ('EMAIL', 'SMS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "notification_delivery_job_status" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "notification_delivery_job" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_type" text NOT NULL,
  "channel" "notification_delivery_channel" NOT NULL,
  "target" text,
  "organization_id" uuid,
  "reservation_id" uuid,
  "place_verification_request_id" uuid,
  "payload" jsonb,
  "status" "notification_delivery_job_status" DEFAULT 'PENDING' NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "next_attempt_at" timestamp with time zone,
  "last_error" text,
  "provider_message_id" text,
  "sent_at" timestamp with time zone,
  "idempotency_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "notification_delivery_job" ADD CONSTRAINT "notification_delivery_job_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_delivery_job" ADD CONSTRAINT "notification_delivery_job_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "notification_delivery_job" ADD CONSTRAINT "notification_delivery_job_place_verification_request_id_fk" FOREIGN KEY ("place_verification_request_id") REFERENCES "public"."place_verification_request"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_notification_delivery_job_idempotency" ON "notification_delivery_job" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "idx_notification_delivery_job_status_next_attempt" ON "notification_delivery_job" ("status", "next_attempt_at");
CREATE INDEX IF NOT EXISTS "idx_notification_delivery_job_event_created" ON "notification_delivery_job" ("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "idx_notification_delivery_job_org" ON "notification_delivery_job" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_notification_delivery_job_request" ON "notification_delivery_job" ("place_verification_request_id");
