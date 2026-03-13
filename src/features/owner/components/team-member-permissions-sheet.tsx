"use client";

import * as React from "react";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useMutUpdateOrganizationMemberPermissions } from "@/features/owner/hooks";
import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  ORGANIZATION_MEMBER_ROLES,
  type OrganizationMemberPermission,
  type OrganizationMemberRole,
} from "@/lib/modules/organization-member/shared/permissions";

const PERMISSION_LABELS: Record<OrganizationMemberPermission, string> = {
  "reservation.read": "View reservations",
  "reservation.update_status": "Update reservation status",
  "reservation.guest_booking": "Create guest bookings",
  "reservation.chat": "Access reservation chat",
  "reservation.notification.receive": "Receive reservation notifications",
  "organization.member.manage": "Manage members and invitations",
  "place.manage": "Manage venues",
};

const RESERVATION_PERMISSIONS: OrganizationMemberPermission[] = [
  "reservation.read",
  "reservation.update_status",
  "reservation.guest_booking",
  "reservation.chat",
  "reservation.notification.receive",
];

const VENUE_PERMISSIONS: OrganizationMemberPermission[] = ["place.manage"];

const ADMIN_PERMISSIONS: OrganizationMemberPermission[] = [
  "organization.member.manage",
];

interface MemberData {
  userId: string;
  displayName: string | null;
  email: string | null;
  role: OrganizationMemberRole;
  permissions: OrganizationMemberPermission[];
}

interface TeamMemberPermissionsSheetProps {
  organizationId: string;
  member: MemberData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamMemberPermissionsSheet({
  organizationId,
  member,
  open,
  onOpenChange,
}: TeamMemberPermissionsSheetProps) {
  const [role, setRole] = React.useState<OrganizationMemberRole>("MANAGER");
  const [permissions, setPermissions] = React.useState<
    OrganizationMemberPermission[]
  >([]);
  const [isDirty, setIsDirty] = React.useState(false);

  const updatePermissions =
    useMutUpdateOrganizationMemberPermissions(organizationId);

  React.useEffect(() => {
    if (member) {
      setRole(member.role);
      setPermissions([...member.permissions]);
      setIsDirty(false);
    }
  }, [member]);

  const handleRoleChange = (value: string) => {
    const newRole = value as OrganizationMemberRole;
    setRole(newRole);
    setPermissions([...DEFAULT_PERMISSIONS_BY_ROLE[newRole]]);
    setIsDirty(true);
  };

  const togglePermission = (permission: OrganizationMemberPermission) => {
    setPermissions((prev) => {
      const next = prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission];
      setIsDirty(true);
      return next;
    });
  };

  const handleSave = async () => {
    if (!member) return;
    if (permissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    try {
      await updatePermissions.mutateAsync({
        organizationId,
        memberUserId: member.userId,
        role,
        permissions,
      });
      toast.success("Member access updated");
      setIsDirty(false);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update member access", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const renderPermissionGroup = (
    label: string,
    groupPermissions: OrganizationMemberPermission[],
  ) => (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="space-y-1">
        {groupPermissions.map((permission) => (
          <label
            key={permission}
            htmlFor={`sheet-${permission}`}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
          >
            <Checkbox
              id={`sheet-${permission}`}
              checked={permissions.includes(permission)}
              onCheckedChange={() => togglePermission(permission)}
            />
            {PERMISSION_LABELS[permission]}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Edit permissions</SheetTitle>
          <SheetDescription>
            {member?.displayName ?? member?.email ?? "Team member"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {member?.email && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{member.email}</Badge>
            </div>
          )}

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ORGANIZATION_MEMBER_ROLES.filter((r) => r !== "OWNER").map(
                  (r) => (
                    <SelectItem key={r} value={r}>
                      {r === "MANAGER" ? "Manager" : "Viewer"}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            {renderPermissionGroup("Reservations", RESERVATION_PERMISSIONS)}
            {renderPermissionGroup("Venues", VENUE_PERMISSIONS)}
            {renderPermissionGroup("Administration", ADMIN_PERMISSIONS)}
          </div>
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || updatePermissions.isPending}
            loading={updatePermissions.isPending}
          >
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
