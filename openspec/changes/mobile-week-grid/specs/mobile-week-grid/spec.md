## ADDED Requirements

### Requirement: Mobile week grid displays 7-day availability
The system SHALL render a compact 7-column grid within the mobile booking sheet that displays one week of availability data without horizontal scrolling. The grid SHALL use a `28px` time-label column and 7 equal-width day columns with `48px` row height, fitting on screens 375px and wider.

#### Scenario: Grid renders on 375px screen
- **WHEN** the mobile booking sheet is expanded on a 375px-wide viewport
- **THEN** the grid displays 7 day columns plus a time-label column with no horizontal overflow

#### Scenario: Grid renders on 430px screen
- **WHEN** the mobile booking sheet is expanded on a 430px-wide viewport
- **THEN** the grid displays 7 day columns with each column wider than on 375px, maintaining the same layout structure

#### Scenario: Day headers show abbreviated labels
- **WHEN** the grid renders for a given week
- **THEN** each day column header displays a single-letter day abbreviation (S, M, T, W, T, F, S) and the date number

#### Scenario: Today is visually distinguished
- **WHEN** one of the 7 displayed days is today
- **THEN** that day's header SHALL have a distinct visual indicator (e.g., filled circle behind the date number)

### Requirement: Cells use color-coded status indication
The system SHALL render each grid cell as a color-coded rectangle without text content. Cell background color SHALL indicate slot status: available (emerald tint), booked (orange/red tint), maintenance (amber tint), past (dimmed/muted), or empty (transparent).

#### Scenario: Available slot cell
- **WHEN** a time slot is available for booking
- **THEN** the cell renders with an emerald-tinted background

#### Scenario: Booked slot cell
- **WHEN** a time slot is already booked
- **THEN** the cell renders with an orange/red-tinted background and is not interactive

#### Scenario: Past slot cell
- **WHEN** a time slot is in the past relative to the current time in the venue's time zone
- **THEN** the cell renders with a dimmed/muted background and is not interactive

#### Scenario: Maintenance slot cell
- **WHEN** a time slot is marked as maintenance/blocked
- **THEN** the cell renders with an amber-tinted background and is not interactive

### Requirement: Time labels display at 3-hour intervals
The system SHALL display time labels in the leftmost column at 3-hour intervals using compact format (e.g., "6a", "9a", "12p", "3p", "6p", "9p"). The labels SHALL be positioned in a fixed 28px-wide column.

#### Scenario: Time labels render correctly
- **WHEN** the grid renders with availability from 6 AM to 11 PM
- **THEN** time labels appear at 6a, 9a, 12p, 3p, 6p, and 9p positions in the leftmost column

#### Scenario: Labels respect schedule order
- **WHEN** the venue's operating hours span across midnight (e.g., 6 AM to 2 AM)
- **THEN** time labels SHALL follow the venue's schedule order, wrapping correctly past midnight

### Requirement: Tap selection on available cells
The system SHALL allow users to select available time slots by tapping. A single tap on an available cell sets it as the selection anchor. A second tap on another available cell on the same day or an adjacent day extends the selection to form a contiguous range.

#### Scenario: Single tap selects anchor
- **WHEN** user taps an available cell
- **THEN** the cell is highlighted as the pending selection start (pulsing/primary indicator)

#### Scenario: Second tap on same day extends range
- **WHEN** user has tapped an anchor cell and then taps another available cell on the same day
- **THEN** all contiguous available cells between anchor and target are highlighted as selected

#### Scenario: Second tap on adjacent day creates cross-midnight range
- **WHEN** user has tapped an anchor cell on day N and then taps an available cell on day N+1
- **THEN** the selection spans from the anchor on day N through contiguous available slots to the target on day N+1

#### Scenario: Tap same cell clears selection
- **WHEN** user taps the currently selected anchor cell
- **THEN** the selection is cleared

#### Scenario: Tap on non-adjacent day resets selection
- **WHEN** user has an active selection on day N and taps a cell on day N+2 or further
- **THEN** the previous selection is cleared and the tapped cell becomes the new anchor

