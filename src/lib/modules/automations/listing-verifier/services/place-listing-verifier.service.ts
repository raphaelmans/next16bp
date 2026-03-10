import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { normalizeDecisionsForBatch } from "../shared/place-listing-verifier.domain";
import {
  type PlaceListingDecision,
  PlaceListingDecisionBatchSchema,
  type PlaceListingEvidence,
} from "../shared/place-listing-verifier.schemas";

export interface IPlaceListingVerifierService {
  verifyBatch(
    batch: PlaceListingEvidence[],
    options: { model: string },
  ): Promise<PlaceListingDecision[]>;
}

export class PlaceListingVerifierService
  implements IPlaceListingVerifierService
{
  async verifyBatch(
    batch: PlaceListingEvidence[],
    options: { model: string },
  ): Promise<PlaceListingDecision[]> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const { object } = await generateObject({
      model: openai(options.model),
      schema: PlaceListingDecisionBatchSchema,
      system: [
        "You are a strict place-listing verifier for an admin cleanup workflow.",
        "You classify each place into keep, review, or remove.",
        "Use only the provided evidence. Do not invent facts.",
        "remove is for obvious non-production, obvious test data, or obvious placeholder records.",
        "review is for uncertain or weak-confidence rows, including missing trust signals or possible duplicates.",
        "keep is for credible active listings that look production-worthy from the evidence.",
        "If baselineFlags contains nonprod_slug, generic_slug, or generic_name, you must return remove.",
        "If baselineFlags contains missing_location, you must not return keep.",
        "If baselineFlags contains missing_trust_signal and no stronger remove flag exists, prefer review.",
        "Trust signals like photos, contact details, or claimed status do not override generic_slug or generic_name.",
        "Return exactly one decision per placeId in the input batch.",
      ].join(" "),
      prompt: [
        "Return one decision per place using the provided schema.",
        "Follow this label precedence: remove > review > keep.",
        "Respect the deterministic baseline suggestion unless the evidence clearly resolves a weaker flag upward.",
        "",
        "Places JSON:",
        JSON.stringify(batch),
      ].join("\n"),
    });

    return normalizeDecisionsForBatch(batch, object.decisions);
  }
}
