"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Tag,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import { ClaimReviewActions } from "@/features/admin/components/claim-review-actions";
import {
  useAdminStats,
  useApproveClaim,
  useClaim,
  useClaimEvents,
  useRejectClaim,
} from "@/features/admin/hooks";
import { useLogout, useSession } from "@/features/auth";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: "Pending Review",
    variant: "secondary" as const,
    bgClass: "bg-warning/10 border-warning/20",
    textClass: "text-warning",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    variant: "secondary" as const,
    bgClass: "bg-success/10 border-success/20",
    textClass: "text-success",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    variant: "outline" as const,
    bgClass: "bg-destructive/10 border-destructive/20",
    textClass: "text-destructive",
    icon: XCircle,
  },
};

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;

  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: stats } = useAdminStats();
  const { data: claim, isLoading: claimLoading } = useClaim(claimId);
  const { data: events = [] } = useClaimEvents(claimId);
  const approveMutation = useApproveClaim();
  const rejectMutation = useRejectClaim();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.admin.claims.detail(claimId),
    );
  };

  const handleApprove = (notes?: string) => {
    approveMutation.mutate(
      { requestId: claimId, reviewNotes: notes },
      {
        onSuccess: () => {
          toast.success("Claim approved successfully");
          router.push(appRoutes.admin.claims.base);
        },
        onError: () => {
          toast.error("Failed to approve claim");
        },
      },
    );
  };

  const handleReject = (reason: string) => {
    rejectMutation.mutate(
      { requestId: claimId, reviewNotes: reason },
      {
        onSuccess: () => {
          toast.success("Claim rejected");
          router.push(appRoutes.admin.claims.base);
        },
        onError: () => {
          toast.error("Failed to reject claim");
        },
      },
    );
  };

  const isPending = claim?.status === "pending";
  const config = claim ? statusConfig[claim.status] : statusConfig.pending;
  const StatusIcon = config.icon;

  if (claimLoading) {
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

  if (!claim) {
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
          <h2 className="text-lg font-medium">Claim not found</h2>
          <p className="text-muted-foreground mb-4">
            The claim you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href={appRoutes.admin.claims.base}>Back to Claims</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

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
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={appRoutes.admin.base}>Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={appRoutes.admin.claims.base}>
                Claims
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Claim #{claimId.split("-")[1]}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back button and header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={appRoutes.admin.claims.base}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight font-heading">
                {claim.type === "removal"
                  ? "Removal Request"
                  : "Ownership Claim"}
              </h1>
              <Badge
                variant={claim.type === "removal" ? "destructive" : "default"}
              >
                {claim.type === "removal" ? (
                  <Trash2 className="h-3 w-3 mr-1" />
                ) : (
                  <Tag className="h-3 w-3 mr-1" />
                )}
                {claim.type.toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground">{claim.courtName}</p>
          </div>
        </div>

        {/* Status Banner */}
        <Alert className={cn(config.bgClass, "border")}>
          <StatusIcon className={cn("h-4 w-4", config.textClass)} />
          <AlertTitle className={config.textClass}>{config.label}</AlertTitle>
          <AlertDescription className={config.textClass}>
            {claim.status === "pending" ? (
              <>
                Submitted{" "}
                {formatDistanceToNow(new Date(claim.submittedAt), {
                  addSuffix: true,
                })}{" "}
                by {claim.ownerName}
              </>
            ) : claim.reviewedAt ? (
              <>
                Reviewed on {format(new Date(claim.reviewedAt), "MMM d, yyyy")}{" "}
                by {claim.reviewedBy}
              </>
            ) : (
              <>Reviewed by {claim.reviewedBy}</>
            )}
          </AlertDescription>
        </Alert>

        {/* Two column layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          {/* Left column - Details */}
          <div className="space-y-6">
            {/* Court Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Court Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  {claim.courtImageUrl && (
                    <Image
                      src={claim.courtImageUrl}
                      alt={claim.courtName}
                      width={128}
                      height={96}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="space-y-2">
                    <h3 className="font-semibold">{claim.courtName}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {claim.courtAddress}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {claim.courtStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/courts/${claim.courtId}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Court Details
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Claiming Organization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {claim.type === "removal"
                    ? "Requesting Organization"
                    : "Claiming Organization"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {claim.organizationName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{claim.organizationName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {claim.courtsOwnedCount} court
                      {claim.courtsOwnedCount !== 1 ? "s" : ""} owned
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{claim.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{claim.ownerEmail}</span>
                  </div>
                  {claim.ownerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{claim.ownerPhone}</span>
                    </div>
                  )}
                  {claim.guestName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Guest: {claim.guestName}</span>
                    </div>
                  )}
                  {claim.guestEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{claim.guestEmail}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Request Notes */}
            {claim.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Request Notes</CardTitle>
                  <CardDescription>
                    Notes provided by the requester
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{claim.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
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
                            event.type === "submitted" && "bg-accent",
                            event.type === "approved" && "bg-success",
                            event.type === "rejected" && "bg-destructive",
                            event.type === "note_added" &&
                              "bg-muted-foreground",
                          )}
                        />
                        {index < events.length - 1 && (
                          <div className="absolute top-4 left-[3px] w-0.5 h-full bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">
                          {event.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(event.timestamp),
                            "MMM d, yyyy 'at' h:mm a",
                          )}{" "}
                          by {event.actor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Actions */}
          <div className="space-y-6">
            {isPending ? (
              <ClaimReviewActions
                claimType={claim.type}
                courtName={claim.courtName}
                organizationName={claim.organizationName}
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
                      {claim.status === "approved" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">
                        {claim.status === "approved" ? "Approved" : "Rejected"}{" "}
                        by {claim.reviewedBy}
                      </span>
                    </div>
                    {claim.reviewNotes && (
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Review Notes:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {claim.reviewNotes}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {claim.reviewedAt
                        ? `Reviewed on ${format(
                            new Date(claim.reviewedAt),
                            "MMM d, yyyy 'at' h:mm a",
                          )}`
                        : "Review date unavailable"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
