import { and, eq, inArray, sql } from "drizzle-orm";
import {
  type ExternalOpenPlayParticipantRecord,
  externalOpenPlayParticipant,
  type InsertExternalOpenPlayParticipant,
  type ProfileRecord,
  profile,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface ExternalOpenPlayParticipantWithProfile {
  participant: ExternalOpenPlayParticipantRecord;
  profile: Pick<ProfileRecord, "id" | "userId" | "displayName" | "avatarUrl">;
}

export type ExternalOpenPlayParticipantStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "WAITLISTED"
  | "DECLINED"
  | "LEFT";

export interface IExternalOpenPlayParticipantRepository {
  findById(
    participantId: string,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantRecord | null>;
  findByOpenPlayIdAndProfileId(
    externalOpenPlayId: string,
    profileId: string,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantRecord | null>;
  listByOpenPlayId(
    externalOpenPlayId: string,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantRecord[]>;
  listWithProfilesByOpenPlayId(
    externalOpenPlayId: string,
    statuses: ExternalOpenPlayParticipantStatus[] | null,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantWithProfile[]>;
  create(
    data: InsertExternalOpenPlayParticipant,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantRecord>;
  update(
    participantId: string,
    data: Partial<InsertExternalOpenPlayParticipant>,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantRecord>;
}

export class ExternalOpenPlayParticipantRepository
  implements IExternalOpenPlayParticipantRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    participantId: string,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantRecord | null> {
    const client = this.getClient(ctx);
    const [row] = await client
      .select()
      .from(externalOpenPlayParticipant)
      .where(eq(externalOpenPlayParticipant.id, participantId))
      .limit(1);
    return row ?? null;
  }

  async findByOpenPlayIdAndProfileId(
    externalOpenPlayId: string,
    profileId: string,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantRecord | null> {
    const client = this.getClient(ctx);
    const [row] = await client
      .select()
      .from(externalOpenPlayParticipant)
      .where(
        and(
          eq(
            externalOpenPlayParticipant.externalOpenPlayId,
            externalOpenPlayId,
          ),
          eq(externalOpenPlayParticipant.profileId, profileId),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async listByOpenPlayId(
    externalOpenPlayId: string,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(externalOpenPlayParticipant)
      .where(
        eq(externalOpenPlayParticipant.externalOpenPlayId, externalOpenPlayId),
      );
  }

  async listWithProfilesByOpenPlayId(
    externalOpenPlayId: string,
    statuses: ExternalOpenPlayParticipantStatus[] | null,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantWithProfile[]> {
    const client = this.getClient(ctx);
    const conditions = [
      eq(externalOpenPlayParticipant.externalOpenPlayId, externalOpenPlayId),
    ];

    if (statuses && statuses.length > 0) {
      conditions.push(inArray(externalOpenPlayParticipant.status, statuses));
    }

    const rows = await client
      .select({
        participant: externalOpenPlayParticipant,
        profile: {
          id: profile.id,
          userId: profile.userId,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
      })
      .from(externalOpenPlayParticipant)
      .innerJoin(profile, eq(externalOpenPlayParticipant.profileId, profile.id))
      .where(and(...conditions));

    return rows;
  }

  async create(
    data: InsertExternalOpenPlayParticipant,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantRecord> {
    const client = this.getClient(ctx);
    const [row] = await client
      .insert(externalOpenPlayParticipant)
      .values(data)
      .returning();
    return row;
  }

  async update(
    participantId: string,
    data: Partial<InsertExternalOpenPlayParticipant>,
    ctx?: RequestContext,
  ): Promise<ExternalOpenPlayParticipantRecord> {
    const client = this.getClient(ctx);
    const [row] = await client
      .update(externalOpenPlayParticipant)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(externalOpenPlayParticipant.id, participantId))
      .returning();
    return row;
  }
}
