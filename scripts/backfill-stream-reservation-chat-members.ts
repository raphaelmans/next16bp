import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { StreamChat } from "stream-chat";
import * as schema from "../src/lib/shared/infra/db/schema";

type CliOptions = {
  apply: boolean;
  limit: number | null;
  reservationId: string | null;
};

type Summary = {
  scanned: number;
  missingContext: number;
  missingChannel: number;
  alreadySynced: number;
  threadsNeedingUpdate: number;
  missingMemberCount: number;
  appliedCreates: number;
  appliedUpdates: number;
  dryRunCreates: number;
  dryRunUpdates: number;
  failures: number;
};

function parseArgs(argv: string[]): CliOptions {
  let apply = false;
  let limit: number | null = null;
  let reservationId: string | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--apply") {
      apply = true;
      continue;
    }

    if (arg === "--limit") {
      const raw = argv[i + 1];
      if (!raw) {
        throw new Error("Missing value for --limit");
      }
      const parsed = Number(raw);
      if (
        !Number.isFinite(parsed) ||
        parsed <= 0 ||
        !Number.isInteger(parsed)
      ) {
        throw new Error("--limit must be a positive integer");
      }
      limit = parsed;
      i += 1;
      continue;
    }

    if (arg === "--reservation-id") {
      const raw = argv[i + 1];
      if (!raw) {
        throw new Error("Missing value for --reservation-id");
      }
      reservationId = raw;
      i += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.info(
        [
          "Usage: tsx scripts/backfill-stream-reservation-chat-members.ts [options]",
          "",
          "Options:",
          "  --apply                     Apply membership repairs (default is dry-run)",
          "  --limit <n>                 Limit number of reservation threads scanned",
          "  --reservation-id <id>       Restrict scan to a single reservation id",
          "  --help                      Show this help message",
        ].join("\n"),
      );
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { apply, limit, reservationId };
}

function isIgnorableStreamMembershipError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code =
    "code" in error && typeof error.code === "number" ? error.code : null;
  const status =
    "status" in error && typeof error.status === "number" ? error.status : null;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  return (
    code === 4 ||
    status === 404 ||
    status === 409 ||
    message.includes("already exists") ||
    message.includes("duplicate")
  );
}

