"use client";

import { format } from "date-fns";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/features/auth";
import { PhotoGallery } from "@/features/discovery/components";
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
import { formatCurrency, formatDuration } from "@/shared/lib/format";

const DURATIONS = [60, 120, 180];

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = (params.placeId ?? params.id) as string;

  const { data: session } = useSession();
  const isAuthenticated = !!session;

  const [selectedDate, setSelectedDate] = React.useState<Date>();
  const [durationMinutes, setDurationMinutes] = React.useState(60);
  const [selectedSportId, setSelectedSportId] = React.useState<string>();
  const [selectionMode, setSelectionMode] = React.useState<"any" | "court">(
    "any",
  );
  const [selectedCourtId, setSelectedCourtId] = React.useState<string>();
  const [selectedSlotId, setSelectedSlotId] = React.useState<string>();

  const resetSelection = React.useCallback(() => {
    setSelectedSlotId(undefined);
  }, []);

  const { data: place, isLoading } = usePlaceDetail({ placeId });

  const courtsForSport = React.useMemo(() => {
    if (!place || !selectedSportId) return [];
    return place.courts.filter((court) => court.sportId === selectedSportId);
  }, [place, selectedSportId]);

  React.useEffect(() => {
    if (!place) return;
    if (!selectedSportId) {
      setSelectedSportId(place.sports[0]?.id);
    }
  }, [place, selectedSportId]);

  React.useEffect(() => {
    if (selectionMode !== "court") return;
    if (selectedCourtId) return;
    const firstCourt = courtsForSport.find((court) => court.isActive);
    if (firstCourt) {
      setSelectedCourtId(firstCourt.id);
    }
  }, [courtsForSport, selectedCourtId, selectionMode]);

  const availabilityQuery = usePlaceAvailability({
    place: place ?? undefined,
    sportId: selectedSportId,
    courtId: selectionMode === "court" ? selectedCourtId : undefined,
    date: selectedDate,
    durationMinutes,
    mode: selectionMode,
  });

  const availability = availabilityQuery.data ?? [];
  const isLoadingAvailability = availabilityQuery.isLoading;

  const timeSlots: TimeSlot[] = availability.map((slot) => ({
    id: slot.id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    priceCents: slot.totalPriceCents,
    currency: slot.currency,
    status: "available",
  }));

  const selectedSlot = availability.find((slot) => slot.id === selectedSlotId);

  const handleReserve = () => {
    if (!selectedSlot || !selectedSportId) return;
    const params = new URLSearchParams({
      startTime: selectedSlot.startTime,
      duration: durationMinutes.toString(),
      sportId: selectedSportId,
      mode: selectionMode,
    });

    if (selectionMode === "court" && selectedCourtId) {
      params.set("courtId", selectedCourtId);
    }

    const destination = `${appRoutes.places.book(placeId)}?${params.toString()}`;
    if (isAuthenticated) {
      router.push(destination);
    } else {
      router.push(appRoutes.login.from(appRoutes.places.detail(placeId)));
    }
  };

  if (isLoading) {
    return <PlaceDetailSkeleton />;
  }

  if (!place) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Place not found</h1>
          <p className="text-muted-foreground mt-2">
            The place you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Link
            href={appRoutes.places.base}
            className="text-primary hover:underline mt-4 inline-block"
          >
            Browse all places
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Progress value={50} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Step 1 of 2 · Select your court and time
          </p>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            {place.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-accent" />
              {place.address}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {place.courts.length} courts
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <PhotoGallery photos={place.photos} courtName={place.name} />

          <Card>
            <CardHeader>
              <CardTitle>Choose a sport</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={selectedSportId}
                onValueChange={(value) => {
                  setSelectedSportId(value);
                  setSelectedCourtId(undefined);
                  setSelectionMode("any");
                  resetSelection();
                }}
              >
                <TabsList>
                  {place.sports.map((sport) => (
                    <TabsTrigger key={sport.id} value={sport.id}>
                      {sport.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Choose court</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectionMode === "any" ? "any" : selectedCourtId}
                onValueChange={(value) => {
                  if (value === "any") {
                    setSelectionMode("any");
                    setSelectedCourtId(undefined);
                    resetSelection();
                    return;
                  }
                  setSelectionMode("court");
                  setSelectedCourtId(value);
                  resetSelection();
                }}
                className="space-y-3"
              >
                <div className="flex items-start gap-3 rounded-lg border px-4 py-3">
                  <RadioGroupItem value="any" id="any" className="mt-1" />
                  <Label htmlFor="any" className="space-y-1 cursor-pointer">
                    <div className="font-medium">Any available court</div>
                    <div className="text-sm text-muted-foreground">
                      Lowest total price across courts for the selected sport.
                    </div>
                  </Label>
                </div>

                {courtsForSport.map((court) => (
                  <div
                    key={court.id}
                    className="flex items-start gap-3 rounded-lg border px-4 py-3"
                  >
                    <RadioGroupItem
                      value={court.id}
                      id={court.id}
                      className="mt-1"
                      disabled={!court.isActive}
                    />
                    <Label
                      htmlFor={court.id}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{court.label}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {court.sportName}
                        </Badge>
                        {court.tierLabel && (
                          <Badge variant="secondary" className="text-[10px]">
                            {court.tierLabel}
                          </Badge>
                        )}
                        {!court.isActive && (
                          <Badge variant="destructive" className="text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pricing shown after selecting a time.
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duration</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {DURATIONS.map((duration) => (
                <Button
                  key={duration}
                  type="button"
                  variant={durationMinutes === duration ? "default" : "outline"}
                  onClick={() => {
                    setDurationMinutes(duration);
                    resetSelection();
                  }}
                >
                  {formatDuration(duration)}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available start times</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Select date</p>
                <KudosDatePicker
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    resetSelection();
                  }}
                  placeholder="Choose a date"
                />
              </div>

              {selectedDate && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Available times on {format(selectedDate, "MMM d")}
                  </p>
                  {isLoadingAvailability ? (
                    <TimeSlotPickerSkeleton count={6} />
                  ) : timeSlots.length > 0 ? (
                    <TimeSlotPicker
                      slots={timeSlots}
                      selectedId={selectedSlotId}
                      onSelect={(slot) => setSelectedSlotId(slot.id)}
                      showPrice
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No available start times for this date.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Selected court</p>
                <p className="font-medium">
                  {selectionMode === "any"
                    ? "Any available court"
                    : (courtsForSport.find(
                        (court) => court.id === selectedCourtId,
                      )?.label ?? "Select a court")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{formatDuration(durationMinutes)}</p>
              </div>
              {selectedSlot ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start time</p>
                  <p className="font-medium">
                    {format(new Date(selectedSlot.startTime), "h:mm a")} ·{" "}
                    {formatCurrency(
                      selectedSlot.totalPriceCents,
                      selectedSlot.currency,
                    )}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Select a start time to see pricing and continue.
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                disabled={!selectedSlot}
                onClick={handleReserve}
              >
                {selectedSlot
                  ? isAuthenticated
                    ? "Continue to review"
                    : "Sign in to reserve"
                  : "Select a start time"}
              </Button>
              {!isAuthenticated && selectedSlot && (
                <p className="text-xs text-muted-foreground text-center">
                  Sign in to complete your booking request.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                <span>
                  We&apos;ll hold the requested slots while you review.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <span>Owners review and confirm paid reservations.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}

function PlaceDetailSkeleton() {
  return (
    <Container className="py-6">
      <div className="space-y-6">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid gap-8 lg:grid-cols-3 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[16/9] bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
        <div>
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </Container>
  );
}
