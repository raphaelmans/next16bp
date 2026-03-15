# Deferred Items & Future Work

This document tracks all items that have been explicitly deferred from the MVP implementation, along with context for why they were deferred and potential implementation approaches for the future.

---

## Infrastructure Deferred Items

### 1. Upstash Redis Setup
**Phase:** Pre-Phase (0A)  
**Reason:** Setup when ready to deploy  
**Priority:** Required before rate limiting works

**What's Needed:**
- Create Upstash Redis instance
- Add environment variables to `.env.local`:
  ```bash
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  ```
- Test rate limiting in development

**Implementation Notes:**
- Use single-region setup initially
- Consider multi-region for production scale

---

### 2. Admin User Seeding
**Phase:** Pre-Phase (0B)  
**Reason:** Decision on approach deferred  
**Priority:** Required before admin features can be used

**Options to Consider:**
1. **Environment Variable Approach:**
   ```bash
   ADMIN_EMAIL=admin@example.com
   ```
   On first login, if email matches, set role to admin.

2. **Seed Script Approach:**
   ```typescript
   // scripts/seed-admin.ts
   await db.update(userRoles)
     .set({ role: "admin" })
     .where(eq(userRoles.userId, adminUserId));
   ```

3. **First User Approach:**
   First user to sign up becomes admin (risky for production).

4. **Admin Invitation Flow:**
   Existing admin can invite new admins via email.

**Recommended:** Start with seed script for MVP, implement invitation flow later.

---

### 3. Rate Limit Headers
**Phase:** Pre-Phase (0A)  
**Reason:** Simplify MVP  
**Priority:** Low (nice-to-have)

**Current Behavior:** Only return 429 status on limit exceeded.

**Future Enhancement:**
Include headers in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

**Implementation:**
Modify rate limit middleware to inject headers into response context.

---

## Feature Deferred Items

### 4. Reservation TTL Expiration Job
**Phase:** Phase 3  
**Reason:** Background job infrastructure needed  
**Priority:** High (required for paid reservations to work properly)

**What's Needed:**
A background job that runs periodically to:
1. Find reservations with status `AWAITING_PAYMENT` or `PAYMENT_MARKED_BY_USER`
2. Check if `expires_at < NOW()`
3. Update status to `EXPIRED`
4. Release time slot (status → `AVAILABLE`)
5. Create audit event (triggered_by_role: `SYSTEM`)

**Implementation Options:**

1. **Supabase Edge Function with pg_cron:**
   ```sql
   SELECT cron.schedule('expire-reservations', '* * * * *', $$
     SELECT expire_stale_reservations();
   $$);
   ```

2. **Vercel Cron Jobs:**
   ```typescript
   // app/api/cron/expire-reservations/route.ts
   export async function GET(request: Request) {
     // Verify cron secret
     // Call expiration service
   }
   ```
   With `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/cron/expire-reservations",
       "schedule": "* * * * *"
     }]
   }
   ```

3. **Inngest/Trigger.dev:**
   Event-driven job queue with better observability.

**Recommended:** Start with Vercel Cron for simplicity, consider Inngest for scale.

---

### 5. File Upload for Photos & Payment Proofs
**Phase:** Phase 2A, Phase 3C  
**Reason:** Complexity, separate concern  
**Priority:** Medium

**Current Behavior:** Accept URLs for photos and payment proof files.

**Future Enhancement:**
Implement file upload to Supabase Storage or similar.

**What's Needed:**
1. Storage bucket configuration
2. Signed URL generation for uploads
3. File type/size validation
4. Cleanup of orphaned files

**Implementation Approach:**
```typescript
// Generate signed upload URL
const { data, error } = await supabase.storage
  .from('court-photos')
  .createSignedUploadUrl(`${courtId}/${filename}`);

// Client uploads directly to storage
// Then provides the public URL to the API
```

---

### 6. Geospatial Queries (Nearby Courts)
**Phase:** Phase 1C  
**Reason:** PostGIS complexity for MVP  
**Priority:** Medium

**Current Behavior:** Filter courts by city name only.

**Future Enhancement:**
Enable "find courts within X km of my location."

**Implementation Options:**

1. **PostGIS Extension:**
   ```sql
   -- Enable extension
   CREATE EXTENSION IF NOT EXISTS postgis;
   
   -- Add geography column
   ALTER TABLE court ADD COLUMN location geography(POINT, 4326);
   
   -- Query nearby
   SELECT * FROM court
   WHERE ST_DWithin(location, ST_MakePoint($lng, $lat)::geography, $radius_meters);
   ```

