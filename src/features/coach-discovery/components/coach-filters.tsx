"use client";

import { Sparkles } from "lucide-react";
import { useMemo } from "react";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  buildCityOptions,
  buildProvinceOptions,
  findProvinceBySlug,
} from "@/common/ph-location-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQueryDiscoverySports } from "@/features/discovery/hooks";
import {
  COACH_AGE_GROUP_VALUES,
  COACH_SESSION_TYPE_VALUES,
  COACH_SKILL_LEVEL_VALUES,
} from "../schemas";

const MIN_RATING_OPTIONS = [
  { value: "3", label: "3.0+ stars" },
  { value: "4", label: "4.0+ stars" },
  { value: "5", label: "5.0 stars" },
] as const;

const SKILL_LEVEL_LABELS: Record<
  (typeof COACH_SKILL_LEVEL_VALUES)[number],
  string
> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  COMPETITIVE: "Competitive",
};

const AGE_GROUP_LABELS: Record<
  (typeof COACH_AGE_GROUP_VALUES)[number],
  string
> = {
  KIDS: "Kids",
  TEENS: "Teens",
  ADULTS: "Adults",
  SENIORS: "Seniors",
};

const SESSION_TYPE_LABELS: Record<
  (typeof COACH_SESSION_TYPE_VALUES)[number],
  string
> = {
  PRIVATE: "Private",
  SEMI_PRIVATE: "Semi-private",
  GROUP: "Group",
};

interface CoachFiltersProps {
  province?: string;
  city?: string;
  sportId?: string;
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  skillLevel?: (typeof COACH_SKILL_LEVEL_VALUES)[number];
  ageGroup?: (typeof COACH_AGE_GROUP_VALUES)[number];
  sessionType?: (typeof COACH_SESSION_TYPE_VALUES)[number];
  verified?: boolean;
  hasClearableFilters?: boolean;
  onProvinceChange: (province: string | undefined) => void;
  onCityChange: (city: string | undefined) => void;
  onSportChange: (sportId: string | undefined) => void;
  onMinRateChange: (minRate: number | undefined) => void;
  onMaxRateChange: (maxRate: number | undefined) => void;
  onMinRatingChange: (minRating: number | undefined) => void;
  onSkillLevelChange: (
    skillLevel: (typeof COACH_SKILL_LEVEL_VALUES)[number] | undefined,
  ) => void;
  onAgeGroupChange: (
    ageGroup: (typeof COACH_AGE_GROUP_VALUES)[number] | undefined,
  ) => void;
  onSessionTypeChange: (
    sessionType: (typeof COACH_SESSION_TYPE_VALUES)[number] | undefined,
  ) => void;
  onVerifiedChange: (verified: boolean | undefined) => void;
  onClearAll: () => void;
  onApply: () => void;
}

const parseNumberInput = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

