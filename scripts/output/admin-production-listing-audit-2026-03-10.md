# Production Listing Audit

Generated at: `2026-03-10T05:00:27Z`

Source:
- Production `DATABASE_URL` from `.env.production`
- Read-only audit only
- No database writes performed

Tracking buckets:
- `curated_place` = `place.place_type = 'CURATED'`
- `org_created_place` = `place.place_type = 'RESERVABLE'`

Headline:
- The platform is not near 400 listings yet.
- Active places in production: `352`
- Active places excluding obvious non-production/test slugs: `349`
- Public-ready places by current trust/indexability rules: `327`

## Summary

| Tracking bucket | Active places | Active excluding nonprod/test slug | Public-ready places | Test-like places | Missing trust signal | Zero active courts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `curated_place` | 345 | 344 | 324 | 1 | 20 | 0 |
| `org_created_place` | 7 | 5 | 3 | 2 | 0 | 0 |

## Test-Like Active Places

| Tracking bucket | Slug | Name | City | Province | Active courts |
| --- | --- | --- | --- | --- | ---: |
| `curated_place` | `test-clubs` | Test Clubs | CEBU CITY | CEBU | 1 |
| `org_created_place` | `test-kudos-courts-complex` | [TEST] Kudos Courts Complex | CEBU CITY | CEBU | 2 |
| `org_created_place` | `test-pickleball-venue` | Test Pickleball Venue | CEBU CITY | CEBU | 1 |

## Curated Places Missing Trust Signals

Definition:
- Active curated place
- Has at least 1 active court
- Has no place photos
- Has no contact details
- Has no verification record with status `VERIFIED`

Count: `20`

| Slug | Name | City | Province | Active courts | Photos | Has contact details | Verification |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| `kartways-pickleball-court` | Kartways Pickleball Court | PANGLAO | BOHOL | 1 | 0 | `false` | `NONE` |
| `camsur-pickleball-club` | CamSur Pickleball Club | PILI | CAMARINES SUR | 1 | 0 | `false` | `NONE` |
| `phoenix-pickleball-club` | Phoenix Pickleball Club | KAWIT | CAVITE | 1 | 0 | `false` | `NONE` |
| `new-town-estate` | New Town Estate | CEBU CITY | CEBU | 2 | 0 | `false` | `NONE` |
| `pino-pickleball-courts` | Pino Pickleball Courts | CEBU CITY | CEBU | 1 | 0 | `false` | `NONE` |
| `visayan-glass-basketball-gym` | Visayan Glass Basketball Gym | CEBU CITY | CEBU | 1 | 0 | `false` | `NONE` |
| `match-point-sports-center-and-cafe-cebu` | Match Point Sports Center and Cafe Cebu | CONSOLACION | CEBU | 1 | 0 | `false` | `NONE` |
| `pickle-jar-courts` | Pickle Jar Courts | CABUYAO CITY | LAGUNA | 5 | 0 | `false` | `NONE` |
| `the-dink-yard` | The Dink Yard | CABUYAO CITY | LAGUNA | 4 | 0 | `false` | `NONE` |
| `the-pickle-co-1016` | The Pickle & Co. 1016 | CALAMBA CITY | LAGUNA | 7 | 0 | `false` | `NONE` |
| `revel-grove` | Revel Grove | SANTA ROSA CITY | LAGUNA | 1 | 0 | `false` | `NONE` |
| `the-3rd-shot-homecourt` | The 3rd Shot Homecourt | CITY OF MAKATI | METRO MANILA | 1 | 0 | `false` | `NONE` |
| `the-pickle-spot-makati` | The Pickle Spot Makati | CITY OF MAKATI | METRO MANILA | 1 | 0 | `false` | `NONE` |
| `east-side-hoops` | East Side Hoops | BACOLOD CITY | NEGROS OCCIDENTAL | 1 | 0 | `false` | `NONE` |
| `lopues-south-square-badminton-court` | Lopue's South Square Badminton Court | BACOLOD CITY | NEGROS OCCIDENTAL | 1 | 0 | `false` | `NONE` |
| `city-sports-park-badminton-court` | City Sports Park, Badminton Court | SAN CARLOS CITY | NEGROS OCCIDENTAL | 1 | 0 | `false` | `NONE` |
| `pickle-pro-courts-cafe` | Pickle Pro Courts & Cafe | DUMAGUETE CITY | NEGROS ORIENTAL | 1 | 0 | `false` | `NONE` |
| `the-grand-line-pickleball-court` | The Grand Line Pickleball Court | SIBULAN | NEGROS ORIENTAL | 1 | 0 | `false` | `NONE` |
| `the-court-avenue-sports-lifestyle-corporation` | THE COURT AVENUE SPORTS & LIFESTYLE CORPORATION | SAN FERNANDO CITY | PAMPANGA | 1 | 0 | `false` | `NONE` |
| `pickle-camp` | Pickle Camp | SAN MATEO | RIZAL | 1 | 0 | `false` | `NONE` |

## Admin Takeaways

- Do not use "almost 400 listings" yet.
- Best broad internal count after removing obvious test records: `349`
- Best curated-only internal count after removing obvious test records: `344`
- Best public-ready count under current trust/indexability rules: `327`
