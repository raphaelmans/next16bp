export const ORGANIZATION_MEMBER_ROLES = [
  "OWNER",
  "MANAGER",
  "VIEWER",
] as const;

export type OrganizationMemberRole = (typeof ORGANIZATION_MEMBER_ROLES)[number];

export const ORGANIZATION_MEMBER_STATUSES = ["ACTIVE", "REVOKED"] as const;

export type OrganizationMemberStatus =
  (typeof ORGANIZATION_MEMBER_STATUSES)[number];

export const ORGANIZATION_INVITATION_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "CANCELED",
  "EXPIRED",
] as const;

export type OrganizationInvitationStatus =
  (typeof ORGANIZATION_INVITATION_STATUSES)[number];

export const ORGANIZATION_MEMBER_PERMISSIONS = [
  "reservation.read",
  "reservation.update_status",
  "reservation.guest_booking",
  "reservation.chat",
  "reservation.notification.receive",
  "organization.member.manage",
  "place.manage",
] as const;

export type OrganizationMemberPermission =
  (typeof ORGANIZATION_MEMBER_PERMISSIONS)[number];

export const DEFAULT_MANAGER_PERMISSIONS: OrganizationMemberPermission[] = [
  "reservation.read",
  "reservation.update_status",
  "reservation.guest_booking",
  "reservation.chat",
  "reservation.notification.receive",
  "organization.member.manage",
  "place.manage",
];

export const DEFAULT_VIEWER_PERMISSIONS: OrganizationMemberPermission[] = [
  "reservation.read",
];

export const OWNER_IMPLICIT_PERMISSIONS: OrganizationMemberPermission[] = [
  ...ORGANIZATION_MEMBER_PERMISSIONS,
];

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<
  OrganizationMemberRole,
  OrganizationMemberPermission[]
> = {
  OWNER: OWNER_IMPLICIT_PERMISSIONS,
  MANAGER: DEFAULT_MANAGER_PERMISSIONS,
  VIEWER: DEFAULT_VIEWER_PERMISSIONS,
};

// ---------------------------------------------------------------------------
// Permission context helpers (pure, cross-runtime safe)
// ---------------------------------------------------------------------------

/** Minimal shape needed for client-side permission checks. */
export type PermissionContext = {
  isOwner: boolean;
  role: OrganizationMemberRole;
  permissions: OrganizationMemberPermission[];
};

/** Returns true when the context includes a specific permission (owners implicitly have all). */
export function hasPermission(
  context: PermissionContext,
  permission: OrganizationMemberPermission,
): boolean {
  if (context.isOwner) return true;
  return context.permissions.includes(permission);
}

/** Returns true when the context represents an organization owner. */
export function isOwnerRole(context: PermissionContext): boolean {
  return context.isOwner || context.role === "OWNER";
}

export function normalizeOrganizationPermissions(
  role: OrganizationMemberRole,
  permissions?: string[] | null,
): OrganizationMemberPermission[] {
  const fallback = DEFAULT_PERMISSIONS_BY_ROLE[role];
  const source = permissions && permissions.length > 0 ? permissions : fallback;

  const normalized = Array.from(
    new Set(
      source.filter((permission): permission is OrganizationMemberPermission =>
        (ORGANIZATION_MEMBER_PERMISSIONS as readonly string[]).includes(
          permission,
        ),
      ),
    ),
  );

  if (normalized.length === 0) {
    return [...fallback];
  }

  return normalized;
}
