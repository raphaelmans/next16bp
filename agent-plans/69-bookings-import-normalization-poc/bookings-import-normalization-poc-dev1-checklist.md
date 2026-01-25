# Bookings Import Normalization PoC - Dev 1 Checklist

**Focus Area:** CLI script + parsing + AI mapping spec  
**Plan:** `agent-plans/69-bookings-import-normalization-poc/69-00-overview.md`

---

## Phase 1: Scaffolding

- [ ] Add `script:normalize-data` pnpm script
- [ ] Add `scripts/normalize-data.ts` skeleton + CLI arg parsing
- [ ] Add Zod schemas for mapping spec + output payload

## Phase 2: Deterministic Parsing

- [ ] CSV parsing (headers + rows)
- [ ] XLSX parsing (sheet -> headers + rows)
- [ ] ICS parsing + RRULE expansion within `rangeStart/rangeEnd`

## Phase 3: AI Mapping + Deterministic Normalization

- [ ] Add AI SDK provider call (OpenAI `gpt-5.2`) to produce mapping spec
- [ ] Implement `--mapping-file` and `--no-ai`
- [ ] Normalize to blocks with `resourceId` mapping
- [ ] Detect multi-court and produce `resources[]`
- [ ] Best-effort sport detection

## Phase 4: Polish + QA

- [ ] Clear error output for missing/unsupported files
- [ ] Output is a single JSON object to stdout
- [ ] Add sample invocations in plan doc (or README)

## Verification

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
