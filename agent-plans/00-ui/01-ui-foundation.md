# UI Foundation - Design Tokens & Base Setup

**Phase:** UI-0  
**Dependencies:** None  
**Priority:** Must be completed first

---

## Overview

This document specifies the foundational UI setup required before building any pages. It covers Tailwind configuration, font loading, CSS variables, and base component customization according to the KudosCourts Design System.

---

## 1. Font Loading

### 1.1 Google Fonts Setup

**File:** `src/app/layout.tsx`

```tsx
import { Outfit, Source_Sans_3, IBM_Plex_Mono } from 'next/font/google'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html 
      lang="en" 
      className={`${outfit.variable} ${sourceSans.variable} ${ibmPlexMono.variable}`}
    >
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  )
}
```

### 1.2 Font Usage Guide

| Element | Font | Weight | Class |
|---------|------|--------|-------|
| Page titles (h1) | Outfit | 700 | `font-heading font-bold` |
| Section headers (h2) | Outfit | 600 | `font-heading font-semibold` |
| Card titles (h3) | Outfit | 600 | `font-heading font-semibold` |
| Buttons | Outfit | 600 | `font-heading font-semibold` |
| Body text | Source Sans 3 | 400 | `font-body` (default) |
| Labels | Source Sans 3 | 600 | `font-body font-semibold` |
| Code/refs | IBM Plex Mono | 400 | `font-mono` |

---

## 2. Tailwind Configuration

### 2.1 tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          light: 'hsl(var(--primary-light))',
          dark: 'hsl(var(--primary-dark))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          light: 'hsl(var(--accent-light))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          light: 'hsl(var(--destructive-light))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          light: 'hsl(var(--success-light))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          light: 'hsl(var(--warning-light))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
        xl: 'calc(var(--radius) + 4px)',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(26, 25, 23, 0.04)',
        'md': '0 1px 3px rgba(26, 25, 23, 0.04), 0 4px 12px rgba(26, 25, 23, 0.03)',
        'lg': '0 4px 6px rgba(26, 25, 23, 0.04), 0 10px 24px rgba(26, 25, 23, 0.06)',
        'hover': '0 8px 30px rgba(26, 25, 23, 0.08)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease forwards',
        'fade-in': 'fade-in 0.3s ease forwards',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## 3. CSS Variables

### 3.1 globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Background & Foreground (warm neutrals) */
    --background: 40 20% 98%;
    --foreground: 40 10% 10%;
    
    /* Card */
    --card: 40 20% 100%;
    --card-foreground: 40 10% 10%;
    
    /* Popover */
    --popover: 40 20% 100%;
    --popover-foreground: 40 10% 10%;
    
    /* Primary - Teal (from logo) */
    --primary: 173 82% 31%;
    --primary-foreground: 0 0% 100%;
    --primary-light: 173 50% 92%;
    --primary-dark: 173 82% 26%;
    
    /* Secondary */
    --secondary: 40 10% 96%;
    --secondary-foreground: 40 10% 15%;
    
    /* Muted */
    --muted: 40 10% 96%;
    --muted-foreground: 40 5% 45%;
    
    /* Accent - Orange (from logo) */
    --accent: 25 95% 53%;
    --accent-foreground: 0 0% 100%;
    --accent-light: 25 100% 92%;
    
    /* Destructive - Red */
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --destructive-light: 0 100% 94%;
    
    /* Success */
    --success: 161 94% 30%;
    --success-foreground: 0 0% 100%;
    --success-light: 161 76% 95%;
    
    /* Warning */
    --warning: 32 95% 44%;
    --warning-foreground: 32 95% 15%;
    --warning-light: 48 100% 96%;
    
    /* Border & Input */
    --border: 40 10% 90%;
    --input: 40 10% 90%;
    --ring: 173 82% 31%;
    
    /* Radius */
    --radius: 0.75rem;
  }

  .dark {
    --background: 40 10% 10%;
    --foreground: 40 10% 98%;
    
    --card: 40 10% 14%;
    --card-foreground: 40 10% 98%;
    
    --popover: 40 10% 14%;
    --popover-foreground: 40 10% 98%;
    
    --primary: 173 70% 45%;
    --primary-foreground: 40 10% 10%;
    --primary-light: 173 30% 20%;
    
    --secondary: 40 10% 20%;
    --secondary-foreground: 40 10% 90%;
    
    --muted: 40 10% 20%;
    --muted-foreground: 40 5% 60%;
    
    --accent: 25 90% 55%;
    --accent-foreground: 40 10% 10%;
    --accent-light: 25 30% 20%;
    
    --destructive: 0 65% 55%;
    --destructive-foreground: 0 0% 100%;
    
    --border: 0 0% 100% / 10%;
    --input: 0 0% 100% / 15%;
    --ring: 173 70% 45%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
  }
  
  /* Typography defaults */
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading;
  }
  
  h1 {
    @apply text-4xl font-bold tracking-tight;
  }
  
  h2 {
    @apply text-2xl font-semibold tracking-tight;
  }
  
  h3 {
    @apply text-xl font-semibold;
  }
  
  h4 {
    @apply text-lg font-semibold;
  }
  
  /* Focus ring for accessibility */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
  
  /* Reduce motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer utilities {
  /* Animation delays for staggered fade-in */
  .animation-delay-100 { animation-delay: 0.1s; }
  .animation-delay-200 { animation-delay: 0.2s; }
  .animation-delay-300 { animation-delay: 0.3s; }
  .animation-delay-400 { animation-delay: 0.4s; }
  .animation-delay-500 { animation-delay: 0.5s; }
}
```

---

## 4. Base Component Customization

### 4.1 Button Variants

Extend shadcn Button with KudosCourts styling:

**File:** `src/shared/components/ui/button.tsx`

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-heading font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-muted hover:border-muted-foreground/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: 
          "hover:bg-muted hover:text-foreground",
        link: 
          "text-accent underline-offset-4 hover:underline",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent/90",
        success:
          "bg-success text-success-foreground hover:bg-success/90",
      },
      size: {
        default: "h-10 px-6 py-2 text-sm",
        sm: "h-9 rounded-md px-4 text-sm",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 4.2 Card Component

**File:** `src/shared/components/ui/card.tsx`

```tsx
import * as React from "react"
import { cn } from "@/shared/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-md transition-all duration-300",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-heading text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### 4.3 Badge Component

