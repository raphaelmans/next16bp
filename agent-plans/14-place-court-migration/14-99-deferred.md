# Deferred Work (Place/Court Migration)

Items explicitly out of scope for the current v1.2 migration plan.

---

## Deferred Features

| Feature | Priority | Reason Deferred |
|---------|----------|-----------------|
| Multi-sport per court | Low | Explicitly avoided (1 court = 1 sport) |
| Variable start-time increments (15/30 min) | Medium | Locked to 60-min granularity |
| Database exclusion constraints for overlaps | Medium | Repository-level checks are sufficient for now |
| Seasonal/date-range pricing rules | Medium | Not required for v1.2 |
| Blackouts/closures by date (maintenance) | Medium | Useful, but not required to ship core flows |
| Automated slot generation from hours/pricing | Medium | Owner bulk-create exists; automation can come later |

---

## When to Revisit

- After core flows are stable in production
- When owners request automated scheduling or seasonal pricing
