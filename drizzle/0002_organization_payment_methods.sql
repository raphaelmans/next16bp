CREATE TYPE "public"."payment_method_type" AS ENUM('MOBILE_WALLET', 'BANK');--> statement-breakpoint
CREATE TYPE "public"."payment_method_provider" AS ENUM('GCASH', 'MAYA', 'BPI', 'BDO', 'METROBANK', 'UNIONBANK', 'RCBC', 'LANDBANK', 'SECURITY_BANK', 'CHINABANK', 'PNB', 'EASTWEST');--> statement-breakpoint
CREATE TABLE "organization_reservation_policy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"requires_owner_confirmation" boolean DEFAULT true NOT NULL,
	"payment_hold_minutes" integer DEFAULT 15 NOT NULL,
	"owner_review_minutes" integer DEFAULT 15 NOT NULL,
	"cancellation_cutoff_minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_reservation_policy_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "organization_payment_method" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"provider" "payment_method_provider" NOT NULL,
	"account_name" varchar(150) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_payment_method_unique" UNIQUE("organization_id","provider","account_number")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_org_payment_method_default" ON "organization_payment_method" ("organization_id") WHERE "organization_payment_method"."is_default" = true;
--> statement-breakpoint
ALTER TABLE "organization_reservation_policy" ADD CONSTRAINT "organization_reservation_policy_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_payment_method" ADD CONSTRAINT "organization_payment_method_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DROP TABLE IF EXISTS "reservable_place_policy";
