## 1. Review Schema And Persistence

- [ ] 1.1 Create `place-review` schema file under `src/lib/shared/infra/db/schema/` with venue review fields, removal metadata, and foreign keys to `place` and `auth.users`
- [ ] 1.2 Export the new review schema from the schema barrel file
- [ ] 1.3 Add repository methods for review upsert, author/admin removal, venue aggregate queries, venue review listing, and admin moderation listing
- [ ] 1.4 Generate the Drizzle migration for the review schema and verify the active-review uniqueness/index strategy

## 2. Review Domain And API Contracts

- [ ] 2.1 Create the `src/lib/modules/place-review/` module structure with DTOs, repositories, services, factories, and errors
- [ ] 2.2 Implement public read contracts for venue review list, rating histogram, aggregate summary, and current viewer review
- [ ] 2.3 Implement protected create-or-update and self-remove review service methods with authenticated ownership enforcement
- [ ] 2.4 Implement admin moderation service methods for list/filter and remove review
- [ ] 2.5 Add public, protected, and admin review routers and register them in the root tRPC router

## 3. Extend Place Discovery And Detail Contracts

- [ ] 3.1 Extend place card-meta contracts and repository/service projections with `averageRating` and `reviewCount`
- [ ] 3.2 Extend place detail contracts with aggregate review summary needed by the public venue page
- [ ] 3.3 Update discovery/admin feature API adapters and query hooks to expose the new review summary fields without bypassing existing place adapters
- [ ] 3.4 Update mobile/public HTTP route surfaces that mirror place card-meta if they rely on the same contract

## 4. Public Review UI

- [ ] 4.1 Extend the shared `PlaceCard` model and UI to show aggregate rating summary on all place-card surfaces
- [ ] 4.2 Add a review summary and review list section to the shared public place detail feature used by `/venues/[placeId]`
- [ ] 4.3 Add authenticated write/edit/remove review interactions on the venue detail page, including login redirect for unauthenticated write attempts
- [ ] 4.4 Extend venue structured data generation to include aggregate rating when active reviews exist

## 5. Admin Moderation UI

- [ ] 5.1 Add admin review API bindings and hooks under `src/features/admin/`
- [ ] 5.2 Create an admin review moderation page with filters for status, rating, venue, and reviewer
- [ ] 5.3 Add admin review removal actions with confirmation and moderation feedback
- [ ] 5.4 Add the review moderation destination to admin navigation and shared admin page framing

## 6. Validation

- [ ] 6.1 Add repository/service/router tests for one-review-per-user semantics, ownership rules, removal rules, and aggregate recalculation
- [ ] 6.2 Add coverage for claim/transfer/recurate scenarios to verify reviews remain attached to the same `placeId`
- [ ] 6.3 Manually verify rating summary on `/courts`, saved venues, and the public venue detail page
- [ ] 6.4 Manually verify admin moderation flow and public removal behavior for author vs. non-author vs. admin
- [ ] 6.5 Run `pnpm lint`
