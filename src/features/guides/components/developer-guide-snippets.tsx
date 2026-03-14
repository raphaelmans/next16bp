"use client";

import {
  CheckCircle2,
  Copy,
  KeyRound,
  Link2,
  NotebookTabs,
  PlugZap,
  RadioTower,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  buildDeveloperCurlSnippet,
  buildDeveloperJsSnippet,
  buildDeveloperLaunchpad,
  formatDeveloperLastUsedLabel,
  getDeveloperCheckSummary,
  getDeveloperStatusTone,
} from "@/features/developers/helpers";
import { GuideSnippetWrapper } from "@/features/guides/components/guide-snippet-wrapper";

const launchpad = buildDeveloperLaunchpad({
  integrationsCount: 1,
  keysCount: 1,
  mappingsCount: 1,
  precheck: {
    status: "PASS",
    checks: [],
    sample: {
      externalCourtId: "ext-court-a",
      date: "2026-03-16T09:00:00.000Z",
      durationMinutes: 60,
    },
  },
});

const precheckSummary = getDeveloperCheckSummary([
  {
    id: "integration_active",
    status: "PASS",
    title: "Integration status",
    message: "The integration is active.",
  },
  {
    id: "key_active",
    status: "PASS",
    title: "API key status",
    message: "The selected key is active and valid.",
  },
  {
    id: "mapping_exists",
    status: "PASS",
    title: "Court mappings",
    message: "A mapped external court ID is ready for live checks.",
  },
  {
    id: "availability_read",
    status: "PASS",
    title: "Live availability read",
    message: "A sample developer availability request completed successfully.",
    requestId: "req_dev_01",
  },
]);

const snippetArgs = {
  origin: "https://kudoscourts.ph",
  externalCourtId: "ext-court-a",
  date: "2026-03-16T09:00:00.000Z",
  durationMinutes: 60,
  includeUnavailable: true,
  apiKey: "kudos_live_abc123_demo_secret",
};

const developerReadResponse = {
  request: {
    externalCourtId: "ext-court-a",
    date: "2026-03-16T09:00:00.000Z",
    durationMinutes: 60,
    includeUnavailable: true,
  },
  response: {
    options: [
      {
        courtId: "court-1",
        startTime: "2026-03-16T09:00:00.000Z",
        endTime: "2026-03-16T10:00:00.000Z",
        status: "AVAILABLE",
        totalPriceCents: 60000,
        currency: "PHP",
      },
    ],
    diagnostics: {
      hasHoursWindows: true,
      hasRateRules: true,
      dayHasHours: true,
      allSlotsBooked: false,
    },
  },
  requestId: "req_dev_01",
};

function SnippetWrapper({ children }: { children: React.ReactNode }) {
  return <GuideSnippetWrapper>{children}</GuideSnippetWrapper>;
}

