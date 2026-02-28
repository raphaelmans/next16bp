# Payments

## Purpose

KudosCourts operates in the Philippines where online card payments are not the default for many customers. The payment system is designed around manual/offline payment methods common in the local market — bank transfers, mobile wallets (GCash, PayMaya), and cash.

## How Payment Works (Happy Path)

1. **Player books a court.** A reservation is created with the total cost calculated from the court's hourly rate multiplied by the duration, plus any selected add-ons.
2. **Owner accepts the booking.** The reservation moves to "Awaiting Payment." The player is notified.
3. **Player sees payment instructions.** The payment page shows the owner's configured payment methods — bank account details, mobile wallet numbers — with instructions on how to pay.
4. **Player transfers payment externally.** The player sends money via GCash, bank app, or another method outside KudosCourts.
5. **Player uploads proof.** The player enters the reference number, optionally uploads a screenshot, and clicks "I Have Paid."
6. **Owner verifies payment.** The owner sees the proof (reference number, screenshot) and clicks "Confirm Payment."
7. **Reservation is confirmed.** Both parties are notified.

## Payment Methods (Owner Configuration)

Owners configure their accepted payment methods in Settings:

**Bank Account:**
- Supported banks: BPI, BDO, and other Philippine banks
- Fields: Account name, account number, instructions

**Mobile Wallet:**
- Supported: GCash, PayMaya
- Fields: Account name, account number, instructions

Owners can:
- Add multiple payment methods
- Set one as default
- Mark methods as active/inactive
- Edit details
- Delete methods
- Customize the order in which they appear to players

## Payment Page (Player Experience)

When a player needs to pay:

- A countdown timer shows how long they have to complete payment (configurable, typically 15 minutes to 24 hours)
- All of the owner's active payment methods are listed with full details and instructions
- Copy-to-clipboard buttons for bank account numbers and payment references
- Upload form for payment proof:
  - Reference number (e.g., GCash transaction ID)
  - Optional notes
  - Optional file upload (receipt screenshot)
- Terms and conditions checkbox
- "I Have Paid" submission button

### Group Payments

For multi-court bookings (reservation groups):
- A single payment covers all courts in the group
- The payment page shows the itemized breakdown and total
- One proof submission marks all reservations in the group as paid

## Owner Payment Confirmation

When a player marks a reservation as paid:

- The owner receives a notification (push + inbox; no email currently)
- The reservation list shows the "Payment Marked" status
- The owner can review the proof (reference number, screenshot) on the reservation detail
- Actions available:
  - **Confirm Payment** — Reservation moves to CONFIRMED
  - **Mark as Paid Offline** — For walk-in/cash payments where the owner received payment in person. Requires selecting the payment method used and entering a reference number.
  - **Reject** — If the proof is insufficient or fraudulent

## Free Bookings

If a court has no pricing configured (rate is zero), the payment flow is skipped entirely. The reservation goes directly from "Accepted" to "Confirmed."

## Payment Expiration

If the player does not pay within the allowed window, the reservation expires automatically. The slot becomes available for other players.

## What the Platform Does NOT Handle (Currently)

- **No in-platform payments.** KudosCourts does not process payments through the platform itself. All money moves externally between the player and the venue.
- **No refund processing.** Refunds, if any, are handled offline between the player and the venue.
- **No automated payment verification.** The owner must manually verify every payment proof. There is no integration with bank APIs or wallet APIs to auto-confirm.
- **No platform commission or transaction fees.** The platform does not take a cut of bookings (current model).
- **No invoicing or receipts.** The platform does not generate formal invoices or payment receipts.

## Business Context

The manual payment flow is intentional — it matches the current behavior in the Philippine sports booking market where GCash transfers and bank screenshots are the standard. Automating this (e.g., integrating GCash API or Stripe for card payments) is a future opportunity but not required for market entry.