### Requirement: Touch drag extends selection
The system SHALL support touch-hold-and-drag to extend a selection range. Pointer events (`pointerDown`, `pointerEnter`, `pointerUp`) SHALL drive the drag interaction while `touch-action: pan-y` on the scroll container preserves native vertical scrolling.

#### Scenario: Drag across cells on same day
- **WHEN** user presses and holds on an available cell, then drags vertically to another cell on the same day
- **THEN** all contiguous available cells in the drag path are highlighted as selected

#### Scenario: Vertical scroll is not blocked
- **WHEN** user performs a quick vertical flick/swipe on the grid
- **THEN** the grid scrolls vertically without triggering cell selection

#### Scenario: Drag across adjacent day columns
- **WHEN** user presses and drags horizontally from a cell on day N to a cell on day N+1
- **THEN** the selection extends across the day boundary through contiguous available slots

### Requirement: Summary bar shows selection details
The system SHALL display a summary bar above the grid (or between grid and footer) that shows the selected time range, duration, and estimated price when a selection is active.

#### Scenario: Selection active
- **WHEN** user has selected a contiguous range of slots
- **THEN** the summary bar displays the day, start time, end time, total duration, and estimated price

#### Scenario: No selection
- **WHEN** no cells are selected
- **THEN** the summary bar is hidden or displays a prompt to select slots

#### Scenario: Clear button in summary bar
- **WHEN** user taps the "Clear" action in the summary bar
- **THEN** the selection is fully cleared and the summary bar hides

### Requirement: Week-range data fetching on mobile
The system SHALL fetch availability data for the entire displayed week in a single query, using the same week-range hooks as the desktop grid (`useQueryDiscoveryAvailabilityForCourtRange` for court mode, `useQueryDiscoveryAvailabilityForPlaceSportRange` for any-court mode).

#### Scenario: Court mode fetches week range
- **WHEN** the user is in court mode with a specific court selected
- **THEN** the system issues a single `useQueryDiscoveryAvailabilityForCourtRange` query spanning the 7 displayed days

#### Scenario: Any-court mode fetches week range
- **WHEN** the user is in any-court mode with a sport selected
- **THEN** the system issues a single `useQueryDiscoveryAvailabilityForPlaceSportRange` query spanning the 7 displayed days

#### Scenario: Week navigation triggers new fetch
- **WHEN** the user navigates to a different week via the calendar jump modal
- **THEN** a new week-range query is issued for the newly displayed 7-day range

### Requirement: Cart items shown in grid
The system SHALL visually distinguish cells whose time slots are already added to the booking cart. Carted cells SHALL display a distinct ring or border indicator.

#### Scenario: Cell with carted time slot
- **WHEN** a time slot has been added to the booking cart
- **THEN** the corresponding grid cell shows a green ring/border indicator

#### Scenario: Carted cell is not re-selectable
- **WHEN** user taps a cell that is already in the cart
- **THEN** the cell does not become a new selection anchor

### Requirement: Skeleton loading state
The system SHALL display a skeleton/shimmer loading state while week availability data is being fetched, matching the grid's column and row structure.

#### Scenario: Initial load
- **WHEN** the mobile booking sheet opens and availability data has not yet loaded
- **THEN** the grid area displays animated skeleton placeholders in the 7-column grid layout

#### Scenario: Week navigation loading
- **WHEN** user navigates to a new week and data is refetching
- **THEN** the grid transitions to the skeleton state until new data arrives

### Requirement: MobileDateStrip and TimeRangePicker removed from booking sheet
The system SHALL replace `MobileDateStrip` and `TimeRangePicker` with `MobileWeekGrid` in the mobile booking sheet. The components themselves SHALL remain available for use in other contexts.

#### Scenario: Mobile sheet renders week grid
- **WHEN** the mobile booking sheet is displayed
- **THEN** it contains `MobileWeekGrid` and does NOT contain `MobileDateStrip` or `TimeRangePicker`

#### Scenario: Components remain importable
- **WHEN** other parts of the application import `MobileDateStrip` or `TimeRangePicker`
- **THEN** the imports resolve successfully (components are not deleted, only removed from the booking sheet)
