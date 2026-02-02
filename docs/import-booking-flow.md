# Import Bookings Flow — Video Mockup Reference

This document traces the **actual implementation** of the import bookings flow,
from the owner setup hub through to the availability calendar. Each screen is
annotated with the source file, line references, and a mobile-first ASCII
prototype for video recording.

**Video scenario:** An owner uploads **3 files** — a handwritten schedule photo,
a calendar screenshot, and an ICS calendar export — then uses **AI
normalization** to turn all three into structured booking rows.

---

## Route Map

```
/owner/get-started
  │  [Start import] button
  │
  ▼
/owner/import/bookings                    ← Step 1 of 4 (25%)
  │  Select venue → court scope → upload 3 files → [Continue]
  │
  ▼
/owner/import/bookings/[jobId]            ← Step 2 of 4 (50%) DRAFT
  │  ★ AI REQUIRED (has image sources)
  │  [Use AI (one-time)] → confirm dialog
  │
  ▼
/owner/import/bookings/[jobId]            ← NORMALIZING (spinner)
  │  ★ AI reads handwriting + screenshot + parses ICS
  │  (auto-refreshes)
  │
  ▼
/owner/import/bookings/[jobId]            ← Step 3 of 4 (75%) NORMALIZED
  │  ★ AI output: structured rows from all 3 sources
  │  Review rows → fix errors → [Commit N valid rows]
  │
  ▼
/owner/import/bookings/[jobId]            ← Step 4 of 4 (100%) COMMITTED
  │  (if from=setup → redirects back to get-started)
  │
  ▼
/owner/venues/[placeId]/courts/[courtId]/availability
     Imported blocks visible on calendar
```

---

## Screen 1 — Owner Setup Hub

**Route:** `/owner/get-started`
**File:** `src/app/(auth)/owner/get-started/page.tsx`

The "Import bookings" card appears after a venue exists (`hasVenue`).

