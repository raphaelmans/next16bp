CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_place_name_trgm" ON "place" USING gin ("name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_place_address_trgm" ON "place" USING gin ("address" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_place_city_trgm" ON "place" USING gin ("city" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_place_province_trgm" ON "place" USING gin ("province" gin_trgm_ops);
