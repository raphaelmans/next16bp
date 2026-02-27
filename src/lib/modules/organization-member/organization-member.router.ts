import { TRPCError } from "@trpc/server";
import { OrganizationNotFoundError } from "@/lib/modules/organization/errors/organization.errors";
import {
  protectedProcedure,
  protectedRateLimitedProcedure,
  router,
} from "@/lib/shared/infra/trpc/trpc";
import { AppError } from "@/lib/shared/kernel/errors";
import {
  CancelOrganizationInvitationSchema,
  GetMyOrganizationPermissionsSchema,
  GetMyReservationNotificationPreferenceSchema,
  GetReservationNotificationRoutingStatusSchema,
  InviteOrganizationMemberSchema,
  ListOrganizationInvitationsSchema,
  ListOrganizationMembersSchema,
  ResolveOrganizationInvitationSchema,
  RevokeOrganizationMemberSchema,
  SetMyReservationNotificationPreferenceSchema,
  UpdateOrganizationMemberPermissionsSchema,
} from "./dtos";
import {
  OrganizationInvitationAlreadyResolvedError,
  OrganizationInvitationEmailMismatchError,
  OrganizationInvitationExpiredError,
  OrganizationInvitationNotFoundError,
  OrganizationMemberAlreadyExistsError,
  OrganizationMemberNotFoundError,
  OrganizationMemberPermissionDeniedError,
} from "./errors/organization-member.errors";
import { makeOrganizationMemberService } from "./factories/organization-member.factory";

function handleOrganizationMemberError(error: unknown): never {
  if (
    error instanceof OrganizationNotFoundError ||
    error instanceof OrganizationMemberNotFoundError ||
    error instanceof OrganizationInvitationNotFoundError
  ) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  if (
    error instanceof OrganizationMemberPermissionDeniedError ||
    error instanceof OrganizationInvitationEmailMismatchError
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }

  if (
    error instanceof OrganizationInvitationAlreadyResolvedError ||
    error instanceof OrganizationMemberAlreadyExistsError
  ) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof OrganizationInvitationExpiredError) {
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

export const organizationMemberRouter = router({
  list: protectedProcedure
    .input(ListOrganizationMembersSchema)
    .query(async ({ ctx, input }) => {
      try {
        const service = makeOrganizationMemberService();
        return await service.listMembers(ctx.userId, input.organizationId);
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  listInvitations: protectedProcedure
    .input(ListOrganizationInvitationsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const service = makeOrganizationMemberService();
        return await service.listInvitations(ctx.userId, input.organizationId, {
          includeHistory: input.includeHistory,
        });
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  getMyPermissions: protectedProcedure
    .input(GetMyOrganizationPermissionsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const service = makeOrganizationMemberService();
        return await service.getMyPermissions(ctx.userId, input.organizationId);
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  getMyReservationNotificationPreference: protectedProcedure
    .input(GetMyReservationNotificationPreferenceSchema)
    .query(async ({ ctx, input }) => {
      try {
        const service = makeOrganizationMemberService();
        return await service.getMyReservationNotificationPreference(
          ctx.userId,
          input.organizationId,
        );
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  setMyReservationNotificationPreference: protectedProcedure
    .input(SetMyReservationNotificationPreferenceSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeOrganizationMemberService();
        return await service.setMyReservationNotificationPreference(
          ctx.userId,
          input,
        );
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  getReservationNotificationRoutingStatus: protectedProcedure
    .input(GetReservationNotificationRoutingStatusSchema)
    .query(async ({ ctx, input }) => {
      try {
        const service = makeOrganizationMemberService();
        return await service.getReservationNotificationRoutingStatus(
          ctx.userId,
          input,
        );
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  invite: protectedRateLimitedProcedure("mutation")
    .input(InviteOrganizationMemberSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeOrganizationMemberService();
        return await service.inviteMember(
          ctx.userId,
          input,
          { origin: ctx.origin },
          undefined,
        );
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  updatePermissions: protectedProcedure
    .input(UpdateOrganizationMemberPermissionsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeOrganizationMemberService();
        return await service.updateMemberPermissions(ctx.userId, input);
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  revokeMember: protectedProcedure
    .input(RevokeOrganizationMemberSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeOrganizationMemberService();
        return await service.revokeMember(ctx.userId, input);
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  cancelInvitation: protectedProcedure
    .input(CancelOrganizationInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = makeOrganizationMemberService();
        return await service.cancelInvitation(ctx.userId, input);
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  acceptInvitation: protectedProcedure
    .input(ResolveOrganizationInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const email = ctx.session.email;
        if (!email) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authenticated email is required",
          });
        }

        const service = makeOrganizationMemberService();
        return await service.acceptInvitation(ctx.userId, email, input);
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),

  declineInvitation: protectedProcedure
    .input(ResolveOrganizationInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const email = ctx.session.email;
        if (!email) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Authenticated email is required",
          });
        }

        const service = makeOrganizationMemberService();
        return await service.declineInvitation(ctx.userId, email, input);
      } catch (error) {
        handleOrganizationMemberError(error);
      }
    }),
});
