"use client";

import { Filter, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ClaimStatusFilter,
  CourtSortBy,
  CourtSource,
  CourtStatus,
  CourtType,
  FeaturedFilter,
  SortOrder,
} from "@/features/admin/hooks";

type Option = { label: string; value: string };

type PendingFilters = {
  type: CourtType | "all";
  status: CourtStatus | "all";
  featured: FeaturedFilter;
  province: string;
  city: string;
  claimStatus: ClaimStatusFilter | "all";
  source: CourtSource | "all";
  sortBy: CourtSortBy;
  sortOrder: SortOrder;
};

export type AdminPlacesFiltersProps = {
  title: string;
  description?: string;
  primaryActions?: React.ReactNode;
  entityName: string;
  lockTypeFilter: boolean;
  typeFilter: CourtType | "all";
  statusFilter: CourtStatus | "all";
  featuredFilter: FeaturedFilter;
  provinceFilter: string;
  cityFilter: string;
  claimStatusFilter: ClaimStatusFilter | "all";
  sourceFilter: CourtSource | "all";
  sortBy: CourtSortBy;
  sortOrder: SortOrder;
  search: string;
  provinceOptions: Option[];
  getCityOptionsForProvince: (province: string) => Option[];
  provincePlaceholder: string;
  cityPlaceholder: string;
  isProvinceDisabled: boolean;
  onApplyFilters: (batch: {
    type?: string;
    status?: string;
    province?: string;
    city?: string;
    claimStatus?: string;
    featured?: string;
    source?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => void;
  onSearchChange: (value: string) => void;
};

function filtersMatch(a: PendingFilters, b: PendingFilters): boolean {
  return (
    a.type === b.type &&
    a.status === b.status &&
    a.featured === b.featured &&
    a.province === b.province &&
    a.city === b.city &&
    a.claimStatus === b.claimStatus &&
    a.source === b.source &&
    a.sortBy === b.sortBy &&
    a.sortOrder === b.sortOrder
  );
}

export function AdminPlacesFilters(props: AdminPlacesFiltersProps) {
  const {
    title,
    description,
    primaryActions,
    entityName,
    lockTypeFilter,
    typeFilter,
    statusFilter,
    featuredFilter,
    provinceFilter,
    cityFilter,
    claimStatusFilter,
    sourceFilter,
    sortBy,
    sortOrder,
    search,
    provinceOptions,
    getCityOptionsForProvince,
    provincePlaceholder,
    cityPlaceholder,
    isProvinceDisabled,
    onApplyFilters,
    onSearchChange,
  } = props;

  const applied = React.useMemo<PendingFilters>(
    () => ({
      type: typeFilter,
      status: statusFilter,
      featured: featuredFilter,
      province: provinceFilter,
      city: cityFilter,
      claimStatus: claimStatusFilter,
      source: sourceFilter,
      sortBy,
      sortOrder,
    }),
    [
      typeFilter,
      statusFilter,
      featuredFilter,
      provinceFilter,
      cityFilter,
      claimStatusFilter,
      sourceFilter,
      sortBy,
      sortOrder,
    ],
  );

  const [pending, setPending] = React.useState<PendingFilters>(applied);

  // Sync pending state when applied filters change externally (e.g. URL navigation)
  React.useEffect(() => {
    setPending(applied);
  }, [applied]);

  const isDirty = !filtersMatch(pending, applied);

  const handleApply = () => {
    onApplyFilters({
      type: pending.type,
      status: pending.status,
      featured: pending.featured,
      province: pending.province,
      city: pending.city,
      claimStatus: pending.claimStatus,
      source: pending.source,
      sortBy: pending.sortBy,
      sortOrder: pending.sortOrder,
    });
  };

  // Reset city when province changes locally
  const handlePendingProvince = (value: string) => {
    setPending((prev) => ({ ...prev, province: value, city: "all" }));
  };

  const pendingCityOptions = React.useMemo(
    () =>
      pending.province !== "all"
        ? getCityOptionsForProvince(pending.province)
        : [],
    [pending.province, getCityOptionsForProvince],
  );
  const pendingCityDisabled = isProvinceDisabled || pending.province === "all";

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {primaryActions ? (
          <div className="flex flex-wrap gap-2">{primaryActions}</div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-4">
        <Select
          value={pending.type}
          onValueChange={(value) =>
            setPending((prev) => ({
              ...prev,
              type: value as CourtType | "all",
            }))
          }
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
          value={pending.status}
          onValueChange={(value) =>
            setPending((prev) => ({
              ...prev,
              status: value as CourtStatus | "all",
            }))
          }
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
          value={pending.featured}
          onValueChange={(value) =>
            setPending((prev) => ({
              ...prev,
              featured: value as FeaturedFilter,
            }))
          }
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
          value={pending.province}
          onValueChange={handlePendingProvince}
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
          value={pending.province === "all" ? "" : pending.city}
          onValueChange={(value) =>
            setPending((prev) => ({ ...prev, city: value }))
          }
          disabled={pendingCityDisabled}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder={cityPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {pendingCityOptions.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={pending.claimStatus}
          onValueChange={(value) =>
            setPending((prev) => ({
              ...prev,
              claimStatus: value as ClaimStatusFilter | "all",
            }))
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

        <Select
          value={pending.source}
          onValueChange={(value) =>
            setPending((prev) => ({
              ...prev,
              source: value as CourtSource | "all",
            }))
          }
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="user_submitted">User Submitted</SelectItem>
            <SelectItem value="admin_curated">Admin Curated</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={pending.sortBy}
          onValueChange={(value) =>
            setPending((prev) => ({
              ...prev,
              sortBy: value as CourtSortBy,
            }))
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={pending.sortOrder}
          onValueChange={(value) =>
            setPending((prev) => ({
              ...prev,
              sortOrder: value as SortOrder,
            }))
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${entityName.toLowerCase()}s...`}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={handleApply} disabled={!isDirty}>
          <Filter className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
      </div>
    </>
  );
}
