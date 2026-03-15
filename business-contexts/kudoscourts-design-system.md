# KudosCourts Design System

**Version:** 1.1  
**Last Updated:** January 7, 2025  
**Status:** Final

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Brand Colors](#2-brand-colors)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Components](#5-components)
6. [Motion & Interactions](#6-motion--interactions)
7. [Tailwind Configuration](#7-tailwind-configuration)
8. [Usage Guidelines](#8-usage-guidelines)

---

## 1. Design Philosophy

### 1.1 Core Aesthetic: Minimalist Bento

KudosCourts embraces a **clean, minimalist aesthetic** with a bento-grid layout system. The design prioritizes:

- **Clarity over decoration** — Every element serves a purpose
- **Generous white space** — Content breathes, reducing cognitive load
- **Subtle depth** — Soft shadows and borders create hierarchy without noise
- **Warm neutrality** — Slightly warm-tinted grays for an approachable feel
- **Strategic color** — Brand colors used sparingly for maximum impact

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Player-First** | Design decisions favor the player experience |
| **Mobile-First** | Touch-friendly, responsive from the ground up |
| **Quick Scan** | Information hierarchy enables rapid decision-making |
| **Trust Signals** | Clear status indicators build confidence in reservations |
| **Accessibility** | WCAG 2.1 AA compliance as baseline |
| **Expandable** | Design works for pickleball, tennis, badminton, and future court types |

### 1.3 Tone Keywords

- Friendly, not playful
- Professional, not corporate
- Clean, not sterile
- Confident, not aggressive

---

## 2. Brand Colors

### 2.1 Primary Palette

KudosCourts uses **three strategic brand colors** derived from the logo, against warm-tinted neutrals:

| Color | Name | Hex | OKLCH | Usage |
|-------|------|-----|-------|-------|
| 🟢 | **Teal** | `#0D9488` | `oklch(0.58 0.11 175)` | Primary CTAs, focus rings, main actions |
| 🟠 | **Orange** | `#F97316` | `oklch(0.70 0.18 45)` | Links, availability, highlights, location pins |
| 🔴 | **Red** | `#DC2626` | `oklch(0.55 0.22 27)` | Destructive actions, errors, expired states |

### 2.2 Logo Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     ┌─────────────────┬─────────────────┐                      │
│     │        │        │        │        │  ← Kitchen line      │
│     │        │        │        │        │                      │
│     ├────────┼────────┼────────┼────────┤  ← Net line (bold)   │
│     │        │   ┌────┴────┐   │        │                      │
│     │        │   │    ●    │   │        │  ← Orange pin        │
│     │        │   └────┬────┘   │        │                      │
│     ├────────┼────────┼────────┼────────┤  ← Kitchen line      │
│     │        │        │        │        │                      │
│     └─────────────────┴─────────────────┘                      │
│              ↑                                                  │
│         Center line (subtle)                                    │
│                                                                 │
│     Background: Teal gradient (#0F766E → #0D9488)              │
│     Court:      Square (320×320), white lines                  │
│     Pin:        Orange gradient (#FB923C → #F97316)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Logo Elements:**
- **Background**: Rounded square with teal gradient, rx=96
- **Court**: Perfect square with white outline and semi-transparent fill
- **Net line**: Bold horizontal line at center (stroke-width: 14)
- **Kitchen lines**: Two horizontal lines for top/bottom zones (stroke-width: 10)
- **Center line**: Vertical line dividing the court (subtle, 50% opacity)
- **Location pin**: Orange gradient circle with white center dot

### 2.3 Semantic Colors

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMARY (Teal)               │  Main Actions                   │
│  "Reserve Now", "Confirm"     │  #0D9488                        │
├─────────────────────────────────────────────────────────────────┤
│  ACCENT (Orange)              │  Interactive Elements           │
│  Links, available slots, pins │  #F97316                        │
├─────────────────────────────────────────────────────────────────┤
│  DESTRUCTIVE (Red)            │  Negative Actions               │
│  Cancel, delete, errors       │  #DC2626                        │
├─────────────────────────────────────────────────────────────────┤
│  SUCCESS                      │  Positive States                │
│  Confirmed, available         │  #059669                        │
├─────────────────────────────────────────────────────────────────┤
│  WARNING                      │  Caution States                 │
│  Pending, expiring            │  #D97706                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Neutral Palette (Warm-Tinted)

All neutrals have a subtle warm tint (hue ~90) for approachability:

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `background` | `#FAFAF9` | `#1A1917` | Page background |
| `foreground` | `#1A1917` | `#FAFAF9` | Primary text |
| `card` | `#FFFFFF` | `#262523` | Card backgrounds |
| `muted` | `#F5F5F4` | `#3D3B38` | Disabled, secondary bg |
| `muted-foreground` | `#78716C` | `#A8A29E` | Secondary text |
| `border` | `#E7E5E4` | `rgba(255,255,255,0.1)` | Borders, dividers |

### 2.5 Color Application Rules

**DO:**
- Use Teal for primary CTAs only (max 1-2 per screen)
- Use Orange for interactive affordances (links, available slots, location markers)
- Use Red sparingly for destructive/error states
- Keep most UI in neutrals

**DON'T:**
- Mix Teal and Orange buttons side-by-side
- Use brand colors for large background areas
- Apply Red to non-destructive actions

### 2.6 Light Background Variants

For tinted backgrounds (badges, pills, highlights):

| Base Color | Background | Foreground |
|------------|------------|------------|
| Primary | `#CCFBF1` | `#0F766E` |
| Accent | `#FFEDD5` | `#C2410C` |
| Destructive | `#FEE2E2` | `#B91C1C` |
| Success | `#ECFDF5` | `#059669` |
| Warning | `#FFFBEB` | `#D97706` |

---

## 3. Typography

### 3.1 Font Families

KudosCourts uses a **two-font system** optimized for clarity and personality:

| Role | Font | Weight Range | Usage |
|------|------|--------------|-------|
| **Headings** | Outfit | 500–800 | Titles, buttons, navigation |
| **Body** | Source Sans 3 | 300–600 | Paragraphs, labels, inputs |
| **Mono** | IBM Plex Mono | 400–500 | Code, reference numbers |

### 3.2 Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 3.3 Type Scale

| Token | Size | Line Height | Weight | Font | Usage |
|-------|------|-------------|--------|------|-------|
| `display` | 3rem (48px) | 1.1 | 800 | Outfit | Hero headlines |
| `h1` | 2.25rem (36px) | 1.2 | 700 | Outfit | Page titles |
| `h2` | 1.5rem (24px) | 1.25 | 600 | Outfit | Section headers |
| `h3` | 1.25rem (20px) | 1.3 | 600 | Outfit | Card titles |
| `h4` | 1.125rem (18px) | 1.4 | 600 | Outfit | Subsections |
| `body` | 1rem (16px) | 1.6 | 400 | Source Sans 3 | Default text |
| `body-sm` | 0.875rem (14px) | 1.5 | 400 | Source Sans 3 | Secondary text |
| `caption` | 0.75rem (12px) | 1.4 | 500 | Source Sans 3 | Labels, metadata |
| `overline` | 0.6875rem (11px) | 1.3 | 600 | Outfit | Tags, badges |

### 3.4 Typography Guidelines

**Headings (Outfit):**
- Use letter-spacing: `-0.02em` for h1–h2
- Use letter-spacing: `-0.01em` for h3–h4
- Never use below weight 500

**Body (Source Sans 3):**
- Default weight 400 for paragraphs
- Use weight 500 for emphasis within body text
- Use weight 600 for labels and form inputs
- Italic available for quotes and emphasis

**Special Cases:**
- Button text: Outfit 600, 14–15px
- Prices: Outfit 700
- Timestamps: Source Sans 3 400, muted color

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Based on 4px grid with 8px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps, icon padding |
| `space-2` | 8px | Default gap, inline spacing |
| `space-3` | 12px | Between related items |
| `space-4` | 16px | Component padding |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section margins |
| `space-10` | 40px | Large section gaps |
| `space-12` | 48px | Page sections |

### 4.2 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Small inputs, badges |
| `radius-md` | 8px | Buttons, small cards |
| `radius-lg` | 12px | Cards, modals |
| `radius-xl` | 16px | Featured cards, bento items |
| `radius-full` | 9999px | Pills, avatars |

### 4.3 Shadows

Soft, warm-tinted shadows for depth without harshness:

```css
--shadow-sm: 0 1px 2px rgba(26, 25, 23, 0.04);
--shadow-md: 0 1px 3px rgba(26, 25, 23, 0.04), 
             0 4px 12px rgba(26, 25, 23, 0.03);
--shadow-lg: 0 4px 6px rgba(26, 25, 23, 0.04), 
             0 10px 24px rgba(26, 25, 23, 0.06);
--shadow-hover: 0 8px 30px rgba(26, 25, 23, 0.08);
```

### 4.4 Bento Grid System

The discovery page uses a 12-column bento grid:

```
┌──────────────────────────────────────────────────────────────────┐
│  FEATURED COURT (8 cols, 2 rows)        │  MEDIUM CARD (4 cols)  │
│                                         │                        │
│  • Full slot preview                    ├────────────────────────┤
│  • Primary booking CTA                  │  SMALL CARD (4 cols)   │
│                                         │                        │
├─────────────────────────────────────────┴────────────────────────┤
│  AD BANNER (12 cols)                                             │
├──────────────────────────────────────────────────────────────────┤
│  SMALL CARD    │  SMALL CARD    │  SMALL CARD                    │
│  (4 cols)      │  (4 cols)      │  (4 cols)                      │
└──────────────────────────────────────────────────────────────────┘
```

**Grid specs:**
- Gap: 20px
- Responsive breakpoints:
  - Desktop: 12 columns
  - Tablet: 6 columns  
  - Mobile: 1 column
- Max-width: 1200px
- Container padding: 24px

---

## 5. Components

### 5.1 Buttons

**Primary Button (Teal)**
```
┌────────────────────────┐
│    Reserve Now         │  bg: #0D9488
│                        │  text: white
│                        │  font: Outfit 600
│                        │  radius: 8px
│                        │  padding: 12px 24px
└────────────────────────┘
```

**Secondary Button (Outline)**
```
┌────────────────────────┐
│    Contact             │  bg: transparent
│                        │  border: 1px border
│                        │  text: foreground
│                        │  font: Outfit 600
└────────────────────────┘
```

**Destructive Button (Red)**
```
┌────────────────────────┐
│    Cancel              │  bg: #DC2626
│                        │  text: white
│                        │  font: Outfit 600
└────────────────────────┘
```

### 5.2 Cards

**Court Card**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │  IMAGE                    [BADGE]│ │  180px height (260px featured)
│ │                                 │ │  Teal gradient placeholder
│ └─────────────────────────────────┘ │
│                                     │
│  Court Name                         │  h3: Outfit 600
│  📍 Location                        │  body-sm: muted
│                                     │
│  🎾 4 Courts  🕐 6AM–10PM           │  caption: muted
│                                     │
│  ─────────────────────────────────  │  border-top
│  ₱200 /hour        [Reserve Now]    │  price + CTA
└─────────────────────────────────────┘

Border: 1px solid border
Radius: 16px
Shadow: shadow-md
Hover: translateY(-4px), shadow-hover
```

### 5.3 Badges

**Court Type Badges**

| Type | Background | Text | Example |
|------|------------|------|---------|
| Free | `#ECFDF5` | `#059669` | `Free` |
| Paid | `#CCFBF1` | `#0F766E` | `₱150/hr` |
| Contact | `#FFFBEB` | `#D97706` | `Contact` |

**Styling:**
- Font: Outfit 600, 12px, uppercase
- Padding: 6px 14px
- Radius: 20px (pill)
- Letter-spacing: 0.3px

### 5.4 Time Slots (Player Booking Flow)

**Available Slot**
```
┌──────────┐
│  6:00 AM │  bg: #ECFDF5 (success-light)
│          │  text: #059669 (success)
│          │  border: transparent
└──────────┘
```

**Booked Slot**
```
┌──────────┐
│  8:00 AM │  bg: muted
│          │  text: muted-foreground
│          │  text-decoration: line-through
└──────────┘
```

**Selected/Hover Slot**
```
┌──────────┐
│  9:00 AM │  bg: #CCFBF1 (primary-light)
│          │  text: #0F766E (primary-dark)
│          │  border: 1px #0D9488
└──────────┘
```

### 5.4.1 Availability Studio Block Types

The Availability Studio uses semantically distinct colors for each block type.
Green signals "open/available", gray signals "inactive/blocked", and orange
shades represent different reservation states (dashed = unconfirmed hold,
solid = confirmed).

| Block Type    | Background    | Text          | Border             | Dot Color  | Semantic Meaning                  |
|---------------|---------------|---------------|--------------------|------------|-----------------------------------|
| Available     | emerald-50    | emerald-700   | dashed emerald-200 | emerald-500| Open — invites booking            |
| Maintenance   | muted/60      | muted-fg      | solid border       | muted-fg/60| Blocked — inactive, no action     |
| Walk-in       | orange-50     | orange-600    | dashed orange-200  | orange-400 | Reservation hold, not confirmed   |
| Guest Booking | orange-100    | orange-700    | solid orange-300   | orange-500 | Owner-created, confirmed          |
| Booked        | orange-200/60 | orange-800    | solid orange-300   | orange-600 | Player-booked through platform    |

**Design rationale:**
- **Green = available**: "Go" signal — invites players to book
- **Gray = maintenance**: Neutral/inactive — no action needed
- **Orange shades = reserved**: Three distinct intensities (light → medium → strong) for walk-in holds, guest bookings, and platform bookings
- **Dashed borders** on Available and Walk-in signal "open/unconfirmed"
- **Solid borders** on Guest Booking and Booked signal "confirmed"

**Hex values (for HTML/external use):**

| Block Type    | Background | Text    | Border  |
|---------------|------------|---------|---------|
| Available     | #ECFDF5    | #059669 | #A7F3D0 |
| Maintenance   | #F3F4F6    | #6B7280 | #E5E7EB |
| Walk-in       | #FFF7ED    | #EA580C | #FDBA74 |
| Guest Booking | #FFEDD5    | #C2410C | #FDBA74 |
| Booked        | #FED7AA    | #9A3412 | #FB923C |

### 5.5 Location Pin (from Logo)

The orange location pin is the key brand differentiator — it signals "court discovery":

```
       ┌───────────┐
       │           │
       │     ●     │  ← White center (r=24)
       │           │
       └───────────┘
           ↑
    Orange circle (r=48)
    Gradient: #FB923C → #F97316
    Inner shadow for depth
```

**Specifications:**
- Outer circle: 48px radius, orange gradient
- Inner circle: 24px radius, white fill
- Shadow: subtle inner shadow for depth
- Always centered on the element it marks

**Usage:**
- Logo (centered on court)
- Map markers for court locations
- Featured court cards
- "Discover" section highlights
- Empty states ("Find courts near you")

### 5.6 Form Inputs

```
┌─────────────────────────────────────┐
│  Search by location or court name   │  placeholder: muted
│                                     │  font: Source Sans 3 400
│                                     │  padding: 14px 18px
│                                     │  border: 1px solid border
│                                     │  radius: 8px
└─────────────────────────────────────┘

Focus state:
- border-color: #0D9488 (teal)
- box-shadow: 0 0 0 3px #CCFBF1
```

### 5.7 Status Indicators

| Status | Color | Icon | Usage |
|--------|-------|------|-------|
| Available | Emerald (green) | ✓ | Open slots |
| Confirmed | Orange | ✓ | Confirmed reservations (guest + platform booked) |
| Walk-in Hold | Light Orange | ⏸ | Reserved for walk-in customers |
| Awaiting | Warning (amber) | ⏳ | Pending payment |
| Expired | Red | ✕ | Expired reservations |
| Blocked | Muted (gray) | 🚫 | Maintenance / blocked slots |

---

## 6. Motion & Interactions

### 6.1 Transition Defaults

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
--transition-spring: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 6.2 Hover Effects

**Cards:**
- Transform: `translateY(-4px)`
- Shadow: `shadow-hover`
- Duration: 300ms ease

**Buttons:**
- Primary: darken to #0F766E, translateY(-1px)
- Secondary: background muted, border darken

**Slots:**
- Border color transition to primary
- Background transition to primary-light

### 6.3 Page Transitions

**Card Entrance (Staggered):**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bento-card {
  animation: fadeInUp 0.5s ease forwards;
}
.bento-card:nth-child(1) { animation-delay: 0.05s; }
.bento-card:nth-child(2) { animation-delay: 0.10s; }
.bento-card:nth-child(3) { animation-delay: 0.15s; }
```

---

## 7. Tailwind Configuration

### 7.1 CSS Variables (globals.css)

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Source+Sans+3:ital,wght@0,300;0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  /* Base */
  --background: oklch(0.985 0.003 90);
  --foreground: oklch(0.15 0.01 90);
  
  --card: oklch(1 0.002 90);
  --card-foreground: oklch(0.15 0.01 90);
  
  --popover: oklch(1 0.002 90);
  --popover-foreground: oklch(0.15 0.01 90);

  /* Primary - Teal (from logo) */
  --primary: oklch(0.58 0.11 175);
  --primary-foreground: oklch(0.99 0 0);
  --primary-light: oklch(0.92 0.04 175);
  --primary-dark: oklch(0.50 0.10 175);

  /* Secondary */
  --secondary: oklch(0.96 0.005 90);
  --secondary-foreground: oklch(0.20 0.01 90);

  /* Muted */
  --muted: oklch(0.96 0.005 90);
  --muted-foreground: oklch(0.55 0.01 90);

  /* Accent - Orange (from logo) */
  --accent: oklch(0.70 0.18 45);
  --accent-foreground: oklch(0.99 0 0);
  --accent-light: oklch(0.92 0.06 45);

  /* Destructive - Red */
  --destructive: oklch(0.55 0.22 27);
  --destructive-foreground: oklch(0.99 0 0);
  --destructive-light: oklch(0.92 0.06 27);

  /* Success */
  --success: oklch(0.60 0.15 160);
  --success-foreground: oklch(0.99 0 0);
  --success-light: oklch(0.95 0.04 160);

  /* Warning */
  --warning: oklch(0.65 0.15 70);
  --warning-foreground: oklch(0.20 0.01 70);
  --warning-light: oklch(0.96 0.04 70);

  /* Borders & Inputs */
  --border: oklch(0.91 0.005 90);
  --input: oklch(0.91 0.005 90);
  --ring: oklch(0.58 0.11 175);

  /* Typography */
  --font-heading: 'Outfit', ui-sans-serif, system-ui, sans-serif;
  --font-body: 'Source Sans 3', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  /* Radius */
  --radius: 12px;
}

.dark {
  --background: oklch(0.15 0.01 90);
  --foreground: oklch(0.98 0.003 90);
  
  --card: oklch(0.20 0.01 90);
  --card-foreground: oklch(0.98 0.003 90);

  --primary: oklch(0.65 0.10 175);
  --primary-foreground: oklch(0.15 0.01 90);
  --primary-light: oklch(0.25 0.05 175);

  --accent: oklch(0.72 0.16 45);
  --accent-foreground: oklch(0.15 0.01 45);
  --accent-light: oklch(0.30 0.08 45);

  --destructive: oklch(0.60 0.20 27);
  --destructive-foreground: oklch(0.99 0 0);

  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.65 0.10 175);
}
```

---

## 8. Usage Guidelines

### 8.1 Do's and Don'ts

**Color**

✅ **DO:**
- Use Teal for primary actions only
- Use Orange for location pins, links, and availability highlights
- Reserve Red for destructive/error states

❌ **DON'T:**
- Use brand colors for large areas
- Mix Teal and Orange buttons side-by-side
- Use color alone to convey meaning

**Typography**

✅ **DO:**
- Use Outfit for all headings and buttons
- Use Source Sans 3 for body text and form inputs

❌ **DON'T:**
- Mix multiple display fonts
- Use Outfit below 14px

---

## Appendix A: Quick Reference

### Color Tokens (Logo-Aligned)
```
primary        → Teal     → #0D9488 → CTAs, focus
accent         → Orange   → #F97316 → Links, pins, highlights
destructive    → Red      → #DC2626 → Errors, cancel
success        → Green    → #059669 → Confirmed
warning        → Amber    → #D97706 → Pending
```

### Font Stack
```
Headings: font-heading (Outfit)
Body:     font-body (Source Sans 3)
Code:     font-mono (IBM Plex Mono)
```

### Logo SVG (Square Court)
```svg
<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F766E"/>
      <stop offset="100%" style="stop-color:#0D9488"/>
    </linearGradient>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FB923C"/>
      <stop offset="100%" style="stop-color:#F97316"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bgGrad)"/>
  <g transform="translate(96, 96)">
    <rect x="0" y="0" width="320" height="320" rx="24" stroke="white" stroke-width="16" fill="rgba(255,255,255,0.1)"/>
    <line x1="0" y1="160" x2="320" y2="160" stroke="white" stroke-width="14"/>
    <line x1="0" y1="96" x2="320" y2="96" stroke="white" stroke-width="10" opacity="0.85"/>
    <line x1="0" y1="224" x2="320" y2="224" stroke="white" stroke-width="10" opacity="0.85"/>
    <line x1="160" y1="0" x2="160" y2="320" stroke="white" stroke-width="8" opacity="0.5"/>
    <circle cx="160" cy="160" r="48" fill="url(#orangeGrad)"/>
    <circle cx="160" cy="160" r="24" fill="white"/>
  </g>
</svg>
```

---

*End of Design System*
