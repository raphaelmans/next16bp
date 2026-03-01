import { beforeEach, describe, expect, it, vi } from "vitest";

const getThreadMetasMock = vi.fn();
const requireMobileSessionMock = vi.fn();
const enforceRateLimitMock = vi.fn();

vi.mock("@/lib/modules/chat/factories/reservation-chat.factory", () => ({
  makeReservationChatService: () => ({
    getThreadMetas: getThreadMetasMock,
  }),
}));

vi.mock("@/lib/shared/infra/auth/mobile-session", () => ({
  requireMobileSession: (...args: unknown[]) =>
    requireMobileSessionMock(...args),
}));

vi.mock("@/lib/shared/infra/http/http-rate-limit", () => ({
  enforceRateLimit: (...args: unknown[]) => enforceRateLimitMock(...args),
}));

import { GET } from "@/app/api/mobile/v1/organization/chat/reservations/thread-metas/route";

const USER_ID = "6b169f98-fb4e-47cc-a3df-526f4c3f9eec";
const RESERVATION_ID_1 = "3438d7db-f3f0-4261-aee3-5352ff36e5b0";
const RESERVATION_ID_2 = "458d79c8-fba3-41e2-b3e3-3cba0951112d";
const GROUP_ID_1 = "1dd5e9dd-54af-4bcf-b578-f6ec7ce26216";
const GROUP_ID_2 = "9c2447bf-d749-4f2b-aeb6-f412cc8366f5";

describe("GET /api/mobile/v1/organization/chat/reservations/thread-metas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireMobileSessionMock.mockResolvedValue({
      userId: USER_ID,
      email: "owner@example.com",
    });
    enforceRateLimitMock.mockResolvedValue({ ok: true });
    getThreadMetasMock.mockResolvedValue([]);
  });

  it("reservationIds only -> calls service with object payload and defaults", async () => {
    // Arrange
    getThreadMetasMock.mockResolvedValueOnce([
      { threadId: `res-${RESERVATION_ID_1}` },
    ]);
    const req = new Request(
      `https://example.com/api/mobile/v1/organization/chat/reservations/thread-metas?reservationIds=${RESERVATION_ID_1},${RESERVATION_ID_2}`,
    );

    // Act
    const response = await GET(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(getThreadMetasMock).toHaveBeenCalledWith(USER_ID, {
      reservationIds: [RESERVATION_ID_1, RESERVATION_ID_2],
      reservationGroupIds: [],
      includeArchived: undefined,
    });
    expect(body).toEqual({
      data: [{ threadId: `res-${RESERVATION_ID_1}` }],
    });
  });

  it("reservationGroupIds only -> calls service with empty reservationIds", async () => {
    // Arrange
    const req = new Request(
      `https://example.com/api/mobile/v1/organization/chat/reservations/thread-metas?reservationGroupIds=${GROUP_ID_1}`,
    );

    // Act
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    expect(getThreadMetasMock).toHaveBeenCalledWith(USER_ID, {
      reservationIds: [],
      reservationGroupIds: [GROUP_ID_1],
      includeArchived: undefined,
    });
  });

  it("mixed ids + includeArchived=true -> forwards all query inputs", async () => {
    // Arrange
    const req = new Request(
      `https://example.com/api/mobile/v1/organization/chat/reservations/thread-metas?reservationIds=${RESERVATION_ID_1}&reservationGroupIds=${GROUP_ID_1},${GROUP_ID_2}&includeArchived=true`,
    );

    // Act
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(200);
    expect(getThreadMetasMock).toHaveBeenCalledWith(USER_ID, {
      reservationIds: [RESERVATION_ID_1],
      reservationGroupIds: [GROUP_ID_1, GROUP_ID_2],
      includeArchived: true,
    });
  });

  it("no query params -> forwards empty ids and returns wrapped response", async () => {
    // Arrange
    const req = new Request(
      "https://example.com/api/mobile/v1/organization/chat/reservations/thread-metas",
    );

    // Act
    const response = await GET(req);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(getThreadMetasMock).toHaveBeenCalledWith(USER_ID, {
      reservationIds: [],
      reservationGroupIds: [],
      includeArchived: undefined,
    });
    expect(body).toEqual({ data: [] });
  });
});
