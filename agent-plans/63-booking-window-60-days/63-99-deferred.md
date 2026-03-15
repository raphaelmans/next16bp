# Deferred Work (Booking Window)

Items explicitly out of scope for the 60-day booking window enforcement.

---

## Retention / Pruning of `time_slot`

Even with a 60-day creation cap, `time_slot` will continue to grow over time unless historical `AVAILABLE` rows are pruned or archived.

Deferred options:

- Nightly job: delete `AVAILABLE` rows older than N days (keep `HELD/BOOKED/BLOCKED` if still used).
- Partition `time_slot` by month and drop old partitions (if historical data is not required).
- Replace materialized availability with rules+exceptions model (larger architectural change).
