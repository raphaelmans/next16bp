import { addMinutes } from "date-fns";

export interface PlaceSport {
  id: string;
  name: string;
}

export interface PlaceCourt {
  id: string;
  label: string;
  sportId: string;
  sportName: string;
  tierLabel?: string;
  isActive: boolean;
  pricePerHourCents: number;
  currency: string;
  availabilityHours: number[];
}

export interface PlacePhoto {
  id: string;
  url: string;
  alt?: string;
}

export interface PlaceDetail {
  id: string;
  name: string;
  address: string;
  city: string;
  description?: string;
  timeZone: string;
  coverImageUrl?: string;
  sports: PlaceSport[];
  courts: PlaceCourt[];
  photos: PlacePhoto[];
}

export interface PlaceSummary {
  id: string;
  name: string;
  address: string;
  city: string;
  coverImageUrl?: string;
  sports: PlaceSport[];
  courtCount: number;
  lowestPriceCents?: number;
  currency?: string;
}

export interface AvailabilityOption {
  id: string;
  startTime: string;
  endTime: string;
  totalPriceCents: number;
  currency: string;
  courtId: string;
  courtLabel: string;
}

export const PLACE_SPORTS: PlaceSport[] = [
  { id: "pickleball", name: "Pickleball" },
  { id: "badminton", name: "Badminton" },
  { id: "basketball", name: "Basketball" },
  { id: "tennis", name: "Tennis" },
];

const DEFAULT_TIME_ZONE = "Asia/Manila";

const MOCK_PLACES: PlaceDetail[] = [
  {
    id: "place-makati",
    name: "Kudos Sports Complex",
    address: "123 Sports Avenue, Makati City",
    city: "Makati",
    description:
      "Premium indoor courts with pro-grade flooring and spacious lounge areas.",
    timeZone: DEFAULT_TIME_ZONE,
    photos: [
      {
        id: "place-makati-1",
        url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
        alt: "Kudos Sports Complex courts",
      },
      {
        id: "place-makati-2",
        url: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
        alt: "Kudos Sports Complex lounge",
      },
    ],
    sports: [],
    courts: [
      {
        id: "court-makati-1",
        label: "Court 1",
        sportId: "pickleball",
        sportName: "Pickleball",
        tierLabel: "Premium",
        isActive: true,
        pricePerHourCents: 35000,
        currency: "PHP",
        availabilityHours: [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18],
      },
      {
        id: "court-makati-2",
        label: "Court 2",
        sportId: "pickleball",
        sportName: "Pickleball",
        tierLabel: "Standard",
        isActive: true,
        pricePerHourCents: 25000,
        currency: "PHP",
        availabilityHours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      },
      {
        id: "court-makati-3",
        label: "Court 3",
        sportId: "badminton",
        sportName: "Badminton",
        tierLabel: "Club",
        isActive: true,
        pricePerHourCents: 20000,
        currency: "PHP",
        availabilityHours: [8, 9, 10, 11, 12, 13, 14, 15, 18, 19],
      },
    ],
  },
  {
    id: "place-bgc",
    name: "BGC Pickleball Hub",
    address: "456 High Street, Taguig City",
    city: "Taguig",
    description:
      "Open-air pickleball courts with shaded seating and on-site pro shop.",
    timeZone: DEFAULT_TIME_ZONE,
    photos: [
      {
        id: "place-bgc-1",
        url: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
        alt: "BGC Pickleball Hub",
      },
      {
        id: "place-bgc-2",
        url: "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1200&q=80",
        alt: "Pickleball hub lounge",
      },
    ],
    sports: [],
    courts: [
      {
        id: "court-bgc-1",
        label: "Court Alpha",
        sportId: "pickleball",
        sportName: "Pickleball",
        tierLabel: "Signature",
        isActive: true,
        pricePerHourCents: 32000,
        currency: "PHP",
        availabilityHours: [7, 8, 9, 10, 11, 12, 15, 16, 17, 18],
      },
      {
        id: "court-bgc-2",
        label: "Court Bravo",
        sportId: "pickleball",
        sportName: "Pickleball",
        tierLabel: "Standard",
        isActive: true,
        pricePerHourCents: 24000,
        currency: "PHP",
        availabilityHours: [7, 8, 9, 10, 11, 12, 13, 16, 17],
      },
    ],
  },
  {
    id: "place-cebu",
    name: "Cebu Sports Center",
    address: "789 Coastal Road, Cebu City",
    city: "Cebu City",
    description:
      "Multi-sport venue with basketball courts and badminton lanes.",
    timeZone: DEFAULT_TIME_ZONE,
    photos: [
      {
        id: "place-cebu-1",
        url: "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1200&q=80",
        alt: "Cebu Sports Center",
      },
      {
        id: "place-cebu-2",
        url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
        alt: "Cebu Sports Center courts",
      },
    ],
    sports: [],
    courts: [
      {
        id: "court-cebu-1",
        label: "Court Wave",
        sportId: "basketball",
        sportName: "Basketball",
        tierLabel: "Full Court",
        isActive: true,
        pricePerHourCents: 28000,
        currency: "PHP",
        availabilityHours: [6, 7, 8, 9, 10, 14, 15, 16, 17, 18],
      },
      {
        id: "court-cebu-2",
        label: "Court Breeze",
        sportId: "badminton",
        sportName: "Badminton",
        tierLabel: "Indoor",
        isActive: true,
        pricePerHourCents: 18000,
        currency: "PHP",
        availabilityHours: [8, 9, 10, 11, 13, 14, 15, 19],
      },
    ],
  },
].map((place) => ({
  ...place,
  sports: getUniqueSports(place.courts),
  coverImageUrl: place.photos[0]?.url,
}));

