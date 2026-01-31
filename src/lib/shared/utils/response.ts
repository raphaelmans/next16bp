import type { ApiResponse } from "@/lib/shared/kernel/response";

export function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}
