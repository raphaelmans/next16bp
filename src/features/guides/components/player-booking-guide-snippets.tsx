"use client";

import { CheckCircle, Clock, MapPin } from "lucide-react";
import {
  AvailabilityWeekGrid,
  KudosStatusBadge,
  type TimeSlot,
  WeekNavigator,
} from "@/components/kudos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PlaceDetailBookingSummaryCard } from "@/features/discovery/place-detail/components/place-detail-booking-summary-card";
import type { BookingCartItem } from "@/features/discovery/place-detail/stores/booking-cart-store";
import { GuideSnippetWrapper } from "@/features/guides/components/guide-snippet-wrapper";
import { StatusBanner } from "@/features/reservation/components/status-banner";

const NOOP = () => {};
const MOCK_PAYMENT_EXPIRES_AT = new Date(
  Date.now() + 45 * 60 * 1000,
).toISOString();

const MOCK_WEEK_DAY_KEYS = [
  "2026-03-15",
  "2026-03-16",
  "2026-03-17",
  "2026-03-18",
  "2026-03-19",
  "2026-03-20",
  "2026-03-21",
];

function makeUtcSlot(
  dayKey: string,
  hour: number,
  status: TimeSlot["status"],
  priceCents = 45000,
): TimeSlot {
  const start = new Date(`${dayKey}T00:00:00.000Z`);
  start.setUTCHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    id: `${dayKey}-${hour}`,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    priceCents,
    currency: "PHP",
    status,
  };
}

const MOCK_WEEK_SLOTS = new Map<string, TimeSlot[]>(
  MOCK_WEEK_DAY_KEYS.map((dayKey, index) => {
    const bookedHour = index % 2 === 0 ? 20 : 19;
    return [
      dayKey,
      [
        makeUtcSlot(dayKey, 18, "available"),
        makeUtcSlot(dayKey, 19, bookedHour === 19 ? "booked" : "available"),
        makeUtcSlot(dayKey, 20, bookedHour === 20 ? "booked" : "available"),
        makeUtcSlot(dayKey, 21, "available"),
      ],
    ] as const;
  }),
);

const MOCK_SELECTION_SUMMARY = {
  startTime: "2026-03-15T18:00:00.000Z",
  endTime: "2026-03-15T20:00:00.000Z",
  totalCents: 90000,
  currency: "PHP",
};

const MOCK_BOOKING_CART_ITEMS: BookingCartItem[] = [
  {
    key: "court-a|2026-03-15T18:00:00.000Z|120",
    courtId: "court-a",
    courtLabel: "Court A",
    sportId: "badminton",
    startTime: "2026-03-15T18:00:00.000Z",
    durationMinutes: 120,
    estimatedPriceCents: 90000,
    currency: "PHP",
  },
  {
    key: "court-b|2026-03-15T23:00:00.000Z|120",
    courtId: "court-b",
    courtLabel: "Court B",
    sportId: "badminton",
    startTime: "2026-03-15T23:00:00.000Z",
    durationMinutes: 120,
    estimatedPriceCents: 80000,
    currency: "PHP",
  },
];

