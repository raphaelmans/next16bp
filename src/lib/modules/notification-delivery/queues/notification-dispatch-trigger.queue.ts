export type NotificationDispatchKickReason =
  | "jobs_enqueued"
  | "backlog_drain"
  | "manual";

export type NotificationDispatchKickPayload = {
  reason: NotificationDispatchKickReason;
  triggeredAtIso: string;
  jobCount?: number;
};

export interface INotificationDispatchTriggerQueue {
  publishDispatchKick(payload: NotificationDispatchKickPayload): Promise<void>;
}
