import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { PLACE_EMBEDDING_MODEL } from "../place-embedding";

export interface IPlaceSearchEmbeddingService {
  embedQuery(query: string): Promise<number[] | null>;
}

export class PlaceSearchEmbeddingService
  implements IPlaceSearchEmbeddingService
{
  private cache = new Map<string, number[]>();

  async embedQuery(query: string): Promise<number[] | null> {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }

    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    const cached = this.cache.get(normalized);
    if (cached) {
      return cached;
    }

    const result = await embed({
      model: openai.textEmbeddingModel(PLACE_EMBEDDING_MODEL),
      value: normalized,
    });

    this.cache.set(normalized, result.embedding);
    return result.embedding;
  }
}
