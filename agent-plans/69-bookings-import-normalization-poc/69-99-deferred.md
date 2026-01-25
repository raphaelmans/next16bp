# Deferred Work

Items explicitly out of scope for the PoC script.

---

## Deferred Features

| Feature | Priority | Reason Deferred |
|---------|----------|-----------------|
| In-app owner import UI | High | PoC is CLI-only to validate parsing + normalization contracts |
| Persisted import job + one-time AI gating (per place) | High | Requires new DB tables + owner UX |
| Mapping to real `courtId` | High | Needs place context + court selection/mapping UI |
| Writing `court_block` rows | Medium | PoC intentionally avoids DB writes |
| Idempotent re-import / de-duplication by event UID | Medium | Requires storage of external IDs and conflict strategy |
| Non-hour blocks / rounding strategy | Medium | Current scope enforces hour-aligned blocks only; rounding is a product decision |
| Full sport taxonomy | Low | PoC uses current seeded sports only |
