ALTER TABLE "payment_proof" ADD COLUMN IF NOT EXISTS "file_path" text;
--> statement-breakpoint
ALTER TABLE "place_verification_request_document" ADD COLUMN IF NOT EXISTS "file_path" text;
--> statement-breakpoint
ALTER TABLE "place_verification_request_document" ALTER COLUMN "file_url" DROP NOT NULL;
--> statement-breakpoint

UPDATE "payment_proof"
SET "file_path" = regexp_replace(
  "file_url",
  '^.*/storage/v1/object/public/payment-proofs/',
  ''
)
WHERE "file_path" IS NULL
  AND "file_url" IS NOT NULL
  AND "file_url" LIKE '%/storage/v1/object/public/payment-proofs/%';
--> statement-breakpoint

UPDATE "place_verification_request_document"
SET "file_path" = regexp_replace(
  "file_url",
  '^.*/storage/v1/object/public/place-verification-docs/',
  ''
)
WHERE "file_path" IS NULL
  AND "file_url" IS NOT NULL
  AND "file_url" LIKE '%/storage/v1/object/public/place-verification-docs/%';
