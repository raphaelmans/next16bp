# Phase 2: Court Management Modules

**Prerequisites:** Phase 1 (1B Organization, 1C Court Discovery) complete

---

## Module 2A: Court Management Module

**Assigned to:** Agent 1  
**Complexity:** Medium  
**Dependencies:** Phase 1B (Organization), Phase 1C (Court Discovery)  
**Prerequisite for:** Module 2B (Time Slots)

### Overview

Owner-facing operations for creating and managing courts, photos, and amenities.

### Directory Structure

```
src/modules/court/
├── court.router.ts                    # Extend with management endpoints
├── court-management.router.ts         # Or separate router
├── dtos/
│   ├── create-court.dto.ts
│   ├── update-court.dto.ts
│   ├── add-photo.dto.ts
│   └── add-amenity.dto.ts
├── errors/
│   └── court.errors.ts               # Extend with new errors
├── factories/
│   └── court.factory.ts              # Extend
├── repositories/
│   ├── court.repository.ts           # Add write methods
│   ├── court-photo.repository.ts
│   └── court-amenity.repository.ts
├── services/
│   ├── court-discovery.service.ts    # From Phase 1
│   └── court-management.service.ts   # New
└── use-cases/
    └── create-reservable-court.use-case.ts
```

### Repository Interfaces

#### Court Repository (Extended)

```typescript
interface ICourtRepository {
  // ... existing read methods from Phase 1
  
  // Write methods
  create(data: InsertCourt, ctx?: RequestContext): Promise<CourtRecord>;
  update(id: string, data: Partial<InsertCourt>, ctx?: RequestContext): Promise<CourtRecord>;
  findByOrganizationId(orgId: string): Promise<CourtRecord[]>;
}
```

#### Court Photo Repository

```typescript
interface ICourtPhotoRepository {
  findByCourtId(courtId: string): Promise<CourtPhotoRecord[]>;
  create(data: InsertCourtPhoto, ctx?: RequestContext): Promise<CourtPhotoRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
  updateDisplayOrder(id: string, order: number, ctx?: RequestContext): Promise<void>;
  countByCourtId(courtId: string): Promise<number>;
}
```

#### Court Amenity Repository

```typescript
interface ICourtAmenityRepository {
  findByCourtId(courtId: string): Promise<CourtAmenityRecord[]>;
  create(data: InsertCourtAmenity, ctx?: RequestContext): Promise<CourtAmenityRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
  exists(courtId: string, name: string): Promise<boolean>;
}
```

#### Curated/Reservable Detail Repositories

```typescript
interface ICuratedCourtDetailRepository {
  findByCourtId(courtId: string): Promise<CuratedCourtDetailRecord | null>;
  create(data: InsertCuratedCourtDetail, ctx?: RequestContext): Promise<CuratedCourtDetailRecord>;
  update(id: string, data: Partial<InsertCuratedCourtDetail>, ctx?: RequestContext): Promise<CuratedCourtDetailRecord>;
  delete(courtId: string, ctx?: RequestContext): Promise<void>;
}

interface IReservableCourtDetailRepository {
  findByCourtId(courtId: string): Promise<ReservableCourtDetailRecord | null>;
  create(data: InsertReservableCourtDetail, ctx?: RequestContext): Promise<ReservableCourtDetailRecord>;
  update(id: string, data: Partial<InsertReservableCourtDetail>, ctx?: RequestContext): Promise<ReservableCourtDetailRecord>;
}
```

### Service Interface

