# Phase 3: URL Slugs + Popular Locations

**Dependencies:** Phase 2 complete  
**Parallelizable:** No  
**User Stories:** `14-01-player-discovers-places-with-sport-filters`

---

## Objective

Ensure discovery URLs and popular links use slug-based parameters and display title-cased labels.

---

## Modules

### Module 3A: Popular Locations + Discovery URLs

#### Implementation Steps

1. Update `POPULAR_LOCATIONS` to use slugs (province + city).
2. Use display names from enriched dataset for labels.
3. Ensure `/courts` page derives header text from display names.

#### UI Layout

```
Popular: Manila - Davao City - Cebu City - Dumaguete - Quezon City
```

---

## Phase Completion Checklist

- [ ] Popular locations route with slugs
- [ ] Display labels use title-cased names
- [ ] Discovery header uses display labels
