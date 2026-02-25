# System Overview

> Manually analyzed and updated on 2026-02-21
> Confidence: 95%

## Purpose

KudosCourts is a player-first, location-based sports venue discovery and reservation platform. It aims to solve the fragmented booking process for sports venues by providing a unified discovery layer for players and a standardized reservation engine for participating venues.

## Domains

This system is organized into the following domains:

| Domain | Description | Spec |
|--------|-------------|------|
| Discovery | Location-based search (map/list) of curated and reservable places. | [discovery/spec.md] |
| Reservation | Unified booking flow, state machine, TTL management, and P2P payment confirmation. | [reservation/spec.md] |
| Organization | Venue owner management, place claiming, and organization profiles. | [organization/spec.md] |
| Place/Court | Management of physical venues (Places) and individual bookable units (Courts). | [place-court/spec.md] |
| Availability | Generation of bookable slots from schedule rules, pricing rules, and overlap prevention. | [availability/spec.md] |
| Admin | Platform-level management of curated inventory and claim approvals. | [admin/spec.md] |
| Auth & Profile | User authentication, session management, and user profiles. | [auth/spec.md] |
| Chat | Real-time messaging for reservations and support. | [chat/spec.md] |
| Open Play | Public game sessions attached to reservations. | [open-play/spec.md] |

## Technical Stack

- **Type**: Web Application (Next.js)
- **Primary Language**: TypeScript (strict)
- **Key Frameworks**: React 19, Next.js 16 (App Router), tRPC, TanStack Query
- **Database**: PostgreSQL (Supabase) with Drizzle ORM
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Infrastructure**: Vercel (Hosting), Supabase (DB/Auth/Storage)
- **Real-time**: Stream Chat (Reservation chat)

## Key Capabilities

- **Venue Discovery**: Find sports venues nearby via map or list with sport-specific filtering.
- **Unified Booking**: Standardized flow for reserving specific courts with real-time availability.
- **P2P Payments**: Support for external payment confirmation (GCash, bank transfer) within the booking flow.
- **Place Claiming**: Process for venue owners to claim curated listings and make them reservable.
- **Flexible Pricing**: Hourly pricing rules based on time-of-day and day-of-week.

## Technical Notes

- **Architecture Style**: Modular Feature-based Architecture (`src/features`) with Repository/Service/Use-Case/Router layering for backend logic.
- **Standardization**: Strict adherence to Zod-driven API contracts and Biome-enforced code quality.
- **Reliability**: Transactional integrity for bookings with computed availability to prevent double-booking without the overhead of materialized slot rows.
