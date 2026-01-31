import { z } from "zod";
import { S } from "@/common/schemas";

export const ReplaceWithGuestSchema = z
  .object({
    rowId: S.ids.rowId,
    guestMode: z.enum(["existing", "new"]),
    guestProfileId: S.ids.generic.optional(),
    newGuestName: z.string().min(1).max(100).optional(),
    newGuestPhone: z.string().max(20).optional(),
    newGuestEmail: z.string().email().optional(),
    notes: S.reservation.notes,
  })
  .refine(
    (data) => {
      if (data.guestMode === "existing") return !!data.guestProfileId;
      return !!data.newGuestName;
    },
    {
      message:
        "Guest profile ID is required for existing mode; name is required for new mode",
    },
  );

export type ReplaceWithGuestDTO = z.infer<typeof ReplaceWithGuestSchema>;