```
┌─────────────────────────────┐
│  ◀  Owner Setup             │
│  Complete these steps...    │
│                             │
│  [1.Org ✓] [2.Venue ✓]     │  :148-183
│  [3.Verify] [4.Go Live]    │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📊  Import bookings     │ │  :789-827  ImportBookingsCard
│ │     Optional             │ │
│ │ Import existing bookings│ │
│ │ from ICS, CSV, or XLSX  │ │
│ │ files to block           │ │
│ │ availability.            │ │
│ │                          │ │
│ │ [ Start import  → ]     │ │  :814-821  onClick={handleStartImport}
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

**Navigation:** `handleStartImport` (:130-133) pushes to
`/owner/import/bookings?from=setup`

---

## Screen 2 — Upload (Step 1 of 4) — 3 Mixed Files

**Route:** `/owner/import/bookings?from=setup`
**File:** `src/app/(owner)/owner/import/bookings/page.tsx`

### Mobile Layout

```
┌─────────────────────────────┐
│  ◀ Owner > Imports > Book.  │  :327-332  breadcrumbs
│                             │
│  Import Existing Bookings   │  :325
│  Bring in external          │
│  reservations to prevent    │
│  double-booking.            │
│                             │
│ ┌─────────────────────────┐ │
│ │ Step 1 of 4             │ │  :338-339
│ │ Upload source files     │ │
│ │ ████░░░░░░░░ 25%        │ │  :345  <Progress value={25} />
│ │                          │ │
│ │ Choose venue and upload  │ │  :347
│ │ Upload up to three files│ │  :349-350
│ │ in any combination of   │ │
│ │ calendar, CSV, XLSX, or │ │
│ │ screenshots.            │ │
│ │                          │ │
│ │ Venue                    │ │  :356-383
│ │ ┌───────────────────┐   │ │
│ │ │ ClubPadel · Lima ▼│   │ │
│ │ └───────────────────┘   │ │
│ │                          │ │
│ │ Court scope (optional)   │ │  :387-388
│ │ ┌───────────┬──────────┐│ │
│ │ │(●) Multi  │( ) Single││ │  :404-464
│ │ │ Use court │ Assign   ││ │
│ │ │ names in  │ every row││ │
│ │ │ the file  │ to one   ││ │
│ │ └───────────┴──────────┘│ │
│ │                          │ │
│ │ Upload files (up to 3)   │ │  :510
│ │ ┌───────────────────┐   │ │
│ │ │                   │   │ │
│ │ │   ☁ Upload        │   │ │  :511-541  dropzone
│ │ │   Drag & drop     │   │ │
│ │ │   or click        │   │ │
│ │ │                   │   │ │
│ │ │  .ics .csv .xlsx  │   │ │
│ │ │  .png .jpg        │   │ │
│ │ │  Max: 20.0 MB     │   │ │  :54  MAX_FILE_SIZE
│ │ └───────────────────┘   │ │
│ │                          │ │
│ │ ── 3 uploaded files ──   │ │
│ │ ┌───────────────────┐   │ │
│ │ │ 🖼 schedule.jpg    │   │ │  ← HANDWRITTEN SCHEDULE PHOTO
│ │ │    1.8 MB     [✕] │   │ │    getFileIcon → ImageIcon :116-124
│ │ └───────────────────┘   │ │
│ │ ┌───────────────────┐   │ │
│ │ │ 🖼 cal-feb.png     │   │ │  ← CALENDAR SCREENSHOT
│ │ │    856.2 KB   [✕] │   │ │    getFileIcon → ImageIcon
│ │ └───────────────────┘   │ │
│ │ ┌───────────────────┐   │ │
│ │ │ 📅 feb-courts.ics │   │ │  ← ICS CALENDAR EXPORT
│ │ │    12.4 KB    [✕] │   │ │    getFileIcon → CalendarDays :113
│ │ └───────────────────┘   │ │
│ │                          │ │  :543-577  file list rendering
│ │ Up to 3 files (for      │ │  :603
│ │ example, three months)  │ │
│ │          [ Continue ]    │ │  :605  disabled={!canContinue}
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ How it works             │ │  :616-643
│ │ 1. Choose venue, upload  │ │
│ │ 2. Normalize (AI/parse)  │ │
│ │ 3. Review + fix rows     │ │
│ │ 4. Commit blocks         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⚠ AI normalization      │ │  :645-661
│ │   status                 │ │
│ │ ★ AI normalization       │ │
│ │   available for this     │ │
│ │   venue                  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⚠ Import constraints    │ │  :663-674
│ │ • Up to 3 files          │ │
│ │ • Hour-aligned only      │ │
│ │ • Screenshots = 1hr dur. │ │
│ │ • AI once per venue      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Supported formats        │ │  :676-690
│ │ .ics  .csv  .xlsx       │ │
│ │ .png  .jpg               │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**On Continue:** `handleContinue` (:240-264) builds `FormData` with all 3
files (:248-250), calls `createDraft` mutation, then pushes to
`/owner/import/bookings/[jobId]?from=setup`

---

## Screen 3 — Normalize (Step 2 of 4) — DRAFT status

**Route:** `/owner/import/bookings/[jobId]?from=setup`
**File:** `src/features/owner/components/owner-bookings-import-review-view.tsx`
**Job status:** `DRAFT`

Because the upload contains image files (`schedule.jpg`, `cal-feb.png`),
`hasImageSource` is `true` (:298-300). This means:
- The "Parse files" button is **hidden** (:633)
- "Use AI (one-time)" becomes the **primary** button (:645)
- A hint reads "Screenshot imports require AI normalization" (:659-663)

### Mobile Layout

