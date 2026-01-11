ALTER TABLE "reservable_court_detail" ADD COLUMN "requires_owner_confirmation" boolean DEFAULT true NOT NULL;
ALTER TABLE "reservable_court_detail" ADD COLUMN "payment_hold_minutes" integer DEFAULT 15 NOT NULL;
ALTER TABLE "reservable_court_detail" ADD COLUMN "owner_review_minutes" integer DEFAULT 15 NOT NULL;
ALTER TABLE "reservable_court_detail" ADD COLUMN "cancellation_cutoff_minutes" integer DEFAULT 0 NOT NULL;
