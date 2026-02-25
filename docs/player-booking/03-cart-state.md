# Cart State Machine

The booking cart is an XState v5 machine (`bookingCartMachine`) with explicit states. It holds up to 12 court reservations for a single checkout.

## Context Shape

```ts
type BookingCartContext = {
  items: BookingCartItem[];           // max 12, in-memory only
  maxItems: number;                    // default 12
  placeTimeZone: string;
  lastValidationError: string | null;  // set on rejected ADD_ITEM
};

type BookingCartItem = {
  key: string;              // "${courtId}|${startTime}|${durationMinutes}"
  courtId: string;
  courtLabel: string;
  sportId: string;
  startTime: string;        // ISO
  durationMinutes: number;
  estimatedPriceCents: number | null;
  currency: string;
};
```

## Machine States

```
                    +-------+
                    | empty |  <-- initial
                    +-------+
                        |
              [ADD_ITEM]
              (guard: canAddItem)
                        |
                        v
                   +----------+
             +---->| hasItems |<----+
             |     +----------+     |
             |      |    |    |     |
      [ADD_ITEM]    |    |   [REMOVE_ITEM]
      (guarded)     |    |          |
             +------+    |     +----+
                         |     |
                  items.length after remove === 0?
                    yes -> back to empty
                    no  -> stay in hasItems

              [REQUEST_CHECKOUT]
                         |
                         v
                   +----------+
                   | checkout |
                   +----------+
                         |
              [CANCEL_CHECKOUT]
                         |
                         v
                   +----------+
                   | hasItems |
                   +----------+
```

## ADD_ITEM Validation (guard-driven)

When the orchestrator sends `ADD_ITEM`, the machine's `canAddItem` guard runs two layers of validation:

### Layer 1: Key Dedup

```
isBookingCartKeyDuplicate({ cartItems, key })
  |
  key already in cart?
    yes -> guard returns false -> rejectItem action
           sets lastValidationError = "DUPLICATE_KEY"
    no  -> continue to layer 2
```

### Layer 2: Business Rules

```
validateBookingCartAdd({ cartItems, candidate, placeTimeZone })
  |
  cart empty?
    yes -> guard returns true (always valid)
    no  -> check rules:
           |
           +-- Same calendar day? (in place timezone)
           |     no -> guard returns false
           |           lastValidationError = "DIFFERENT_DAY"
           |
           +-- Court already in cart?
                 yes -> guard returns false
                        lastValidationError = "DUPLICATE_COURT"
                 no  -> guard returns true
```

### Layer 3: Max Items (guard-level)

```
items.length >= maxItems?
  yes -> guard returns false, lastValidationError = "MAX_REACHED"
  no  -> proceed
```

The orchestrator reads `lastValidationError` from cart context to show appropriate toast messages.

## Post-Add Side Effects (bridge in orchestrator)

After a successful cart add, these happen in sequence via the `useBookingMachines` bridge:

```
[1] sendCart({ type: "ADD_ITEM", item })        cart item appended

[2] sendTimeSlot({ type: "CART_ITEM_ADDED", courtMemoryKey })
    Machine action (computeCartItemAdded):
      +-- startTime -> null                      selection cleared
      +-- courtMemory[key] -> removed            carted court's memory cleared
    Why: switching back to this court later should NOT restore
         a slot that's already in the cart
```

## Cart Clear Triggers

| Trigger | Event | When |
|---------|-------|------|
| Sport change | `SPORT_CHANGED { sportId }` | Filters out items with different sportId |
| Component unmount | `CLEAR_CART` | `useEffect` cleanup in booking-section |
| Navigate away | Natural GC | In-memory machine, no persistence |

## CTA Decision Table

The sidebar/footer CTA adapts to cart + selection state:

```
+------------------+--------------+----------------------------+----------------+
| Cart Items       | Has Selection| CTA Label                  | Action         |
+------------------+--------------+----------------------------+----------------+
| 0                | no           | "Select a time" (outline)  | open sheet     |
| 0                | yes          | "Continue to review"       | single checkout|
| 1+               | no           | "Continue to checkout (N)" | cart checkout  |
| 1+               | yes          | "Continue to checkout (N)" | cart checkout  |
+------------------+--------------+----------------------------+----------------+
```

Desktop CTA action flow:

```
handleSummaryAction()
  |
  +-- canCheckoutBookingCart? (items > 0 && !hasSelection)
  |     yes -> handleReserve()  [cart checkout]
  |
  +-- summaryCta.shouldProceed?
  |     yes -> handleReserve()  [single selection checkout]
  |
  +-- mobile viewport (< 1024px)?
  |     yes -> open mobile sheet
  |
  +-- else -> scroll to availability section
```

## Checkout URL Encoding

### Multi-court (cart) path

```
/places/{slug}/book?sportId={sportId}&items={courtId}|{startTime}|{duration},{courtId}|{startTime}|{duration},...
```

Built by `buildCartCheckoutUrl()` in `helpers/build-checkout-url.ts`.

### Single-court path

```
/places/{slug}/book?duration={min}&mode={any|court}&sportId={id}&date={dayKey}&courtId={id}&addonIds={encoded}&startTime={iso}
```

Built by `buildSingleCheckoutUrl()` in `helpers/build-checkout-url.ts`.

Both paths check `isAuthenticated`:
- Authenticated -> direct push
- Not authenticated -> redirect to login with `returnTo`
