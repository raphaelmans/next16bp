"use client";

import {
  Edit,
  ExternalLink,
  History,
  MapPin,
  MoreHorizontal,
  Plus,
  Power,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import {
  type AdminCourt,
  type ClaimStatusFilter,
  type CourtStatus,
  type CourtType,
  useAdminCourts,
  useCities,
  useToggleCourtStatus,
} from "@/features/admin/hooks/use-admin-courts";
import { useAdminStats } from "@/features/admin/hooks/use-admin-dashboard";
import { useLogout, useSession } from "@/features/auth";
import { cn } from "@/lib/utils";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";

const _claimStatusLabels: Record<ClaimStatusFilter, string> = {
  unclaimed: "Unclaimed",
  claim_pending: "Claim Pending",
  claimed: "Claimed",
  removal_requested: "Removal Requested",
};

export default function AdminCourtsPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const [typeFilter, setTypeFilter] = React.useState<CourtType | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<CourtStatus | "all">(
    "all",
  );
  const [cityFilter, setCityFilter] = React.useState<string>("all");
  const [claimStatusFilter, setClaimStatusFilter] = React.useState<
    ClaimStatusFilter | "all"
  >("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data: stats } = useAdminStats();
  const { data: cities = [] } = useCities();
  const { data: courtsData, isLoading } = useAdminCourts({
    type: typeFilter,
    status: statusFilter,
    city: cityFilter,
    claimStatus: claimStatusFilter,
    search: search || undefined,
    page,
    limit: 10,
  });

  const toggleStatusMutation = useToggleCourtStatus();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.admin.courts.base);
  };

  const handleToggleStatus = (courtId: string, currentStatus: CourtStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    toggleStatusMutation.mutate(
      { courtId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            `Court ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
          );
        },
        onError: () => {
          toast.error("Failed to update court status");
        },
      },
    );
  };

  // Reset page when filters change
  const filterKey = `${typeFilter}-${statusFilter}-${cityFilter}-${claimStatusFilter}-${search}`;
  const prevFilterKey = React.useRef(filterKey);

  if (filterKey !== prevFilterKey.current) {
    prevFilterKey.current = filterKey;
    if (page !== 1) {
      setPage(1);
    }
  }

  return (
    <AppShell
      sidebar={
        <AdminSidebar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          pendingClaimsCount={stats?.pendingClaims || 0}
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              All Courts
            </h1>
            <p className="text-muted-foreground">
              Manage all courts on the platform
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={appRoutes.admin.courts.batch}>
                <Plus className="mr-2 h-4 w-4" />
                Batch Add Courts
              </Link>
            </Button>
            <Button asChild>
              <Link href={appRoutes.admin.courts.new}>
                <Plus className="mr-2 h-4 w-4" />
                Add Curated Court
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as CourtType | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="curated">Curated</SelectItem>
              <SelectItem value="reservable">Reservable</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as CourtStatus | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={claimStatusFilter}
            onValueChange={(v) =>
              setClaimStatusFilter(v as ClaimStatusFilter | "all")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Claim Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Claim Status</SelectItem>
              <SelectItem value="unclaimed">Unclaimed</SelectItem>
              <SelectItem value="claim_pending">Claim Pending</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="removal_requested">
                Removal Requested
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : !courtsData || courtsData.courts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No courts found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Court</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courtsData.courts.map((court: AdminCourt) => (
                    <TableRow
                      key={court.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        // TODO: Navigate to /admin/courts/[id] when the page exists
                        toast.info("Court detail page coming soon");
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {court.imageUrl && (
                            <Image
                              src={court.imageUrl}
                              alt={court.name}
                              width={48}
                              height={36}
                              className="w-12 h-9 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{court.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {court.city}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            court.type === "reservable"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {court.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {court.organizationName || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              court.status === "active"
                                ? "bg-success"
                                : "bg-muted-foreground",
                            )}
                          />
                          <span className="text-sm capitalize">
                            {court.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={appRoutes.courts.detail(court.id)}
                                target="_blank"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`${appRoutes.admin.courts.base}/${court.id}`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Court
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleStatus(court.id, court.status)
                              }
                            >
                              <Power className="h-4 w-4 mr-2" />
                              {court.status === "active"
                                ? "Deactivate"
                                : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <History className="h-4 w-4 mr-2" />
                              View History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {courtsData.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 10 + 1}-
                  {Math.min(page * 10, courtsData.total)} of {courtsData.total}
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
                      { length: Math.min(courtsData.totalPages, 5) },
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
                          setPage((p) => Math.min(courtsData.totalPages, p + 1))
                        }
                        className={
                          page === courtsData.totalPages
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
      </div>
    </AppShell>
  );
}
