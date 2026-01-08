CREATE TYPE "public"."claim_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."claim_request_type" AS ENUM('CLAIM', 'REMOVAL');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('UNCLAIMED', 'CLAIM_PENDING', 'CLAIMED', 'REMOVAL_REQUESTED');--> statement-breakpoint
CREATE TYPE "public"."court_type" AS ENUM('CURATED', 'RESERVABLE');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('CREATED', 'AWAITING_PAYMENT', 'PAYMENT_MARKED_BY_USER', 'CONFIRMED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."time_slot_status" AS ENUM('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."triggered_by_role" AS ENUM('PLAYER', 'OWNER', 'SYSTEM');--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"phone" text,
	"email_confirmed_at" timestamp with time zone,
	"phone_confirmed_at" timestamp with time zone,
	"last_sign_in_at" timestamp with time zone,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(100),
	"email" varchar(255),
	"phone_number" varchar(20),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organization_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"description" text,
	"logo_url" text,
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_profile_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "court" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"name" varchar(200) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"court_type" "court_type" NOT NULL,
	"claim_status" "claim_status" DEFAULT 'UNCLAIMED' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curated_court_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"facebook_url" text,
	"viber_info" varchar(100),
	"instagram_url" text,
	"website_url" text,
	"other_contact_info" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "curated_court_detail_court_id_unique" UNIQUE("court_id")
);
--> statement-breakpoint
CREATE TABLE "reservable_court_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"default_currency" varchar(3) DEFAULT 'PHP' NOT NULL,
	"payment_instructions" text,
	"gcash_number" varchar(20),
	"bank_name" varchar(100),
	"bank_account_number" varchar(50),
	"bank_account_name" varchar(150),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservable_court_detail_court_id_unique" UNIQUE("court_id")
);
--> statement-breakpoint
CREATE TABLE "court_photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"url" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "court_amenity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "court_amenity_court_id_name_unique" UNIQUE("court_id","name")
);
--> statement-breakpoint
CREATE TABLE "time_slot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" time_slot_status DEFAULT 'AVAILABLE' NOT NULL,
	"price_cents" integer,
	"currency" varchar(3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "time_slot_court_id_start_time_unique" UNIQUE("court_id","start_time"),
	CONSTRAINT "time_slot_end_after_start" CHECK ("time_slot"."end_time" > "time_slot"."start_time"),
	CONSTRAINT "time_slot_price_currency_consistency" CHECK (("time_slot"."price_cents" IS NULL AND "time_slot"."currency" IS NULL) OR ("time_slot"."price_cents" IS NOT NULL AND "time_slot"."currency" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "payment_proof" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"file_url" text,
	"reference_number" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_proof_reservation_id_unique" UNIQUE("reservation_id")
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_slot_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"player_name_snapshot" varchar(100),
	"player_email_snapshot" varchar(255),
	"player_phone_snapshot" varchar(20),
	"status" "reservation_status" NOT NULL,
	"expires_at" timestamp with time zone,
	"terms_accepted_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"from_status" varchar(30),
	"to_status" varchar(30) NOT NULL,
	"triggered_by_user_id" uuid,
	"triggered_by_role" "triggered_by_role" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"court_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"request_type" "claim_request_type" NOT NULL,
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
CREATE TABLE "claim_request_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_request_id" uuid NOT NULL,
	"from_status" varchar(20),
	"to_status" varchar(20) NOT NULL,
	"triggered_by_user_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_profile" ADD CONSTRAINT "organization_profile_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court" ADD CONSTRAINT "court_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curated_court_detail" ADD CONSTRAINT "curated_court_detail_court_id_court_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."court"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservable_court_detail" ADD CONSTRAINT "reservable_court_detail_court_id_court_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."court"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_photo" ADD CONSTRAINT "court_photo_court_id_court_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."court"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_amenity" ADD CONSTRAINT "court_amenity_court_id_court_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."court"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slot" ADD CONSTRAINT "time_slot_court_id_court_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."court"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_proof" ADD CONSTRAINT "payment_proof_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_time_slot_id_time_slot_id_fk" FOREIGN KEY ("time_slot_id") REFERENCES "public"."time_slot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_player_id_profile_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_event" ADD CONSTRAINT "reservation_event_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_event" ADD CONSTRAINT "reservation_event_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_request" ADD CONSTRAINT "claim_request_court_id_court_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."court"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_request" ADD CONSTRAINT "claim_request_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_request" ADD CONSTRAINT "claim_request_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_request" ADD CONSTRAINT "claim_request_reviewer_user_id_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_request_event" ADD CONSTRAINT "claim_request_event_claim_request_id_claim_request_id_fk" FOREIGN KEY ("claim_request_id") REFERENCES "public"."claim_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_request_event" ADD CONSTRAINT "claim_request_event_triggered_by_user_id_users_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_profile_user" ON "profile" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_organization_slug" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_court_location" ON "court" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "idx_court_city" ON "court" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_court_type" ON "court" USING btree ("court_type");--> statement-breakpoint
CREATE INDEX "idx_court_org" ON "court" USING btree ("organization_id") WHERE "court"."organization_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_court_active" ON "court" USING btree ("is_active") WHERE "court"."is_active" = true;--> statement-breakpoint
CREATE INDEX "idx_timeslot_court_status" ON "time_slot" USING btree ("court_id","status");--> statement-breakpoint
CREATE INDEX "idx_timeslot_start" ON "time_slot" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_timeslot_available" ON "time_slot" USING btree ("court_id","start_time") WHERE "time_slot"."status" = 'AVAILABLE';--> statement-breakpoint
CREATE INDEX "idx_reservation_player" ON "reservation" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "idx_reservation_status" ON "reservation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reservation_expires" ON "reservation" USING btree ("expires_at") WHERE "reservation"."status" IN ('AWAITING_PAYMENT', 'PAYMENT_MARKED_BY_USER');--> statement-breakpoint
CREATE INDEX "idx_reservation_event_reservation" ON "reservation_event" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "idx_claim_request_event_claim" ON "claim_request_event" USING btree ("claim_request_id");