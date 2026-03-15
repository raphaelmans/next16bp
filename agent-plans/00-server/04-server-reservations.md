# Phase 3: Reservation System Modules

**Prerequisites:** Phase 2B (Time Slot Module) complete  
**Modules 3B and 3C can run in parallel after 3A is complete**

---

## Module 3A: Reservation Core Module

**Assigned to:** Agent 1  
**Complexity:** High  
**Dependencies:** Phase 1A (Profile), Phase 2B (Time Slot)

### Overview

Core reservation functionality for players to book time slots. Handles the complete reservation lifecycle including status transitions and audit logging.

### Directory Structure

```
src/modules/reservation/
├── reservation.router.ts
├── dtos/
│   ├── index.ts
│   ├── create-reservation.dto.ts
│   ├── mark-payment.dto.ts
│   └── cancel-reservation.dto.ts
├── errors/
│   └── reservation.errors.ts
├── factories/
│   └── reservation.factory.ts
├── repositories/
│   ├── reservation.repository.ts
│   └── reservation-event.repository.ts
├── services/
│   └── reservation.service.ts
└── use-cases/
    ├── create-free-reservation.use-case.ts
    └── create-paid-reservation.use-case.ts
```

### Database Schema Reference

```typescript
// reservation table
reservation: {
  id: uuid,
  timeSlotId: uuid (FK → time_slot),
  playerId: uuid (FK → profile),
  playerNameSnapshot: varchar(100),
  playerEmailSnapshot: varchar(255),
  playerPhoneSnapshot: varchar(20),
  status: enum('CREATED', 'AWAITING_PAYMENT', 'PAYMENT_MARKED_BY_USER', 'CONFIRMED', 'EXPIRED', 'CANCELLED'),
  expiresAt: timestamptz,
  termsAcceptedAt: timestamptz,
  confirmedAt: timestamptz,
  cancelledAt: timestamptz,
  cancellationReason: text,
  createdAt: timestamptz,
  updatedAt: timestamptz,
}

// reservation_event table (audit log)
reservationEvent: {
  id: uuid,
  reservationId: uuid (FK → reservation),
  fromStatus: varchar(30),
  toStatus: varchar(30),
  triggeredByUserId: uuid (FK → auth.users),
  triggeredByRole: enum('PLAYER', 'OWNER', 'SYSTEM'),
  notes: text,
  createdAt: timestamptz,
}
```

### State Machine

```
FREE COURT FLOW:
CREATED ──────────────────────────────────────► CONFIRMED
    │
    └──────────────────────────────────────────► CANCELLED

PAID COURT FLOW:
CREATED ──► AWAITING_PAYMENT ──► PAYMENT_MARKED_BY_USER ──► CONFIRMED
                   │
                   └──► EXPIRED
                   
Any state (except CONFIRMED/EXPIRED) ──► CANCELLED
```

### Repository Interfaces

#### Reservation Repository

```typescript
interface IReservationRepository {
  findById(id: string, ctx?: RequestContext): Promise<ReservationRecord | null>;
  findByIdForUpdate(id: string, ctx: RequestContext): Promise<ReservationRecord | null>;
  findByPlayerId(playerId: string, pagination: PaginationDTO): Promise<ReservationRecord[]>;
  findByTimeSlotId(timeSlotId: string): Promise<ReservationRecord | null>;
  findActiveByTimeSlotId(timeSlotId: string): Promise<ReservationRecord | null>;
  create(data: InsertReservation, ctx?: RequestContext): Promise<ReservationRecord>;
  update(id: string, data: Partial<InsertReservation>, ctx?: RequestContext): Promise<ReservationRecord>;
}
```

#### Reservation Event Repository

```typescript
interface IReservationEventRepository {
  findByReservationId(reservationId: string): Promise<ReservationEventRecord[]>;
  create(data: InsertReservationEvent, ctx?: RequestContext): Promise<ReservationEventRecord>;
}
```

### Service Interface

