# US-10-02: Player Uploads Payment Proof

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **Player**, I want to **upload a screenshot of my payment** so that **the court owner can verify I have paid for the reservation**.

---

## Acceptance Criteria

### Happy Path: Upload Payment Proof

- Given I am logged in as a player
- And I have a reservation in `AWAITING_PAYMENT` or `PAYMENT_MARKED_BY_USER` status
- And I am on the payment confirmation page
- When I click the payment proof upload area
- And I select a valid image file (JPEG, PNG, or WebP under 5MB)
- Then I see a preview of the uploaded proof
- And the file is uploaded to Supabase Storage
- And the proof URL is associated with my reservation

### Happy Path: Upload Multiple Proofs

- Given I am logged in as a player
- And I have already uploaded one payment proof
- When I upload another proof image
- Then both proofs are stored
- And the owner can see all uploaded proofs

### Happy Path: View Own Payment Proof

- Given I am logged in as a player
- And I have uploaded a payment proof for my reservation
- When I view my reservation details
- Then I can see the payment proof image(s) I uploaded

### Validation: Cannot Upload for Others' Reservations

- Given I am logged in as a player
- When I try to upload a payment proof for a reservation that is not mine
- Then I receive an authorization error
- And the file is not uploaded

### Validation: Cannot Upload for Confirmed/Expired Reservations

- Given I am logged in as a player
- And my reservation is in `CONFIRMED`, `EXPIRED`, or `CANCELLED` status
- When I try to upload a payment proof
- Then I see an error message "Cannot upload proof for this reservation"
- And the file is not uploaded

### Security: Owner Can View Payment Proof

- Given I am a court owner
- And a player has uploaded a payment proof for a reservation at my court
- When I view the pending reservation details
- Then I can see the player's payment proof image(s)

### Security: Other Players Cannot View Proof

- Given I am logged in as a different player
- When I try to access another player's payment proof via guessed path
- Then I receive an access denied error

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Upload fails mid-transfer | Show error, allow retry, no partial file |
| Reservation expires during upload | Complete upload, but mark as expired |
| Very large screenshot (mobile) | Warn about file size before upload |
| Player accidentally uploads wrong image | Allow uploading additional images |
| Owner has not confirmed after multiple proofs | All proofs remain accessible |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Payment Proof | file (image) | Optional |
| Reference Number | text | Optional (existing field) |

---

## Technical Notes

- **Bucket:** `payment-proofs`
- **Path:** `{reservationId}/{timestamp}.{ext}`
- **Upsert:** No (allow multiple uploads)
- **RLS Policy:** 
  - Player can INSERT for own reservations only
  - Player can SELECT own proofs
  - Owner can SELECT proofs for reservations at their courts

---

## References

- PRD: Section 7 (Journey 3, Step 8 - Uploads proof)
- PRD: Section 8.3 (Reservation Lifecycle - Paid Courts)
- Existing schema: `src/shared/infra/db/schema/payment-proof.ts`