function LifecycleStage({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status:
    | "CREATED"
    | "AWAITING_PAYMENT"
    | "PAYMENT_MARKED_BY_USER"
    | "CONFIRMED";
}) {
  return (
    <div className="rounded-lg border p-3">
      <KudosStatusBadge status={status} size="sm" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function MockGuestSlotPicker() {
  return (
    <GuideSnippetWrapper>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>Availability</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Browse weekly availability and select a start/end range
                  directly on the grid.
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Live availability
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Sport</p>
              <Tabs defaultValue="badminton">
                <TabsList>
                  <TabsTrigger value="badminton">Badminton</TabsTrigger>
                  <TabsTrigger value="pickleball">Pickleball</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-2">
                <p className="text-sm font-medium">View</p>
                <ToggleGroup type="single" value="court">
                  <ToggleGroupItem value="court" size="sm">
                    Pick a court
                  </ToggleGroupItem>
                  <ToggleGroupItem value="any" size="sm">
                    Any court
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Court</p>
                <div className="-mx-1 overflow-x-auto px-1 scrollbar-none">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-primary"
                    >
                      Court A
                    </button>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium whitespace-nowrap text-foreground"
                    >
                      Court B
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Week of Mar 15 - Mar 21</p>
                  <p className="text-xs text-muted-foreground">
                    Choose a start slot, then choose an end slot.
                  </p>
                </div>
                <WeekNavigator
                  weekHeaderLabel="Mar 15 - Mar 21"
                  onPrevWeek={NOOP}
                  onNextWeek={NOOP}
                  isPrevWeekDisabled={false}
                  isNextWeekDisabled={false}
                  onGoToToday={NOOP}
                  selectedDate={new Date("2026-03-15T00:00:00.000Z")}
                  onCalendarJump={NOOP}
                  todayRangeStart={new Date("2026-03-15T00:00:00.000Z")}
                  maxBookingDate={new Date("2026-04-15T00:00:00.000Z")}
                  placeTimeZone="UTC"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            <AvailabilityWeekGrid
              dayKeys={MOCK_WEEK_DAY_KEYS}
              slotsByDay={MOCK_WEEK_SLOTS}
              timeZone="UTC"
              selectedRange={{
                startTime: "2026-03-15T18:00:00.000Z",
                durationMinutes: 120,
              }}
              onRangeChange={NOOP}
              onDayClick={NOOP}
              todayDayKey="2026-03-15"
              maxDayKey="2026-03-21"
              cartedStartTimes={
                new Set([
                  "2026-03-15T18:00:00.000Z",
                  "2026-03-15T23:00:00.000Z",
                ])
              }
            />

            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm">
                Clear selection
              </Button>
            </div>
          </CardContent>
        </Card>

        <PlaceDetailBookingSummaryCard
          selectionMode="court"
          courtsForSport={[
            { id: "court-a", label: "Court A" },
            { id: "court-b", label: "Court B" },
          ]}
          selectedCourtId="court-a"
          selectedAddonCount={1}
          durationMinutes={120}
          hasSelection
          selectionSummary={MOCK_SELECTION_SUMMARY}
          placeTimeZone="UTC"
          summaryCtaVariant="default"
          summaryCtaLabel="Continue to checkout (2)"
          onSummaryAction={NOOP}
          isAuthenticated={false}
          cartItems={MOCK_BOOKING_CART_ITEMS}
          canAddToCart
          onAddToCartAction={NOOP}
          onRemoveFromCartAction={NOOP}
        />
      </div>
    </GuideSnippetWrapper>
  );
}

export function MockBookingLoginForm() {
  return (
    <GuideSnippetWrapper>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Sign in with your email and password
          </CardDescription>
          <p className="text-sm text-muted-foreground">
            You&apos;ll return to your reservation after signing in.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button type="button" variant="outline" className="w-full">
            Continue with Google
          </Button>

          <div className="py-1">
            <div className="h-px bg-border" />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input readOnly tabIndex={-1} value="raphael+4@kudoscourts.com" />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input readOnly tabIndex={-1} type="password" value="password123" />
          </div>
        </CardContent>
        <CardFooter className="mt-2 flex flex-col gap-4">
          <Button type="button" className="w-full">
            Sign In
          </Button>
          <div className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <span className="text-primary">Sign up</span>
          </div>
        </CardFooter>
      </Card>
    </GuideSnippetWrapper>
  );
}

export function MockBookingReviewSummary() {
  return (
    <GuideSnippetWrapper>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are booking 2 venues in one request.
              </p>

              <div className="space-y-3">
                <div className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">Cebu Sports Hub · Court A</p>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mar 15, 2026 · 6:00 PM - 8:00 PM (2h)
                  </p>
                  <p className="mt-1 text-sm">₱900</p>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">Cebu Sports Hub · Court B</p>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mar 15, 2026 · 11:00 PM - Mar 16, 2026, 1:00 AM (2h)
                  </p>
                  <p className="mt-1 text-sm">₱800</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-primary hover:text-primary"
              >
                Review booking details
              </Button>

              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Court A · 6:00 PM - 8:00 PM
                  </span>
                  <span>₱900</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Court B · 11:00 PM - 1:00 AM
                  </span>
                  <span>₱800</span>
                </div>
              </div>

              <div className="flex justify-between border-t pt-4 text-lg font-medium">
                <span>Total</span>
                <span>₱1,700</span>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <Checkbox checked id="guide-terms" />
                <Label
                  htmlFor="guide-terms"
                  className="cursor-pointer text-sm leading-snug"
                >
                  I agree to the Terms and Conditions and Privacy Policy
                </Label>
              </div>

              <Button size="lg" className="w-full" type="button">
                Confirm Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </GuideSnippetWrapper>
  );
}

export function MockBookingProfileGate() {
  return (
    <GuideSnippetWrapper>
      <div className="max-w-md rounded-2xl border bg-background/90 p-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="font-heading text-lg font-semibold">
            Your Booking Profile
          </h3>
          <p className="text-sm text-muted-foreground">
            Required to complete your reservation.
          </p>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input readOnly tabIndex={-1} value="E2E Player" />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input readOnly tabIndex={-1} value="0917 123 4567" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input readOnly tabIndex={-1} value="raphael+4@kudoscourts.com" />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="button">Save &amp; Continue</Button>
        </div>
      </div>
    </GuideSnippetWrapper>
  );
}

export function MockBookingTermsConfirm() {
  return (
    <GuideSnippetWrapper>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Ready to confirm</CardTitle>
          <CardDescription>
            Accept the booking terms to unlock the final action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox checked />
            <div className="space-y-1 text-sm">
              <p>I agree to the Terms and Conditions and Privacy Policy.</p>
              <p className="text-muted-foreground">
                This step is required before the owner can review the request.
              </p>
            </div>
          </div>
          <Button type="button" size="lg" className="w-full">
            Confirm Booking
          </Button>
        </CardContent>
      </Card>
    </GuideSnippetWrapper>
  );
}

export function MockReservationRequested() {
  return (
    <GuideSnippetWrapper>
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="font-heading text-xl font-semibold">Reservation</h3>
          <p className="text-sm text-muted-foreground">
            Track status, payment, venue details, and owner updates without
            leaving this page.
          </p>
        </div>

        <StatusBanner
          status="CREATED"
          reservationId="guide-demo-reservation"
          onMessageOwner={NOOP}
        />

        <Card>
          <CardHeader>
            <CardTitle>Reservation lifecycle</CardTitle>
            <CardDescription>
              The same request can move through review, payment, and
              confirmation without leaving the reservation detail page.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <LifecycleStage
              status="CREATED"
              title="Reservation requested"
              description="Owner review in progress."
            />
            <LifecycleStage
              status="AWAITING_PAYMENT"
              title="Awaiting payment"
              description="Owner accepted and is waiting for payment."
            />
            <LifecycleStage
              status="PAYMENT_MARKED_BY_USER"
              title="Payment marked"
              description="Player submitted payment proof for verification."
            />
            <LifecycleStage
              status="CONFIRMED"
              title="Confirmed"
              description="The booking is now fully confirmed."
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment window</CardTitle>
              <CardDescription>
                Example hold window: 45 minutes before the reservation expires.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusBanner
                status="AWAITING_PAYMENT"
                reservationId="guide-demo-reservation"
                expiresAt={MOCK_PAYMENT_EXPIRES_AT}
                onMessageOwner={NOOP}
              />
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <div>
                    <span className="font-mono text-lg font-semibold">
                      45:00
                    </span>
                    <span className="ml-2 text-sm">remaining</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expired state</CardTitle>
              <CardDescription>
                If the payment window lapses, the reservation closes and the
                slot is released.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusBanner
                status="EXPIRED"
                reservationId="guide-demo-reservation"
              />
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                The payment window has passed. Book again if the slot is still
                available.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </GuideSnippetWrapper>
  );
}

export function MockReservationChatOwner() {
  return (
    <GuideSnippetWrapper>
      <div className="max-w-lg overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div className="space-y-0.5">
            <p className="font-heading font-semibold">Message the venue</p>
            <p className="text-xs text-muted-foreground">
              Processing - Reservation GUIDE123
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
            <span className="sr-only">Close</span>×
          </Button>
        </div>

        <div className="border-b bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
          Waiting for venue confirmation. You can still message the venue.
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
              Hi! We saw your booking request for Court A. Do you need parking
              or racket rental too?
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
              Yes please, and I&apos;ll send payment as soon as you confirm the
              amount.
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
              Perfect. I&apos;ll confirm the request and send the payment
              instructions here.
            </div>
          </div>
        </div>

        <div className="border-t px-5 py-4">
          <div className="rounded-xl border bg-background px-3 py-2">
            <p className="text-sm text-muted-foreground">
              Ask about confirmation, payment, or booking details...
            </p>
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" size="sm">
              Send
            </Button>
          </div>
        </div>
      </div>
    </GuideSnippetWrapper>
  );
}

function PendingReservationCard() {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-24 items-center justify-center rounded-lg bg-muted px-6">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium">Cebu Sports Hub</h3>
              <p className="text-sm text-muted-foreground">
                Court A • Banilad Road
              </p>
            </div>
            <KudosStatusBadge status="CREATED" size="sm" />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Mar 15, 2026</span>
            <span>3:00 PM - 4:00 PM</span>
            <span className="font-medium text-foreground">₱450</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function MockReservationsPending() {
  return (
    <GuideSnippetWrapper>
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="font-heading text-xl font-semibold">
            My Reservations
          </h3>
          <p className="text-sm text-muted-foreground">
            View and manage your venue bookings.
          </p>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold">Pending</h4>
            <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5">
              1
            </Badge>
          </div>
          <PendingReservationCard />
        </section>

        <Tabs defaultValue="upcoming" className="w-full gap-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Confirmed bookings will appear here.
            </div>
          </TabsContent>
          <TabsContent value="past" />
          <TabsContent value="cancelled" />
        </Tabs>
      </div>
    </GuideSnippetWrapper>
  );
}

function ConfirmedReservationCard() {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-24 items-center justify-center rounded-lg bg-success/10 px-6">
          <CheckCircle className="h-5 w-5 text-success" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium">Cebu Sports Hub</h3>
              <p className="text-sm text-muted-foreground">
                Court A • Banilad Road
              </p>
            </div>
            <KudosStatusBadge status="CONFIRMED" size="sm" />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Mar 15, 2026</span>
            <span>3:00 PM - 4:00 PM</span>
            <span className="font-medium text-foreground">₱450</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function MockReservationsConfirmed() {
  return (
    <GuideSnippetWrapper>
      <div className="space-y-6">
        <Alert className="border-success/20 bg-success/5 text-success [&>svg]:text-success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Reservation Confirmed</AlertTitle>
          <AlertDescription>
            Your booking is confirmed. See you at the venue.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="upcoming" className="w-full gap-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="upcoming">
              Upcoming
              <Badge variant="default" className="ml-2 h-5 min-w-[20px] px-1.5">
                1
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-4">
            <ConfirmedReservationCard />
          </TabsContent>
          <TabsContent value="past" />
          <TabsContent value="cancelled" />
        </Tabs>
      </div>
    </GuideSnippetWrapper>
  );
}

const PLAYER_GUIDE_SNIPPET_MAP: Record<string, React.ComponentType> = {
  "guest-slot-picker": MockGuestSlotPicker,
  "guest-auth-handoff": MockBookingLoginForm,
  "booking-review-summary": MockBookingReviewSummary,
  "booking-profile-gate": MockBookingProfileGate,
  "booking-terms-confirm": MockBookingTermsConfirm,
  "reservation-request": MockReservationRequested,
  "reservation-chat-owner": MockReservationChatOwner,
  "reservation-pending-list": MockReservationsPending,
  "reservation-confirmed-upcoming": MockReservationsConfirmed,
};

export function getPlayerGuideSnippetForSection(sectionId: string) {
  return PLAYER_GUIDE_SNIPPET_MAP[sectionId] ?? null;
}