```typescript
interface IReservationService {
  // Player actions
  createReservation(userId: string, data: CreateReservationDTO): Promise<ReservationWithSlot>;
  markPayment(userId: string, reservationId: string, data: MarkPaymentDTO): Promise<ReservationRecord>;
  cancelReservation(userId: string, reservationId: string, reason?: string): Promise<ReservationRecord>;
  
  // Queries
  getReservationById(userId: string, reservationId: string): Promise<ReservationWithDetails>;
  getMyReservations(userId: string, filters: ReservationFiltersDTO): Promise<PaginatedResult<ReservationWithSlot>>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `reservation.create` | protected + rateLimited(sensitive) | `CreateReservationSchema` | Create reservation |
| `reservation.markPayment` | protected | `MarkPaymentSchema` | Mark as paid |
| `reservation.cancel` | protected | `CancelReservationSchema` | Cancel reservation |
| `reservation.getById` | protected | `{ id: string }` | Get reservation details |
| `reservation.getMy` | protected | `GetMyReservationsSchema` | List player's reservations |

### DTOs

#### CreateReservationSchema

```typescript
const CreateReservationSchema = z.object({
  timeSlotId: z.string().uuid(),
});
```

#### MarkPaymentSchema

```typescript
const MarkPaymentSchema = z.object({
  reservationId: z.string().uuid(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
});
```

#### CancelReservationSchema

```typescript
const CancelReservationSchema = z.object({
  reservationId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});
```

#### GetMyReservationsSchema

```typescript
const GetMyReservationsSchema = z.object({
  status: z.enum(["CONFIRMED", "AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER", "CANCELLED", "EXPIRED"]).optional(),
  upcoming: z.boolean().optional(), // Only future reservations
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});
```

### Response Types

```typescript
interface ReservationWithSlot {
  reservation: ReservationRecord;
  timeSlot: TimeSlotRecord;
  court: CourtRecord;
}

interface ReservationWithDetails extends ReservationWithSlot {
  organization: OrganizationRecord;
  paymentInfo?: {
    paymentInstructions?: string;
    gcashNumber?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  };
}
```

### Errors

| Error | HTTP | Description |
|-------|------|-------------|
| `ReservationNotFoundError` | 404 | Reservation doesn't exist |
| `SlotNotAvailableError` | 400 | Slot is not AVAILABLE |
| `ReservationExpiredError` | 400 | Payment window expired |
| `InvalidReservationStatusError` | 400 | Invalid status transition |
| `NotReservationOwnerError` | 403 | User doesn't own this reservation |
| `TermsNotAcceptedError` | 400 | Terms must be accepted |

### Use Case: CreatePaidReservationUseCase

```typescript
class CreatePaidReservationUseCase {
  private readonly TTL_MINUTES = 15;
  
  async execute(userId: string, timeSlotId: string): Promise<ReservationWithSlot> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };
      
      // 1. Get player profile (for snapshot)
      const profile = await this.profileService.getOrCreateProfile(userId);
      
      // 2. Lock and fetch time slot
      const slot = await this.timeSlotRepo.findByIdForUpdate(timeSlotId, ctx);
      if (!slot) {
        throw new SlotNotFoundError();
      }
      
      if (slot.status !== "AVAILABLE") {
        throw new SlotNotAvailableError();
      }
      
      // 3. Determine if free or paid
      const court = await this.courtRepo.findById(slot.courtId);
      const detail = await this.reservableDetailRepo.findByCourtId(slot.courtId);
      const isFree = detail?.isFree || slot.priceCents === null;
      
      // 4. Create reservation
      const expiresAt = isFree ? null : new Date(Date.now() + this.TTL_MINUTES * 60 * 1000);
      const status = isFree ? "CONFIRMED" : "AWAITING_PAYMENT";
      
      const reservation = await this.reservationRepo.create({
        timeSlotId,
        playerId: profile.id,
        playerNameSnapshot: profile.displayName,
        playerEmailSnapshot: profile.email,
        playerPhoneSnapshot: profile.phoneNumber,
        status,
        expiresAt,
        confirmedAt: isFree ? new Date() : null,
      }, ctx);
      
      // 5. Update slot status
      const newSlotStatus = isFree ? "BOOKED" : "HELD";
      await this.timeSlotRepo.update(slot.id, { status: newSlotStatus }, ctx);
      
      // 6. Create audit event
      await this.reservationEventRepo.create({
        reservationId: reservation.id,
        fromStatus: null,
        toStatus: status,
        triggeredByUserId: userId,
        triggeredByRole: "PLAYER",
      }, ctx);
      
      return {
        reservation,
        timeSlot: { ...slot, status: newSlotStatus },
        court,
      };
    });
  }
}
```

### Mark Payment Logic

```typescript
async markPayment(
  userId: string,
  reservationId: string,
  data: MarkPaymentDTO
): Promise<ReservationRecord> {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    // 1. Lock reservation
    const reservation = await this.reservationRepo.findByIdForUpdate(reservationId, ctx);
    if (!reservation) {
      throw new ReservationNotFoundError();
    }
    
    // 2. Verify ownership
    const profile = await this.profileRepo.findByUserId(userId);
    if (reservation.playerId !== profile?.id) {
      throw new NotReservationOwnerError();
    }
    
    // 3. Verify status
    if (reservation.status !== "AWAITING_PAYMENT") {
      throw new InvalidReservationStatusError(
        `Cannot mark payment for reservation in ${reservation.status} status`
      );
    }
    
    // 4. Check TTL
    if (reservation.expiresAt && new Date() > reservation.expiresAt) {
      throw new ReservationExpiredError();
    }
    
    // 5. Update reservation
    const updated = await this.reservationRepo.update(reservationId, {
      status: "PAYMENT_MARKED_BY_USER",
      termsAcceptedAt: new Date(),
    }, ctx);
    
    // 6. Create audit event
    await this.reservationEventRepo.create({
      reservationId,
      fromStatus: "AWAITING_PAYMENT",
      toStatus: "PAYMENT_MARKED_BY_USER",
      triggeredByUserId: userId,
      triggeredByRole: "PLAYER",
    }, ctx);
    
    return updated;
  });
}
```

### Testing Checklist

- [ ] Can create free court reservation (immediate confirmation)
- [ ] Can create paid court reservation (AWAITING_PAYMENT status)
- [ ] Slot becomes HELD for paid reservations
- [ ] Player snapshot captured correctly
- [ ] TTL set correctly (15 minutes)
- [ ] Can mark payment (status transition)
- [ ] Terms acceptance required
- [ ] Cannot mark payment after expiry
- [ ] Can cancel reservation
- [ ] Audit events created for all transitions
- [ ] Only reservation owner can perform actions

---

## Module 3B: Reservation Owner Module

**Assigned to:** Agent 2  
**Complexity:** Medium  
**Dependencies:** Module 3A (Reservation Core)  
**Can run parallel with:** Module 3C

### Overview

Court owner operations for managing reservations, including payment confirmation and rejection.

### Directory Structure

```
src/modules/reservation/
├── reservation-owner.router.ts       # New router
├── dtos/
│   ├── confirm-payment.dto.ts
│   └── reject-reservation.dto.ts
└── services/
    └── reservation-owner.service.ts  # New service
