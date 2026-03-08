"use client";

import { formatDistanceToNow } from "date-fns";
import { MapPin, RefreshCw, Search, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import {
  type ClaimStatus,
  type ClaimType,
  useModClaims,
  useQueryAdminSidebarStats,
  useQueryClaimCounts,
} from "@/features/admin/hooks";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { cn } from "@/lib/utils";

export default function AdminClaimsPage() {
  const router = useRouter();
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();

  const [activeTab, setActiveTab] = React.useState<ClaimStatus | "all">(
    "pending",
  );
  const [typeFilter, setTypeFilter] = React.useState<ClaimType | "all">("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data: stats } = useQueryAdminSidebarStats();
  const { data: counts } = useQueryClaimCounts();
  const {
    data: claimsData,
    isLoading,
    isFetching,
    refetch,
  } = useModClaims({
    type: typeFilter,
    status: activeTab === "all" ? undefined : activeTab,
    search: search || undefined,
    page,
    limit: 10,
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.admin.claims.base);
  };

  // Reset page when filters change
  const filterKey = `${activeTab}-${typeFilter}-${search}`;

  React.useEffect(() => {
    if (!filterKey) {
      return;
    }
    if (page !== 1) {
      setPage(1);
    }
  }, [filterKey, page]);

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
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
    >
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Claim Requests
            </h1>
            <p className="text-muted-foreground">
              Review and manage venue ownership claims
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as ClaimType | "all")}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="claim">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Claims
                </div>
              </SelectItem>
              <SelectItem value="removal">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Removals
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search venues or organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ClaimStatus | "all")}
        >
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              {counts?.pending ? (
                <Badge variant="secondary" className="ml-1">
                  {counts.pending}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !claimsData || claimsData.claims.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No claims found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claimsData.claims.map((claim) => (
                        <TableRow
                          key={claim.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            router.push(appRoutes.admin.claims.detail(claim.id))
                          }
                        >
                          <TableCell>
                            <Badge
                              variant={
                                claim.type === "removal"
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {claim.type === "removal" ? (
                                <Trash2 className="h-3 w-3 mr-1" />
                              ) : (
                                <Tag className="h-3 w-3 mr-1" />
                              )}
                              {claim.type.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{claim.courtName}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {claim.courtAddress.split(",")[0]}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {claim.organizationName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {claim.ownerName}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {formatDistanceToNow(
                                new Date(claim.submittedAt),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </p>
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={appRoutes.admin.claims.detail(claim.id)}
                              >
                                Review
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {claimsData.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * 10 + 1}-
                      {Math.min(page * 10, claimsData.total)} of{" "}
                      {claimsData.total}
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className={
                              page === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: claimsData.totalPages },
                          (_, i) => i + 1,
                        ).map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setPage(pageNum)}
                              isActive={page === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setPage((p) =>
                                Math.min(claimsData.totalPages, p + 1),
                              )
                            }
                            className={
                              page === claimsData.totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