```typescript
interface ICourtManagementService {
  // Court CRUD
  createCourt(userId: string, data: CreateCourtDTO): Promise<CourtWithDetails>;
  updateCourt(userId: string, courtId: string, data: UpdateCourtDTO): Promise<CourtRecord>;
  deactivateCourt(userId: string, courtId: string): Promise<void>;
  getCourtsByOrganization(userId: string, orgId: string): Promise<CourtRecord[]>;
  
  // Photos
  addPhoto(userId: string, courtId: string, data: AddPhotoDTO): Promise<CourtPhotoRecord>;
  removePhoto(userId: string, courtId: string, photoId: string): Promise<void>;
  reorderPhotos(userId: string, courtId: string, photoIds: string[]): Promise<void>;
  
  // Amenities
  addAmenity(userId: string, courtId: string, data: AddAmenityDTO): Promise<CourtAmenityRecord>;
  removeAmenity(userId: string, courtId: string, amenityId: string): Promise<void>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `courtManagement.create` | protected + rateLimited(mutation) | `CreateCourtSchema` | Create court |
| `courtManagement.update` | protected | `UpdateCourtSchema` | Update court |
| `courtManagement.deactivate` | protected | `{ courtId: string }` | Soft delete |
| `courtManagement.getByOrganization` | protected | `{ organizationId: string }` | List org's courts |
| `courtManagement.addPhoto` | protected | `AddPhotoSchema` | Add photo |
| `courtManagement.removePhoto` | protected | `RemovePhotoSchema` | Remove photo |
| `courtManagement.reorderPhotos` | protected | `ReorderPhotosSchema` | Update order |
| `courtManagement.addAmenity` | protected | `AddAmenitySchema` | Add amenity |
| `courtManagement.removeAmenity` | protected | `RemoveAmenitySchema` | Remove amenity |

### DTOs

#### CreateCourtSchema

```typescript
const CreateCourtSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  city: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  courtType: z.enum(["CURATED", "RESERVABLE"]),
  
  // Curated court details (required if courtType = CURATED)
  curatedDetail: z.object({
    facebookUrl: z.string().url().optional(),
    viberInfo: z.string().max(100).optional(),
    instagramUrl: z.string().url().optional(),
    websiteUrl: z.string().url().optional(),
    otherContactInfo: z.string().optional(),
  }).optional(),
  
  // Reservable court details (required if courtType = RESERVABLE)
  reservableDetail: z.object({
    isFree: z.boolean().default(false),
    defaultCurrency: z.string().length(3).default("PHP"),
    paymentInstructions: z.string().optional(),
    gcashNumber: z.string().max(20).optional(),
    bankName: z.string().max(100).optional(),
    bankAccountNumber: z.string().max(50).optional(),
    bankAccountName: z.string().max(150).optional(),
  }).optional(),
}).refine(
  (data) => {
    if (data.courtType === "CURATED") return true; // curatedDetail optional
    if (data.courtType === "RESERVABLE") return data.reservableDetail !== undefined;
    return false;
  },
  { message: "Reservable courts require reservableDetail" }
);
```

#### UpdateCourtSchema

```typescript
const UpdateCourtSchema = z.object({
  courtId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  
  // Type-specific updates
  curatedDetail: z.object({...}).optional(),
  reservableDetail: z.object({...}).optional(),
});
```

#### AddPhotoSchema

```typescript
const AddPhotoSchema = z.object({
  courtId: z.string().uuid(),
  url: z.string().url(),
  displayOrder: z.number().int().min(0).optional(),
});
```

#### AddAmenitySchema

```typescript
const AddAmenitySchema = z.object({
  courtId: z.string().uuid(),
  name: z.string().min(1).max(100),
});
```

### Errors

| Error | HTTP | Description |
|-------|------|-------------|
| `NotCourtOwnerError` | 403 | User doesn't own this court's organization |
| `InvalidCourtTypeError` | 400 | Operation not valid for this court type |
| `DuplicateAmenityError` | 409 | Amenity already exists for this court |
| `MaxPhotosExceededError` | 400 | Court has maximum photos (10) |
| `PhotoNotFoundError` | 404 | Photo doesn't exist |
| `AmenityNotFoundError` | 404 | Amenity doesn't exist |

### Business Logic

1. **Owner authorization**: Verify user owns the organization that owns the court
2. **Type validation**: Ensure correct detail type for court type
3. **Transaction for creation**: Create court + detail in single transaction
4. **Max photos**: Limit to 10 photos per court
5. **Duplicate amenities**: Prevent duplicate amenity names per court

### Use Case: CreateReservableCourtUseCase

```typescript
// Complex operation requiring transaction
class CreateReservableCourtUseCase {
  async execute(userId: string, data: CreateCourtDTO): Promise<CourtWithDetails> {
    // 1. Verify user owns the organization
    const org = await this.orgRepo.findById(data.organizationId);
    if (!org || org.ownerUserId !== userId) {
      throw new NotOrganizationOwnerError();
    }
    
    // 2. Create court + detail in transaction
    return this.transactionManager.run(async (tx) => {
      const court = await this.courtRepo.create({
        organizationId: data.organizationId,
        name: data.name,
        address: data.address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        courtType: data.courtType,
        claimStatus: "CLAIMED", // Owner-created courts are already claimed
      }, { tx });
      
      const detail = await this.reservableDetailRepo.create({
        courtId: court.id,
        ...data.reservableDetail,
      }, { tx });
      
      return { court, detail, photos: [], amenities: [] };
    });
  }
}
```

### Testing Checklist

- [ ] Can create curated court
- [ ] Can create reservable court
- [ ] Owner authorization works
- [ ] Can add/remove photos
- [ ] Photo limit enforced
- [ ] Can add/remove amenities
- [ ] Duplicate amenity prevention works
- [ ] Can update court details
- [ ] Can deactivate court

---

## Module 2B: Time Slot Module

**Assigned to:** Agent 2  
**Complexity:** Medium-High  
**Dependencies:** Module 2A (Court Management)

### Overview

Manage bookable time slots for reservable courts. Handles creation, blocking, and availability queries.

### Directory Structure

```
src/modules/time-slot/
├── time-slot.router.ts
├── dtos/
│   ├── index.ts
│   ├── create-time-slot.dto.ts
│   ├── create-bulk-time-slots.dto.ts
│   ├── update-slot-price.dto.ts
│   └── get-available-slots.dto.ts
├── errors/
│   └── time-slot.errors.ts
├── factories/
│   └── time-slot.factory.ts
├── repositories/
│   └── time-slot.repository.ts
└── services/
    └── time-slot.service.ts
