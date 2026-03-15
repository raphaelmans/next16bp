# UI Components - Reusable Component Library

**Phase:** Shared (Available throughout development)  
**Dependencies:** `01-ui-foundation.md` complete  
**Priority:** High - Build alongside feature development

---

## Overview

This document specifies the reusable component library for KudosCourts. Components are organized into:

1. **Base UI** - shadcn/ui components (customized per design system)
2. **Kudos Components** - KudosCourts-specific branded components
3. **Layout Components** - Page structure and grid systems
4. **Form Components** - Standardized form elements

---

## 1. Base UI Components (shadcn/ui)

### 1.1 Required shadcn/ui Components

Install these via `npx shadcn-ui@latest add`:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add input
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add table
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add tooltip
```

### 1.2 Component Customizations

See `01-ui-foundation.md` for customized:
- Button variants
- Card styling
- Badge variants
- Input styling

---

## 2. KudosCourts Branded Components

### 2.1 KudosCourtCard

**File:** `src/shared/components/kudos/court-card.tsx`

```tsx
interface KudosCourtCardProps {
  court: {
    id: string
    name: string
    address: string
    city: string
    courtType: 'CURATED' | 'RESERVABLE'
  }
  photo?: {
    url: string
  }
  detail?: {
    isFree?: boolean
    priceCents?: number
    currency?: string
  }
  variant?: 'default' | 'featured' | 'compact'
  showPrice?: boolean
  showCTA?: boolean
  className?: string
}

/* Visual Specs:
 * 
 * Default Variant:
 * ┌─────────────────────────────────────┐
 * │ ┌─────────────────────────────────┐ │
 * │ │  IMAGE            [BADGE]       │ │  height: 180px
 * │ │  aspect-[16/9]                  │ │  border-radius: top-xl
 * │ └─────────────────────────────────┘ │
 * │                                     │
 * │  Court Name                         │  font-heading text-lg font-semibold
 * │  📍 City                            │  text-sm text-muted-foreground
 * │                                     │
 * │  ─────────────────────────────────  │  border-top
 * │  ₱200/hour        [Reserve Now]     │  price + optional CTA
 * └─────────────────────────────────────┘
 * 
 * Hover: -translate-y-1 shadow-hover
 * Transition: duration-300 ease
 * Border: border rounded-xl
 * Background: card
 */

