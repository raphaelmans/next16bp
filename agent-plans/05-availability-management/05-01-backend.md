# Phase 1: Backend Enhancement

**Module ID:** 1A  
**Estimated Time:** 2 hours  
**Dependencies:** None

---

## Objective

Add a new `timeSlot.getForCourt` endpoint that returns ALL slots for a court (regardless of status) with player information for HELD/BOOKED slots.

---

## Implementation Steps

### Step 1: Create DTO

**File:** `src/modules/time-slot/dtos/get-slots-for-court.dto.ts`

```typescript
import { z } from "zod";

export const GetSlotsForCourtSchema = z.object({
  courtId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type GetSlotsForCourtDTO = z.infer<typeof GetSlotsForCourtSchema>;
```

### Step 2: Update DTO Index

**File:** `src/modules/time-slot/dtos/index.ts`

Add export:
```typescript
export * from "./get-slots-for-court.dto";
```

### Step 3: Add Repository Method

**File:** `src/modules/time-slot/repositories/time-slot.repository.ts`

Add interface method:
```typescript
findByCourtWithReservation(
  courtId: string,
  startDate: Date,
  endDate: Date,
  ctx?: RequestContext,
): Promise<TimeSlotWithPlayerInfo[]>;
```

Add implementation:
```typescript
async findByCourtWithReservation(
  courtId: string,
  startDate: Date,
  endDate: Date,
  ctx?: RequestContext,
): Promise<TimeSlotWithPlayerInfo[]> {
  const client = this.getClient(ctx);

  // Left join with reservation to get player info for HELD/BOOKED slots
  const result = await client
    .select({
      id: timeSlot.id,
      courtId: timeSlot.courtId,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      status: timeSlot.status,
      priceCents: timeSlot.priceCents,
      currency: timeSlot.currency,
      createdAt: timeSlot.createdAt,
      updatedAt: timeSlot.updatedAt,
      // Player info from reservation
      playerName: reservation.playerNameSnapshot,
      playerPhone: reservation.playerPhoneSnapshot,
    })
    .from(timeSlot)
    .leftJoin(reservation, eq(reservation.timeSlotId, timeSlot.id))
    .where(
      and(
        eq(timeSlot.courtId, courtId),
        gte(timeSlot.startTime, startDate),
        lte(timeSlot.endTime, endDate),
      ),
    )
    .orderBy(timeSlot.startTime);

  return result;
}
```

**Note:** Need to add import for `reservation` table and types.

### Step 4: Add Service Method

**File:** `src/modules/time-slot/services/time-slot.service.ts`

Add interface method:
```typescript
getSlotsForCourt(
  userId: string,
  data: GetSlotsForCourtDTO,
): Promise<TimeSlotWithPlayerInfo[]>;
```

Add implementation:
```typescript
async getSlotsForCourt(
  userId: string,
  data: GetSlotsForCourtDTO,
): Promise<TimeSlotWithPlayerInfo[]> {
  // Verify ownership
  await this.verifyCourtOwnership(userId, data.courtId);

  return this.timeSlotRepository.findByCourtWithReservation(
    data.courtId,
    new Date(data.startDate),
    new Date(data.endDate),
  );
}
```

### Step 5: Add Router Procedure

**File:** `src/modules/time-slot/time-slot.router.ts`

Add import:
```typescript
import { GetSlotsForCourtSchema } from "./dtos";
```

Add procedure:
```typescript
/**
 * Get all time slots for a court (owner only)
 * Includes player info for HELD/BOOKED slots
 */
getForCourt: protectedProcedure
  .input(GetSlotsForCourtSchema)
  .query(async ({ input, ctx }) => {
    try {
      const service = makeTimeSlotService();
      return await service.getSlotsForCourt(ctx.userId, input);
    } catch (error) {
      handleTimeSlotError(error);
    }
  }),
```

### Step 6: Add TypeScript Types

**File:** `src/modules/time-slot/types/index.ts` (create if needed)

```typescript
import type { TimeSlotRecord } from "@/shared/infra/db/schema";

export interface TimeSlotWithPlayerInfo extends TimeSlotRecord {
  playerName?: string | null;
  playerPhone?: string | null;
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/modules/time-slot/dtos/get-slots-for-court.dto.ts` | Create |
| `src/modules/time-slot/dtos/index.ts` | Modify (add export) |
| `src/modules/time-slot/repositories/time-slot.repository.ts` | Modify (add method) |
| `src/modules/time-slot/services/time-slot.service.ts` | Modify (add method) |
| `src/modules/time-slot/time-slot.router.ts` | Modify (add procedure) |
| `src/modules/time-slot/types/index.ts` | Create (optional) |

---

## Database Considerations

The query joins `time_slot` with `reservation`:

```sql
SELECT 
  ts.*,
  r.player_name_snapshot as player_name,
  r.player_phone_snapshot as player_phone
FROM time_slot ts
LEFT JOIN reservation r ON r.time_slot_id = ts.id
WHERE ts.court_id = $1
  AND ts.start_time >= $2
  AND ts.end_time <= $3
ORDER BY ts.start_time
```

**Important:** A slot can have multiple reservations (if previous expired), but only one active. May need to filter by non-expired reservations.

Consider adding condition:
```sql
AND (r.id IS NULL OR r.status NOT IN ('EXPIRED', 'CANCELLED'))
```

---

## Testing

### Unit Tests (Optional)

```typescript
describe("TimeSlotService.getSlotsForCourt", () => {
  it("should return all slots for owner's court", async () => {
    // Setup: owner, org, court, slots
    // Call: service.getSlotsForCourt(ownerId, { courtId, startDate, endDate })
    // Assert: returns all slots regardless of status
  });

  it("should include player info for HELD/BOOKED slots", async () => {
    // Setup: slot with reservation
    // Assert: playerName and playerPhone populated
  });

  it("should reject non-owner", async () => {
    // Setup: court owned by different org
    // Assert: throws NotCourtOwnerError
  });
});
```

### Manual Testing

1. Create a court with multiple slots (various statuses)
2. Create a reservation for one slot
3. Call `getForCourt` endpoint
4. Verify:
   - All slots returned
   - AVAILABLE slots have no player info
   - HELD/BOOKED slots have player info
   - BLOCKED slots have no player info

---

## Checklist

- [ ] DTO created with Zod schema
- [ ] DTO exported from index
- [ ] Repository method added with join
- [ ] Service method added with ownership check
- [ ] Router procedure added
- [ ] TypeScript types defined
- [ ] Handles multiple reservations per slot correctly
- [ ] Error handling in place
- [ ] Build passes (`pnpm build`)
- [ ] Type generation works (`pnpm db:generate-types`)
