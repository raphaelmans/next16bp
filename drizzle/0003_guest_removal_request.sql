ALTER TABLE "claim_request" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "claim_request" ALTER COLUMN "requested_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "claim_request" ADD COLUMN "guest_name" varchar(150);--> statement-breakpoint
ALTER TABLE "claim_request" ADD COLUMN "guest_email" varchar(255);--> statement-breakpoint
ALTER TABLE "claim_request_event" ALTER COLUMN "triggered_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "claim_request_event" DROP CONSTRAINT IF EXISTS "claim_request_event_triggered_by_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "claim_request_event" ADD CONSTRAINT "claim_request_event_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_claim_request_guest_email" ON "claim_request" ("guest_email");--> statement-breakpoint
CREATE INDEX "idx_claim_request_org" ON "claim_request" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_claim_request_requested_by" ON "claim_request" ("requested_by_user_id") WHERE "claim_request"."requested_by_user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_claim_request_event_trigger" ON "claim_request_event" ("triggered_by_user_id") WHERE "claim_request_event"."triggered_by_user_id" IS NOT NULL;--> statement-breakpoint