export function CoachFilters({
  province,
  city,
  sportId,
  minRate,
  maxRate,
  minRating,
  skillLevel,
  ageGroup,
  sessionType,
  verified,
  hasClearableFilters = false,
  onProvinceChange,
  onCityChange,
  onSportChange,
  onMinRateChange,
  onMaxRateChange,
  onMinRatingChange,
  onSkillLevelChange,
  onAgeGroupChange,
  onSessionTypeChange,
  onVerifiedChange,
  onClearAll,
  onApply,
}: CoachFiltersProps) {
  const { data: sports = [] } = useQueryDiscoverySports();
  const provincesCitiesQuery = usePHProvincesCitiesQuery();
  const provincesCities = provincesCitiesQuery.data ?? null;
  const selectedProvince = useMemo(
    () =>
      provincesCities
        ? findProvinceBySlug(provincesCities, province)
        : undefined,
    [province, provincesCities],
  );

  const provinceOptions = useMemo(() => {
    if (!provincesCities) {
      return [];
    }

    return buildProvinceOptions(provincesCities);
  }, [provincesCities]);

  const cityOptions = useMemo(() => {
    if (!selectedProvince) {
      return [];
    }

    return buildCityOptions(selectedProvince);
  }, [selectedProvince]);

  return (
    <Card className="gap-0 overflow-hidden border-border/60 bg-background/95 py-0 shadow-sm">
      <CardHeader className="border-b px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-heading text-lg">
              Refine your coach shortlist
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Filter by sport, location, coaching fit, and budget without
              leaving the page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasClearableFilters}
              onClick={onClearAll}
            >
              Clear all
            </Button>
            <Button type="button" size="sm" onClick={onApply}>
              Apply filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 py-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="coach-sport-filter">Sport</Label>
            <Select
              value={sportId ?? "all"}
              onValueChange={(value) =>
                onSportChange(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="coach-sport-filter" className="w-full">
                <SelectValue placeholder="Any sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any sport</SelectItem>
                {sports.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coach-province-filter">Province</Label>
            <Select
              value={province ?? "all"}
              onValueChange={(value) =>
                onProvinceChange(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="coach-province-filter" className="w-full">
                <SelectValue
                  placeholder={
                    provincesCitiesQuery.isLoading
                      ? "Loading..."
                      : "Any province"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any province</SelectItem>
                {provinceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coach-city-filter">City</Label>
            <Select
              value={city ?? "all"}
              onValueChange={(value) =>
                onCityChange(value === "all" ? undefined : value)
              }
              disabled={!province}
            >
              <SelectTrigger id="coach-city-filter" className="w-full">
                <SelectValue
                  placeholder={province ? "Any city" : "Select province"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any city</SelectItem>
                {cityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coach-session-type-filter">Session type</Label>
            <Select
              value={sessionType ?? "all"}
              onValueChange={(value) =>
                onSessionTypeChange(
                  value === "all"
                    ? undefined
                    : (value as (typeof COACH_SESSION_TYPE_VALUES)[number]),
                )
              }
            >
              <SelectTrigger id="coach-session-type-filter" className="w-full">
                <SelectValue placeholder="Any session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any session type</SelectItem>
                {COACH_SESSION_TYPE_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {SESSION_TYPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coach-min-rate-filter">
              Minimum rate (PHP/hour)
            </Label>
            <Input
              id="coach-min-rate-filter"
              type="number"
              min={0}
              step={100}
              value={minRate ?? ""}
              onChange={(event) =>
                onMinRateChange(parseNumberInput(event.target.value))
              }
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coach-max-rate-filter">
              Maximum rate (PHP/hour)
            </Label>
            <Input
              id="coach-max-rate-filter"
              type="number"
              min={0}
              step={100}
              value={maxRate ?? ""}
              onChange={(event) =>
                onMaxRateChange(parseNumberInput(event.target.value))
              }
              placeholder="5000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coach-rating-filter">Minimum rating</Label>
            <Select
              value={minRating ? String(minRating) : "all"}
              onValueChange={(value) =>
                onMinRatingChange(
                  value === "all" ? undefined : Number.parseInt(value, 10),
                )
              }
            >
              <SelectTrigger id="coach-rating-filter" className="w-full">
                <SelectValue placeholder="Any rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any rating</SelectItem>
                {MIN_RATING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coach-skill-level-filter">Skill focus</Label>
            <Select
              value={skillLevel ?? "all"}
              onValueChange={(value) =>
                onSkillLevelChange(
                  value === "all"
                    ? undefined
                    : (value as (typeof COACH_SKILL_LEVEL_VALUES)[number]),
                )
              }
            >
              <SelectTrigger id="coach-skill-level-filter" className="w-full">
                <SelectValue placeholder="Any skill focus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any skill focus</SelectItem>
                {COACH_SKILL_LEVEL_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {SKILL_LEVEL_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coach-age-group-filter">Age group</Label>
            <Select
              value={ageGroup ?? "all"}
              onValueChange={(value) =>
                onAgeGroupChange(
                  value === "all"
                    ? undefined
                    : (value as (typeof COACH_AGE_GROUP_VALUES)[number]),
                )
              }
            >
              <SelectTrigger id="coach-age-group-filter" className="w-full">
                <SelectValue placeholder="Any age group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any age group</SelectItem>
                {COACH_AGE_GROUP_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {AGE_GROUP_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 md:col-span-2 xl:col-span-3">
            <div className="space-y-1">
              <Label
                htmlFor="coach-verified-filter"
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Verified coaches only
              </Label>
              <p className="text-sm text-muted-foreground">
                Verification currently reflects coaches with published
                certifications.
              </p>
            </div>
            <Switch
              id="coach-verified-filter"
              checked={verified ?? false}
              onCheckedChange={(checked) =>
                onVerifiedChange(checked ? true : undefined)
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
