"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import { formatCurrencyWhole } from "@/common/format";
import {
  buildCityOptions,
  buildProvinceOptions,
  findProvinceBySlug,
} from "@/common/ph-location-data";
import { Container } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DiscoverySearchField } from "@/features/discovery/components/discovery-search-field";
import { useSearchNavigationProgress } from "@/features/discovery/components/search-navigation-progress-provider";
import { useQueryDiscoverySports } from "@/features/discovery/hooks";
import { cn } from "@/lib/utils";
import { useModCoachDiscoveryFilters } from "../hooks/filters";
import type {
  CoachDiscoveryLocationRouteScope,
  CoachLocationDefaults,
} from "../location-routing";
import type {
  CoachDiscoveryFilterChip,
  PublicCoachesPageData,
  PublicCoachResolvedLocation,
} from "../public-coaches-data";
import { CoachFilters } from "./coach-filters";
import { DiscoveryCoachCard } from "./discovery-coach-card";

type PaginationItemModel =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

type StagedFilters = {
  province?: string | null;
  city?: string | null;
  sportId?: string | null;
  minRate?: number | null;
  maxRate?: number | null;
  minRating?: number | null;
  skillLevel?: ReturnType<typeof useModCoachDiscoveryFilters>["skillLevel"];
  ageGroup?: ReturnType<typeof useModCoachDiscoveryFilters>["ageGroup"];
  sessionType?: ReturnType<typeof useModCoachDiscoveryFilters>["sessionType"];
  verified?: boolean | null;
};

const buildPaginationItems = (
  current: number,
  totalPages: number,
): PaginationItemModel[] => {
  if (totalPages <= 1) {
    return [];
  }

  const pages = new Set<number>([1, totalPages]);

  for (let page = current - 1; page <= current + 1; page += 1) {
    if (page >= 1 && page <= totalPages) {
      pages.add(page);
    }
  }

  const sortedPages = [...pages].sort((a, b) => a - b);
  const items: PaginationItemModel[] = [];

  sortedPages.forEach((page, index) => {
    if (index > 0) {
      const previous = sortedPages[index - 1];
      if (page - previous > 1) {
        items.push({
          type: "ellipsis",
          key: `ellipsis-${previous}-${page}`,
        });
      }
    }

    items.push({ type: "page", page });
  });

  return items;
};

const formatRatingChipLabel = (value: number) => `${value}+ stars`;

const SKILL_LEVEL_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  COMPETITIVE: "Competitive",
} as const;

const AGE_GROUP_LABELS = {
  KIDS: "Kids",
  TEENS: "Teens",
  ADULTS: "Adults",
  SENIORS: "Seniors",
} as const;

const SESSION_TYPE_LABELS = {
  PRIVATE: "Private",
  SEMI_PRIVATE: "Semi-private",
  GROUP: "Group",
} as const;

interface CoachesPageClientProps {
  initialData: PublicCoachesPageData;
  initialFilters?: CoachLocationDefaults;
  initialLocationLabel?: string;
  locationRouteScope?: CoachDiscoveryLocationRouteScope;
  initialResolvedLocation?: PublicCoachResolvedLocation;
}

export default function CoachesPageClient({
  initialData,
  initialFilters,
  initialLocationLabel,
  locationRouteScope = "none",
  initialResolvedLocation,
}: CoachesPageClientProps) {
  return (
    <Suspense fallback={<CoachesPageSkeleton />}>
      <CoachesPageContent
        initialData={initialData}
        initialFilters={initialFilters}
        initialLocationLabel={initialLocationLabel}
        locationRouteScope={locationRouteScope}
        initialResolvedLocation={initialResolvedLocation}
      />
    </Suspense>
  );
}

interface CoachesPageContentProps {
  initialData: PublicCoachesPageData;
  initialFilters?: CoachLocationDefaults;
  initialLocationLabel?: string;
  locationRouteScope?: CoachDiscoveryLocationRouteScope;
  initialResolvedLocation?: PublicCoachResolvedLocation;
}

