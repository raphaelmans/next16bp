-- Update default TTLs from 15m to 45m for new organizations
ALTER TABLE "organization_reservation_policy" ALTER COLUMN "payment_hold_minutes" SET DEFAULT 45;
ALTER TABLE "organization_reservation_policy" ALTER COLUMN "owner_review_minutes" SET DEFAULT 45;
