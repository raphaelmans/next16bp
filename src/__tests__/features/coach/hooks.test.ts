import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { featureQuerySpy, featureMutationSpy, invalidateSpy, coachApi } =
  vi.hoisted(() => ({
    featureQuerySpy: vi.fn(),
    featureMutationSpy: vi.fn(),
    invalidateSpy: vi.fn(async () => undefined),
    coachApi: {
      queryCoachPaymentListMethods: vi.fn(),
      mutCoachPaymentCreateMethod: vi.fn(),
      mutCoachPaymentDeleteMethod: vi.fn(),
      mutCoachPaymentSetDefault: vi.fn(),
      mutCoachPaymentUpdateMethod: vi.fn(),
    },
  }));

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
    return { mutateAsync: vi.fn(), isPending: false };
  },
  useFeatureQueryCache: () => ({
    invalidate: invalidateSpy,
  }),
}));

vi.mock("@/features/coach/api", () => ({
  getCoachApi: () => coachApi,
}));

import {
  useMutCreateCoachPaymentMethod,
  useMutDeleteCoachPaymentMethod,
  useMutSetDefaultCoachPaymentMethod,
  useMutUpdateCoachPaymentMethod,
  useQueryCoachPaymentMethods,
} from "@/features/coach/hooks";

describe("coach hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useQueryCoachPaymentMethods uses the feature query adapter", () => {
    renderHook(() => useQueryCoachPaymentMethods("coach-1"));

    expect(featureQuerySpy).toHaveBeenCalledWith(
      ["coachPayment", "listMethods"],
      coachApi.queryCoachPaymentListMethods,
      { coachId: "coach-1" },
      { enabled: true },
    );
  });

  it.each([
    [
      "create",
      useMutCreateCoachPaymentMethod,
      coachApi.mutCoachPaymentCreateMethod,
    ],
    [
      "update",
      useMutUpdateCoachPaymentMethod,
      coachApi.mutCoachPaymentUpdateMethod,
    ],
    [
      "delete",
      useMutDeleteCoachPaymentMethod,
      coachApi.mutCoachPaymentDeleteMethod,
    ],
    [
      "set default",
      useMutSetDefaultCoachPaymentMethod,
      coachApi.mutCoachPaymentSetDefault,
    ],
  ])(
    "useMut%sCoachPaymentMethod invalidates payment methods and setup status on success",
    async (_label, hook, mutationFn) => {
      renderHook(() => hook("coach-1"));

      expect(featureMutationSpy).toHaveBeenCalledWith(
        mutationFn,
        expect.any(Object),
      );

      const options = featureMutationSpy.mock.lastCall?.[1] as {
        onSuccess?: () => Promise<unknown>;
      };

      await options.onSuccess?.();

      expect(invalidateSpy).toHaveBeenCalledWith(
        ["coachPayment", "listMethods"],
        { coachId: "coach-1" },
      );
      expect(invalidateSpy).toHaveBeenCalledWith(["coach", "getSetupStatus"]);
    },
  );
});
