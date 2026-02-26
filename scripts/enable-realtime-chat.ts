/**
 * Enables Supabase Realtime for the chat_message table.
 *
 * Adds chat_message to the supabase_realtime publication so WAL events
 * are broadcast to Realtime subscribers. Drizzle db:push skips raw SQL,
 * so this publication change must be applied separately.
 *
 * Usage:
 *   pnpm dotenvx run -- npx tsx scripts/enable-realtime-chat.ts
 *
 * Features:
 *   - Idempotent: skips if chat_message is already in the publication
 */

import postgres from "postgres";

async function enableRealtimeChat() {
  console.log("Enabling Supabase Realtime for chat_message...\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);

  try {
    // Check if chat_message is already in the publication
    const existing = await client`
			SELECT tablename
			FROM pg_publication_tables
			WHERE pubname = 'supabase_realtime'
			  AND schemaname = 'public'
			  AND tablename = 'chat_message'
		`;

    if (existing.length > 0) {
      console.log(
        "  chat_message is already in supabase_realtime publication. Skipping.",
      );
    } else {
      await client`
				ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message
			`;
      console.log("  Added chat_message to supabase_realtime publication.");
    }

    // Verify current state
    const tables = await client`
			SELECT schemaname, tablename
			FROM pg_publication_tables
			WHERE pubname = 'supabase_realtime'
			ORDER BY schemaname, tablename
		`;

    console.log("\n--- supabase_realtime publication tables ---");
    for (const row of tables) {
      console.log(`  ${row.schemaname}.${row.tablename}`);
    }

    console.log("\nDone!");
  } catch (error) {
    console.error("Failed to enable realtime for chat_message:", error);
    throw error;
  } finally {
    await client.end();
  }
}

enableRealtimeChat()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
