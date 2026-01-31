"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { formatTimeRangeInTimeZone } from "@/common/format";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBookingStudio } from "./booking-studio-provider";
import type { GuestBookingFormValues } from "./types";

export const ReplaceWithGuestDialog = React.memo(
  function ReplaceWithGuestDialog({
    form,
    onSubmit,
    isSubmitting,
    guestProfilesData,
    guestProfilesLoading,
    placeTimeZone,
    blockStartTime,
    blockEndTime,
    suggestedName,
    title,
    description,
    submitLabel,
  }: {
    form: UseFormReturn<GuestBookingFormValues>;
    onSubmit: (values: GuestBookingFormValues) => Promise<void>;
    isSubmitting: boolean;
    guestProfilesData: Array<{
      id: string;
      displayName: string;
      phoneNumber: string | null;
    }>;
    guestProfilesLoading: boolean;
    placeTimeZone: string;
    blockStartTime: Date | string | null;
    blockEndTime: Date | string | null;
    suggestedName: string | null;
    title?: string;
    description?: string;
    submitLabel?: string;
  }) {
    const replaceDialogOpen = useBookingStudio((s) => s.replaceDialogOpen);
    const closeReplaceDialog = useBookingStudio((s) => s.closeReplaceDialog);
    const guestSearch = useBookingStudio((s) => s.guestSearch);
    const setGuestSearch = useBookingStudio((s) => s.setGuestSearch);
    const guestComboboxOpen = useBookingStudio((s) => s.guestComboboxOpen);
    const setGuestComboboxOpen = useBookingStudio(
      (s) => s.setGuestComboboxOpen,
    );

    const timeDisplay =
      blockStartTime && blockEndTime
        ? formatTimeRangeInTimeZone(blockStartTime, blockEndTime, placeTimeZone)
        : "—";

    return (
      <Dialog
        open={replaceDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeReplaceDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title ?? "Replace with guest booking"}</DialogTitle>
            <DialogDescription>
              {description ??
                "Replace the imported block with a confirmed guest reservation."}
            </DialogDescription>
          </DialogHeader>
          <StandardFormProvider form={form} onSubmit={onSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Time slot</Label>
                <Input value={timeDisplay} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Guest</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      form.watch("guestMode") === "existing"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => form.setValue("guestMode", "existing")}
                  >
                    Select existing
                  </Button>
                  <Button
                    type="button"
                    variant={
                      form.watch("guestMode") === "new" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      form.setValue("guestMode", "new");
                      if (suggestedName && !form.getValues("newGuestName")) {
                        form.setValue("newGuestName", suggestedName);
                      }
                    }}
                  >
                    Create new
                  </Button>
                </div>
              </div>

              {form.watch("guestMode") === "existing" ? (
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
                        {form.watch("guestProfileId")
                          ? (guestProfilesData.find(
                              (g) => g.id === form.watch("guestProfileId"),
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
                                  form.setValue("guestProfileId", value);
                                  setGuestComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.watch("guestProfileId") === guest.id
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
                onClick={closeReplaceDialog}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {submitLabel ?? "Replace block"}
              </Button>
            </DialogFooter>
          </StandardFormProvider>
        </DialogContent>
      </Dialog>
    );
  },
);
