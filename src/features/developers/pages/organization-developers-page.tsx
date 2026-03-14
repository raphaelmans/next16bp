"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  NotebookTabs,
  PlugZap,
  RadioTower,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { AppShell } from "@/components/layout";
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
import { PageHeader } from "@/components/ui/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import {
  NoAccessView,
  OwnerNavbar,
  OwnerSidebar,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { canAccessPage } from "@/features/owner/helpers";
import {
  useQueryOwnerOrganization,
  useQueryOwnerSidebarQuickLinks,
} from "@/features/owner/hooks";
import { useModOwnerPermissionContext } from "@/features/owner/hooks/organization";
import {
  buildDeveloperCurlSnippet,
  buildDeveloperJsSnippet,
  buildDeveloperLaunchpad,
  formatDeveloperLastUsedLabel,
  getDeveloperCheckSummary,
  getDeveloperStatusTone,
  getSnippetApiKeyValue,
  getValidDeveloperKeyId,
  getValidMappedCourtId,
} from "../helpers";
import {
  useModDevelopersSelection,
  useMutDevelopersCreateApiKey,
  useMutDevelopersCreateIntegration,
  useMutDevelopersRemoveMapping,
  useMutDevelopersRevokeApiKey,
  useMutDevelopersRunAvailabilityTest,
  useMutDevelopersRunPrecheck,
  useMutDevelopersUpsertMapping,
  useQueryDevelopersApiKeys,
  useQueryDevelopersIntegrations,
  useQueryDevelopersMappings,
} from "../hooks";

type MappingDraftState = Record<string, Record<string, string>>;

const DEFAULT_DURATION_MINUTES = 60;

function getTomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

