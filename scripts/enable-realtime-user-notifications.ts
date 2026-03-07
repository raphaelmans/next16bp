/**
 * Enables Supabase Realtime for the user_notification table.
 *
 * Usage:
 *   pnpm dotenvx run -- npx tsx scripts/enable-realtime-user-notifications.ts
 */

import postgres from "postgres";

async function enableRealtimeUserNotifications() {
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
        AND tablename = 'user_notification'
    `;

    if (existing.length === 0) {
      await client`
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notification
      `;
    }
  } finally {
    await client.end();
  }
}

enableRealtimeUserNotifications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