export function MockDeveloperLaunchpad() {
  return (
    <SnippetWrapper>
      <Card className="relative overflow-hidden border-border/70 shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.14),transparent_40%),linear-gradient(135deg,transparent_0%,hsl(var(--muted)/0.55)_100%)]" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 font-heading text-xl">
            <PlugZap className="h-5 w-5 text-primary" />
            Integration launchpad
          </CardTitle>
          <CardDescription>
            Smoothest path from zero to a green precheck: spin up one
            integration, issue one key, map one court, then validate the live
            availability read path.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-6">
          <div className="grid gap-3 md:grid-cols-4">
            {launchpad.map((item, index) => (
              <div
                key={item.id}
                className="rounded-xl border border-success/20 bg-success/10 px-4 py-3"
              >
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-primary">→</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{item.label}</p>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_0.75fr]">
            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/85 p-4">
              <div>
                <p className="text-sm font-medium">
                  Start with one integration
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a dedicated integration for each external platform so
                  keys, mappings, and prechecks stay isolated and easy to reason
                  about.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button">
                  <PlugZap className="mr-2 h-4 w-4" />
                  Create integration
                </Button>
                <div className="rounded-full border border-border/70 px-3 py-2 text-xs text-muted-foreground">
                  Active:{" "}
                  <span className="font-medium text-foreground">
                    Acme OMS Production
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/60 bg-code-bg p-4 text-code-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-code-muted">
                    Quickstart
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Developer auth header
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-code-muted"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-code-border bg-code-surface p-3 text-xs leading-6 text-code-fg">
                X-API-Key: YOUR_API_KEY
              </pre>
              <p className="text-xs text-code-muted">
                Selected keys remain masked after creation. Snippets fall back
                to YOUR_API_KEY unless the selected key was just revealed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

export function MockDeveloperCreateIntegrationDialog() {
  return (
    <SnippetWrapper>
      <Dialog open>
        <DialogContent className="relative inset-auto top-auto left-auto z-auto w-full translate-x-0 translate-y-0 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create integration</DialogTitle>
            <DialogDescription>
              Name the external platform or internal server that will connect to
              the developer API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="guide-integration-name">Integration name</Label>
            <Input
              id="guide-integration-name"
              readOnly
              tabIndex={-1}
              value="Acme OMS Production"
            />
          </div>
          <DialogFooter>
            <Button type="button">
              <Sparkles className="mr-2 h-4 w-4" />
              Create integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SnippetWrapper>
  );
}

export function MockDeveloperKeyVault() {
  return (
    <SnippetWrapper>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <KeyRound className="h-5 w-5 text-primary" />
            API keys
          </CardTitle>
          <CardDescription>
            Issue scoped keys, keep IP allowlists tight, and use the one-time
            reveal moment to copy the secret immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/35 p-4">
            <Label htmlFor="guide-key-name">Key name</Label>
            <Input
              id="guide-key-name"
              readOnly
              tabIndex={-1}
              value="Production key"
            />
            <div className="space-y-2">
              <Label>Scopes</Label>
              <div className="space-y-2 rounded-xl border border-border/70 bg-background/80 p-3">
                <div className="flex items-center gap-3 text-sm">
                  <Checkbox checked disabled />
                  <span>Availability read</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Checkbox checked disabled />
                  <span>Availability write</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="guide-allowlist">IP allowlist</Label>
              <Textarea
                id="guide-allowlist"
                readOnly
                tabIndex={-1}
                value={"203.0.113.10\n203.0.113.11"}
                className="min-h-24 font-mono text-xs"
              />
            </div>
            <Button type="button" className="w-full">
              <KeyRound className="mr-2 h-4 w-4" />
              Issue key
            </Button>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">Secret shown once</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Copy this now. The dashboard will only keep the masked
                    prefix after this moment.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-primary/10 bg-background p-3 font-mono text-xs">
                kudos_live_abc123_demo_secret
              </pre>
            </div>

            <ScrollArea className="h-[260px] rounded-2xl border border-border/70">
              <div className="space-y-3 p-4">
                <div className="rounded-xl border border-border/70 bg-background/90 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Production key</p>
                        <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-success">
                          ACTIVE
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        kudos_live_abc123••••cdef
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                    >
                      Revoke
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["availability.read", "availability.write"].map(
                      (scope) => (
                        <span
                          key={scope}
                          className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 font-mono text-[11px]"
                        >
                          {scope}
                        </span>
                      ),
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last used: {formatDeveloperLastUsedLabel(null)}</span>
                    <span>2 allowlist rule(s)</span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

export function MockDeveloperMappingsTable() {
  return (
    <SnippetWrapper>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <Link2 className="h-5 w-5 text-primary" />
            Court mappings
          </CardTitle>
          <CardDescription>
            Mirror your external court IDs onto live inventory so precheck and
            read calls can run against real organization data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-background/90 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-medium">Cebu Sports Hub</p>
                <p className="text-sm text-muted-foreground">2 active courts</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                ["Court A", "court-a", "ext-court-a"],
                ["Court B", "court-b", "ext-court-b"],
              ].map(([label, id, externalId]) => (
                <div
                  key={id}
                  className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3 md:grid-cols-[0.42fr_0.58fr_auto_auto]"
                >
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      court_id: {id}
                    </p>
                  </div>
                  <Input readOnly tabIndex={-1} value={externalId} />
                  <Button type="button" variant="outline">
                    Save
                  </Button>
                  <Button type="button" variant="ghost">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

export function MockDeveloperReadinessSnapshot() {
  return (
    <SnippetWrapper>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Readiness snapshot
          </CardTitle>
          <CardDescription>
            Live status for the currently selected integration, with a fixed
            readiness checklist that mirrors how a developer would onboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Active integration</Label>
            <Select value="acme">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="acme">Acme OMS Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Status
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-heading font-semibold">PASS</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {precheckSummary.passed} pass / {precheckSummary.warned} warn
                  / {precheckSummary.failed} fail
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${getDeveloperStatusTone(
                  "PASS",
                )}`}
              >
                PASS
              </span>
            </div>
          </div>

          <Button type="button" className="w-full">
            <RadioTower className="mr-2 h-4 w-4" />
            Run precheck
          </Button>

          <div className="space-y-3">
            {[
              {
                title: "Integration status",
                message: "The integration is active.",
                status: "PASS" as const,
              },
              {
                title: "API key status",
                message: "The selected key is active and valid.",
                status: "PASS" as const,
              },
              {
                title: "Court mappings",
                message: "A mapped external court ID is ready for live checks.",
                status: "PASS" as const,
              },
              {
                title: "Live availability read",
                message:
                  "A sample developer availability request completed successfully.",
                status: "PASS" as const,
                requestId: "req_dev_01",
              },
            ].map((check) => (
              <div
                key={check.title}
                className="rounded-xl border border-border/70 bg-background/80 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{check.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {check.message}
                    </p>
                    {"requestId" in check ? (
                      <p className="mt-2 font-mono text-xs text-muted-foreground">
                        request_id: {check.requestId}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getDeveloperStatusTone(
                      check.status,
                    )}`}
                  >
                    {check.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

export function MockDeveloperGuidedConsole() {
  return (
    <SnippetWrapper>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <RadioTower className="h-5 w-5 text-primary" />
            Guided test console
          </CardTitle>
          <CardDescription>
            Run one safe live availability read server-side, inspect the JSON
            payload, and generate copy-ready snippets for your external team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Use key</Label>
              <Select value="prod-key">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prod-key">
                    Production key · kudos_live_abc123
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mapped external court</Label>
              <Select value="ext-court-a">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ext-court-a">ext-court-a</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.2fr_0.5fr_auto]">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                readOnly
                tabIndex={-1}
                value="2026-03-16T09:00:00.000Z"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input readOnly tabIndex={-1} value="60" />
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm">
              <Checkbox checked disabled />
              Include unavailable
            </div>
          </div>

          <Button type="button" className="w-full">
            <TerminalSquare className="mr-2 h-4 w-4" />
            Run live availability read
          </Button>

          <div className="rounded-2xl border border-border/70 bg-code-bg p-4 text-code-fg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium">Latest response</p>
              <span className="font-mono text-xs text-code-muted">
                req_dev_01
              </span>
            </div>
            <pre className="max-h-[320px] overflow-auto rounded-xl border border-code-border bg-code-surface p-3 text-xs leading-6">
              {JSON.stringify(developerReadResponse, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

export function MockDeveloperSnippetsPanel() {
  return (
    <SnippetWrapper>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <TerminalSquare className="h-5 w-5 text-primary" />
            Snippets and docs
          </CardTitle>
          <CardDescription>
            Use the generated examples as the handoff artifact for external
            engineers. They reflect the currently selected mapping and test
            input.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-code-bg p-4 text-code-fg">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">cURL</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-code-muted"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="max-h-[220px] overflow-auto rounded-xl border border-code-border bg-code-surface p-3 text-xs leading-6">
                {buildDeveloperCurlSnippet(snippetArgs)}
              </pre>
            </div>

            <div className="rounded-2xl border border-border/70 bg-code-bg p-4 text-code-fg">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">JavaScript</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-code-muted"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <pre className="max-h-[220px] overflow-auto rounded-xl border border-code-border bg-code-surface p-3 text-xs leading-6">
                {buildDeveloperJsSnippet(snippetArgs)}
              </pre>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <DeveloperResourceCard
              icon={NotebookTabs}
              title="OpenAPI spec"
              body="Raw machine-readable API contract for docs, codegen, and external tooling."
              href="/api/developer/v1/openapi.json"
            />
            <DeveloperResourceCard
              icon={ShieldCheck}
              title="Precheck workflow"
              body="Server-side readiness scan that validates key health, scope, mappings, and a live sample read."
            />
            <DeveloperResourceCard
              icon={PlugZap}
              title="Write safety"
              body="The dashboard only executes live read requests. Write endpoints stay copy-first in v1."
            />
          </div>
        </CardContent>
      </Card>
    </SnippetWrapper>
  );
}

function DeveloperResourceCard({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl border border-border/70 bg-background/90 p-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <p className="font-medium">{title}</p>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} target="_blank" className="block">
      {content}
    </Link>
  );
}

const DEVELOPER_SNIPPETS: Record<string, React.ComponentType | null> = {
  "create-integration": MockDeveloperLaunchpad,
  "issue-key": MockDeveloperKeyVault,
  "map-courts": MockDeveloperMappingsTable,
  "run-precheck": MockDeveloperReadinessSnapshot,
  "guided-console": MockDeveloperGuidedConsole,
  "handoff-snippets": MockDeveloperSnippetsPanel,
};

export function getDeveloperGuideSnippetForSection(sectionId: string) {
  return DEVELOPER_SNIPPETS[sectionId] ?? null;
}
