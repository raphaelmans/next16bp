import type {
  OrganizationMemberPermission,
  PermissionContext,
} from "@/lib/modules/organization-member/shared/permissions";
import {
  hasPermission,
  isOwnerRole,
} from "@/lib/modules/organization-member/shared/permissions";

export type OwnerSetupGateInput = {
  isSetupComplete: boolean;
  hasPaymentMethod?: boolean;
  nextStep?: string;
} | null;

export function isOwnerSetupIncomplete(status: OwnerSetupGateInput): boolean {
  if (!status) return false;
  if (isOwnerPaymentMethodStepPending(status)) return true;
  if (status.nextStep === "complete") return false;
  if (typeof status.nextStep === "string") return true;
  return !status.isSetupComplete;
}

export function shouldShowOwnerGetStartedNav(input: {
  noOrgMode: boolean;
  setupStatusLoading: boolean;
  setupStatus: OwnerSetupGateInput;
}): boolean {
  if (input.noOrgMode) return true;
  if (input.setupStatusLoading) return false;
  if (!input.setupStatus) return false;
  return isOwnerSetupIncomplete(input.setupStatus);
}

export function isOwnerPaymentMethodStepPending(
  status: OwnerSetupGateInput,
): boolean {
  if (!status) return false;
  if (status.hasPaymentMethod === false) return true;
  return status.nextStep === "add_payment_method";
}

// ---------------------------------------------------------------------------
// RBAC page-access helpers (pure, no side effects)
// ---------------------------------------------------------------------------

/**
 * Discriminated union that declares how a page is gated.
 * - `owner-only`  → only the organization owner may access
 * - `permission`  → requires a specific permission (owners implicitly pass)
 * - `any-member`  → any active org member may access
 */
export type PageAccessRule =
  | { type: "owner-only" }
  | { type: "permission"; permission: OrganizationMemberPermission }
  | { type: "any-member" };

/** Evaluate whether a permission context satisfies an access rule. */
export function canAccessPage(
  context: PermissionContext,
  rule: PageAccessRule,
): boolean {
  switch (rule.type) {
    case "owner-only":
      return isOwnerRole(context);
    case "permission":
      return hasPermission(context, rule.permission);
    case "any-member":
      return true;
  }
}

/** A nav item annotated with its access rule. */
export type NavItemWithAccess = {
  title: string;
  href: string;
  accessRule: PageAccessRule;
  [key: string]: unknown;
};

/** Filter an array of nav items to only those accessible by the given context. */
export function filterVisibleNavItems<T extends NavItemWithAccess>(
  items: T[],
  context: PermissionContext,
): T[] {
  return items.filter((item) => canAccessPage(context, item.accessRule));
}

/** Human-readable label for a role. */
export const ROLE_DISPLAY_LABELS: Record<PermissionContext["role"], string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  VIEWER: "Viewer",
};
