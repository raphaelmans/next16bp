"use client";

import { ArrowLeft, Calendar, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSession } from "@/features/auth";
import {
  usePlaceAvailability,
  usePlaceDetail,
} from "@/features/discovery/hooks";
import {
  KudosDatePicker,
  type TimeSlot,
  TimeSlotPicker,
  TimeSlotPickerSkeleton,
} from "@/shared/components/kudos";
import { Container } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { trackEvent } from "@/shared/lib/clients/telemetry-client";
import {
  formatCurrency,
  formatDuration,
  formatInTimeZone,
} from "@/shared/lib/format";
import {
  getZonedDayKey,
  getZonedDayRangeFromDayKey,
  getZonedStartOfDayIso,
} from "@/shared/lib/time-zone";
import { trpc } from "@/trpc/client";

const DURATIONS = [60, 120, 180] as const;
const selectionModeSchema = ["any", "court"] as const;

type SelectionMode = (typeof selectionModeSchema)[number];

type CourtAvailabilityOption = {
  id?: string;
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency: string | null;
  courtId: string;
  courtLabel: string;
};

function parseDayKeyToDate(dayKey: string, timeZone?: string) {
  const range = getZonedDayRangeFromDayKey(dayKey, timeZone);
  return range.start;
}

function buildSchedulePath({
  placeId,
  dayKey,
  duration,
  sportId,
  mode,
  selectedCourtId,
  startTime,
}: {
  placeId: string;
  dayKey?: string;
  duration?: number;
  sportId?: string;
  mode?: SelectionMode;
  selectedCourtId?: string;
  startTime?: string;
}) {
  const params = new URLSearchParams();
  if (dayKey) params.set("date", dayKey);
  if (duration) params.set("duration", String(duration));
  if (sportId) params.set("sportId", sportId);
  if (mode) params.set("mode", mode);
  if (selectedCourtId) params.set("courtId", selectedCourtId);
  if (startTime) params.set("startTime", startTime);

  const query = params.toString();
  return query
    ? `${appRoutes.courts.schedule(placeId)}?${query}`
    : appRoutes.courts.schedule(placeId);
}

function buildAvailabilityId(
  courtId: string,
  startTime: string,
  duration: number,
) {
  return `${courtId}-${startTime}-${duration}`;
}

