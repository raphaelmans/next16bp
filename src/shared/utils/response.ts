import type { ApiResponse } from "@/shared/kernel/response";

export function wrapResponse<T>(data: T): ApiResponse<T> {
  return { data };
}
