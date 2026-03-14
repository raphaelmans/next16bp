import { and, count, eq } from "drizzle-orm";
import {
  coach,
  coachHoursWindow,
  coachPaymentMethod,
  coachRateRule,
  coachSport,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { CoachSetupSnapshot } from "../shared";

export interface ICoachSetupRepository {
  findSetupSnapshotByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<CoachSetupSnapshot | null>;
}

export class CoachSetupRepository implements ICoachSetupRepository {
  constructor(private db: DbClient) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  async findSetupSnapshotByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<CoachSetupSnapshot | null> {
    const client = this.getClient(ctx);
    const [coachRow] = await client
      .select({
        coachId: coach.id,
        name: coach.name,
        tagline: coach.tagline,
        bio: coach.bio,
        city: coach.city,
        province: coach.province,
      })
      .from(coach)
      .where(eq(coach.userId, userId))
      .limit(1);

    if (!coachRow) {
      return null;
    }

    const [sportsSummary, hoursSummary, rateRuleSummary, paymentSummary] =
      await Promise.all([
        client
          .select({ count: count() })
          .from(coachSport)
          .where(eq(coachSport.coachId, coachRow.coachId)),
        client
          .select({ count: count() })
          .from(coachHoursWindow)
          .where(eq(coachHoursWindow.coachId, coachRow.coachId)),
        client
          .select({ count: count() })
          .from(coachRateRule)
          .where(eq(coachRateRule.coachId, coachRow.coachId)),
        client
          .select({ count: count() })
          .from(coachPaymentMethod)
          .where(
            and(
              eq(coachPaymentMethod.coachId, coachRow.coachId),
              eq(coachPaymentMethod.isActive, true),
            ),
          ),
      ]);

    return {
      coachId: coachRow.coachId,
      name: coachRow.name,
      tagline: coachRow.tagline,
      bio: coachRow.bio,
      city: coachRow.city,
      province: coachRow.province,
      sportsCount: sportsSummary[0]?.count ?? 0,
      hoursCount: hoursSummary[0]?.count ?? 0,
      rateRuleCount: rateRuleSummary[0]?.count ?? 0,
      paymentMethodCount: paymentSummary[0]?.count ?? 0,
    };
  }
}
