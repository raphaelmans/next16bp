"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  StandardFormInput,
  StandardFormProvider,
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
import { cn } from "@/lib/utils";
import { useBookingStudio } from "./booking-studio-provider";
import type { GuestBookingFormValues } from "./types";

export const GuestBookingDialog = React.memo(function GuestBookingDialog({
  guestBookingForm,
  handleGuestBookingSubmit,
  isSubmitting,
  guestProfilesData,
  guestProfilesLoading,
  placeTimeZone,
}: {
  guestBookingForm: UseFormReturn<GuestBookingFormValues>;
  handleGuestBookingSubmit: (values: GuestBookingFormValues) => Promise<void>;
  isSubmitting: boolean;
  guestProfilesData: Array<{
    id: string;
    displayName: string;
    phoneNumber: string | null;
  }>;
  guestProfilesLoading: boolean;
  placeTimeZone: string;
}) {
  const guestBookingOpen = useBookingStudio((s) => s.guestBookingOpen);
  const closeGuestBookingDialog = useBookingStudio(
    (s) => s.closeGuestBookingDialog,
  );
  const guestSearch = useBookingStudio((s) => s.guestSearch);
  const setGuestSearch = useBookingStudio((s) => s.setGuestSearch);
  const guestComboboxOpen = useBookingStudio((s) => s.guestComboboxOpen);
  const setGuestComboboxOpen = useBookingStudio((s) => s.setGuestComboboxOpen);

  return (
    <Dialog
      open={guestBookingOpen}
      onOpenChange={(open) => {
        if (!open) closeGuestBookingDialog();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add guest booking</DialogTitle>
          <DialogDescription>
            Create a confirmed reservation for a guest. Pricing is computed from
            your schedule in {placeTimeZone}.
          </DialogDescription>
        </DialogHeader>
        <StandardFormProvider
          form={guestBookingForm}
          onSubmit={handleGuestBookingSubmit}
        >
          <div className="space-y-4">
            <StandardFormInput<GuestBookingFormValues>
              name="startTime"
              label="Start time"
              type="datetime-local"
              required
            />
            <StandardFormInput<GuestBookingFormValues>
              name="endTime"
              label="End time"
              type="datetime-local"
              required
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Guest</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={
                    guestBookingForm.watch("guestMode") === "existing"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    guestBookingForm.setValue("guestMode", "existing")
                  }
                >
                  Select existing
                </Button>
                <Button
                  type="button"
                  variant={
                    guestBookingForm.watch("guestMode") === "new"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => guestBookingForm.setValue("guestMode", "new")}
                >
                  Create new
                </Button>
              </div>
            </div>

            {guestBookingForm.watch("guestMode") === "existing" ? (
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
                      {guestBookingForm.watch("guestProfileId")
                        ? (guestProfilesData.find(
                            (g) =>
                              g.id === guestBookingForm.watch("guestProfileId"),
                          )?.displayName ?? "Search guests...")
                        : "Search guests..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search guests..."
                        value={guestSearch}
                        onValueChange={setGuestSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {guestProfilesLoading
                            ? "Loading..."
                            : "No guests found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {guestProfilesData.map((guest) => (
                            <CommandItem
                              key={guest.id}
                              value={guest.id}
                              onSelect={(value) => {
                                guestBookingForm.setValue(
                                  "guestProfileId",
                                  value,
                                );
                                setGuestComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  guestBookingForm.watch("guestProfileId") ===
                                    guest.id
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
                <StandardFormInput<GuestBookingFormValues>
                  name="newGuestName"
                  label="Guest name"
                  placeholder="Juan Dela Cruz"
                  required
                />
                <StandardFormInput<GuestBookingFormValues>
                  name="newGuestPhone"
                  label="Phone (optional)"
                  placeholder="09171234567"
                />
                <StandardFormInput<GuestBookingFormValues>
                  name="newGuestEmail"
                  label="Email (optional)"
                  placeholder="guest@example.com"
                />
              </>
            )}

            <StandardFormTextarea<GuestBookingFormValues>
              name="notes"
              label="Notes (optional)"
              placeholder="Internal notes"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={closeGuestBookingDialog}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || guestBookingForm.formState.isSubmitting}
            >
              {isSubmitting || guestBookingForm.formState.isSubmitting
                ? "Saving…"
                : "Save guest booking"}
            </Button>
          </DialogFooter>
        </StandardFormProvider>
      </DialogContent>
    </Dialog>
  );
});
