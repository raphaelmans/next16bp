# Developer 1 Checklist

**Focus Area:** Discovery list perf + lazy card details

---

## Backend

- [ ] Add `place.listSummary` (filters + ordering, no hydration)
- [ ] Add `place.cardMediaByIds` (cover image + org logo)
- [ ] Add `place.cardMetaByIds` (sports + courtCount + price + verification)
- [ ] Use `Promise.all` inside endpoints for independent queries

---

## Frontend

- [ ] Add hooks for summary + batched details (`trpc.useQueries`)
- [ ] Add `DiscoveryPlaceCard` wrapper with skeleton sub-sections
- [ ] Switch `/courts` to new model (keep pagination)

---

## Validation

- [ ] Verify no N+1 requests (should be 1 summary + 2 batched details)
- [ ] `pnpm lint`
- [ ] `pnpm build`
