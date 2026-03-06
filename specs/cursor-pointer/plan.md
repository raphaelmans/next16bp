# Cursor Pointer — Implementation Plan

## Checklist
- [ ] Step 1: Core controls (Button, Checkbox, Switch, Toggle, RadioGroupItem)
- [ ] Step 2: Form controls (SelectTrigger, SelectItem, SelectScroll buttons, TabsTrigger, Slider)
- [ ] Step 3: Menu components (DropdownMenu, ContextMenu, Menubar)
- [ ] Step 4: Navigation and overlay components (AccordionTrigger, NavigationMenu, BreadcrumbLink, Dialog close, Sheet close)
- [ ] Step 5: Sidebar components (SidebarMenuButton, SidebarMenuAction, SidebarGroupAction, SidebarMenuSubButton)
- [ ] Step 6: Validation

## Step 1: Core controls

**Objective:** Add `cursor-pointer` to the five most fundamental interactive components.

**Implementation:**
- `button.tsx`: Add `cursor-pointer` to the `buttonVariants` CVA base string (beginning of the string)
- `checkbox.tsx`: Add `cursor-pointer` to `CheckboxPrimitive.Root` className string
- `switch.tsx`: Add `cursor-pointer` to `SwitchPrimitive.Root` className string
- `toggle.tsx`: Add `cursor-pointer` to the `toggleVariants` CVA base string
- `radio-group.tsx`: Add `cursor-pointer` to `RadioGroupPrimitive.Item` className string

**Propagation check:** This also fixes:
- CalendarDayButton, CarouselPrevious/Next, AlertDialogAction/Cancel, SidebarTrigger (use `<Button>`)
- PaginationLink/Previous/Next (use `buttonVariants`)
- ToggleGroupItem (use `toggleVariants`)

**Test:** Hover over Button, Checkbox, Switch, Toggle, RadioGroupItem in dev — all show pointer cursor.

**Demo:** All core form controls show pointer on hover.

---

## Step 2: Form controls

**Objective:** Fix remaining form-related components.

**Implementation:**
- `select.tsx` — SelectTrigger: Add `cursor-pointer` to className string
- `select.tsx` — SelectItem: Replace `cursor-default` with `cursor-pointer`
- `select.tsx` — SelectScrollUpButton: Replace `cursor-default` with `cursor-pointer`
- `select.tsx` — SelectScrollDownButton: Replace `cursor-default` with `cursor-pointer`
- `tabs.tsx` — TabsTrigger: Add `cursor-pointer` to className string
- `slider.tsx` — SliderThumb: Add `cursor-pointer` to className string

**Test:** Open a Select, hover items — pointer. Click tabs — pointer. Drag slider — pointer.

**Demo:** All form controls consistently show pointer cursor.

---

## Step 3: Menu components

**Objective:** Replace `cursor-default` with `cursor-pointer` across all menu-type components.

**Implementation:**
- `dropdown-menu.tsx`: Replace `cursor-default` with `cursor-pointer` in DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuSubTrigger (4 replacements)
- `context-menu.tsx`: Replace `cursor-default` with `cursor-pointer` in ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuSubTrigger (4 replacements)
- `menubar.tsx`: Replace `cursor-default` with `cursor-pointer` in MenubarItem, MenubarCheckboxItem, MenubarRadioItem, MenubarSubTrigger (4 replacements). Add `cursor-pointer` to MenubarTrigger (1 addition)

**Test:** Open each menu type, hover items — all show pointer. Verify `grep "cursor-default" src/components/ui/` returns zero results.

**Demo:** All menu interactions show pointer cursor.

---

## Step 4: Navigation and overlay components

**Objective:** Fix accordion, navigation menu, breadcrumb, and dialog/sheet close buttons.

**Implementation:**
- `accordion.tsx` — AccordionTrigger: Add `cursor-pointer` to className
- `navigation-menu.tsx` — `navigationMenuTriggerStyle` CVA: Add `cursor-pointer` to base
- `navigation-menu.tsx` — NavigationMenuLink: Add `cursor-pointer` to className
- `breadcrumb.tsx` — BreadcrumbLink: Add `cursor-pointer` to className
- `dialog.tsx` — Inline `DialogPrimitive.Close` (X button): Add `cursor-pointer` to className
- `sheet.tsx` — Inline `SheetPrimitive.Close` (X button): Add `cursor-pointer` to className

**Test:** Hover accordion headers, nav menu items, breadcrumb links, dialog/sheet close buttons — all show pointer.

**Demo:** All overlay and navigation elements show pointer cursor.

---

## Step 5: Sidebar components

**Objective:** Fix sidebar interactive elements.

**Implementation:**
- `sidebar.tsx` — `sidebarMenuButtonVariants` CVA: Add `cursor-pointer` to base string
- `sidebar.tsx` — SidebarMenuAction: Add `cursor-pointer` to className
- `sidebar.tsx` — SidebarGroupAction: Add `cursor-pointer` to className
- `sidebar.tsx` — SidebarMenuSubButton: Add `cursor-pointer` to className

**Note:** Skip SidebarRail — it has intentional resize cursors.

**Test:** Hover sidebar menu items, action buttons, sub-buttons — all show pointer.

**Demo:** Full sidebar interaction shows pointer cursor.

---

## Step 6: Validation

**Objective:** Confirm all changes are correct and nothing is broken.

**Verification:**
1. `pnpm lint` — passes with no errors
2. `grep -r "cursor-default" src/components/ui/` — returns zero results
3. `grep -r "cursor-pointer" src/components/ui/` — returns results for all 17 modified files
4. Visual spot-check in dev: hover every interactive component type

**Done criteria:** All acceptance criteria from design.md pass.