```
┌─────────────────────────────┐
│  ◀ Owner > Imports > Review │  :559-563
│                             │
│  Review Import              │  :557
│  ClubPadel · Lima           │  :558
│  3 files import             │
│                             │
│ ┌─────────────────────────┐ │
│ │ Step 2 of 4             │ │  :572
│ │ Normalize data          │ │  :576
│ │ ████████░░░░ 50%        │ │  :528  progress (DRAFT=25)
│ │                          │ │
│ │ ┌─────────────────────┐ │ │
│ │ │                     │ │ │
│ │ │ Normalize Import    │ │ │  :626
│ │ │ Data                │ │ │
│ │ │                     │ │ │
│ │ │ Parse and validate  │ │ │  :629-631
│ │ │ the uploaded files  │ │ │
│ │ │ to prepare bookings │ │ │
│ │ │ for review.         │ │ │
│ │ │                     │ │ │
│ │ │ ┌─────────────────┐│ │ │
│ │ │ │                 ││ │ │
│ │ │ │  ★ USE AI       ││ │ │  :644-657
│ │ │ │   (ONE-TIME)    ││ │ │  variant="default" (primary, since hasImageSource)
│ │ │ │                 ││ │ │
│ │ │ └─────────────────┘│ │ │
│ │ │                     │ │ │
│ │ │ ⚠ Screenshot        │ │ │  :659-663
│ │ │ imports require AI  │ │ │
│ │ │ normalization.      │ │ │
│ │ │                     │ │ │
│ │ └─────────────────────┘ │ │
│ │                          │ │
│ │ What happens next:       │ │  :671
│ │ • Files parsed → rows   │ │
│ │ • Court names matched   │ │
│ │ • Time slots validated  │ │
│ │ • Duplicates flagged    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Actions                  │ │  :951
│ │ Process your import      │ │  :955
│ │                          │ │
│ │ [ ◀ Back to imports ]   │ │  :989-1002
│ │ [ Discard import    ]   │ │  :1005-1017
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Attached files           │ │  :1021-1048
│ │ schedule.jpg             │ │
│ │ IMAGE · 1.8 MB          │ │
│ │ ─────────────────────── │ │
│ │ cal-feb.png              │ │
│ │ IMAGE · 856.2 KB        │ │
│ │ ─────────────────────── │ │
│ │ feb-courts.ics           │ │
│ │ ICS · 12.4 KB           │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Import details           │ │  :1050-1076
│ │ Status    DRAFT          │ │
│ │ Source    MIXED           │ │  :303-308  (>1 source = "MIXED")
│ │ Court     Multiple       │ │
│ │ Files     3              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

> **Note for video:** The "Parse files" button does NOT appear because
> `hasImageSource` is `true` (:633). Only the AI button is shown, and it is
> the primary (filled) variant (:645).

---

## Screen 3a — AI Confirmation Dialog

**Triggered by:** clicking "Use AI (one-time)" (:392-397)
**File:** `owner-bookings-import-review-view.tsx` :1242-1266

```
┌─────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │  (backdrop)
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │ ★ Use AI              │  │  :1248
│  │   normalization?      │  │
│  │                       │  │
│  │ AI normalization can  │  │  :1250-1254
│  │ only be used ONCE per │  │
│  │ venue. After this,    │  │
│  │ you will need to rely │  │
│  │ on deterministic      │  │
│  │ parsing or manual     │  │
│  │ corrections. This     │  │
│  │ helps control AI      │  │
│  │ costs while still     │  │
│  │ providing the option  │  │
│  │ for complex imports.  │  │
│  │                       │  │
│  │ [Cancel]              │  │  :1256
│  │ [★ Use AI (one-time)] │  │  :1258  onClick={handleConfirmAiNormalize}
│  │                       │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**On confirm:** calls `normalize({ jobId, mode: "ai", confirmAiOnce: true })`
(:399-404)

---

## Screen 3b — AI Normalizing (Spinner)

**Job status:** `NORMALIZING`
**File:** `owner-bookings-import-review-view.tsx` :615-621

This is where the AI processes all 3 files simultaneously:

