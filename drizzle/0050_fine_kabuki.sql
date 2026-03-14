CREATE TYPE "public"."coach_age_group_enum" AS ENUM('KIDS', 'TEENS', 'ADULTS', 'SENIORS');--> statement-breakpoint
CREATE TYPE "public"."coach_block_type_enum" AS ENUM('PERSONAL', 'EXTERNAL_BOOKING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."coach_session_type_enum" AS ENUM('PRIVATE', 'SEMI_PRIVATE', 'GROUP');--> statement-breakpoint
CREATE TYPE "public"."coach_skill_level_enum" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'COMPETITIVE');--> statement-breakpoint
CREATE TYPE "public"."coach_venue_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REMOVED');--> statement-breakpoint
CREATE TABLE "coach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"tagline" varchar(300),
	"bio" text,
	"intro_video_url" text,
	"years_of_experience" integer,
	"playing_background" text,
	"coaching_philosophy" text,
	"city" varchar(100),
	"province" varchar(100),
	"country" varchar(2) DEFAULT 'PH' NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"time_zone" varchar(64) DEFAULT 'Asia/Manila' NOT NULL,
	"willing_to_travel" boolean DEFAULT false NOT NULL,
	"online_coaching" boolean DEFAULT false NOT NULL,
	"base_hourly_rate_cents" integer,
	"base_hourly_rate_currency" varchar(3) DEFAULT 'PHP' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"featured_rank" integer DEFAULT 0 NOT NULL,
	"province_rank" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "coach_profile_id_unique" UNIQUE("profile_id"),
	CONSTRAINT "coach_years_of_experience_non_negative" CHECK ("coach"."years_of_experience" IS NULL OR "coach"."years_of_experience" >= 0),
	CONSTRAINT "coach_base_hourly_rate_non_negative" CHECK ("coach"."base_hourly_rate_cents" IS NULL OR "coach"."base_hourly_rate_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "coach_contact_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"phone_number" varchar(20),
	"facebook_url" text,
	"instagram_url" text,
	"website_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_contact_detail_coach_id_unique" UNIQUE("coach_id")
);
--> statement-breakpoint
CREATE TABLE "coach_addon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"label" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"mode" "court_addon_mode" NOT NULL,
	"pricing_type" "court_addon_pricing_type" NOT NULL,
	"flat_fee_cents" integer,
	"flat_fee_currency" varchar(3),
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_addon_flat_fee_non_negative" CHECK ("coach_addon"."flat_fee_cents" IS NULL OR "coach_addon"."flat_fee_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "coach_addon_rate_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"addon_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"hourly_rate_cents" integer,
	"currency" varchar(3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_addon_rate_rule_day_range" CHECK ("coach_addon_rate_rule"."day_of_week" BETWEEN 0 AND 6),
	CONSTRAINT "coach_addon_rate_rule_start_range" CHECK ("coach_addon_rate_rule"."start_minute" BETWEEN 0 AND 1439),
	CONSTRAINT "coach_addon_rate_rule_end_range" CHECK ("coach_addon_rate_rule"."end_minute" BETWEEN 1 AND 1440),
	CONSTRAINT "coach_addon_rate_rule_start_before_end" CHECK ("coach_addon_rate_rule"."start_minute" < "coach_addon_rate_rule"."end_minute"),
	CONSTRAINT "coach_addon_rate_rule_hourly_non_negative" CHECK ("coach_addon_rate_rule"."hourly_rate_cents" IS NULL OR "coach_addon_rate_rule"."hourly_rate_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "coach_age_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"age_group" "coach_age_group_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"reason" text,
	"block_type" "coach_block_type_enum" DEFAULT 'PERSONAL' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_block_end_after_start" CHECK ("coach_block"."end_time" > "coach_block"."start_time")
);
--> statement-breakpoint
CREATE TABLE "coach_certification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"issuing_body" varchar(200),
	"level" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_hours_window" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_hours_window_day_range" CHECK ("coach_hours_window"."day_of_week" BETWEEN 0 AND 6),
	CONSTRAINT "coach_hours_window_start_range" CHECK ("coach_hours_window"."start_minute" BETWEEN 0 AND 1439),
	CONSTRAINT "coach_hours_window_end_range" CHECK ("coach_hours_window"."end_minute" BETWEEN 1 AND 1440),
	CONSTRAINT "coach_hours_window_start_before_end" CHECK ("coach_hours_window"."start_minute" < "coach_hours_window"."end_minute")
);
--> statement-breakpoint
CREATE TABLE "coach_payment_method" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"provider" "payment_method_provider" NOT NULL,
	"account_name" varchar(150) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_photo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"url" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_rate_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"hourly_rate_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'PHP' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_rate_rule_day_range" CHECK ("coach_rate_rule"."day_of_week" BETWEEN 0 AND 6),
	CONSTRAINT "coach_rate_rule_start_range" CHECK ("coach_rate_rule"."start_minute" BETWEEN 0 AND 1439),
	CONSTRAINT "coach_rate_rule_end_range" CHECK ("coach_rate_rule"."end_minute" BETWEEN 1 AND 1440),
	CONSTRAINT "coach_rate_rule_start_before_end" CHECK ("coach_rate_rule"."start_minute" < "coach_rate_rule"."end_minute"),
	CONSTRAINT "coach_rate_rule_hourly_non_negative" CHECK ("coach_rate_rule"."hourly_rate_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "coach_review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"author_user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"removed_at" timestamp with time zone,
	"removed_by_user_id" uuid,
	"removal_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_review_rating_range" CHECK ("coach_review"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "coach_session_duration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"duration_minutes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_session_duration_allowed_values" CHECK ("coach_session_duration"."duration_minutes" IN (30, 60, 90, 120))
);
--> statement-breakpoint
CREATE TABLE "coach_session_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"session_type" "coach_session_type_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_skill_level" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"level" "coach_skill_level_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_specialty" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_sport" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_venue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"status" "coach_venue_status_enum" DEFAULT 'PENDING' NOT NULL,
	"invited_by_user_id" uuid,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coach" ADD CONSTRAINT "coach_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach" ADD CONSTRAINT "coach_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_contact_detail" ADD CONSTRAINT "coach_contact_detail_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_addon" ADD CONSTRAINT "coach_addon_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_addon_rate_rule" ADD CONSTRAINT "coach_addon_rate_rule_addon_id_coach_addon_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."coach_addon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_age_group" ADD CONSTRAINT "coach_age_group_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_block" ADD CONSTRAINT "coach_block_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_certification" ADD CONSTRAINT "coach_certification_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_hours_window" ADD CONSTRAINT "coach_hours_window_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_payment_method" ADD CONSTRAINT "coach_payment_method_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_photo" ADD CONSTRAINT "coach_photo_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_rate_rule" ADD CONSTRAINT "coach_rate_rule_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_review" ADD CONSTRAINT "coach_review_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_review" ADD CONSTRAINT "coach_review_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_review" ADD CONSTRAINT "coach_review_removed_by_user_id_users_id_fk" FOREIGN KEY ("removed_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_session_duration" ADD CONSTRAINT "coach_session_duration_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_session_type" ADD CONSTRAINT "coach_session_type_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_skill_level" ADD CONSTRAINT "coach_skill_level_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_specialty" ADD CONSTRAINT "coach_specialty_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_sport" ADD CONSTRAINT "coach_sport_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_sport" ADD CONSTRAINT "coach_sport_sport_id_sport_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sport"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_venue" ADD CONSTRAINT "coach_venue_coach_id_coach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coach"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_venue" ADD CONSTRAINT "coach_venue_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_venue" ADD CONSTRAINT "coach_venue_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_coach_location" ON "coach" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "idx_coach_city" ON "coach" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_coach_province" ON "coach" USING btree ("province");--> statement-breakpoint
CREATE INDEX "idx_coach_name_trgm" ON "coach" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coach_slug" ON "coach" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_coach_active" ON "coach" USING btree ("is_active") WHERE "coach"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_coach_featured_rank_unique" ON "coach" USING btree ("featured_rank") WHERE "coach"."featured_rank" > 0;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_coach_province_rank_per_province_unique" ON "coach" USING btree ("province","province_rank") WHERE "coach"."province_rank" > 0;--> statement-breakpoint
CREATE INDEX "idx_coach_addon_coach" ON "coach_addon" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "idx_coach_addon_rate_rule_addon" ON "coach_addon_rate_rule" USING btree ("addon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coach_age_group_coach_age_group" ON "coach_age_group" USING btree ("coach_id","age_group");--> statement-breakpoint
CREATE INDEX "idx_coach_block_coach_time" ON "coach_block" USING btree ("coach_id","start_time","end_time");--> statement-breakpoint
CREATE INDEX "idx_coach_hours_window_coach_day" ON "coach_hours_window" USING btree ("coach_id","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_coach_payment_method_unique" ON "coach_payment_method" USING btree ("coach_id","provider","account_number");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_coach_payment_method_default" ON "coach_payment_method" USING btree ("coach_id") WHERE "coach_payment_method"."is_default" = true;--> statement-breakpoint
CREATE INDEX "idx_coach_photo_coach_display_order" ON "coach_photo" USING btree ("coach_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_coach_rate_rule_coach_day" ON "coach_rate_rule" USING btree ("coach_id","day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coach_review_active_per_user" ON "coach_review" USING btree ("coach_id","author_user_id") WHERE "coach_review"."removed_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_coach_review_coach" ON "coach_review" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "idx_coach_review_author" ON "coach_review" USING btree ("author_user_id");--> statement-breakpoint
CREATE INDEX "idx_coach_review_active" ON "coach_review" USING btree ("coach_id","created_at") WHERE "coach_review"."removed_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coach_session_duration_coach_duration" ON "coach_session_duration" USING btree ("coach_id","duration_minutes");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coach_session_type_coach_session_type" ON "coach_session_type" USING btree ("coach_id","session_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coach_skill_level_coach_level" ON "coach_skill_level" USING btree ("coach_id","level");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coach_specialty_coach_name" ON "coach_specialty" USING btree ("coach_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coach_sport_coach_sport" ON "coach_sport" USING btree ("coach_id","sport_id");--> statement-breakpoint
CREATE INDEX "idx_coach_sport_sport" ON "coach_sport" USING btree ("sport_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coach_venue_active_per_place" ON "coach_venue" USING btree ("coach_id","place_id") WHERE "coach_venue"."status" IN ('PENDING', 'ACCEPTED');--> statement-breakpoint
CREATE INDEX "idx_coach_venue_place_status" ON "coach_venue" USING btree ("place_id","status");--> statement-breakpoint
CREATE INDEX "idx_coach_venue_coach_status" ON "coach_venue" USING btree ("coach_id","status");