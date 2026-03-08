"use client";

import { ShieldAlert, UserMinus, UserPlus, X } from "lucide-react";
import * as React from "react";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  useMutCancelOrganizationInvitation,
  useMutInviteOrganizationMember,
  useMutRevokeOrganizationMember,
  useMutUpdateOrganizationMemberPermissions,
  useQueryMyOrganizationPermissions,
  useQueryOrganizationInvitations,
  useQueryOrganizationMembers,
} from "@/features/owner/hooks";
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  ORGANIZATION_MEMBER_PERMISSIONS,
  ORGANIZATION_MEMBER_ROLES,
  type OrganizationMemberPermission,
  type OrganizationMemberRole,
} from "@/lib/modules/organization-member/shared/permissions";

type MemberDraft = {
  role: OrganizationMemberRole;
  permissions: OrganizationMemberPermission[];
  dirty: boolean;
};

const PERMISSION_LABELS: Record<OrganizationMemberPermission, string> = {
  "reservation.read": "View reservations",
  "reservation.update_status": "Update reservation status",
  "reservation.guest_booking": "Create guest bookings",
  "reservation.chat": "Access reservation chat",
  "reservation.notification.receive": "Receive reservation notifications",
  "organization.member.manage": "Manage members and invitations",
  "place.manage": "Manage venues",
};

const ROLE_LABELS: Record<OrganizationMemberRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  VIEWER: "Viewer",
};

