type CourtSwitchSelectionInput = {
  previousSelectionMode: "any" | "court";
  previousCourtId?: string;
  nextCourtId?: string;
};

export function shouldResetSelectionOnCourtSwitch({
  previousSelectionMode,
  previousCourtId,
  nextCourtId,
}: CourtSwitchSelectionInput): boolean {
  if (
    previousSelectionMode === "court" &&
    previousCourtId &&
    nextCourtId &&
    previousCourtId !== nextCourtId
  ) {
    return false;
  }

  return true;
}
