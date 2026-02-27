import { createHash, randomBytes } from "node:crypto";
import { addDays } from "date-fns";
import { appRoutes } from "@/common/app-routes";
import { env } from "@/lib/env";
import { OrganizationNotFoundError } from "@/lib/modules/organization/errors/organization.errors";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import { renderBrandedEmailHtml } from "@/lib/shared/infra/email/email-html-template";
import type {
  EmailPayload,
  EmailServiceStrategy,
} from "@/lib/shared/infra/email/email-service";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import { AuthorizationError } from "@/lib/shared/kernel/errors";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  CancelOrganizationInvitationDTO,
  GetReservationNotificationRoutingStatusDTO,
  InviteOrganizationMemberDTO,
  ResolveOrganizationInvitationDTO,
  RevokeOrganizationMemberDTO,
  SetMyReservationNotificationPreferenceDTO,
  UpdateOrganizationMemberPermissionsDTO,
} from "../dtos";
import {
  OrganizationInvitationAlreadyResolvedError,
  OrganizationInvitationEmailMismatchError,
  OrganizationInvitationExpiredError,
  OrganizationInvitationNotFoundError,
  OrganizationMemberAlreadyExistsError,
  OrganizationMemberNotFoundError,
  OrganizationMemberPermissionDeniedError,
} from "../errors/organization-member.errors";
import type {
  IOrganizationMemberRepository,
  OrganizationInvitationListItem,
  OrganizationMemberListItem,
} from "../repositories/organization-member.repository";
import {
  deriveEnabledReservationNotificationUserIds,
  deriveReservationNotificationRoutingStatus,
} from "../shared/domain";
import {
  normalizeOrganizationPermissions,
  type OrganizationMemberPermission,
  type OrganizationMemberRole,
  OWNER_IMPLICIT_PERMISSIONS,
} from "../shared/permissions";

const INVITATION_TTL_DAYS = 7;

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export type OrganizationPermissionContext = {
  organizationId: string;
  userId: string;
  isOwner: boolean;
  role: OrganizationMemberRole;
  permissions: OrganizationMemberPermission[];
};

export type OrganizationReservationNotificationPreference = {
  organizationId: string;
  userId: string;
  enabled: boolean;
  canReceive: boolean;
};

export type OrganizationReservationNotificationRoutingStatus = {
  organizationId: string;
  enabledRecipientCount: number;
  hasEnabledRecipients: boolean;
};

