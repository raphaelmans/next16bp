-- Open Play cost-sharing fields (off-platform payment coordination)

ALTER TABLE "open_play"
ADD COLUMN IF NOT EXISTS "payment_instructions" text;

ALTER TABLE "open_play"
ADD COLUMN IF NOT EXISTS "payment_link_url" varchar(500);
