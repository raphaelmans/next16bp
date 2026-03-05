"use client";

import {
  ChevronDown,
  Copy,
  Edit,
  ExternalLink,
  History,
  MapPin,
  MoreHorizontal,
  Phone,
  Power,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import { useDebouncedValue } from "@/common/hooks/use-debounced-value";
import {
  buildCityOptions,
  buildProvinceOptions,
  findProvinceByName,
} from "@/common/ph-location-data";
import { toast } from "@/common/toast";
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
import { Spinner } from "@/components/ui/spinner";
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
  useModAdminCourts,
  useMutDeleteAdminPlace,
  useMutToggleCourtStatus,
  useQueryAdminCourt,
} from "@/features/admin/hooks";
import { cn } from "@/lib/utils";
import { AdminPlacesFilters } from "./admin-places-filters";

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
  const debouncedSearch = useDebouncedValue(search, 2000);
  const [page, setPage] = React.useState(1);
  const [expandedPlaceId, setExpandedPlaceId] = React.useState<string | null>(
    null,
  );
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

  const { data: courtsData, isLoading } = useModAdminCourts({
    type: typeFilter,
    status: statusFilter,
    province: provinceFilter,
    city: cityFilter,
    claimStatus: claimStatusFilter,
    featured: featuredFilter,
    search: debouncedSearch || undefined,
    page,
    limit: 10,
  });

  const toggleStatusMutation = useMutToggleCourtStatus();
  const deletePlaceMutation = useMutDeleteAdminPlace();
  const expandedDetailsQuery = useQueryAdminCourt(expandedPlaceId ?? "");

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

  const filterKey = `${typeFilter}-${statusFilter}-${provinceFilter}-${cityFilter}-${claimStatusFilter}-${featuredFilter}-${debouncedSearch}`;

  React.useEffect(() => {
    if (!filterKey) {
      return;
    }
    if (page !== 1) {
      setPage(1);
    }
  }, [filterKey, page]);

  React.useEffect(() => {
    if (!expandedPlaceId) {
      return;
    }
    const stillOnPage =
      courtsData?.courts.some((court) => court.id === expandedPlaceId) ?? false;
    if (!stillOnPage) {
      setExpandedPlaceId(null);
    }
  }, [courtsData?.courts, expandedPlaceId]);

  const handleToggleExpanded = (placeId: string) => {
    setExpandedPlaceId((current) => (current === placeId ? null : placeId));
  };

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPlacesFilters
        title={title}
        description={description}
        primaryActions={primaryActions}
        entityName={entityName}
        lockTypeFilter={lockTypeFilter}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        featuredFilter={featuredFilter}
        provinceFilter={provinceFilter}
        cityFilter={cityFilter}
        claimStatusFilter={claimStatusFilter}
        search={search}
        provinceOptions={provinceOptions}
        cityOptions={cityOptions}
        provincePlaceholder={provincePlaceholder}
        cityPlaceholder={cityPlaceholder}
        isProvinceDisabled={isProvinceDisabled}
        isCityDisabled={isCityDisabled}
        onTypeFilterChange={setTypeFilter}
        onStatusFilterChange={setStatusFilter}
        onFeaturedFilterChange={setFeaturedFilter}
        onProvinceFilterChange={(value) => {
          setProvinceFilter(value);
          if (value !== provinceFilter) {
            setCityFilter("all");
          }
        }}
        onCityFilterChange={setCityFilter}
        onClaimStatusFilterChange={setClaimStatusFilter}
        onSearchChange={setSearch}
      />

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
                  <TableHead className="w-[44px]" />
                  <TableHead>{entityName}</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courtsData.courts.map((place) => {
                  const isExpanded = expandedPlaceId === place.id;
                  const details = isExpanded ? expandedDetailsQuery.data : null;
                  const isDetailsLoading =
                    isExpanded && expandedDetailsQuery.isLoading;
                  const detailsError = isExpanded
                    ? expandedDetailsQuery.error
                    : null;

                  return (
                    <React.Fragment key={place.id}>
                      <TableRow
                        className={cn(
                          "hover:bg-muted/50",
                          isExpanded && "bg-muted/30",
                        )}
                      >
                        <TableCell className="p-2 align-top">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpanded(place.id);
                            }}
                            aria-label={
                              isExpanded
                                ? `Collapse ${place.name}`
                                : `Expand ${place.name}`
                            }
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                isExpanded && "rotate-180",
                              )}
                            />
                          </Button>
                        </TableCell>
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
                              place.type === "reservable"
                                ? "default"
                                : "secondary"
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

                      {isExpanded && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={7} className="p-0">
                            <div className="border-t">
                              <div className="px-5 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-[11px]"
                                    >
                                      Inline details
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {place.slug ? place.slug : place.id}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        void handleCopy("Place ID", place.id)
                                      }
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy ID
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                      <Link
                                        href={appRoutes.places.detail(
                                          place.slug ?? place.id,
                                        )}
                                        target="_blank"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open public
                                      </Link>
                                    </Button>
                                    <Button size="sm" asChild>
                                      <Link
                                        href={`${appRoutes.admin.courts.base}/${place.id}`}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </Link>
                                    </Button>
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                  <div className="rounded-lg border bg-background/60 p-4">
                                    <div className="flex items-center justify-between gap-2">
                                      <h3 className="text-sm font-heading font-semibold">
                                        Location
                                      </h3>
                                      <Badge
                                        variant="secondary"
                                        className="text-[11px]"
                                      >
                                        {place.type}
                                      </Badge>
                                    </div>
                                    {isDetailsLoading ? (
                                      <div className="mt-3 text-sm text-muted-foreground">
                                        Loading details...
                                      </div>
                                    ) : details ? (
                                      <div className="mt-3 space-y-2 text-sm">
                                        <div>
                                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Address
                                          </div>
                                          <div className="font-medium">
                                            {details.place.address}
                                          </div>
                                          <div className="text-muted-foreground">
                                            {details.place.city},{" "}
                                            {details.place.province}
                                          </div>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                          <div>
                                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                              extGPlaceId
                                            </div>
                                            <div className="font-medium">
                                              {details.place.extGPlaceId || "-"}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : detailsError ? (
                                      <div className="mt-3 text-sm">
                                        <p className="text-destructive">
                                          Failed to load details.
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="mt-2"
                                          onClick={() =>
                                            expandedDetailsQuery.refetch()
                                          }
                                        >
                                          Retry
                                        </Button>
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="rounded-lg border bg-background/60 p-4">
                                    <div className="flex items-center justify-between gap-2">
                                      <h3 className="text-sm font-heading font-semibold">
                                        Ownership
                                      </h3>
                                      {details?.place.claimStatus && (
                                        <Badge
                                          variant="outline"
                                          className="text-[11px]"
                                        >
                                          {details.place.claimStatus}
                                        </Badge>
                                      )}
                                    </div>
                                    {isDetailsLoading ? (
                                      <div className="mt-3 text-sm text-muted-foreground">
                                        Loading details...
                                      </div>
                                    ) : details ? (
                                      <div className="mt-3 space-y-2 text-sm">
                                        <div>
                                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Organization
                                          </div>
                                          <div className="font-medium">
                                            {details.organization?.name ||
                                              "Unowned"}
                                          </div>
                                          {details.organization?.slug && (
                                            <div className="text-muted-foreground">
                                              {details.organization.slug}
                                            </div>
                                          )}
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-2">
                                          <div>
                                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                              Featured rank
                                            </div>
                                            <div className="font-medium">
                                              {details.place.featuredRank > 0
                                                ? `#${details.place.featuredRank}`
                                                : "-"}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                              Status
                                            </div>
                                            <div className="font-medium">
                                              {details.place.isActive
                                                ? "active"
                                                : "inactive"}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="rounded-lg border bg-background/60 p-4">
                                    <h3 className="text-sm font-heading font-semibold">
                                      Contact
                                    </h3>
                                    {isDetailsLoading ? (
                                      <div className="mt-3 text-sm text-muted-foreground">
                                        Loading details...
                                      </div>
                                    ) : details ? (
                                      <div className="mt-3 flex flex-col gap-2 text-sm">
                                        {details.contactDetail?.phoneNumber ? (
                                          <a
                                            href={`tel:${details.contactDetail.phoneNumber}`}
                                            className="inline-flex items-center gap-2 text-foreground hover:underline"
                                            target="_blank"
                                            rel="noreferrer"
                                          >
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            {details.contactDetail.phoneNumber}
                                          </a>
                                        ) : (
                                          <span className="text-muted-foreground">
                                            No contact details
                                          </span>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                          {details.contactDetail
                                            ?.websiteUrl && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              asChild
                                            >
                                              <a
                                                href={
                                                  details.contactDetail
                                                    .websiteUrl
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                              >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Website
                                              </a>
                                            </Button>
                                          )}
                                          {details.contactDetail
                                            ?.facebookUrl && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              asChild
                                            >
                                              <a
                                                href={
                                                  details.contactDetail
                                                    .facebookUrl
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                              >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Facebook
                                              </a>
                                            </Button>
                                          )}
                                          {details.contactDetail
                                            ?.instagramUrl && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              asChild
                                            >
                                              <a
                                                href={
                                                  details.contactDetail
                                                    .instagramUrl
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                              >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Instagram
                                              </a>
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="rounded-lg border bg-background/60 p-4">
                                    <h3 className="text-sm font-heading font-semibold">
                                      Courts & amenities
                                    </h3>
                                    {isDetailsLoading ? (
                                      <div className="mt-3 text-sm text-muted-foreground">
                                        Loading details...
                                      </div>
                                    ) : details ? (
                                      <div className="mt-3 space-y-3">
                                        <div>
                                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Court units
                                          </div>
                                          {details.courts.length > 0 ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                              {details.courts
                                                .slice(0, 8)
                                                .map((item) => (
                                                  <Badge
                                                    key={item.court.id}
                                                    variant="secondary"
                                                    className="px-2 py-1"
                                                  >
                                                    {item.sport.name}:{" "}
                                                    {item.court.label}
                                                    {item.court.tierLabel
                                                      ? ` (${item.court.tierLabel})`
                                                      : ""}
                                                  </Badge>
                                                ))}
                                              {details.courts.length > 8 && (
                                                <span className="text-sm text-muted-foreground">
                                                  +{details.courts.length - 8}{" "}
                                                  more
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                              No courts attached
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                            Amenities
                                          </div>
                                          {details.amenities.length > 0 ? (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                              {details.amenities
                                                .slice(0, 10)
                                                .map((a) => (
                                                  <Badge
                                                    key={a.id}
                                                    variant="outline"
                                                  >
                                                    {a.name}
                                                  </Badge>
                                                ))}
                                              {details.amenities.length >
                                                10 && (
                                                <span className="text-sm text-muted-foreground">
                                                  +
                                                  {details.amenities.length -
                                                    10}{" "}
                                                  more
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                              No amenities
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>

                                {!isDetailsLoading && details && (
                                  <div className="mt-4 rounded-lg border bg-background/60 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <h3 className="text-sm font-heading font-semibold">
                                        Media
                                      </h3>
                                      <div className="text-sm text-muted-foreground">
                                        {details.photos.length} photos •{" "}
                                        {details.amenities.length} amenities
                                      </div>
                                    </div>

                                    {details.photos.length > 0 ? (
                                      <div className="mt-3 flex gap-2 overflow-x-auto">
                                        {details.photos
                                          .slice(0, 3)
                                          .map((photo) => (
                                            <div
                                              key={photo.id}
                                              className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md border"
                                            >
                                              <Image
                                                src={photo.url}
                                                alt={`${place.name} photo`}
                                                fill
                                                sizes="112px"
                                                className="object-cover"
                                              />
                                            </div>
                                          ))}
                                      </div>
                                    ) : (
                                      <div className="mt-3 text-sm text-muted-foreground">
                                        No photos
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
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
              {deletePlaceMutation.isPending && <Spinner className="mr-2" />}
              Delete {entityName}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
