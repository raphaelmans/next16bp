"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
  StandardFormTextarea,
} from "@/components/form";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { getBlockCtaLabel } from "@/features/owner/booking-studio/helpers";
import { cn } from "@/lib/utils";
import { useBookingStudio } from "./booking-studio-provider";
import type { CustomBlockFormValues } from "./types";
import { blockTypeOptions } from "./types";

export const CustomBlockDialog = React.memo(function CustomBlockDialog({
  customForm,
  handleCustomSubmit,
  isCreatingBlock,
  placeTimeZone,
  guestProfilesData,
  guestProfilesLoading,
}: {
  customForm: UseFormReturn<CustomBlockFormValues>;
  handleCustomSubmit: (values: CustomBlockFormValues) => Promise<void>;
  isCreatingBlock: boolean;
  placeTimeZone: string;
  guestProfilesData: Array<{
    id: string;
    displayName: string;
    phoneNumber: string | null;
  }>;
  guestProfilesLoading: boolean;
}) {
  const customDialogOpen = useBookingStudio((s) => s.customDialogOpen);
  const setCustomDialogOpen = useBookingStudio((s) => s.setCustomDialogOpen);
  const watchedBlockType = customForm.watch("blockType");
  const watchedGuestMode = customForm.watch("guestMode");
  const watchedGuestProfileId = customForm.watch("guestProfileId");

  const [guestComboboxOpen, setGuestComboboxOpen] = React.useState(false);

  const isGuest = watchedBlockType === "GUEST_BOOKING";

  return (
    <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
      <DialogContent className={isGuest ? "sm:max-w-lg" : undefined}>
        <DialogHeader>
          <DialogTitle>Create custom block</DialogTitle>
          <DialogDescription>
            Times are shown in {placeTimeZone}. Blocks must align to full hours.
          </DialogDescription>
        </DialogHeader>
        <StandardFormProvider form={customForm} onSubmit={handleCustomSubmit}>
          <StandardFormSelect<CustomBlockFormValues>
            name="blockType"
            label="Block type"
            options={blockTypeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            required
          />
          <StandardFormInput<CustomBlockFormValues>
            name="startTime"
            label="Start time"
            type="datetime-local"
            required
          />
          <StandardFormInput<CustomBlockFormValues>
            name="endTime"
            label="End time"
            type="datetime-local"
            required
          />

          {isGuest ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Guest</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      watchedGuestMode === "existing" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => customForm.setValue("guestMode", "existing")}
                  >
                    Select existing
                  </Button>
                  <Button
                    type="button"
                    variant={watchedGuestMode === "new" ? "default" : "outline"}
                    size="sm"
                    onClick={() => customForm.setValue("guestMode", "new")}
                  >
                    Create new
                  </Button>
                </div>
              </div>

              {watchedGuestMode === "existing" ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Select guest</p>
                  <Popover
                    open={guestComboboxOpen}
                    onOpenChange={setGuestComboboxOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={guestComboboxOpen}
                        className="w-full justify-between font-normal"
                      >
                        {watchedGuestProfileId
                          ? (guestProfilesData.find(
                              (g) => g.id === watchedGuestProfileId,
                            )?.displayName ?? "Search guests...")
                          : "Search guests..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput placeholder="Search guests..." />
                        <CommandList>
                          <CommandEmpty>
                            {guestProfilesLoading ? (
                              <Spinner className="mx-auto" />
                            ) : (
                              "No guests found."
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {guestProfilesData.map((guest) => (
                              <CommandItem
                                key={guest.id}
                                value={guest.id}
                                onSelect={(value) => {
                                  customForm.setValue("guestProfileId", value);
                                  setGuestComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    watchedGuestProfileId === guest.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {guest.displayName}
                                {guest.phoneNumber
                                  ? ` (${guest.phoneNumber})`
                                  : ""}
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
                  <StandardFormInput<CustomBlockFormValues>
                    name="newGuestName"
                    label="Guest name"
                    placeholder="Juan Dela Cruz"
                    required
                  />
                  <StandardFormInput<CustomBlockFormValues>
                    name="newGuestPhone"
                    label="Phone (optional)"
                    placeholder="09171234567"
                  />
                  <StandardFormInput<CustomBlockFormValues>
                    name="newGuestEmail"
                    label="Email (optional)"
                    placeholder="guest@example.com"
                  />
                </>
              )}

              <StandardFormTextarea<CustomBlockFormValues>
                name="reason"
                label="Notes (optional)"
                placeholder="Internal notes"
              />
            </>
          ) : (
            <StandardFormTextarea<CustomBlockFormValues>
              name="reason"
              label="Reason (optional)"
              placeholder="Net replacement"
            />
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCustomDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreatingBlock}>
              {isCreatingBlock && <Spinner />}
              {getBlockCtaLabel(watchedBlockType)}
            </Button>
          </DialogFooter>
        </StandardFormProvider>
      </DialogContent>
    </Dialog>
  );
});