```

### Service Interface

```typescript
interface IReservationOwnerService {
  confirmPayment(userId: string, reservationId: string, notes?: string): Promise<ReservationRecord>;
  rejectReservation(userId: string, reservationId: string, reason: string): Promise<ReservationRecord>;
  getPendingForCourt(userId: string, courtId: string): Promise<ReservationWithPlayer[]>;
  getForOrganization(userId: string, orgId: string, filters: OwnerReservationFiltersDTO): Promise<PaginatedResult<ReservationWithPlayer>>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `reservationOwner.confirmPayment` | protected | `ConfirmPaymentSchema` | Confirm payment received |
| `reservationOwner.reject` | protected | `RejectReservationSchema` | Reject reservation |
| `reservationOwner.getPendingForCourt` | protected | `{ courtId: string }` | List pending confirmations |
| `reservationOwner.getForOrganization` | protected | `GetOrgReservationsSchema` | List all org reservations |

### DTOs

#### ConfirmPaymentSchema

```typescript
const ConfirmPaymentSchema = z.object({
  reservationId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});
```

#### RejectReservationSchema

```typescript
const RejectReservationSchema = z.object({
  reservationId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});
```

### Response Types

```typescript
interface ReservationWithPlayer extends ReservationWithSlot {
  player: {
    id: string;
    displayName?: string;
    email?: string;
    phoneNumber?: string;
  };
  paymentProof?: PaymentProofRecord;
}
```

### Business Logic

#### Confirm Payment

```typescript
async confirmPayment(
  userId: string,
  reservationId: string,
  notes?: string
): Promise<ReservationRecord> {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    // 1. Get reservation and verify ownership
    const reservation = await this.reservationRepo.findByIdForUpdate(reservationId, ctx);
    if (!reservation) {
      throw new ReservationNotFoundError();
    }
    
    // 2. Verify user owns the court's organization
    await this.verifyCourtOwnership(userId, reservation.timeSlotId);
    
    // 3. Verify status
    if (reservation.status !== "PAYMENT_MARKED_BY_USER") {
      throw new InvalidReservationStatusError(
        `Can only confirm reservations in PAYMENT_MARKED_BY_USER status`
      );
    }
    
    // 4. Update reservation
    const updated = await this.reservationRepo.update(reservationId, {
      status: "CONFIRMED",
      confirmedAt: new Date(),
    }, ctx);
    
    // 5. Update slot to BOOKED
    await this.timeSlotRepo.update(
      reservation.timeSlotId,
      { status: "BOOKED" },
      ctx
    );
    
    // 6. Create audit event
    await this.reservationEventRepo.create({
      reservationId,
      fromStatus: "PAYMENT_MARKED_BY_USER",
      toStatus: "CONFIRMED",
      triggeredByUserId: userId,
      triggeredByRole: "OWNER",
      notes,
    }, ctx);
    
    return updated;
  });
}
```

#### Reject Reservation

```typescript
async rejectReservation(
  userId: string,
  reservationId: string,
  reason: string
): Promise<ReservationRecord> {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    // 1. Get reservation and verify ownership
    const reservation = await this.reservationRepo.findByIdForUpdate(reservationId, ctx);
    if (!reservation) {
      throw new ReservationNotFoundError();
    }
    
    await this.verifyCourtOwnership(userId, reservation.timeSlotId);
    
    // 2. Verify status (can reject AWAITING_PAYMENT or PAYMENT_MARKED_BY_USER)
    const rejectableStatuses = ["AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"];
    if (!rejectableStatuses.includes(reservation.status)) {
      throw new InvalidReservationStatusError(
        `Cannot reject reservation in ${reservation.status} status`
      );
    }
    
    // 3. Update reservation
    const updated = await this.reservationRepo.update(reservationId, {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: reason,
    }, ctx);
    
    // 4. Release slot
    await this.timeSlotRepo.update(
      reservation.timeSlotId,
      { status: "AVAILABLE" },
      ctx
    );
    
    // 5. Create audit event
    await this.reservationEventRepo.create({
      reservationId,
      fromStatus: reservation.status,
      toStatus: "CANCELLED",
      triggeredByUserId: userId,
      triggeredByRole: "OWNER",
      notes: `Rejected: ${reason}`,
    }, ctx);
    
    return updated;
  });
}
```

### Testing Checklist

- [ ] Owner can confirm payment
- [ ] Only owner can confirm (authorization)
- [ ] Slot becomes BOOKED after confirmation
- [ ] Owner can reject reservation
- [ ] Slot released after rejection
- [ ] Audit events created
- [ ] Can list pending reservations for court
- [ ] Can list all reservations for organization

---

## Module 3C: Payment Proof Module

**Assigned to:** Agent 3  
**Complexity:** Low  
**Dependencies:** Module 3A (Reservation Core)  
**Can run parallel with:** Module 3B

### Overview

Optional payment proof upload for players to provide evidence of payment.

### Directory Structure

```
src/modules/payment-proof/
├── payment-proof.router.ts
├── dtos/
│   ├── index.ts
│   ├── add-payment-proof.dto.ts
│   └── update-payment-proof.dto.ts
├── errors/
│   └── payment-proof.errors.ts
├── factories/
│   └── payment-proof.factory.ts
├── repositories/
│   └── payment-proof.repository.ts
└── services/
    └── payment-proof.service.ts
```

### Database Schema Reference

```typescript
// payment_proof table
paymentProof: {
  id: uuid,
  reservationId: uuid (FK → reservation, unique),
  fileUrl: text,
  referenceNumber: varchar(100),
  notes: text,
  createdAt: timestamptz,
}
```

### Repository Interface

```typescript
interface IPaymentProofRepository {
  findByReservationId(reservationId: string): Promise<PaymentProofRecord | null>;
  create(data: InsertPaymentProof, ctx?: RequestContext): Promise<PaymentProofRecord>;
  update(id: string, data: Partial<InsertPaymentProof>, ctx?: RequestContext): Promise<PaymentProofRecord>;
}
```

### Service Interface

```typescript
interface IPaymentProofService {
  addPaymentProof(userId: string, data: AddPaymentProofDTO): Promise<PaymentProofRecord>;
  updatePaymentProof(userId: string, data: UpdatePaymentProofDTO): Promise<PaymentProofRecord>;
  getPaymentProof(userId: string, reservationId: string): Promise<PaymentProofRecord | null>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `paymentProof.add` | protected | `AddPaymentProofSchema` | Add proof |
| `paymentProof.update` | protected | `UpdatePaymentProofSchema` | Update proof |
| `paymentProof.get` | protected | `{ reservationId: string }` | Get proof |

### DTOs

#### AddPaymentProofSchema

```typescript
const AddPaymentProofSchema = z.object({
  reservationId: z.string().uuid(),
  fileUrl: z.string().url().optional(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.fileUrl || data.referenceNumber,
  { message: "Either fileUrl or referenceNumber is required" }
);
```

#### UpdatePaymentProofSchema

```typescript
const UpdatePaymentProofSchema = z.object({
  reservationId: z.string().uuid(),
  fileUrl: z.string().url().optional(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});
```

### Errors

| Error | HTTP | Description |
|-------|------|-------------|
| `PaymentProofAlreadyExistsError` | 409 | Proof already exists for reservation |
| `PaymentProofNotFoundError` | 404 | No proof exists for reservation |

### Business Logic

```typescript
async addPaymentProof(
  userId: string,
  data: AddPaymentProofDTO
): Promise<PaymentProofRecord> {
  // 1. Verify reservation exists and user owns it
  const reservation = await this.reservationRepo.findById(data.reservationId);
  if (!reservation) {
    throw new ReservationNotFoundError();
  }
  
  const profile = await this.profileRepo.findByUserId(userId);
  if (reservation.playerId !== profile?.id) {
    throw new NotReservationOwnerError();
  }
  
  // 2. Check if proof already exists
  const existing = await this.paymentProofRepo.findByReservationId(data.reservationId);
  if (existing) {
    throw new PaymentProofAlreadyExistsError();
  }
  
  // 3. Verify reservation status allows adding proof
  const allowedStatuses = ["AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"];
  if (!allowedStatuses.includes(reservation.status)) {
    throw new InvalidReservationStatusError(
      `Cannot add payment proof for reservation in ${reservation.status} status`
    );
  }
  
  // 4. Create proof
  return this.paymentProofRepo.create({
    reservationId: data.reservationId,
    fileUrl: data.fileUrl,
    referenceNumber: data.referenceNumber,
    notes: data.notes,
  });
}
```

### Testing Checklist

- [ ] Can add payment proof with URL
- [ ] Can add payment proof with reference number
- [ ] Requires at least one of URL or reference
- [ ] Cannot add duplicate proof
- [ ] Only reservation owner can add
- [ ] Can update existing proof
- [ ] Can retrieve proof

---

## Deferred Items (Phase 3)

| Item | Description | Reason |
|------|-------------|--------|
| TTL Expiration Job | Background job to expire stale reservations | Deferred - implement separately |
| File Upload | Actual file upload for payment proof | Deferred - accept URLs for now |

---

## Completion Criteria (Phase 3)

- [ ] All three modules complete and tested
- [ ] Full reservation lifecycle works (create → mark payment → confirm)
- [ ] Free court flow works (immediate confirmation)
- [ ] Owner can confirm/reject reservations
- [ ] Payment proof optional functionality works
- [ ] All audit events logged correctly
- [ ] Authorization working correctly
