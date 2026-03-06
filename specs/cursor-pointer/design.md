# Cursor Pointer — Design Document

## Overview
Add `cursor-pointer` to all clickable shadcn-ui components so users get consistent visual feedback that elements are interactive. Currently zero components have this class.

## Detailed Requirements
- Per-component edits — add `cursor-pointer` directly to each shadcn-ui component's default classes
- Bake into default classes via `cn()` so it's always present but overridable by consumers
- Leave disabled state cursor behavior as-is (components already have `disabled:cursor-not-allowed` or `disabled:pointer-events-none` where appropriate)
- Scope: only `src/components/ui/*.tsx` shadcn components

## Architecture Overview
No architectural changes. This is a class-level change across existing component files. The fix propagates through composition:
- Components using `<Button>` internally (Calendar, Carousel, AlertDialog actions, SidebarTrigger) inherit the fix automatically
- Components using `buttonVariants` (PaginationLink) inherit automatically
- Trigger wrappers (DialogTrigger, SheetTrigger, etc.) that use `asChild` inherit from their child — no change needed

## Components and Changes

### Group A: Add `cursor-pointer` to base class string (19 components)

| # | File | Component | Location |
|---|------|-----------|----------|
| 1 | button.tsx | Button | `buttonVariants` CVA base string |
| 2 | checkbox.tsx | Checkbox | `CheckboxPrimitive.Root` className |
| 3 | switch.tsx | Switch | `SwitchPrimitive.Root` className |
| 4 | toggle.tsx | Toggle | `toggleVariants` CVA base string |
| 5 | radio-group.tsx | RadioGroupItem | `RadioGroupPrimitive.Item` className |
| 6 | select.tsx | SelectTrigger | `SelectPrimitive.Trigger` className |
| 7 | tabs.tsx | TabsTrigger | `TabsPrimitive.Trigger` className |
| 8 | slider.tsx | SliderThumb | `SliderPrimitive.Thumb` className |
| 9 | accordion.tsx | AccordionTrigger | `AccordionPrimitive.Trigger` className |
| 10 | navigation-menu.tsx | NavigationMenuTrigger | `navigationMenuTriggerStyle` CVA base |
| 11 | navigation-menu.tsx | NavigationMenuLink | `NavigationMenuPrimitive.Link` className |
| 12 | breadcrumb.tsx | BreadcrumbLink | `Comp` className |
| 13 | dialog.tsx | Dialog close (X) | Inline `DialogPrimitive.Close` className |
| 14 | sheet.tsx | Sheet close (X) | Inline `SheetPrimitive.Close` className |
| 15 | sidebar.tsx | SidebarMenuButton | `sidebarMenuButtonVariants` CVA base |
| 16 | sidebar.tsx | SidebarMenuAction | `Comp` className |
| 17 | sidebar.tsx | SidebarGroupAction | `Comp` className |
| 18 | sidebar.tsx | SidebarMenuSubButton | `Comp` className |
| 19 | menubar.tsx | MenubarTrigger | `MenubarPrimitive.Trigger` className |

### Group B: Replace `cursor-default` with `cursor-pointer` (16 occurrences in 3 files)

| # | File | Component | Change |
|---|------|-----------|--------|
| 1 | dropdown-menu.tsx | DropdownMenuItem | `cursor-default` -> `cursor-pointer` |
| 2 | dropdown-menu.tsx | DropdownMenuCheckboxItem | `cursor-default` -> `cursor-pointer` |
| 3 | dropdown-menu.tsx | DropdownMenuRadioItem | `cursor-default` -> `cursor-pointer` |
| 4 | dropdown-menu.tsx | DropdownMenuSubTrigger | `cursor-default` -> `cursor-pointer` |
| 5 | context-menu.tsx | ContextMenuItem | `cursor-default` -> `cursor-pointer` |
| 6 | context-menu.tsx | ContextMenuCheckboxItem | `cursor-default` -> `cursor-pointer` |
| 7 | context-menu.tsx | ContextMenuRadioItem | `cursor-default` -> `cursor-pointer` |
| 8 | context-menu.tsx | ContextMenuSubTrigger | `cursor-default` -> `cursor-pointer` |
| 9 | menubar.tsx | MenubarItem | `cursor-default` -> `cursor-pointer` |
| 10 | menubar.tsx | MenubarCheckboxItem | `cursor-default` -> `cursor-pointer` |
| 11 | menubar.tsx | MenubarRadioItem | `cursor-default` -> `cursor-pointer` |
| 12 | menubar.tsx | MenubarSubTrigger | `cursor-default` -> `cursor-pointer` |
| 13 | select.tsx | SelectItem | `cursor-default` -> `cursor-pointer` |
| 14 | select.tsx | SelectScrollUpButton | `cursor-default` -> `cursor-pointer` |
| 15 | select.tsx | SelectScrollDownButton | `cursor-default` -> `cursor-pointer` |

