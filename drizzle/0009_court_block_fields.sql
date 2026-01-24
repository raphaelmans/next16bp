CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
DO $$
BEGIN
  CREATE TYPE "court_block_type" AS ENUM ('MAINTENANCE', 'WALK_IN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "court_block"
ADD COLUMN IF NOT EXISTS "type" "court_block_type" NOT NULL DEFAULT 'MAINTENANCE';--> statement-breakpoint
ALTER TABLE "court_block"
ADD COLUMN IF NOT EXISTS "total_price_cents" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "court_block"
ADD COLUMN IF NOT EXISTS "currency" varchar(3) NOT NULL DEFAULT 'PHP';--> statement-breakpoint
ALTER TABLE "court_block"
ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE "court_block"
ADD COLUMN IF NOT EXISTS "cancelled_at" timestamptz;--> statement-breakpoint
ALTER TABLE "court_block"
ADD CONSTRAINT "court_block_duration_multiple_of_60"
CHECK (mod(extract(epoch from ("end_time" - "start_time"))::int, 3600) = 0);--> statement-breakpoint
ALTER TABLE "court_block"
ADD CONSTRAINT "court_block_no_overlap"
EXCLUDE USING gist (
  "court_id" WITH =,
  tstzrange("start_time", "end_time", '[)') WITH &&
)
WHERE ("is_active");--> statement-breakpoint
