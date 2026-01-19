"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
  StandardFormTextarea,
} from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  GoogleMapsEmbed,
  KudosDatePicker,
  type TimeSlot,
  TimeSlotPicker,
  TimeSlotPickerSkeleton,
} from "@/shared/components/kudos";
import { Container } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import {
  formatCurrency,
  formatDuration,
  formatInTimeZone,
} from "@/shared/lib/format";
import { getZonedDayKey } from "@/shared/lib/time-zone";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import { trpc } from "@/trpc/client";

const DURATIONS = [60, 120, 180];

const claimFormSchema = z.object({
  organizationId: z.string().uuid("Organization is required"),
  requestNotes: z.string().max(1000).optional(),
});

const removalFormSchema = z.object({
  guestName: z.string().min(2, "Name is required").max(150),
  guestEmail: z.string().email("Enter a valid email").max(255),
  requestNotes: z.string().min(10, "Please share more details").max(1000),
});

type ClaimFormData = z.infer<typeof claimFormSchema>;

type RemovalFormData = z.infer<typeof removalFormSchema>;

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = (params.placeId ?? params.id) as string;

  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const utils = trpc.useUtils();
  const { data: organizations = [] } = trpc.organization.my.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    },
  );
  const isOwner = organizations.length > 0;

  const claimForm = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    mode: "onChange",
    defaultValues: {
      organizationId: organizations[0]?.id ?? "",
      requestNotes: "",
    },
  });

  const removalForm = useForm<RemovalFormData>({
    resolver: zodResolver(removalFormSchema),
    mode: "onChange",
    defaultValues: {
      guestName: "",
      guestEmail: "",
      requestNotes: "",
    },
  });

  const {
    setValue: setClaimValue,
    reset: resetClaimForm,
    getValues: getClaimValues,
    formState: { isValid: isClaimValid, isSubmitting: isClaimSubmitting },
  } = claimForm;

  const {
    reset: resetRemovalForm,
    formState: { isValid: isRemovalValid, isSubmitting: isRemovalSubmitting },
  } = removalForm;

  const [isClaimOpen, setIsClaimOpen] = React.useState(false);
  const [isRemovalOpen, setIsRemovalOpen] = React.useState(false);

  const [selectedDate, setSelectedDate] = React.useState<Date>();
  const [durationMinutes, setDurationMinutes] = React.useState(60);
  const [selectedSportId, setSelectedSportId] = React.useState<string>();
  const [selectionMode, setSelectionMode] = React.useState<"any" | "court">(
    "any",
  );
  const [selectedCourtId, setSelectedCourtId] = React.useState<string>();
  const [selectedSlotId, setSelectedSlotId] = React.useState<string>();

  const sportSectionRef = React.useRef<HTMLDivElement | null>(null);
  const courtSectionRef = React.useRef<HTMLDivElement | null>(null);
  const durationSectionRef = React.useRef<HTMLDivElement | null>(null);
  const dateSectionRef = React.useRef<HTMLDivElement | null>(null);
  const timesSectionRef = React.useRef<HTMLDivElement | null>(null);

  const resetSelection = React.useCallback(() => {
    setSelectedSlotId(undefined);
  }, []);

  const scrollToSection = React.useCallback(
    (ref: React.RefObject<HTMLElement | null>) => {
      const element = ref.current;
      if (!element || typeof window === "undefined") return;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [],
  );

  const { data: place, isLoading } = usePlaceDetail({ placeId });
  const placeTimeZone = place?.timeZone ?? "Asia/Manila";
  const isBookable = place?.placeType === "RESERVABLE";
  const isCurated = place?.placeType === "CURATED";
  const canSubmitClaim = Boolean(
    place &&
      isCurated &&
      place.claimStatus === "UNCLAIMED" &&
      isAuthenticated &&
      isOwner,
  );
  const organizationOptions = organizations.map((organization) => ({
    label: organization.name,
    value: organization.id,
  }));
  const defaultOrganizationId = organizations[0]?.id ?? "";

  const claimMutation = trpc.claimRequest.submitClaim.useMutation();
  const removalMutation = trpc.claimRequest.submitGuestRemoval.useMutation();

  React.useEffect(() => {
    if (!defaultOrganizationId) return;
    const currentOrgId = getClaimValues("organizationId");
    if (currentOrgId) return;
    setClaimValue("organizationId", defaultOrganizationId, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [defaultOrganizationId, getClaimValues, setClaimValue]);

  React.useEffect(() => {
    if (isClaimOpen) return;
    const currentOrgId = getClaimValues("organizationId") ?? "";
    const currentNotes = getClaimValues("requestNotes") ?? "";
    if (currentOrgId === defaultOrganizationId && currentNotes === "") {
      return;
    }
    resetClaimForm({
      organizationId: defaultOrganizationId,
      requestNotes: "",
    });
  }, [defaultOrganizationId, getClaimValues, isClaimOpen, resetClaimForm]);

  const courtsForSport = React.useMemo(() => {
    if (!place || !selectedSportId) return [];
    return place.courts.filter((court) => court.sportId === selectedSportId);
  }, [place, selectedSportId]);

  React.useEffect(() => {
    if (!place || !isBookable) return;
    if (!selectedSportId) {
      setSelectedSportId(place.sports[0]?.id);
    }
  }, [place, selectedSportId, isBookable]);

  React.useEffect(() => {
    if (!isBookable) return;
    if (selectionMode !== "court") return;
    if (selectedCourtId) return;
    const firstCourt = courtsForSport.find((court) => court.isActive);
    if (firstCourt) {
      setSelectedCourtId(firstCourt.id);
    }
  }, [courtsForSport, selectedCourtId, selectionMode, isBookable]);

  const availabilityQuery = usePlaceAvailability({
    place: isBookable ? (place ?? undefined) : undefined,
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
  const hasSelectedDate = !!selectedDate;
  const hasSelectedSlot = !!selectedSlot;

  const scheduleHref = React.useMemo(() => {
    if (!isBookable || !place) return undefined;
    const params = new URLSearchParams();

    params.set("duration", String(durationMinutes));
    params.set("mode", selectionMode);

    if (selectedSportId) {
      params.set("sportId", selectedSportId);
    }

    if (selectedDate) {
      params.set("date", getZonedDayKey(selectedDate, placeTimeZone));
    }

    if (selectionMode === "court" && selectedCourtId) {
      params.set("courtId", selectedCourtId);
    }

    if (selectedSlot) {
      params.set("startTime", selectedSlot.startTime);
    }

    const query = params.toString();
    return query
      ? `${appRoutes.places.schedule(placeId)}?${query}`
      : appRoutes.places.schedule(placeId);
  }, [
    durationMinutes,
    isBookable,
    place,
    placeId,
    placeTimeZone,
    selectedCourtId,
    selectedDate,
    selectedSlot,
    selectedSportId,
    selectionMode,
  ]);

  const summaryCtaVariant = hasSelectedSlot ? "default" : "outline";
  const summaryCtaLabel = hasSelectedSlot
    ? "Reserve now"
    : hasSelectedDate
      ? "See available times"
      : "Choose a date";

  const handleClaimSubmit = async (data: ClaimFormData) => {
    try {
      await claimMutation.mutateAsync({
        placeId,
        organizationId: data.organizationId,
        requestNotes: data.requestNotes?.trim() || undefined,
      });
      toast.success("Claim submitted", {
        description: "We will review your request within 48 hours.",
      });
      resetClaimForm({
        organizationId: defaultOrganizationId,
        requestNotes: "",
      });
      setIsClaimOpen(false);
      await utils.place.getById.invalidate({ placeId });
    } catch (error) {
      toast.error("Unable to submit claim", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRemovalSubmit = async (data: RemovalFormData) => {
    try {
      await removalMutation.mutateAsync({
        placeId,
        guestName: data.guestName.trim(),
        guestEmail: data.guestEmail.trim(),
        requestNotes: data.requestNotes.trim(),
      });
      toast.success("Removal request submitted", {
        description: "We will review your request shortly.",
      });
      resetRemovalForm({
        guestName: "",
        guestEmail: "",
        requestNotes: "",
      });
      setIsRemovalOpen(false);
      await utils.place.getById.invalidate({ placeId });
    } catch (error) {
      toast.error("Unable to submit removal request", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const claimSubmitting = claimMutation.isPending || isClaimSubmitting;
  const claimDisabled = claimSubmitting || !isClaimValid;
  const removalSubmitting = removalMutation.isPending || isRemovalSubmitting;
  const removalDisabled = removalSubmitting || !isRemovalValid;

  const handleReserve = () => {
    if (!place) return;
    const params = new URLSearchParams();

    params.set("duration", String(durationMinutes));
    params.set("mode", selectionMode);

    if (selectedSportId) {
      params.set("sportId", selectedSportId);
    }

    if (selectedDate) {
      params.set("date", getZonedDayKey(selectedDate, placeTimeZone));
    }

    if (selectionMode === "court" && selectedCourtId) {
      params.set("courtId", selectedCourtId);
    }

    if (selectedSlot) {
      params.set("startTime", selectedSlot.startTime);
    }

    const destination = `${appRoutes.places.book(placeId)}?${params.toString()}`;
    if (isAuthenticated) {
      router.push(destination);
    } else {
      router.push(appRoutes.login.from(appRoutes.places.detail(placeId)));
    }
  };

  const handleSummaryAction = () => {
    if (hasSelectedSlot) {
      handleReserve();
      return;
    }

    if (!hasSelectedDate) {
      scrollToSection(dateSectionRef);
      return;
    }

    scrollToSection(timesSectionRef);
  };

  const handleScrollToAvailability = (event?: React.MouseEvent) => {
    if (!isBookable) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    scrollToSection(dateSectionRef);
  };

  if (isLoading) {
    return <PlaceDetailSkeleton />;
  }

  if (!place) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Venue not found</h1>
          <p className="text-muted-foreground mt-2">
            The venue you&apos;re looking for doesn&apos;t exist or has been
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

  const hasCoordinates =
    typeof place.latitude === "number" &&
    Number.isFinite(place.latitude) &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.longitude);
  const contactDetail = place.contactDetail;
  const hasContactDetail = Boolean(
    contactDetail?.websiteUrl ||
      contactDetail?.facebookUrl ||
      contactDetail?.instagramUrl ||
      contactDetail?.viberInfo ||
      contactDetail?.otherContactInfo,
  );
  const claimStatusMessage =
    place.claimStatus === "CLAIM_PENDING"
      ? "A claim request is pending admin review."
      : place.claimStatus === "CLAIMED"
        ? "This venue has already been claimed."
        : place.claimStatus === "REMOVAL_REQUESTED"
          ? "This venue is pending removal review."
          : null;
  const claimHelperText = !isAuthenticated
    ? "Sign in to claim this venue."
    : !isOwner
      ? "Create an organization to claim this venue."
      : "This venue is not currently available to claim.";
  const removalHelperText =
    place.claimStatus === "REMOVAL_REQUESTED"
      ? "A removal request is already pending review."
      : "Request removal if this listing is inaccurate or should be removed.";
  const mapQuery = `${place.name} ${place.address} ${place.city}`;
  const directionsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const openInMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <Container className="py-6">
      <div className="space-y-6">
        {isBookable ? (
          <div className="space-y-2">
            <Progress value={50} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Step 1 of 2 · Select your court and time
            </p>
          </div>
        ) : (
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-warning/10 text-warning"
                >
                  Curated listing
                </Badge>
                {place.claimStatus === "CLAIM_PENDING" && (
                  <Badge variant="outline">Claim pending</Badge>
                )}
                {place.claimStatus === "CLAIMED" && (
                  <Badge variant="outline">Claimed</Badge>
                )}
              </div>
              <CardTitle className="text-base">Not bookable yet</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Bookings open once an organization claim is approved by the admin
              team.
            </CardContent>
          </Card>
        )}

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
          <PhotoGallery
            photos={place.photos}
            courtName={place.name}
            mainOverlay={
              isBookable ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full items-start gap-2 rounded-xl border-border/60 bg-background/95 p-3 text-left shadow-md backdrop-blur"
                  onClick={handleScrollToAvailability}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-accent" />
                    Check availability
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pick a date and start time below.
                  </p>
                  <span className="text-xs font-medium text-accent">
                    Jump to times
                  </span>
                </Button>
              ) : undefined
            }
          />

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!hasContactDetail && (
                <p className="text-muted-foreground">
                  Contact details are not available yet.
                </p>
              )}
              {contactDetail?.websiteUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-muted-foreground">Website</span>
                  <a
                    href={contactDetail.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    Visit
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {contactDetail?.facebookUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-muted-foreground">Facebook</span>
                  <a
                    href={contactDetail.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {contactDetail?.instagramUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-muted-foreground">Instagram</span>
                  <a
                    href={contactDetail.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {contactDetail?.viberInfo && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-muted-foreground">Viber</span>
                  <span className="font-medium">{contactDetail.viberInfo}</span>
                </div>
              )}
              {contactDetail?.otherContactInfo && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">Other</span>
                  <p className="text-sm">{contactDetail.otherContactInfo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isBookable ? (
            <>
              <div ref={sportSectionRef} className="scroll-mt-24">
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
              </div>

              <div ref={courtSectionRef} className="scroll-mt-24">
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
                        <Label
                          htmlFor="any"
                          className="space-y-1 cursor-pointer"
                        >
                          <div className="font-medium">Any available court</div>
                          <div className="text-sm text-muted-foreground">
                            Lowest total price across courts for the selected
                            sport.
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
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {court.tierLabel}
                                </Badge>
                              )}
                              {!court.isActive && (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px]"
                                >
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
              </div>

              <div ref={durationSectionRef} className="scroll-mt-24">
                <Card>
                  <CardHeader>
                    <CardTitle>Duration</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    {DURATIONS.map((duration) => (
                      <Button
                        key={duration}
                        type="button"
                        variant={
                          durationMinutes === duration ? "default" : "outline"
                        }
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
              </div>

              <div ref={timesSectionRef} className="scroll-mt-24">
                <Card>
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>Available start times</CardTitle>
                      <Badge
                        className="bg-accent/10 text-accent"
                        variant="secondary"
                      >
                        Next step
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pick a date and start time to continue.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      ref={dateSectionRef}
                      className="space-y-2 scroll-mt-24"
                    >
                      <p className="text-sm font-medium">Select date</p>
                      <KudosDatePicker
                        value={selectedDate}
                        onChange={(date) => {
                          setSelectedDate(date);
                          resetSelection();
                        }}
                        placeholder="Choose a date"
                        timeZone={placeTimeZone}
                      />
                    </div>

                    {selectedDate && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Available times on{" "}
                          {formatInTimeZone(
                            selectedDate,
                            placeTimeZone,
                            "MMM d",
                          )}
                        </p>
                        {isLoadingAvailability ? (
                          <TimeSlotPickerSkeleton count={6} />
                        ) : timeSlots.length > 0 ? (
                          <TimeSlotPicker
                            slots={timeSlots}
                            selectedId={selectedSlotId}
                            onSelect={(slot) => setSelectedSlotId(slot.id)}
                            showPrice
                            timeZone={placeTimeZone}
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
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Courts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {place.courts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Court inventory has not been added yet.
                  </p>
                ) : (
                  place.courts.map((court) => (
                    <div
                      key={court.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{court.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {court.sportName}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
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
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {isBookable ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Booking summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Selected court
                    </p>
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
                    <p className="font-medium">
                      {formatDuration(durationMinutes)}
                    </p>
                  </div>
                  {selectedSlot ? (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Start time
                      </p>
                      <p className="font-medium">
                        {formatInTimeZone(
                          selectedSlot.startTime,
                          placeTimeZone,
                          "h:mm a",
                        )}{" "}
                        ·{" "}
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

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-muted-foreground">
                      Jump to:
                    </span>
                    <button
                      type="button"
                      className="text-accent hover:underline"
                      onClick={() => scrollToSection(sportSectionRef)}
                    >
                      Sport
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      className="text-accent hover:underline"
                      onClick={() => scrollToSection(courtSectionRef)}
                    >
                      Court
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      className="text-accent hover:underline"
                      onClick={() => scrollToSection(durationSectionRef)}
                    >
                      Duration
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      className="text-accent hover:underline"
                      onClick={() => scrollToSection(timesSectionRef)}
                    >
                      Times
                    </button>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    variant={summaryCtaVariant}
                    onClick={handleSummaryAction}
                  >
                    {summaryCtaLabel}
                  </Button>

                  {scheduleHref && (
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="w-full justify-center"
                    >
                      <Link href={scheduleHref}>See full schedule</Link>
                    </Button>
                  )}

                  {!isAuthenticated && selectedSlot && (
                    <p className="text-xs text-muted-foreground text-center">
                      Sign in to complete your booking request.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <GoogleMapsEmbed
                    title={`${place.name} location`}
                    lat={place.latitude}
                    lng={place.longitude}
                    query={mapQuery}
                    className="aspect-[16/9] w-full"
                    allowInteraction={false}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      asChild
                    >
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Get Directions
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      asChild
                    >
                      <a
                        href={openInMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in Google Maps
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
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
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Claim this venue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-muted-foreground">
                    Claim this listing to manage courts and enable bookings.
                  </p>
                  {claimStatusMessage ? (
                    <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      {claimStatusMessage}
                    </div>
                  ) : canSubmitClaim ? (
                    <Dialog open={isClaimOpen} onOpenChange={setIsClaimOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full">Claim this venue</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                          <DialogTitle>Submit claim request</DialogTitle>
                          <DialogDescription>
                            Share your organization and any context for the
                            admin review.
                          </DialogDescription>
                        </DialogHeader>
                        <StandardFormProvider
                          form={claimForm}
                          onSubmit={handleClaimSubmit}
                          className="space-y-4"
                        >
                          <StandardFormSelect<ClaimFormData>
                            name="organizationId"
                            label="Organization"
                            placeholder="Select organization"
                            options={organizationOptions}
                            required
                            disabled={organizationOptions.length === 1}
                          />
                          <StandardFormTextarea<ClaimFormData>
                            name="requestNotes"
                            label="Notes (optional)"
                            placeholder="Share any context that helps verify ownership."
                          />
                          <DialogFooter className="gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsClaimOpen(false)}
                              disabled={claimSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={claimDisabled}>
                              {claimSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Submit claim
                            </Button>
                          </DialogFooter>
                        </StandardFormProvider>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {claimHelperText}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Request listing removal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p className="text-muted-foreground">{removalHelperText}</p>
                  {place.claimStatus === "REMOVAL_REQUESTED" ? (
                    <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      Removal request submitted. We will review shortly.
                    </div>
                  ) : (
                    <Dialog
                      open={isRemovalOpen}
                      onOpenChange={setIsRemovalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          Request removal
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                          <DialogTitle>Request listing removal</DialogTitle>
                          <DialogDescription>
                            Share your contact details so we can follow up
                            during review.
                          </DialogDescription>
                        </DialogHeader>
                        <StandardFormProvider
                          form={removalForm}
                          onSubmit={handleRemovalSubmit}
                          className="space-y-4"
                        >
                          <StandardFormInput<RemovalFormData>
                            name="guestName"
                            label="Full name"
                            placeholder="Your name"
                            required
                          />
                          <StandardFormInput<RemovalFormData>
                            name="guestEmail"
                            label="Email"
                            placeholder="you@example.com"
                            required
                          />
                          <StandardFormTextarea<RemovalFormData>
                            name="requestNotes"
                            label="Reason"
                            placeholder="Let us know why this listing should be removed."
                            required
                          />
                          <DialogFooter className="gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsRemovalOpen(false)}
                              disabled={removalSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={removalDisabled}>
                              {removalSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Submit request
                            </Button>
                          </DialogFooter>
                        </StandardFormProvider>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <GoogleMapsEmbed
                    title={`${place.name} location`}
                    lat={place.latitude}
                    lng={place.longitude}
                    query={mapQuery}
                    className="aspect-[16/9] w-full"
                    allowInteraction={false}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      asChild
                    >
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        Get Directions
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      asChild
                    >
                      <a
                        href={openInMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in Google Maps
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
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
          <div className="aspect-[4/3] sm:aspect-[16/10] md:aspect-[2/1] lg:aspect-[21/9] bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
        <div>
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </Container>
  );
}
