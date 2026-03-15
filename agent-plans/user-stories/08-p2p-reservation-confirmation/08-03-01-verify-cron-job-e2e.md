# US-08-03-01: Backend - Verify Cron Job E2E

**Status:** Active  
**Domain:** 08-p2p-reservation-confirmation  
**Parent:** US-08-03 (TTL Expiration Handling)

---

## Story

As a **developer**, I need to **verify the expiration cron job works end-to-end** so that **reservations expire correctly in production**.

---

## Context

The cron endpoint exists at `/api/cron/expire-reservations` but needs verification and Vercel configuration for production deployment.

**Current State:**
- Cron logic implemented
- CRON_SECRET authentication implemented
- Not yet configured in Vercel

---

## Acceptance Criteria

### Cron Endpoint Works

- Given an expired reservation exists (`AWAITING_PAYMENT`, `expiresAt` in past)
- When the cron endpoint is called
- Then the reservation status becomes `EXPIRED`
- And the time slot status becomes `AVAILABLE`
- And an audit event is created with `triggeredByRole: SYSTEM`

### Also Expires Payment Marked Reservations

- Given a reservation is `PAYMENT_MARKED_BY_USER` with `expiresAt` in past
- When the cron endpoint is called
- Then it also expires (owner didn't confirm in time)

### Vercel Cron Configured

- Given the project is deployed to Vercel
- Then the cron job runs every minute (or configured interval)
- And it is protected by CRON_SECRET

### Error Handling

- Given the cron job encounters an error on one reservation
- Then the error is logged
- And the job continues processing other reservations
- And the response indicates partial failure

### Idempotency

- Given a reservation is already `EXPIRED`
- When the cron runs again
- Then it is not processed again (already expired)

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No expired reservations | Returns success with count 0 |
| One reservation expires | Returns success with count 1 |
| Multiple reservations expire | All processed, count reflects total |
| One fails, others succeed | Partial success response, errors logged |
| Invalid CRON_SECRET | Returns 401 Unauthorized |
| No CRON_SECRET set (dev) | Allows request (dev convenience) |

---

## Technical Notes

### Vercel Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-reservations",
      "schedule": "* * * * *"
    }
  ]
}
```

**Schedule Options:**
- `* * * * *` - Every minute (recommended for 15-min TTL)
- `*/5 * * * *` - Every 5 minutes (less precise)

### Environment Variable

Set in Vercel dashboard:
- `CRON_SECRET`: Random secure string (e.g., `openssl rand -hex 32`)

Vercel automatically sends `Authorization: Bearer $CRON_SECRET` header.

### Manual Testing

**Local (no auth required in dev):**
```bash
curl http://localhost:3000/api/cron/expire-reservations
```

**Production (with auth):**
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/expire-reservations
```

### Test Scenario Steps

1. Create a paid reservation (status: `AWAITING_PAYMENT`)
2. Manually set `expiresAt` to past date in database:
   ```sql
   UPDATE reservation 
   SET expires_at = NOW() - INTERVAL '1 hour' 
   WHERE id = 'reservation-id';
   ```
3. Call cron endpoint
4. Verify:
   - Reservation status is `EXPIRED`
   - Time slot status is `AVAILABLE`
   - `reservation_event` record exists with:
     - `from_status: 'AWAITING_PAYMENT'`
     - `to_status: 'EXPIRED'`
     - `triggered_by_role: 'SYSTEM'`
     - `notes: 'Automatically expired due to payment timeout'`

### Response Format

```json
{
  "success": true,
  "message": "Processed 3 expired reservations",
  "expiredCount": 3,
  "totalFound": 3,
  "timestamp": "2025-01-10T14:00:00.000Z"
}
```

**Partial Failure:**
```json
{
  "success": false,
  "message": "Processed 2 expired reservations",
  "expiredCount": 2,
  "totalFound": 3,
  "timestamp": "2025-01-10T14:00:00.000Z",
  "errors": ["Failed to expire reservation abc123: ..."]
}
```

---

## Verification Checklist

### Local Testing

- [ ] Start dev server
- [ ] Create test reservation via UI or API
- [ ] Set `expiresAt` to past via SQL
- [ ] Call `curl http://localhost:3000/api/cron/expire-reservations`
- [ ] Verify response shows `expiredCount: 1`
- [ ] Check reservation table: status = `EXPIRED`
- [ ] Check time_slot table: status = `AVAILABLE`
- [ ] Check reservation_event table: audit record exists

### Production Testing

- [ ] Deploy to Vercel
- [ ] Set `CRON_SECRET` environment variable
- [ ] Add cron configuration to `vercel.json`
- [ ] Create test reservation
- [ ] Wait for expiration or manually set `expiresAt`
- [ ] Check Vercel logs for cron execution
- [ ] Verify reservation expired correctly

### Monitoring

- [ ] Check Vercel cron logs regularly
- [ ] Monitor for errors in expired reservations
- [ ] Verify slot release is working

---

## Files to Modify/Verify

| File | Action |
|------|--------|
| `vercel.json` | Add crons configuration |
| `.env.local` | Add CRON_SECRET for testing |
| Vercel Dashboard | Add CRON_SECRET environment variable |

---

## Dependencies

- Vercel Pro/Enterprise plan (for cron jobs)
- Or alternative scheduler (Supabase pg_cron, external service)
- `CRON_SECRET` environment variable
