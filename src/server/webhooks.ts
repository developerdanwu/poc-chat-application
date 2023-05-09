export const CLERK_WEBHOOK_EVENTS = {
  organizationCreated: "organization.created",
  organizationDeleted: "organization.deleted",
  organizationUpdated: "organization.updated",
  organizationInvitationAccepted: "organizationInvitation.accepted",
  organizationInvitationCreated: "organizationInvitation.created",
  organizationInvitationRevoked: "organizationInvitation.revoked",
  organizationMembershipCreated: "organizationMembership.created",
  organizationMembershipDeleted: "organizationMembership.deleted",
  organizationMembershipUpdated: "organizationMembership.updated",
  sessionCreated: "session.created",
  sessionEnded: "session.ended",
  sessionRemoved: "session.removed",
  sessionRevoked: "session.revoked",
  userCreated: "user.created",
  userDeleted: "user.deleted",
  userUpdated: "user.updated",
} as const;

export type ClerkWebhookEvent =
  (typeof CLERK_WEBHOOK_EVENTS)[keyof typeof CLERK_WEBHOOK_EVENTS];
