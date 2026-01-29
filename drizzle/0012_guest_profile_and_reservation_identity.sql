-- Guest profile table
CREATE TABLE "guest_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone_number" varchar(20),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "idx_guest_profile_org" ON "guest_profile" USING btree ("organization_id");

ALTER TABLE "guest_profile" ADD CONSTRAINT "guest_profile_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;

-- Make player_id nullable on reservation
ALTER TABLE "reservation" ALTER COLUMN "player_id" DROP NOT NULL;

-- Add guest_profile_id column to reservation
ALTER TABLE "reservation" ADD COLUMN "guest_profile_id" uuid;

CREATE INDEX "idx_reservation_guest_profile" ON "reservation" USING btree ("guest_profile_id");

ALTER TABLE "reservation" ADD CONSTRAINT "reservation_guest_profile_id_guest_profile_id_fk" FOREIGN KEY ("guest_profile_id") REFERENCES "public"."guest_profile"("id") ON DELETE restrict ON UPDATE no action;

-- Ensure exactly one identity (player or guest) per reservation
ALTER TABLE "reservation" ADD CONSTRAINT "chk_reservation_identity" CHECK (((player_id IS NOT NULL)::int + (guest_profile_id IS NOT NULL)::int) = 1);
