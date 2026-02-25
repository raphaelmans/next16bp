## Purpose

Defines the multi-select day pill interaction model for add-on rule windows, including the UI collapse/expand mapping between grouped pill rows and per-day DB rows, and associated validation rules.

## Requirements

### Requirement: Rule windows SHALL use multi-select day pills instead of a single-day dropdown
The add-on rule window editor SHALL replace the `[Day ▼]` select with a row of 7 toggleable day pill buttons (`Su M T W Th F Sa`), allowing one rule row to span multiple days simultaneously.

#### Scenario: Owner selects multiple days for one rule
- **WHEN** an owner toggles M, T, W, Th, F day pills on a single rule row with `09:00 → 22:00` at `₱500/hr`
- **THEN** that rule row represents a window for all 5 selected days and will expand to 5 DB rows on save

#### Scenario: Owner selects a single day pill
- **WHEN** an owner toggles only the Sa pill on a rule row
- **THEN** the rule row represents a window for Saturday only and will expand to 1 DB row on save

#### Scenario: Day pills render as active/inactive toggles
- **WHEN** the rule row is rendered
- **THEN** each pill button reflects its selected state visually (filled vs muted) and toggles on click without requiring a dropdown interaction

### Requirement: UI layer SHALL collapse matching DB rows into combined pill rows on load
The add-on editor SHALL group incoming `CourtAddonRuleForm` rows with identical `(startMinute, endMinute, hourlyRateCents, currency)` into a single UI pill row, with all matching `dayOfWeek` values shown as selected pills.

#### Scenario: Five identical weekday rows collapse to one pill row
- **WHEN** an HOURLY add-on has 5 DB rows for Mon–Fri all with `startMinute=540`, `endMinute=1320`, `hourlyRateCents=500`, `currency=PHP`
- **THEN** the editor displays one rule row with M/T/W/Th/F pills selected and `09:00 → 22:00  ₱500/hr`

#### Scenario: Rows with different rates do not collapse
- **WHEN** an add-on has Mon `₱500/hr` and Sat `₱800/hr` at the same times
- **THEN** the editor displays two separate pill rows (M selected on one, Sa selected on the other)

#### Scenario: FLAT addon rows collapse by time range only
- **WHEN** a FLAT add-on has Sa and Su rows both with `startMinute=480`, `endMinute=1320` (both `hourlyRateCents` and `currency` are null)
- **THEN** the editor displays one pill row with Sa/Su selected and no rate field

### Requirement: UI layer SHALL expand pill groups to per-day DB rows on save
The add-on editor SHALL expand each `AddonRuleGroup` (a pill row) to individual `CourtAddonRuleForm` rows — one per selected day — before saving, preserving the existing save payload contract.

#### Scenario: One pill row with 3 days expands to 3 DB rows
- **WHEN** an owner saves a rule row with W/Th/F pills selected, `14:00 → 22:00`, `₱600/hr`
- **THEN** 3 separate DB rows are written: `dayOfWeek=3`, `dayOfWeek=4`, `dayOfWeek=5`, each with `startMinute=840`, `endMinute=1320`, `hourlyRateCents=600`

#### Scenario: Collapse then expand produces equivalent rows
- **WHEN** a set of per-day DB rows is collapsed into pill groups and then immediately expanded
- **THEN** the resulting rows are equivalent to the original set (same day/time/rate values, order may differ)

### Requirement: Rule group SHALL require at least one day pill selected
The add-on editor SHALL treat a rule group with no day pills selected as a blocking validation error and display an inline message preventing save.

#### Scenario: Empty day selection blocks save
- **WHEN** a rule row has zero day pills selected
- **THEN** the editor shows "Select at least one day" inline on that row and the save button is disabled until resolved

### Requirement: FLAT add-on with no rule windows SHALL display a non-blocking owner advisory
When a FLAT add-on has zero rule windows configured, the editor SHALL display a non-blocking advisory warning to the owner without preventing save.

#### Scenario: FLAT add-on with no windows shows advisory
- **WHEN** a FLAT add-on has an empty rules list
- **THEN** the editor shows "No windows configured — this add-on will never be charged" as a yellow advisory below the rules section

#### Scenario: FLAT add-on advisory does not block save
- **WHEN** a FLAT add-on has zero windows and the owner clicks save
- **THEN** the save proceeds without error (the advisory is informational, not a hard error)
