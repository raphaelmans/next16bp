create table if not exists "availability_change_event" (
  "id" uuid primary key default gen_random_uuid() not null,
  "source_kind" varchar(32) not null,
  "source_event" varchar(64) not null,
  "source_id" uuid not null,
  "court_id" uuid not null references "court"("id") on delete cascade,
  "place_id" uuid not null references "place"("id") on delete cascade,
  "sport_id" uuid not null references "sport"("id") on delete restrict,
  "start_time" timestamp with time zone not null,
  "end_time" timestamp with time zone not null,
  "slot_status" varchar(16) not null,
  "unavailable_reason" varchar(32),
  "total_price_cents" integer,
  "currency" varchar(3),
  "created_at" timestamp with time zone default now() not null
);

create index if not exists "idx_availability_change_event_court_created"
  on "availability_change_event" using btree ("court_id", "created_at");

create index if not exists "idx_availability_change_event_place_sport_created"
  on "availability_change_event" using btree ("place_id", "sport_id", "created_at");

create index if not exists "idx_availability_change_event_source"
  on "availability_change_event" using btree ("source_kind", "source_id", "created_at");
