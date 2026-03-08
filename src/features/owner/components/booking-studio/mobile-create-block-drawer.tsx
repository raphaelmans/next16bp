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
import { Spinner } from "@/components/ui/spinner";
import { getBlockCtaLabel } from "@/features/owner/booking-studio/helpers";
import { useBookingStudio } from "./booking-studio-provider";
import { SelectionPanelForm } from "./selection-panel-form";

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
    const selectionBlockType = useBookingStudio((s) => s.selectionBlockType);
    const setSelectionBlockType = useBookingStudio(
      (s) => s.setSelectionBlockType,
    );
    const guestModeState = useBookingStudio((s) => s.guestModeState);
    const setGuestMode = useBookingStudio((s) => s.setGuestMode);
    const setGuestModeState = useBookingStudio((s) => s.setGuestModeState);
    const setGuestName = useBookingStudio((s) => s.setGuestName);
    const setGuestPhone = useBookingStudio((s) => s.setGuestPhone);
    const setGuestEmail = useBookingStudio((s) => s.setGuestEmail);
    const setGuestProfileId = useBookingStudio((s) => s.setGuestProfileId);
    const setNotes = useBookingStudio((s) => s.setNotes);

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
            <SelectionPanelForm
              blockType={selectionBlockType}
              onBlockTypeChange={setSelectionBlockType}
              guestModeState={guestModeState}
              organizationId={organizationId}
              onGuestModeChange={(mode) => {
                setGuestMode(mode);
                setGuestModeState(mode);
              }}
              onGuestNameChange={setGuestName}
              onGuestPhoneChange={setGuestPhone}
              onGuestEmailChange={setGuestEmail}
              onGuestProfileIdChange={setGuestProfileId}
              onNotesChange={setNotes}
            />
          </div>
          <DrawerFooter className="pb-safe">
            <Button
              onClick={handleMobileSubmit}
              className="w-full"
              disabled={isCreatingBlock}
            >
              {isCreatingBlock && <Spinner />}
              {getBlockCtaLabel(selectionBlockType)}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
);
