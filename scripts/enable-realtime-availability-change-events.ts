/**
 * Enables Supabase Realtime for the availability_change_event table.
 *
 * Usage:
 *   pnpm dotenvx run -- npx tsx scripts/enable-realtime-availability-change-events.ts
 */

import postgres from "postgres";

async function enableRealtimeAvailabilityChangeEvents() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);

  try {
    const existing = await client`
      SELECT tablename
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'availability_change_event'
    `;

    if (existing.length === 0) {
      await client`
        ALTER PUBLICATION supabase_realtime ADD TABLE public.availability_change_event
      `;
    }
  } finally {
    await client.end();
  }
}

enableRealtimeAvailabilityChangeEvents()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
