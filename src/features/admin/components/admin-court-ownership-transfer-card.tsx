"use client";

import { Check, ChevronsUpDown, Copy, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type OrganizationSearchItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type AdminCourtOwnershipTransferCardProps = {
  placeType: string;
  claimStatus: string;
  currentOrganization?: { name?: string | null; slug?: string | null } | null;
  selectedOrganization?: OrganizationSearchItem;
  setSelectedOrganization: (org: OrganizationSearchItem | undefined) => void;
  isTransferOpen: boolean;
  setIsTransferOpen: (open: boolean) => void;
  isOrgPopoverOpen: boolean;
  setIsOrgPopoverOpen: (open: boolean) => void;
  orgSearch: string;
  setOrgSearch: (value: string) => void;
  organizationOptions: OrganizationSearchItem[];
  orgSearchLoading: boolean;
  autoVerifyAndEnable: boolean;
  setAutoVerifyAndEnable: (value: boolean) => void;
  isSameOrganization: boolean;
  transferDisabled: boolean;
  transferPending: boolean;
  onTransfer: () => void;
  onCopyOwnerLink: () => void;
  copyOwnerLinkDisabled: boolean;
};

export function AdminCourtOwnershipTransferCard({
  placeType,
  claimStatus,
  currentOrganization,
  selectedOrganization,
  setSelectedOrganization,
  isTransferOpen,
  setIsTransferOpen,
  isOrgPopoverOpen,
  setIsOrgPopoverOpen,
  orgSearch,
  setOrgSearch,
  organizationOptions,
  orgSearchLoading,
  autoVerifyAndEnable,
  setAutoVerifyAndEnable,
  isSameOrganization,
  transferDisabled,
  transferPending,
  onTransfer,
  onCopyOwnerLink,
  copyOwnerLinkDisabled,
}: AdminCourtOwnershipTransferCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ownership & Transfer</CardTitle>
        <CardDescription>
          Assign this venue to an organization and enable reservations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Current organization
            </p>
            <p className="text-sm font-medium">
              {currentOrganization?.name ?? "Unassigned"}
            </p>
            {currentOrganization?.slug ? (
              <p className="text-xs text-muted-foreground">
                {currentOrganization.slug}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={placeType === "RESERVABLE" ? "default" : "secondary"}
              >
                {placeType}
              </Badge>
              <Badge
                variant={claimStatus === "CLAIMED" ? "success" : "warning"}
              >
                {claimStatus}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger asChild>
              <Button type="button">Transfer</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Transfer to organization</DialogTitle>
                <DialogDescription>
                  Move this venue and its courts to another organization.
                  Reservations stay intact.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Popover
                    open={isOrgPopoverOpen}
                    onOpenChange={setIsOrgPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOrgPopoverOpen}
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {selectedOrganization
                            ? selectedOrganization.name
                            : "Select organization"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search organizations..."
                          value={orgSearch}
                          onValueChange={setOrgSearch}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {orgSearchLoading
                              ? "Loading organizations..."
                              : "No organizations found."}
                          </CommandEmpty>
                          <CommandGroup>
                            {organizationOptions.map((org) => (
                              <CommandItem
                                key={org.id}
                                value={`${org.name} ${org.slug}`}
                                onSelect={() => {
                                  setSelectedOrganization(org);
                                  setIsOrgPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={
                                    selectedOrganization?.id === org.id
                                      ? "mr-2 h-4 w-4 opacity-100"
                                      : "mr-2 h-4 w-4 opacity-0"
                                  }
                                />
                                <div className="flex flex-col text-left">
                                  <span className="text-sm font-medium">
                                    {org.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {org.slug}
                                  </span>
                                </div>
                                {!org.isActive ? (
                                  <Badge variant="warning" className="ml-auto">
                                    Inactive
                                  </Badge>
                                ) : null}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {isSameOrganization ? (
                    <p className="text-xs text-destructive">
                      Select a different organization to transfer.
                    </p>
                  ) : null}
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                  <Checkbox
                    id="auto-verify"
                    checked={autoVerifyAndEnable}
                    onCheckedChange={(checked) =>
                      setAutoVerifyAndEnable(Boolean(checked))
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="auto-verify" className="text-sm">
                      Auto-verify and enable reservations
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Marks the venue as VERIFIED and enables booking
                      immediately.
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTransferOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={onTransfer}
                  disabled={transferDisabled}
                >
                  {transferPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Transfer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            type="button"
            variant="outline"
            onClick={onCopyOwnerLink}
            disabled={copyOwnerLinkDisabled}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy owner link
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Transfers keep existing reservations and move all courts under this
          venue.
        </p>
      </CardContent>
    </Card>
  );
}
