## Context

Team & Access is currently a `<TeamAccessManager>` Card component rendered inline in `owner-settings-page.tsx` (line 275-280). It manages 3 roles (Owner/Manager/Viewer), 6 permissions, member CRUD, and invitation lifecycle via tRPC hooks in `src/features/owner/hooks/organization.ts`. The backend (router, service, repository, DB schema) is complete and stable — this change is purely frontend restructuring.

The existing component at `src/features/owner/components/team-access-manager.tsx` (573 lines) handles everything in one monolithic component with inline forms, flat member lists, and dense checkbox grids. The new design decomposes this into focused components.

## Goals / Non-Goals

**Goals:**
- Dedicated `/owner/team` page with sidebar navigation entry
- Vercel-style members table with avatar, name, email, inline role dropdown, permission count, and overflow menu
- Invite dialog (modal) with grouped permission checkboxes
- Permission editor sheet (slide-out panel) with domain-grouped permissions
- Client-side search and role filter for member list
- AlertDialog confirmations for destructive actions (revoke, cancel)
- Responsive mobile layout

**Non-Goals:**
- Backend/API changes (all tRPC endpoints unchanged)
- New permissions or roles
- Invitation history view (only pending invitations shown, same as current)
- Bulk member operations
- Activity audit log

## Decisions

### 1. Dedicated page vs. settings sub-tab
**Decision:** Standalone page at `/owner/team` with its own sidebar nav item.
**Rationale:** Team management is a first-class feature used frequently by org owners. Burying it in settings adds friction. Vercel, Linear, and Notion all give team management its own navigation entry.
**Alternative considered:** Settings sub-tab — rejected because the settings page is already long (6 sections) and team management deserves its own focus.

### 2. Component decomposition
**Decision:** Break the monolithic `TeamAccessManager` into:
- `owner-team-page.tsx` — page with AppShell, header, search/filter, sections
- `team-invite-dialog.tsx` — Dialog for inviting members
- `team-member-permissions-sheet.tsx` — Sheet for editing permissions

**Rationale:** Single-responsibility components aligned with the project's feature-first pattern. Each component manages its own state and mutations.

### 3. Permission grouping in UI
**Decision:** Group permissions into two domains:
- **Reservations** (5): `reservation.read`, `reservation.update_status`, `reservation.guest_booking`, `reservation.chat`, `reservation.notification.receive`
- **Administration** (1): `organization.member.manage`

**Rationale:** Grouping by domain improves scannability over a flat 6-checkbox grid. Separating administration permissions from operational permissions makes the security implications clearer.

### 4. Inline role change vs. sheet-only editing
**Decision:** Inline role `<Select>` dropdown directly on member rows, with a separate sheet for granular permission editing.
**Rationale:** Role changes are the most common action (80/20 rule). Inline dropdowns follow Vercel's pattern and reduce clicks. When the role changes, permissions auto-reset to role defaults. Fine-grained permission overrides are less common and warrant the focused sheet interface.

### 5. Search/filter implementation
**Decision:** Client-side filtering with React state (no URL state via nuqs).
**Rationale:** Team sizes for this product are small (typically <20 members). Client-side filtering with `useMemo` is sufficient and avoids unnecessary URL state complexity. If team sizes grow significantly, this can be upgraded to server-side filtering.

### 6. Keep old TeamAccessManager component
**Decision:** Remove the `<TeamAccessManager>` render from settings page but keep the component file for now.
**Rationale:** The component may be referenced elsewhere or useful as a fallback. It will be cleaned up in a future pass.

## Risks / Trade-offs

- **[Risk] Stale bookmarks** — Users with bookmarks to `/owner/settings#team-access` will no longer scroll to the section → Consider adding a note or redirect in a future iteration. Low risk since this is an internal management tool.
- **[Risk] Permission sheet adds a click** — Editing permissions now requires clicking [...] → "Edit permissions" → sheet opens → edit → save, vs the current inline checkboxes → The tradeoff is better UX at scale. For small teams, the overhead is minimal (2 extra clicks).
- **[Trade-off] Client-side filter vs. URL state** — Filters reset on page navigation. Acceptable for team management where users don't share filtered views.
