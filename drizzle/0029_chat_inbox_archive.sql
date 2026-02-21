-- Per-user inbox archive overlay for reservation/support chat threads

CREATE TABLE IF NOT EXISTS "chat_inbox_archive" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "thread_kind" text NOT NULL,
  "thread_id" text NOT NULL,
  "archived_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "chat_inbox_archive_thread_kind_check" CHECK ("thread_kind" in ('reservation', 'support'))
);

DO $$ BEGIN
  ALTER TABLE "chat_inbox_archive" ADD CONSTRAINT "chat_inbox_archive_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_chat_inbox_archive_user_thread" ON "chat_inbox_archive" ("user_id", "thread_kind", "thread_id");
CREATE INDEX IF NOT EXISTS "idx_chat_inbox_archive_user_kind" ON "chat_inbox_archive" ("user_id", "thread_kind");