async function listExpectedMemberIds(options: {
  db: ReturnType<typeof drizzle>;
  reservationId: string;
}): Promise<{
  organizationId: string;
  ownerUserId: string;
  playerUserId: string;
  memberIds: string[];
} | null> {
  const contextRows = await options.db
    .select({
      organizationId: schema.organization.id,
      ownerUserId: schema.organization.ownerUserId,
      playerUserId: schema.profile.userId,
    })
    .from(schema.reservation)
    .innerJoin(
      schema.profile,
      eq(schema.reservation.playerId, schema.profile.id),
    )
    .innerJoin(schema.court, eq(schema.reservation.courtId, schema.court.id))
    .innerJoin(schema.place, eq(schema.court.placeId, schema.place.id))
    .innerJoin(
      schema.organization,
      eq(schema.place.organizationId, schema.organization.id),
    )
    .where(eq(schema.reservation.id, options.reservationId))
    .limit(1);

  const context = contextRows[0];
  if (!context) {
    return null;
  }

  const memberRows = await options.db
    .select({ userId: schema.organizationMember.userId })
    .from(schema.organizationMember)
    .where(
      and(
        eq(schema.organizationMember.organizationId, context.organizationId),
        eq(schema.organizationMember.status, "ACTIVE"),
        sql`${schema.organizationMember.permissions} ? ${"reservation.chat"}`,
      ),
    );

  const ownerParticipantIds = Array.from(
    new Set([context.ownerUserId, ...memberRows.map((row) => row.userId)]),
  );

  return {
    organizationId: context.organizationId,
    ownerUserId: context.ownerUserId,
    playerUserId: context.playerUserId,
    memberIds: Array.from(
      new Set([context.playerUserId, ...ownerParticipantIds]),
    ),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const provider = process.env.CHAT_PROVIDER ?? "supabase";

  if (provider !== "stream") {
    console.info(
      `Skipping stream chat member backfill because CHAT_PROVIDER is '${provider}'.`,
    );
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const streamApiKey = process.env.STREAM_CHAT_API_KEY;
  const streamApiSecret = process.env.STREAM_CHAT_API_SECRET;

  if (!streamApiKey || !streamApiSecret) {
    throw new Error(
      "STREAM_CHAT_API_KEY and STREAM_CHAT_API_SECRET environment variables are required",
    );
  }

  const sqlClient = postgres(connectionString);
  const db = drizzle(sqlClient, { schema });
  const streamClient = new StreamChat(streamApiKey, streamApiSecret, {
    disableCache: true,
  });

  const summary: Summary = {
    scanned: 0,
    missingContext: 0,
    missingChannel: 0,
    alreadySynced: 0,
    threadsNeedingUpdate: 0,
    missingMemberCount: 0,
    appliedCreates: 0,
    appliedUpdates: 0,
    dryRunCreates: 0,
    dryRunUpdates: 0,
    failures: 0,
  };

  try {
    const filters = [
      eq(schema.reservationChatThread.providerId, "stream"),
      eq(schema.reservationChatThread.providerChannelType, "messaging"),
    ];

    if (options.reservationId) {
      filters.push(
        eq(schema.reservationChatThread.reservationId, options.reservationId),
      );
    }

    const threadQuery = db
      .select({
        reservationId: schema.reservationChatThread.reservationId,
        channelType: schema.reservationChatThread.providerChannelType,
        channelId: schema.reservationChatThread.providerChannelId,
        createdByUserId: schema.reservationChatThread.createdByUserId,
      })
      .from(schema.reservationChatThread)
      .where(and(...filters));

    const threads =
      options.limit === null
        ? await threadQuery
        : await threadQuery.limit(options.limit);

    console.info(
      `${options.apply ? "Applying" : "Dry-run"} stream membership sync for ${threads.length} reservation threads...`,
    );

    for (const thread of threads) {
      summary.scanned += 1;

      try {
        const expected = await listExpectedMemberIds({
          db,
          reservationId: thread.reservationId,
        });

        if (!expected) {
          summary.missingContext += 1;
          continue;
        }

        const channels = await streamClient.queryChannels(
          {
            type: thread.channelType,
            id: { $eq: thread.channelId },
          },
          {},
          { limit: 1 },
        );

        const channel = channels[0] ?? null;
        const createdById =
          thread.createdByUserId ??
          expected.ownerUserId ??
          expected.playerUserId;

        if (!channel) {
          summary.missingChannel += 1;

          if (!options.apply) {
            summary.dryRunCreates += 1;
            continue;
          }

          await streamClient.upsertUsers(
            expected.memberIds.map((id) => ({
              id,
            })),
          );

          const created = streamClient.channel(
            thread.channelType,
            thread.channelId,
            {
              created_by_id: createdById,
              members: expected.memberIds,
              reservation_id: thread.reservationId,
            },
          );

          await created.create();
          summary.appliedCreates += 1;
          continue;
        }

        const existingMemberIds = new Set(
          Object.keys(channel.state.members ?? {}),
        );
        const missingMemberIds = expected.memberIds.filter(
          (memberId) => !existingMemberIds.has(memberId),
        );

        if (missingMemberIds.length === 0) {
          summary.alreadySynced += 1;
          continue;
        }

        summary.threadsNeedingUpdate += 1;
        summary.missingMemberCount += missingMemberIds.length;

        if (!options.apply) {
          summary.dryRunUpdates += 1;
          continue;
        }

        await streamClient.upsertUsers(
          expected.memberIds.map((id) => ({
            id,
          })),
        );

        try {
          await channel.addMembers(missingMemberIds);
          summary.appliedUpdates += 1;
        } catch (error) {
          if (!isIgnorableStreamMembershipError(error)) {
            throw error;
          }
        }
      } catch (error) {
        summary.failures += 1;
        console.error(
          `Failed to process reservation ${thread.reservationId} (${thread.channelId})`,
          error,
        );
      }
    }

    console.info("\nSummary");
    console.info(`- scanned: ${summary.scanned}`);
    console.info(`- missing context: ${summary.missingContext}`);
    console.info(`- missing channels: ${summary.missingChannel}`);
    console.info(`- already synced: ${summary.alreadySynced}`);
    console.info(`- threads needing update: ${summary.threadsNeedingUpdate}`);
    console.info(`- missing member count: ${summary.missingMemberCount}`);
    console.info(`- dry-run creates: ${summary.dryRunCreates}`);
    console.info(`- dry-run updates: ${summary.dryRunUpdates}`);
    console.info(`- applied creates: ${summary.appliedCreates}`);
    console.info(`- applied updates: ${summary.appliedUpdates}`);
    console.info(`- failures: ${summary.failures}`);
  } finally {
    await sqlClient.end();
  }
}

main().catch((error) => {
  console.error("Stream reservation chat member backfill failed", error);
  process.exit(1);
});
