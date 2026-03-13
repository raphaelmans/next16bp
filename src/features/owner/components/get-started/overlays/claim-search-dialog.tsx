"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/common/clients/telemetry-client";
import { useDebouncedValue } from "@/common/hooks/use-debounced-value";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  useMutOwnerSubmitClaim,
  useQueryOwnerClaimablePlaces,
} from "@/features/owner/hooks";

interface ClaimSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
}

export function ClaimSearchDialog({
  open,
  onOpenChange,
  organizationId,
}: ClaimSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim();
  const debouncedSearchQuery = useDebouncedValue(normalizedSearchQuery, 2000);

  const { data: searchResults, isLoading: searching } =
    useQueryOwnerClaimablePlaces(
      {
        q: debouncedSearchQuery || undefined,
        verificationTier: "curated",
        limit: 10,
      },
      {
        enabled: open,
      },
    );

  const isDebouncing = debouncedSearchQuery !== normalizedSearchQuery;
  const isSearching = searching || isDebouncing;

  const submitClaimMutation = useMutOwnerSubmitClaim({
    onSuccess: () => {
      toast.success("Claim submitted", {
        description: "We will review your request and notify you.",
      });
      onOpenChange(false);
      trackEvent({ event: "funnel.owner_claim_submitted" });
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
    submitClaimMutation.mutate({
      placeId,
      organizationId,
    });
  };

  const unclaimedResults =
    searchResults?.items?.filter((p) => !p.place.organizationId) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-hidden sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Find your venue</DialogTitle>
          <DialogDescription>
            Search for your venue to claim ownership.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by venue name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[min(50dvh,24rem)] w-full rounded-md border">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-6 w-6 text-muted-foreground" />
              </div>
            ) : unclaimedResults.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No unclaimed venues found. Try a different search or add a new
                venue instead.
              </p>
            ) : (
              <div className="space-y-2 p-2">
                {unclaimedResults.map((item) => (
                  <div
                    key={item.place.id}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-words">
                        {item.place.name}
                      </p>
                      <p className="text-sm text-muted-foreground break-words">
                        {item.place.city}, {item.place.province}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() => handleSubmitClaim(item.place.id)}
                      disabled={submitClaimMutation.isPending}
                      loading={submitClaimMutation.isPending}
                    >
                      Claim
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
