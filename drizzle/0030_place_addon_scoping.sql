DO $$ BEGIN
  CREATE TYPE "place_addon_mode" AS ENUM('OPTIONAL', 'AUTO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "place_addon_pricing_type" AS ENUM('HOURLY', 'FLAT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "place_addon" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "place_id" uuid NOT NULL,
  "label" varchar(100) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "mode" "place_addon_mode" NOT NULL,
  "pricing_type" "place_addon_pricing_type" NOT NULL,
  "flat_fee_cents" integer,
  "flat_fee_currency" varchar(3),
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "place_addon_flat_fee_non_negative" CHECK ("place_addon"."flat_fee_cents" IS NULL OR "place_addon"."flat_fee_cents" >= 0)
);

CREATE TABLE IF NOT EXISTS "place_addon_rate_rule" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "addon_id" uuid NOT NULL,
  "day_of_week" integer NOT NULL,
  "start_minute" integer NOT NULL,
  "end_minute" integer NOT NULL,
  "hourly_rate_cents" integer,
  "currency" varchar(3),
  CONSTRAINT "place_addon_rate_rule_day_range" CHECK ("place_addon_rate_rule"."day_of_week" BETWEEN 0 AND 6),
  CONSTRAINT "place_addon_rate_rule_start_range" CHECK ("place_addon_rate_rule"."start_minute" BETWEEN 0 AND 1439),
  CONSTRAINT "place_addon_rate_rule_end_range" CHECK ("place_addon_rate_rule"."end_minute" BETWEEN 1 AND 1440),
  CONSTRAINT "place_addon_rate_rule_start_before_end" CHECK ("place_addon_rate_rule"."start_minute" < "place_addon_rate_rule"."end_minute"),
  CONSTRAINT "place_addon_rate_rule_hourly_non_negative" CHECK ("place_addon_rate_rule"."hourly_rate_cents" IS NULL OR "place_addon_rate_rule"."hourly_rate_cents" >= 0)
);

DO $$ BEGIN
  ALTER TABLE "place_addon"
    ADD CONSTRAINT "place_addon_place_id_place_id_fk"
    FOREIGN KEY ("place_id") REFERENCES "public"."place"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "place_addon_rate_rule"
    ADD CONSTRAINT "place_addon_rate_rule_addon_id_place_addon_id_fk"
    FOREIGN KEY ("addon_id") REFERENCES "public"."place_addon"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_place_addon_place"
  ON "place_addon" USING btree ("place_id");

CREATE INDEX IF NOT EXISTS "idx_place_addon_active"
  ON "place_addon" USING btree ("place_id", "is_active");

CREATE INDEX IF NOT EXISTS "idx_place_addon_rate_rule_addon"
  ON "place_addon_rate_rule" USING btree ("addon_id");
