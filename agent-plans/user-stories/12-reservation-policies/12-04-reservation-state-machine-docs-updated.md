# US-12-04: Reservation State Machine Docs Updated

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **product and engineering team**, we want the **reservation state machine documentation to reflect the current behavior** so that **stakeholders share the same understanding of reservation rules and TTLs**.

---

## Acceptance Criteria

### Documentation Update

- Given reservation policies are implemented
- When the docs are reviewed
- Then `docs/reservation-state-machine.md` and its linked levels are updated to reflect:
  - Court-specific TTL behavior
  - Optional owner confirmation behavior
  - Player cancellation across all states (with cutoff)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Docs disagree with implementation | Implementation is treated as source of truth; docs must be corrected |

---

## References

- `docs/reservation-state-machine.md`
