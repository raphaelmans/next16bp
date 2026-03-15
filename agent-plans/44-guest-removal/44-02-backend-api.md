# Phase 2: Backend API + Validation

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-18-01, US-18-02

---

## Objective

Introduce a public removal request endpoint for guests and enforce validation rules while reusing existing claim request services and admin review flows.

---

## Modules

### Module 2A: Public Removal Request Endpoint

**User Story:** `US-18-01`

#### Router

Add a new mutation to `claimRequestRouter`:

| Endpoint | Procedure | Input | Output |
|----------|-----------|-------|--------|
| `claimRequest.submitGuestRemoval` | public + rateLimited(sensitive) | `SubmitGuestRemovalRequestSchema` | `ClaimRequestRecord` |

#### Service Method

Extend `ClaimRequestService` with:

```ts
submitGuestRemovalRequest(data: SubmitGuestRemovalRequestDTO, ctx?: RequestContext): Promise<ClaimRequestRecord>
```

Rules:

- Validate place exists and is curated
- Block if a pending claim/removal already exists
- Create claim request with `requestType=REMOVAL`
- Store guest name/email on the request
- Set place `claimStatus` to `REMOVAL_REQUESTED`
- Create claim request event with `triggeredByUserId` using a system/admin fallback ID

---

### Module 2B: Guest Request Rules + Auditing

**User Story:** `US-18-02`

#### Audit Strategy

- Use a system user id (config/env) or admin service user for guest events
- Notes should include that the request was submitted by a guest

#### Error Handling

- Reuse `PendingClaimExistsError`
- Reuse `NotCuratedPlaceError`
- Add `GuestRemovalNotAllowedError` if place not curated or already removal requested

---

## Testing Checklist

- [ ] Guest removal request creates claim_request with guest metadata.
- [ ] Place claim status updates to `REMOVAL_REQUESTED`.
- [ ] Duplicate pending requests are blocked.
- [ ] Audit events are created for guest submissions.
