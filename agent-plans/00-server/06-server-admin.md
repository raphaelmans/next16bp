# Phase 5: Admin & Utility Modules

**Prerequisites:** Phases 2-4 complete  
**Both modules can run in parallel**

---

## Module 5A: Admin Court Module

**Assigned to:** Any Agent  
**Complexity:** Medium  
**Dependencies:** Phase 2A (Court Management), Pre-Phase 0B (Admin Role)

### Overview

Admin operations for managing courts, including creating curated courts (public listings) and moderating existing courts.

### Directory Structure

```
src/modules/court/
├── admin/
│   └── admin-court.router.ts
├── dtos/
│   ├── create-curated-court.dto.ts
│   └── admin-update-court.dto.ts
└── services/
    └── admin-court.service.ts
```

### Service Interface

```typescript
interface IAdminCourtService {
  createCuratedCourt(adminUserId: string, data: CreateCuratedCourtDTO): Promise<CourtWithDetails>;
  updateCourt(adminUserId: string, courtId: string, data: AdminUpdateCourtDTO): Promise<CourtRecord>;
  deactivateCourt(adminUserId: string, courtId: string, reason: string): Promise<CourtRecord>;
  activateCourt(adminUserId: string, courtId: string): Promise<CourtRecord>;
  listAllCourts(filters: AdminCourtFiltersDTO): Promise<PaginatedResult<CourtRecord>>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `admin.court.createCurated` | admin + rateLimited(mutation) | `CreateCuratedCourtSchema` | Create curated court |
| `admin.court.update` | admin | `AdminUpdateCourtSchema` | Update any court |
| `admin.court.deactivate` | admin | `DeactivateCourtSchema` | Deactivate court |
| `admin.court.activate` | admin | `{ courtId: string }` | Reactivate court |
| `admin.court.list` | admin | `AdminCourtFiltersSchema` | List all courts |

### DTOs

#### CreateCuratedCourtSchema

```typescript
const CreateCuratedCourtSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1),
  city: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  
  // Curated court specific
  facebookUrl: z.string().url().optional(),
  viberInfo: z.string().max(100).optional(),
  instagramUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  otherContactInfo: z.string().optional(),
  
  // Initial photos/amenities
  photos: z.array(z.object({
    url: z.string().url(),
    displayOrder: z.number().int().min(0).optional(),
  })).optional(),
  amenities: z.array(z.string().max(100)).optional(),
});
```

#### AdminUpdateCourtSchema

```typescript
const AdminUpdateCourtSchema = z.object({
  courtId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional(),
  
  // Can update detail fields based on court type
  curatedDetail: z.object({...}).optional(),
  reservableDetail: z.object({...}).optional(),
});
```

#### DeactivateCourtSchema

```typescript
const DeactivateCourtSchema = z.object({
  courtId: z.string().uuid(),
  reason: z.string().min(1).max(500),
});
```

#### AdminCourtFiltersSchema

```typescript
const AdminCourtFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  courtType: z.enum(["CURATED", "RESERVABLE"]).optional(),
  claimStatus: z.enum(["UNCLAIMED", "CLAIM_PENDING", "CLAIMED", "REMOVAL_REQUESTED"]).optional(),
  city: z.string().optional(),
  search: z.string().optional(), // Search by name
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});
```

### Business Logic

#### Create Curated Court

```typescript
async createCuratedCourt(
  adminUserId: string,
  data: CreateCuratedCourtDTO
): Promise<CourtWithDetails> {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    // 1. Create court (no organization - curated courts are platform-owned)
    const court = await this.courtRepo.create({
      organizationId: null,
      name: data.name,
      address: data.address,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      courtType: "CURATED",
      claimStatus: "UNCLAIMED",
      isActive: true,
    }, ctx);
    
    // 2. Create curated detail
    const detail = await this.curatedDetailRepo.create({
      courtId: court.id,
      facebookUrl: data.facebookUrl,
      viberInfo: data.viberInfo,
      instagramUrl: data.instagramUrl,
      websiteUrl: data.websiteUrl,
      otherContactInfo: data.otherContactInfo,
    }, ctx);
    
    // 3. Create photos if provided
    const photos: CourtPhotoRecord[] = [];
    if (data.photos?.length) {
      for (const photo of data.photos) {
        const created = await this.courtPhotoRepo.create({
          courtId: court.id,
          url: photo.url,
          displayOrder: photo.displayOrder ?? photos.length,
        }, ctx);
        photos.push(created);
      }
    }
    
    // 4. Create amenities if provided
    const amenities: CourtAmenityRecord[] = [];
    if (data.amenities?.length) {
      for (const name of data.amenities) {
        const created = await this.courtAmenityRepo.create({
          courtId: court.id,
          name,
        }, ctx);
        amenities.push(created);
      }
    }
    
    return { court, detail, photos, amenities };
  });
}
```

#### Deactivate Court

```typescript
async deactivateCourt(
  adminUserId: string,
  courtId: string,
  reason: string
): Promise<CourtRecord> {
  // Log the deactivation reason (could add to an admin_action_log table later)
  console.log(`Admin ${adminUserId} deactivated court ${courtId}: ${reason}`);
  
  return this.courtRepo.update(courtId, { isActive: false });
}
```

### Testing Checklist

- [ ] Only admins can access endpoints
- [ ] Can create curated court with all details
- [ ] Can create curated court with photos/amenities
- [ ] Can update any court (regardless of owner)
- [ ] Can deactivate court
- [ ] Can reactivate court
- [ ] Can list courts with filters

---

## Module 5B: Audit Log Module

**Assigned to:** Any Agent  
**Complexity:** Low  
**Dependencies:** Phase 3A (Reservation), Phase 4A (Claim Request)

### Overview

Read-only access to audit logs for debugging, dispute resolution, and administrative oversight.

### Directory Structure

```
src/modules/audit/
├── audit.router.ts
├── dtos/
│   └── get-audit-log.dto.ts
├── factories/
│   └── audit.factory.ts
└── services/
    └── audit.service.ts
