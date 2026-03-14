CREATE TYPE "public"."coach_verification_status" AS ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN "verification_status" "coach_verification_status" DEFAULT 'UNVERIFIED' NOT NULL;--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN "verification_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "coach" ADD COLUMN "verified_at" timestamp with time zone;