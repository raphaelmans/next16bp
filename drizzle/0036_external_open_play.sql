DO $$ BEGIN
  CREATE TYPE "external_open_play_status" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED', 'PROMOTED', 'HIDDEN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "external_open_play_source_platform" AS ENUM ('RECLUB', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "external_open_play_report_reason" AS ENUM ('FAKE_SLOT', 'IMPERSONATION', 'SPAM', 'SAFETY', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "external_open_play" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "host_profile_id" uuid NOT NULL,
  "place_id" uuid NOT NULL,
  "sport_id" uuid NOT NULL,
  "court_label" varchar(120),
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "status" "external_open_play_status" DEFAULT 'ACTIVE' NOT NULL,
  "visibility" "open_play_visibility" DEFAULT 'PUBLIC' NOT NULL,
  "join_policy" "open_play_join_policy" DEFAULT 'REQUEST' NOT NULL,
  "max_players" integer DEFAULT 4 NOT NULL,
  "title" varchar(80),
  "note" text,
  "source_platform" "external_open_play_source_platform" DEFAULT 'OTHER' NOT NULL,
  "source_reference" text,
  "promoted_open_play_id" uuid,
  "report_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "external_open_play" ADD CONSTRAINT "external_open_play_host_profile_id_fk"
  FOREIGN KEY ("host_profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "external_open_play" ADD CONSTRAINT "external_open_play_place_id_fk"
  FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "external_open_play" ADD CONSTRAINT "external_open_play_sport_id_fk"
  FOREIGN KEY ("sport_id") REFERENCES "public"."sport"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "external_open_play" ADD CONSTRAINT "external_open_play_promoted_open_play_id_fk"
  FOREIGN KEY ("promoted_open_play_id") REFERENCES "public"."open_play"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "external_open_play" ADD CONSTRAINT "chk_external_open_play_time_order"
  CHECK ("ends_at" > "starts_at");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_external_open_play_place_starts"
  ON "external_open_play" ("place_id", "starts_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_external_open_play_status_starts"
  ON "external_open_play" ("status", "starts_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_external_open_play_host"
  ON "external_open_play" ("host_profile_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_external_open_play_promoted_open_play"
  ON "external_open_play" ("promoted_open_play_id")
  WHERE "promoted_open_play_id" IS NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "external_open_play_participant" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "external_open_play_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL,
  "role" "open_play_participant_role" NOT NULL,
  "status" "open_play_participant_status" NOT NULL,
  "message" text,
  "decided_at" timestamp with time zone,
  "decided_by_profile_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "external_open_play_participant" ADD CONSTRAINT "external_open_play_participant_open_play_id_fk"
  FOREIGN KEY ("external_open_play_id") REFERENCES "public"."external_open_play"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "external_open_play_participant" ADD CONSTRAINT "external_open_play_participant_profile_id_fk"
  FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "external_open_play_participant" ADD CONSTRAINT "external_open_play_participant_decided_by_profile_id_fk"
  FOREIGN KEY ("decided_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "uq_external_open_play_participant"
  ON "external_open_play_participant" ("external_open_play_id", "profile_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_external_open_play_participant_open_play_status"
  ON "external_open_play_participant" ("external_open_play_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_external_open_play_participant_profile"
  ON "external_open_play_participant" ("profile_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_external_open_play_host"
  ON "external_open_play_participant" ("external_open_play_id")
  WHERE "role" = 'HOST';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "external_open_play_report" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "external_open_play_id" uuid NOT NULL,
  "reporter_profile_id" uuid NOT NULL,
  "reason" "external_open_play_report_reason" NOT NULL,
  "details" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "external_open_play_report" ADD CONSTRAINT "external_open_play_report_open_play_id_fk"
  FOREIGN KEY ("external_open_play_id") REFERENCES "public"."external_open_play"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "external_open_play_report" ADD CONSTRAINT "external_open_play_report_reporter_profile_id_fk"
  FOREIGN KEY ("reporter_profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "uq_external_open_play_reporter"
  ON "external_open_play_report" ("external_open_play_id", "reporter_profile_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_external_open_play_report_open_play"
  ON "external_open_play_report" ("external_open_play_id");
