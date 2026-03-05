import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRoutes } from "@/common/app-routes";

const headersMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});
const createServerCallerMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: (...args: unknown[]) => headersMock(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock("@/lib/shared/infra/trpc/server", () => ({
  createServerCaller: (...args: unknown[]) => createServerCallerMock(...args),
}));

import OwnerReservationGroupDetailRoutePage from "@/app/(owner)/organization/reservations/group/[groupId]/page";

describe("owner reservation group legacy route redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(
      new Headers([["x-pathname", "/organization/reservations/group/grp-1"]]),
    );
  });

  it("redirects grouped URL to canonical owner reservation detail", async () => {
    const resolveLegacyGroupMock = vi.fn().mockResolvedValue({
      reservationId: "res-1",
    });
    createServerCallerMock.mockResolvedValue({
      reservationOwner: { resolveLegacyGroup: resolveLegacyGroupMock },
    });

    await expect(
      OwnerReservationGroupDetailRoutePage({
        params: Promise.resolve({ groupId: "grp-1" }),
      }),
    ).rejects.toThrow("REDIRECT:/organization/reservations/res-1");

    expect(createServerCallerMock).toHaveBeenCalledWith(
      "/organization/reservations/group/grp-1",
    );
    expect(resolveLegacyGroupMock).toHaveBeenCalledWith({
      reservationGroupId: "grp-1",
    });
    expect(redirectMock).toHaveBeenCalledWith(
      "/organization/reservations/res-1",
    );
  });

  it("redirects to reservations list when representative reservation is missing", async () => {
    const resolveLegacyGroupMock = vi.fn().mockResolvedValue(null);
    createServerCallerMock.mockResolvedValue({
      reservationOwner: { resolveLegacyGroup: resolveLegacyGroupMock },
    });

    await expect(
      OwnerReservationGroupDetailRoutePage({
        params: Promise.resolve({ groupId: "grp-1" }),
      }),
    ).rejects.toThrow(`REDIRECT:${appRoutes.organization.reservations}`);

    expect(redirectMock).toHaveBeenCalledWith(
      appRoutes.organization.reservations,
    );
  });

  it("redirects unauthorized access to login", async () => {
    const resolveLegacyGroupMock = vi
      .fn()
      .mockRejectedValue(new TRPCError({ code: "UNAUTHORIZED" }));
    createServerCallerMock.mockResolvedValue({
      reservationOwner: { resolveLegacyGroup: resolveLegacyGroupMock },
    });

    await expect(
      OwnerReservationGroupDetailRoutePage({
        params: Promise.resolve({ groupId: "grp-1" }),
      }),
    ).rejects.toThrow(
      `REDIRECT:${appRoutes.login.from("/organization/reservations/group/grp-1")}`,
    );

    expect(redirectMock).toHaveBeenCalledWith(
      appRoutes.login.from("/organization/reservations/group/grp-1"),
    );
  });
});
