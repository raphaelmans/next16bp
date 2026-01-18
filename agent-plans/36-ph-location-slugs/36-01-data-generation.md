# Phase 1: Data Generation + API Contracts

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** `14-01-player-discovers-places-with-sport-filters`

---

## Objective

Generate an enriched PH province/city dataset with display names + slugs, merge NCR into Metro Manila, and update the public API + client schema to use the new structure.

---

## Modules

### Module 1A: Enriched JSON Generator

**User Story:** `14-01-player-discovers-places-with-sport-filters`

#### Directory Structure

```
scripts/
├── generate-ph-location-slugs.ts
public/assets/files/
├── ph-provinces-cities.enriched.json
├── ph-provinces-cities.enriched.min.json
```

#### Implementation Steps

1. Read `public/assets/files/ph-provinces-cities.json`.
2. Merge NCR-related keys + `TAGUIG - PATEROS` into `METRO MANILA`.
3. Build array of province objects:
   - `name` (uppercase source)
   - `displayName` (title case)
   - `slug` (kebab-case)
   - `cities` array with `{ name, displayName, slug }`
4. Sort provinces/cities by `displayName`.
5. Write enriched JSON (pretty + minified).

#### Code Example

```ts
const output = JSON.stringify(data, null, 2);
const minified = JSON.stringify(data);
```

#### Testing Checklist

- [ ] Script runs without errors
- [ ] Metro Manila contains merged NCR cities
- [ ] Output files generated in `public/assets/files/`

---

### Module 1B: API + Client Schema Updates

**User Story:** `14-01-player-discovers-places-with-sport-filters`

#### API Response Shape

```ts
{
  data: ProvinceCityEntry[]
}
```

#### Implementation Steps

1. Update `/api/public/ph-provinces-cities` to read enriched JSON.
2. Update Zod schema to validate the new shape.
3. Adjust client response typing to `ProvinceCityEntry[]`.

#### Testing Checklist

- [ ] API returns new structure
- [ ] Client schema validation passes

---

## Phase Completion Checklist

- [ ] Generator script written + outputs produced
- [ ] API + client schemas updated
- [ ] No TypeScript errors
