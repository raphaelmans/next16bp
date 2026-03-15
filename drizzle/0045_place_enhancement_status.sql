DO $$
BEGIN
  CREATE TYPE "place_enhancement_status" AS ENUM (
    'NOT_STARTED',
    'COMPLETED',
    'FAILED',
    'SKIPPED',
    'REVIEW_REQUIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "place_enhancement_status"
  ADD VALUE IF NOT EXISTS 'REVIEW_REQUIRED';

ALTER TABLE "place"
  ADD COLUMN IF NOT EXISTS "website_enhancement_status" "place_enhancement_status" DEFAULT 'NOT_STARTED' NOT NULL,
  ADD COLUMN IF NOT EXISTS "website_enhancement_attempted_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "website_enhanced_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "website_enhancement_error" text,
  ADD COLUMN IF NOT EXISTS "facebook_enhancement_status" "place_enhancement_status" DEFAULT 'NOT_STARTED' NOT NULL,
  ADD COLUMN IF NOT EXISTS "facebook_enhancement_attempted_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "facebook_enhanced_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "facebook_enhancement_error" text;
