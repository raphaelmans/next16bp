import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  channelOnMock,
  channelSubscribeMock,
  removeChannelMock,
  supabaseChannelMock,
  supabaseClientMock,
} = vi.hoisted(() => {
  const channel = {
    on: vi.fn(),
    subscribe: vi.fn(),
  };

  channel.on.mockImplementation(() => channel);
  channel.subscribe.mockImplementation(() => channel);

  const supabase = {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(async () => undefined),
  };

  return {
    channelOnMock: channel.on,
    channelSubscribeMock: channel.subscribe,
    removeChannelMock: supabase.removeChannel,
    supabaseChannelMock: channel,
    supabaseClientMock: supabase,
  };
});

vi.mock("@/common/clients/supabase-browser-client", () => ({
  getSupabaseBrowserClient: () => supabaseClientMock,
}));

import { AvailabilityRealtimeClient } from "@/common/clients/availability-realtime-client";

describe("AvailabilityRealtimeClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards valid payloads to onInsert", () => {
    // Arrange
    const onInsert = vi.fn();
    const onError = vi.fn();
    const client = new AvailabilityRealtimeClient();

    // Act
    client.subscribeToAvailabilityChangeEvents({
      courtId: "court-1",
      onInsert,
      onError,
    });

    const realtimeCallback = channelOnMock.mock.calls.at(-1)?.[2] as (payload: {
      new: Record<string, unknown>;
    }) => void;

    realtimeCallback({
      new: {
        id: "evt-1",
        source_kind: "RESERVATION",
        source_event: "reservation.created",
        source_id: "res-1",
        court_id: "court-1",
        place_id: "place-1",
        sport_id: "sport-1",
        start_time: "2026-03-07T10:00:00.000Z",
        end_time: "2026-03-07T11:00:00.000Z",
        slot_status: "BOOKED",
        unavailable_reason: "RESERVATION",
        total_price_cents: 1200,
        currency: "PHP",
        created_at: "2026-03-07T09:00:00.000Z",
      },
    });

    // Assert
    expect(onInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "evt-1",
        court_id: "court-1",
        slot_status: "BOOKED",
      }),
    );
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports invalid payloads through onError", () => {
    // Arrange
    const onInsert = vi.fn();
    const onError = vi.fn();
    const client = new AvailabilityRealtimeClient();

    // Act
    client.subscribeToAvailabilityChangeEvents({
      placeId: "place-1",
      onInsert,
      onError,
    });

    const realtimeCallback = channelOnMock.mock.calls.at(-1)?.[2] as (payload: {
      new: Record<string, unknown>;
    }) => void;

    realtimeCallback({
      new: {
        id: "evt-2",
        place_id: "place-1",
      },
    });

    // Assert
    expect(onInsert).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it("uses the correct scope filter and unsubscribes cleanly", () => {
    // Arrange
    const client = new AvailabilityRealtimeClient();

    // Act
    const subscription = client.subscribeToAvailabilityChangeEvents({
      courtId: " court-9 ",
      onInsert: vi.fn(),
    });

    const realtimeConfig = channelOnMock.mock.calls.at(-1)?.[1] as {
      filter?: string;
      table: string;
    };

    subscription.unsubscribe();

    // Assert
    expect(realtimeConfig.table).toBe("availability_change_event");
    expect(realtimeConfig.filter).toBe("court_id=eq.court-9");
    expect(removeChannelMock).toHaveBeenCalledWith(supabaseChannelMock);
  });

  it("forwards recognized connection statuses", () => {
    // Arrange
    const onStatusChange = vi.fn();
    const client = new AvailabilityRealtimeClient();

    // Act
    client.subscribeToAvailabilityChangeEvents({
      onInsert: vi.fn(),
      onStatusChange,
    });

    const subscribeCallback = channelSubscribeMock.mock.calls.at(-1)?.[0] as (
      status: string,
      error?: unknown,
    ) => void;
    subscribeCallback("SUBSCRIBED");

    // Assert
    expect(onStatusChange).toHaveBeenCalledWith("SUBSCRIBED");
  });
});
