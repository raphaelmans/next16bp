"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQueryOwnerGuestProfiles } from "@/features/owner/hooks";
import { cn } from "@/lib/utils";

export const MobileGuestForm = React.memo(function MobileGuestForm({
  guestMode,
  onGuestModeChange,
  organizationId,
  onGuestNameChange,
  onGuestPhoneChange,
  onGuestEmailChange,
  onGuestProfileIdChange,
  onNotesChange,
}: {
  guestMode: "new" | "existing";
  onGuestModeChange: (mode: "new" | "existing") => void;
  organizationId: string;
  onGuestNameChange: (v: string) => void;
  onGuestPhoneChange: (v: string) => void;
  onGuestEmailChange: (v: string) => void;
  onGuestProfileIdChange: (v: string) => void;
  onNotesChange: (v: string) => void;
}) {
  const [mobileGuestSearch, setMobileGuestSearch] = React.useState("");
  const [debouncedMobileGuestSearch, setDebouncedMobileGuestSearch] =
    React.useState("");
  const [mobileGuestComboboxOpen, setMobileGuestComboboxOpen] =
    React.useState(false);
  const [selectedGuestName, setSelectedGuestName] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedMobileGuestSearch(mobileGuestSearch),
      2000,
    );
    return () => clearTimeout(timer);
  }, [mobileGuestSearch]);

  const mobileGuestProfilesQuery = useQueryOwnerGuestProfiles(
    {
      organizationId,
      query: debouncedMobileGuestSearch || undefined,
      limit: 50,
    },
    { enabled: !!organizationId },
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-sm font-medium">Guest</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={guestMode === "existing" ? "default" : "outline"}
            size="sm"
            onClick={() => onGuestModeChange("existing")}
          >
            Select existing
          </Button>
          <Button
            type="button"
            variant={guestMode === "new" ? "default" : "outline"}
            size="sm"
            onClick={() => onGuestModeChange("new")}
          >
            Create new
          </Button>
        </div>
      </div>

      {guestMode === "existing" ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Select guest</p>
          <Popover
            open={mobileGuestComboboxOpen}
            onOpenChange={setMobileGuestComboboxOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={mobileGuestComboboxOpen}
                className="w-full justify-between font-normal"
              >
                {selectedGuestName || "Search guests..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search guests..."
                  value={mobileGuestSearch}
                  onValueChange={setMobileGuestSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {mobileGuestProfilesQuery.isLoading ? (
                      <Spinner className="mx-auto" />
                    ) : (
                      "No guests found."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {(mobileGuestProfilesQuery.data ?? []).map((guest) => (
                      <CommandItem
                        key={guest.id}
                        value={guest.id}
                        onSelect={(value) => {
                          onGuestProfileIdChange(value);
                          setSelectedGuestName(guest.displayName);
                          setMobileGuestComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedGuestName === guest.displayName
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {guest.displayName}
                        {guest.phoneNumber ? ` (${guest.phoneNumber})` : ""}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Guest name</span>
            <Input
              placeholder="Juan Dela Cruz"
              onChange={(e) => onGuestNameChange(e.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Phone (optional)</span>
            <Input
              placeholder="09171234567"
              onChange={(e) => onGuestPhoneChange(e.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email (optional)</span>
            <Input
              placeholder="guest@example.com"
              onChange={(e) => onGuestEmailChange(e.target.value)}
            />
          </label>
        </>
      )}

      <label className="block space-y-2">
        <span className="text-sm font-medium">Notes (optional)</span>
        <Textarea
          placeholder="Internal notes"
          rows={2}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </label>
    </div>
  );
});
