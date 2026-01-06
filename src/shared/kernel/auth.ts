/**
 * Session represents the currently authenticated user.
 * Extracted from Supabase auth and enriched with role from database.
 */
export interface Session {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Application-level user roles.
 */
export type UserRole = "admin" | "member" | "viewer";

/**
 * Role-based permissions mapping.
 */
export const ROLE_PERMISSIONS = {
  admin: ["read", "write", "delete", "manage_users"] as const,
  member: ["read", "write"] as const,
  viewer: ["read"] as const,
};

export type Permission =
  (typeof ROLE_PERMISSIONS)[keyof typeof ROLE_PERMISSIONS][number];

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
}
