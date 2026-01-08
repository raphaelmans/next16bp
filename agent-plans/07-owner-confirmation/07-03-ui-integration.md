# Phase 3: UI Integration

**Dependencies:** Phase 2 (Frontend Hooks) complete  
**Parallelizable:** Yes (3A, 3B, 3C can be done in parallel)  
**User Stories:** US-07-01, US-07-02

---

## Objective

Polish the owner reservations page to display real data correctly, apply design system styling, and improve empty states.

---

## Current State

**File:** `src/app/(owner)/owner/reservations/page.tsx`

The page exists and is functional but displays placeholder data from the hook. After Phase 2, real data will flow through - this phase ensures proper display and styling.

### Current Components

| Component | File | Status |
|-----------|------|--------|
| Page | `src/app/(owner)/owner/reservations/page.tsx` | Needs polish |
| ReservationsTable | `src/features/owner/components/reservations-table.tsx` | Needs design review |
| ConfirmDialog | `src/features/owner/components/confirm-dialog.tsx` | Functional |
| RejectModal | `src/features/owner/components/reject-modal.tsx` | Functional |

---

## Module 3A: Reservations Table Polish

### Target Layout (from User Story)

```
+-----------------------------------------------------------------------------+
| Reservations                                         [Filter: Pending v]    |
+-----------------------------------------------------------------------------+
|                                                                             |
| +-------------------------------------------------------------------------+ |
| | [Pending]  Juan Dela Cruz                             Jan 10, 2:00 PM   | |
| |            Court A * 0917-123-4567                    P200              | |
| |            juan@email.com                                               | |
| |                                                    [Confirm] [Reject]   | |
| +-------------------------------------------------------------------------+ |
|                                                                             |
| +-------------------------------------------------------------------------+ |
| | [Pending]  Maria Santos                              Jan 10, 4:00 PM    | |
| |            Court B * 0918-456-7890                    P300              | |
| |            maria@email.com                                              | |
| |                                                    [Confirm] [Reject]   | |
| +-------------------------------------------------------------------------+ |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Design System Application

| Element | Token | Value |
|---------|-------|-------|
| Status badge (Pending) | `warning-light` / `warning` | `#FFFBEB` / `#D97706` |
| Status badge (Confirmed) | `success-light` / `success` | `#ECFDF5` / `#059669` |
| Status badge (Cancelled) | `destructive-light` / `destructive` | `#FEE2E2` / `#B91C1C` |
| Confirm button | `primary` | `#0D9488` (teal) |
| Reject button | `destructive` | `#DC2626` (red) |
| Player name | `font-heading` | Outfit 600 |
| Details text | `font-body` | Source Sans 3 400 |
| Amount | `font-heading` | Outfit 700 |

### Price Formatting

Add utility for Philippine Peso formatting:

```typescript
function formatPrice(amountCents: number, currency: string = "PHP"): string {
  if (amountCents === 0) return "Free";
  const amount = amountCents / 100;
  if (currency === "PHP") {
    return `₱${amount.toLocaleString()}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}
```

### Reservation Card Component

```tsx
<div className="rounded-xl border bg-card p-4 space-y-3">
  {/* Header row */}
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-3">
      <Badge 
        variant={getStatusVariant(reservation.status)}
        className="font-heading text-xs uppercase"
      >
        {reservation.status}
      </Badge>
      <span className="font-heading font-semibold text-foreground">
        {reservation.playerName}
      </span>
    </div>
    <div className="text-right">
      <div className="text-sm text-muted-foreground">
        {format(new Date(reservation.date), "MMM d")}
      </div>
      <div className="font-heading font-medium">
        {reservation.startTime}
      </div>
    </div>
  </div>

  {/* Details row */}
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <span className="font-medium text-foreground">
      {reservation.courtName}
    </span>
    <span>*</span>
    <span>{reservation.playerPhone}</span>
  </div>
  <div className="text-sm text-muted-foreground">
    {reservation.playerEmail}
  </div>

  {/* Footer row */}
  <div className="flex items-center justify-between pt-2 border-t">
    <span className="font-heading font-bold text-lg">
      {formatPrice(reservation.amountCents, reservation.currency)}
    </span>
    
    {reservation.status === "pending" && (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReject(reservation.id)}
          disabled={isLoading}
          className="text-destructive border-destructive hover:bg-destructive/10"
        >
          Reject
        </Button>
        <Button
          size="sm"
          onClick={() => onConfirm(reservation.id)}
          disabled={isLoading}
        >
          Confirm
        </Button>
      </div>
    )}
  </div>
</div>
```

---

## Module 3B: Status Badge Styling

### Badge Variants

Ensure badge component supports these variants:

```tsx
// In reservations-table.tsx or a shared utility
function getStatusVariant(status: ReservationStatus): string {
  switch (status) {
    case "pending":
      return "warning";
    case "confirmed":
      return "success";
    case "cancelled":
      return "destructive";
    case "completed":
      return "secondary";
    default:
      return "secondary";
  }
}

function getStatusLabel(status: ReservationStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}
```

### Badge CSS (if needed in globals.css)

```css
/* Status badge variants */
.badge-warning {
  background-color: var(--warning-light);
  color: var(--warning);
}

