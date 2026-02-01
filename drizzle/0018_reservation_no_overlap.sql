CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint

ALTER TABLE "reservation" DROP CONSTRAINT IF EXISTS "reservation_end_after_start";
--> statement-breakpoint

ALTER TABLE "reservation" DROP CONSTRAINT IF EXISTS "reservation_no_overlap";
--> statement-breakpoint

ALTER TABLE "reservation"
ADD CONSTRAINT "reservation_end_after_start"
CHECK ("end_time" > "start_time");
--> statement-breakpoint

ALTER TABLE "reservation"
ADD CONSTRAINT "reservation_no_overlap"
EXCLUDE USING gist (
  "court_id" WITH =,
  tstzrange("start_time", "end_time", '[)') WITH &&
)
WHERE (
  "status" IN ('CREATED', 'AWAITING_PAYMENT', 'PAYMENT_MARKED_BY_USER', 'CONFIRMED')
);
