import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { CuratedPlaceEnhancementJudgementSchema } from "../shared/curated-place-enhancement.schemas";
import type {
  CuratedPlaceEnhancementJudge,
  CuratedPlaceEnhancementJudgement,
} from "./curated-place-enhancement.service";

const DEFAULT_JUDGE_MODEL = "gpt-5-mini";

export class OpenAiCuratedPlaceEnhancementJudge
  implements CuratedPlaceEnhancementJudge
{
  constructor(private model = DEFAULT_JUDGE_MODEL) {}

  async judge(input: Parameters<CuratedPlaceEnhancementJudge["judge"]>[0]) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const { object } = await generateObject({
      model: openai(this.model),
      schema: CuratedPlaceEnhancementJudgementSchema,
      system: [
        "You review and improve enhancement payloads for already-persisted sports venues.",
        "You decide whether a payload is safe to apply to the existing venue or must go to review.",
        "Use only the provided evidence and existing place snapshot. Do not invent missing facts.",
        "Only approve when the evidence strongly supports the same venue identity and scope.",
        "If the website, Facebook page, address, or contact signals look ambiguous, mismatched, or noisy, choose review.",
        "Improved payloads must be conservative and evidence-based.",
        "Do not change venue identity to a different place.",
      ].join(" "),
      prompt: [
        "Review this post-persistence enhancement candidate.",
        "",
        "Existing persisted place:",
        JSON.stringify(input.candidate, null, 2),
        "",
        "Extracted enhancement payload:",
        JSON.stringify(input.extraction.payload, null, 2),
        "",
        "Supporting evidence:",
        JSON.stringify(input.extraction.evidence, null, 2),
        "",
        "Decision rules:",
        "- venueIdentity: pass only if the evidence clearly matches the existing venue or a stronger version of the same venue.",
        "- locationScope: fail if the evidence points to a different city/province; uncertain if the address is too weak.",
        "- contactQuality: fail if links or contact details appear unrelated or conflicting; uncertain if sparse.",
        "- payloadQuality: fail or uncertain when the extracted payload looks noisy, generic, or unsupported by evidence.",
        "- Choose review for any ambiguous case. Choose approve only for safe, high-confidence updates.",
        "- improvedPayload must contain only fields supported by evidence; keep unsupported fields null or empty.",
      ].join("\n"),
    });

    return object satisfies CuratedPlaceEnhancementJudgement;
  }
}
