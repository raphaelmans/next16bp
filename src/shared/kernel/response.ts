import { z } from "zod";

export type ApiResponse<T> = {
  data: T;
};

export interface ApiErrorResponse {
  code: string;
  message: string;
  requestId: string;
  details?: Record<string, unknown>;
}

/**
 * Creates a single resource response schema.
 */
export function createResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}
