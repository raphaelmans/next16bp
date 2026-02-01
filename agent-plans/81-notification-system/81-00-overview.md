# Notification System (Email + SMS) - Master Plan

This plan introduces an async notification delivery system (outbox + cron dispatcher) using:
- Email: Resend (already integrated)
- SMS: Semaphore (new adapter)

Primary MVP event:
- `place_verification.requested` -> notify admins when an owner submits a verification request.

Secondary (optional / follow-on):
- Reservation lifecycle notifications (owner/player), using the same outbox.

## Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Place verification stories | `agent-plans/user-stories/19-place-verification/` |
| Current notification notes | `docs/notification-system/README.md` |
| Reservation TTL contract (style reference for docs levels) | `docs/reservation-state-machine.md` |
| Place verification services (enqueue chokepoint) | `src/lib/modules/place-verification/services/place-verification.service.ts` |

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Delivery model | DB outbox + cron dispatcher | Non-blocking, retryable, auditable, vendor-swappable |
| Provider boundary | Strategy/adapter per channel | Allows swapping vendors without touching domain services |
| Admin recipients | Role-based: `user_roles.role = "admin"` joined to `profile` | Central source of truth for admin set |
| SMS format | PH normalization via `src/common/phone.ts` | Semaphore expects dialable numbers; inputs vary |
| Idempotency | Unique `idempotencyKey` per job; Resend uses Idempotency-Key header | Prevents duplicates on retries/replays |

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|---------------|
| 1 | Server foundation (schema + adapters + enqueue API) | 1A, 1B | Yes |
| 2 | Server dispatcher cron (claim + send + retry) | 2A | Partial |
| 3 | Wire MVP event producers (place verification -> admin) | 3A | Yes |
| 4 | Docs + client polish (docs state machine levels; optional UI copy) | 4A, 4B | Yes |

## Module Index

### Phase 1: Foundation

| ID | Module | Owner | Plan File |
|----|--------|-------|-----------|
| 1A | DB schema: outbox jobs + enums | Server | `81-01-server-foundation.md` |
| 1B | Provider adapters: SMS (Semaphore) + email integration usage | Server | `81-01-server-foundation.md` |

### Phase 2: Dispatcher

| ID | Module | Owner | Plan File |
|----|--------|-------|-----------|
| 2A | Cron dispatcher route: claim batch + send + retry | Server | `81-02-server-dispatcher.md` |

### Phase 3: MVP wiring

| ID | Module | Owner | Plan File |
|----|--------|-------|-----------|
| 3A | Enqueue admin notification on verification submit | Server | `81-02-server-dispatcher.md` |

### Phase 4: Docs + client

| ID | Module | Owner | Plan File |
|----|--------|-------|-----------|
| 4A | Notification state machine docs (levels + ASCII) | Client/Docs | `81-03-client-docs.md` |
| 4B | Client polish (copy, deep links, optional "we notified admins" hint) | Client | `81-03-client-docs.md` |

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 (Server) | 1A, 1B, 2A, 3A | DB schema, adapters, cron dispatcher, enqueue wiring |
| Dev 2 (Client/Docs) | 4A, 4B | Docs under `docs/notification-system/` + small UI text updates |

## Dependencies Graph

```text
Phase 1 (schema+adapters)
  |
  +--> Phase 2 (dispatcher)
  |
  +--> Phase 3 (enqueue place_verification.requested)
  |
  +--> Phase 4 (docs + client polish)
```

## Success Criteria

- [ ] Admins receive email and/or SMS when an owner submits verification.
- [ ] Delivery is async (owner submission does not block on vendors).
- [ ] Jobs are idempotent and retry with backoff.
- [ ] Cron route is protected by `CRON_SECRET`.
- [ ] `pnpm lint` passes.
- [ ] `TZ=UTC pnpm build` passes.
