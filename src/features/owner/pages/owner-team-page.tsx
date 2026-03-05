"use client";

import { MoreHorizontal, Search, ShieldAlert, UserPlus, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { AppShell } from "@/components/layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  OwnerNavbar,
  OwnerSidebar,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { TeamInviteDialog } from "@/features/owner/components/team-invite-dialog";
import { TeamMemberPermissionsSheet } from "@/features/owner/components/team-member-permissions-sheet";
import {
  useMutCancelOrganizationInvitation,
  useMutRevokeOrganizationMember,
  useQueryMyOrganizationPermissions,
  useQueryOrganizationInvitations,
  useQueryOrganizationMembers,
  useQueryOwnerOrganization,
} from "@/features/owner/hooks";
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  ORGANIZATION_MEMBER_PERMISSIONS,
  type OrganizationMemberPermission,
  type OrganizationMemberRole,
} from "@/lib/modules/organization-member/shared/permissions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  VIEWER: "Viewer",
};

function normalizeMemberPermissions(
  role: OrganizationMemberRole,
  permissions: string[] | null | undefined,
): OrganizationMemberPermission[] {
  const allowed = new Set<string>(ORGANIZATION_MEMBER_PERMISSIONS);
  const filtered = (permissions ?? []).filter((p) =>
    allowed.has(p),
  ) as OrganizationMemberPermission[];
  return filtered.length > 0
    ? filtered
    : [...DEFAULT_PERMISSIONS_BY_ROLE[role]];
}

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined,
): string {
  if (name) return name.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "?";
}

