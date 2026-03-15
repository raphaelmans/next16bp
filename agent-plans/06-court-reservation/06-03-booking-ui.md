# Phase 3: Booking Flow UI

**Module IDs:** 3A, 3B  
**Estimated Time:** 3 hours  
**Dependencies:** Phase 2 (Frontend Hooks)

---

## Objective

Implement the player booking flow from court discovery to reservation confirmation.

---

## Module 3A: Court Detail Slots Display

### File: `src/app/(public)/courts/[id]/page.tsx`

### Required Components

1. **Available Slots Section** - Display time slots for selected date
2. **Date Picker** - Navigate between dates
3. **Slot Cards** - Clickable slots with pricing

### Slots Display Implementation

```tsx
// Fetch available slots
const { data: slots, isLoading } = useQuery({
  ...trpc.timeSlot.getAvailable.queryOptions({
    courtId,
    startDate: startOfDay(selectedDate).toISOString(),
    endDate: endOfDay(selectedDate).toISOString(),
  }),
});

// Render slots grid
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
  {slots?.map((slot) => (
    <SlotCard
      key={slot.id}
      slot={slot}
      onClick={() => handleSlotSelect(slot)}
    />
  ))}
</div>
```

### Slot Card Component

Per Design System Section 5.4:

```tsx
interface SlotCardProps {
  slot: {
    id: string;
    startTime: string;
    endTime: string;
    priceCents: number | null;
    currency: string | null;
  };
  onClick: () => void;
  selected?: boolean;
}

function SlotCard({ slot, onClick, selected }: SlotCardProps) {
  const isFree = !slot.priceCents;
  const formattedTime = format(new Date(slot.startTime), "h:mm a");
  const price = slot.priceCents 
    ? `₱${(slot.priceCents / 100).toFixed(0)}`
    : "Free";

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border transition-all cursor-pointer",
        "hover:border-primary hover:bg-primary-light/50",
        selected && "border-primary bg-primary-light",
        isFree 
          ? "bg-[#ECFDF5] border-transparent"
          : "bg-[#CCFBF1] border-transparent"
      )}
    >
      <div className="font-heading font-semibold text-lg">
        {formattedTime}
      </div>
      <div className={cn(
        "text-sm font-heading font-bold mt-1",
        isFree ? "text-[#059669]" : "text-[#0F766E]"
      )}>
        {price}
      </div>
    </button>
  );
}
```

### Date Navigation

```tsx
<div className="flex items-center gap-4 mb-6">
  <Button
    variant="outline"
    size="icon"
    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
    disabled={isBefore(selectedDate, new Date())}
  >
    <ChevronLeft className="h-4 w-4" />
  </Button>
  
  <div className="font-heading font-semibold">
    {format(selectedDate, "EEEE, MMMM d")}
  </div>
  
  <Button
    variant="outline"
    size="icon"
    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
  >
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```

### Empty State

```tsx
{slots?.length === 0 && !isLoading && (
  <div className="text-center py-12 bg-muted/30 rounded-lg">
    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
    <p className="text-muted-foreground">
      No available slots for this date
    </p>
    <p className="text-sm text-muted-foreground mt-2">
      Try selecting a different date
    </p>
  </div>
)}
```

### Navigation to Booking

```typescript
const router = useRouter();
const { data: session } = useSession();

function handleSlotSelect(slot: TimeSlot) {
  if (!session) {
    // Redirect to login with return URL
    router.push(`/login?redirect=/courts/${courtId}/book/${slot.id}`);
    return;
  }
  
  // Navigate to booking confirmation
  router.push(`/courts/${courtId}/book/${slot.id}`);
}
```

---

## Module 3B: Booking Confirmation Page

### File: `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx`

### Page Structure