**File:** `src/shared/components/ui/badge.tsx`

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3.5 py-1 font-heading text-xs font-semibold uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-primary-light text-primary-dark",
        secondary:
          "bg-secondary text-secondary-foreground",
        accent:
          "bg-accent-light text-accent",
        destructive:
          "bg-destructive-light text-destructive",
        success:
          "bg-success-light text-success",
        warning:
          "bg-warning-light text-warning-foreground",
        outline:
          "border border-current bg-transparent",
        free:
          "bg-success-light text-success",
        paid:
          "bg-primary-light text-primary-dark",
        contact:
          "bg-warning-light text-warning-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

### 4.4 Input Component

**File:** `src/shared/components/ui/input.tsx`

```tsx
import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-base font-body ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

---

## 5. Layout Components

### 5.1 Container

**File:** `src/shared/components/layout/container.tsx`

```tsx
import { cn } from "@/shared/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const containerSizes = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
}

export function Container({ 
  className, 
  size = 'lg', 
  children, 
  ...props 
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        containerSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

### 5.2 Page Layout

**File:** `src/shared/components/layout/page-layout.tsx`

```tsx
import { cn } from "@/shared/lib/utils"
import { Container } from "./container"

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function PageLayout({
  title,
  description,
  actions,
  className,
  children,
  ...props
}: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen pb-12", className)} {...props}>
      {(title || description || actions) && (
        <div className="border-b bg-card/50">
          <Container className="py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {title && <h1 className="text-3xl font-bold">{title}</h1>}
                {description && (
                  <p className="mt-1 text-muted-foreground">{description}</p>
                )}
              </div>
              {actions && <div className="flex gap-3">{actions}</div>}
            </div>
          </Container>
        </div>
      )}
      <Container className="mt-8">{children}</Container>
    </div>
  )
}
```

### 5.3 Bento Grid

**File:** `src/shared/components/layout/bento-grid.tsx`

```tsx
import { cn } from "@/shared/lib/utils"

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12
}

export function BentoGrid({ 
  className, 
  cols = 12, 
  children, 
  ...props 
}: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-5",
        {
          'grid-cols-1': cols === 1,
          'grid-cols-1 sm:grid-cols-2': cols === 2,
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': cols === 3,
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4': cols === 4,
          'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6': cols === 6,
          'grid-cols-1 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12': cols === 12,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: 1 | 2 | 3 | 4 | 6 | 8 | 12
  rowSpan?: 1 | 2 | 3
}

export function BentoItem({ 
  className, 
  colSpan = 4, 
  rowSpan = 1,
  children, 
  ...props 
}: BentoItemProps) {
  return (
    <div
      className={cn(
        "col-span-1",
        {
          'sm:col-span-1': colSpan === 1,
          'sm:col-span-2': colSpan === 2,
          'sm:col-span-3 md:col-span-3': colSpan === 3,
          'sm:col-span-2 md:col-span-4': colSpan === 4,
          'sm:col-span-3 md:col-span-6': colSpan === 6,
          'sm:col-span-4 md:col-span-8': colSpan === 8,
          'sm:col-span-6 md:col-span-12': colSpan === 12,
          'row-span-1': rowSpan === 1,
          'row-span-2': rowSpan === 2,
          'row-span-3': rowSpan === 3,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

---

## 6. Implementation Checklist

### 6.1 Font Setup

- [ ] Install Google Fonts via `next/font`
- [ ] Configure font variables in layout
- [ ] Verify fonts load correctly
- [ ] Test fallback fonts

### 6.2 Tailwind Configuration

- [ ] Update `tailwind.config.ts` with all tokens
- [ ] Configure color variables
- [ ] Configure custom shadows
- [ ] Configure animations
- [ ] Add font family extensions

### 6.3 CSS Variables

- [ ] Create `globals.css` with light mode variables
- [ ] Add dark mode variables
- [ ] Add base styles for typography
- [ ] Add focus ring styles
- [ ] Add reduced motion styles

### 6.4 Component Updates

- [ ] Update Button with KudosCourts variants
- [ ] Update Card styling
- [ ] Update Badge variants
- [ ] Update Input styling
- [ ] Create Container component
- [ ] Create PageLayout component
- [ ] Create BentoGrid components

### 6.5 Verification

- [ ] Colors render correctly in both modes
- [ ] Typography hierarchy is clear
- [ ] Focus states visible
- [ ] Animations smooth
- [ ] Mobile responsive

---

*End of UI Foundation*
