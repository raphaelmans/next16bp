import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { featureQuerySpy, featureMutationSpy, reservationApi } = vi.hoisted(
  () => ({
    featureQuerySpy: vi.fn(),
    featureMutationSpy: vi.fn(),
    reservationApi: {
      queryReservationGetGroupDetail: vi.fn(),
      mutReservationMarkPaymentGroup: vi.fn(),
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
        getGroupDetail: { invalidate: vi.fn(async () => undefined) },
        getMy: { invalidate: vi.fn(async () => undefined) },
        getMyWithDetails: { invalidate: vi.fn(async () => undefined) },
      },
      reservationChat: {
        getThreadMetas: { invalidate: vi.fn(async () => undefined) },
        getGroupSession: { invalidate: vi.fn(async () => undefined) },
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
  useMutMarkPaymentGroup,
  useQueryReservationGroupDetail,
} from "@/features/reservation/hooks";

describe("reservation hooks", () => {
  it("useQueryReservationGroupDetail -> uses feature query adapter", () => {
    // Arrange + Act
    renderHook(() => useQueryReservationGroupDetail("group-1", 5000));

    // Assert
    expect(featureQuerySpy).toHaveBeenCalledWith(
      ["reservation", "getGroupDetail"],
      reservationApi.queryReservationGetGroupDetail,
      { reservationGroupId: "group-1" },
      { enabled: true, refetchInterval: 5000 },
    );
  });

  it("useMutMarkPaymentGroup -> uses feature mutation adapter", () => {
    // Arrange + Act
    renderHook(() => useMutMarkPaymentGroup());

    // Assert
    expect(featureMutationSpy).toHaveBeenCalledWith(
      reservationApi.mutReservationMarkPaymentGroup,
      expect.any(Object),
    );
  });
});
