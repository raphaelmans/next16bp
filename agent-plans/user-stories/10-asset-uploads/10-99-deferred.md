# US-10-99: Deferred - Asset Upload Enhancements

**Status:** Deferred  
**Supersedes:** -  
**Superseded By:** -

---

## Overview

This document captures asset upload features and optimizations that are out of scope for MVP but should be considered for future iterations.

---

## Deferred Items

### 1. Public Bucket Migration for Non-Sensitive Assets

**Priority:** Medium  
**Reason for Deferral:** Simplify initial implementation with uniform private access

**Description:**
Migrate court photos and organization logos to public buckets for better CDN caching and performance. Currently all buckets are private with RLS.

**Proposed Changes:**
- `court-photos` → Public bucket (no auth required for viewing)
- `organization-assets` → Public bucket (no auth required for viewing)
- `avatars` → Keep private (user preference)
- `payment-proofs` → Keep private (sensitive data)

**Benefits:**
- Faster image loading via CDN edge caching
- Reduced database load (no RLS checks for reads)
- Better SEO for court images

**Considerations:**
- Court photos become publicly accessible via URL
- Need to ensure no sensitive information in court photos

---

### 2. Image Optimization / Resizing

**Priority:** Medium  
**Reason for Deferral:** Additional complexity, Supabase Image Transformation is a paid feature

**Description:**
Automatically resize and optimize uploaded images to reduce storage costs and improve load times.

**Proposed Features:**
- Generate thumbnails (256x256) for listings
- Generate medium size (800px width) for detail pages
- Keep original for full-screen gallery view
- Convert all images to WebP for smaller file sizes

**Implementation Options:**
1. Supabase Image Transformations (paid add-on)
2. Edge Function for on-upload processing
3. Client-side resizing before upload

---

### 3. Bulk Upload for Court Photos

**Priority:** Low  
**Reason for Deferral:** MVP can work with sequential uploads

**Description:**
Allow admins to upload multiple court photos in a single operation with progress tracking.

**Proposed Features:**
- Drag-and-drop multiple files
- Progress bar for batch upload
- Partial success handling (some files fail)
- Automatic ordering based on upload sequence

---

### 4. Avatar Cropping / Editing

**Priority:** Low  
**Reason for Deferral:** Nice-to-have, not essential for MVP

**Description:**
Allow players to crop and position their avatar image before uploading.

**Proposed Features:**
- Interactive crop area (square)
- Zoom and pan controls
- Preview before save
- Client-side cropping (no server processing)

---

### 5. Payment Proof Annotation

**Priority:** Low  
**Reason for Deferral:** Complex feature, P2P verification works without it

**Description:**
Allow players to highlight or annotate payment proof screenshots to point out relevant information (reference number, amount, date).

**Proposed Features:**
- Draw rectangles/circles to highlight
- Add text labels
- Save annotated version alongside original

---

### 6. Storage Cleanup Job

**Priority:** Medium  
**Reason for Deferral:** Can be handled manually initially

**Description:**
Background job to clean up orphaned files when entities are deleted.

**Scenarios to Handle:**
- User deletes account → Remove avatar
- Reservation expires → Keep or remove payment proofs?
- Court deleted → Remove court photos
- Organization deleted → Remove logo

**Proposed Implementation:**
- Database triggers or scheduled function
- Soft-delete with cleanup after retention period

---

### 7. File Versioning / History

**Priority:** Low  
**Reason for Deferral:** Not needed for MVP use cases

**Description:**
Keep history of uploaded files for audit purposes.

**Use Cases:**
- Track when avatar was changed
- Keep old payment proofs even if replaced
- Audit trail for court photo changes

---

### 8. Video Upload Support

**Priority:** Low  
**Reason for Deferral:** Significant additional complexity

**Description:**
Allow court owners to upload short video tours of their facilities.

**Considerations:**
- Much larger file sizes (50-100MB)
- Transcoding requirements
- Streaming delivery
- Higher storage costs

---

## Implementation Priority (Post-MVP)

| Item | Priority | Effort | Impact |
|------|----------|--------|--------|
| Public Bucket Migration | High | Low | High |
| Image Optimization | Medium | Medium | Medium |
| Storage Cleanup Job | Medium | Medium | Low |
| Bulk Upload | Low | Medium | Low |
| Avatar Cropping | Low | Low | Low |
| Payment Proof Annotation | Low | High | Low |
| File Versioning | Low | Medium | Low |
| Video Support | Low | High | Medium |

---

## References

- Supabase Storage CDN: https://supabase.com/docs/guides/storage/cdn/fundamentals
- Supabase Image Transformations: https://supabase.com/docs/guides/storage/serving/image-transformations
