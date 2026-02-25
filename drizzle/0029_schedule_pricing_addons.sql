DO $$ BEGIN
  CREATE TYPE "court_addon_mode" AS ENUM('OPTIONAL', 'AUTO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "court_addon_pricing_type" AS ENUM('HOURLY', 'FLAT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "court_addon" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "court_id" uuid NOT NULL,
  "label" varchar(100) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "mode" "court_addon_mode" NOT NULL,
  "pricing_type" "court_addon_pricing_type" NOT NULL,
  "flat_fee_cents" integer,
  "flat_fee_currency" varchar(3),
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "court_addon"
  ADD COLUMN IF NOT EXISTS "pricing_type" "court_addon_pricing_type";

ALTER TABLE "court_addon"
  ADD COLUMN IF NOT EXISTS "flat_fee_cents" integer;

ALTER TABLE "court_addon"
  ADD COLUMN IF NOT EXISTS "flat_fee_currency" varchar(3);

ALTER TABLE "court_addon"
  ADD COLUMN IF NOT EXISTS "display_order" integer DEFAULT 0 NOT NULL;

ALTER TABLE "court_addon"
  ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

CREATE TABLE IF NOT EXISTS "court_addon_rate_rule" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "addon_id" uuid NOT NULL,
  "day_of_week" integer NOT NULL,
  "start_minute" integer NOT NULL,
  "end_minute" integer NOT NULL,
  "hourly_rate_cents" integer,
  "currency" varchar(3),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "court_addon_rate_rule_day_range" CHECK ("court_addon_rate_rule"."day_of_week" BETWEEN 0 AND 6),
  CONSTRAINT "court_addon_rate_rule_start_range" CHECK ("court_addon_rate_rule"."start_minute" BETWEEN 0 AND 1439),
  CONSTRAINT "court_addon_rate_rule_end_range" CHECK ("court_addon_rate_rule"."end_minute" BETWEEN 1 AND 1440),
  CONSTRAINT "court_addon_rate_rule_start_before_end" CHECK ("court_addon_rate_rule"."start_minute" < "court_addon_rate_rule"."end_minute"),
  CONSTRAINT "court_addon_rate_rule_hourly_non_negative" CHECK ("court_addon_rate_rule"."hourly_rate_cents" IS NULL OR "court_addon_rate_rule"."hourly_rate_cents" >= 0)
);

DO $$ BEGIN
  ALTER TABLE "court_addon"
    ADD CONSTRAINT "court_addon_court_id_court_id_fk"
    FOREIGN KEY ("court_id") REFERENCES "public"."court"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "court_addon_rate_rule"
    ADD CONSTRAINT "court_addon_rate_rule_addon_id_court_addon_id_fk"
    FOREIGN KEY ("addon_id") REFERENCES "public"."court_addon"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_court_addon_court"
  ON "court_addon" USING btree ("court_id");

CREATE INDEX IF NOT EXISTS "idx_court_addon_active"
  ON "court_addon" USING btree ("court_id", "is_active");

CREATE INDEX IF NOT EXISTS "idx_court_addon_rate_rule_addon"
  ON "court_addon_rate_rule" USING btree ("addon_id");

ALTER TABLE "court_addon"
  DROP CONSTRAINT IF EXISTS "court_addon_flat_fee_non_negative";

ALTER TABLE "court_addon"
  ADD CONSTRAINT "court_addon_flat_fee_non_negative"
  CHECK ("court_addon"."flat_fee_cents" IS NULL OR "court_addon"."flat_fee_cents" >= 0);

UPDATE "court_addon"
SET "pricing_type" =
  CASE
    WHEN "flat_fee_cents" IS NOT NULL THEN 'FLAT'::"court_addon_pricing_type"
    ELSE 'HOURLY'::"court_addon_pricing_type"
  END
WHERE "pricing_type" IS NULL;

ALTER TABLE "court_addon"
  ALTER COLUMN "pricing_type" SET DEFAULT 'HOURLY';

ALTER TABLE "court_addon"
  ALTER COLUMN "pricing_type" SET NOT NULL;
