"use client";

import {
  Edit,
  ExternalLink,
  History,
  Loader2,
  MapPin,
  MoreHorizontal,
  Power,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";
import { appRoutes } from "@/common/app-routes";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  buildCityOptions,
  buildProvinceOptions,
  findProvinceByName,
} from "@/common/ph-location-data";
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
import {
  type AdminCourt,
  type ClaimStatusFilter,
  type CourtStatus,
  type CourtType,
  type FeaturedFilter,
  useAdminCourts,
  useDeleteAdminPlace,
  useToggleCourtStatus,
} from "@/features/admin/hooks";
import { cn } from "@/lib/utils";

interface AdminPlacesListProps {
  title: string;
  description?: string;
  defaultTypeFilter?: CourtType | "all";
  lockTypeFilter?: boolean;
  primaryActions?: React.ReactNode;
  entityLabel?: { singular: string };
}

export function AdminPlacesList({
  title,
  description,
  defaultTypeFilter = "all",
  lockTypeFilter = false,
  primaryActions,
  entityLabel,
}: AdminPlacesListProps) {
  const [typeFilter, setTypeFilter] = React.useState<CourtType | "all">(
    defaultTypeFilter,
  );
  const [statusFilter, setStatusFilter] = React.useState<CourtStatus | "all">(
    "all",
  );
  const [provinceFilter, setProvinceFilter] = React.useState<string>("all");
  const [cityFilter, setCityFilter] = React.useState<string>("all");
  const [claimStatusFilter, setClaimStatusFilter] = React.useState<
    ClaimStatusFilter | "all"
  >("all");
  const [featuredFilter, setFeaturedFilter] =
    React.useState<FeaturedFilter>("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmValue, setDeleteConfirmValue] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<AdminCourt | null>(
    null,
  );

  const entityName = entityLabel?.singular ?? "Court";

  React.useEffect(() => {
    if (lockTypeFilter) {
      setTypeFilter(defaultTypeFilter);
    }
  }, [defaultTypeFilter, lockTypeFilter]);

  const provincesCitiesQuery = usePHProvincesCitiesQuery();
  const provincesCities = provincesCitiesQuery.data ?? null;

  type LocationOption = { label: string; value: string };

  const provinceOptions = React.useMemo<LocationOption[]>(() => {
    if (!provincesCities) return [];
    return buildProvinceOptions(provincesCities, "name");
  }, [provincesCities]);

  const selectedProvince = React.useMemo(
    () =>
      provincesCities && provinceFilter !== "all"
        ? findProvinceByName(provincesCities, provinceFilter)
        : null,
    [provinceFilter, provincesCities],
  );

  const cityOptions = React.useMemo<LocationOption[]>(() => {
    if (!selectedProvince) return [];
    return buildCityOptions(selectedProvince, "name");
  }, [selectedProvince]);

  const provincePlaceholder = provincesCitiesQuery.isLoading
    ? "Loading provinces..."
    : "All Provinces";

  const cityPlaceholder =
    provinceFilter === "all"
      ? "Select a province first"
      : provincesCitiesQuery.isLoading
        ? "Loading cities..."
        : "All Cities";

  const isProvinceDisabled = provincesCitiesQuery.isLoading || !provincesCities;
  const isCityDisabled = isProvinceDisabled || provinceFilter === "all";

  const { data: courtsData, isLoading } = useAdminCourts({
    type: typeFilter,
    status: statusFilter,
    province: provinceFilter,
    city: cityFilter,
    claimStatus: claimStatusFilter,
    featured: featuredFilter,
    search: search || undefined,
    page,
    limit: 10,
  });

  const toggleStatusMutation = useToggleCourtStatus();
  const deletePlaceMutation = useDeleteAdminPlace();

  const handleToggleStatus = (placeId: string, currentStatus: CourtStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    toggleStatusMutation.mutate(
      { courtId: placeId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(
            `${entityName} ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
          );
        },
        onError: () => {
          toast.error(`Failed to update ${entityName.toLowerCase()} status`);
        },
      },
    );
  };

  const deleteConfirmationMatches =
    deleteConfirmValue.trim().toUpperCase() === "DELETE";

  const handleDeletePlace = () => {
    if (!deleteTarget) {
      return;
    }
    deletePlaceMutation.mutate(
      { placeId: deleteTarget.id },
      {
        onSuccess: () => {
          toast.success(`${entityName} deleted`);
          setDeleteDialogOpen(false);
          setDeleteTarget(null);
          setDeleteConfirmValue("");
        },
        onError: (error) => {
          toast.error(
            error.message || `Failed to delete ${entityName.toLowerCase()}`,
          );
        },
      },
    );
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDeleteTarget(null);
      setDeleteConfirmValue("");
    }
  };

  const filterKey = `${typeFilter}-${statusFilter}-${provinceFilter}-${cityFilter}-${claimStatusFilter}-${featuredFilter}-${search}`;

  React.useEffect(() => {
    if (!filterKey) {
      return;
    }
    if (page !== 1) {
      setPage(1);
    }
  }, [filterKey, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {primaryActions && (
          <div className="flex flex-wrap gap-2">{primaryActions}</div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as CourtType | "all")}
          disabled={lockTypeFilter}
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

        <Select
          value={featuredFilter}
          onValueChange={(v) => setFeaturedFilter(v as FeaturedFilter)}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Featured" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Featured</SelectItem>
            <SelectItem value="featured">Featured only</SelectItem>
            <SelectItem value="not_featured">Not featured</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={provinceFilter}
          onValueChange={(value) => {
            setProvinceFilter(value);
            if (value !== provinceFilter) {
              setCityFilter("all");
            }
          }}
          disabled={isProvinceDisabled}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder={provincePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Provinces</SelectItem>
            {provinceOptions.map((province) => (
              <SelectItem key={province.value} value={province.value}>
                {province.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={provinceFilter === "all" ? "" : cityFilter}
          onValueChange={(value) => setCityFilter(value)}
          disabled={isCityDisabled}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder={cityPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cityOptions.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                {city.label}
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
            <SelectItem value="removal_requested">Removal Requested</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${entityName.toLowerCase()}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !courtsData || courtsData.courts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No {entityName.toLowerCase()}s found
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{entityName}</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courtsData.courts.map((place) => (
                  <TableRow key={place.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {place.imageUrl && (
                          <Image
                            src={place.imageUrl}
                            alt={place.name}
                            width={48}
                            height={36}
                            className="w-12 h-9 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{place.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {place.city}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          place.type === "reservable" ? "default" : "secondary"
                        }
                      >
                        {place.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {place.organizationName || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            place.status === "active"
                              ? "bg-success"
                              : "bg-muted-foreground",
                          )}
                        />
                        <span className="text-sm capitalize">
                          {place.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {place.featuredRank && place.featuredRank > 0 ? (
                        <Badge variant="paid" className="text-[10px]">
                          #{place.featuredRank}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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
                              href={appRoutes.places.detail(
                                place.slug ?? place.id,
                              )}
                              target="_blank"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`${appRoutes.admin.courts.base}/${place.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit {entityName}
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(place.id, place.status)
                            }
                            disabled={toggleStatusMutation.isPending}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {place.status === "active"
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <History className="h-4 w-4 mr-2" />
                            View History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setDeleteTarget(place);
                              setDeleteConfirmValue("");
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                            disabled={deletePlaceMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete {entityName}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.name ?? entityName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the listing and detach courts.
              Existing reservations remain for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-semibold text-foreground">DELETE</span>{" "}
              to confirm.
            </p>
            <Input
              value={deleteConfirmValue}
              onChange={(event) => setDeleteConfirmValue(event.target.value)}
              placeholder="DELETE"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlaceMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDeletePlace();
              }}
              disabled={
                deletePlaceMutation.isPending || !deleteConfirmationMatches
              }
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletePlaceMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete {entityName}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