function sortPermissions(permissions: OrganizationMemberPermission[]) {
  const order = new Map(
    ORGANIZATION_MEMBER_PERMISSIONS.map((permission, index) => [
      permission,
      index,
    ]),
  );
  return permissions
    .slice()
    .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function normalizeDraftPermissions(
  role: OrganizationMemberRole,
  permissions: string[] | null | undefined,
) {
  const allowed = new Set(
    ORGANIZATION_MEMBER_PERMISSIONS as readonly OrganizationMemberPermission[],
  );
  const filtered = (permissions ?? []).filter((permission) =>
    allowed.has(permission as OrganizationMemberPermission),
  ) as OrganizationMemberPermission[];

  const normalized =
    filtered.length > 0 ? filtered : [...DEFAULT_PERMISSIONS_BY_ROLE[role]];
  return sortPermissions(normalized);
}

export function TeamAccessManager({
  organizationId,
  sectionId,
}: {
  organizationId: string;
  sectionId?: string;
}) {
  const membersQuery = useQueryOrganizationMembers(organizationId);
  const invitationsQuery = useQueryOrganizationInvitations(organizationId);
  const permissionContextQuery =
    useQueryMyOrganizationPermissions(organizationId);

  const inviteMember = useMutInviteOrganizationMember(organizationId);
  const updatePermissions =
    useMutUpdateOrganizationMemberPermissions(organizationId);
  const revokeMember = useMutRevokeOrganizationMember(organizationId);
  const cancelInvitation = useMutCancelOrganizationInvitation(organizationId);

  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] =
    React.useState<OrganizationMemberRole>("MANAGER");
  const [invitePermissions, setInvitePermissions] = React.useState<
    OrganizationMemberPermission[]
  >([...DEFAULT_PERMISSIONS_BY_ROLE.MANAGER]);
  const [memberDrafts, setMemberDrafts] = React.useState<
    Record<string, MemberDraft>
  >({});

  React.useEffect(() => {
    setInvitePermissions(
      sortPermissions([...DEFAULT_PERMISSIONS_BY_ROLE[inviteRole]]),
    );
  }, [inviteRole]);

  React.useEffect(() => {
    const members = membersQuery.data ?? [];
    if (members.length === 0) {
      setMemberDrafts({});
      return;
    }

    setMemberDrafts((prev) => {
      const next: Record<string, MemberDraft> = {};
      for (const row of members) {
        const key = row.member.userId;
        const current = prev[key];
        const role = row.member.role as OrganizationMemberRole;
        const permissions = normalizeDraftPermissions(
          role,
          row.member.permissions,
        );

        if (current?.dirty) {
          next[key] = current;
          continue;
        }

        next[key] = {
          role,
          permissions,
          dirty: false,
        };
      }
      return next;
    });
  }, [membersQuery.data]);

  const permissionContext = permissionContextQuery.data;
  const canManage = Boolean(
    permissionContext?.isOwner ||
      permissionContext?.permissions.includes("organization.member.manage"),
  );

  const isLoading =
    membersQuery.isLoading ||
    invitationsQuery.isLoading ||
    permissionContextQuery.isLoading;

  const togglePermissions = (
    current: OrganizationMemberPermission[],
    permission: OrganizationMemberPermission,
  ) => {
    const set = new Set(current);
    if (set.has(permission)) {
      set.delete(permission);
    } else {
      set.add(permission);
    }

    return sortPermissions(Array.from(set));
  };

  const setDraftRole = (memberUserId: string, role: OrganizationMemberRole) => {
    setMemberDrafts((prev) => {
      const existing = prev[memberUserId];
      if (!existing) {
        return prev;
      }

      return {
        ...prev,
        [memberUserId]: {
          ...existing,
          role,
          permissions: sortPermissions([...DEFAULT_PERMISSIONS_BY_ROLE[role]]),
          dirty: true,
        },
      };
    });
  };

  const setDraftPermission = (
    memberUserId: string,
    permission: OrganizationMemberPermission,
  ) => {
    setMemberDrafts((prev) => {
      const existing = prev[memberUserId];
      if (!existing) {
        return prev;
      }

      const permissions = togglePermissions(existing.permissions, permission);
      return {
        ...prev,
        [memberUserId]: {
          ...existing,
          permissions,
          dirty: true,
        },
      };
    });
  };

  const saveDraft = async (memberUserId: string) => {
    const draft = memberDrafts[memberUserId];
    if (!draft) return;

    if (draft.permissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    try {
      await updatePermissions.mutateAsync({
        organizationId,
        memberUserId,
        role: draft.role,
        permissions: draft.permissions,
      });
      toast.success("Member access updated");
      setMemberDrafts((prev) => ({
        ...prev,
        [memberUserId]: {
          ...draft,
          dirty: false,
        },
      }));
    } catch (error) {
      toast.error("Failed to update member access", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Email is required");
      return;
    }

    if (invitePermissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    try {
      await inviteMember.mutateAsync({
        organizationId,
        email,
        role: inviteRole,
        permissions: invitePermissions,
      });
      setInviteEmail("");
      setInviteRole("MANAGER");
      setInvitePermissions([...DEFAULT_PERMISSIONS_BY_ROLE.MANAGER]);
      toast.success("Invitation sent");
    } catch (error) {
      toast.error("Failed to send invitation", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRevokeMember = async (memberUserId: string) => {
    try {
      await revokeMember.mutateAsync({
        organizationId,
        memberUserId,
      });
      toast.success("Member revoked");
    } catch (error) {
      toast.error("Failed to revoke member", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation.mutateAsync({
        organizationId,
        invitationId,
      });
      toast.success("Invitation canceled");
    } catch (error) {
      toast.error("Failed to cancel invitation", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  return (
    <Card id={sectionId}>
      <CardHeader>
        <CardTitle>Team & Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : !canManage ? (
          <div className="rounded-md border border-warning/30 bg-warning-light p-4 text-sm text-warning-foreground">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="h-4 w-4" />
              You do not have permission to manage members.
            </div>
            <p className="mt-1">
              Ask an owner or manager with member-management access.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="font-medium">Invite team member</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    placeholder="staff@example.com"
                    onChange={(event) => setInviteEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) =>
                      setInviteRole(value as OrganizationMemberRole)
                    }
                  >
                    <SelectTrigger id="invite-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORGANIZATION_MEMBER_ROLES.filter(
                        (role) => role !== "OWNER",
                      ).map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {ORGANIZATION_MEMBER_PERMISSIONS.map((permission) => {
                    const permissionId = `invite-permission-${permission}`;

                    return (
                      <div
                        key={permission}
                        className="flex items-center gap-2 rounded border px-3 py-2 text-sm"
                      >
                        <Checkbox
                          id={permissionId}
                          checked={invitePermissions.includes(permission)}
                          onCheckedChange={() =>
                            setInvitePermissions((prev) =>
                              togglePermissions(prev, permission),
                            )
                          }
                        />
                        <Label
                          htmlFor={permissionId}
                          className="cursor-pointer font-normal"
                        >
                          {PERMISSION_LABELS[permission]}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button
                type="button"
                onClick={handleInvite}
                disabled={inviteMember.isPending}
              >
                {inviteMember.isPending ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Send invite
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Members</h3>
              {membersQuery.data?.length ? (
                membersQuery.data.map((row) => {
                  const memberUserId = row.member.userId;
                  const draft = memberDrafts[memberUserId];
                  if (!draft) return null;

                  return (
                    <div key={row.member.id} className="rounded-md border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {row.displayName ?? row.email ?? "Team member"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {row.email ?? "No email available"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeMember(memberUserId)}
                          disabled={revokeMember.isPending}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Revoke
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select
                            value={draft.role}
                            onValueChange={(value) =>
                              setDraftRole(
                                memberUserId,
                                value as OrganizationMemberRole,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {ORGANIZATION_MEMBER_ROLES.filter(
                                (role) => role !== "OWNER",
                              ).map((role) => (
                                <SelectItem key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {ORGANIZATION_MEMBER_PERMISSIONS.map((permission) => {
                          const permissionId = `${memberUserId}-${permission}`;

                          return (
                            <div
                              key={permission}
                              className="flex items-center gap-2 rounded border px-3 py-2 text-sm"
                            >
                              <Checkbox
                                id={permissionId}
                                checked={draft.permissions.includes(permission)}
                                onCheckedChange={() =>
                                  setDraftPermission(memberUserId, permission)
                                }
                              />
                              <Label
                                htmlFor={permissionId}
                                className="cursor-pointer font-normal"
                              >
                                {PERMISSION_LABELS[permission]}
                              </Label>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          onClick={() => saveDraft(memberUserId)}
                          disabled={!draft.dirty || updatePermissions.isPending}
                        >
                          {updatePermissions.isPending && (
                            <Spinner className="mr-2 h-4 w-4" />
                          )}
                          Save access
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active members yet.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Pending invitations</h3>
              {invitationsQuery.data?.length ? (
                invitationsQuery.data.map((row) => (
                  <div
                    key={row.invitation.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-md border p-4"
                  >
                    <div>
                      <p className="font-medium">{row.invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {
                          ROLE_LABELS[
                            row.invitation.role as OrganizationMemberRole
                          ]
                        }{" "}
                        · Expires{" "}
                        {new Date(row.invitation.expiresAt).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {normalizeDraftPermissions(
                          row.invitation.role as OrganizationMemberRole,
                          row.invitation.permissions,
                        )
                          .map((permission) => PERMISSION_LABELS[permission])
                          .join(", ")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvitation(row.invitation.id)}
                      disabled={cancelInvitation.isPending}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No pending invitations.
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