.badge-success {
  background-color: var(--success-light);
  color: var(--success);
}

.badge-destructive {
  background-color: var(--destructive-light);
  color: var(--destructive);
}
```

---

## Module 3C: Empty States

### Empty State Variations

| Scenario | Message | Icon |
|----------|---------|------|
| No reservations at all | "No reservations yet" | Calendar |
| No pending reservations | "No pending reservations. All caught up!" | CheckCircle |
| No upcoming reservations | "No upcoming reservations" | Calendar |
| No past reservations | "No past reservations" | Clock |
| No cancelled reservations | "No cancelled reservations" | XCircle |

### Empty State Component

```tsx
interface EmptyStateProps {
  type: "all" | "pending" | "upcoming" | "past" | "cancelled";
}

function ReservationsEmptyState({ type }: EmptyStateProps) {
  const config = {
    all: {
      icon: Calendar,
      title: "No reservations yet",
      description: "When players book your courts, reservations will appear here.",
    },
    pending: {
      icon: CheckCircle,
      title: "No pending reservations",
      description: "All caught up! No reservations need your attention right now.",
    },
    upcoming: {
      icon: Calendar,
      title: "No upcoming reservations",
      description: "No confirmed bookings scheduled for the future.",
    },
    past: {
      icon: Clock,
      title: "No past reservations",
      description: "Completed bookings will appear here.",
    },
    cancelled: {
      icon: XCircle,
      title: "No cancelled reservations",
      description: "Cancelled or rejected bookings will appear here.",
    },
  };

  const { icon: Icon, title, description } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{description}</p>
    </div>
  );
}
```

### Update Page to Use Empty State

```tsx
{filteredReservations.length === 0 ? (
  <ReservationsEmptyState type={activeTab} />
) : (
  <ReservationsTable
    reservations={filteredReservations}
    onConfirm={handleConfirmClick}
    onReject={handleRejectClick}
    isLoading={confirmMutation.isPending || rejectMutation.isPending}
  />
)}
```

---

## Confirm/Reject Dialog Updates

### Confirm Dialog

Display enriched data:

```tsx
<ConfirmDialog
  open={confirmDialogOpen}
  onOpenChange={setConfirmDialogOpen}
  onConfirm={handleConfirm}
  isLoading={confirmMutation.isPending}
  playerName={selectedReservation?.playerName}
  courtName={selectedReservation?.courtName}
  dateTime={
    selectedReservation
      ? `${format(new Date(selectedReservation.date), "MMMM d, yyyy")} at ${selectedReservation.startTime} - ${selectedReservation.endTime}`
      : undefined
  }
  amount={
    selectedReservation
      ? formatPrice(selectedReservation.amountCents, selectedReservation.currency)
      : undefined
  }
/>
```

### Reject Modal

Ensure rejection reason is required:

```tsx
// In RejectModal component
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="font-heading">Reject Reservation</DialogTitle>
      <DialogDescription>
        This will cancel {playerName}'s booking for {courtName}.
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reason">Rejection Reason</Label>
        <Textarea
          id="reason"
          placeholder="e.g., Payment not received"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        {!reason && submitted && (
          <p className="text-sm text-destructive">
            Please provide a reason for rejection
          </p>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        This will cancel the reservation and release the slot for other bookings.
      </p>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
      <Button 
        variant="destructive" 
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? "Rejecting..." : "Reject Reservation"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Testing Checklist

### Visual Checks

- [ ] Court name displays correctly (not "Court")
- [ ] Time displays formatted (e.g., "2:00 PM", not "--:--")
- [ ] Amount displays formatted (e.g., "₱200", not "0")
- [ ] Date displays formatted (e.g., "Jan 10")
- [ ] Status badges have correct colors
- [ ] Pending = amber/warning
- [ ] Confirmed = green/success
- [ ] Cancelled = red/destructive
- [ ] Buttons styled per design system
- [ ] Confirm = teal primary
- [ ] Reject = red outline

### Functional Checks

- [ ] Filter by status works
- [ ] Filter by court works
- [ ] Search by name/email/phone works
- [ ] Search by court name works
- [ ] Confirm action shows dialog
- [ ] Confirm action succeeds with toast
- [ ] Reject action shows modal
- [ ] Reject requires reason
- [ ] Reject action succeeds with toast
- [ ] List refreshes after action
- [ ] Pending count updates

### Empty States

- [ ] Empty state for "all" tab
- [ ] Empty state for "pending" tab
- [ ] Empty state for "upcoming" tab
- [ ] Empty state for "past" tab
- [ ] Empty state for "cancelled" tab

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/(owner)/owner/reservations/page.tsx` | Update to use contextual empty states |
| `src/features/owner/components/reservations-table.tsx` | Apply design system, add price formatting |
| `src/features/owner/components/confirm-dialog.tsx` | Display enriched data |
| `src/features/owner/components/reject-modal.tsx` | Ensure reason required |

---

## Handoff Notes

After completing Phase 3:
1. Run `npm run build` to verify no errors
2. Test complete flow:
   - View reservations list
   - Confirm a pending reservation
   - Reject a pending reservation
   - Verify empty states
3. Update `agent-plans/07-owner-confirmation/07-00-overview.md` to mark success criteria complete
