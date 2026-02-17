-- Open Play (player-hosted sessions attached to a reservation) + Open Play chat thread

DO $$ BEGIN
  CREATE TYPE "open_play_status" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "open_play_visibility" AS ENUM ('PUBLIC', 'UNLISTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "open_play_join_policy" AS ENUM ('REQUEST', 'AUTO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "open_play_participant_role" AS ENUM ('HOST', 'PLAYER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "open_play_participant_status" AS ENUM ('REQUESTED', 'CONFIRMED', 'WAITLISTED', 'DECLINED', 'LEFT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "open_play" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reservation_id" uuid NOT NULL,
  "host_profile_id" uuid NOT NULL,
  "place_id" uuid NOT NULL,
  "court_id" uuid NOT NULL,
  "sport_id" uuid NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "status" "open_play_status" DEFAULT 'ACTIVE' NOT NULL,
  "visibility" "open_play_visibility" DEFAULT 'PUBLIC' NOT NULL,
  "join_policy" "open_play_join_policy" DEFAULT 'REQUEST' NOT NULL,
  "max_players" integer DEFAULT 4 NOT NULL,
  "title" varchar(80),
  "note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "open_play" ADD CONSTRAINT "open_play_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "open_play" ADD CONSTRAINT "open_play_host_profile_id_fk" FOREIGN KEY ("host_profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "open_play" ADD CONSTRAINT "open_play_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "open_play" ADD CONSTRAINT "open_play_court_id_fk" FOREIGN KEY ("court_id") REFERENCES "public"."court"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "open_play" ADD CONSTRAINT "open_play_sport_id_fk" FOREIGN KEY ("sport_id") REFERENCES "public"."sport"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_open_play_reservation" ON "open_play" ("reservation_id");
CREATE INDEX IF NOT EXISTS "idx_open_play_place_starts" ON "open_play" ("place_id", "starts_at");
CREATE INDEX IF NOT EXISTS "idx_open_play_status_starts" ON "open_play" ("status", "starts_at");
CREATE INDEX IF NOT EXISTS "idx_open_play_host" ON "open_play" ("host_profile_id");

CREATE TABLE IF NOT EXISTS "open_play_participant" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "open_play_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL,
  "role" "open_play_participant_role" NOT NULL,
  "status" "open_play_participant_status" NOT NULL,
  "message" text,
  "decided_at" timestamp with time zone,
  "decided_by_profile_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "open_play_participant" ADD CONSTRAINT "open_play_participant_open_play_id_fk" FOREIGN KEY ("open_play_id") REFERENCES "public"."open_play"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "open_play_participant" ADD CONSTRAINT "open_play_participant_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "open_play_participant" ADD CONSTRAINT "open_play_participant_decided_by_profile_id_fk" FOREIGN KEY ("decided_by_profile_id") REFERENCES "public"."profile"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_open_play_participant_open_play_profile" ON "open_play_participant" ("open_play_id", "profile_id");
CREATE INDEX IF NOT EXISTS "idx_open_play_participant_open_play" ON "open_play_participant" ("open_play_id");
CREATE INDEX IF NOT EXISTS "idx_open_play_participant_profile" ON "open_play_participant" ("profile_id");
CREATE INDEX IF NOT EXISTS "idx_open_play_participant_open_play_status" ON "open_play_participant" ("open_play_id", "status");

-- Host uniqueness per open play
CREATE UNIQUE INDEX IF NOT EXISTS "uq_open_play_participant_host" ON "open_play_participant" ("open_play_id") WHERE role = 'HOST';

CREATE TABLE IF NOT EXISTS "open_play_chat_thread" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "open_play_id" uuid NOT NULL,
  "provider_id" varchar(20) NOT NULL,
  "provider_channel_type" varchar(32) NOT NULL,
  "provider_channel_id" varchar(128) NOT NULL,
  "created_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "open_play_chat_thread" ADD CONSTRAINT "open_play_chat_thread_open_play_id_fk" FOREIGN KEY ("open_play_id") REFERENCES "public"."open_play"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "open_play_chat_thread" ADD CONSTRAINT "open_play_chat_thread_created_by_user_id_auth_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_open_play_chat_thread_open_play" ON "open_play_chat_thread" ("open_play_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_open_play_chat_thread_provider_channel" ON "open_play_chat_thread" ("provider_id", "provider_channel_type", "provider_channel_id");
CREATE INDEX IF NOT EXISTS "idx_open_play_chat_thread_open_play_id" ON "open_play_chat_thread" ("open_play_id");
CREATE INDEX IF NOT EXISTS "idx_open_play_chat_thread_provider_channel" ON "open_play_chat_thread" ("provider_id", "provider_channel_type", "provider_channel_id");
