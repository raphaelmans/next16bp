# Flow: Player Books a Reservation

## Variant A — No User (Unauthenticated)

**Precondition**: Not logged in

| # | Step | Route / Action | Expected Result |
|---|------|---------------|-----------------|
| 1 | Open courts listing | `/courts` | Search page loads with court/venue cards, filters (province, city, sport), map/list toggle |
| 2 | Search or browse for a reservable court | Use filters or scroll | Results update; cards show venue name, location, sport icons |
| 3 | Click a venue card | `/venues/{slug}` | Venue detail page: photo carousel, court list, amenities, booking card in sidebar |
| 4 | Select date and time slot on the booking card | Interact with date picker + time grid | Available slots highlighted; selecting a slot populates the booking card summary |
| 5 | Click "Reserve Now" | Redirects to `/login?redirect=/venues/{slug}` | Login/register page loads with redirect param preserved in URL |
| 6 | Register or log in | Complete auth (email+password or Google) | After auth, redirected back to the venue detail page (`/venues/{slug}`) |
| 7 | Re-select date/time and click "Reserve Now" | `/venues/{placeId}/book?startTime=...&duration=...&sportId=...&mode=...` | Review booking page loads: court info, time, price summary, profile preview card |
| 8 | Profile incomplete — click "Edit" on profile card | `/account/profile?redirect={encoded_booking_url}` | Profile form loads with redirect param in URL |
| 9 | Fill required fields (display name, email or phone) and save | Submit profile form | Redirected back to review booking page; profile card now shows green/complete |
| 10 | Accept terms and click "Confirm Booking" | tRPC mutation fires | Reservation created; redirected to `/reservations/{id}` (or `/reservations/{id}/payment` if payment required) |

### Edge Cases

- Redirect URL survives the full login round-trip (step 5 → 6)
- Booking params survive the profile-edit round-trip (step 7 → 8 → 9)
- Disabled "Confirm" button when profile is incomplete or terms unchecked
- Payment flow loads correctly if venue requires payment proof

---

## Variant B — Newly Registered User

**Precondition**: Logged in, profile incomplete (just registered)

| # | Step | Route / Action | Expected Result |
|---|------|---------------|-----------------|
| 1 | Open courts listing | `/courts` | Search page loads with court/venue cards, filters (province, city, sport), map/list toggle |
| 2 | Search or browse for a reservable court | Use filters or scroll | Results update; cards show venue name, location, sport icons |
| 3 | Click a venue card | `/venues/{slug}` | Venue detail page: photo carousel, court list, amenities, booking card in sidebar |
| 4 | Select date and time slot on the booking card | Interact with date picker + time grid | Available slots highlighted; selecting a slot populates the booking card summary |
| 5 | Click "Reserve Now" | `/venues/{placeId}/book?startTime=...&duration=...&sportId=...&mode=...` | Review booking page loads directly (no auth redirect); profile preview card shows incomplete |
| 6 | Profile incomplete — click "Edit" on profile card | `/account/profile?redirect={encoded_booking_url}` | Profile form loads with redirect param in URL |
| 7 | Fill required fields (display name, email or phone) and save | Submit profile form | Redirected back to review booking page; profile card now shows green/complete |
| 8 | Accept terms and click "Confirm Booking" | tRPC mutation fires | Reservation created; redirected to `/reservations/{id}` (or `/reservations/{id}/payment` if payment required) |

### Edge Cases

- No auth redirect occurs (user is already logged in)
- Booking params survive the profile-edit round-trip (step 5 → 6 → 7)
- Disabled "Confirm" button when profile is incomplete or terms unchecked
- Payment flow loads correctly if venue requires payment proof

---

## Key Routes

| Route | Purpose |
|-------|---------|
| `/courts` | Court/venue search listing |
| `/venues/{slug}` | Venue detail + booking card |
| `/login?redirect=...` | Auth with redirect preservation |
| `/venues/{placeId}/book?...` | Review booking page |
| `/account/profile?redirect=...` | Profile edit with return redirect |
| `/reservations/{id}` | Reservation confirmation |
