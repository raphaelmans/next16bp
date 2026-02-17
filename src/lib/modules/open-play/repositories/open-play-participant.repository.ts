import { and, eq, inArray, sql } from "drizzle-orm";
import {
  type InsertOpenPlayParticipant,
  type OpenPlayParticipantRecord,
  openPlayParticipant,
  type ProfileRecord,
  profile,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface OpenPlayParticipantWithProfile {
  participant: OpenPlayParticipantRecord;
  profile: Pick<ProfileRecord, "id" | "userId" | "displayName" | "avatarUrl">;
}

export type OpenPlayParticipantStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "WAITLISTED"
  | "DECLINED"
  | "LEFT";

export interface IOpenPlayParticipantRepository {
  findByOpenPlayIdAndProfileId(
    openPlayId: string,
    profileId: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayParticipantRecord | null>;
  listByOpenPlayId(
    openPlayId: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayParticipantRecord[]>;
  listWithProfilesByOpenPlayId(
    openPlayId: string,
    statuses: OpenPlayParticipantStatus[] | null,
    ctx?: RequestContext,
  ): Promise<OpenPlayParticipantWithProfile[]>;
  create(
    data: InsertOpenPlayParticipant,
    ctx?: RequestContext,
  ): Promise<OpenPlayParticipantRecord>;
  update(
    participantId: string,
    data: Partial<InsertOpenPlayParticipant>,
    ctx?: RequestContext,
  ): Promise<OpenPlayParticipantRecord>;
}

export class OpenPlayParticipantRepository
  implements IOpenPlayParticipantRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByOpenPlayIdAndProfileId(
    openPlayId: string,
    profileId: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayParticipantRecord | null> {
    const client = this.getClient(ctx);
    const [row] = await client
      .select()
      .from(openPlayParticipant)
      .where(
        and(
          eq(openPlayParticipant.openPlayId, openPlayId),
          eq(openPlayParticipant.profileId, profileId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listByOpenPlayId(
    openPlayId: string,
    ctx?: RequestContext,
  ): Promise<OpenPlayParticipantRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(openPlayParticipant)
      .where(eq(openPlayParticipant.openPlayId, openPlayId));
  }

  async listWithProfilesByOpenPlayId(
    openPlayId: string,
    statuses: OpenPlayParticipantStatus[] | null,
    ctx?: RequestContext,
  ): Promise<OpenPlayParticipantWithProfile[]> {
    const client = this.getClient(ctx);
    const conditions = [eq(openPlayParticipant.openPlayId, openPlayId)];
    if (statuses && statuses.length > 0) {
      conditions.push(inArray(openPlayParticipant.status, statuses));
    }

    const rows = await client
      .select({
        participant: openPlayParticipant,
        profile: {
          id: profile.id,
          userId: profile.userId,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
      })
      .from(openPlayParticipant)
      .innerJoin(profile, eq(openPlayParticipant.profileId, profile.id))
      .where(and(...conditions));

    return rows;
  }

  async create(
    data: InsertOpenPlayParticipant,
    ctx?: RequestContext,
  ): Promise<OpenPlayParticipantRecord> {
    const client = this.getClient(ctx);
    const [row] = await client
      .insert(openPlayParticipant)
      .values(data)
      .returning();
    return row;
  }

  async update(
    participantId: string,
    data: Partial<InsertOpenPlayParticipant>,
    ctx?: RequestContext,
  ): Promise<OpenPlayParticipantRecord> {
    const client = this.getClient(ctx);
    const [row] = await client
      .update(openPlayParticipant)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(openPlayParticipant.id, participantId))
      .returning();
    return row;
  }
}
