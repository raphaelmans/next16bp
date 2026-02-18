"use client";

import { Search } from "lucide-react";
import type * as React from "react";
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
  CourtStatus,
  CourtType,
  FeaturedFilter,
} from "@/features/admin/hooks";

type Option = { label: string; value: string };

type AdminPlacesFiltersProps = {
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
  search: string;
  provinceOptions: Option[];
  cityOptions: Option[];
  provincePlaceholder: string;
  cityPlaceholder: string;
  isProvinceDisabled: boolean;
  isCityDisabled: boolean;
  onTypeFilterChange: (value: CourtType | "all") => void;
  onStatusFilterChange: (value: CourtStatus | "all") => void;
  onFeaturedFilterChange: (value: FeaturedFilter) => void;
  onProvinceFilterChange: (value: string) => void;
  onCityFilterChange: (value: string) => void;
  onClaimStatusFilterChange: (value: ClaimStatusFilter | "all") => void;
  onSearchChange: (value: string) => void;
};

export function AdminPlacesFilters({
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
  search,
  provinceOptions,
  cityOptions,
  provincePlaceholder,
  cityPlaceholder,
  isProvinceDisabled,
  isCityDisabled,
  onTypeFilterChange,
  onStatusFilterChange,
  onFeaturedFilterChange,
  onProvinceFilterChange,
  onCityFilterChange,
  onClaimStatusFilterChange,
  onSearchChange,
}: AdminPlacesFiltersProps) {
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
          value={typeFilter}
          onValueChange={(value) =>
            onTypeFilterChange(value as CourtType | "all")
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
          value={statusFilter}
          onValueChange={(value) =>
            onStatusFilterChange(value as CourtStatus | "all")
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
          value={featuredFilter}
          onValueChange={(value) =>
            onFeaturedFilterChange(value as FeaturedFilter)
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
          value={provinceFilter}
          onValueChange={onProvinceFilterChange}
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
          onValueChange={onCityFilterChange}
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
          onValueChange={(value) =>
            onClaimStatusFilterChange(value as ClaimStatusFilter | "all")
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

        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${entityName.toLowerCase()}s...`}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>
    </>
  );
}
