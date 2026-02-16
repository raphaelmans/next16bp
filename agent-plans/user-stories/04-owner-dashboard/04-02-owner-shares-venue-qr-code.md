# US-04-02: Owner Generates and Shares Venue QR Codes

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **Owner**, I want to **generate a QR code for each venue from my owner venues page** so that **I can quickly share or print a scannable link to the public venue listing**.

---

## Acceptance Criteria

### QR Action Is Available Per Venue

- Given I am an authenticated owner with at least one venue
- When I visit `/owner/venues`
- Then each venue card shows a `QR Code` action
- And selecting it opens a modal with the venue QR code

### QR Encodes Canonical Public Venue Route

- Given a venue has a slug
- When the QR code is generated
- Then it encodes `/venues/{slug}`
- And scanning opens the public venue page

- Given a venue does not yet have a slug
- When the QR code is generated
- Then it encodes `/venues/{venueId}`
- And the public route still resolves correctly

### Owner Can Download PNG and SVG

- Given the QR dialog is open
- When I click `PNG`
- Then a PNG file download starts

- Given the QR dialog is open
- When I click `SVG`
- Then an SVG file download starts

### Owner Can Share or Copy Venue Link

- Given my browser supports Web Share API
- When I click `Share`
- Then a native share sheet opens with the venue URL

- Given my browser does not support Web Share API
- When I click `Share`
- Then the venue URL is copied to clipboard as fallback

### QR Is Scannable for Print and Digital

- Given the QR code is rendered in the dialog
- Then it uses a white background and quiet zone margin
- And it is large enough for common camera scans

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| `NEXT_PUBLIC_APP_URL` is not configured | Build absolute URL from `window.location.origin` at runtime |
| Browser blocks direct file download | Fallback opens the generated file in a new tab |
| Owner cancels native share sheet | No error toast; action exits silently |
| Clipboard write fails | Show error toast and keep dialog open |
| Venue slug updates later | Newly rendered QR uses latest `slug ?? id` value |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Owner persona and venue management flows)
- Route constants: `src/common/app-routes.ts`
- Owner venues UI: `src/app/(owner)/owner/places/page.tsx`
- Public venue route alias: `src/app/(public)/venues/[placeId]/page.tsx`
