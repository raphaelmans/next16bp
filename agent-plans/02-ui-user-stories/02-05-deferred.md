# Deferred Work

Items explicitly out of scope for current implementation sprint.

---

## Deferred Features

### Phase 5: Court Reservation (US-03-*)

| Feature | User Story | Priority | Reason Deferred |
|---------|------------|----------|-----------------|
| Free Booking Flow | US-03-01 | Medium | Existing flow works, minor improvements needed |
| Paid Booking Flow | US-03-02 | Medium | Payment page exists, needs polish |
| Owner Confirmation | US-03-03 | Medium | Pending reservations UI exists |

### Reservation Improvements Needed

| Item | Current State | Improvement Needed |
|------|---------------|-------------------|
| Payment timer | Exists | Add visual countdown bar |
| Payment proof | Reference number only | Consider file upload |
| Owner notifications | None | Badge on sidebar, dashboard stats |
| Player notifications | Toast only | Email notifications |

---

## Other Deferred Items

### Court Claiming (04-court-claiming)

| Feature | Priority | Reason Deferred |
|---------|----------|-----------------|
| Owner Claims Curated Court | Low | Not MVP critical |
| Admin Approves Claim | Low | Not MVP critical |
| Admin Rejects Claim | Low | Not MVP critical |
| Owner Requests Removal | Low | Not MVP critical |

### Profile Enhancements

| Feature | Priority | Reason Deferred |
|---------|----------|-----------------|
| Avatar upload | Low | URL input sufficient for MVP |
| Profile completion progress bar | Low | Simple CTA sufficient |
| Password change | Medium | Can use Supabase reset flow |

### Navigation Enhancements

| Feature | Priority | Reason Deferred |
|---------|----------|-----------------|
| Recently viewed courts | Low | Requires view tracking |
| Skip to content link | Low | Accessibility enhancement |
| Keyboard shortcuts | Low | Power user feature |

### Admin Features

| Feature | Priority | Reason Deferred |
|---------|----------|-----------------|
| Bulk court import | Low | Manual creation sufficient |
| User management | Low | Use Supabase dashboard |
| Analytics dashboard | Low | Post-MVP |

---

## Future Considerations

### Email Notifications

- Reservation created (player)
- Payment marked (owner)
- Payment confirmed (player)
- Reservation expired (player)
- Reservation cancelled (both)

### Real-time Updates

- WebSocket for slot availability
- Push notifications for owners
- Live countdown on payment page

### Search Enhancements

- Geolocation-based search
- Filter by amenities
- Filter by price range
- Sort by distance/rating

---

## When to Revisit

| Feature Set | Trigger |
|-------------|---------|
| Reservation improvements | After core flows stable |
| Court claiming | After owner self-registration working |
| Email notifications | Before production launch |
| Real-time updates | When scale requires it |

---

## Dependencies for Deferred Work

```
Phase 1-4 Complete
    │
    ├── Reservation Improvements
    │       └── Requires: Payment flow working
    │
    ├── Court Claiming
    │       └── Requires: Organization onboarding complete
    │
    └── Email Notifications
            └── Requires: Email provider setup (Resend, SendGrid)
```
