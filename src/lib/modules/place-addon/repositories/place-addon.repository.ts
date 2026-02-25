import { and, eq, inArray } from "drizzle-orm";
import {
  type InsertPlaceAddon,
  type InsertPlaceAddonRateRule,
  type PlaceAddonRateRuleRecord,
  type PlaceAddonRecord,
  placeAddon,
  placeAddonRateRule,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";

export interface IPlaceAddonRepository {
  findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceAddonRecord[]>;
  findActiveByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceAddonRecord[]>;
  findRateRulesByAddonIds(
    addonIds: string[],
    ctx?: RequestContext,
  ): Promise<PlaceAddonRateRuleRecord[]>;
  deleteByPlaceId(placeId: string, ctx?: RequestContext): Promise<void>;
  createOne(
    data: InsertPlaceAddon,
    ctx?: RequestContext,
  ): Promise<PlaceAddonRecord>;
  createManyRateRules(
    data: InsertPlaceAddonRateRule[],
    ctx?: RequestContext,
  ): Promise<PlaceAddonRateRuleRecord[]>;
}

export class PlaceAddonRepository implements IPlaceAddonRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceAddonRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(placeAddon)
      .where(eq(placeAddon.placeId, placeId));
  }

  async findActiveByPlaceId(
    placeId: string,
    ctx?: RequestContext,
  ): Promise<PlaceAddonRecord[]> {
    const client = this.getClient(ctx);
    return client
      .select()
      .from(placeAddon)
      .where(
        and(eq(placeAddon.placeId, placeId), eq(placeAddon.isActive, true)),
      );
  }

  async findRateRulesByAddonIds(
    addonIds: string[],
    ctx?: RequestContext,
  ): Promise<PlaceAddonRateRuleRecord[]> {
    const client = this.getClient(ctx);
    if (addonIds.length === 0) return [];
    return client
      .select()
      .from(placeAddonRateRule)
      .where(inArray(placeAddonRateRule.addonId, addonIds));
  }

  async deleteByPlaceId(placeId: string, ctx?: RequestContext): Promise<void> {
    const client = this.getClient(ctx);
    await client.delete(placeAddon).where(eq(placeAddon.placeId, placeId));
  }

  async createOne(
    data: InsertPlaceAddon,
    ctx?: RequestContext,
  ): Promise<PlaceAddonRecord> {
    const client = this.getClient(ctx);
    const result = await client.insert(placeAddon).values(data).returning();
    const inserted = result[0];
    if (!inserted) {
      throw new Error("Failed to insert place addon");
    }
    return inserted;
  }

  async createManyRateRules(
    data: InsertPlaceAddonRateRule[],
    ctx?: RequestContext,
  ): Promise<PlaceAddonRateRuleRecord[]> {
    const client = this.getClient(ctx);
    if (data.length === 0) return [];
    return client.insert(placeAddonRateRule).values(data).returning();
  }
}
