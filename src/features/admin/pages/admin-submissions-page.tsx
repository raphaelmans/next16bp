"use client";

import { Ban, Check, X } from "lucide-react";
import * as React from "react";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import {
  type SubmissionStatus,
  useMutAdminApproveSubmission,
  useMutAdminBanSubmitter,
  useMutAdminRejectSubmission,
  useQueryAdminSidebarStats,
  useQueryAdminSubmissions,
} from "@/features/admin/hooks";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";

export default function AdminSubmissionsPage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const { data: stats } = useQueryAdminSidebarStats();

  const [statusFilter, setStatusFilter] = React.useState<
    SubmissionStatus | "all"
  >("PENDING");

  const { data, isLoading } = useQueryAdminSubmissions({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50,
  });

  const approveMutation = useMutAdminApproveSubmission();
  const rejectMutation = useMutAdminRejectSubmission();
  const banMutation = useMutAdminBanSubmitter();

  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectTargetId, setRejectTargetId] = React.useState<string | null>(
    null,
  );
  const [rejectReason, setRejectReason] = React.useState("");

  const [banDialogOpen, setBanDialogOpen] = React.useState(false);
  const [banTargetUserId, setBanTargetUserId] = React.useState<string | null>(
    null,
  );
  const [banReason, setBanReason] = React.useState("");

  const handleApprove = (submissionId: string) => {
    approveMutation.mutate(
      { submissionId },
      {
        onSuccess: () => toast.success("Submission approved"),
        onError: (err) => toast.error(getClientErrorMessage(err)),
      },
    );
  };

  const handleRejectConfirm = () => {
    if (!rejectTargetId || !rejectReason.trim()) return;
    rejectMutation.mutate(
      { submissionId: rejectTargetId, reason: rejectReason.trim() },
      {
        onSuccess: () => {
          toast.success("Submission rejected");
          setRejectDialogOpen(false);
          setRejectTargetId(null);
          setRejectReason("");
        },
        onError: (err) => toast.error(getClientErrorMessage(err)),
      },
    );
  };

  const handleBanConfirm = () => {
    if (!banTargetUserId || !banReason.trim()) return;
    banMutation.mutate(
      { userId: banTargetUserId, reason: banReason.trim() },
      {
        onSuccess: () => {
          toast.success("User banned from submissions");
          setBanDialogOpen(false);
          setBanTargetUserId(null);
          setBanReason("");
        },
        onError: (err) => toast.error(getClientErrorMessage(err)),
      },
    );
  };

  type SubmissionItem = {
    id: string;
    status: SubmissionStatus;
    submittedByUserId: string;
    rejectionReason: string | null;
    createdAt: string;
    place: { name: string; city: string; province: string };
    courts?: { sportName: string; count: number }[];
  };

  const submissions =
    (data as { items: SubmissionItem[]; total: number } | undefined)?.items ??
    [];

  return (
    <AppShell
      navbar={
        <AdminNavbar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={() => logoutMutation.mutate()}
        />
      }
      sidebar={
        <AdminSidebar
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
          pendingClaimsCount={stats?.pendingClaims || 0}
          pendingVerificationsCount={stats?.pendingVerifications || 0}
        />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Venue Submissions"
          description="Review user-submitted venues."
        />

        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as SubmissionStatus | "all")
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No submissions found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {submission.place.name}
                    </CardTitle>
                    <Badge
                      variant={
                        submission.status === "PENDING"
                          ? "secondary"
                          : submission.status === "APPROVED"
                            ? "default"
                            : "destructive"
                      }
                    >
                      {submission.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {submission.place.city}, {submission.place.province}{" "}
                    &middot;{" "}
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submission.courts && submission.courts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {submission.courts.map((c) => (
                        <Badge key={c.sportName} variant="outline">
                          {c.sportName} &times;{c.count}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      User: {submission.submittedByUserId.slice(0, 8)}...
                    </span>
                    {submission.status === "REJECTED" &&
                      submission.rejectionReason && (
                        <span className="text-xs text-destructive">
                          Reason: {submission.rejectionReason}
                        </span>
                      )}
                  </div>
                  {submission.status === "PENDING" && (
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(submission.id)}
                        disabled={approveMutation.isPending}
                        loading={approveMutation.isPending}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectTargetId(submission.id);
                          setRejectReason("");
                          setRejectDialogOpen(true);
                        }}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setBanTargetUserId(submission.submittedByUserId);
                          setBanReason("");
                          setBanDialogOpen(true);
                        }}
                      >
                        <Ban className="mr-1 h-3 w-3" />
                        Ban User
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this venue submission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectReason.trim()}
              loading={rejectMutation.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              This user will be prevented from submitting venues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Input
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter ban reason..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanConfirm}
              disabled={banMutation.isPending || !banReason.trim()}
              loading={banMutation.isPending}
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