```tsx
export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const courtId = params.id as string;
  const slotId = params.slotId as string;

  // Fetch court and slot data
  const { data: court } = useQuery(/* court query */);
  const { data: slot } = useQuery({
    ...trpc.timeSlot.getById.queryOptions({ slotId }),
  });

  const createReservation = useCreateReservation();

  const handleReserve = () => {
    createReservation.mutate(
      { timeSlotId: slotId },
      {
        onSuccess: (data) => {
          if (data.status === "AWAITING_PAYMENT") {
            router.push(`/reservations/${data.id}/payment`);
          } else {
            router.push(`/reservations/${data.id}`);
          }
        },
      }
    );
  };

  const isFree = !slot?.priceCents;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="-ml-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-heading font-bold">
          Confirm Your Reservation
        </h1>
      </div>

      {/* Booking Details Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-heading font-semibold text-lg mb-4">
            {court?.name}
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {format(new Date(slot?.startTime || ""), "EEEE, MMMM d, yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">
                {format(new Date(slot?.startTime || ""), "h:mm a")} - 
                {format(new Date(slot?.endTime || ""), "h:mm a")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className={cn(
                "font-heading font-bold",
                isFree ? "text-[#059669]" : "text-[#0F766E]"
              )}>
                {isFree ? "Free" : `₱${(slot?.priceCents || 0) / 100}`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Notice for Paid */}
      {!isFree && (
        <div className="bg-[#FFFBEB] border border-[#D97706]/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-[#D97706]">
            <strong>Note:</strong> This is a paid reservation. After reserving,
            you'll need to pay the court owner directly and mark your payment
            as complete.
          </p>
        </div>
      )}

      {/* Reserve Button */}
      <Button
        onClick={handleReserve}
        disabled={createReservation.isPending}
        className="w-full"
        size="lg"
      >
        {createReservation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Reserving...
          </>
        ) : (
          isFree ? "Reserve Now" : "Reserve & Continue to Payment"
        )}
      </Button>

      {/* Terms Notice */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        By reserving, you agree to our{" "}
        <Link href="/terms" className="text-accent hover:underline">
          Terms of Service
        </Link>
      </p>
    </div>
  );
}
```

---

## UI/UX Specifications

### Colors (per Design System)

| Element | Color |
|---------|-------|
| Free slot background | `#ECFDF5` |
| Free slot text | `#059669` |
| Paid slot background | `#CCFBF1` |
| Paid slot text | `#0F766E` |
| Selected border | `#0D9488` (primary) |
| Warning notice | `#FFFBEB` bg, `#D97706` text |

### Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Page title | Outfit | 700 | 2rem |
| Slot time | Outfit | 600 | 1.125rem |
| Price | Outfit | 700 | - |
| Body text | Source Sans 3 | 400 | 1rem |
| Muted text | Source Sans 3 | 400 | 0.875rem |

### Spacing

| Element | Value |
|---------|-------|
| Page padding | 24px |
| Card padding | 24px (`p-6`) |
| Slot grid gap | 12px (`gap-3`) |
| Section margin | 24px (`mb-6`) |

### Interactions

- Slot cards: `hover:border-primary`, `cursor-pointer`
- Buttons: Standard hover states from design system
- Loading: Disable button, show spinner

---

## Authentication Flow

```typescript
// Check auth before booking
const { data: session, status } = useSession();

// If not authenticated, redirect to login
if (status === "unauthenticated") {
  const returnUrl = `/courts/${courtId}/book/${slotId}`;
  router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
}

// If loading, show skeleton
if (status === "loading") {
  return <BookingPageSkeleton />;
}
```

---

## Profile Check

```typescript
// Check profile completeness before allowing booking
const { data: profile } = useQuery(/* profile query */);

const isProfileComplete = useMemo(() => {
  if (!profile) return false;
  return profile.displayName && (profile.email || profile.phone);
}, [profile]);

// Show prompt if incomplete
{!isProfileComplete && (
  <Alert variant="destructive" className="mb-6">
    <AlertDescription>
      Please complete your profile before booking.
      <Link href="/account/profile" className="underline ml-1">
        Update profile
      </Link>
    </AlertDescription>
  </Alert>
)}

// Disable reserve button if profile incomplete
<Button disabled={!isProfileComplete || createReservation.isPending}>
  ...
</Button>
```

---

## Error Handling

```typescript
// Slot not found
if (!slot && !slotLoading) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">
        This slot is no longer available.
      </p>
      <Button asChild>
        <Link href={`/courts/${courtId}`}>
          View Other Slots
        </Link>
      </Button>
    </div>
  );
}

// Slot already booked (race condition)
createReservation.mutate(
  { timeSlotId: slotId },
  {
    onError: (error) => {
      if (error.message.includes("not available")) {
        toast.error("This slot was just booked. Please try another.");
        router.push(`/courts/${courtId}`);
      }
    },
  }
);
```

---

## Testing Checklist

### Module 3A (Court Detail)
- [ ] Available slots load for selected date
- [ ] Free slots show "Free" badge
- [ ] Paid slots show price badge
- [ ] Date navigation works
- [ ] Empty state shows when no slots
- [ ] Click slot navigates to booking page
- [ ] Unauthenticated user redirected to login

### Module 3B (Booking Page)
- [ ] Court and slot details display
- [ ] Free flow: Reserve → Confirmation
- [ ] Paid flow: Reserve → Payment page
- [ ] Loading state during reservation
- [ ] Error handling for unavailable slot
- [ ] Back button works
- [ ] Profile check works

### Visual
- [ ] Colors match design system
- [ ] Typography correct
- [ ] Spacing appropriate
- [ ] Mobile responsive
- [ ] Loading states visible
