CREATE TYPE "public"."place_verification_status" AS ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "place_verification" (
	"place_id" uuid PRIMARY KEY NOT NULL,
	"status" "place_verification_status" DEFAULT 'UNVERIFIED' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by_user_id" uuid,
	"reservations_enabled" boolean DEFAULT false NOT NULL,
	"reservations_enabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "place_verification_requires_verified" CHECK ("place_verification"."reservations_enabled" = false OR "place_verification"."status" = 'VERIFIED')
);
--> statement-breakpoint
CREATE TABLE "place_verification_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"status" "claim_request_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by_user_id" uuid NOT NULL,
	"reviewer_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"request_notes" text,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_verification_request_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_verification_request_id" uuid NOT NULL,
	"from_status" varchar(20),
	"to_status" varchar(20) NOT NULL,
	"triggered_by_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "place_verification_request_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place_verification_request_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_name" varchar(255),
	"size_bytes" integer,
	"doc_type" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "place_verification" ADD CONSTRAINT "place_verification_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_verification" ADD CONSTRAINT "place_verification_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_verification_request" ADD CONSTRAINT "place_verification_request_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_verification_request" ADD CONSTRAINT "place_verification_request_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_verification_request" ADD CONSTRAINT "place_verification_request_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_verification_request" ADD CONSTRAINT "place_verification_request_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_verification_request_event" ADD CONSTRAINT "place_verification_request_event_request_id_fk" FOREIGN KEY ("place_verification_request_id") REFERENCES "public"."place_verification_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_verification_request_event" ADD CONSTRAINT "place_verification_request_event_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_verification_request_document" ADD CONSTRAINT "place_verification_request_document_request_id_fk" FOREIGN KEY ("place_verification_request_id") REFERENCES "public"."place_verification_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_place_verification_request_place" ON "place_verification_request" ("place_id");--> statement-breakpoint
CREATE INDEX "idx_place_verification_request_org" ON "place_verification_request" ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_place_verification_request_status" ON "place_verification_request" ("status");--> statement-breakpoint
CREATE INDEX "idx_place_verification_request_event_request" ON "place_verification_request_event" ("place_verification_request_id");--> statement-breakpoint
CREATE INDEX "idx_place_verification_request_event_trigger" ON "place_verification_request_event" ("triggered_by_user_id") WHERE "place_verification_request_event"."triggered_by_user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_place_verification_document_request" ON "place_verification_request_document" ("place_verification_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "place_verification_request_pending" ON "place_verification_request" ("place_id") WHERE "place_verification_request"."status" = 'PENDING';--> statement-breakpoint
INSERT INTO "place_verification" ("place_id", "status", "reservations_enabled", "created_at", "updated_at")
SELECT "id", 'UNVERIFIED', false, now(), now()
FROM "place"
ON CONFLICT ("place_id") DO NOTHING;--> statement-breakpoint
