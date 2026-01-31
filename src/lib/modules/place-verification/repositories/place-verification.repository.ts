import { and, eq, inArray } from "drizzle-orm";
import {
  type InsertPlaceVerification,
  type InsertPlaceVerificationRequest,
  type InsertPlaceVerificationRequestDocument,
  type InsertPlaceVerificationRequestEvent,
  type PlaceVerificationRecord,
  type PlaceVerificationRequestDocumentRecord,
  type PlaceVerificationRequestEventRecord,
  type PlaceVerificationRequestRecord,
  place,
  placeVerification,
  placeVerificationRequest,
  placeVerificationRequestDocument,
  placeVerificationRequestEvent,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IPlaceVerificationRepository {
  findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRecord | null>;
  findByPlaceIds(
    placeIds: string[],
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRecord[]>;
  upsert(
    data: InsertPlaceVerification,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRecord>;
  update(
    placeId: string,
    data: Partial<InsertPlaceVerification>,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRecord>;
}

export interface IPlaceVerificationRequestRepository {
  findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestRecord | null>;
  findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<PlaceVerificationRequestRecord | null>;
  findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestRecord[]>;
  findPendingByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestRecord | null>;
  findPending(
    pagination: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<{
    items: {
      request: PlaceVerificationRequestRecord;
      placeName: string;
    }[];
    total: number;
  }>;
  create(
    data: InsertPlaceVerificationRequest,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestRecord>;
  update(
    id: string,
    data: Partial<InsertPlaceVerificationRequest>,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestRecord>;
}

export interface IPlaceVerificationRequestEventRepository {
  findByRequestId(
    requestId: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestEventRecord[]>;
  create(
    data: InsertPlaceVerificationRequestEvent,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestEventRecord>;
}

export interface IPlaceVerificationRequestDocumentRepository {
  findByRequestId(
    requestId: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestDocumentRecord[]>;
  createMany(
    data: InsertPlaceVerificationRequestDocument[],
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestDocumentRecord[]>;
}

export class PlaceVerificationRepository
  implements IPlaceVerificationRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(placeVerification)
      .where(eq(placeVerification.placeId, placeId))
      .limit(1);

    return result[0] ?? null;
  }

  async findByPlaceIds(
    placeIds: string[],
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRecord[]> {
    if (placeIds.length === 0) return [];
    const client = this.getClient(ctx);
    return client
      .select()
      .from(placeVerification)
      .where(inArray(placeVerification.placeId, placeIds));
  }

  async upsert(
    data: InsertPlaceVerification,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(placeVerification)
      .values(data)
      .onConflictDoUpdate({
        target: placeVerification.placeId,
        set: {
          status: data.status,
          verifiedAt: data.verifiedAt ?? null,
          verifiedByUserId: data.verifiedByUserId ?? null,
          reservationsEnabled: data.reservationsEnabled ?? false,
          reservationsEnabledAt: data.reservationsEnabledAt ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }

  async update(
    placeId: string,
    data: Partial<InsertPlaceVerification>,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(placeVerification)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(placeVerification.placeId, placeId))
      .returning();

    return result[0];
  }
}

export class PlaceVerificationRequestRepository
  implements IPlaceVerificationRequestRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(placeVerificationRequest)
      .where(eq(placeVerificationRequest.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByIdForUpdate(
    id: string,
    ctx: RequestContext,
  ): Promise<PlaceVerificationRequestRecord | null> {
    const client = this.getClient(ctx) as DrizzleTransaction;
    const result = await client
      .select()
      .from(placeVerificationRequest)
      .where(eq(placeVerificationRequest.id, id))
      .for("update")
      .limit(1);

    return result[0] ?? null;
  }

  async findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(placeVerificationRequest)
      .where(eq(placeVerificationRequest.placeId, placeId));
  }

  async findPendingByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestRecord | null> {
    const client = this.getClient(ctx);
    const result = await client
      .select()
      .from(placeVerificationRequest)
      .where(
        and(
          eq(placeVerificationRequest.placeId, placeId),
          eq(placeVerificationRequest.status, "PENDING"),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async findPending(
    pagination: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<{
    items: {
      request: PlaceVerificationRequestRecord;
      placeName: string;
    }[];
    total: number;
  }> {
    const client = this.getClient(ctx);

    const items = await client
      .select({
        request: placeVerificationRequest,
        placeName: place.name,
      })
      .from(placeVerificationRequest)
      .innerJoin(place, eq(place.id, placeVerificationRequest.placeId))
      .where(eq(placeVerificationRequest.status, "PENDING"))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const countResult = await client
      .select()
      .from(placeVerificationRequest)
      .where(eq(placeVerificationRequest.status, "PENDING"));

    return {
      items: items.map((item) => ({
        request: item.request,
        placeName: item.placeName,
      })),
      total: countResult.length,
    };
  }

  async create(
    data: InsertPlaceVerificationRequest,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(placeVerificationRequest)
      .values(data)
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<InsertPlaceVerificationRequest>,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .update(placeVerificationRequest)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(placeVerificationRequest.id, id))
      .returning();
    return result[0];
  }
}

export class PlaceVerificationRequestEventRepository
  implements IPlaceVerificationRequestEventRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByRequestId(
    requestId: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestEventRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(placeVerificationRequestEvent)
      .where(
        eq(placeVerificationRequestEvent.placeVerificationRequestId, requestId),
      )
      .orderBy(placeVerificationRequestEvent.createdAt);
  }

  async create(
    data: InsertPlaceVerificationRequestEvent,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestEventRecord> {
    const client = this.getClient(ctx);
    const result = await client
      .insert(placeVerificationRequestEvent)
      .values(data)
      .returning();
    return result[0];
  }
}

export class PlaceVerificationRequestDocumentRepository
  implements IPlaceVerificationRequestDocumentRepository
{
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByRequestId(
    requestId: string,
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestDocumentRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(placeVerificationRequestDocument)
      .where(
        eq(
          placeVerificationRequestDocument.placeVerificationRequestId,
          requestId,
        ),
      );
  }

  async createMany(
    data: InsertPlaceVerificationRequestDocument[],
    ctx?: RequestContext,
  ): Promise<PlaceVerificationRequestDocumentRecord[]> {
    if (data.length === 0) return [];
    const client = this.getClient(ctx);
    const result = await client
      .insert(placeVerificationRequestDocument)
      .values(data)
      .returning();
    return result;
  }
}
