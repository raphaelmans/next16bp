-- Add reservation_group_id column (nullable FK → reservation_group.id)
ALTER TABLE "open_play"
  ADD COLUMN "reservation_group_id" uuid;
--> statement-breakpoint
ALTER TABLE "open_play"
  ADD CONSTRAINT "open_play_reservation_group_id_reservation_group_id_fk"
  FOREIGN KEY ("reservation_group_id")
  REFERENCES "public"."reservation_group"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Make reservation_id nullable (was NOT NULL)
ALTER TABLE "open_play"
  ALTER COLUMN "reservation_id" DROP NOT NULL;
--> statement-breakpoint

-- Make court_id nullable (was NOT NULL)
ALTER TABLE "open_play"
  ALTER COLUMN "court_id" DROP NOT NULL;
--> statement-breakpoint

-- XOR constraint: exactly one of reservation_id / reservation_group_id must be set
ALTER TABLE "open_play"
  ADD CONSTRAINT "chk_open_play_reservation_xor_group"
  CHECK (
    ((reservation_id IS NOT NULL)::int + (reservation_group_id IS NOT NULL)::int) = 1
  );
--> statement-breakpoint

-- Unique partial index: one open play per reservation group
CREATE UNIQUE INDEX "uq_open_play_reservation_group"
  ON "open_play" ("reservation_group_id")
  WHERE "reservation_group_id" IS NOT NULL;
--> statement-breakpoint

-- Lookup index for reservation_group_id
CREATE INDEX "idx_open_play_reservation_group"
  ON "open_play" USING btree ("reservation_group_id");