export default function OrganizationDevelopersPage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useQueryOwnerOrganization();
  const { permissionContext, isLoading: permissionLoading } =
    useModOwnerPermissionContext();
  const quickLinksQuery = useQueryOwnerSidebarQuickLinks(
    organization?.id ?? null,
  );
  const integrationsQuery = useQueryDevelopersIntegrations(
    organization?.id ?? null,
  );

  const integrations = integrationsQuery.data ?? [];
  const { selectedIntegrationId, setSelectedIntegrationId } =
    useModDevelopersSelection(
      integrations.map((integration) => integration.id),
      integrations[0]?.id ?? null,
    );

  const apiKeysQuery = useQueryDevelopersApiKeys(
    organization?.id ?? null,
    selectedIntegrationId,
  );
  const mappingsQuery = useQueryDevelopersMappings(
    organization?.id ?? null,
    selectedIntegrationId,
  );

  const createIntegrationMut = useMutDevelopersCreateIntegration(
    organization?.id ?? "",
  );
  const createApiKeyMut = useMutDevelopersCreateApiKey(
    organization?.id ?? "",
    selectedIntegrationId ?? "",
  );
  const revokeApiKeyMut = useMutDevelopersRevokeApiKey(
    organization?.id ?? "",
    selectedIntegrationId ?? "",
  );
  const upsertMappingMut = useMutDevelopersUpsertMapping(
    organization?.id ?? "",
    selectedIntegrationId ?? "",
  );
  const removeMappingMut = useMutDevelopersRemoveMapping(
    organization?.id ?? "",
    selectedIntegrationId ?? "",
  );
  const precheckMut = useMutDevelopersRunPrecheck(
    organization?.id ?? "",
    selectedIntegrationId ?? "",
  );
  const testConsoleMut = useMutDevelopersRunAvailabilityTest(
    organization?.id ?? "",
    selectedIntegrationId ?? "",
  );

  const [newIntegrationName, setNewIntegrationName] = React.useState("");
  const [newKeyName, setNewKeyName] = React.useState("Production key");
  const [allowedIpsText, setAllowedIpsText] = React.useState("");
  const [selectedScopes, setSelectedScopes] = React.useState<
    ("availability.read" | "availability.write")[]
  >(["availability.read", "availability.write"]);
  const [createIntegrationDialogOpen, setCreateIntegrationDialogOpen] =
    React.useState(false);
  const [latestSecret, setLatestSecret] = React.useState<{
    keyId: string;
    secret: string;
  } | null>(null);
  const [mappingDrafts, setMappingDrafts] = React.useState<MappingDraftState>(
    {},
  );
  const [selectedKeyId, setSelectedKeyId] = React.useState<string | null>(null);
  const [sampleExternalCourtId, setSampleExternalCourtId] = React.useState("");
  const [sampleDate, setSampleDate] = React.useState(getTomorrowIso());
  const [sampleDurationMinutes, setSampleDurationMinutes] = React.useState(
    DEFAULT_DURATION_MINUTES,
  );
  const [includeUnavailable, setIncludeUnavailable] = React.useState(true);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  React.useEffect(() => {
    if (!selectedIntegrationId) {
      return;
    }

    const nextDrafts = Object.fromEntries(
      (mappingsQuery.data ?? []).map((mapping) => [
        mapping.courtId,
        mapping.externalCourtId,
      ]),
    );
    setMappingDrafts((current) => ({
      ...current,
      [selectedIntegrationId]: nextDrafts,
    }));
  }, [mappingsQuery.data, selectedIntegrationId]);

  React.useEffect(() => {
    setSelectedKeyId((current) =>
      getValidDeveloperKeyId(current, apiKeysQuery.data),
    );
  }, [apiKeysQuery.data]);

  React.useEffect(() => {
    setSampleExternalCourtId((current) => {
      const next = getValidMappedCourtId(current, mappingsQuery.data);
      return next ?? "";
    });
  }, [mappingsQuery.data]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.organization.developers,
    );
  };

  const canAccessDevelopers = permissionContext
    ? canAccessPage(permissionContext, {
        type: "permission",
        permission: "place.manage",
      })
    : false;

  const launchpad = buildDeveloperLaunchpad({
    integrationsCount: integrations.length,
    keysCount: apiKeysQuery.data?.length ?? 0,
    mappingsCount: mappingsQuery.data?.length ?? 0,
    precheck: precheckMut.data ?? null,
  });

  const precheckSummary = getDeveloperCheckSummary(precheckMut.data?.checks);

  const handleCreateIntegration = async () => {
    if (!newIntegrationName.trim()) return;

    try {
      const created = await createIntegrationMut.mutateAsync({
        name: newIntegrationName.trim(),
      });
      setNewIntegrationName("");
      setSelectedIntegrationId(created.id);
      setCreateIntegrationDialogOpen(false);
      toast.success("Developer integration created");
    } catch (error) {
      toast.error("Could not create integration", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleCreateApiKey = async () => {
    if (!selectedIntegrationId) return;

    try {
      const created = await createApiKeyMut.mutateAsync({
        name: newKeyName.trim(),
        scopes: selectedScopes,
        allowedIpCidrs: allowedIpsText
          .split(/\r?\n|,/)
          .map((value) => value.trim())
          .filter(Boolean),
      });
      setLatestSecret({ keyId: created.apiKey.id, secret: created.secret });
      setSelectedKeyId(created.apiKey.id);
      toast.success("API key created");
    } catch (error) {
      toast.error("Could not create API key", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      await revokeApiKeyMut.mutateAsync({ keyId });
      toast.success("API key revoked");
    } catch (error) {
      toast.error("Could not revoke API key", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleSaveMapping = async (courtId: string) => {
    const externalCourtId = currentMappingDrafts[courtId]?.trim();
    if (!externalCourtId) return;

    try {
      await upsertMappingMut.mutateAsync({ courtId, externalCourtId });
      toast.success("Court mapping saved");
    } catch (error) {
      toast.error("Could not save mapping", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRemoveMapping = async (courtId: string) => {
    try {
      await removeMappingMut.mutateAsync({ courtId });
      setMappingDrafts((current) => ({
        ...current,
        [selectedIntegrationId ?? "__none__"]: {
          ...(current[selectedIntegrationId ?? "__none__"] ?? {}),
          [courtId]: "",
        },
      }));
      toast.success("Court mapping removed");
    } catch (error) {
      toast.error("Could not remove mapping", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRunPrecheck = async () => {
    if (!selectedKeyId) return;

    try {
      await precheckMut.mutateAsync({
        keyId: selectedKeyId,
        externalCourtId: sampleExternalCourtId || undefined,
        date: sampleDate,
        durationMinutes: sampleDurationMinutes,
      });
      toast.success("Precheck complete");
    } catch (error) {
      toast.error("Precheck failed", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRunAvailabilityTest = async () => {
    if (!selectedKeyId || !sampleExternalCourtId) return;

    try {
      await testConsoleMut.mutateAsync({
        keyId: selectedKeyId,
        externalCourtId: sampleExternalCourtId,
        date: sampleDate,
        durationMinutes: sampleDurationMinutes,
        includeUnavailable,
      });
      toast.success("Availability request completed");
    } catch (error) {
      toast.error("Test request failed", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const codeSnippetArgs = {
    origin,
    externalCourtId: sampleExternalCourtId || "external-court-id",
    date: sampleDate,
    durationMinutes: sampleDurationMinutes,
    includeUnavailable,
    apiKey: getSnippetApiKeyValue({
      selectedKeyId,
      latestRevealedSecret: latestSecret,
    }),
  };

  const currentMappingDrafts = selectedIntegrationId
    ? (mappingDrafts[selectedIntegrationId] ?? {})
    : {};

  if (orgLoading || permissionLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={organization ?? { id: "", name: "" }}
            organizations={organizations}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            isAdmin={user?.role === "admin"}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName={organization?.name ?? ""}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            onLogout={handleLogout}
            isAdmin={user?.role === "admin"}
          />
        }
        floatingPanel={
          <ReservationAlertsPanel organizationId={organization?.id ?? null} />
        }
      >
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <Skeleton className="h-[420px]" />
            <Skeleton className="h-[420px]" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!permissionContext || !canAccessDevelopers) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={organization ?? { id: "", name: "" }}
            organizations={organizations}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            isAdmin={user?.role === "admin"}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName={organization?.name ?? ""}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            onLogout={handleLogout}
            isAdmin={user?.role === "admin"}
          />
        }
        floatingPanel={
          <ReservationAlertsPanel organizationId={organization?.id ?? null} />
        }
      >
        <NoAccessView
          title="Developers Access Restricted"
          message="Only organization owners and managers can manage developer integrations, keys, and test-console checks."
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={organization ?? { id: "", name: "" }}
          organizations={organizations}
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
          isAdmin={user?.role === "admin"}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization?.name ?? ""}
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
          onLogout={handleLogout}
          isAdmin={user?.role === "admin"}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      <div className="space-y-8">
        <PageHeader
          title="Developers"
          description="Connect your venue stack to the live developer API, keep key health visible, and verify availability reads before you ship."
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/api/developer/v1/openapi.json" target="_blank">
                  OpenAPI
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button onClick={() => setCreateIntegrationDialogOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                New integration
              </Button>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="relative overflow-hidden border-border/70 shadow-sm">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.14),transparent_40%),linear-gradient(135deg,transparent_0%,hsl(var(--muted)/0.55)_100%)]" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 font-heading text-xl">
                <PlugZap className="h-5 w-5 text-primary" />
                Integration launchpad
              </CardTitle>
              <CardDescription>
                Smoothest path from zero to a green precheck: spin up one
                integration, issue one key, map one court, then validate the
                live availability read path.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div className="grid gap-3 md:grid-cols-4">
                {launchpad.map((item, index) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border px-4 py-3 ${
                      item.done
                        ? "border-success/20 bg-success/10"
                        : "border-border/70 bg-background/80"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{item.label}</p>
                      {item.done ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                      ) : (
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                      )}
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
                      Create a dedicated integration for each external platform
                      so keys, mappings, and prechecks stay isolated and easy to
                      reason about.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setCreateIntegrationDialogOpen(true)}
                      disabled={createIntegrationMut.isPending}
                    >
                      {createIntegrationMut.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PlugZap className="mr-2 h-4 w-4" />
                      )}
                      Create integration
                    </Button>
                    {selectedIntegrationId ? (
                      <div className="rounded-full border border-border/70 px-3 py-2 text-xs text-muted-foreground">
                        Active:{" "}
                        <span className="font-medium text-foreground">
                          {integrations.find(
                            (integration) =>
                              integration.id === selectedIntegrationId,
                          )?.name ?? "Selected integration"}
                        </span>
                      </div>
                    ) : null}
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
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-code-muted hover:bg-code-hover hover:text-code-fg"
                      onClick={() => {
                        void navigator.clipboard.writeText(
                          codeSnippetArgs.apiKey ?? "X-API-Key: YOUR_API_KEY",
                        );
                        toast.success("Header copied");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="overflow-x-auto rounded-xl border border-code-border bg-code-surface p-3 text-xs leading-6 text-code-fg">
                    {`X-API-Key: ${codeSnippetArgs.apiKey ?? "YOUR_API_KEY"}`}
                  </pre>
                  <p className="text-xs text-code-muted">
                    {codeSnippetArgs.apiKey
                      ? "This snippet uses the currently selected newly created key."
                      : "Selected keys remain masked after creation. Snippets fall back to YOUR_API_KEY unless the selected key was just revealed."}
                  </p>
                </div>
              </div>

              {integrations.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard
                    icon={NotebookTabs}
                    label="Integrations"
                    value={String(integrations.length)}
                    note="Org-scoped developer connections"
                  />
                  <StatCard
                    icon={KeyRound}
                    label="Active keys"
                    value={String(
                      apiKeysQuery.data?.filter(
                        (key) => key.status === "ACTIVE",
                      ).length ?? 0,
                    )}
                    note="Secrets created and ready"
                  />
                  <StatCard
                    icon={Link2}
                    label="Mapped courts"
                    value={String(mappingsQuery.data?.length ?? 0)}
                    note="External IDs linked to venue inventory"
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

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
                <Select
                  value={selectedIntegrationId ?? ""}
                  onValueChange={setSelectedIntegrationId}
                  disabled={
                    integrationsQuery.isLoading || integrations.length === 0
                  }
                >
                  <SelectTrigger className="w-full min-w-0">
                    <SelectValue
                      placeholder="Select integration"
                      className="truncate"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {integrations.map((integration) => (
                      <SelectItem key={integration.id} value={integration.id}>
                        {integration.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Status
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-heading font-semibold">
                      {precheckMut.data?.status ?? "IDLE"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {precheckSummary.passed} pass / {precheckSummary.warned}{" "}
                      warn /{precheckSummary.failed} fail
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${getDeveloperStatusTone(
                      precheckMut.data?.status ?? "WARN",
                    )}`}
                  >
                    {precheckMut.data?.status ?? "Pending"}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleRunPrecheck}
                disabled={
                  !selectedIntegrationId ||
                  !selectedKeyId ||
                  precheckMut.isPending
                }
              >
                {precheckMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RadioTower className="mr-2 h-4 w-4" />
                )}
                Run precheck
              </Button>

              <div className="space-y-3">
                {(
                  precheckMut.data?.checks ?? [
                    {
                      id: "placeholder",
                      status: "WARN",
                      title: "Run a precheck",
                      message:
                        "Select one key and one mapped court, then verify the live availability read path.",
                    },
                  ]
                ).map((check) => (
                  <div
                    key={check.id}
                    className="rounded-xl border border-border/70 bg-background/80 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{check.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {check.message}
                        </p>
                        {check.requestId ? (
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
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <KeyRound className="h-5 w-5 text-primary" />
                API keys
              </CardTitle>
              <CardDescription>
                Issue scoped keys, keep IP allowlists tight, and use the
                one-time reveal moment to copy the secret immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/35 p-4">
                  <Label htmlFor="key-name">Key name</Label>
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(event) => setNewKeyName(event.target.value)}
                  />
                  <div className="space-y-2">
                    <Label>Scopes</Label>
                    <div className="space-y-2 rounded-xl border border-border/70 bg-background/80 p-3">
                      {[
                        {
                          id: "availability.read",
                          label: "Availability read",
                        },
                        {
                          id: "availability.write",
                          label: "Availability write",
                        },
                      ].map((scope) => {
                        const checked = selectedScopes.includes(
                          scope.id as
                            | "availability.read"
                            | "availability.write",
                        );

                        return (
                          <div
                            key={scope.id}
                            className="flex items-center gap-3 text-sm"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(nextChecked) => {
                                const normalizedScope = scope.id as
                                  | "availability.read"
                                  | "availability.write";
                                setSelectedScopes((current) =>
                                  nextChecked
                                    ? Array.from(
                                        new Set([...current, normalizedScope]),
                                      )
                                    : current.filter(
                                        (value) => value !== normalizedScope,
                                      ),
                                );
                              }}
                            />
                            <span>{scope.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowlist">IP allowlist</Label>
                    <Textarea
                      id="allowlist"
                      value={allowedIpsText}
                      onChange={(event) =>
                        setAllowedIpsText(event.target.value)
                      }
                      placeholder="One IP or CIDR per line"
                      className="min-h-28 font-mono text-xs"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateApiKey}
                    disabled={
                      !selectedIntegrationId ||
                      selectedScopes.length === 0 ||
                      createApiKeyMut.isPending
                    }
                  >
                    {createApiKeyMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="mr-2 h-4 w-4" />
                    )}
                    Issue key
                  </Button>
                </div>

                <div className="space-y-3">
                  {latestSecret ? (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">Secret shown once</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Copy this now. The dashboard will only keep the
                            masked prefix after this moment.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            void navigator.clipboard.writeText(
                              latestSecret.secret,
                            );
                            toast.success("Secret copied");
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                      <pre className="mt-3 overflow-x-auto rounded-xl border border-primary/10 bg-background p-3 font-mono text-xs">
                        {latestSecret.secret}
                      </pre>
                    </div>
                  ) : null}

                  <ScrollArea className="h-[360px] rounded-2xl border border-border/70">
                    <div className="space-y-3 p-4">
                      {(apiKeysQuery.data ?? []).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                          No keys yet. Issue one production key to unlock
                          precheck and the guided console.
                        </div>
                      ) : (
                        apiKeysQuery.data?.map((key) => (
                          <div
                            key={key.id}
                            className="rounded-xl border border-border/70 bg-background/90 p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{key.name}</p>
                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                      key.status === "ACTIVE"
                                        ? "border-success/20 bg-success/10 text-success"
                                        : "border-border bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {key.status}
                                  </span>
                                </div>
                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                  {key.keyPrefix}••••{key.lastFour}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                disabled={
                                  key.status !== "ACTIVE" ||
                                  revokeApiKeyMut.isPending
                                }
                                onClick={() => handleRevokeKey(key.id)}
                              >
                                Revoke
                              </Button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {key.scopes.map((scope) => (
                                <span
                                  key={scope}
                                  className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 font-mono text-[11px]"
                                >
                                  {scope}
                                </span>
                              ))}
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                Last used:{" "}
                                {formatDeveloperLastUsedLabel(key.lastUsedAt)}
                              </span>
                              <span>
                                {key.allowedIpCidrs.length} allowlist rule(s)
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Link2 className="h-5 w-5 text-primary" />
                Court mappings
              </CardTitle>
              <CardDescription>
                Mirror your external court IDs onto live inventory so precheck
                and read calls can run against real organization data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickLinksQuery.isLoading ? (
                <Skeleton className="h-[320px]" />
              ) : (
                quickLinksQuery.data?.map((place) => (
                  <div
                    key={place.id}
                    className="rounded-2xl border border-border/70 bg-background/90 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{place.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {place.courts.length} active court
                          {place.courts.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {place.courts.map((court) => (
                        <div
                          key={court.id}
                          className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3 md:grid-cols-[0.42fr_0.58fr_auto_auto]"
                        >
                          <div>
                            <p className="font-medium">{court.label}</p>
                            <p className="text-xs text-muted-foreground">
                              court_id: {court.id}
                            </p>
                          </div>
                          <Input
                            value={currentMappingDrafts[court.id] ?? ""}
                            onChange={(event) =>
                              setMappingDrafts((current) => ({
                                ...current,
                                [selectedIntegrationId ?? "__none__"]: {
                                  ...(current[
                                    selectedIntegrationId ?? "__none__"
                                  ] ?? {}),
                                  [court.id]: event.target.value,
                                },
                              }))
                            }
                            placeholder="external-court-id"
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            onClick={() => handleSaveMapping(court.id)}
                            disabled={
                              !selectedIntegrationId ||
                              !currentMappingDrafts[court.id]?.trim() ||
                              upsertMappingMut.isPending
                            }
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-muted-foreground"
                            onClick={() => handleRemoveMapping(court.id)}
                            disabled={
                              !selectedIntegrationId ||
                              removeMappingMut.isPending
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <RadioTower className="h-5 w-5 text-primary" />
                Guided test console
              </CardTitle>
              <CardDescription>
                Run one safe live availability read server-side, inspect the
                JSON payload, and generate copy-ready snippets for your external
                team.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <Label>Use key</Label>
                  <Select
                    value={selectedKeyId ?? ""}
                    onValueChange={setSelectedKeyId}
                    disabled={(apiKeysQuery.data?.length ?? 0) === 0}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue
                        placeholder="Select key"
                        className="truncate"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(apiKeysQuery.data ?? []).map((key) => (
                        <SelectItem key={key.id} value={key.id}>
                          {key.name} · {key.keyPrefix}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-0 space-y-2">
                  <Label>Mapped external court</Label>
                  <Select
                    value={sampleExternalCourtId}
                    onValueChange={setSampleExternalCourtId}
                    disabled={(mappingsQuery.data?.length ?? 0) === 0}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue
                        placeholder="Select mapped court"
                        className="truncate"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(mappingsQuery.data ?? []).map((mapping) => (
                        <SelectItem
                          key={mapping.id}
                          value={mapping.externalCourtId}
                        >
                          {mapping.externalCourtId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_0.5fr_auto]">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    value={sampleDate}
                    onChange={(event) => setSampleDate(event.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    type="number"
                    value={sampleDurationMinutes}
                    onChange={(event) =>
                      setSampleDurationMinutes(
                        Number(event.target.value) || DEFAULT_DURATION_MINUTES,
                      )
                    }
                  />
                </div>
                <div className="mt-8 flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={includeUnavailable}
                    onCheckedChange={(checked) =>
                      setIncludeUnavailable(checked === true)
                    }
                  />
                  Include unavailable
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleRunAvailabilityTest}
                disabled={
                  !selectedIntegrationId ||
                  !selectedKeyId ||
                  !sampleExternalCourtId ||
                  testConsoleMut.isPending
                }
              >
                {testConsoleMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <TerminalSquare className="mr-2 h-4 w-4" />
                )}
                Run live availability read
              </Button>

              <div className="rounded-2xl border border-border/70 bg-code-bg p-4 text-code-fg">
                <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                  <p className="text-sm font-medium">Latest response</p>
                  {testConsoleMut.data?.requestId ? (
                    <span className="truncate font-mono text-xs text-code-muted">
                      {testConsoleMut.data.requestId}
                    </span>
                  ) : null}
                </div>
                <pre className="max-h-[320px] overflow-auto rounded-xl border border-code-border bg-code-surface p-3 text-xs leading-6">
                  {JSON.stringify(
                    testConsoleMut.data ?? {
                      request: {
                        externalCourtId:
                          sampleExternalCourtId || "external-court-id",
                        date: sampleDate,
                        durationMinutes: sampleDurationMinutes,
                        includeUnavailable,
                      },
                      response:
                        "Run a request to inspect the live payload here.",
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </CardContent>
          </Card>

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
                <CodeCard
                  title="cURL"
                  code={buildDeveloperCurlSnippet(codeSnippetArgs)}
                />
                <CodeCard
                  title="JavaScript"
                  code={buildDeveloperJsSnippet(codeSnippetArgs)}
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <ResourceCard
                  icon={NotebookTabs}
                  title="OpenAPI spec"
                  body="Raw machine-readable API contract for docs, codegen, and external tooling."
                  href="/api/developer/v1/openapi.json"
                />
                <ResourceCard
                  icon={ShieldCheck}
                  title="Precheck workflow"
                  body="Server-side readiness scan that validates key health, scope, mappings, and a live sample read."
                />
                <ResourceCard
                  icon={AlertTriangle}
                  title="Write safety"
                  body="The dashboard only executes live read requests. Write endpoints stay copy-first in v1."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={createIntegrationDialogOpen}
        onOpenChange={setCreateIntegrationDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create integration</DialogTitle>
            <DialogDescription>
              Name the external platform or internal server that will connect to
              the developer API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="integration-name-dialog">Integration name</Label>
            <Input
              id="integration-name-dialog"
              value={newIntegrationName}
              onChange={(event) => setNewIntegrationName(event.target.value)}
              placeholder="e.g. Acme OMS"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateIntegration}
              disabled={
                !newIntegrationName.trim() || createIntegrationMut.isPending
              }
            >
              {createIntegrationMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Create integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-3xl font-heading font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function CodeCard({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-code-bg p-4 text-code-fg">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-code-muted hover:bg-code-hover hover:text-code-fg"
          onClick={() => {
            void navigator.clipboard.writeText(code);
            toast.success(`${title} snippet copied`);
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <pre className="max-h-[320px] overflow-auto rounded-xl border border-code-border bg-code-surface p-3 text-xs leading-6">
        {code}
      </pre>
    </div>
  );
}

function ResourceCard({
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