function CoachesPageContent({
  initialData,
  initialFilters,
  initialLocationLabel,
  locationRouteScope = "none",
  initialResolvedLocation,
}: CoachesPageContentProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: sports = [] } = useQueryDiscoverySports();
  const filters = useModCoachDiscoveryFilters({
    initialFilters,
    locationRouteScope,
    sports: sports.map((sport) => ({ id: sport.id, slug: sport.slug })),
  });
  const { data: provincesCities } = usePHProvincesCitiesQuery();
  const {
    isSearchNavigationPending,
    finishSearchNavigation,
    startSearchNavigation,
  } = useSearchNavigationProgress();
  const [queryDraft, setQueryDraft] = useState(filters.q ?? "");
  const [pendingPage, setPendingPage] = useState<number | null>(null);
  const [staged, setStaged] = useState<StagedFilters>({
    province: filters.province ?? initialFilters?.province ?? null,
    city: filters.city ?? initialFilters?.city ?? null,
    sportId: filters.sportId ?? initialFilters?.sportId ?? null,
    minRate: filters.minRate,
    maxRate: filters.maxRate,
    minRating: filters.minRating,
    skillLevel: filters.skillLevel,
    ageGroup: filters.ageGroup,
    sessionType: filters.sessionType,
    verified: filters.verified,
  });

  useEffect(() => {
    finishSearchNavigation();
  }, [finishSearchNavigation]);

  useEffect(() => {
    setQueryDraft(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    setStaged({
      province: filters.province ?? initialFilters?.province ?? null,
      city: filters.city ?? initialFilters?.city ?? null,
      sportId: filters.sportId ?? initialFilters?.sportId ?? null,
      minRate: filters.minRate,
      maxRate: filters.maxRate,
      minRating: filters.minRating,
      skillLevel: filters.skillLevel,
      ageGroup: filters.ageGroup,
      sessionType: filters.sessionType,
      verified: filters.verified,
    });
  }, [
    filters.ageGroup,
    filters.city,
    filters.maxRate,
    filters.minRate,
    filters.minRating,
    filters.province,
    filters.sessionType,
    filters.skillLevel,
    filters.sportId,
    filters.verified,
    initialFilters?.city,
    initialFilters?.province,
    initialFilters?.sportId,
  ]);

  useEffect(() => {
    if (pendingPage === null || filters.page !== pendingPage) {
      return;
    }

    setPendingPage(null);
    finishSearchNavigation();
  }, [filters.page, finishSearchNavigation, pendingPage]);

  const updateStaged = useCallback((patch: Partial<StagedFilters>) => {
    setStaged((current) => ({ ...current, ...patch }));
  }, []);

  const applyFilters = useCallback(() => {
    filters.commitFilters({
      q: queryDraft.trim() || null,
      province: staged.province ?? null,
      city: staged.city ?? null,
      sportId: staged.sportId ?? null,
      minRate: staged.minRate ?? null,
      maxRate: staged.maxRate ?? null,
      minRating: staged.minRating ?? null,
      skillLevel: staged.skillLevel ?? null,
      ageGroup: staged.ageGroup ?? null,
      sessionType: staged.sessionType ?? null,
      verified: staged.verified ?? null,
      page: 1,
    });
  }, [filters, queryDraft, staged]);

  const clearAllFilters = useCallback(() => {
    setQueryDraft("");
    setStaged({
      province:
        locationRouteScope === "none"
          ? null
          : (initialFilters?.province ?? null),
      city:
        locationRouteScope === "city" || locationRouteScope === "sport"
          ? (initialFilters?.city ?? null)
          : null,
      sportId:
        locationRouteScope === "sport"
          ? (initialFilters?.sportId ?? null)
          : null,
      minRate: null,
      maxRate: null,
      minRating: null,
      skillLevel: null,
      ageGroup: null,
      sessionType: null,
      verified: null,
    });
    filters.clearAll();
  }, [filters, initialFilters, locationRouteScope]);

  const handleQuerySubmit = useCallback(() => {
    filters.setQuery(queryDraft.trim());
  }, [filters, queryDraft]);

  const effectiveProvince =
    filters.province ?? initialFilters?.province ?? undefined;
  const effectiveCity = filters.city ?? initialFilters?.city ?? undefined;
  const effectiveSportId =
    filters.sportId ?? initialFilters?.sportId ?? undefined;

  const locationLabel = useMemo(() => {
    if (!provincesCities) {
      const matchesInitialLocation =
        effectiveProvince === initialResolvedLocation?.provinceSlug &&
        effectiveCity === initialResolvedLocation?.citySlug;

      return (
        initialLocationLabel ??
        (matchesInitialLocation
          ? (initialResolvedLocation?.cityName ??
            initialResolvedLocation?.provinceName)
          : null) ??
        effectiveCity ??
        effectiveProvince ??
        null
      );
    }

    const province = effectiveProvince
      ? findProvinceBySlug(provincesCities, effectiveProvince)
      : null;
    const city = effectiveCity
      ? province
        ? buildCityOptions(province).find(
            (option) => option.value === effectiveCity,
          )
        : null
      : null;

    return city?.label ?? province?.displayName ?? null;
  }, [
    effectiveCity,
    effectiveProvince,
    initialLocationLabel,
    initialResolvedLocation?.cityName,
    initialResolvedLocation?.provinceName,
    initialResolvedLocation?.citySlug,
    initialResolvedLocation?.provinceSlug,
    provincesCities,
  ]);

  const hasClearableFilters = Boolean(
    filters.q ||
      filters.sportId ||
      filters.minRate !== null ||
      filters.maxRate !== null ||
      filters.minRating !== null ||
      filters.skillLevel ||
      filters.ageGroup ||
      filters.sessionType ||
      filters.verified,
  );

  const chips = useMemo<CoachDiscoveryFilterChip[]>(() => {
    const province = effectiveProvince
      ? findProvinceBySlug(provincesCities ?? [], effectiveProvince)
      : null;
    const provinceLabel = effectiveProvince
      ? (buildProvinceOptions(provincesCities ?? []).find(
          (option) => option.value === effectiveProvince,
        )?.label ?? effectiveProvince)
      : null;
    const cityLabel = effectiveCity
      ? ((province
          ? buildCityOptions(province).find(
              (option) => option.value === effectiveCity,
            )?.label
          : null) ?? effectiveCity)
      : null;
    const sportLabel =
      sports.find((sport) => sport.id === effectiveSportId)?.name ??
      effectiveSportId;

    return [
      filters.q ? { key: "q", label: `"${filters.q}"` } : null,
      provinceLabel ? { key: "province", label: provinceLabel } : null,
      cityLabel ? { key: "city", label: cityLabel } : null,
      sportLabel ? { key: "sportId", label: sportLabel } : null,
      typeof filters.minRate === "number"
        ? {
            key: "minRate",
            label: `Min ${formatCurrencyWhole(filters.minRate * 100)}/hr`,
          }
        : null,
      typeof filters.maxRate === "number"
        ? {
            key: "maxRate",
            label: `Max ${formatCurrencyWhole(filters.maxRate * 100)}/hr`,
          }
        : null,
      typeof filters.minRating === "number"
        ? {
            key: "minRating",
            label: formatRatingChipLabel(filters.minRating),
          }
        : null,
      filters.skillLevel
        ? {
            key: "skillLevel",
            label: SKILL_LEVEL_LABELS[filters.skillLevel],
          }
        : null,
      filters.ageGroup
        ? {
            key: "ageGroup",
            label: AGE_GROUP_LABELS[filters.ageGroup],
          }
        : null,
      filters.sessionType
        ? {
            key: "sessionType",
            label: SESSION_TYPE_LABELS[filters.sessionType],
          }
        : null,
      filters.verified ? { key: "verified", label: "Verified" } : null,
    ].filter((chip): chip is CoachDiscoveryFilterChip => Boolean(chip));
  }, [
    effectiveCity,
    effectiveProvince,
    filters.ageGroup,
    filters.maxRate,
    filters.minRate,
    filters.minRating,
    filters.q,
    filters.sessionType,
    filters.skillLevel,
    filters.verified,
    effectiveSportId,
    provincesCities,
    sports,
  ]);

  const total = initialData.total;
  const limit = initialData.limit;
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  const page = filters.page;
  const displayPage = pendingPage ?? page;
  const isPaginationPending = pendingPage !== null && pendingPage !== page;
  const paginationItems = useMemo(
    () => buildPaginationItems(displayPage, totalPages),
    [displayPage, totalPages],
  );
  const startIndex = total === 0 ? 0 : (displayPage - 1) * limit + 1;
  const endIndex = Math.min(displayPage * limit, total);
  const isFiltering = filters.isPending || isSearchNavigationPending;

  const buildPaginationHref = useCallback(
    (nextPage: number) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (nextPage <= 1) {
        nextSearchParams.delete("page");
      } else {
        nextSearchParams.set("page", String(nextPage));
      }

      const queryString = nextSearchParams.toString();
      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [pathname, searchParams],
  );

  const handlePaginationNavigate = useCallback(
    (targetPage: number) => {
      if (targetPage === page || isPaginationPending) {
        return;
      }

      setPendingPage(targetPage);
      startSearchNavigation();
    },
    [isPaginationPending, page, startSearchNavigation],
  );

  const removeChip = useCallback(
    (key: CoachDiscoveryFilterChip["key"]) => {
      switch (key) {
        case "q":
          setQueryDraft("");
          filters.setQuery("");
          return;
        case "province":
          updateStaged({ province: null, city: null, sportId: null });
          filters.setProvince(undefined);
          return;
        case "city":
          updateStaged({ city: null, sportId: null });
          filters.setCity(undefined);
          return;
        case "sportId":
          updateStaged({ sportId: null });
          filters.setSportId(undefined);
          return;
        case "minRate":
          updateStaged({ minRate: null });
          filters.setMinRate(null);
          return;
        case "maxRate":
          updateStaged({ maxRate: null });
          filters.setMaxRate(null);
          return;
        case "minRating":
          updateStaged({ minRating: null });
          filters.setMinRating(null);
          return;
        case "skillLevel":
          updateStaged({ skillLevel: null });
          filters.setSkillLevel(undefined);
          return;
        case "ageGroup":
          updateStaged({ ageGroup: null });
          filters.setAgeGroup(undefined);
          return;
        case "sessionType":
          updateStaged({ sessionType: null });
          filters.setSessionType(undefined);
          return;
        case "verified":
          updateStaged({ verified: null });
          filters.setVerified(undefined);
      }
    },
    [filters, updateStaged],
  );

  return (
    <Container className="space-y-6 pt-6 pb-10">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.95fr)]">
        <Card className="gap-0 overflow-hidden border-border/60 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] py-0 shadow-sm">
          <CardContent className="space-y-5 px-6 py-6">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit">
                Coach discovery
              </Badge>
              <div className="space-y-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {locationLabel
                    ? `Find coaches in ${locationLabel}`
                    : "Find the right coach for your next session"}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Browse independent and venue-linked coaches across the
                  Philippines. Compare sports, coaching formats, ratings, and
                  price bands before you commit.
                </p>
              </div>
            </div>

            <DiscoverySearchField
              value={queryDraft}
              onValueChange={setQueryDraft}
              onSubmit={handleQuerySubmit}
              placeholder="Search coach names or cities..."
              buttonLabel="Search"
            />

            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>{total} live coach profiles</span>
              <span className="text-border">|</span>
              <Link
                href={appRoutes.coach.getStarted}
                className="font-medium text-primary hover:underline"
              >
                Become a coach on KudosCourts
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="grid gap-3 px-6 py-6 sm:grid-cols-3 xl:grid-cols-1">
            <StatsTile
              label="Coaches"
              value={initialData.stats.totalCoaches}
              helper="Published profiles"
            />
            <StatsTile
              label="Cities"
              value={initialData.stats.totalCities}
              helper="Coverage across the country"
            />
            <StatsTile
              label="Sports"
              value={initialData.stats.totalSports}
              helper="Specialties available now"
            />
          </CardContent>
        </Card>
      </section>

      <CoachFilters
        province={staged.province ?? undefined}
        city={staged.city ?? undefined}
        sportId={staged.sportId ?? undefined}
        minRate={staged.minRate ?? undefined}
        maxRate={staged.maxRate ?? undefined}
        minRating={staged.minRating ?? undefined}
        skillLevel={staged.skillLevel ?? undefined}
        ageGroup={staged.ageGroup ?? undefined}
        sessionType={staged.sessionType ?? undefined}
        verified={staged.verified ?? undefined}
        hasClearableFilters={hasClearableFilters}
        onProvinceChange={(province) =>
          updateStaged({ province: province ?? null, city: null })
        }
        onCityChange={(city) => updateStaged({ city: city ?? null })}
        onSportChange={(sportId) => updateStaged({ sportId: sportId ?? null })}
        onMinRateChange={(minRate) =>
          updateStaged({ minRate: minRate ?? null })
        }
        onMaxRateChange={(maxRate) =>
          updateStaged({ maxRate: maxRate ?? null })
        }
        onMinRatingChange={(minRating) =>
          updateStaged({ minRating: minRating ?? null })
        }
        onSkillLevelChange={(skillLevel) =>
          updateStaged({ skillLevel: skillLevel ?? null })
        }
        onAgeGroupChange={(ageGroup) =>
          updateStaged({ ageGroup: ageGroup ?? null })
        }
        onSessionTypeChange={(sessionType) =>
          updateStaged({ sessionType: sessionType ?? null })
        }
        onVerifiedChange={(verified) =>
          updateStaged({ verified: verified ?? null })
        }
        onClearAll={clearAllFilters}
        onApply={applyFilters}
      />

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeChip(chip.key)}
              className="rounded-full border border-border/70 bg-background px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {chip.label} ×
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "relative h-[3px] w-full overflow-hidden rounded-full transition-opacity duration-200",
          isFiltering ? "bg-primary/20 opacity-100" : "opacity-0",
        )}
        role="progressbar"
        aria-label="Filtering coaches"
        aria-busy={isFiltering}
      >
        <div className="absolute inset-0 h-full w-1/3 animate-[filter-slide_1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {total === 0
              ? "No coaches match your filters"
              : `Showing ${startIndex}-${endIndex} of ${total} coaches`}
          </h2>
          <p className="text-sm text-muted-foreground">
            Coach discovery is list-first for now. Profile details and booking
            flow land in the next slices.
          </p>
        </div>
      </div>

      {initialData.coaches.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {initialData.coaches.map((coach) => (
              <DiscoveryCoachCard
                key={coach.id}
                coach={coach}
                media={initialData.mediaById[coach.id]}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-col items-center gap-3 pt-2">
              <Pagination>
                <PaginationContent
                  className={cn(isPaginationPending && "pointer-events-none")}
                >
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildPaginationHref(Math.max(1, displayPage - 1))}
                      onNavigate={() =>
                        handlePaginationNavigate(Math.max(1, displayPage - 1))
                      }
                      prefetch={true}
                      scroll={false}
                      aria-disabled={displayPage === 1}
                      className={
                        displayPage === 1 || isPaginationPending
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {paginationItems.map((item) =>
                    item.type === "page" ? (
                      <PaginationItem key={`page-${item.page}`}>
                        <PaginationLink
                          href={buildPaginationHref(item.page)}
                          onNavigate={() => handlePaginationNavigate(item.page)}
                          prefetch={true}
                          scroll={false}
                          isActive={displayPage === item.page}
                          className={cn(
                            "cursor-pointer",
                            isPaginationPending && "pointer-events-none",
                          )}
                        >
                          {item.page}
                        </PaginationLink>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item.key}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href={buildPaginationHref(
                        Math.min(totalPages, displayPage + 1),
                      )}
                      onNavigate={() =>
                        handlePaginationNavigate(
                          Math.min(totalPages, displayPage + 1),
                        )
                      }
                      prefetch={true}
                      scroll={false}
                      aria-disabled={displayPage === totalPages}
                      className={
                        displayPage === totalPages || isPaginationPending
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <p className="text-sm text-muted-foreground">
                Page {displayPage} of {totalPages}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <CoachEmptyResults
          query={filters.q ?? undefined}
          onClearFilters={clearAllFilters}
        />
      )}
    </Container>
  );
}

function StatsTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-3xl font-semibold text-foreground">
        {value.toLocaleString("en-US")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

function CoachesPageSkeleton() {
  return (
    <Container className="space-y-4 pt-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.95fr)]">
        <div className="h-64 rounded-2xl border bg-card" />
        <div className="h-64 rounded-2xl border bg-card" />
      </div>
      <div className="h-44 rounded-2xl border bg-card" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            key={index}
            className="h-[420px] rounded-2xl border bg-card"
          />
        ))}
      </div>
    </Container>
  );
}

function CoachEmptyResults({
  query,
  onClearFilters,
}: {
  query?: string;
  onClearFilters: () => void;
}) {
  return (
    <Card className="border-dashed border-border/70 bg-muted/10 py-0 shadow-none">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="space-y-2">
          <h3 className="font-heading text-2xl font-semibold text-foreground">
            No coaches found
          </h3>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            {query
              ? `We couldn't find any coaches matching "${query}". Try adjusting your search or widening your filters.`
              : "No coaches match your current filters. Try widening your search area or clearing a few constraints."}
          </p>
        </div>
        <Button variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      </CardContent>
    </Card>
  );
}
