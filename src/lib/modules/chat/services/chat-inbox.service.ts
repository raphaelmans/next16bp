import { eq } from "drizzle-orm";
import type { IOrganizationMemberService } from "@/lib/modules/organization-member/services/organization-member.service";
import {
  claimRequest,
  court,
  organization,
  place,
  placeVerificationRequest,
  profile,
  reservation,
  reservationGroup,
} from "@/lib/shared/infra/db/schema";
import type { DbClient, DrizzleTransaction } from "@/lib/shared/infra/db/types";
import type { AuthenticatedContext } from "@/lib/shared/infra/trpc/context";
import type { RequestContext } from "@/lib/shared/kernel/context";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/shared/kernel/errors";
import type {
  ChatInboxThreadKind,
  IChatInboxArchiveRepository,
} from "../repositories/chat-inbox-archive.repository";
import { parseInboxThreadRef, type SupportThreadKind } from "../shared/domain";

type Viewer = {
  userId: string;
  role: AuthenticatedContext["session"]["role"];
};

export class ChatInboxService {
  constructor(
    private db: DbClient,
    private archiveRepository: IChatInboxArchiveRepository,
    private organizationMemberService?: Pick<
      IOrganizationMemberService,
      "hasOrganizationPermission"
    >,
  ) {}

  private getClient(ctx?: RequestContext): DbClient | DrizzleTransaction {
    return (ctx?.tx as DrizzleTransaction) ?? this.db;
  }

  private async assertReservationAccess(
    viewer: Viewer,
    reservationId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);

    const rows = await client
      .select({
        reservationId: reservation.id,
        organizationId: organization.id,
        ownerUserId: organization.ownerUserId,
        playerUserId: profile.userId,
      })
      .from(reservation)
      .innerJoin(profile, eq(reservation.playerId, profile.id))
      .innerJoin(court, eq(reservation.courtId, court.id))
      .innerJoin(place, eq(court.placeId, place.id))
      .innerJoin(organization, eq(place.organizationId, organization.id))
      .where(eq(reservation.id, reservationId))
      .limit(1);

    const target = rows[0];
    if (!target) {
      throw new AuthorizationError(
        "You cannot archive this reservation thread",
      );
    }

    if (
      target.playerUserId === viewer.userId ||
      target.ownerUserId === viewer.userId
    ) {
      return;
    }

    const canAccessAsVenueMember =
      (await this.organizationMemberService?.hasOrganizationPermission(
        viewer.userId,
        target.organizationId,
        "reservation.chat",
        ctx,
      )) ?? false;

    if (canAccessAsVenueMember) {
      return;
    }