export interface IOrganizationMemberService {
  listMembers(
    userId: string,
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberListItem[]>;
  listInvitations(
    userId: string,
    organizationId: string,
    options?: { includeHistory?: boolean },
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationListItem[]>;
  inviteMember(
    userId: string,
    input: InviteOrganizationMemberDTO,
    options: { origin: string },
    ctx?: RequestContext,
  ): Promise<{
    invitation: OrganizationInvitationListItem["invitation"];
    emailSent: boolean;
  }>;
  updateMemberPermissions(
    userId: string,
    input: UpdateOrganizationMemberPermissionsDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberListItem["member"]>;
  revokeMember(
    userId: string,
    input: RevokeOrganizationMemberDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberListItem["member"]>;
  cancelInvitation(
    userId: string,
    input: CancelOrganizationInvitationDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationListItem["invitation"]>;
  acceptInvitation(
    userId: string,
    userEmail: string,
    input: ResolveOrganizationInvitationDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberListItem["member"]>;
  declineInvitation(
    userId: string,
    userEmail: string,
    input: ResolveOrganizationInvitationDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationListItem["invitation"]>;
  getMyPermissions(
    userId: string,
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationPermissionContext>;
  getMyReservationNotificationPreference(
    userId: string,
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationNotificationPreference>;
  setMyReservationNotificationPreference(
    userId: string,
    input: SetMyReservationNotificationPreferenceDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationNotificationPreference>;
  getReservationNotificationRoutingStatus(
    userId: string,
    input: GetReservationNotificationRoutingStatusDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationNotificationRoutingStatus>;
  hasOrganizationPermission(
    userId: string,
    organizationId: string,
    permission: OrganizationMemberPermission,
    ctx?: RequestContext,
  ): Promise<boolean>;
  assertOrganizationPermission(
    userId: string,
    organizationId: string,
    permission: OrganizationMemberPermission,
    ctx?: RequestContext,
  ): Promise<OrganizationPermissionContext>;
  listOrganizationUserIdsWithPermission(
    organizationId: string,
    permission: OrganizationMemberPermission,
    ctx?: RequestContext,
  ): Promise<string[]>;
  listOrganizationUserIdsForReservationNotifications(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<string[]>;
}

export class OrganizationMemberService implements IOrganizationMemberService {
  constructor(
    private organizationMemberRepository: IOrganizationMemberRepository,
    private organizationRepository: IOrganizationRepository,
    private emailService: EmailServiceStrategy,
    private transactionManager: TransactionManager,
  ) {}

  private buildTokenHash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private buildInvitationToken(): { token: string; tokenHash: string } {
    const token = randomBytes(32).toString("hex");
    return {
      token,
      tokenHash: this.buildTokenHash(token),
    };
  }

  private async getOrganizationOrThrow(
    organizationId: string,
    ctx?: RequestContext,
  ) {
    const organization = await this.organizationRepository.findById(
      organizationId,
      ctx,
    );
    if (!organization) {
      throw new OrganizationNotFoundError(organizationId);
    }
    return organization;
  }

  private async getPermissionContext(
    userId: string,
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationPermissionContext> {
    const organization = await this.getOrganizationOrThrow(organizationId, ctx);

    if (organization.ownerUserId === userId) {
      return {
        organizationId,
        userId,
        isOwner: true,
        role: "OWNER",
        permissions: [...OWNER_IMPLICIT_PERMISSIONS],
      };
    }

    const membership =
      await this.organizationMemberRepository.findActiveMembership(
        organizationId,
        userId,
        ctx,
      );

    if (!membership) {
      throw new OrganizationMemberPermissionDeniedError("reservation.read", {
        organizationId,
        userId,
      });
    }

    return {
      organizationId,
      userId,
      isOwner: false,
      role: membership.role as OrganizationMemberRole,
      permissions: normalizeOrganizationPermissions(
        membership.role as OrganizationMemberRole,
        membership.permissions,
      ),
    };
  }

  private async assertMembershipAdmin(
    userId: string,
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationPermissionContext> {
    return this.assertOrganizationPermission(
      userId,
      organizationId,
      "organization.member.manage",
      ctx,
    );
  }

  private buildInvitationEmailPayload(input: {
    organizationName: string;
    inviteeEmail: string;
    invitedByUserId: string;
    role: OrganizationMemberRole;
    permissions: OrganizationMemberPermission[];
    token: string;
    origin: string;
  }): EmailPayload {
    const acceptPath = `${appRoutes.account.invitations.accept}?token=${encodeURIComponent(
      input.token,
    )}`;
    const loginPath = appRoutes.login.from(acceptPath);
    const ctaUrl = `${input.origin}${loginPath}`;

    const details = [
      { label: "Organization", value: input.organizationName },
      { label: "Role", value: input.role },
      {
        label: "Permissions",
        value: input.permissions.join(", "),
      },
    ];

    return {
      from: env.CONTACT_US_FROM_EMAIL,
      to: input.inviteeEmail,
      subject: `${input.organizationName}: Team invitation`,
      text: [
        `You've been invited to join ${input.organizationName} on KudosCourts.`,
        "",
        `Role: ${input.role}`,
        `Permissions: ${input.permissions.join(", ")}`,
        "",
        `Accept this invitation by signing in: ${ctaUrl}`,
      ].join("\n"),
      html: renderBrandedEmailHtml({
        preheader: `Invitation to join ${input.organizationName}`,
        headerSubtitle: "Team & Access Invitation",
        title: `You were invited to ${input.organizationName}`,
        greeting: "Hi there,",
        bodyLines: [
          "You were invited to manage reservation operations in KudosCourts.",
          "Sign in with this email, then accept the invitation.",
        ],
        detailRows: details,
        ctaText: "Sign in and accept invitation",
        ctaUrl,
        footerNote:
          "If this was not expected, you can ignore this email and no access will be granted.",
        secondaryText: `Invited by user: ${input.invitedByUserId}`,
      }),
      headers: {
        "Idempotency-Key": `org-invite:${input.organizationName}:${input.inviteeEmail}:${input.token}`,
      },
    };
  }

  async listMembers(
    userId: string,
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberListItem[]> {
    await this.assertMembershipAdmin(userId, organizationId, ctx);
    return this.organizationMemberRepository.listActiveByOrganizationId(
      organizationId,
      ctx,
    );
  }

  async listInvitations(
    userId: string,
    organizationId: string,
    options?: { includeHistory?: boolean },
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationListItem[]> {
    await this.assertMembershipAdmin(userId, organizationId, ctx);
    return this.organizationMemberRepository.listInvitationsByOrganizationId(
      organizationId,
      options?.includeHistory ?? false,
      ctx,
    );
  }

  async inviteMember(
    userId: string,
    input: InviteOrganizationMemberDTO,
    options: { origin: string },
    ctx?: RequestContext,
  ): Promise<{
    invitation: OrganizationInvitationListItem["invitation"];
    emailSent: boolean;
  }> {
    await this.assertMembershipAdmin(userId, input.organizationId, ctx);

    const organization = await this.getOrganizationOrThrow(
      input.organizationId,
      ctx,
    );
    const normalizedEmail = normalizeEmail(input.email);

    const role = input.role as OrganizationMemberRole;
    const permissions = normalizeOrganizationPermissions(
      role,
      input.permissions,
    );

    const existingMembers =
      await this.organizationMemberRepository.listActiveByOrganizationId(
        input.organizationId,
        ctx,
      );
    const existingMember = existingMembers.find(
      (row) => normalizeEmail(row.email ?? "") === normalizedEmail,
    );
    if (existingMember) {
      throw new OrganizationMemberAlreadyExistsError({
        organizationId: input.organizationId,
        email: normalizedEmail,
      });
    }

    const { token, tokenHash } = this.buildInvitationToken();

    const invitation = await this.transactionManager.run(async (tx) => {
      try {
        return await this.organizationMemberRepository.createInvitation(
          {
            organizationId: input.organizationId,
            email: normalizedEmail,
            role,
            permissions,
            tokenHash,
            status: "PENDING",
            expiresAt: addDays(new Date(), INVITATION_TTL_DAYS),
            invitedByUserId: userId,
          },
          { tx },
        );
      } catch (error) {
        const code =
          typeof error === "object" && error && "code" in error
            ? (error as { code?: unknown }).code
            : null;

        if (code === "23505") {
          throw new OrganizationInvitationAlreadyResolvedError({
            organizationId: input.organizationId,
            email: normalizedEmail,
          });
        }

        throw error;
      }
    });

    let emailSent = false;
    try {
      const payload = this.buildInvitationEmailPayload({
        organizationName: organization.name,
        inviteeEmail: normalizedEmail,
        invitedByUserId: userId,
        role,
        permissions,
        token,
        origin: options.origin.replace(/\/$/, ""),
      });
      await this.emailService.sendEmail(payload);
      emailSent = true;
    } catch (error) {
      logger.error(
        {
          event: "organization_member.invitation_email_failed",
          organizationId: input.organizationId,
          invitedByUserId: userId,
          email: normalizedEmail,
          err: error,
        },
        "Failed to send organization invitation email",
      );
    }

    logger.info(
      {
        event: "organization_member.invited",
        organizationId: input.organizationId,
        invitedByUserId: userId,
        email: normalizedEmail,
        role,
        emailSent,
      },
      "Organization member invitation created",
    );

    return { invitation, emailSent };
  }

  async updateMemberPermissions(
    userId: string,
    input: UpdateOrganizationMemberPermissionsDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberListItem["member"]> {
    await this.assertMembershipAdmin(userId, input.organizationId, ctx);

    const organization = await this.getOrganizationOrThrow(
      input.organizationId,
      ctx,
    );
    if (organization.ownerUserId === input.memberUserId) {
      throw new AuthorizationError("Cannot edit canonical owner permissions", {
        organizationId: input.organizationId,
        memberUserId: input.memberUserId,
      });
    }

    const role = input.role as OrganizationMemberRole;
    const permissions = normalizeOrganizationPermissions(
      role,
      input.permissions,
    );

    const updated =
      await this.organizationMemberRepository.updateMembershipRolePermissions(
        input.organizationId,
        input.memberUserId,
        {
          role,
          permissions,
        },
        ctx,
      );

    if (!updated) {
      throw new OrganizationMemberNotFoundError({
        organizationId: input.organizationId,
        memberUserId: input.memberUserId,
      });
    }

    return updated;
  }

  async revokeMember(
    userId: string,
    input: RevokeOrganizationMemberDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberListItem["member"]> {
    await this.assertMembershipAdmin(userId, input.organizationId, ctx);

    const organization = await this.getOrganizationOrThrow(
      input.organizationId,
      ctx,
    );
    if (organization.ownerUserId === input.memberUserId) {
      throw new AuthorizationError("Cannot revoke canonical owner", {
        organizationId: input.organizationId,
        memberUserId: input.memberUserId,
      });
    }

    const revoked = await this.organizationMemberRepository.setMembershipStatus(
      input.organizationId,
      input.memberUserId,
      "REVOKED",
      ctx,
    );

    if (!revoked) {
      throw new OrganizationMemberNotFoundError({
        organizationId: input.organizationId,
        memberUserId: input.memberUserId,
      });
    }

    return revoked;
  }

  async cancelInvitation(
    userId: string,
    input: CancelOrganizationInvitationDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationListItem["invitation"]> {
    await this.assertMembershipAdmin(userId, input.organizationId, ctx);

    const invitation =
      await this.organizationMemberRepository.findPendingInvitationById(
        input.organizationId,
        input.invitationId,
        ctx,
      );

    if (!invitation) {
      throw new OrganizationInvitationNotFoundError({
        organizationId: input.organizationId,
        invitationId: input.invitationId,
      });
    }

    const canceled =
      await this.organizationMemberRepository.updateInvitationStatus(
        input.invitationId,
        "CANCELED",
        undefined,
        ctx,
      );

    if (!canceled) {
      throw new OrganizationInvitationNotFoundError({
        organizationId: input.organizationId,
        invitationId: input.invitationId,
      });
    }

    return canceled;
  }

  async acceptInvitation(
    userId: string,
    userEmail: string,
    input: ResolveOrganizationInvitationDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationMemberListItem["member"]> {
    const tokenHash = this.buildTokenHash(input.token);
    const normalizedEmail = normalizeEmail(userEmail);

    return this.transactionManager.run(async (tx) => {
      const txCtx: RequestContext = { tx, requestId: ctx?.requestId };
      const invitation =
        await this.organizationMemberRepository.findPendingInvitationByTokenHash(
          tokenHash,
          txCtx,
        );

      if (!invitation) {
        throw new OrganizationInvitationNotFoundError();
      }

      if (invitation.status !== "PENDING") {
        throw new OrganizationInvitationAlreadyResolvedError({
          invitationId: invitation.id,
          status: invitation.status,
        });
      }

      if (new Date(invitation.expiresAt).getTime() < Date.now()) {
        await this.organizationMemberRepository.updateInvitationStatus(
          invitation.id,
          "EXPIRED",
          undefined,
          txCtx,
        );
        throw new OrganizationInvitationExpiredError({
          invitationId: invitation.id,
        });
      }

      if (normalizeEmail(invitation.email) !== normalizedEmail) {
        throw new OrganizationInvitationEmailMismatchError({
          invitationId: invitation.id,
        });
      }

      const membership =
        await this.organizationMemberRepository.upsertActiveMembership(
          {
            organizationId: invitation.organizationId,
            userId,
            role: invitation.role,
            permissions: normalizeOrganizationPermissions(
              invitation.role as OrganizationMemberRole,
              invitation.permissions,
            ),
            status: "ACTIVE",
            invitedByUserId: invitation.invitedByUserId,
            joinedAt: new Date(),
          },
          txCtx,
        );

      await this.organizationMemberRepository.updateInvitationStatus(
        invitation.id,
        "ACCEPTED",
        {
          acceptedByUserId: userId,
          acceptedAt: new Date(),
        },
        txCtx,
      );

      logger.info(
        {
          event: "organization_member.invitation_accepted",
          invitationId: invitation.id,
          organizationId: invitation.organizationId,
          userId,
        },
        "Organization invitation accepted",
      );

      return membership;
    });
  }

  async declineInvitation(
    userId: string,
    userEmail: string,
    input: ResolveOrganizationInvitationDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationInvitationListItem["invitation"]> {
    const tokenHash = this.buildTokenHash(input.token);
    const normalizedEmail = normalizeEmail(userEmail);

    return this.transactionManager.run(async (tx) => {
      const txCtx: RequestContext = { tx, requestId: ctx?.requestId };
      const invitation =
        await this.organizationMemberRepository.findPendingInvitationByTokenHash(
          tokenHash,
          txCtx,
        );

      if (!invitation) {
        throw new OrganizationInvitationNotFoundError();
      }

      if (invitation.status !== "PENDING") {
        throw new OrganizationInvitationAlreadyResolvedError({
          invitationId: invitation.id,
          status: invitation.status,
        });
      }

      if (new Date(invitation.expiresAt).getTime() < Date.now()) {
        await this.organizationMemberRepository.updateInvitationStatus(
          invitation.id,
          "EXPIRED",
          undefined,
          txCtx,
        );
        throw new OrganizationInvitationExpiredError({
          invitationId: invitation.id,
        });
      }

      if (normalizeEmail(invitation.email) !== normalizedEmail) {
        throw new OrganizationInvitationEmailMismatchError({
          invitationId: invitation.id,
        });
      }

      const declined =
        await this.organizationMemberRepository.updateInvitationStatus(
          invitation.id,
          "DECLINED",
          undefined,
          txCtx,
        );

      if (!declined) {
        throw new OrganizationInvitationNotFoundError();
      }

      logger.info(
        {
          event: "organization_member.invitation_declined",
          invitationId: invitation.id,
          organizationId: invitation.organizationId,
          userId,
        },
        "Organization invitation declined",
      );

      return declined;
    });
  }

  async getMyPermissions(
    userId: string,
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationPermissionContext> {
    return this.getPermissionContext(userId, organizationId, ctx);
  }

  async getMyReservationNotificationPreference(
    userId: string,
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationNotificationPreference> {
    const canReceive = await this.hasOrganizationPermission(
      userId,
      organizationId,
      "reservation.notification.receive",
      ctx,
    );
    const preference =
      await this.organizationMemberRepository.findReservationNotificationPreference(
        organizationId,
        userId,
        ctx,
      );

    return {
      organizationId,
      userId,
      enabled: preference?.reservationOpsEnabled ?? false,
      canReceive,
    };
  }

  async setMyReservationNotificationPreference(
    userId: string,
    input: SetMyReservationNotificationPreferenceDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationNotificationPreference> {
    await this.assertOrganizationPermission(
      userId,
      input.organizationId,
      "reservation.notification.receive",
      ctx,
    );

    const preference =
      await this.organizationMemberRepository.upsertReservationNotificationPreference(
        {
          organizationId: input.organizationId,
          userId,
          reservationOpsEnabled: input.enabled,
        },
        ctx,
      );

    return {
      organizationId: preference.organizationId,
      userId: preference.userId,
      enabled: preference.reservationOpsEnabled,
      canReceive: true,
    };
  }

  async getReservationNotificationRoutingStatus(
    userId: string,
    input: GetReservationNotificationRoutingStatusDTO,
    ctx?: RequestContext,
  ): Promise<OrganizationReservationNotificationRoutingStatus> {
    await this.assertOrganizationPermission(
      userId,
      input.organizationId,
      "reservation.read",
      ctx,
    );

    const enabledUserIds =
      await this.listOrganizationUserIdsForReservationNotifications(
        input.organizationId,
        ctx,
      );

    return deriveReservationNotificationRoutingStatus(
      input.organizationId,
      enabledUserIds,
    );
  }

  async hasOrganizationPermission(
    userId: string,
    organizationId: string,
    permission: OrganizationMemberPermission,
    ctx?: RequestContext,
  ): Promise<boolean> {
    try {
      const context = await this.getPermissionContext(
        userId,
        organizationId,
        ctx,
      );
      return context.permissions.includes(permission);
    } catch (error) {
      if (
        error instanceof OrganizationMemberPermissionDeniedError ||
        error instanceof OrganizationNotFoundError
      ) {
        return false;
      }
      throw error;
    }
  }

  async assertOrganizationPermission(
    userId: string,
    organizationId: string,
    permission: OrganizationMemberPermission,
    ctx?: RequestContext,
  ): Promise<OrganizationPermissionContext> {
    const context = await this.getPermissionContext(
      userId,
      organizationId,
      ctx,
    );

    if (!context.permissions.includes(permission)) {
      throw new OrganizationMemberPermissionDeniedError(permission, {
        organizationId,
        userId,
      });
    }

    return context;
  }

  async listOrganizationUserIdsWithPermission(
    organizationId: string,
    permission: OrganizationMemberPermission,
    ctx?: RequestContext,
  ): Promise<string[]> {
    const organization = await this.getOrganizationOrThrow(organizationId, ctx);
    const memberIds =
      await this.organizationMemberRepository.listActiveUserIdsByOrganizationPermission(
        organizationId,
        permission,
        ctx,
      );

    return Array.from(new Set([organization.ownerUserId, ...memberIds]));
  }

  async listOrganizationUserIdsForReservationNotifications(
    organizationId: string,
    ctx?: RequestContext,
  ): Promise<string[]> {
    const eligibleUserIds = await this.listOrganizationUserIdsWithPermission(
      organizationId,
      "reservation.notification.receive",
      ctx,
    );

    if (eligibleUserIds.length === 0) {
      return [];
    }

    const optedInUserIds =
      await this.organizationMemberRepository.listReservationNotificationEnabledUserIds(
        organizationId,
        eligibleUserIds,
        ctx,
      );

    return deriveEnabledReservationNotificationUserIds({
      eligibleUserIds,
      optedInUserIds,
    });
  }
}
