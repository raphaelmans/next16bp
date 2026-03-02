alter table "organization_invitation"
  add column if not exists "failed_attempt_count" integer not null default 0;

alter table "organization_invitation"
  add column if not exists "cooldown_until" timestamp with time zone;

create index if not exists "idx_organization_invitation_cooldown_until"
  on "organization_invitation" using btree ("cooldown_until");
