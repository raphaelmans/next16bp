# Product Model (How The Platform Thinks)

Core entities (v1.2)

- Place: a venue/listing (address, map pin, photos, amenities). Can contain multiple courts.
- Court: a bookable unit inside a place. Constraint: 1 court = 1 sport.
- TimeSlot: 60-minute inventory rows per court.
- Reservation: a booking request that follows a mutual-confirmation contract.

Key mechanics

- Duration is built from consecutive 60-minute slots (60/120/180+ minutes).
- "Any available" can select the lowest total price across eligible courts.
- Bookability is gated (curated, claimed, verified, enabled) to prevent low-trust bookings.