function formatExpiresIn(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return "Expires in 1 day";
  return `Expires in ${days} days`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OwnerTeamPage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const { organization: navOrg, organizations } = useQueryOwnerOrganization();
  const organizationId = navOrg?.id ?? "";

  // Queries
  const membersQuery = useQueryOrganizationMembers(organizationId || undefined);
  const invitationsQuery = useQueryOrganizationInvitations(
    organizationId || undefined,
  );
  const permissionContextQuery = useQueryMyOrganizationPermissions(
    organizationId || undefined,
  );

  // Mutations
  const revokeMember = useMutRevokeOrganizationMember(organizationId);
  const cancelInvitation = useMutCancelOrganizationInvitation(organizationId);

  // UI state
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [sheetMember, setSheetMember] = React.useState<{
    userId: string;
    displayName: string | null;
    email: string | null;
    role: OrganizationMemberRole;
    permissions: OrganizationMemberPermission[];
  } | null>(null);
  const [revokeTarget, setRevokeTarget] = React.useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<{
    id: string;
    email: string;
  } | null>(null);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.organization.team);
  };

  const permissionContext = permissionContextQuery.data;
  const canManage = Boolean(
    permissionContext?.isOwner ||
      permissionContext?.permissions.includes("organization.member.manage"),
  );

  const isLoading =
    membersQuery.isLoading ||
    invitationsQuery.isLoading ||
    permissionContextQuery.isLoading;

  // Filtered members
  const members = React.useMemo(() => {
    const raw = membersQuery.data ?? [];
    return raw.filter((row) => {
      const name = (row.displayName ?? "").toLowerCase();
      const email = (row.email ?? "").toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q);
      const matchesRole =
        roleFilter === "all" || row.member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [membersQuery.data, search, roleFilter]);

  const invitations = invitationsQuery.data ?? [];

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeMember.mutateAsync({
        organizationId,
        memberUserId: revokeTarget.userId,
      });
      toast.success("Member access revoked");
      setRevokeTarget(null);
    } catch (error) {
      toast.error("Failed to revoke member", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleCancelInvitation = async () => {
    if (!cancelTarget) return;
    try {
      await cancelInvitation.mutateAsync({
        organizationId,
        invitationId: cancelTarget.id,
      });
      toast.success("Invitation canceled");
      setCancelTarget(null);
    } catch (error) {
      toast.error("Failed to cancel invitation", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const openPermissionsSheet = (row: {
    member: {
      userId: string;
      role: string;
      permissions: string[] | null;
    };
    displayName: string | null;
    email: string | null;
  }) => {
    const role = row.member.role as OrganizationMemberRole;
    setSheetMember({
      userId: row.member.userId,
      displayName: row.displayName,
      email: row.email,
      role,
      permissions: normalizeMemberPermissions(role, row.member.permissions),
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const shell = (children: React.ReactNode) => (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={navOrg ?? { id: "", name: "" }}
          organizations={organizations}
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={navOrg?.name ?? ""}
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
          onLogout={handleLogout}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={navOrg?.id ?? null} />
      }
    >
      {children}
    </AppShell>
  );

  if (isLoading) {
    return shell(
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>,
    );
  }

  if (!canManage) {
    return shell(
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Team & Access
          </h1>
          <p className="text-muted-foreground">
            Manage your team members and permissions
          </p>
        </div>
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="h-4 w-4" />
            You do not have permission to manage members.
          </div>
          <p className="mt-1">
            Ask an owner or manager with member-management access.
          </p>
        </div>
      </div>,
    );
  }

  return shell(
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Team & Access
          </h1>
          <p className="text-muted-foreground">
            Manage your team members and permissions
          </p>
        </div>
        {organizationId && (
          <TeamInviteDialog organizationId={organizationId}>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite
            </Button>
          </TeamInviteDialog>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="VIEWER">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members list */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Members ({members.length})
        </h2>

        {members.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {search || roleFilter !== "all"
                ? "No members match your filters."
                : "No active members yet. Invite your first team member."}
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {members.map((row) => {
              const role = row.member.role as OrganizationMemberRole;
              const isOwner = role === "OWNER";
              const perms = normalizeMemberPermissions(
                role,
                row.member.permissions,
              );
              const permCount = isOwner
                ? ORGANIZATION_MEMBER_PERMISSIONS.length
                : perms.length;

              return (
                <div
                  key={row.member.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  {/* Avatar */}
                  <Avatar className="h-9 w-9 shrink-0">
                    {row.avatarUrl && (
                      <AvatarImage
                        src={row.avatarUrl}
                        alt={row.displayName ?? row.email ?? "Team member"}
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(row.displayName, row.email)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {row.displayName ?? row.email ?? "Team member"}
                      </p>
                      {isOwner && (
                        <Badge
                          variant="default"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Owner
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {row.displayName && row.email && (
                        <span className="truncate">{row.email}</span>
                      )}
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">
                        {isOwner
                          ? "All permissions"
                          : `${permCount} permission${permCount !== 1 ? "s" : ""}`}
                      </span>
                      {!isOwner && (
                        <>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline">
                            {ROLE_LABELS[role]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Member actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openPermissionsSheet(row)}
                        >
                          Edit permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            setRevokeTarget({
                              userId: row.member.userId,
                              name:
                                row.displayName ?? row.email ?? "this member",
                            })
                          }
                        >
                          Revoke access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending invitations */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Pending invitations ({invitations.length})
        </h2>

        {invitations.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No pending invitations.
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {invitations.map((row) => {
              const invRole = row.invitation.role as OrganizationMemberRole;
              return (
                <div
                  key={row.invitation.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs">
                      {row.invitation.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {row.invitation.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[invRole]} ·{" "}
                      {formatExpiresIn(row.invitation.expiresAt)}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setCancelTarget({
                        id: row.invitation.id,
                        email: row.invitation.email,
                      })
                    }
                    disabled={cancelInvitation.isPending}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permissions sheet */}
      <TeamMemberPermissionsSheet
        organizationId={organizationId}
        member={sheetMember}
        open={!!sheetMember}
        onOpenChange={(open) => {
          if (!open) setSheetMember(null);
        }}
      />

      {/* Revoke confirmation */}
      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke access for{" "}
              <span className="font-medium text-foreground">
                {revokeTarget?.name}
              </span>
              ? They will lose all permissions immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeMember.isPending && <Spinner className="mr-2 h-4 w-4" />}
              Revoke access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel invitation confirmation */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation to{" "}
              <span className="font-medium text-foreground">
                {cancelTarget?.email}
              </span>
              ? They will no longer be able to join.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelInvitation.isPending && (
                <Spinner className="mr-2 h-4 w-4" />
              )}
              Cancel invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>,
  );
}
