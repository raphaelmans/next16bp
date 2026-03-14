# Decision Journal

Use this file to capture consequential decisions and their confidence scores.

## Template

- Decision: <short description>
- Chosen Option: <what we picked>
- Confidence: <0-100>
- Alternatives Considered: <comma-separated list>
- Reasoning: <why this is the safest/pragmatic choice>
- Reversibility: <easy|medium|hard>
- Timestamp (UTC ISO 8601): <YYYY-MM-DDTHH:MM:SSZ>

## Entries

### DEC-001

- Decision: Shape the shared player reservation detail response for coach targets in Step 1
- Chosen Option: Keep the existing venue fields in `ReservationDetail`, add `targetType` plus nullable `coach`, and allow `getReservationLinkedDetail()` to return `null` for single coach reservations
- Confidence: 72
- Alternatives Considered: introduce a brand new coach-only player detail route, replace the response with a strict union type, fake venue placeholders for coach reservations
- Reasoning: This keeps the shared route working with minimal API churn, avoids lying with fake court/place records, and lets the page branch cleanly while preserving current venue consumers
- Reversibility: medium
- Timestamp (UTC ISO 8601): 2026-03-14T19:16:09Z

### DEC-002

- Decision: Use focused validation evidence to finalize Step 1 instead of waiting on repo-wide `pnpm lint`
- Chosen Option: Treat targeted Biome checks, focused Vitest coverage, and TypeScript validation as the Step 1 gate while documenting that repo-wide lint is still red for unrelated tracked files
- Confidence: 76
- Alternatives Considered: block Step 1 finalization on unrelated repo lint debt, expand this iteration to fix unrelated Biome issues outside the coach reservation scope
- Reasoning: The implementation itself is already shipped on `HEAD`; the cleanest atomic follow-up is to verify the touched reservation paths again, update the recovery artifact, and avoid mixing unrelated lint cleanup into this objective
- Reversibility: easy
- Timestamp (UTC ISO 8601): 2026-03-15T03:17:00Z
