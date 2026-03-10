import { describe, expect, it } from "vitest";
import { scoreFacebookPageLead } from "@/lib/modules/automations/curated-ingestion/shared/facebook-page-scoring";

describe("facebook page lead scoring", () => {
  it("accepts stable facebook page/profile urls", () => {
    const result = scoreFacebookPageLead(
      {
        url: "https://www.facebook.com/dumaguetepickleballclub/",
        title: "Dumaguete Pickleball Club",
        description: "Pickleball club in Dumaguete City, Negros Oriental",
      },
      {
        city: "Dumaguete City",
        province: "Negros Oriental",
        sportSlug: "pickleball",
      },
    );

    expect(result.isLikelyPageLead).toBe(true);
  });

  it("rejects facebook groups and post urls", () => {
    const result = scoreFacebookPageLead(
      {
        url: "https://www.facebook.com/groups/1205096034544328/posts/1451865953200667/",
        title: "Pickleball bookings in Dumaguete City",
        description: "Community post",
      },
      {
        city: "Dumaguete City",
        province: "Negros Oriental",
        sportSlug: "pickleball",
      },
    );

    expect(result.isLikelyPageLead).toBe(false);
  });
});
