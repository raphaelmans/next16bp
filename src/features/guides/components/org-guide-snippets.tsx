"use client";

import {
  AlertCircle,
  Bell,
  Building2,
  Calendar,
  ChevronRight,
  CirclePlus,
  Clock,
  Copy,
  FileText,
  Lock,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  Target,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Shared wrapper — faded "preview" container around each snippet
// ---------------------------------------------------------------------------
function SnippetWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
        What you will see
      </p>
      <div className="pointer-events-none select-none">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. MockOrganizationForm — matches organization-form.tsx
// ---------------------------------------------------------------------------
export function MockOrganizationForm() {
  return (
    <SnippetWrapper>
      <div className="w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-heading font-semibold">
            Create Your Organization
          </h2>
          <p className="text-sm text-muted-foreground">
            Set up your organization to start listing courts on Kudos
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium">
              Organization Name
              <span className="ml-1 text-destructive">*</span>
            </p>
            <Input
              readOnly
              tabIndex={-1}
              value="Cebu Sports Hub"
              placeholder="My Sports Club (Pickleball)"
              className="h-9"
            />
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="button" className="flex-1">
              Create Organization
            </Button>
          </div>
        </div>
      </div>
    </SnippetWrapper>
  );
}

// ---------------------------------------------------------------------------
// 2a. MockCourtForm — matches court-form.tsx (court details card only)
// ---------------------------------------------------------------------------
export function MockCourtForm() {
  return (
    <SnippetWrapper>
      <Card>
        <CardHeader>
          <CardTitle>Court Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium">
              Venue
              <span className="ml-1 text-destructive">*</span>
            </p>
            <Select value="place-1">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="place-1">
                  Cebu Sports Hub &middot; Cebu City
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[0.8rem] text-muted-foreground">
              Select the venue where this court belongs.
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium">
              Sport
              <span className="ml-1 text-destructive">*</span>
            </p>
            <Select value="sport-1">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sport-1">Badminton</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[0.8rem] text-muted-foreground">
              Choose the sport for this court.
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium">
              Court Label
              <span className="ml-1 text-destructive">*</span>
            </p>
            <Input readOnly tabIndex={-1} value="Court A" className="h-9" />
          </div>

          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium">Tier Label</p>
            <Input
              readOnly
              tabIndex={-1}
              value="Premium"
              placeholder="e.g., Premium"
              className="h-9"
            />
            <p className="text-[0.8rem] text-muted-foreground">
              Optional label to distinguish premium or standard courts.
            </p>
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

// ---------------------------------------------------------------------------
// 2b. MockCourtScheduleEditor — matches court-schedule-editor.tsx
// ---------------------------------------------------------------------------
const MOCK_SCHEDULE_DAYS = [
  { value: 0, label: "Sunday", initial: "S" },
  { value: 1, label: "Monday", initial: "M" },
  { value: 2, label: "Tuesday", initial: "T" },
  { value: 3, label: "Wednesday", initial: "W" },
  { value: 4, label: "Thursday", initial: "Th" },
  { value: 5, label: "Friday", initial: "F" },
  { value: 6, label: "Saturday", initial: "S" },
];

function MockScheduleSlotRow({
  start,
  end,
  rate,
  isOpen,
  isLast,
}: {
  start: string;
  end: string;
  rate: string;
  isOpen: boolean;
  isLast: boolean;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="time"
          readOnly
          tabIndex={-1}
          value={start}
          className="w-[120px]"
        />
        <span className="text-muted-foreground text-sm">&ndash;</span>
        <Input
          type="time"
          readOnly
          tabIndex={-1}
          value={end}
          className="w-[120px]"
        />
        <div className="flex items-center gap-2 min-w-[80px]">
          <Switch checked={isOpen} disabled />
          <span className="text-xs text-muted-foreground">
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>
        <InputGroup className="w-[160px]">
          <InputGroupAddon>PHP</InputGroupAddon>
          <InputGroupInput type="number" readOnly tabIndex={-1} value={rate} />
        </InputGroup>
        <div className="flex items-center gap-1 ml-auto">
          <Button type="button" variant="outline" size="sm" className="text-xs">
            Copy to all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove block"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {isLast && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Add block"
            >
              <CirclePlus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MockCourtScheduleEditor() {
  return (
    <SnippetWrapper>
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-heading font-semibold">
                Schedule &amp; Pricing
              </h3>
              <p className="text-sm text-muted-foreground">
                Set opening hours and PHP rates for each day.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline">
              Copy schedule from another court
            </Button>
          </div>

          <div className="rounded-xl border p-2">
            <Accordion type="single" collapsible defaultValue="1">
              {MOCK_SCHEDULE_DAYS.map((day) => {
                const hasSlots = day.value === 1 || day.value === 2;
                const isMonday = day.value === 1;

                return (
                  <AccordionItem key={day.value} value={String(day.value)}>
                    <AccordionTrigger className="px-2 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                            hasSlots
                              ? "bg-teal-100 text-teal-700"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {day.initial}
                        </span>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-sm font-medium">
                            {day.label}
                          </span>
                          {!isMonday && hasSlots && (
                            <span className="text-xs text-muted-foreground">
                              8:00 AM &ndash; 10:00 PM &middot; PHP 300
                            </span>
                          )}
                          {!hasSlots && (
                            <span className="text-xs text-muted-foreground italic">
                              Set a schedule
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>

                    {isMonday && (
                      <AccordionContent className="px-2">
                        <div className="space-y-2">
                          <MockScheduleSlotRow
                            start="08:00"
                            end="17:00"
                            rate="300"
                            isOpen
                            isLast={false}
                          />
                          <MockScheduleSlotRow
                            start="17:00"
                            end="22:00"
                            rate="450"
                            isOpen
                            isLast
                          />
                        </div>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          <div className="flex justify-end">
            <Button type="button" className="w-full sm:w-auto">
              Save schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

// ---------------------------------------------------------------------------
// 2d. MockCourtAddonEditor — matches court-addon-editor.tsx
// ---------------------------------------------------------------------------
function MockDayPills({ selected }: { selected: number[] }) {
  const DAYS = ["Su", "M", "T", "W", "Th", "F", "Sa"];
  return (
    <div className="flex gap-1">
      {DAYS.map((label, i) => (
        <span
          key={label}
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
            selected.includes(i)
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export function MockCourtAddonEditor() {
  return (
    <SnippetWrapper>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Add-ons</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure optional or auto-applied extras for this court.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add add-on
              <Badge variant="secondary" className="ml-2">
                1
              </Badge>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Scope label */}
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              This court
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Single add-on card */}
          <div className="overflow-hidden rounded-xl border shadow-sm">
            {/* Identity row */}
            <div className="flex flex-wrap items-center gap-2.5 p-4 sm:flex-nowrap sm:p-5">
              <Input
                readOnly
                tabIndex={-1}
                value="Racket Rental"
                className="min-w-0 flex-1 font-medium"
              />
              <Select value="OPTIONAL">
                <SelectTrigger className="w-36 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPTIONAL">Optional</SelectItem>
                  <SelectItem value="AUTO">Auto-applied</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex shrink-0 items-center gap-1.5">
                <Switch checked disabled />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <Badge variant="outline">Court</Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground"
                aria-label="Remove add-on"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Pricing section */}
            <div className="border-t bg-muted/30 px-4 py-3 sm:px-5">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pricing
              </p>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value="HOURLY">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOURLY">Hourly add-on</SelectItem>
                    <SelectItem value="FLAT">Flat add-on</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Schedule rules */}
            <div className="border-t px-4 pb-4 pt-3 sm:px-5">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Schedule rules
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add rule
                </Button>
              </div>
              <div className="space-y-2">
                {/* Column headers */}
                <div className="hidden grid-cols-[auto_1fr_1fr_1fr_36px] gap-2 px-1 md:grid">
                  <span className="text-xs text-muted-foreground">Days</span>
                  <span className="text-xs text-muted-foreground">From</span>
                  <span className="text-xs text-muted-foreground">To</span>
                  <span className="text-xs text-muted-foreground">
                    Rate (PHP/hr)
                  </span>
                  <span />
                </div>
                {/* Rule row */}
                <div className="grid gap-2 rounded-lg border bg-card p-2 md:grid-cols-[auto_1fr_1fr_1fr_36px] md:rounded-none md:border-0 md:bg-transparent md:p-0">
                  <MockDayPills selected={[1, 2, 3, 4, 5]} />
                  <Input
                    type="time"
                    readOnly
                    tabIndex={-1}
                    className="h-8 text-sm"
                    value="09:00"
                  />
                  <Input
                    type="time"
                    readOnly
                    tabIndex={-1}
                    className="h-8 text-sm"
                    value="22:00"
                  />
                  <Input
                    type="number"
                    readOnly
                    tabIndex={-1}
                    className="h-8 text-sm"
                    value="50"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-muted-foreground"
                    aria-label="Remove rule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="button">Save add-ons</Button>
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

// ---------------------------------------------------------------------------
// 3. MockPaymentMethodsManager — matches payment-methods-manager.tsx
// ---------------------------------------------------------------------------
export function MockPaymentMethodsManager() {
  return (
    <SnippetWrapper>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Payment Methods</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add mobile wallets and bank accounts for booking payments.
            </p>
          </div>
          <Button type="button" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GCash — default, active */}
          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">GCash</span>
                  <Badge variant="outline">Mobile Wallet</Badge>
                  <Badge variant="secondary">Default</Badge>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Account Name</p>
                  <p className="font-medium">Juan Dela Cruz</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Account Number</p>
                  <p className="font-mono font-medium">0917 123 4567</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Include reservation ID in the payment note.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button type="button" variant="outline" size="sm">
                  Deactivate
                </Button>
                <Button type="button" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* BPI — active, not default */}
          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">BPI</span>
                  <Badge variant="outline">Bank</Badge>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Account Name</p>
                  <p className="font-medium">Cebu Sports Hub Inc.</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Account Number</p>
                  <p className="font-mono font-medium">1234-5678-90</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button type="button" variant="outline" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Set Default
                </Button>
                <Button type="button" variant="outline" size="sm">
                  Deactivate
                </Button>
                <Button type="button" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

// ---------------------------------------------------------------------------
// 4. MockVerificationPanel — matches place-verification-panel.tsx
// ---------------------------------------------------------------------------
export function MockVerificationPanel() {
  return (
    <SnippetWrapper>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Venue verification
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Verify Cebu Sports Hub to build trust while you manage
                reservations.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="px-3 py-1 text-muted-foreground"
            >
              <AlertCircle className="h-3 w-3" />
              Not verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-border/70 bg-muted/40">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <AlertTitle className="font-heading">Not verified</AlertTitle>
            <AlertDescription>
              Submit documents to add a verified badge for players.
            </AlertDescription>
          </Alert>

          {/* Reservations toggle — matches lines 260-300 */}
          <div className="rounded-lg border border-border/70 bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Reservations disabled
                </div>
                <p className="text-xs text-muted-foreground">
                  Toggle to accept bookings now. Players will see a verification
                  warning until review is complete.
                </p>
              </div>
              <Button type="button" className="min-w-[160px]">
                Enable reservations
              </Button>
            </div>
          </div>

          {/* Document upload — matches lines 309-338 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Upload documents</div>
              <p className="text-xs text-muted-foreground">
                Accepted formats: JPG, PNG, WebP, PDF. Max size per file: 10 MB.
              </p>
              <div className="rounded-lg border border-dashed p-4">
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    Drag &amp; drop files or click to browse
                  </span>
                  <span className="text-xs">
                    Photo with the court showing today&apos;s date, or other
                    proof.
                  </span>
                </div>
              </div>
            </div>

            {/* Mock uploaded file */}
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground">
                    court-photo-march-2026.jpg
                  </div>
                  <div className="text-xs text-muted-foreground">2.40 MB</div>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm">
                Remove
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button">Submit for review</Button>
              <Button type="button" variant="outline">
                Clear form
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

// ---------------------------------------------------------------------------
// 4. MockNotificationBellInbox — matches notification-bell.tsx +
//    notification-inbox.tsx + reservation-notification-routing-settings.tsx
// ---------------------------------------------------------------------------

const MOCK_INBOX_ITEMS = [
  {
    title: "New reservation request",
    body: "Juan D. requested Court A on March 16, 6:00 PM – 7:00 PM.",
    isUnread: true,
    time: "2 min ago",
  },
  {
    title: "Booking confirmed",
    body: "Maria S. confirmed Court B on March 15, 2:00 PM – 3:00 PM.",
    isUnread: true,
    time: "1 hour ago",
  },
  {
    title: "Reservation cancelled",
    body: "Carlos R. cancelled Court A on March 14.",
    isUnread: false,
    time: "Yesterday",
  },
];

export function MockNotificationBellInbox() {
  return (
    <SnippetWrapper>
      <div className="space-y-4">
        {/* Notification bell + inbox popover — matches notification-bell.tsx / notification-inbox.tsx */}
        <div className="w-80 rounded-lg border bg-background shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-3">
            <p className="font-heading text-sm font-semibold">Notifications</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
            >
              Mark all as read
            </Button>
          </div>

          {/* Notification items */}
          <div className="space-y-0.5 px-3 py-2">
            {MOCK_INBOX_ITEMS.map((item) => (
              <div
                key={item.title}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border-l-2 px-3 py-2.5",
                  item.isUnread
                    ? "border-l-primary bg-primary/[0.04]"
                    : "border-l-transparent",
                )}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    {item.isUnread && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        item.isUnread ? "font-semibold" : "font-normal",
                      )}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.body}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.time}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>

          {/* Browser notifications toggle — matches bottom of popover */}
          <div className="border-t px-3 pb-3 pt-2">
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Browser notifications</p>
                <p className="text-xs text-muted-foreground">Enabled</p>
              </div>
              <Switch checked disabled />
            </div>
          </div>
        </div>

        {/* Bell button preview — shows what the icon looks like in the navbar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
              2
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Bell icon with unread badge in the navigation bar
          </p>
        </div>

        {/* Browser Notifications — matches web-push-settings.tsx */}
        <Card>
          <CardHeader>
            <CardTitle>Browser Notifications</CardTitle>
            <p className="text-sm text-muted-foreground">
              Get real-time notifications for reservation updates.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="success">Enabled</Badge>
              <Button type="button" variant="outline" size="sm">
                Disable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Send a test to verify it works
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
              >
                Test
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification routing settings — matches reservation-notification-routing-settings.tsx */}
        <Card>
          <CardHeader>
            <CardTitle>Reservation Notification Routing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <Label>Receive venue reservation lifecycle notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Applies to inbox, web push, mobile push, email, and SMS.
                </p>
              </div>
              <Switch checked disabled />
            </div>
            <div className="text-sm text-muted-foreground">
              Enabled recipients: <span className="text-foreground">2</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </SnippetWrapper>
  );
}

// ---------------------------------------------------------------------------
// 5. MockTeamInviteDialog — matches team-invite-dialog.tsx
// ---------------------------------------------------------------------------

const MOCK_RESERVATION_PERMISSIONS = [
  { id: "reservation.read", label: "View reservations", checked: true },
  {
    id: "reservation.update_status",
    label: "Update reservation status",
    checked: true,
  },
  {
    id: "reservation.guest_booking",
    label: "Create guest bookings",
    checked: true,
  },
  { id: "reservation.chat", label: "Access reservation chat", checked: true },
  {
    id: "reservation.notification.receive",
    label: "Receive reservation notifications",
    checked: true,
  },
];

const MOCK_ADMIN_PERMISSIONS = [
  {
    id: "organization.member.manage",
    label: "Manage members and invitations",
    checked: false,
  },
];

export function MockTeamInviteDialog() {
  return (
    <SnippetWrapper>
      {/* Matches DialogContent layout from team-invite-dialog.tsx */}
      <div className="rounded-lg border bg-background p-6 sm:max-w-lg">
        <div className="space-y-1.5 pb-2">
          <h3 className="text-lg font-semibold">Invite team member</h3>
          <p className="text-sm text-muted-foreground">
            Send an invitation to join your organization. They&apos;ll receive
            an email with an invitation code and sign-in instructions.
          </p>
        </div>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Email address</Label>
            <Input
              readOnly
              tabIndex={-1}
              type="email"
              value="staff@example.com"
              placeholder="staff@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value="MANAGER">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Reservations
                </p>
                <div className="space-y-1">
                  {MOCK_RESERVATION_PERMISSIONS.map((p) => (
                    <label
                      key={p.id}
                      htmlFor={`mock-${p.id}`}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        id={`mock-${p.id}`}
                        checked={p.checked}
                        disabled
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Administration
                </p>
                <div className="space-y-1">
                  {MOCK_ADMIN_PERMISSIONS.map((p) => (
                    <label
                      key={p.id}
                      htmlFor={`mock-${p.id}`}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        id={`mock-${p.id}`}
                        checked={p.checked}
                        disabled
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="button">
            <UserPlus className="mr-2 h-4 w-4" />
            Send invite
          </Button>
        </div>
      </div>
    </SnippetWrapper>
  );
}

// ---------------------------------------------------------------------------
// 6. MockBookingDetailsCard — matches booking-details-card.tsx +
//    reservation-actions-card.tsx (status + booking ID section)
// ---------------------------------------------------------------------------
export function MockBookingDetailsCard() {
  return (
    <SnippetWrapper>
      <div className="space-y-4">
        {/* Status card — matches reservation-actions-card.tsx lines 166-199 */}
        <Card>
          <CardContent className="min-w-0 space-y-4 p-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Status
              </div>
              <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold bg-amber-50 text-amber-700 border-amber-200">
                Awaiting Payment
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Booking ID
              </div>
              <div className="flex w-full min-w-0 items-center gap-2">
                <code className="min-w-0 flex-1 overflow-hidden rounded bg-muted px-2 py-1 font-mono text-sm">
                  <span className="block truncate">rsv_01JQ8X...K4M7NP</span>
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking details — matches booking-details-card.tsx lines 55-133 */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <div className="text-primary/40 font-heading text-xl">KC</div>
                </div>
              </div>
              <div className="min-w-0 space-y-1">
                <h3 className="font-semibold text-foreground">
                  Cebu Sports Hub — Court A
                </h3>
                <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>123 Sports Avenue, Cebu City</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
                  <Calendar className="h-3.5 w-3.5" />
                  Date
                </div>
                <p className="font-medium">March 15, 2026</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
                  <Clock className="h-3.5 w-3.5" />
                  Time
                </div>
                <p className="font-medium">6:00 PM — 7:00 PM</p>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Price
                </div>
                <p className="font-medium text-lg">PHP 350.00</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="w-full sm:w-auto">
                <MapPin className="mr-2 h-4 w-4" />
                Get Directions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guest booking card — simplified version showing confirmed guest booking */}
        <Card>
          <CardContent className="min-w-0 space-y-4 p-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Status
              </div>
              <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                Confirmed
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm">
                  Maria Santos
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal text-amber-600 border-amber-300"
                >
                  Guest profile
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </div>
                  <p className="font-medium text-sm">March 15, 2026</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
                    <Clock className="h-3.5 w-3.5" />
                    Time
                  </div>
                  <p className="font-medium text-sm">2:00 PM — 3:00 PM</p>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    Court
                  </div>
                  <p className="font-medium text-sm">Court B — Basketball</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Phone booking &middot; Paid cash at counter
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SnippetWrapper>
  );
}

// ---------------------------------------------------------------------------
// Snippet map keyed by section id
// ---------------------------------------------------------------------------
const SNIPPET_MAP: Record<string, React.ComponentType> = {
  "create-org": MockOrganizationForm,
  "courts-create": MockCourtForm,
  "courts-schedule": MockCourtScheduleEditor,
  "courts-addons": MockCourtAddonEditor,
  "payment-methods": MockPaymentMethodsManager,
  "verify-venue": MockVerificationPanel,
  notifications: MockNotificationBellInbox,
  "invite-team": MockTeamInviteDialog,
  reservations: MockBookingDetailsCard,
};

export function getSnippetForSection(sectionId: string) {
  return SNIPPET_MAP[sectionId] ?? null;
}