2. **Bounding Box Approximation:**
   ```typescript
   // Calculate bounding box
   const latDelta = radiusKm / 111;
   const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
   
   // Query with box
   WHERE latitude BETWEEN $minLat AND $maxLat
     AND longitude BETWEEN $minLng AND $maxLng
   ```

**Recommended:** Start with bounding box for MVP, add PostGIS for accuracy later.

---

### 7. Rate Limiting by IP for Anonymous Users
**Phase:** Pre-Phase (0A)  
**Reason:** Need to decide IP extraction approach  
**Priority:** Medium

**Current Behavior:** Use `requestId` as fallback identifier.

**Future Enhancement:**
Extract real IP from headers:
```typescript
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
  ?? request.headers.get('x-real-ip')
  ?? 'anonymous';
```

**Considerations:**
- Handle proxy chains correctly
- Consider privacy implications
- May need Cloudflare/Vercel-specific header handling

---

## Business Logic Deferred Items

### 8. Organization Members/Teams
**Phase:** Phase 1B  
**Reason:** MVP focuses on single owner  
**Priority:** Medium (post-MVP)

**Current Behavior:** One owner per organization.

**Future Enhancement:**
Allow multiple users to manage an organization with different roles.

**Schema Addition:**
```typescript
const organizationMember = pgTable("organization_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organization.id),
  userId: uuid("user_id").references(() => authUsers.id),
  role: text("role").notNull(), // "owner", "manager", "staff"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

---

### 9. Notifications
**Phase:** N/A  
**Reason:** Out of MVP scope  
**Priority:** High (post-MVP)

**Use Cases:**
- Notify player when reservation confirmed
- Notify owner of new reservation
- Notify player when reservation expires
- Notify org owner of claim approval

**Implementation Options:**
- Email via Resend/SendGrid
- Push notifications via OneSignal
- In-app notifications with polling/WebSocket

---

### 10. Cancellation Policies
**Phase:** Phase 3  
**Reason:** Business rule complexity  
**Priority:** Low (post-MVP)

**Current Behavior:** Any reservation can be cancelled anytime.

**Future Enhancement:**
- Define cancellation windows (e.g., no cancellation within 2 hours)
- Potential refund policies for paid courts
- Owner-defined cancellation rules

---

### 11. Recurring Time Slots
**Phase:** Phase 2B  
**Reason:** MVP uses explicit slot creation  
**Priority:** Medium (post-MVP)

**Current Behavior:** Each time slot is created individually or in bulk.

**Future Enhancement:**
Allow defining recurring schedules:
```typescript
const scheduleRule = pgTable("schedule_rule", {
  id: uuid("id").primaryKey(),
  courtId: uuid("court_id").references(() => court.id),
  dayOfWeek: integer("day_of_week"), // 0-6
  startTime: time("start_time"),
  endTime: time("end_time"),
  priceCents: integer("price_cents"),
  currency: varchar("currency", { length: 3 }),
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
});
```

Then generate slots from rules periodically.

---

### 12. Analytics & Reporting
**Phase:** N/A  
**Reason:** Out of MVP scope  
**Priority:** Medium (post-MVP)

**Use Cases:**
- Court utilization rates
- Revenue tracking for owners
- Booking patterns
- Conversion funnel analysis

**Implementation:**
- Aggregate queries on existing tables
- Consider separate analytics tables for performance
- Integration with analytics platforms (Mixpanel, Amplitude)

---

## Summary

| Item | Phase | Priority | Effort |
|------|-------|----------|--------|
| Upstash Redis Setup | Pre-Phase | Required | Low |
| Admin User Seeding | Pre-Phase | Required | Low |
| Rate Limit Headers | Pre-Phase | Low | Low |
| TTL Expiration Job | Phase 3 | High | Medium |
| File Upload | Phase 2A/3C | Medium | Medium |
| Geospatial Queries | Phase 1C | Medium | Medium |
| IP Rate Limiting | Pre-Phase | Medium | Low |
| Organization Members | Phase 1B | Medium | Medium |
| Notifications | N/A | High | High |
| Cancellation Policies | Phase 3 | Low | Medium |
| Recurring Slots | Phase 2B | Medium | High |
| Analytics | N/A | Medium | High |

---

## Action Items Before Going Live

1. **Required:**
   - [ ] Set up Upstash Redis
   - [ ] Create admin user(s)
   - [ ] Implement TTL expiration job
   - [ ] Test full reservation flow end-to-end

2. **Recommended:**
   - [ ] Add file upload capability
   - [ ] Set up notification system (at least email)
   - [ ] Implement IP-based rate limiting

3. **Nice-to-Have:**
   - [ ] Geospatial search
   - [ ] Rate limit headers
   - [ ] Organization members