### Group C: No change needed (inherit from parent component)

| Component | Reason |
|-----------|--------|
| CalendarDayButton | Uses `<Button>` — inherits |
| CarouselPrevious/Next | Uses `<Button>` — inherits |
| AlertDialogAction/Cancel | Uses `<Button asChild>` — inherits |
| SidebarTrigger | Uses `<Button>` — inherits |
| PaginationLink/Previous/Next | Uses `buttonVariants` — inherits |
| ToggleGroupItem | Uses `toggleVariants` — inherits |

### Group D: No change needed (pass-through triggers)

| Component | Reason |
|-----------|--------|
| DialogTrigger | Pass-through, uses `asChild` pattern |
| SheetTrigger | Pass-through |
| PopoverTrigger | Pass-through |
| AlertDialogTrigger | Pass-through |
| CollapsibleTrigger | Pass-through, no className |
| DropdownMenuTrigger | Pass-through |
| ContextMenuTrigger | Pass-through |

### Group E: Intentionally skipped

| Component | Reason |
|-----------|--------|
| SidebarRail | Has specific resize cursors (`cursor-w-resize`, `cursor-e-resize`) — not a pointer target |
| Input/Textarea/InputOTP | Text inputs — cursor should be text cursor |
| Drawer | Uses vaul library, trigger is pass-through |

## Error Handling
N/A — purely cosmetic CSS change.

## Acceptance Criteria

**Given** a user hovers over any Button component
**When** the cursor enters the element
**Then** the cursor changes to a pointer

**Given** a user hovers over any form control (Checkbox, Switch, RadioGroupItem, SelectTrigger, Toggle)
**When** the cursor enters the element
**Then** the cursor changes to a pointer

**Given** a user hovers over any menu item (DropdownMenuItem, ContextMenuItem, MenubarItem)
**When** the cursor enters the element
**Then** the cursor changes to a pointer (previously was `cursor-default`)

**Given** a user hovers over a TabsTrigger, AccordionTrigger, or NavigationMenuTrigger
**When** the cursor enters the element
**Then** the cursor changes to a pointer

**Given** a user hovers over a dialog/sheet close (X) button
**When** the cursor enters the element
**Then** the cursor changes to a pointer

**Given** a user hovers over sidebar interactive elements (SidebarMenuButton, SidebarMenuAction, SidebarGroupAction, SidebarMenuSubButton)
**When** the cursor enters the element
**Then** the cursor changes to a pointer

**Given** a user hovers over a component that uses `<Button>` internally (CalendarDayButton, CarouselPrevious/Next, AlertDialogAction/Cancel, PaginationLink)
**When** the cursor enters the element
**Then** the cursor changes to a pointer (inherited from Button fix)

**Given** a disabled interactive element
**When** the cursor enters the element
**Then** the existing disabled cursor behavior is unchanged

## Testing Strategy
- Visual: hover over every clickable component in dev and confirm pointer cursor
- Lint: `pnpm lint` passes
- Grep: `grep -r "cursor-default" src/components/ui/` returns zero results after implementation

## Appendices

### Technology Choices
No new dependencies. Pure Tailwind CSS class additions.

### Files Modified
13 files total:
1. `src/components/ui/button.tsx`
2. `src/components/ui/checkbox.tsx`
3. `src/components/ui/switch.tsx`
4. `src/components/ui/toggle.tsx`
5. `src/components/ui/radio-group.tsx`
6. `src/components/ui/select.tsx`
7. `src/components/ui/tabs.tsx`
8. `src/components/ui/slider.tsx`
9. `src/components/ui/accordion.tsx`
10. `src/components/ui/navigation-menu.tsx`
11. `src/components/ui/breadcrumb.tsx`
12. `src/components/ui/dialog.tsx`
13. `src/components/ui/sheet.tsx`
14. `src/components/ui/sidebar.tsx`
15. `src/components/ui/menubar.tsx`
16. `src/components/ui/dropdown-menu.tsx`
17. `src/components/ui/context-menu.tsx`
