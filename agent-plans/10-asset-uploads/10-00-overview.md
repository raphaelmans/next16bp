# Asset Uploads - Implementation Plan

## Overview

This plan implements file upload functionality using Supabase Storage with server-side upload via tRPC. Files are uploaded through tRPC endpoints using `zod-form-data` for FormData handling, then stored in Supabase Storage buckets.

### Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Infrastructure (tRPC + Storage Module) | **COMPLETE** |
| Phase 2A | Avatar Upload | Pending |
| Phase 2B | Court Photos Upload | Pending |
| Phase 2C | Payment Proof Upload | Pending |
| Phase 2D | Organization Logo Upload | Pending |

### User Stories

| ID | Story | Priority | Status |
|----|-------|----------|--------|
| US-10-01 | Player Uploads Profile Avatar | High | Pending |
| US-10-02 | Player Uploads Payment Proof | High | Pending |
| US-10-03 | Owner Uploads Court Photos | High | Pending |
| US-10-04 | Owner Uploads Organization Logo | Medium | Pending |
| US-10-05 | Admin Uploads Court Photos | Medium | Pending |

### Reference Documents

| Document | Location |
|----------|----------|
| User Stories | `agent-plans/user-stories/10-asset-uploads/` |
| Context | `agent-plans/context.md` |

---

## Architecture

### Upload Flow

```
┌──────────┐    FormData    ┌───────────┐    File     ┌─────────────────┐
│  Client  │ ──────────────►│   tRPC    │ ──────────►│ Storage Service │
│ (React)  │                │  Router   │            │  (Supabase)     │
└──────────┘                └───────────┘            └─────────────────┘
                                  │                         │
                                  │ URL                     │ URL
                                  ▼                         │
                            ┌───────────┐                   │
                            │  Return   │◄──────────────────┘
                            │  to UI    │
                            └───────────┘
```

### Key Components (Implemented)

| Component | Location | Status |
|-----------|----------|--------|
| `splitLink` config | `src/components/providers.tsx` | Complete |
| `ObjectStorageService` | `src/modules/storage/services/object-storage.service.ts` | Complete |
| Storage DTOs | `src/modules/storage/dtos/upload.dto.ts` | Complete |
| Storage Errors | `src/modules/storage/errors/storage.errors.ts` | Complete |
| Storage Factory | `src/modules/storage/factories/storage.factory.ts` | Complete |

### Bucket Configuration (Manual in Supabase Dashboard)

| Bucket | Access | Purpose |
|--------|--------|---------|
| `avatars` | Private | Player profile pictures |
| `payment-proofs` | Private | Payment verification screenshots |
| `court-photos` | Private | Court images |
| `organization-assets` | Private | Organization logos |

---

## Development Phases

| Phase | Description | Dependencies | Status |
|-------|-------------|--------------|--------|
| 1 | Infrastructure (tRPC + Storage Module) | None | **Complete** |
| 2A | Avatar Upload | Phase 1 | Pending |
| 2B | Court Photos Upload | Phase 1 | Pending |
| 2C | Payment Proof Upload | Phase 1 | Pending |
| 2D | Organization Logo Upload | Phase 1 | Pending |

---

## Module Index

### Phase 1: Infrastructure (COMPLETE)

| ID | Module | Plan File | Status |
|----|--------|-----------|--------|
| 1A | tRPC FormData Configuration | `10-01-infrastructure.md` | Complete |
| 1B | Storage Module | `10-01-infrastructure.md` | Complete |

### Phase 2: Feature Uploads (Parallel)

| ID | Module | Developer | Plan File | Status |
|----|--------|-----------|-----------|--------|
| 2A | Profile Avatar Upload | Dev 1 | `10-02-avatar-upload.md` | Pending |
| 2B | Court Photos Upload | Dev 2 | `10-03-court-photos.md` | Pending |
| 2C | Payment Proof Upload | Dev 3 | `10-04-payment-proof.md` | Pending |
| 2D | Organization Logo Upload | Dev 2 | `10-05-org-logo.md` | Pending |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | ~~1A, 1B~~, 2A | ~~Infrastructure~~ + Profile |
| Dev 2 | 2B, 2D | Owner Features (Court Photos, Org Logo) |
| Dev 3 | 2C | Player Features (Payment Proof) |

---

## Dependencies Graph

```
Phase 1 (Infrastructure) [COMPLETE] ─────────────────────────────────┐
         │                                                            │
         ├────────────► Phase 2A (Avatar) [Ready to Start]           │
         │                                                            │
         ├────────────► Phase 2B (Court Photos) [Ready to Start]     │
         │                                                            │
         ├────────────► Phase 2C (Payment Proof) [Ready to Start]    │
         │                                                            │
         └────────────► Phase 2D (Org Logo) [Ready to Start]         │
                                                                      │
                         (All Phase 2 can run in parallel)            │
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Upload pattern | Server-side via tRPC | Consistent architecture, better security |
| FormData handling | `zod-form-data` + tRPC v11 native | Type-safe, tRPC v11 handles FormData natively |
| Storage module | `src/modules/storage/` | Follows backend-module architecture |
| Upload endpoints | Separate from entity update | Simpler, reusable, better error handling |
| Bucket access | All private initially | Simpler RLS, defer public optimization |

---

## Package Dependencies

Already installed:

```json
{
  "zod-form-data": "^2.0.7"
}
```

**Note:** tRPC v11 handles FormData, File, Blob, and ReadableStream natively via `isNonJsonSerializable` and `splitLink`. No custom transformer needed.

---

## Document Index

| Document | Description | Status |
|----------|-------------|--------|
| `10-00-overview.md` | This file | - |
| `10-01-infrastructure.md` | Phase 1: tRPC config + Storage module | **Complete** |
| `10-02-avatar-upload.md` | Phase 2A: Profile avatar upload | Ready |
| `10-03-court-photos.md` | Phase 2B: Court photos upload | Ready |
| `10-04-payment-proof.md` | Phase 2C: Payment proof upload | Ready |
| `10-05-org-logo.md` | Phase 2D: Organization logo upload | Ready |
| `10-dev1-checklist.md` | Developer 1 checklist | Updated |
| `10-dev2-checklist.md` | Developer 2 checklist | Updated |
| `10-dev3-checklist.md` | Developer 3 checklist | Updated |

---

## Success Criteria

- [x] `zod-form-data` installed and working with Zod v4
- [x] tRPC client configured with `splitLink` for FormData
- [x] Storage module created with full architecture
- [ ] All 4 upload features implemented (avatar, court photos, payment proof, org logo)
- [ ] File validation (5MB, image types) working on both client and server
- [ ] Upload progress shown in UI
- [ ] Error handling with user-friendly messages
- [ ] Build passes with no TypeScript errors

---

## Prerequisites (Manual Setup)

Before implementing Phase 2, configure in Supabase Dashboard:

1. **Create buckets:**
   - `avatars`
   - `payment-proofs`
   - `court-photos`
   - `organization-assets`

2. **Configure RLS policies** (see `10-01-infrastructure.md` for SQL)

3. **Set buckets to private** (default)
