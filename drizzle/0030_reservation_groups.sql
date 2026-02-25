CREATE TABLE "reservation_group" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "place_id" uuid NOT NULL,
  "player_id" uuid,
  "player_name_snapshot" varchar(100),
  "player_email_snapshot" varchar(255),
  "player_phone_snapshot" varchar(20),
  "total_price_cents" integer DEFAULT 0 NOT NULL,
  "currency" varchar(3) DEFAULT 'PHP' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reservation_group"
  ADD CONSTRAINT "reservation_group_place_id_place_id_fk"
  FOREIGN KEY ("place_id")
  REFERENCES "public"."place"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reservation_group"
  ADD CONSTRAINT "reservation_group_player_id_profile_id_fk"
  FOREIGN KEY ("player_id")
  REFERENCES "public"."profile"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reservation"
  ADD COLUMN "group_id" uuid;
--> statement-breakpoint
ALTER TABLE "reservation"
  ADD CONSTRAINT "reservation_group_id_reservation_group_id_fk"
  FOREIGN KEY ("group_id")
  REFERENCES "public"."reservation_group"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_reservation_group_place" ON "reservation_group" USING btree ("place_id");
--> statement-breakpoint
CREATE INDEX "idx_reservation_group_player" ON "reservation_group" USING btree ("player_id");
--> statement-breakpoint
CREATE INDEX "idx_reservation_group_created" ON "reservation_group" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "idx_reservation_group" ON "reservation" USING btree ("group_id");
