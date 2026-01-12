import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  CourtNotFoundError,
  NotCourtOwnerError,
} from "@/modules/court/errors/court.errors";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  publicProcedure,
  router,
} from "@/shared/infra/trpc/trpc";
import { AppError } from "@/shared/kernel/errors";
import {
  BlockSlotSchema,
  CreateBulkTimeSlotsSchema,
  CreateTimeSlotSchema,
  DeleteSlotSchema,
  GetAvailableSlotsSchema,
  GetSlotsForCourtSchema,
  UnblockSlotSchema,
  UpdateSlotPriceSchema,
} from "./dtos";
import {
  CourtNotReservableError,
  SlotInUseError,
  SlotNotAvailableError,
  SlotNotFoundError,
  SlotOverlapError,
  SlotPricingUnavailableError,
} from "./errors/time-slot.errors";
import { makeTimeSlotService } from "./factories/time-slot.factory";

/**
 * Maps known errors to appropriate tRPC error codes
 */
function handleTimeSlotError(error: unknown): never {
  if (
    error instanceof SlotNotFoundError ||
    error instanceof CourtNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof NotCourtOwnerError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof SlotOverlapError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }
  if (
    error instanceof SlotNotAvailableError ||
    error instanceof CourtNotReservableError ||
    error instanceof SlotInUseError ||
    error instanceof SlotPricingUnavailableError
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  if (error instanceof AppError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }
  throw error;
}

export const timeSlotRouter = router({
  /**
   * Get available time slots for a court within a date range (public)
   */
  getAvailable: publicProcedure
    .input(GetAvailableSlotsSchema)
    .query(async ({ input }) => {
      const service = makeTimeSlotService();
      return await service.getAvailableSlots(input);
    }),

  /**
   * Get a single time slot by ID (public)
   */
  getById: publicProcedure
    .input(z.object({ slotId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const service = makeTimeSlotService();
        return await service.getSlotById(input.slotId);
      } catch (error) {
        handleTimeSlotError(error);
      }
    }),

  /**
   * Get all time slots for a court (owner only)
   * Includes player info for HELD/BOOKED slots
   */
  getForCourt: protectedProcedure
    .input(GetSlotsForCourtSchema)
    .query(async ({ input, ctx }) => {
      try {
        const service = makeTimeSlotService();
        return await service.getSlotsForCourt(ctx.userId, input);
      } catch (error) {
        handleTimeSlotError(error);
      }
    }),

  /**
   * Create a single time slot (owner only)
   */
  create: protectedRateLimitedProcedure("mutation")
    .input(CreateTimeSlotSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeTimeSlotService();
        return await service.createSlot(ctx.userId, input);
      } catch (error) {
        handleTimeSlotError(error);
      }
    }),

  /**
   * Create multiple time slots at once (owner only)
   */
  createBulk: protectedRateLimitedProcedure("sensitive")
    .input(CreateBulkTimeSlotsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeTimeSlotService();
        return await service.createBulkSlots(ctx.userId, input);
      } catch (error) {
        handleTimeSlotError(error);
      }
    }),

  /**
   * Block a time slot (owner only)
   */
  block: protectedProcedure
    .input(BlockSlotSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeTimeSlotService();
        return await service.blockSlot(ctx.userId, input.slotId);
      } catch (error) {
        handleTimeSlotError(error);
      }
    }),

  /**
   * Unblock a time slot (owner only)
   */
  unblock: protectedProcedure
    .input(UnblockSlotSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeTimeSlotService();
        return await service.unblockSlot(ctx.userId, input.slotId);
      } catch (error) {
        handleTimeSlotError(error);
      }
    }),

  /**
   * Update time slot price (owner only)
   */
  updatePrice: protectedProcedure
    .input(UpdateSlotPriceSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeTimeSlotService();
        return await service.updateSlotPrice(ctx.userId, input);
      } catch (error) {
        handleTimeSlotError(error);
      }
    }),

  /**
   * Delete a time slot (owner only, only AVAILABLE slots)
   */
  delete: protectedProcedure
    .input(DeleteSlotSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const service = makeTimeSlotService();
        await service.deleteSlot(ctx.userId, input.slotId);
        return { success: true };
      } catch (error) {
        handleTimeSlotError(error);
      }
    }),
});