```

### Database Schema Reference

```typescript
// From src/shared/infra/db/schema/time-slot.ts
timeSlot: {
  id: uuid,
  courtId: uuid (FK → court),
  startTime: timestamptz,
  endTime: timestamptz,
  status: enum('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED'),
  priceCents: integer (nullable),
  currency: varchar(3) (nullable),
  createdAt: timestamptz,
  updatedAt: timestamptz,
}

// Constraints:
// - endTime > startTime
// - (priceCents IS NULL AND currency IS NULL) OR (both NOT NULL)
// - UNIQUE (courtId, startTime)
```

### Repository Interface

```typescript
interface ITimeSlotRepository {
  findById(id: string, ctx?: RequestContext): Promise<TimeSlotRecord | null>;
  findByIdForUpdate(id: string, ctx: RequestContext): Promise<TimeSlotRecord | null>; // SELECT FOR UPDATE
  findByCourtAndDateRange(
    courtId: string,
    startDate: Date,
    endDate: Date,
    status?: TimeSlotStatus
  ): Promise<TimeSlotRecord[]>;
  findAvailable(courtId: string, startDate: Date, endDate: Date): Promise<TimeSlotRecord[]>;
  findOverlapping(
    courtId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<TimeSlotRecord[]>;
  create(data: InsertTimeSlot, ctx?: RequestContext): Promise<TimeSlotRecord>;
  createMany(data: InsertTimeSlot[], ctx?: RequestContext): Promise<TimeSlotRecord[]>;
  update(id: string, data: Partial<InsertTimeSlot>, ctx?: RequestContext): Promise<TimeSlotRecord>;
  delete(id: string, ctx?: RequestContext): Promise<void>;
}
```

### Service Interface

```typescript
interface ITimeSlotService {
  // Queries
  getAvailableSlots(courtId: string, startDate: Date, endDate: Date): Promise<TimeSlotRecord[]>;
  getSlotById(id: string): Promise<TimeSlotRecord>;
  
