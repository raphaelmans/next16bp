"use client";

import { UserPlus } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import * as React from "react";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutInviteOrganizationMember } from "@/features/owner/hooks";
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
  "place.manage": "Manage venues and courts",
};

const RESERVATION_PERMISSIONS: OrganizationMemberPermission[] = [
  "reservation.read",
  "reservation.update_status",
  "reservation.guest_booking",
  "reservation.chat",
  "reservation.notification.receive",
];

const ADMIN_PERMISSIONS: OrganizationMemberPermission[] = [
  "organization.member.manage",
];

interface TeamInviteDialogProps {
  organizationId: string;
  children: React.ReactNode;
}

export function TeamInviteDialog({
  organizationId,
  children,
}: TeamInviteDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<OrganizationMemberRole>("MANAGER");
  const [permissions, setPermissions] = React.useState<
    OrganizationMemberPermission[]
  >([...DEFAULT_PERMISSIONS_BY_ROLE.MANAGER]);

  const inviteMember = useMutInviteOrganizationMember(organizationId);

  const handleRoleChange = (value: string) => {
    const newRole = value as OrganizationMemberRole;
    setRole(newRole);
    setPermissions([...DEFAULT_PERMISSIONS_BY_ROLE[newRole]]);
  };

  const togglePermission = (permission: OrganizationMemberPermission) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error("Email is required");
      return;
    }
    if (permissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    try {
      await inviteMember.mutateAsync({
        organizationId,
        email: trimmedEmail,
        role,
        permissions,
      });
      toast.success("Invitation sent");
      setOpen(false);
      setEmail("");
      setRole("MANAGER");
      setPermissions([...DEFAULT_PERMISSIONS_BY_ROLE.MANAGER]);
    } catch (error) {
      toast.error("Failed to send invitation", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization. They&apos;ll receive
            an email with an invitation code and sign-in instructions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              placeholder="staff@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger id="invite-role">
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

            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Reservations
                </p>
                <div className="space-y-1">
                  {RESERVATION_PERMISSIONS.map((permission) => (
                    <label
                      key={permission}
                      htmlFor={`invite-${permission}`}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        id={`invite-${permission}`}
                        checked={permissions.includes(permission)}
                        onCheckedChange={() => togglePermission(permission)}
                      />
                      {PERMISSION_LABELS[permission]}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Administration
                </p>
                <div className="space-y-1">
                  {ADMIN_PERMISSIONS.map((permission) => (
                    <label
                      key={permission}
                      htmlFor={`invite-${permission}`}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        id={`invite-${permission}`}
                        checked={permissions.includes(permission)}
                        onCheckedChange={() => togglePermission(permission)}
                      />
                      {PERMISSION_LABELS[permission]}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={inviteMember.isPending}
          >
            {inviteMember.isPending ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
