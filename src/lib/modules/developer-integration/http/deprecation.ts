import type { NextResponse } from "next/server";

const DEVELOPER_MANAGEMENT_DEPRECATION_HEADERS = {
  Deprecation: "true",
  Sunset: "Thu, 31 Dec 2026 00:00:00 GMT",
} as const;

export function applyDeveloperManagementDeprecationHeaders(
  response: NextResponse,
) {
  for (const [key, value] of Object.entries(
    DEVELOPER_MANAGEMENT_DEPRECATION_HEADERS,
  )) {
    response.headers.set(key, value);
  }

  return response;
}
