## 1. Player Booking E2E Path

- [ ] 1.1 Ensure player auth helper uses explicit login redirect and validates authenticated booking entry state.
- [ ] 1.2 Implement deterministic slot-selection flow for `Book` + `Pick a court` covering Week/Day UI variants.
- [ ] 1.3 Ensure the flow proceeds to review and confirms booking with required terms interaction.

## 2. Awaiting-Owner-Confirmation Assertions

- [ ] 2.1 Assert reservation detail route is reached after submit.
- [ ] 2.2 Assert status signals: `data-status="CREATED"`, "Owner review is in progress.", and "Reservation requested".

## 3. Fixture and Reliability Guardrails

- [ ] 3.1 Add explicit failure diagnostics when no selectable slot is exposed for fixture venue.
- [ ] 3.2 Retain and document artifact-driven debugging flow (screenshot/video/error-context) for e2e failures.
- [ ] 3.3 Verify and document single-spec execution command for local validation.
