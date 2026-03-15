# Phase 5: Public UI Embeds

**Dependencies:** Phase 4 complete  
**Parallelizable:** Partial  
**User Stories:** US-23-01 (extension)

---

## Objective

Integrate Google Maps embed previews into the discovery map view and reservation detail UI with graceful fallbacks when the embed key or coordinates are missing.

---

## Modules

### Module 5A: Discovery + reservation embed UI

**User Story:** `US-23-01`  
**Reference:** `agent-plans/user-stories/23-google-maps-embed-poc/23-00-overview.md`

#### UI Layout

**Discovery (Map View)**
```
┌──────────────────────────────────────────────┐
│  Map preview (iframe)                        │
│  [Open in Google Maps]                       │
│                                              │
│  ┌───────────────┐                           │
│  │ Place list    │                           │
│  │ card overlay  │                           │
│  └───────────────┘                           │
└──────────────────────────────────────────────┘
```

**Reservation Details (Booking Details Card)**
```
┌──────────────────────────────────────────────┐
│ Booking Details                              │
│  - Address                                   │
│  - Date/Time                                 │
│  - Price                                     │
│                                              │
│  Location                                    │
│  ┌────────────────────────────────────────┐  │
│  │ Map preview (iframe)                   │  │
│  └────────────────────────────────────────┘  │
│  [Get Directions] [Open in Maps]             │
└──────────────────────────────────────────────┘
```

#### Implementation Steps

1. Add a shared `GoogleMapsEmbed` component with key-driven URL building and fallback UI.
2. Replace the map placeholder in discovery `PlaceMap` with the embed preview and a single center pin overlay.
3. Add the embed block and external map link in `BookingDetailsCard` for reservations.

#### Testing Checklist

- [ ] Discovery map view shows an iframe embed when the key exists.
- [ ] Reservation details show the embed and external map links.
- [ ] Missing `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` shows a clear fallback state.
