ALTER TABLE "reservation" ALTER COLUMN "court_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reservation" ADD COLUMN "coach_id" uuid;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reservation_coach" ON "reservation" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "idx_reservation_coach_start" ON "reservation" USING btree ("coach_id","start_time");--> statement-breakpoint
CREATE INDEX "idx_reservation_active_coach_time" ON "reservation" USING btree ("coach_id","start_time","end_time") WHERE "reservation"."status" IN ('CREATED', 'AWAITING_PAYMENT', 'PAYMENT_MARKED_BY_USER', 'CONFIRMED');--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "chk_reservation_target" CHECK ((("reservation"."court_id" IS NOT NULL)::int + ("reservation"."coach_id" IS NOT NULL)::int) = 1);