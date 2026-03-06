import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { featureQuerySpy, featureMutationSpy, reservationApi } = vi.hoisted(
  () => ({
    featureQuerySpy: vi.fn(),
    featureMutationSpy: vi.fn(),
    reservationApi: {
      queryReservationGetLinkedDetail: vi.fn(),
      mutReservationMarkPaymentLinked: vi.fn(),
    },
  }),
);

vi.mock("@/common/feature-api-hooks", () => ({
  useFeatureQuery: (
    path: unknown,
    queryFn: unknown,
    input?: unknown,
    options?: unknown,
  ) => {
    featureQuerySpy(path, queryFn, input, options);
    return { data: null };
  },
  useFeatureMutation: (mutationFn: unknown, options?: unknown) => {
    featureMutationSpy(mutationFn, options);
    return { mutateAsync: vi.fn() };
  },
  useFeatureQueries: vi.fn(),
  createFeatureQueryOptions: vi.fn(),
}));

vi.mock("@/features/reservation/api.runtime", () => ({
  getReservationApi: () => reservationApi,
}));

vi.mock("@/trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      reservation: {
        getLinkedDetail: { invalidate: vi.fn(async () => undefined) },
        getMy: { invalidate: vi.fn(async () => undefined) },
        getMyWithDetails: { invalidate: vi.fn(async () => undefined) },
      },
      reservationChat: {
        getThreadMetas: { invalidate: vi.fn(async () => undefined) },
        getSession: { invalidate: vi.fn(async () => undefined) },
      },
    }),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("nuqs", () => ({
  parseAsStringLiteral: () => ({
    withDefault: () => ({
      withOptions: () => ({}),
    }),
  }),
  useQueryState: () => ["upcoming", vi.fn()],
}));

vi.mock("@/common/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  useMutMarkPaymentLinked,
  useQueryReservationLinkedDetail,
} from "@/features/reservation/hooks";

describe("reservation hooks", () => {
  it("useQueryReservationLinkedDetail -> uses feature query adapter", () => {
    // Arrange + Act
    renderHook(() => useQueryReservationLinkedDetail("res-1", 5000));

    // Assert
    expect(featureQuerySpy).toHaveBeenCalledWith(
      ["reservation", "getLinkedDetail"],
      reservationApi.queryReservationGetLinkedDetail,
      { reservationId: "res-1" },
      { enabled: true, refetchInterval: 5000 },
    );
  });

  it("useMutMarkPaymentLinked -> uses feature mutation adapter", () => {
    // Arrange + Act
    renderHook(() => useMutMarkPaymentLinked());

    // Assert
    expect(featureMutationSpy).toHaveBeenCalledWith(
      reservationApi.mutReservationMarkPaymentLinked,
      expect.any(Object),
    );
  });
});