```
┌─────────────────────────────┐
│  ◀ Owner > Imports > Review │
│                             │
│  Review Import              │
│  ClubPadel · Lima           │
│  3 files import             │
│                             │
│ ┌─────────────────────────┐ │
│ │ Step 2 of 4             │ │
│ │ Normalize data          │ │
│ │ ████████░░░░ 50%        │ │
│ │                          │ │
│ │                          │ │
│ │         ⟳               │ │  :617  <Loader2 animate-spin />
│ │  ★ Normalizing your     │ │  :619
│ │    import data...       │ │
│ │                          │ │
│ │                          │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Actions                  │ │
│ │ (all buttons disabled)   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Attached files           │ │
│ │ schedule.jpg   IMAGE     │ │
│ │ cal-feb.png    IMAGE     │ │
│ │ feb-courts.ics ICS       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### What the AI does during this step

```
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │ schedule.jpg│   │ cal-feb.png │   │feb-courts   │
  │             │   │             │   │   .ics      │
  │ ┌─────────┐│   │ ┌─────────┐│   │ ┌─────────┐│
  │ │ Cancha 1││   │ │  Feb    ││   │ │VEVENT   ││
  │ │ 9-10 Lun││   │ │ ┌─┬─┬─┐││   │ │DTSTART: ││
  │ │ 10-11   ││   │ │ │█│ │█│││   │ │20250215 ││
  │ │ Cancha 2││   │ │ │ │█│ │││   │ │T090000  ││
  │ │ 14-15   ││   │ │ └─┴─┴─┘││   │ │SUMMARY: ││
  │ │ (messy  ││   │ │ blocked ││   │ │League   ││
  │ │  hand-  ││   │ │ slots   ││   │ └─────────┘│
  │ │  writing││   │ └─────────┘│   └─────────────┘
  │ └─────────┘│   └─────────────┘          │
  └──────┬──────┘          │                │
         │                 │                │
         ▼                 ▼                ▼
  ┌──────────────────────────────────────────────┐
  │                                              │
  │              ★ AI NORMALIZATION               │
  │                                              │
  │  • OCR handwriting → extract court + times   │
  │  • Vision: read calendar grid → blocked slots│
  │  • Parse ICS VEVENT → structured events      │
  │  • Match court names to venue courts         │
  │  • Validate hour-alignment (minute=0)        │
  │  • Detect duplicates across all 3 sources    │
  │  • Flag errors (unmapped courts, bad times)  │
  │                                              │
  └──────────────────────┬───────────────────────┘
                         │
                         ▼
  ┌──────────────────────────────────────────────┐
  │  NORMALIZED ROWS                             │
  │                                              │
  │  #1  schedule.jpg #1   Court 1  Mon 09→10 ✓ │
  │  #2  schedule.jpg #2   Court 1  Mon 10→11 ✓ │
  │  #3  schedule.jpg #3   Court 2  Mon 14→15 ✓ │
  │  #4  cal-feb.png #1    Court 1  Feb 15 09→10✓│
  │  #5  cal-feb.png #2    Court 2  Feb 15 11→12✓│
  │  #6  cal-feb.png #3    Court 1  Feb 16 10→11✓│
  │  #7  feb-courts.ics #1 Court A  Feb 15 09→10✓│
  │  #8  feb-courts.ics #2 Court B  Feb 15 14→15✓│
  │  #9  schedule.jpg #4   Unmapped Mon 16→17  ✕ │
  │  #10 cal-feb.png #4    Court ?  Feb 17 09:30✕│
  │                                              │
  │  Total: 10  Valid: 8  Errors: 2              │
  └──────────────────────────────────────────────┘
```

Query auto-refetches. When job status changes to `NORMALIZED`, UI updates
with the toast: "Normalized 10 rows (8 valid, 2 errors)" (:191-193)

---

## Screen 4 — Review Rows (Step 3 of 4) — AI Output

**Job status:** `NORMALIZED`
**File:** `owner-bookings-import-review-view.tsx`

### Mobile Layout (card-based, `md:hidden` :733)

Each row shows its **source file** so the owner can trace which file each
booking came from.

```
┌─────────────────────────────┐
│  ◀ Owner > Imports > Review │
│                             │
│  Review Import              │
│  ClubPadel · Lima           │
│  3 files import             │
│                             │
│ ┌─────────────────────────┐ │
│ │ Step 3 of 4             │ │  :572
│ │ Review and fix errors   │ │  :577
│ │ ████████████░░░░ 75%    │ │  :525  progress=75
│ │                          │ │
│ │ Total: 10  Valid: 8     │ │  :583-608
│ │ Errors: 2               │ │
│ │                          │ │
│ │ [All(10)] [Valid(8)]    │ │  :694-715  <Tabs>
│ │ [Errors(2)]             │ │
│ │                          │ │
│ │ ── from handwriting ──   │ │
│ │ ┌───────────────────┐   │ │
│ │ │ #1 schedule.jpg #1│   │ │  :751-756  getRowSourceLabel
│ │ │            ✓Valid  │   │ │  :758
│ │ │ Court 1            │   │ │  :761
│ │ │ Mon 09:00 → 10:00 │   │ │  :763-783
│ │ └───────────────────┘   │ │
│ │ ┌───────────────────┐   │ │
│ │ │ #2 schedule.jpg #2│   │ │
│ │ │            ✓Valid  │   │ │
│ │ │ Court 1            │   │ │
│ │ │ Mon 10:00 → 11:00 │   │ │
│ │ └───────────────────┘   │ │
│ │ ┌───────────────────┐   │ │
│ │ │ #3 schedule.jpg #3│   │ │
│ │ │            ✓Valid  │   │ │
│ │ │ Court 2            │   │ │
│ │ │ Mon 14:00 → 15:00 │   │ │
│ │ └───────────────────┘   │ │
│ │                          │ │
│ │ ── from screenshot ──    │ │
│ │ ┌───────────────────┐   │ │
│ │ │ #4 cal-feb.png #1 │   │ │
│ │ │            ✓Valid  │   │ │
│ │ │ Court 1            │   │ │
│ │ │ Feb 15 09:00→10:00│   │ │
│ │ └───────────────────┘   │ │
│ │ ┌───────────────────┐   │ │
│ │ │ #5 cal-feb.png #2 │   │ │
│ │ │            ✓Valid  │   │ │
│ │ │ Court 2            │   │ │
│ │ │ Feb 15 11:00→12:00│   │ │
│ │ └───────────────────┘   │ │
│ │                          │ │
│ │ ── from ICS export ──    │ │
│ │ ┌───────────────────┐   │ │
│ │ │ #7 feb-courts.ics │   │ │
│ │ │    #1      ✓Valid  │   │ │
│ │ │ Court A            │   │ │
│ │ │ Feb 15 09:00→10:00│   │ │
│ │ │ League match       │   │ │  :785  row.reason
│ │ └───────────────────┘   │ │
│ │ ┌───────────────────┐   │ │
│ │ │ #8 feb-courts.ics │   │ │
│ │ │    #2      ✓Valid  │   │ │
│ │ │ Court B            │   │ │
│ │ │ Feb 15 14:00→15:00│   │ │
│ │ │ Rental             │   │ │
│ │ └───────────────────┘   │ │
│ │                          │ │
│ │ ── errors ──             │ │
│ │ ┌───────────────────┐   │ │
│ │ │ #9 schedule.jpg #4│   │ │
│ │ │            ✕Error  │   │ │
│ │ │ Unmapped           │   │ │  ← AI couldn't match court name
│ │ │ Mon 16:00 → 17:00 │   │ │
│ │ │ ⚠ Court not found │   │ │  :789-796  row.errors
│ │ │ [✏] [🗑]          │   │ │  :800-818
│ │ └───────────────────┘   │ │
│ │ ┌───────────────────┐   │ │
│ │ │ #10 cal-feb.png #4│   │ │
│ │ │            ✕Error  │   │ │
│ │ │ Court ?            │   │ │
│ │ │ Feb 17 09:30→10:30│   │ │  ← not hour-aligned
│ │ │ ⚠ Not hour-aligned│   │ │
│ │ │ [✏] [🗑]          │   │ │
│ │ └───────────────────┘   │ │
│ │                          │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Actions                  │ │  :950-1018
│ │ Fix errors or commit     │ │
│ │                          │ │
│ │ [Fix in studio]          │ │  :961-963
│ │ [Commit 8 valid rows]   │ │  :967-976
│ │ ⚠ Fix 2 error(s) before │ │  :978-982
│ │   committing             │ │
│ │ ─────────────────────── │ │
│ │ [ ◀ Back to imports ]   │ │  :989-1002
│ │ [🗑 Discard import  ]   │ │  :1005-1017
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Attached files           │ │  :1021-1048
│ │ schedule.jpg             │ │
│ │ IMAGE · 1.8 MB          │ │
│ │ ─────────────────────── │ │
│ │ cal-feb.png              │ │
│ │ IMAGE · 856.2 KB        │ │
│ │ ─────────────────────── │ │
│ │ feb-courts.ics           │ │
│ │ ICS · 12.4 KB           │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ Import details           │ │  :1050-1076
│ │ Status    NORMALIZED     │ │
│ │ Source    MIXED           │ │
│ │ Court     Multiple       │ │
│ │ Files     3              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Desktop Layout (table, `hidden md:block` :825)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ #  │ Source           │ Court    │ Start           │ End             │ ... │
│────┼──────────────────┼──────────┼─────────────────┼─────────────────│     │
│ 1  │ schedule.jpg #1  │ Court 1  │ Mon 09:00       │ Mon 10:00      │ ✓   │
│ 2  │ schedule.jpg #2  │ Court 1  │ Mon 10:00       │ Mon 11:00      │ ✓   │
│ 3  │ schedule.jpg #3  │ Court 2  │ Mon 14:00       │ Mon 15:00      │ ✓   │
│ 4  │ cal-feb.png #1   │ Court 1  │ Feb 15 09:00    │ Feb 15 10:00   │ ✓   │
│ 5  │ cal-feb.png #2   │ Court 2  │ Feb 15 11:00    │ Feb 15 12:00   │ ✓   │
│ 6  │ cal-feb.png #3   │ Court 1  │ Feb 16 10:00    │ Feb 16 11:00   │ ✓   │
│ 7  │ feb-courts.ics #1│ Court A  │ Feb 15 09:00    │ Feb 15 10:00   │ ✓   │
│ 8  │ feb-courts.ics #2│ Court B  │ Feb 15 14:00    │ Feb 15 15:00   │ ✓   │
│ 9  │ schedule.jpg #4  │ Unmapped │ Mon 16:00       │ Mon 17:00      │ ✕   │
│    │                  │          │ ⚠ Court not found                │     │
│ 10 │ cal-feb.png #4   │ Court ?  │ Feb 17 09:30    │ Feb 17 10:30   │ ✕   │
│    │                  │          │ ⚠ Not hour-aligned               │     │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Screen 4a — Edit Row Dialog (fixing AI error)

**Triggered by:** pencil icon on error row #9
**File:** `owner-bookings-import-review-view.tsx` :1082-1163

```
┌─────────────────────────────┐
│  Edit Row #9                │  :1088
│  Update the booking details │  :1090
│  to fix errors              │
│                             │
│  Court                      │
│  ┌───────────────────┐     │  :1102-1117
│  │ Court 1          ▼│     │  owner picks correct court
│  └───────────────────┘     │
│                             │
│  Start time                 │
│  ┌───────────────────┐     │  :1121-1127
│  │ 2025-02-17T16:00  │     │
│  └───────────────────┘     │
│                             │
│  End time                   │
│  ┌───────────────────┐     │  :1129-1135
│  │ 2025-02-17T17:00  │     │
│  └───────────────────┘     │
│                             │
│  Reason (optional)          │
│  ┌───────────────────┐     │  :1139-1145
│  │ Private lesson     │     │
│  └───────────────────┘     │
│                             │
│  [Cancel]     [Save]       │  :1149-1160
└─────────────────────────────┘
```

---

## Screen 4b — Commit Confirmation Dialog

**Triggered by:** "Commit N valid rows" button (after fixing errors)
**File:** `owner-bookings-import-review-view.tsx` :1219-1239

```
┌─────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                             │
│  ┌───────────────────────┐  │
│  │ Commit import?        │  │  :1222
│  │                       │  │
│  │ This will create 10   │  │  :1224-1226
│  │ court blocks from the │  │
│  │ valid rows. These     │  │
│  │ blocks will prevent   │  │
│  │ double-booking for    │  │
│  │ the specified time    │  │
│  │ slots.                │  │
│  │                       │  │
│  │ [Cancel]  [Commit]    │  │  :1230-1237
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

**On commit success:**
- Toast: "Successfully committed 10 rows" (:249)
- If `from=setup`: redirects to `/owner/get-started` (:252-254)

---

## Screen 5 — Availability Calendar (Destination)

**Route:** `/owner/venues/[placeId]/courts/[courtId]/availability`
**File:** `src/app/(owner)/owner/venues/[placeId]/courts/[courtId]/availability/page.tsx`
(re-exports `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx`)

The owner reaches this page from the setup hub's "Manage availability" link
(:734-743 in get-started) after courts are configured and bookings committed.
Imported bookings appear as `MAINTENANCE`/`WALK_IN` court blocks on the
timeline grid.

```
┌─────────────────────────────┐
│  ◀ Court 1 — Availability   │
│                             │
│  ┌──────┐  February 2025   │
│  │ ◀  ▶ │  ┌──────────┐   │
│  │ S M T │  │ Day │Week│   │
│  │ W T F │  └──────────┘   │
│  │ S     │                  │
│  └──────┘                  │
│          Sat 15             │
│                             │
│  08:00 ┌──────────────┐    │
│        │              │    │
│  09:00 ├──────────────┤    │
│        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    │  ← from schedule.jpg (handwriting)
│        │  IMPORTED     │    │    + feb-courts.ics (League match)
│  10:00 ├──────────────┤    │
│        │              │    │
│  11:00 ├──────────────┤    │
│        │              │    │
│  12:00 ├──────────────┤    │
│        │              │    │
│  13:00 ├──────────────┤    │
│        │              │    │
│  14:00 ├──────────────┤    │
│        │              │    │
│  15:00 ├──────────────┤    │
│        │              │    │
│  16:00 ├──────────────┤    │
│        │▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    │  ← from schedule.jpg (handwriting)
│        │  IMPORTED     │    │    row #9 after manual fix
│  17:00 ├──────────────┤    │
│        │              │    │
│  18:00 └──────────────┘    │
│                             │
└─────────────────────────────┘
```

---

## AI Normalization — Full Highlighted Flow

```
 OWNER'S DESK                          KUDOSCOURTS APP
 ────────────                          ───────────────

 ┌──────────────┐
 │ 📝 Handwritten│  Photo of a
 │    schedule   │  whiteboard or
 │              │  notebook with
 │  Cancha 1    │  court bookings
 │  9-10 Liga   │  in messy
 │  10-11 Alqui │  handwriting
 │  Cancha 2    │
 │  14-15 Clase │
 └──────┬───────┘
        │
 ┌──────┴───────┐
 │ 📸 Calendar   │  Screenshot of
 │    screenshot │  Google Calendar
 │              │  or Apple Calendar
 │  ┌──┬──┬──┐ │  showing blocked
 │  │██│  │██│ │  time slots as
 │  │  │██│  │ │  colored blocks
 │  └──┴──┴──┘ │
 └──────┬───────┘
        │
 ┌──────┴───────┐
 │ 📅 ICS export │  Standard .ics
 │              │  file from
 │ BEGIN:VEVENT │  calendar app
 │ DTSTART:...  │  with structured
 │ SUMMARY:...  │  event data
 │ END:VEVENT   │
 └──────┬───────┘
        │
        │  Owner uploads all 3
        │  via drag-and-drop
        ▼
 ┌─────────────────────────────────────────────┐
 │                                             │
 │  STEP 1: UPLOAD                             │
 │  /owner/import/bookings                     │
 │                                             │
 │  Venue: ClubPadel · Lima                    │
 │  Court scope: Multiple courts               │
 │                                             │
 │  3 files attached:                          │
 │  🖼 schedule.jpg    1.8 MB                  │
 │  🖼 cal-feb.png     856.2 KB               │
 │  📅 feb-courts.ics  12.4 KB                │
 │                                             │
 │  [ Continue ]                               │
 │                                             │
 └──────────────────────┬──────────────────────┘
                        │ createDraft(formData)
                        ▼
 ┌─────────────────────────────────────────────┐
 │                                             │
 │  STEP 2: NORMALIZE  (DRAFT)                 │
 │  /owner/import/bookings/[jobId]             │
 │                                             │
 │  ⚠ "Screenshot imports require AI"          │
 │  "Parse files" button HIDDEN                │
 │                                             │
 │  ┌───────────────────────────────┐          │
 │  │                               │          │
 │  │    ★ USE AI (ONE-TIME)        │          │
 │  │                               │          │
 │  └───────────────┬───────────────┘          │
 │                  │                          │
 └──────────────────┼──────────────────────────┘
                    │ owner taps button
                    ▼
 ┌─────────────────────────────────────────────┐
 │                                             │
 │  CONFIRMATION DIALOG                        │
 │                                             │
 │  "AI normalization can only be used         │
 │   ONCE per venue."                          │
 │                                             │
 │  [Cancel]  [★ Use AI (one-time)]            │
 │                                             │
 └──────────────────┬──────────────────────────┘
                    │ normalize({ mode:"ai", confirmAiOnce:true })
                    ▼
 ┌─────────────────────────────────────────────┐
 │                                             │
 │  NORMALIZING (spinner)                      │
 │                                             │
 │  ★ AI is processing 3 files:                │
 │                                             │
 │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
 │  │schedule  │ │cal-feb   │ │feb-courts│   │
 │  │.jpg      │ │.png      │ │.ics      │   │
 │  │          │ │          │ │          │   │
 │  │ OCR +    │ │ Vision + │ │ Parse    │   │
 │  │ extract  │ │ grid     │ │ VEVENT   │   │
 │  │ hand-    │ │ reading  │ │ fields   │   │
 │  │ writing  │ │          │ │          │   │
 │  └────┬─────┘ └────┬─────┘ └────┬─────┘   │
 │       │            │            │          │
 │       └────────────┼────────────┘          │
 │                    ▼                       │
 │       ┌────────────────────────┐           │
 │       │ ★ Court name matching │           │
 │       │ ★ Hour-alignment check│           │
 │       │ ★ Duplicate detection │           │
 │       │ ★ Row status assign   │           │
 │       └────────────┬───────────┘           │
 │                    │                       │
 │         ⟳ "Normalizing your               │
 │            import data..."                 │
 │                                             │
 └──────────────────────┬──────────────────────┘
                        │ auto-refetch detects NORMALIZED
                        ▼
 ┌─────────────────────────────────────────────┐
 │                                             │
 │  STEP 3: REVIEW  (NORMALIZED)               │
 │  /owner/import/bookings/[jobId]             │
 │                                             │
 │  Total: 10  ★ Valid: 8  Errors: 2          │
 │                                             │
 │  ┌─────────────────────────────────────┐   │
 │  │ #1  schedule.jpg  Court 1  09→10 ✓ │   │
 │  │ #4  cal-feb.png   Court 1  09→10 ✓ │   │
 │  │ #7  feb-courts    Court A  09→10 ✓ │   │
 │  │ ...                                 │   │
 │  │ #9  schedule.jpg  Unmapped 16→17 ✕ │   │
 │  │ #10 cal-feb.png   Court ?  09:30 ✕ │   │
 │  └─────────────────────────────────────┘   │
 │                                             │
 │  Owner fixes errors with [✏] edit dialog   │
 │                                             │
 │  [Commit 10 valid rows]                     │
 │                                             │
 └──────────────────────┬──────────────────────┘
                        │ commit({ jobId })
                        ▼
 ┌─────────────────────────────────────────────┐
 │                                             │
 │  STEP 4: COMMITTED                          │
 │                                             │
 │  ✓ "Successfully committed 10 rows"         │
 │                                             │
 │  → redirects to /owner/get-started          │
 │    (if from=setup)                          │
 │                                             │
 └──────────────────────┬──────────────────────┘
                        │
                        ▼
 ┌─────────────────────────────────────────────┐
 │                                             │
 │  AVAILABILITY CALENDAR                      │
 │  /owner/venues/[placeId]/courts/[courtId]/  │
 │  availability                               │
 │                                             │
 │  Court 1 — February 15                      │
 │                                             │
 │  09:00 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← from all 3 files│
 │  10:00 ░░░░░░░░░░░░░░░                     │
 │  11:00 ░░░░░░░░░░░░░░░                     │
 │  ...                                        │
 │  16:00 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← manual fix      │
 │  17:00 ░░░░░░░░░░░░░░░                     │
 │                                             │
 │  Blocks prevent double-booking              │
 │                                             │
 └─────────────────────────────────────────────┘
```

---

## File Reference Index

| Screen | File | Key Lines |
|--------|------|-----------|
| Setup Hub | `src/app/(auth)/owner/get-started/page.tsx` | :130-133 (nav), :789-827 (card) |
| Upload | `src/app/(owner)/owner/import/bookings/page.tsx` | :137-696 (full page) |
| Upload — venue select | same | :362-383 |
| Upload — court scope | same | :393-464 |
| Upload — dropzone | same | :511-541 |
| Upload — file list | same | :543-577 |
| Upload — file icon logic | same | :111-125 (getFileIcon), :127-135 (isImageFile) |
| Upload — continue | same | :240-264 (handleContinue) |
| Upload — AI status alert | same | :645-661 |
| Review (all states) | `src/features/owner/components/owner-bookings-import-review-view.tsx` | :110-1269 |
| Review — hasImageSource check | same | :298-300 |
| Review — DRAFT normalize (AI only) | same | :614-687, :633 (Parse hidden), :645 (AI primary) |
| Review — AI confirm dialog | same | :1242-1266 |
| Review — NORMALIZING spinner | same | :615-621 |
| Review — NORMALIZED table (desktop) | same | :825-940 |
| Review — NORMALIZED cards (mobile) | same | :733-822 |
| Review — source label per row | same | :310-315 (getRowSourceLabel) |
| Review — edit row dialog | same | :1082-1163 |
| Review — commit dialog | same | :1219-1239 |
| Review — commit handler + redirect | same | :238-259 |
| Availability | `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | (re-exported) |
