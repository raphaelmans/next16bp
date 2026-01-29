"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useBookingStudio } from "./booking-studio-provider";
import { MobileGuestForm } from "./mobile-guest-form";

export const MobileCreateBlockDrawer = React.memo(
  function MobileCreateBlockDrawer({
    handleMobileSubmit,
    isCreatingBlock,
    mobileSelectedTimeLabel,
    placeTimeZone,
    organizationId,
    onDrawerClose,
  }: {
    handleMobileSubmit: () => Promise<void>;
    isCreatingBlock: boolean;
    mobileSelectedTimeLabel: string;
    placeTimeZone: string;
    organizationId: string;
    onDrawerClose: (open: boolean) => void;
  }) {
    const mobileDrawerOpen = useBookingStudio((s) => s.mobileDrawerOpen);
    const mobileBlockType = useBookingStudio((s) => s.mobileBlockType);
    const setMobileBlockType = useBookingStudio((s) => s.setMobileBlockType);
    const mobileGuestModeState = useBookingStudio(
      (s) => s.mobileGuestModeState,
    );
    const setMobileGuestMode = useBookingStudio((s) => s.setMobileGuestMode);
    const setMobileGuestModeState = useBookingStudio(
      (s) => s.setMobileGuestModeState,
    );
    const setMobileGuestName = useBookingStudio((s) => s.setMobileGuestName);
    const setMobileGuestPhone = useBookingStudio((s) => s.setMobileGuestPhone);
    const setMobileGuestEmail = useBookingStudio((s) => s.setMobileGuestEmail);
    const setMobileGuestProfileId = useBookingStudio(
      (s) => s.setMobileGuestProfileId,
    );
    const setMobileNotes = useBookingStudio((s) => s.setMobileNotes);

    return (
      <Drawer open={mobileDrawerOpen} onOpenChange={onDrawerClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create Block</DrawerTitle>
            <DrawerDescription>
              {mobileSelectedTimeLabel} · {placeTimeZone}
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4 space-y-4">
            <ToggleGroup
              type="single"
              value={mobileBlockType}
              onValueChange={(value) => {
                if (value)
                  setMobileBlockType(
                    value as "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING",
                  );
              }}
              className="w-full"
            >
              <ToggleGroupItem value="GUEST_BOOKING" className="flex-1">
                Guest
              </ToggleGroupItem>
              <ToggleGroupItem value="WALK_IN" className="flex-1">
                Walk-in
              </ToggleGroupItem>
              <ToggleGroupItem value="MAINTENANCE" className="flex-1">
                Maintenance
              </ToggleGroupItem>
            </ToggleGroup>

            {mobileBlockType !== "GUEST_BOOKING" ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium">Note (optional)</span>
                <textarea
                  className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                  placeholder={
                    mobileBlockType === "MAINTENANCE"
                      ? "e.g. Net replacement"
                      : "e.g. Regular customer"
                  }
                  rows={2}
                  defaultValue=""
                  onChange={(e) => {
                    setMobileNotes(e.target.value);
                  }}
                />
              </label>
            ) : null}

            {mobileBlockType === "GUEST_BOOKING" ? (
              <MobileGuestForm
                guestMode={mobileGuestModeState}
                onGuestModeChange={(mode) => {
                  setMobileGuestMode(mode);
                  setMobileGuestModeState(mode);
                }}
                organizationId={organizationId}
                onGuestNameChange={setMobileGuestName}
                onGuestPhoneChange={setMobileGuestPhone}
                onGuestEmailChange={setMobileGuestEmail}
                onGuestProfileIdChange={setMobileGuestProfileId}
                onNotesChange={setMobileNotes}
              />
            ) : null}
          </div>
          <DrawerFooter className="pb-safe">
            <Button
              onClick={handleMobileSubmit}
              className="w-full"
              disabled={isCreatingBlock}
            >
              {isCreatingBlock
                ? "Saving..."
                : mobileBlockType === "WALK_IN"
                  ? "Save walk-in booking"
                  : mobileBlockType === "MAINTENANCE"
                    ? "Save maintenance block"
                    : "Save guest booking"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
);
