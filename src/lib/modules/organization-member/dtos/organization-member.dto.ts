import { z } from "zod";
import { S } from "@/common/schemas";
import {
  ORGANIZATION_MEMBER_PERMISSIONS,
  ORGANIZATION_MEMBER_ROLES,
} from "../shared/permissions";

const PermissionSchema = z.enum(ORGANIZATION_MEMBER_PERMISSIONS);
const RoleSchema = z.enum(ORGANIZATION_MEMBER_ROLES);

export const ListOrganizationMembersSchema = z.object({
  organizationId: S.ids.organizationId,
});

export const ListOrganizationInvitationsSchema = z.object({
  organizationId: S.ids.organizationId,
  includeHistory: z.boolean().optional().default(false),
});

export const GetMyOrganizationPermissionsSchema = z.object({
  organizationId: S.ids.organizationId,
});

export const GetMyReservationNotificationPreferenceSchema = z.object({
  organizationId: S.ids.organizationId,
});

export const SetMyReservationNotificationPreferenceSchema = z.object({
  organizationId: S.ids.organizationId,
  enabled: z.boolean(),
});

export const GetReservationNotificationRoutingStatusSchema = z.object({
  organizationId: S.ids.organizationId,
});

export const InviteOrganizationMemberSchema = z.object({
  organizationId: S.ids.organizationId,
  email: S.auth.email,
  role: RoleSchema,
  permissions: z.array(PermissionSchema).min(1).optional(),
});

export const UpdateOrganizationMemberPermissionsSchema = z.object({
  organizationId: S.ids.organizationId,
  memberUserId: S.ids.generic,
  role: RoleSchema,
  permissions: z.array(PermissionSchema).min(1),
});

export const RevokeOrganizationMemberSchema = z.object({
  organizationId: S.ids.organizationId,
  memberUserId: S.ids.generic,
});

export const CancelOrganizationInvitationSchema = z.object({
  organizationId: S.ids.organizationId,
  invitationId: S.ids.generic,
});

export const ResolveOrganizationInvitationSchema = z.object({
  token: z
    .string()
    .trim()
    .min(16, { error: "Invitation token is required" })
    .max(512),
});

export type InviteOrganizationMemberDTO = z.infer<
  typeof InviteOrganizationMemberSchema
>;
export type ListOrganizationMembersDTO = z.infer<
  typeof ListOrganizationMembersSchema
>;
export type ListOrganizationInvitationsDTO = z.infer<
  typeof ListOrganizationInvitationsSchema
>;
export type GetMyOrganizationPermissionsDTO = z.infer<
  typeof GetMyOrganizationPermissionsSchema
>;
export type GetMyReservationNotificationPreferenceDTO = z.infer<
  typeof GetMyReservationNotificationPreferenceSchema
>;
export type SetMyReservationNotificationPreferenceDTO = z.infer<
  typeof SetMyReservationNotificationPreferenceSchema
>;
export type GetReservationNotificationRoutingStatusDTO = z.infer<
  typeof GetReservationNotificationRoutingStatusSchema
>;
export type UpdateOrganizationMemberPermissionsDTO = z.infer<
  typeof UpdateOrganizationMemberPermissionsSchema
>;
export type RevokeOrganizationMemberDTO = z.infer<
  typeof RevokeOrganizationMemberSchema
>;
export type CancelOrganizationInvitationDTO = z.infer<
  typeof CancelOrganizationInvitationSchema
>;
export type ResolveOrganizationInvitationDTO = z.infer<
  typeof ResolveOrganizationInvitationSchema
>;
