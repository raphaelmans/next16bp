# Phase 1: Foundation Modules

**Prerequisites:** Pre-Phase (0A, 0B) complete  
**All modules can run in parallel**

---

## Module 1A: Profile Module

**Assigned to:** Agent 1  
**Complexity:** Low  
**Dependencies:** `profile` table, `auth.users`

### Overview

Manage player profiles linked to Supabase auth users. Profiles store optional display information and are used for player snapshots in reservations.

### Directory Structure

```
src/modules/profile/
├── profile.router.ts
├── dtos/
│   ├── index.ts
│   └── update-profile.dto.ts
├── errors/
│   └── profile.errors.ts
├── factories/
│   └── profile.factory.ts
├── repositories/
│   └── profile.repository.ts
└── services/
    └── profile.service.ts
```

### Database Schema Reference

```typescript
// From src/shared/infra/db/schema/profile.ts
profile: {
  id: uuid,
  userId: uuid (FK → auth.users, unique),
  displayName: varchar(100),
  email: varchar(255),
  phoneNumber: varchar(20),
  avatarUrl: text,
  createdAt: timestamptz,
  updatedAt: timestamptz,
}
```

### Repository Interface

```typescript
interface IProfileRepository {
  findById(id: string, ctx?: RequestContext): Promise<ProfileRecord | null>;
  findByUserId(userId: string, ctx?: RequestContext): Promise<ProfileRecord | null>;
  create(data: InsertProfile, ctx?: RequestContext): Promise<ProfileRecord>;
  update(id: string, data: Partial<InsertProfile>, ctx?: RequestContext): Promise<ProfileRecord>;
}
```

### Service Interface

```typescript
interface IProfileService {
  getProfile(userId: string): Promise<ProfileRecord>;
  getOrCreateProfile(userId: string): Promise<ProfileRecord>;
  updateProfile(userId: string, data: UpdateProfileDTO): Promise<ProfileRecord>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `profile.me` | protected | - | Get current user's profile (or create if missing) |
| `profile.update` | protected | `UpdateProfileSchema` | Update profile fields |
| `profile.getById` | protected | `{ id: string }` | Get profile by ID (for viewing other players) |

### DTOs

#### UpdateProfileSchema

```typescript
const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
});
```

### Errors

| Error | HTTP | Description |
|-------|------|-------------|
| `ProfileNotFoundError` | 404 | Profile does not exist |

### Business Logic

1. **Auto-create on first access**: If user has no profile, create one automatically
2. **Phone validation**: Basic format validation (deferred: full phone validation)
3. **Avatar URL**: Accept any valid URL (file upload deferred)

### Testing Checklist

- [ ] Can get own profile
- [ ] Auto-creates profile if missing
- [ ] Can update profile fields
- [ ] Validates email format
- [ ] Rejects invalid data

---

## Module 1B: Organization Module

**Assigned to:** Agent 2  
**Complexity:** Medium  
**Dependencies:** `organization`, `organization_profile` tables

### Overview

Manage court owner/operator organizations. Organizations own courts and receive reservations.

### Directory Structure

```
src/modules/organization/
├── organization.router.ts
├── dtos/
│   ├── index.ts
│   ├── create-organization.dto.ts
│   ├── update-organization.dto.ts
│   └── update-organization-profile.dto.ts
├── errors/
│   └── organization.errors.ts
├── factories/
│   └── organization.factory.ts
├── repositories/
│   ├── organization.repository.ts
│   └── organization-profile.repository.ts
├── services/
│   └── organization.service.ts
└── utils/
    └── slug.utils.ts
```

### Database Schema Reference

```typescript
// organization table
organization: {
  id: uuid,
  ownerUserId: uuid (FK → auth.users),
  name: varchar(150),
  slug: varchar(100) (unique),
  isActive: boolean (default: true),
  createdAt: timestamptz,
  updatedAt: timestamptz,
}