```

### Service Interface

```typescript
interface IAuditService {
  getReservationHistory(
    userId: string,
    reservationId: string
  ): Promise<ReservationEventRecord[]>;
  
  getClaimRequestHistory(
    adminUserId: string,
    claimRequestId: string
  ): Promise<ClaimRequestEventRecord[]>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `audit.reservationHistory` | protected | `{ reservationId: string }` | Get reservation events |
| `audit.claimHistory` | admin | `{ claimRequestId: string }` | Get claim request events |

### DTOs

```typescript
const GetReservationHistorySchema = z.object({
  reservationId: z.string().uuid(),
});

const GetClaimHistorySchema = z.object({
  claimRequestId: z.string().uuid(),
});
```

### Business Logic

#### Get Reservation History

```typescript
async getReservationHistory(
  userId: string,
  reservationId: string
): Promise<ReservationEventRecord[]> {
  // 1. Get reservation
  const reservation = await this.reservationRepo.findById(reservationId);
  if (!reservation) {
    throw new ReservationNotFoundError();
  }
  
  // 2. Verify access (player who made reservation OR court owner OR admin)
  const profile = await this.profileRepo.findByUserId(userId);
  const isPlayer = reservation.playerId === profile?.id;
  const isOwner = await this.isCourtOwner(userId, reservation.timeSlotId);
  const isAdmin = await this.isAdmin(userId);
  
  if (!isPlayer && !isOwner && !isAdmin) {
    throw new AuthorizationError("Not authorized to view this reservation history");
  }
  
  // 3. Get events
  return this.reservationEventRepo.findByReservationId(reservationId);
}
```

#### Get Claim Request History

```typescript
async getClaimRequestHistory(
  adminUserId: string,
  claimRequestId: string
): Promise<ClaimRequestEventRecord[]> {
  // Admin-only endpoint (enforced by adminProcedure)
  
  const claimRequest = await this.claimRequestRepo.findById(claimRequestId);
  if (!claimRequest) {
    throw new ClaimRequestNotFoundError();
  }
  
  return this.claimRequestEventRepo.findByClaimRequestId(claimRequestId);
}
```

### Response Types

```typescript
interface ReservationHistoryResponse {
  reservation: ReservationRecord;
  events: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    triggeredByRole: "PLAYER" | "OWNER" | "SYSTEM";
    triggeredByUserId: string | null;
    notes: string | null;
    createdAt: Date;
  }>;
}

interface ClaimHistoryResponse {
  claimRequest: ClaimRequestRecord;
  events: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    triggeredByUserId: string;
    notes: string | null;
    createdAt: Date;
  }>;
}
```

### Testing Checklist

- [ ] Player can view own reservation history
- [ ] Court owner can view reservation history for their courts
- [ ] Admin can view any reservation history
- [ ] Only admin can view claim request history
- [ ] Events returned in chronological order
- [ ] Unauthorized access rejected

---

## Completion Criteria (Phase 5)

- [ ] Both modules complete and tested
- [ ] Admin can create curated courts
- [ ] Admin can manage all courts
- [ ] Audit logs accessible with proper authorization
- [ ] All endpoints registered in root router
