import { and, count, desc, eq, inArray } from "drizzle-orm";
import {
  type PlaceBookmarkRecord,
  place,
  placeBookmark,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface PlaceBookmarkListItem {
  id: string;
  placeId: string;
  createdAt: Date;
  place: {
    id: string;
    slug: string;
    name: string;
    address: string;
    city: string;
    placeType: string;
    featuredRank: number;
    provinceRank: number;
  };
}

export interface IPlaceBookmarkRepository {
  create(
    profileId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceBookmarkRecord>;
  deleteByProfileAndPlace(
    profileId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<boolean>;
  existsByProfileAndPlace(
    profileId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<boolean>;
  findBookmarkedPlaceIds(
    profileId: string,
    placeIds: string[],
    ctx?: RequestContext,
  ): Promise<string[]>;
  listByProfile(
    profileId: string,
    params: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<{ items: PlaceBookmarkListItem[]; total: number }>;
}

export class PlaceBookmarkRepository implements IPlaceBookmarkRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async create(
    profileId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceBookmarkRecord> {
    const client = this.getClient(ctx);
    const [result] = await client
      .insert(placeBookmark)
      .values({ profileId, placeId })
      .returning();
    return result;
  }

  async deleteByProfileAndPlace(
    profileId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<boolean> {
    const client = this.getClient(ctx);
    const result = await client
      .delete(placeBookmark)
      .where(
        and(
          eq(placeBookmark.profileId, profileId),
          eq(placeBookmark.placeId, placeId),
        ),
      )
      .returning({ id: placeBookmark.id });
    return result.length > 0;
  }

  async existsByProfileAndPlace(
    profileId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<boolean> {
    const client = this.getClient(ctx);
    const result = await client
      .select({ id: placeBookmark.id })
      .from(placeBookmark)
      .where(
        and(
          eq(placeBookmark.profileId, profileId),
          eq(placeBookmark.placeId, placeId),
        ),
      )
      .limit(1);
    return result.length > 0;
  }

  async findBookmarkedPlaceIds(
    profileId: string,
    placeIds: string[],
    ctx?: RequestContext,
  ): Promise<string[]> {
    if (placeIds.length === 0) return [];
    const client = this.getClient(ctx);
    const result = await client
      .select({ placeId: placeBookmark.placeId })
      .from(placeBookmark)
      .where(
        and(
          eq(placeBookmark.profileId, profileId),
          inArray(placeBookmark.placeId, placeIds),
        ),
      );
    return result.map((r) => r.placeId);
  }

  async listByProfile(
    profileId: string,
    params: { limit: number; offset: number },
    ctx?: RequestContext,
  ): Promise<{ items: PlaceBookmarkListItem[]; total: number }> {
    const client = this.getClient(ctx);

    const [items, totalResult] = await Promise.all([
      client
        .select({
          id: placeBookmark.id,
          placeId: placeBookmark.placeId,
          createdAt: placeBookmark.createdAt,
          place: {
            id: place.id,
            slug: place.slug,
            name: place.name,
            address: place.address,
            city: place.city,
            placeType: place.placeType,
            featuredRank: place.featuredRank,
            provinceRank: place.provinceRank,
          },
        })
        .from(placeBookmark)
        .innerJoin(place, eq(placeBookmark.placeId, place.id))
        .where(eq(placeBookmark.profileId, profileId))
        .orderBy(desc(placeBookmark.createdAt))
        .limit(params.limit)
        .offset(params.offset),
      client
        .select({ value: count() })
        .from(placeBookmark)
        .where(eq(placeBookmark.profileId, profileId)),
    ]);

    return {
      items: items as PlaceBookmarkListItem[],
      total: totalResult[0]?.value ?? 0,
    };
  }
}