  // Mutations (owner only)
  createSlot(userId: string, data: CreateTimeSlotDTO): Promise<TimeSlotRecord>;
  createBulkSlots(userId: string, data: CreateBulkTimeSlotsDTO): Promise<TimeSlotRecord[]>;
  blockSlot(userId: string, slotId: string): Promise<TimeSlotRecord>;
  unblockSlot(userId: string, slotId: string): Promise<TimeSlotRecord>;
  updateSlotPrice(userId: string, slotId: string, data: UpdateSlotPriceDTO): Promise<TimeSlotRecord>;
  deleteSlot(userId: string, slotId: string): Promise<void>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `timeSlot.getAvailable` | public | `GetAvailableSlotsSchema` | Get available slots |
| `timeSlot.create` | protected + rateLimited(mutation) | `CreateTimeSlotSchema` | Create single slot |
| `timeSlot.createBulk` | protected + rateLimited(sensitive) | `CreateBulkTimeSlotsSchema` | Create multiple slots |
| `timeSlot.block` | protected | `{ slotId: string }` | Block a slot |
| `timeSlot.unblock` | protected | `{ slotId: string }` | Unblock a slot |
| `timeSlot.updatePrice` | protected | `UpdateSlotPriceSchema` | Update price |
| `timeSlot.delete` | protected | `{ slotId: string }` | Delete available slot |

### DTOs

#### GetAvailableSlotsSchema

```typescript
const GetAvailableSlotsSchema = z.object({
  courtId: z.string().uuid(),
  startDate: z.string().datetime(), // ISO 8601
  endDate: z.string().datetime(),
});
```

#### CreateTimeSlotSchema

```typescript
const CreateTimeSlotSchema = z.object({
  courtId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  priceCents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  { message: "End time must be after start time" }
).refine(
  (data) => (data.priceCents === undefined) === (data.currency === undefined),
  { message: "Price and currency must both be set or both be null" }
);
```

#### CreateBulkTimeSlotsSchema

```typescript
const CreateBulkTimeSlotsSchema = z.object({
  courtId: z.string().uuid(),
  slots: z.array(z.object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    priceCents: z.number().int().min(0).optional(),
    currency: z.string().length(3).optional(),
  })).min(1).max(100), // Limit bulk creation
});
```

#### UpdateSlotPriceSchema

```typescript
const UpdateSlotPriceSchema = z.object({
  slotId: z.string().uuid(),
  priceCents: z.number().int().min(0).nullable(),
  currency: z.string().length(3).nullable(),
}).refine(
  (data) => (data.priceCents === null) === (data.currency === null),
  { message: "Price and currency must both be set or both be null" }
);
```

### Errors

| Error | HTTP | Description |
|-------|------|-------------|
| `SlotNotFoundError` | 404 | Time slot doesn't exist |
| `SlotOverlapError` | 409 | Slot overlaps with existing slot |
| `SlotNotAvailableError` | 400 | Slot is not in AVAILABLE status |
| `InvalidSlotDurationError` | 400 | End time not after start time |
| `CourtNotReservableError` | 400 | Court is not RESERVABLE type |
| `SlotInUseError` | 400 | Cannot delete/modify BOOKED or HELD slot |

### Business Logic

#### Overlap Detection

```typescript
async findOverlapping(
  courtId: string,
  startTime: Date,
  endTime: Date,
  excludeId?: string
): Promise<TimeSlotRecord[]> {
  let query = db.select()
    .from(timeSlot)
    .where(
      and(
        eq(timeSlot.courtId, courtId),
        lt(timeSlot.startTime, endTime),  // existing start < new end
        gt(timeSlot.endTime, startTime),   // existing end > new start
      )
    );
  
  if (excludeId) {
    query = query.where(ne(timeSlot.id, excludeId));
  }
  
  return query;
}
```

#### Create Slot with Overlap Check

```typescript
async createSlot(userId: string, data: CreateTimeSlotDTO): Promise<TimeSlotRecord> {
  // 1. Verify court exists and user owns it
  const court = await this.verifyCourtOwnership(userId, data.courtId);
  
  // 2. Verify court is RESERVABLE
  if (court.courtType !== "RESERVABLE") {
    throw new CourtNotReservableError();
  }
  
  // 3. Check for overlaps
  const overlapping = await this.timeSlotRepo.findOverlapping(
    data.courtId,
    new Date(data.startTime),
    new Date(data.endTime)
  );
  
  if (overlapping.length > 0) {
    throw new SlotOverlapError(overlapping);
  }
  
  // 4. Create slot
  return this.timeSlotRepo.create({
    courtId: data.courtId,
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    status: "AVAILABLE",
    priceCents: data.priceCents,
    currency: data.currency,
  });
}
```

#### Block/Unblock Logic

```typescript
async blockSlot(userId: string, slotId: string): Promise<TimeSlotRecord> {
  const slot = await this.getSlotWithOwnershipCheck(userId, slotId);
  
  if (slot.status !== "AVAILABLE") {
    throw new SlotNotAvailableError("Can only block AVAILABLE slots");
  }
  
  return this.timeSlotRepo.update(slotId, { status: "BLOCKED" });
}

async unblockSlot(userId: string, slotId: string): Promise<TimeSlotRecord> {
  const slot = await this.getSlotWithOwnershipCheck(userId, slotId);
  
  if (slot.status !== "BLOCKED") {
    throw new SlotNotAvailableError("Can only unblock BLOCKED slots");
  }
  
  return this.timeSlotRepo.update(slotId, { status: "AVAILABLE" });
}
```

### Testing Checklist

- [ ] Can create single slot
- [ ] Can create bulk slots
- [ ] Overlap detection works
- [ ] Rejects overlapping slots
- [ ] Only RESERVABLE courts accept slots
- [ ] Owner authorization works
- [ ] Can block/unblock slots
- [ ] Cannot modify BOOKED/HELD slots
- [ ] Price/currency consistency enforced
- [ ] Can query available slots by date range

---

## Completion Criteria (Phase 2)

- [ ] Both modules complete and tested
- [ ] Court management integrated with organization ownership
- [ ] Time slots properly validate overlaps
- [ ] All endpoints registered in root router
- [ ] Integration tested with Phase 1 modules
