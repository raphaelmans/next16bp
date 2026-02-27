## 1. Routing & Navigation

- [ ] 1.1 Add `team: "/owner/team"` to `owner` object in `src/common/app-routes.ts`
- [ ] 1.2 Add "Team" nav item with `Users` icon to `navItems` in `src/features/owner/components/owner-sidebar.tsx` (between Imports and Settings)
- [ ] 1.3 Create route entry at `src/app/(owner)/owner/team/page.tsx` (thin wrapper importing page component)

## 2. Page Component

- [ ] 2.1 Create `src/features/owner/pages/owner-team-page.tsx` with AppShell, OwnerSidebar, OwnerNavbar, ReservationAlertsPanel layout
- [ ] 2.2 Add page header with "Team & Access" title, description, and Invite button
- [ ] 2.3 Add permission gate check using `useQueryMyOrganizationPermissions` — show "no permission" alert for non-admins
- [ ] 2.4 Add search input and role filter dropdown with `useMemo`-based client-side filtering
- [ ] 2.5 Render members section with member rows (avatar, name, email, inline role Select, permission count Badge, overflow DropdownMenu)
- [ ] 2.6 Render pending invitations section with invitation rows (email, role badge, expiry, cancel button)
- [ ] 2.7 Add loading skeleton states and empty states for members/invitations

## 3. Invite Dialog

- [ ] 3.1 Create `src/features/owner/components/team-invite-dialog.tsx` with Dialog containing email input, role Select, and grouped permission checkboxes
- [ ] 3.2 Group permissions into "Reservations" (5) and "Administration" (1) sections
- [ ] 3.3 Wire role change to reset permissions to role defaults via `DEFAULT_PERMISSIONS_BY_ROLE`
- [ ] 3.4 Wire form submission to `useMutInviteOrganizationMember` with validation (email required, at least one permission)

## 4. Permission Editor Sheet

- [ ] 4.1 Create `src/features/owner/components/team-member-permissions-sheet.tsx` with Sheet panel showing member name/email, role selector, and grouped permission checkboxes
- [ ] 4.2 Add dirty state tracking and Save button using `useMutUpdateOrganizationMemberPermissions`
- [ ] 4.3 Wire role change in sheet to reset permissions to defaults

## 5. Destructive Action Confirmations

- [ ] 5.1 Add AlertDialog confirmation for "Revoke access" action in member overflow menu, wired to `useMutRevokeOrganizationMember`
- [ ] 5.2 Add AlertDialog confirmation for "Cancel invitation" action, wired to `useMutCancelOrganizationInvitation`

## 6. Cleanup & Integration

- [ ] 6.1 Remove `<TeamAccessManager>` render from `src/features/owner/pages/owner-settings-page.tsx` (lines 275-280) and its import
- [ ] 6.2 Remove `teamAccess` from `SETTINGS_SECTION_IDS` and `SETTINGS_SECTION_HASHES` in `src/common/section-hashes.ts`
- [ ] 6.3 Export new components from `src/features/owner/components/index.ts`

## 7. Verification

- [ ] 7.1 Run `pnpm lint` and fix any issues
- [ ] 7.2 Manual verification: navigate to `/owner/team`, test invite, edit permissions, revoke, cancel, search, filter, responsive layout
