"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MobileGuestForm } from "./mobile-guest-form";

export const SelectionPanelForm = React.memo(function SelectionPanelForm({
  blockType,
  onBlockTypeChange,
  guestModeState,
  organizationId,
  onGuestModeChange,
  onGuestNameChange,
  onGuestPhoneChange,
  onGuestEmailChange,
  onGuestProfileIdChange,
  onNotesChange,
}: {
  blockType: "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING";
  onBlockTypeChange: (
    type: "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING",
  ) => void;
  guestModeState: "new" | "existing";
  organizationId: string;
  onGuestModeChange: (mode: "new" | "existing") => void;
  onGuestNameChange: (v: string) => void;
  onGuestPhoneChange: (v: string) => void;
  onGuestEmailChange: (v: string) => void;
  onGuestProfileIdChange: (v: string) => void;
  onNotesChange: (v: string) => void;
}) {
  return (
    <>
      <ToggleGroup
        type="single"
        value={blockType}
        onValueChange={(value) => {
          if (value)
            onBlockTypeChange(
              value as "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING",
            );
        }}
        className="w-full flex-wrap"
      >
        <ToggleGroupItem value="GUEST_BOOKING" className="flex-1 shrink">
          Guest
        </ToggleGroupItem>
        <ToggleGroupItem value="WALK_IN" className="flex-1 shrink">
          Walk-in
        </ToggleGroupItem>
        <ToggleGroupItem value="MAINTENANCE" className="flex-1 shrink">
          Maint.
        </ToggleGroupItem>
      </ToggleGroup>

      {blockType !== "GUEST_BOOKING" ? (
        <>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps textarea */}
          <label className="block space-y-2">
            <span className="text-sm font-medium">Note (optional)</span>
            <Textarea
              placeholder={
                blockType === "MAINTENANCE"
                  ? "e.g. Net replacement"
                  : "e.g. Regular customer"
              }
              rows={2}
              defaultValue=""
              onChange={(e) => {
                onNotesChange(e.target.value);
              }}
            />
          </label>
        </>
      ) : null}

      {blockType === "GUEST_BOOKING" ? (
        <MobileGuestForm
          guestMode={guestModeState}
          onGuestModeChange={onGuestModeChange}
          organizationId={organizationId}
          onGuestNameChange={onGuestNameChange}
          onGuestPhoneChange={onGuestPhoneChange}
          onGuestEmailChange={onGuestEmailChange}
          onGuestProfileIdChange={onGuestProfileIdChange}
          onNotesChange={onNotesChange}
        />
      ) : null}
    </>
  );
});
