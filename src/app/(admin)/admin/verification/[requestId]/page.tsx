"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import { PlaceVerificationReviewActions } from "@/features/admin/components/place-verification-review-actions";
import {
  useAdminSidebarStats,
  useApprovePlaceVerification,
  usePlaceVerificationRequest,
  useRejectPlaceVerification,
} from "@/features/admin/hooks";
import { useLogout, useSession } from "@/features/auth";
import { SupportChatSheet } from "@/features/support-chat/components/support-chat-sheet";
import { cn } from "@/lib/utils";

const statusConfig = {
  PENDING: {
    label: "Pending review",
    variant: "warning" as const,
    icon: Clock,
    bgClass: "bg-warning/10 border-warning/20",
    textClass: "text-warning",
  },
  APPROVED: {
    label: "Approved",
    variant: "success" as const,
    icon: CheckCircle2,
    bgClass: "bg-success/10 border-success/20",
    textClass: "text-success",
  },
  REJECTED: {
    label: "Rejected",
    variant: "destructive" as const,
    icon: XCircle,
    bgClass: "bg-destructive/10 border-destructive/20",
    textClass: "text-destructive",
  },
};

export default function AdminVerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.requestId as string;

  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: stats } = useAdminSidebarStats();
  const { data, isLoading } = usePlaceVerificationRequest(requestId);
  const approveMutation = useApprovePlaceVerification();
  const rejectMutation = useRejectPlaceVerification();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.admin.placeVerification.detail(requestId),
    );
  };

  const handleApprove = (notes?: string) => {
    approveMutation.mutate(
      { requestId, reviewNotes: notes },
      {
        onSuccess: () => {
          toast.success("Verification approved");
          router.push(appRoutes.admin.placeVerification.base);
        },
        onError: () => {
          toast.error("Failed to approve verification");
        },
      },
    );
  };

  const handleReject = (reason: string) => {
    rejectMutation.mutate(
      { requestId, reviewNotes: reason },
      {
        onSuccess: () => {
          toast.success("Verification rejected");
          router.push(appRoutes.admin.placeVerification.base);
        },
        onError: () => {
          toast.error("Failed to reject verification");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <AppShell
        sidebar={
          <AdminSidebar
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            pendingClaimsCount={stats?.pendingClaims || 0}
            pendingVerificationsCount={stats?.pendingVerifications || 0}
          />
        }
        navbar={
          <AdminNavbar
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            onLogout={handleLogout}
          />
        }
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell
        sidebar={
          <AdminSidebar
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            pendingClaimsCount={stats?.pendingClaims || 0}
            pendingVerificationsCount={stats?.pendingVerifications || 0}
          />
        }
        navbar={
          <AdminNavbar
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            onLogout={handleLogout}
          />
        }
      >
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">Verification not found</h2>
          <p className="text-muted-foreground mb-4">
            The request you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href={appRoutes.admin.placeVerification.base}>
              Back to queue
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  if (!data.request || !data.place) {
    return (
      <AppShell
        sidebar={
          <AdminSidebar
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            pendingClaimsCount={stats?.pendingClaims || 0}
            pendingVerificationsCount={stats?.pendingVerifications || 0}
          />
        }
        navbar={
          <AdminNavbar
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            onLogout={handleLogout}
          />
        }
      >
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">Verification not found</h2>
          <p className="text-muted-foreground mb-4">
            The request you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href={appRoutes.admin.placeVerification.base}>
              Back to queue
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const request = data.request;
  const place = data.place;
  const organization = data.organization;
  const documents = data.documents ?? [];
  const events = data.events ?? [];

  const config = statusConfig[request.status];
  const StatusIcon = config.icon;
  const isPending = request.status === "PENDING";

  return (
    <AppShell
      sidebar={
        <AdminSidebar
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
          pendingClaimsCount={stats?.pendingClaims || 0}
          pendingVerificationsCount={stats?.pendingVerifications || 0}
        />
      }
      navbar={
        <AdminNavbar
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
          onLogout={handleLogout}
        />
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={appRoutes.admin.placeVerification.base}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight font-heading">
                Venue verification
              </h1>
              <Badge
                variant={config.variant}
                className="flex items-center gap-1"
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Review request from {organization?.name ?? "Guest"}
            </p>
          </div>
        </div>

        <Alert className={cn(config.bgClass, "border")}>
          <StatusIcon className={cn("h-4 w-4", config.textClass)} />
          <AlertTitle className={config.textClass}>{config.label}</AlertTitle>
          <AlertDescription className={config.textClass}>
            {request.status === "PENDING" ? (
              <>
                Submitted{" "}
                {formatDistanceToNow(new Date(request.createdAt), {
                  addSuffix: true,
                })}
              </>
            ) : request.reviewedAt ? (
              <>
                Reviewed on{" "}
                {format(new Date(request.reviewedAt), "MMM d, yyyy")}
                {request.reviewerUserId ? ` by ${request.reviewerUserId}` : ""}
              </>
            ) : (
              "Reviewed"
            )}
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Venue details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{place.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {place.address}, {place.city}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Venue ID: {place.id}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-base font-medium">
                  {organization?.name ?? "Guest request"}
                </p>
                {organization?.id && (
                  <p className="text-sm text-muted-foreground">
                    Organization ID: {organization.id}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
                <CardDescription>
                  Review supporting documents submitted by the owner.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No documents uploaded.
                  </p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{doc.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.mimeType} ·{" "}
                          {((doc.sizeBytes ?? 0) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      {doc.fileUrl ? (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View file
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </a>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" disabled>
                          Unavailable
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {request.requestNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Requester notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {request.requestNotes}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="relative">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-2",
                            event.toStatus === "PENDING" && "bg-accent",
                            event.toStatus === "APPROVED" && "bg-success",
                            event.toStatus === "REJECTED" && "bg-destructive",
                          )}
                        />
                        {index < events.length - 1 && (
                          <div className="absolute top-4 left-[3px] w-0.5 h-full bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">
                          {event.notes ?? `Status changed to ${event.toStatus}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(event.createdAt),
                            "MMM d, yyyy 'at' h:mm a",
                          )}
                          {event.triggeredByUserId
                            ? ` · ${event.triggeredByUserId}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Chat</CardTitle>
                <CardDescription>
                  Message the owner for clarifications and missing details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SupportChatSheet
                  kind="verification"
                  requestId={requestId}
                  triggerLabel="Message owner"
                  triggerVariant="outline"
                />
              </CardContent>
            </Card>

            {isPending ? (
              <PlaceVerificationReviewActions
                placeName={place.name}
                organizationName={organization?.name ?? "Guest"}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={
                  approveMutation.isPending || rejectMutation.isPending
                }
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Review Complete</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {request.status === "APPROVED" ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className="font-medium">
                        {request.status === "APPROVED"
                          ? "Approved"
                          : "Rejected"}
                      </span>
                    </div>
                    {request.reviewNotes && (
                      <div>
                        <p className="text-sm font-medium mb-1">Review Notes</p>
                        <p className="text-sm text-muted-foreground">
                          {request.reviewNotes}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {request.reviewedAt
                        ? `Reviewed on ${format(new Date(request.reviewedAt), "MMM d, yyyy 'at' h:mm a")}`
                        : "Review date unavailable"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Verification summary</CardTitle>
                <CardDescription>What happens after approval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  <span>Venue is marked verified for players.</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-accent" />
                  <span>
                    Reservations remain disabled until owner enables them.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
