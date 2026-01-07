# Server Seed Data

**Purpose:** Seed the database with sample court data for development and testing.

---

## Overview

This script populates the database with realistic Philippine pickleball court data, including:
- Curated courts (view-only, with social contact info)
- Reservable courts (with payment details and time slots)
- Court photos and amenities

**Note:** This script does NOT seed users, profiles, organizations, or admin accounts. Those require actual Supabase Auth users.

---

## Seed Data Structure

### 1. Curated Courts (View-Only)

Sample curated courts represent courts discovered by the platform but not yet claimed by owners.

| Court Name | City | Contact Type |
|------------|------|--------------|
| BGC Pickleball Courts | Taguig | Facebook, Website |
| Makati Sports Club | Makati | Instagram, Viber |
| Cebu City Sports Center | Cebu | Facebook |
| Davao Pickleball Hub | Davao | Website, Viber |
| Clark Pickleball Arena | Pampanga | Facebook, Instagram |

### 2. Court Photos

Each court gets 1-3 sample photos using placeholder URLs:
- Primary court view
- Facility/amenities
- Action shots

### 3. Court Amenities

Common amenities:
- Parking
- Restrooms
- Water Station
- Lighting (Night Play)
- Pro Shop
- Locker Rooms
- Spectator Seating
- Ball Machine Rental
- Equipment Rental
- Covered Courts

---

## Script Location

```
scripts/
└── seed-courts.ts
```

---

## Usage

```bash
# Run the seed script
npm run db:seed

# Or directly with tsx
npx dotenvx run --env-file=.env.local -- tsx scripts/seed-courts.ts
```

---

## Script Behavior

1. **Idempotent:** Running multiple times won't create duplicates (checks by name)
2. **Transaction:** All inserts wrapped in a transaction
3. **Logging:** Outputs progress to console
4. **Safe:** Only seeds courts, photos, amenities - no user data

---

## Seed Data Details

### Curated Courts (5 courts)

```typescript
const curatedCourts = [
  {
    name: "BGC Pickleball Courts",
    address: "5th Avenue corner 32nd Street, Bonifacio Global City",
    city: "Taguig",
    latitude: 14.5507,
    longitude: 121.0455,
    detail: {
      facebookUrl: "https://facebook.com/bgcpickleball",
      websiteUrl: "https://bgcpickleball.com",
      viberInfo: null,
    },
    amenities: ["Parking", "Restrooms", "Water Station", "Lighting"],
    photos: 2,
  },
  {
    name: "Makati Sports Club",
    address: "Ayala Avenue, Makati City",
    city: "Makati",
    latitude: 14.5580,
    longitude: 121.0244,
    detail: {
      instagramUrl: "https://instagram.com/makatisportsclub",
      viberInfo: "09171234567",
    },
    amenities: ["Parking", "Locker Rooms", "Pro Shop", "Restrooms"],
    photos: 3,
  },
  {
    name: "Cebu City Sports Center",
    address: "Osmena Boulevard, Cebu City",
    city: "Cebu",
    latitude: 10.3157,
    longitude: 123.8854,
    detail: {
      facebookUrl: "https://facebook.com/cebusportscenter",
    },
    amenities: ["Parking", "Spectator Seating", "Water Station"],
    photos: 2,
  },
  {
    name: "Davao Pickleball Hub",
    address: "JP Laurel Avenue, Davao City",
    city: "Davao",
    latitude: 7.0731,
    longitude: 125.6128,
    detail: {
      websiteUrl: "https://davaopickleball.ph",
      viberInfo: "09189876543",
    },
    amenities: ["Covered Courts", "Equipment Rental", "Parking"],
    photos: 2,
  },
  {
    name: "Clark Pickleball Arena",
    address: "Clark Freeport Zone, Pampanga",
    city: "Pampanga",
    latitude: 15.1852,
    longitude: 120.5601,
    detail: {
      facebookUrl: "https://facebook.com/clarkpickleball",
      instagramUrl: "https://instagram.com/clarkpickleballarena",
    },
    amenities: ["Parking", "Ball Machine Rental", "Pro Shop", "Lighting"],
    photos: 3,
  },
];
```

### Photo URLs

Uses placeholder images from picsum.photos:
```typescript
const getPhotoUrl = (courtIndex: number, photoIndex: number) =>
  `https://picsum.photos/seed/court${courtIndex}photo${photoIndex}/800/600`;
```

---

## Database Tables Affected

| Table | Action |
|-------|--------|
| `court` | INSERT (5 curated courts) |
| `curated_court_detail` | INSERT (5 detail records) |
| `court_photo` | INSERT (~12 photos) |
| `court_amenity` | INSERT (~20 amenities) |

---

## Future Extensions

When organization owners exist, a separate script could seed:
- `organization` - Sample organizations
- `reservable_court_detail` - Payment details
- `time_slot` - Sample availability

For now, reservable courts can only be created by authenticated users through the API.

---

## Cleanup Script (Optional)

A cleanup script could be added:
```bash
npm run db:seed:clean
```

This would remove all seeded data (courts without organization_id).

---

## Integration with Development

1. After running migrations: `npm run db:migrate`
2. Run seed: `npm run db:seed`
3. Start development: `npm run dev`

The seed script is safe to run multiple times - it skips existing courts by name.
