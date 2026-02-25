import { and, eq, or } from "drizzle-orm";
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
      .select({ reservationId: reservation.id })
      .from(reservation)
      .innerJoin(profile, eq(reservation.playerId, profile.id))
      .innerJoin(court, eq(reservation.courtId, court.id))
      .innerJoin(place, eq(court.placeId, place.id))
      .innerJoin(organization, eq(place.organizationId, organization.id))
      .where(
        and(
          eq(reservation.id, reservationId),
          or(
            eq(profile.userId, viewer.userId),
            eq(organization.ownerUserId, viewer.userId),
          ),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      throw new AuthorizationError(
        "You cannot archive this reservation thread",
      );
    }
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
      .select({ reservationGroupId: reservationGroup.id })
      .from(reservationGroup)
      .innerJoin(profile, eq(reservationGroup.playerId, profile.id))
      .innerJoin(place, eq(reservationGroup.placeId, place.id))
      .innerJoin(organization, eq(place.organizationId, organization.id))
      .where(
        and(
          eq(reservationGroup.id, reservationGroupId),
          or(
            eq(profile.userId, viewer.userId),
            eq(organization.ownerUserId, viewer.userId),
          ),
        ),
      )
      .limit(1);

    if (rows.length === 0) {
      throw new AuthorizationError(
        "You cannot archive this reservation thread",
      );
    }
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