function getUniqueSports(courts: PlaceCourt[]): PlaceSport[] {
  const map = new Map<string, PlaceSport>();
  courts.forEach((court) => {
    map.set(court.sportId, { id: court.sportId, name: court.sportName });
  });
  return Array.from(map.values());
}

function getLowestPrice(courts: PlaceCourt[]) {
  const activeCourts = courts.filter((court) => court.isActive);
  if (activeCourts.length === 0) return undefined;
  return activeCourts.reduce(
    (min, court) =>
      court.pricePerHourCents < min ? court.pricePerHourCents : min,
    activeCourts[0].pricePerHourCents,
  );
}

export function getPlaceSummary(place: PlaceDetail): PlaceSummary {
  const lowestPriceCents = getLowestPrice(place.courts);
  return {
    id: place.id,
    name: place.name,
    address: place.address,
    city: place.city,
    coverImageUrl: place.coverImageUrl,
    sports: place.sports,
    courtCount: place.courts.length,
    lowestPriceCents,
    currency: place.courts[0]?.currency ?? "PHP",
  };
}

export function listPlaces(): PlaceSummary[] {
  return MOCK_PLACES.map(getPlaceSummary);
}

export function listPlaceDetails(): PlaceDetail[] {
  return [...MOCK_PLACES];
}

export function findPlaceById(placeId: string): PlaceDetail | undefined {
  return MOCK_PLACES.find((place) => place.id === placeId);
}

export function filterPlaces(options: {
  q?: string;
  city?: string;
  sportId?: string;
  page?: number;
  limit?: number;
}) {
  const { q, city, sportId, page = 1, limit = 12 } = options;
  const query = q?.trim().toLowerCase();
  const cityFilter = city?.trim().toLowerCase();

  let places = MOCK_PLACES;

  if (query) {
    places = places.filter((place) =>
      [place.name, place.address, place.city].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }

  if (cityFilter) {
    places = places.filter((place) =>
      place.city.toLowerCase().includes(cityFilter),
    );
  }

  if (sportId) {
    places = places.filter((place) =>
      place.courts.some((court) => court.sportId === sportId && court.isActive),
    );
  }

  const total = places.length;
  const offset = (page - 1) * limit;
  const items = places.slice(offset, offset + limit).map(getPlaceSummary);

  return { items, total, page, limit };
}

function createStartTime(date: Date, hour: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    0,
    0,
    0,
  );
}

function getConsecutiveStarts(hours: number[], durationMinutes: number) {
  const slotCount = Math.max(1, Math.floor(durationMinutes / 60));
  const hourSet = new Set(hours);
  return hours.filter((hour) => {
    for (let i = 1; i < slotCount; i += 1) {
      if (!hourSet.has(hour + i)) return false;
    }
    return true;
  });
}

export function getAvailabilityForCourt(options: {
  court: PlaceCourt;
  date: Date;
  durationMinutes: number;
}) {
  const { court, date, durationMinutes } = options;
  if (!court.isActive) return [];
  const validStarts = getConsecutiveStarts(
    court.availabilityHours,
    durationMinutes,
  );
  return validStarts.map((hour) => {
    const start = createStartTime(date, hour);
    const end = addMinutes(start, durationMinutes);
    return {
      id: `${court.id}-${hour}-${durationMinutes}`,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      totalPriceCents:
        court.pricePerHourCents * Math.max(1, durationMinutes / 60),
      currency: court.currency,
      courtId: court.id,
      courtLabel: court.label,
    };
  });
}

export function getAvailabilityForPlace(options: {
  place: PlaceDetail;
  sportId: string;
  date: Date;
  durationMinutes: number;
}): AvailabilityOption[] {
  const { place, sportId, date, durationMinutes } = options;
  const optionsByStart = new Map<string, AvailabilityOption>();

  place.courts
    .filter((court) => court.sportId === sportId && court.isActive)
    .forEach((court) => {
      const availability = getAvailabilityForCourt({
        court,
        date,
        durationMinutes,
      });
      availability.forEach((slot) => {
        const existing = optionsByStart.get(slot.startTime);
        if (!existing || slot.totalPriceCents < existing.totalPriceCents) {
          optionsByStart.set(slot.startTime, slot);
        }
      });
    });

  return Array.from(optionsByStart.values()).sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
}

export function getAvailabilityByCourtId(options: {
  place: PlaceDetail;
  courtId: string;
  date: Date;
  durationMinutes: number;
}): AvailabilityOption[] {
  const { place, courtId, date, durationMinutes } = options;
  const court = place.courts.find((item) => item.id === courtId);
  if (!court) return [];
  return getAvailabilityForCourt({ court, date, durationMinutes });
}

export function findCourtById(place: PlaceDetail, courtId: string) {
  return place.courts.find((court) => court.id === courtId);
}
