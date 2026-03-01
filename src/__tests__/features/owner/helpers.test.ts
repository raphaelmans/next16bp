import { describe, expect, it } from "vitest";
import {
  canAccessPage,
  filterVisibleNavItems,
  isOwnerPaymentMethodStepPending,
  isOwnerSetupIncomplete,
  ROLE_DISPLAY_LABELS,
  shouldShowOwnerGetStartedNav,
} from "@/features/owner/helpers";
import {
  hasPermission,
  isOwnerRole,
  type PermissionContext,
} from "@/lib/modules/organization-member/shared/permissions";

describe("isOwnerSetupIncomplete", () => {
  const cases: Array<{
    label: string;
    input: {
      isSetupComplete: boolean;
      hasPaymentMethod?: boolean;
      nextStep?: string;
    } | null;
    expected: boolean;
  }> = [
    {
      label: "returns false when setup status is missing",
      input: null,
      expected: false,
    },
    {
      label: "returns true when setup is incomplete",
      input: { isSetupComplete: false },
      expected: true,
    },
    {
      label: "returns false when setup is complete",
      input: { isSetupComplete: true },
      expected: false,
    },
    {
      label:
        "returns true when payment method is missing even if setupComplete is true",
      input: { isSetupComplete: true, hasPaymentMethod: false },
      expected: true,
    },
    {
      label:
        "returns true when next step is not complete even if setupComplete is true",
      input: { isSetupComplete: true, nextStep: "configure_courts" },
      expected: true,
    },
    {
      label: "returns false when next step is complete",
      input: { isSetupComplete: true, nextStep: "complete" },
      expected: false,
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      expect(isOwnerSetupIncomplete(input)).toBe(expected);
    });
  }
});

describe("shouldShowOwnerGetStartedNav", () => {
  const cases: Array<{
    label: string;
    input: Parameters<typeof shouldShowOwnerGetStartedNav>[0];
    expected: boolean;
  }> = [
    {
      label: "returns true in no-org mode",
      input: {
        noOrgMode: true,
        setupStatusLoading: true,
        setupStatus: null,
      },
      expected: true,
    },
    {
      label: "returns true while setup status is loading",
      input: {
        noOrgMode: false,
        setupStatusLoading: true,
        setupStatus: { isSetupComplete: false },
      },
      expected: true,
    },
    {
      label: "returns true when setup is incomplete",
      input: {
        noOrgMode: false,
        setupStatusLoading: false,
        setupStatus: { isSetupComplete: false },
      },
      expected: true,
    },
    {
      label: "returns true when payment method is missing",
      input: {
        noOrgMode: false,
        setupStatusLoading: false,
        setupStatus: { isSetupComplete: true, hasPaymentMethod: false },
      },
      expected: true,
    },
    {
      label: "returns true when setup status is missing after load",
      input: {
        noOrgMode: false,
        setupStatusLoading: false,
        setupStatus: null,
      },
      expected: true,
    },
    {
      label: "returns false only when setup is complete",
      input: {
        noOrgMode: false,
        setupStatusLoading: false,
        setupStatus: { isSetupComplete: true },
      },
      expected: false,
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      expect(shouldShowOwnerGetStartedNav(input)).toBe(expected);
    });
  }
});

describe("isOwnerPaymentMethodStepPending", () => {
  const cases: Array<{
    label: string;
    input: {
      isSetupComplete: boolean;
      hasPaymentMethod?: boolean;
      nextStep?: string;
    } | null;
    expected: boolean;
  }> = [
    {
      label: "returns false when status is missing",
      input: null,
      expected: false,
    },
    {
      label: "returns true when hasPaymentMethod is false",
      input: { isSetupComplete: false, hasPaymentMethod: false },
      expected: true,
    },
    {
      label: "returns true when nextStep is add_payment_method",
      input: { isSetupComplete: false, nextStep: "add_payment_method" },
      expected: true,
    },
    {
      label: "returns false when payment method step is not pending",
      input: {
        isSetupComplete: false,
        hasPaymentMethod: true,
        nextStep: "configure_courts",
      },
      expected: false,
    },
  ];

  for (const { label, input, expected } of cases) {
    it(label, () => {
      expect(isOwnerPaymentMethodStepPending(input)).toBe(expected);
    });
  }
});

describe("owner RBAC helpers", () => {
  const ownerContext: PermissionContext = {
    isOwner: true,
    role: "OWNER",
    permissions: [],
  };
  const managerContext: PermissionContext = {
    isOwner: false,
    role: "MANAGER",
    permissions: ["reservation.read", "reservation.chat"],
  };
  const viewerContext: PermissionContext = {
    isOwner: false,
    role: "VIEWER",
    permissions: ["reservation.read"],
  };

  describe("canAccessPage", () => {
    it("enforces owner-only routes", () => {
      expect(canAccessPage(ownerContext, { type: "owner-only" })).toBe(true);
      expect(canAccessPage(managerContext, { type: "owner-only" })).toBe(false);
    });

    it("enforces permission-based routes with owner implicit allow", () => {
      expect(
        canAccessPage(ownerContext, {
          type: "permission",
          permission: "organization.member.manage",
        }),
      ).toBe(true);
      expect(
        canAccessPage(managerContext, {
          type: "permission",
          permission: "reservation.chat",
        }),
      ).toBe(true);
      expect(
        canAccessPage(viewerContext, {
          type: "permission",
          permission: "reservation.chat",
        }),
      ).toBe(false);
    });

    it("allows any-member routes for active member contexts", () => {
      expect(canAccessPage(viewerContext, { type: "any-member" })).toBe(true);
    });
  });

  describe("filterVisibleNavItems", () => {
    const navItems = [
      {
        title: "Dashboard",
        href: "/organization/dashboard",
        accessRule: { type: "any-member" } as const,
      },
      {
        title: "Team Access",
        href: "/organization/team",
        accessRule: {
          type: "permission",
          permission: "organization.member.manage",
        } as const,
      },
      {
        title: "Owner Billing",
        href: "/organization/billing",
        accessRule: { type: "owner-only" } as const,
      },
    ];

    it("returns only accessible nav items while preserving order", () => {
      const visibleForManager = filterVisibleNavItems(navItems, managerContext);
      const visibleForOwner = filterVisibleNavItems(navItems, ownerContext);

      expect(visibleForManager.map((item) => item.title)).toEqual([
        "Dashboard",
      ]);
      expect(visibleForOwner.map((item) => item.title)).toEqual([
        "Dashboard",
        "Team Access",
        "Owner Billing",
      ]);
    });
  });

  describe("role labels and permission helpers", () => {
    it("maps role labels deterministically", () => {
      expect(ROLE_DISPLAY_LABELS).toEqual({
        OWNER: "Owner",
        MANAGER: "Manager",
        VIEWER: "Viewer",
      });
    });

    it("isOwnerRole stays true for owner context variants", () => {
      expect(isOwnerRole(ownerContext)).toBe(true);
      expect(
        isOwnerRole({
          isOwner: false,
          role: "OWNER",
          permissions: [],
        }),
      ).toBe(true);
      expect(isOwnerRole(managerContext)).toBe(false);
    });

    it("hasPermission keeps owner implicit allow semantics", () => {
      expect(hasPermission(ownerContext, "organization.member.manage")).toBe(
        true,
      );
      expect(hasPermission(managerContext, "reservation.chat")).toBe(true);
      expect(hasPermission(viewerContext, "reservation.chat")).toBe(false);
    });
  });
});