export function KudosCourtCard({
  court,
  photo,
  detail,
  variant = 'default',
  showPrice = true,
  showCTA = false,
  className,
}: KudosCourtCardProps) {
  const isFree = detail?.isFree
  const price = detail?.priceCents 
    ? `₱${(detail.priceCents / 100).toFixed(0)}/hr`
    : null

  return (
    <Link href={`/courts/${court.id}`}>
      <Card className={cn(
        "group overflow-hidden transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-hover cursor-pointer",
        variantStyles[variant],
        className
      )}>
        {/* Image Section */}
        <div className={cn(
          "relative overflow-hidden",
          variant === 'featured' ? 'h-[260px]' : 'h-[180px]'
        )}>
          {photo ? (
            <Image
              src={photo.url}
              alt={court.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <CourtIcon className="h-12 w-12 text-white/50" />
            </div>
          )}
          
          {/* Badge */}
          <div className="absolute top-3 right-3">
            {court.courtType === 'CURATED' ? (
              <Badge variant="accent">Public Listing</Badge>
            ) : isFree ? (
              <Badge variant="free">Free</Badge>
            ) : price ? (
              <Badge variant="paid">{price}</Badge>
            ) : null}
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-4">
          <h3 className="font-heading text-lg font-semibold line-clamp-1">
            {court.name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {court.city}
          </p>
        </CardContent>

        {/* Footer (optional) */}
        {(showPrice || showCTA) && (
          <CardFooter className="p-4 pt-0 border-t mt-auto">
            <div className="flex items-center justify-between w-full">
              {showPrice && price && (
                <span className="font-heading font-semibold">{price}</span>
              )}
              {showCTA && (
                <Button size="sm">Reserve Now</Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  )
}
```

### 2.2 KudosTimeSlotPicker

**File:** `src/shared/components/kudos/time-slot-picker.tsx`

```tsx
interface TimeSlot {
  id: string
  startTime: Date
  endTime: Date
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED'
  priceCents?: number
  currency?: string
}

interface KudosTimeSlotPickerProps {
  slots: TimeSlot[]
  selectedSlotId?: string
  onSelect: (slotId: string) => void
  disabled?: boolean
}

/* Visual Specs:
 * 
 * Grid: 4 columns desktop, 3 columns tablet, 2 columns mobile
 * Gap: 8px
 * 
 * Slot States:
 * ┌──────────────┐
 * │   6:00 AM    │
 * │   ₱200       │ (if price shown)
 * └──────────────┘
 * 
 * - Available: bg-success-light text-success border-transparent
 * - Booked: bg-muted text-muted-foreground line-through cursor-not-allowed
 * - Blocked: bg-muted text-muted-foreground cursor-not-allowed
 * - Held: bg-warning-light text-warning border-warning
 * - Selected: bg-primary-light text-primary-dark border-primary ring-2
 * 
 * Size: h-12 (h-16 if showing price)
 * Border-radius: rounded-lg
 * Transition: duration-200
 */

export function KudosTimeSlotPicker({
  slots,
  selectedSlotId,
  onSelect,
  disabled,
}: KudosTimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = slot.id === selectedSlotId
        const isAvailable = slot.status === 'AVAILABLE'
        const isClickable = isAvailable && !disabled

        return (
          <button
            key={slot.id}
            type="button"
            onClick={() => isClickable && onSelect(slot.id)}
            disabled={!isClickable}
            className={cn(
              "h-12 px-3 rounded-lg border transition-all duration-200",
              "flex flex-col items-center justify-center",
              "font-heading text-sm font-medium",
              getSlotStyles(slot.status, isSelected)
            )}
          >
            <span>{format(slot.startTime, 'h:mm a')}</span>
            {slot.priceCents && (
              <span className="text-xs opacity-75">
                ₱{(slot.priceCents / 100).toFixed(0)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function getSlotStyles(status: string, isSelected: boolean): string {
  if (isSelected) {
    return "bg-primary-light text-primary-dark border-primary ring-2 ring-primary/20"
  }
  
  switch (status) {
    case 'AVAILABLE':
      return "bg-success-light text-success border-transparent hover:border-success cursor-pointer"
    case 'BOOKED':
      return "bg-muted text-muted-foreground line-through cursor-not-allowed"
    case 'BLOCKED':
      return "bg-muted text-muted-foreground cursor-not-allowed"
    case 'HELD':
      return "bg-warning-light text-warning border-warning cursor-not-allowed"
    default:
      return "bg-muted text-muted-foreground cursor-not-allowed"
  }
}
```

### 2.3 KudosStatusBadge

**File:** `src/shared/components/kudos/status-badge.tsx`

```tsx
type ReservationStatus = 
  | 'CREATED'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_MARKED_BY_USER'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'CANCELLED'

type ClaimStatus = 
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'

interface KudosStatusBadgeProps {
  status: ReservationStatus | ClaimStatus
  size?: 'sm' | 'md' | 'lg'
}

/* Status Mapping:
 * 
 * Reservation:
 * - CREATED: primary, "Processing"
 * - AWAITING_PAYMENT: warning, "Awaiting Payment"
 * - PAYMENT_MARKED_BY_USER: primary, "Payment Pending"
 * - CONFIRMED: success, "Confirmed"
 * - EXPIRED: destructive, "Expired"
 * - CANCELLED: secondary, "Cancelled"
 * 
 * Claim:
 * - PENDING: warning, "Pending Review"
 * - APPROVED: success, "Approved"
 * - REJECTED: secondary, "Rejected"
 */

const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
  CREATED: { variant: 'default', label: 'Processing' },
  AWAITING_PAYMENT: { variant: 'warning', label: 'Awaiting Payment' },
  PAYMENT_MARKED_BY_USER: { variant: 'default', label: 'Payment Pending' },
  CONFIRMED: { variant: 'success', label: 'Confirmed' },
  EXPIRED: { variant: 'destructive', label: 'Expired' },
  CANCELLED: { variant: 'secondary', label: 'Cancelled' },
  PENDING: { variant: 'warning', label: 'Pending Review' },
  APPROVED: { variant: 'success', label: 'Approved' },
  REJECTED: { variant: 'secondary', label: 'Rejected' },
}

export function KudosStatusBadge({ status, size = 'md' }: KudosStatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant} className={cn(sizeStyles[size])}>
      {config.label}
    </Badge>
  )
}
```

### 2.4 KudosLocationPin

**File:** `src/shared/components/kudos/location-pin.tsx`

```tsx
interface KudosLocationPinProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/* From Design System - Logo Element:
 * 
 * Orange gradient circle with white center dot
 * Gradient: #FB923C → #F97316
 * Outer radius varies by size
 * Inner dot is 50% of outer radius
 */

const sizeMap = {
  sm: { outer: 24, inner: 12 },
  md: { outer: 32, inner: 16 },
  lg: { outer: 48, inner: 24 },
  xl: { outer: 64, inner: 32 },
}

export function KudosLocationPin({ size = 'md', className }: KudosLocationPinProps) {
  const { outer, inner } = sizeMap[size]
  
  return (
    <svg
      width={outer}
      height={outer}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="pin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#pin-gradient)" />
      <circle cx="24" cy="24" r="12" fill="white" />
    </svg>
  )
}
```

### 2.5 KudosCountdown

**File:** `src/shared/components/kudos/countdown.tsx`

```tsx
interface KudosCountdownProps {
  expiresAt: Date
  onExpire?: () => void
  variant?: 'default' | 'compact'
}

/* Visual Specs:
 * 
 * Default: "12:34 remaining"
 * Compact: "12:34"
 * 
 * Colors:
 * - > 5 min: text-foreground
 * - 2-5 min: text-warning
 * - < 2 min: text-destructive (pulsing)
 * 
 * Updates every second
 */

export function KudosCountdown({ 
  expiresAt, 
  onExpire,
  variant = 'default' 
}: KudosCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(expiresAt))

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(expiresAt)
      setTimeLeft(newTimeLeft)
      
      if (newTimeLeft.total <= 0) {
        clearInterval(timer)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [expiresAt, onExpire])

  const minutes = Math.floor(timeLeft.total / 60000)
  const colorClass = getColorClass(minutes)

  return (
    <span className={cn(
      "font-mono font-medium tabular-nums",
      colorClass,
      minutes < 2 && "animate-pulse"
    )}>
      {formatTimeLeft(timeLeft)}
      {variant === 'default' && ' remaining'}
    </span>
  )
}

function getColorClass(minutes: number): string {
  if (minutes < 2) return 'text-destructive'
  if (minutes < 5) return 'text-warning'
  return 'text-foreground'
}
```

### 2.6 KudosLogo

**File:** `src/shared/components/kudos/logo.tsx`

```tsx
interface KudosLogoProps {
  variant?: 'full' | 'icon'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/* From Design System - Logo SVG:
 * 
 * Full: Logo icon + "KudosCourts" text
 * Icon: Just the square court icon
 */

export function KudosLogo({ variant = 'full', size = 'md', className }: KudosLogoProps) {
  const iconSize = { sm: 32, md: 40, lg: 48 }[size]
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 512 512"
        fill="none"
        className="shrink-0"
      >
        {/* Full logo SVG from design system */}
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F766E"/>
            <stop offset="100%" stopColor="#0D9488"/>
          </linearGradient>
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C"/>
            <stop offset="100%" stopColor="#F97316"/>
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="96" fill="url(#bgGrad)"/>
        <g transform="translate(96, 96)">
          <rect x="0" y="0" width="320" height="320" rx="24" stroke="white" strokeWidth="16" fill="rgba(255,255,255,0.1)"/>
          <line x1="0" y1="160" x2="320" y2="160" stroke="white" strokeWidth="14"/>
          <line x1="0" y1="96" x2="320" y2="96" stroke="white" strokeWidth="10" opacity="0.85"/>
          <line x1="0" y1="224" x2="320" y2="224" stroke="white" strokeWidth="10" opacity="0.85"/>
          <line x1="160" y1="0" x2="160" y2="320" stroke="white" strokeWidth="8" opacity="0.5"/>
          <circle cx="160" cy="160" r="48" fill="url(#orangeGrad)"/>
          <circle cx="160" cy="160" r="24" fill="white"/>
        </g>
      </svg>
      
      {variant === 'full' && (
        <span className={cn(
          "font-heading font-bold tracking-tight",
          { 'text-lg': size === 'sm', 'text-xl': size === 'md', 'text-2xl': size === 'lg' }
        )}>
          KudosCourts
        </span>
      )}
    </div>
  )
}
```

### 2.7 KudosTimeline

**File:** `src/shared/components/kudos/timeline.tsx`

```tsx
interface TimelineEvent {
  id: string
  title: string
  description?: string
  timestamp: Date
  status?: 'success' | 'warning' | 'error' | 'default'
}

interface KudosTimelineProps {
  events: TimelineEvent[]
}

/* Visual Specs:
 * 
 * ● Title                   Timestamp
 * │ Description text
 * │
 * ● Title                   Timestamp
 * │ Description text
 * │
 * ● Title                   Timestamp
 *   Description text
 * 
 * Dot colors by status:
 * - success: bg-success
 * - warning: bg-warning
 * - error: bg-destructive
 * - default: bg-primary
 * 
 * Line: border-l-2 border-border
 * Most recent first (top)
 */

export function KudosTimeline({ events }: KudosTimelineProps) {
  return (
    <div className="space-y-0">
      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4">
          {/* Dot and line */}
          <div className="flex flex-col items-center">
            <div className={cn(
              "h-3 w-3 rounded-full shrink-0",
              statusColors[event.status || 'default']
            )} />
            {index < events.length - 1 && (
              <div className="w-0.5 flex-1 bg-border min-h-[40px]" />
            )}
          </div>

          {/* Content */}
          <div className="pb-6 flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm">{event.title}</p>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {format(event.timestamp, 'MMM d, h:mm a')}
              </time>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 2.8 KudosAdBanner (PRD Section 13)

**File:** `src/shared/components/kudos/ad-banner.tsx`

```tsx
interface KudosAdBannerProps {
  placement: 'discovery' | 'court-detail'
  className?: string
}

/* Visual Specs (PRD Section 13):
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                                                                         │
 * │   [Ad Image/Content]                              [Learn More →]        │
 * │                                                                         │
 * │   "List your court on KudosCourts"               Sponsored              │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * MVP Requirements:
 * - One banner ad only (hardcoded content)
 * - Non-intrusive placement
 * - Does not block core user flows
 * - No tracking/analytics for MVP
 * 
 * Placements:
 * - discovery: Primary placement on search results page
 * - court-detail: Secondary placement on court detail page
 * 
 * Styling:
 * - Background: muted/5 or subtle gradient
 * - Border: border border-border/50 rounded-lg
 * - Padding: p-4
 * - "Sponsored" label: text-xs text-muted-foreground
 * - Non-obtrusive, clearly marked as ad
 */

export function KudosAdBanner({ placement, className }: KudosAdBannerProps) {
  // MVP: Hardcoded ad content
  const adContent = {
    discovery: {
      title: "Own a pickleball court?",
      description: "List your court on KudosCourts and reach thousands of players",
      cta: "List Your Court",
      href: "/owner/courts/new",
    },
    'court-detail': {
      title: "Looking for more courts?",
      description: "Discover pickleball courts near you",
      cta: "Explore Courts",
      href: "/courts",
    },
  }

  const ad = adContent[placement]

  return (
    <div className={cn(
      "border border-border/50 rounded-lg p-4 bg-muted/5",
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading font-semibold">{ad.title}</p>
          <p className="text-sm text-muted-foreground">{ad.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button variant="outline" size="sm" asChild>
            <Link href={ad.href}>{ad.cta}</Link>
          </Button>
          <span className="text-xs text-muted-foreground">Sponsored</span>
        </div>
      </div>
    </div>
  )
}
```

### 2.9 KudosEmptyState

**File:** `src/shared/components/kudos/empty-state.tsx`

```tsx
interface KudosEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

/* Visual Specs:
 * 
 * ┌─────────────────────────────────────┐
 * │                                     │
 * │           [Icon/Image]              │
 * │                                     │
 * │           Title Text                │
 * │      Description text here         │
 * │                                     │
 * │         [Action Button]             │
 * │                                     │
 * └─────────────────────────────────────┘
 * 
 * Icon: text-muted-foreground, h-12 w-12
 * Title: font-heading text-lg font-semibold
 * Description: text-muted-foreground text-sm
 * Padding: py-12
 * Alignment: center
 */

export function KudosEmptyState({
  icon,
  title,
  description,
  action,
}: KudosEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 3. Layout Components

### 3.1 Components Index

| Component | File | Description |
|-----------|------|-------------|
| Container | `container.tsx` | Max-width wrapper with padding |
| PageLayout | `page-layout.tsx` | Standard page structure |
| BentoGrid | `bento-grid.tsx` | 12-column grid system |
| DashboardLayout | `dashboard-layout.tsx` | Sidebar + main content |

See `01-ui-foundation.md` for implementation details.

### 3.2 DashboardLayout

**File:** `src/shared/components/layout/dashboard-layout.tsx`

```tsx
interface DashboardLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

/* Visual Specs:
 * 
 * ┌───────────────────────────────────────────────────────────────┐
 * │  NAVBAR (h-16)                                                │
 * ├──────────────┬────────────────────────────────────────────────┤
 * │              │                                                │
 * │  SIDEBAR     │   MAIN CONTENT                                 │
 * │  (w-64)      │   (flex-1)                                     │
 * │              │                                                │
 * │              │                                                │
 * │              │                                                │
 * │              │                                                │
 * └──────────────┴────────────────────────────────────────────────┘
 * 
 * Mobile: Sidebar as Sheet (drawer)
 */

export function DashboardLayout({ sidebar, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNavbar />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
          {sidebar}
        </aside>
        
        {/* Mobile sidebar (Sheet) */}
        <MobileSidebar>{sidebar}</MobileSidebar>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## 4. Form Components

### 4.1 StandardForm Pattern

Use with react-hook-form + Zod:

```tsx
// Pattern for all forms
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/components/ui/form'

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ... },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fieldName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### 4.2 KudosDatePicker

**File:** `src/shared/components/kudos/date-picker.tsx`

```tsx
interface KudosDatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
}

/* Wraps shadcn Calendar in a Popover */

export function KudosDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
}: KudosDatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : 'Select date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
```

### 4.3 KudosFileUpload

**File:** `src/shared/components/kudos/file-upload.tsx`

```tsx
interface KudosFileUploadProps {
  value?: string // URL of uploaded file
  onChange: (url: string | null) => void
  accept?: string
  maxSizeMB?: number
  placeholder?: string
}

/* Visual Specs:
 * 
 * Empty state:
 * ┌─────────────────────────────────────┐
 * │                                     │
 * │    [Upload Icon]                    │
 * │    Click to upload or drag & drop   │
 * │    PNG, JPG up to 5MB               │
 * │                                     │
 * └─────────────────────────────────────┘
 * 
 * With image:
 * ┌─────────────────────────────────────┐
 * │ ┌─────────────────────────────────┐ │
 * │ │  [Image Preview]            [×] │ │
 * │ │                                 │ │
 * │ └─────────────────────────────────┘ │
 * │         [Change Image]              │
 * └─────────────────────────────────────┘
 * 
 * Border: border-2 border-dashed border-border
 * Hover: border-primary bg-primary/5
 * Drag active: border-primary bg-primary/10
 */
```

---

## 5. Component Export Index

**File:** `src/shared/components/kudos/index.ts`

```tsx
// Branded components
export { KudosCourtCard } from './court-card'
export { KudosTimeSlotPicker } from './time-slot-picker'
export { KudosStatusBadge } from './status-badge'
export { KudosLocationPin } from './location-pin'
export { KudosCountdown } from './countdown'
export { KudosLogo } from './logo'
export { KudosTimeline } from './timeline'
export { KudosAdBanner } from './ad-banner'
export { KudosEmptyState } from './empty-state'
export { KudosDatePicker } from './date-picker'
export { KudosFileUpload } from './file-upload'
```

---

## 6. Implementation Checklist

### 6.1 Base UI (shadcn)

- [ ] Install all required components
- [ ] Apply design system customizations
- [ ] Test in light/dark mode

### 6.2 Kudos Components

- [ ] KudosCourtCard (all variants)
- [ ] KudosTimeSlotPicker
- [ ] KudosStatusBadge
- [ ] KudosLocationPin
- [ ] KudosCountdown
- [ ] KudosLogo
- [ ] KudosTimeline
- [ ] KudosAdBanner (PRD Section 13)
- [ ] KudosEmptyState
- [ ] KudosDatePicker
- [ ] KudosFileUpload

### 6.3 Layout Components

- [ ] Container
- [ ] PageLayout
- [ ] BentoGrid + BentoItem
- [ ] DashboardLayout

### 6.4 Testing

- [ ] All components render correctly
- [ ] Responsive behavior works
- [ ] Keyboard accessibility
- [ ] Screen reader support
- [ ] Loading/error states

---

*End of UI Components*