// organization_profile table
organizationProfile: {
  id: uuid,
  organizationId: uuid (FK → organization, unique),
  description: text,
  logoUrl: text,
  contactEmail: varchar(255),
  contactPhone: varchar(20),
  address: text,
  createdAt: timestamptz,
  updatedAt: timestamptz,
}
```

### Repository Interfaces

```typescript
interface IOrganizationRepository {
  findById(id: string, ctx?: RequestContext): Promise<OrganizationRecord | null>;
  findBySlug(slug: string, ctx?: RequestContext): Promise<OrganizationRecord | null>;
  findByOwnerId(ownerId: string, ctx?: RequestContext): Promise<OrganizationRecord[]>;
  create(data: InsertOrganization, ctx?: RequestContext): Promise<OrganizationRecord>;
  update(id: string, data: Partial<InsertOrganization>, ctx?: RequestContext): Promise<OrganizationRecord>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}

interface IOrganizationProfileRepository {
  findByOrganizationId(orgId: string, ctx?: RequestContext): Promise<OrganizationProfileRecord | null>;
  create(data: InsertOrganizationProfile, ctx?: RequestContext): Promise<OrganizationProfileRecord>;
  update(id: string, data: Partial<InsertOrganizationProfile>, ctx?: RequestContext): Promise<OrganizationProfileRecord>;
}
```

### Service Interface

```typescript
interface IOrganizationService {
  createOrganization(ownerId: string, data: CreateOrganizationDTO): Promise<OrganizationWithProfile>;
  getOrganization(id: string): Promise<OrganizationWithProfile>;
  getOrganizationBySlug(slug: string): Promise<OrganizationWithProfile>;
  getMyOrganizations(userId: string): Promise<OrganizationRecord[]>;
  updateOrganization(userId: string, id: string, data: UpdateOrganizationDTO): Promise<OrganizationRecord>;
  updateOrganizationProfile(userId: string, id: string, data: UpdateOrganizationProfileDTO): Promise<OrganizationProfileRecord>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `organization.create` | protected + rateLimited(mutation) | `CreateOrganizationSchema` | Create new organization |
| `organization.get` | public | `{ id: string }` | Get org by ID |
| `organization.getBySlug` | public | `{ slug: string }` | Get org by slug |
| `organization.my` | protected | - | Get current user's organizations |
| `organization.update` | protected | `UpdateOrganizationSchema` | Update org (owner only) |
| `organization.updateProfile` | protected | `UpdateOrganizationProfileSchema` | Update org profile |

### DTOs

#### CreateOrganizationSchema

```typescript
const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(), // auto-generate if not provided
});
```

#### UpdateOrganizationSchema

```typescript
const UpdateOrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(150).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  isActive: z.boolean().optional(),
});
```

#### UpdateOrganizationProfileSchema

```typescript
const UpdateOrganizationProfileSchema = z.object({
  organizationId: z.string().uuid(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  address: z.string().optional(),
});
```

### Slug Generation

```typescript
// src/modules/organization/utils/slug.utils.ts
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export async function generateUniqueSlug(
  name: string, 
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = generateSlug(name);
  let counter = 1;
  
  while (await checkExists(slug)) {
    slug = `${generateSlug(name)}-${counter}`;
    counter++;
  }
  
  return slug;
}
```

### Errors

| Error | HTTP | Description |
|-------|------|-------------|
| `OrganizationNotFoundError` | 404 | Organization does not exist |
| `SlugAlreadyExistsError` | 409 | Slug is already taken |
| `NotOrganizationOwnerError` | 403 | User is not the organization owner |

### Business Logic

1. **Slug generation**: Auto-generate from name if not provided
2. **Unique slug**: Check uniqueness, append counter if needed
3. **Owner authorization**: Only owner can update organization
4. **Profile auto-creation**: Create empty profile on org creation

### Testing Checklist

- [ ] Can create organization with auto-generated slug
- [ ] Can create organization with custom slug
- [ ] Rejects duplicate slugs
- [ ] Only owner can update
- [ ] Profile created with organization
- [ ] Can update organization profile

---

## Module 1C: Court Discovery Module (Read-Only)

**Assigned to:** Agent 3  
**Complexity:** Medium  
**Dependencies:** All court-related tables

### Overview

Public endpoints for discovering and viewing court information. This module is read-only; court management is in Phase 2.

### Directory Structure

```
src/modules/court/
├── court.router.ts
├── dtos/
│   ├── index.ts
│   └── search-courts.dto.ts
├── errors/
│   └── court.errors.ts
├── factories/
│   └── court.factory.ts
├── repositories/
│   └── court.repository.ts      # Read methods only
└── services/
    └── court-discovery.service.ts
```

### Database Schema Reference

```typescript
// See schema files for full definitions
// Key tables: court, curated_court_detail, reservable_court_detail, court_photo, court_amenity
```

### Response Types

```typescript
interface CourtWithDetails {
  court: CourtRecord;
  detail: CuratedCourtDetailRecord | ReservableCourtDetailRecord;
  photos: CourtPhotoRecord[];
  amenities: CourtAmenityRecord[];
  organization?: OrganizationRecord; // Only for reservable courts
}

interface CourtListItem {
  court: CourtRecord;
  photoUrl?: string; // First photo only
  amenityCount: number;
  isFree?: boolean; // Only for reservable
}
```

### Repository Interface

```typescript
interface ICourtRepository {
  findById(id: string): Promise<CourtRecord | null>;
  findWithDetails(id: string): Promise<CourtWithDetails | null>;
  search(filters: SearchCourtsDTO): Promise<{ courts: CourtListItem[]; total: number }>;
  listByCity(city: string, pagination: PaginationDTO): Promise<{ courts: CourtListItem[]; total: number }>;
}
```

### Service Interface

```typescript
interface ICourtDiscoveryService {
  getCourtById(id: string): Promise<CourtWithDetails>;
  searchCourts(filters: SearchCourtsDTO): Promise<PaginatedResult<CourtListItem>>;
  listCourtsByCity(city: string, pagination: PaginationDTO): Promise<PaginatedResult<CourtListItem>>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `court.getById` | public | `{ id: string }` | Get court with all details |
| `court.search` | public | `SearchCourtsSchema` | Search/filter courts |
| `court.listByCity` | public | `{ city: string, ...pagination }` | List courts in a city |

### DTOs

#### SearchCourtsSchema

```typescript
const SearchCourtsSchema = z.object({
  city: z.string().optional(),
  courtType: z.enum(["CURATED", "RESERVABLE"]).optional(),
  isFree: z.boolean().optional(), // Only applies to RESERVABLE
  amenities: z.array(z.string()).optional(), // Filter by amenity names
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});
```

### Errors

| Error | HTTP | Description |
|-------|------|-------------|
| `CourtNotFoundError` | 404 | Court does not exist |

### Query Logic

#### Search Query (Conceptual)

```typescript
// Build query based on filters
let query = db.select().from(court).where(eq(court.isActive, true));

if (filters.city) {
  query = query.where(eq(court.city, filters.city));
}

if (filters.courtType) {
  query = query.where(eq(court.courtType, filters.courtType));
}

if (filters.isFree !== undefined && filters.courtType === "RESERVABLE") {
  query = query.innerJoin(reservableCourtDetail, ...)
    .where(eq(reservableCourtDetail.isFree, filters.isFree));
}

if (filters.amenities?.length) {
  // Subquery to filter courts that have ALL specified amenities
}
```

### Testing Checklist

- [ ] Can get court by ID with all details
- [ ] Returns correct detail type (curated vs reservable)
- [ ] Search filters work correctly
- [ ] Pagination works
- [ ] Only returns active courts
- [ ] Includes photos and amenities

---

## Completion Criteria (Phase 1)

- [ ] All three modules complete and tested
- [ ] No TypeScript errors
- [ ] All endpoints registered in root router
- [ ] Integration tested together