export default function CourtSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const placeId = (params.placeId ?? params.id ?? params.courtId) as string;

  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const [dayKeyParam, setDayKeyParam] = useQueryState("date", parseAsString);
  const [sportIdParam, setSportIdParam] = useQueryState(
    "sportId",
    parseAsString.withOptions({ history: "replace" }),
  );
  const [modeParam, setModeParam] = useQueryState(
    "mode",
    parseAsStringLiteral(selectionModeSchema)
      .withDefault("any")
      .withOptions({ history: "replace" }),
  );
  const [selectedCourtIdParam, setSelectedCourtIdParam] = useQueryState(
    "courtId",
    parseAsString.withOptions({ history: "replace" }),
  );
  const [durationParam, setDurationParam] = useQueryState(
    "duration",
    parseAsInteger.withDefault(60).withOptions({ history: "replace" }),
  );
  const [startTimeParam, setStartTimeParam] = useQueryState(
    "startTime",
    parseAsString.withOptions({ history: "replace" }),
  );

  const durationMinutes = DURATIONS.includes(
    durationParam as (typeof DURATIONS)[number],
  )
    ? (durationParam as (typeof DURATIONS)[number])
    : 60;

  const placeQuery = usePlaceDetail({ placeId });
  const place = placeQuery.data;
  const placeTimeZone = place?.timeZone ?? "Asia/Manila";

  const selectedDate = React.useMemo(() => {
    if (!dayKeyParam) return undefined;
    return parseDayKeyToDate(dayKeyParam, placeTimeZone);
  }, [dayKeyParam, placeTimeZone]);

  React.useEffect(() => {
    if (!place) return;

    if (!sportIdParam) {
      setSportIdParam(place.sports[0]?.id ?? null);
    }

    if (!dayKeyParam) {
      setDayKeyParam(getZonedDayKey(new Date(), placeTimeZone));
    }
  }, [
    dayKeyParam,
    place,
    placeTimeZone,
    setDayKeyParam,
    setSportIdParam,
    sportIdParam,
  ]);

  const courtsForSport = React.useMemo(() => {
    if (!place || !sportIdParam) return [];

    return place.courts
      .filter((court) => court.sportId === sportIdParam)
      .filter((court) => court.isActive);
  }, [place, sportIdParam]);

  React.useEffect(() => {
    if (modeParam !== "court") return;
    if (selectedCourtIdParam) return;
    if (!courtsForSport.length) return;

    setSelectedCourtIdParam(courtsForSport[0]?.id ?? null);
  }, [
    courtsForSport,
    modeParam,
    selectedCourtIdParam,
    setSelectedCourtIdParam,
  ]);

  const dateIso = React.useMemo(() => {
    if (!selectedDate) return undefined;
    return getZonedStartOfDayIso(selectedDate, placeTimeZone);
  }, [placeTimeZone, selectedDate]);

  const cheapestAvailabilityQuery = usePlaceAvailability({
    place: modeParam === "any" ? (place ?? undefined) : undefined,
    sportId: sportIdParam ?? undefined,
    courtId: undefined,
    date: selectedDate,
    durationMinutes,
    mode: "any",
  });

  const cheapestAvailability = cheapestAvailabilityQuery.data ?? [];

  const courtAvailabilityQueries = trpc.useQueries((t) => {
    if (modeParam !== "court") return [];
    if (!dateIso) return [];
    if (!courtsForSport.length) return [];

    return courtsForSport.map((court) =>
      t.availability.getForCourt({
        courtId: court.id,
        date: dateIso,
        durationMinutes,
      }),
    );
  });

  const isLoadingCourtAvailability = courtAvailabilityQueries.some(
    (query) => query.isLoading,
  );

  const selectedOption: CourtAvailabilityOption | undefined =
    React.useMemo(() => {
      if (!startTimeParam) return undefined;

      if (modeParam === "any") {
        return cheapestAvailability.find(
          (option) => option.startTime === startTimeParam,
        );
      }

      if (!selectedCourtIdParam) return undefined;

      const courtIndex = courtsForSport.findIndex(
        (court) => court.id === selectedCourtIdParam,
      );
      if (courtIndex < 0) return undefined;

      const options =
        (courtAvailabilityQueries[courtIndex]?.data as
          | CourtAvailabilityOption[]
          | undefined) ?? [];

      return options.find((option) => option.startTime === startTimeParam);
    }, [
      cheapestAvailability,
      courtAvailabilityQueries,
      courtsForSport,
      modeParam,
      selectedCourtIdParam,
      startTimeParam,
    ]);

  const selectedOptionId = selectedOption
    ? modeParam === "any"
      ? selectedOption.id
      : buildAvailabilityId(
          selectedOption.courtId,
          selectedOption.startTime,
          durationMinutes,
        )
    : undefined;

  React.useEffect(() => {
    if (!selectedOption) return;

    trackEvent({
      event: "funnel.schedule_slot_selected",
      properties: {
        placeId,
        mode: modeParam,
        durationMinutes,
        startTime: selectedOption.startTime,
        courtId: selectedOption.courtId,
      },
    });
  }, [durationMinutes, modeParam, placeId, selectedOption]);

  const handleReserve = () => {
    if (!selectedOption || !sportIdParam) return;

    trackEvent({
      event: "funnel.reserve_clicked",
      properties: {
        placeId,
        mode: modeParam,
        durationMinutes,
        startTime: selectedOption.startTime,
        courtId: selectedOption.courtId,
      },
    });

    const bookingParams = new URLSearchParams({
      startTime: selectedOption.startTime,
      duration: String(durationMinutes),
      sportId: sportIdParam,
      mode: modeParam,
    });

    if (modeParam === "court") {
      bookingParams.set("courtId", selectedOption.courtId);
    }

    const destination = `${appRoutes.places.book(placeId)}?${bookingParams.toString()}`;

    if (isAuthenticated) {
      router.push(destination);
      return;
    }

    const returnTo = buildSchedulePath({
      placeId,
      dayKey: dayKeyParam ?? undefined,
      duration: durationMinutes,
      sportId: sportIdParam,
      mode: modeParam,
      selectedCourtId:
        modeParam === "court" ? selectedOption.courtId : undefined,
      startTime: selectedOption.startTime,
    });

    trackEvent({
      event: "funnel.login_started",
      properties: {
        placeId,
        redirect: returnTo,
      },
    });

    router.push(appRoutes.login.from(returnTo));
  };

  if (placeQuery.isLoading) {
    return (
      <Container className="py-12">
        <div className="space-y-4">
          <div className="h-8 w-56 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded bg-muted animate-pulse" />
          <div className="h-80 w-full rounded-xl bg-muted animate-pulse" />
        </div>
      </Container>
    );
  }

  if (!place) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Court not found</h1>
          <p className="text-muted-foreground mt-2">
            The court you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href={appRoutes.courts.base}
            className="text-primary hover:underline mt-4 inline-block"
          >
            Browse all courts
          </Link>
        </div>
      </Container>
    );
  }

  if (place.placeType !== "RESERVABLE") {
    return (
      <Container className="py-12">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Not bookable yet</h1>
          <p className="text-muted-foreground">
            This listing doesn&apos;t have a public booking schedule yet.
          </p>
          <Button asChild variant="outline" className="mx-auto">
            <Link href={appRoutes.courts.detail(placeId)}>Back to details</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const formattedDateLabel = selectedDate
    ? formatInTimeZone(selectedDate, placeTimeZone, "MMM d, yyyy")
    : "";

  const isLoadingTimes =
    modeParam === "any"
      ? cheapestAvailabilityQuery.isLoading
      : isLoadingCourtAvailability;

  const cheapestSlots: TimeSlot[] = cheapestAvailability.map((slot) => ({
    id: slot.id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    priceCents: slot.totalPriceCents,
    currency: slot.currency,
    status: "available",
  }));

  return (
    <Container className="py-6">
      <div className="space-y-6 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href={appRoutes.courts.detail(placeId)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to details
              </Link>
            </Button>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {place.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              View availability in a denser layout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={appRoutes.courts.detail(placeId)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open details
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Schedule</CardTitle>
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                Detailed view
              </Badge>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
              <div className="space-y-2">
                <p className="text-sm font-medium">Sport</p>
                <ToggleGroup
                  type="single"
                  value={sportIdParam ?? undefined}
                  onValueChange={(value) => {
                    setSportIdParam(value || null);
                    setSelectedCourtIdParam(null);
                    setStartTimeParam(null);
                  }}
                >
                  {place.sports.map((sport) => (
                    <ToggleGroupItem key={sport.id} value={sport.id} size="sm">
                      {sport.name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Date</p>
                <KudosDatePicker
                  value={selectedDate}
                  onChange={(date) => {
                    if (!date) {
                      setDayKeyParam(null);
                      setStartTimeParam(null);
                      return;
                    }
                    setDayKeyParam(getZonedDayKey(date, placeTimeZone));
                    setStartTimeParam(null);
                  }}
                  placeholder="Choose a date"
                  timeZone={placeTimeZone}
                />
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <p className="text-sm font-medium">Duration</p>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map((duration) => (
                    <Button
                      key={duration}
                      type="button"
                      size="sm"
                      variant={
                        durationMinutes === duration ? "default" : "outline"
                      }
                      onClick={() => {
                        setDurationParam(duration);
                        setStartTimeParam(null);
                      }}
                    >
                      {formatDuration(duration)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">View</p>
                <ToggleGroup
                  type="single"
                  value={modeParam}
                  onValueChange={(value) => {
                    if (!value) return;
                    setModeParam(value as SelectionMode);
                    setStartTimeParam(null);
                    if (value === "any") {
                      setSelectedCourtIdParam(null);
                    }
                  }}
                >
                  <ToggleGroupItem value="any" size="sm">
                    Best price
                  </ToggleGroupItem>
                  <ToggleGroupItem value="court" size="sm">
                    By court
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium">
                    {formattedDateLabel || "Pick a date"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {modeParam === "any"
                      ? "We show the lowest price option per start time."
                      : "Pick a start time under any court."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setStartTimeParam(null)}
                  disabled={!startTimeParam}
                >
                  Clear selection
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleReserve}
                  disabled={!selectedOption}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {selectedOption ? "Continue to review" : "Select a time"}
                </Button>
              </div>
            </div>

            {!selectedDate ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Select a date to see available start times.
              </p>
            ) : isLoadingTimes ? (
              <TimeSlotPickerSkeleton count={8} />
            ) : modeParam === "any" ? (
              cheapestSlots.length > 0 ? (
                <TimeSlotPicker
                  slots={cheapestSlots}
                  selectedId={selectedOptionId}
                  onSelect={(slot) => setStartTimeParam(slot.startTime)}
                  showPrice
                  timeZone={placeTimeZone}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No available start times for this date.
                </p>
              )
            ) : courtsForSport.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No active courts for this sport.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {courtsForSport.map((court, index) => {
                  const query = courtAvailabilityQueries[index];
                  const options =
                    (query?.data as CourtAvailabilityOption[] | undefined) ??
                    [];

                  const slots: TimeSlot[] = options.map((option) => ({
                    id: buildAvailabilityId(
                      option.courtId,
                      option.startTime,
                      durationMinutes,
                    ),
                    startTime: option.startTime,
                    endTime: option.endTime,
                    priceCents: option.totalPriceCents,
                    currency: option.currency ?? "PHP",
                    status: "available",
                  }));

                  const selectedId =
                    startTimeParam && selectedCourtIdParam === court.id
                      ? buildAvailabilityId(
                          court.id,
                          startTimeParam,
                          durationMinutes,
                        )
                      : undefined;

                  const hasSelection =
                    selectedCourtIdParam === court.id && !!startTimeParam;

                  return (
                    <Card
                      key={court.id}
                      className={
                        hasSelection
                          ? "border-primary/40 shadow-sm"
                          : "border-border/60"
                      }
                    >
                      <CardHeader className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">
                            {court.label}
                          </CardTitle>
                          {hasSelection && (
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary"
                            >
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {place.sports.find(
                              (sport) => sport.id === sportIdParam,
                            )?.name ?? "Sport"}
                          </Badge>
                          {court.tierLabel && (
                            <Badge variant="secondary" className="text-[10px]">
                              {court.tierLabel}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {query?.isLoading ? (
                          <TimeSlotPickerSkeleton count={8} />
                        ) : slots.length > 0 ? (
                          <TimeSlotPicker
                            slots={slots}
                            selectedId={selectedId}
                            onSelect={(slot) => {
                              setSelectedCourtIdParam(court.id);
                              setStartTimeParam(slot.startTime);
                            }}
                            showPrice
                            timeZone={placeTimeZone}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No start times.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedOption && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-4 shadow-lg backdrop-blur sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {formatInTimeZone(
                  new Date(selectedOption.startTime),
                  placeTimeZone,
                  "MMM d, h:mm a",
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDuration(durationMinutes)} ·{" "}
                {formatCurrency(
                  selectedOption.totalPriceCents,
                  selectedOption.currency ?? "PHP",
                )}
              </p>
            </div>
            <Button size="sm" onClick={handleReserve}>
              Continue
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
}