    throw new AuthorizationError("You cannot archive this reservation thread");
  }

  private async assertSupportAccess(
    viewer: Viewer,
    supportKind: SupportThreadKind,
    requestId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);

    if (supportKind === "claim") {
      const rows = await client
        .select({
          id: claimRequest.id,
          requestedByUserId: claimRequest.requestedByUserId,
        })
        .from(claimRequest)
        .where(eq(claimRequest.id, requestId))
        .limit(1);

      const record = rows[0];
      if (!record) {
        throw new NotFoundError("Support claim thread not found");
      }

      const isOwner = record.requestedByUserId === viewer.userId;
      if (!(viewer.role === "admin" || isOwner)) {
        throw new AuthorizationError("You cannot archive this support thread");
      }
      return;
    }

    const rows = await client
      .select({
        id: placeVerificationRequest.id,
        requestedByUserId: placeVerificationRequest.requestedByUserId,
      })
      .from(placeVerificationRequest)
      .where(eq(placeVerificationRequest.id, requestId))
      .limit(1);

    const record = rows[0];
    if (!record) {
      throw new NotFoundError("Support verification thread not found");
    }

    const isOwner = record.requestedByUserId === viewer.userId;
    if (!(viewer.role === "admin" || isOwner)) {
      throw new AuthorizationError("You cannot archive this support thread");
    }
  }

  private async assertReservationGroupAccess(
    viewer: Viewer,
    reservationGroupId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const client = this.getClient(ctx);

    const rows = await client
      .select({
        reservationGroupId: reservationGroup.id,
        organizationId: organization.id,
        ownerUserId: organization.ownerUserId,
        playerUserId: profile.userId,
      })
      .from(reservationGroup)
      .innerJoin(profile, eq(reservationGroup.playerId, profile.id))
      .innerJoin(place, eq(reservationGroup.placeId, place.id))
      .innerJoin(organization, eq(place.organizationId, organization.id))
      .where(eq(reservationGroup.id, reservationGroupId))
      .limit(1);

    const target = rows[0];
    if (!target) {
      throw new AuthorizationError(
        "You cannot archive this reservation thread",
      );
    }

    if (
      target.playerUserId === viewer.userId ||
      target.ownerUserId === viewer.userId
    ) {
      return;
    }

    const canAccessAsVenueMember =
      (await this.organizationMemberService?.hasOrganizationPermission(
        viewer.userId,
        target.organizationId,
        "reservation.chat",
        ctx,
      )) ?? false;

    if (canAccessAsVenueMember) {
      return;
    }

    throw new AuthorizationError("You cannot archive this reservation thread");
  }

  private parseThreadRef(threadKind: ChatInboxThreadKind, threadId: string) {
    const parsed = parseInboxThreadRef(threadKind, threadId);
    if (!parsed) {
      if (threadKind === "reservation") {
        throw new ValidationError(
          "Reservation thread ids must start with 'res-' or 'grp-'",
        );
      }

      throw new ValidationError(
        "Support thread ids must start with 'cr-' or 'vr-'",
      );
    }

    return parsed;
  }

  private resolveThreadKind(threadId: string): ChatInboxThreadKind | null {
    if (parseInboxThreadRef("reservation", threadId)) {
      return "reservation";
    }

    if (parseInboxThreadRef("support", threadId)) {
      return "support";
    }

    return null;
  }

  private async assertViewerAccess(
    viewer: Viewer,
    threadKind: ChatInboxThreadKind,
    threadId: string,
    ctx?: RequestContext,
  ) {
    const parsed = this.parseThreadRef(threadKind, threadId);

    if (parsed.threadKind === "reservation") {
      if ("reservationId" in parsed) {
        await this.assertReservationAccess(viewer, parsed.reservationId, ctx);
        return;
      }

      await this.assertReservationGroupAccess(
        viewer,
        parsed.reservationGroupId,
        ctx,
      );
      return;
    }

    await this.assertSupportAccess(
      viewer,
      parsed.supportKind,
      parsed.requestId,
      ctx,
    );
  }

  async hasThreadAccess(
    viewer: Viewer,
    threadId: string,
    ctx?: RequestContext,
  ): Promise<boolean> {
    if (viewer.role === "admin") {
      return true;
    }

    const threadKind = this.resolveThreadKind(threadId);
    if (!threadKind) {
      return true;
    }

    try {
      await this.assertViewerAccess(viewer, threadKind, threadId, ctx);
      return true;
    } catch (error) {
      if (
        error instanceof AuthorizationError ||
        error instanceof NotFoundError ||
        error instanceof ValidationError
      ) {
        return false;
      }

      throw error;
    }
  }

  async archiveThread(
    viewer: Viewer,
    input: { threadKind: ChatInboxThreadKind; threadId: string },
    ctx?: RequestContext,
  ) {
    await this.assertViewerAccess(
      viewer,
      input.threadKind,
      input.threadId,
      ctx,
    );

    await this.archiveRepository.upsert(
      {
        userId: viewer.userId,
        threadKind: input.threadKind,
        threadId: input.threadId,
      },
      ctx,
    );

    return { ok: true };
  }

  async unarchiveThread(
    viewer: Viewer,
    input: { threadKind: ChatInboxThreadKind; threadId: string },
    ctx?: RequestContext,
  ) {
    await this.assertViewerAccess(
      viewer,
      input.threadKind,
      input.threadId,
      ctx,
    );

    await this.archiveRepository.removeByThread(
      viewer.userId,
      input.threadKind,
      input.threadId,
      ctx,
    );

    return { ok: true };
  }

  async listArchivedThreadIds(
    viewer: Viewer,
    input: { threadKind: ChatInboxThreadKind },
    ctx?: RequestContext,
  ) {
    return {
      threadIds: await this.archiveRepository.listThreadIdsByKind(
        viewer.userId,
        input.threadKind,
        ctx,
      ),
    };
  }
}
