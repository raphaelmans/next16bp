"use client";

import {
  Building,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/common/clients/telemetry-client";
import { useDebouncedValue } from "@/common/hooks/use-debounced-value";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { PlaceForm } from "@/features/owner/components";
import {
  useModPlaceForm,
  useMutOwnerSubmitClaim,
  useQueryOwnerClaimablePlaces,
} from "@/features/owner/hooks";
import type { SetupStatus } from "../../get-started-types";

type VenuePath = "choice" | "add-new" | "claim";

interface VenueStepProps {
  status: SetupStatus;
  isTransitioning?: boolean;
  onStepComplete: () => void;
}

export function VenueStep({
  status,
  isTransitioning,
  onStepComplete,
}: VenueStepProps) {
  const [path, setPath] = useState<VenuePath>("choice");

  if (status.hasVenue) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{status.primaryPlaceName}</p>
            <p className="text-sm text-muted-foreground">Venue added</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (status.hasPendingClaim) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Claim under review</p>
            <p className="text-sm text-muted-foreground">
              Your venue claim is being reviewed. You can continue setting up
              while we process it.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (path === "choice") {
    return <VenueChoiceScreen onSelect={setPath} />;
  }

  if (path === "claim") {
    return (
      <ClaimSearchInline
        organizationId={status.organizationId}
        isTransitioning={isTransitioning}
        onStepComplete={onStepComplete}
        onBack={() => setPath("choice")}
      />
    );
  }

  return (
    <AddVenueInline
      organizationId={status.organizationId}
      isTransitioning={isTransitioning}
      onStepComplete={onStepComplete}
      onBack={() => setPath("choice")}
    />
  );
}

function VenueChoiceScreen({
  onSelect,
}: {
  onSelect: (path: VenuePath) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onSelect("add-new")}
        className="group rounded-lg border-2 border-dashed p-6 text-left transition-colors hover:border-primary hover:bg-primary/5"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Plus className="h-5 w-5" />
        </div>
        <p className="mt-3 font-medium">Add new venue</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a brand new venue listing from scratch.
        </p>
      </button>
      <button
        type="button"
        onClick={() => onSelect("claim")}
        className="group rounded-lg border-2 border-dashed p-6 text-left transition-colors hover:border-primary hover:bg-primary/5"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building className="h-5 w-5" />
        </div>
        <p className="mt-3 font-medium">Claim existing listing</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Find and claim a venue that&apos;s already listed on KudosCourts.
        </p>
      </button>
    </div>
  );
}

function AddVenueInline({
  organizationId,
  isTransitioning,
  onStepComplete,
  onBack,
}: {
  organizationId: string | undefined;
  isTransitioning?: boolean;
  onStepComplete: () => void;
  onBack: () => void;
}) {
  const { submitAsync, isSubmitting } = useModPlaceForm({
    organizationId,
    onSuccess: () => {
      toast.success("Venue created successfully!");
      onStepComplete();
    },
  });

  return (
    <PlaceForm
      onSubmit={submitAsync}
      onCancel={onBack}
      isSubmitting={isSubmitting || !!isTransitioning}
    />
  );
}

function ClaimSearchInline({
  organizationId,
  isTransitioning,
  onStepComplete,
  onBack,
}: {
  organizationId: string | undefined;
  isTransitioning?: boolean;
  onStepComplete: () => void;
  onBack: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim();
  const debouncedSearchQuery = useDebouncedValue(normalizedSearchQuery, 2000);

  const { data: searchResults, isLoading: searching } =
    useQueryOwnerClaimablePlaces({
      q: debouncedSearchQuery || undefined,
      verificationTier: "curated",
      limit: 10,
    });

  const isDebouncing = debouncedSearchQuery !== normalizedSearchQuery;
  const isSearching = searching || isDebouncing;

  const submitClaimMutation = useMutOwnerSubmitClaim({
    onSuccess: () => {
      toast.success("Claim submitted", {
        description: "We will review your request and notify you.",
      });
      trackEvent({ event: "funnel.owner_claim_submitted" });
      onStepComplete();
    },
    onError: (error: unknown) => {
      toast.error("Unable to submit claim", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    },
  });

  const handleSubmitClaim = (placeId: string) => {
    if (!organizationId) {
      toast.error("Create an organization first");
      return;
    }
    submitClaimMutation.mutate({ placeId, organizationId });
  };

  const unclaimedResults =
    searchResults?.items?.filter((p) => !p.place.organizationId) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back to options
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by venue name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          autoFocus
        />
      </div>

      <ScrollArea className="h-[min(50dvh,24rem)] w-full rounded-md border">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6 text-muted-foreground" />
          </div>
        ) : unclaimedResults.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No unclaimed venues found. Try a different search or go back to add
            a new venue.
          </p>
        ) : (
          <div className="space-y-2 p-2">
            {unclaimedResults.map((item) => (
              <div
                key={item.place.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-words">{item.place.name}</p>
                  <p className="text-sm text-muted-foreground break-words">
                    {item.place.city}, {item.place.province}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleSubmitClaim(item.place.id)}
                  disabled={submitClaimMutation.isPending || !!isTransitioning}
                >
                  {submitClaimMutation.isPending ? <Spinner /> : "Claim"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
