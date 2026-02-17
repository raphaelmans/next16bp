import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class OpenPlayChatNotAvailableError extends AuthorizationError {
  readonly code = "OPEN_PLAY_CHAT_NOT_AVAILABLE";

  constructor(reason: string) {
    super("Open Play chat is not available", { reason });
  }
}

export class OpenPlayChatNotParticipantError extends AuthorizationError {
  readonly code = "OPEN_PLAY_CHAT_NOT_PARTICIPANT";

  constructor(openPlayId: string) {
    super("You are not a confirmed participant in this Open Play", {
      openPlayId,
    });
  }
}

export class OpenPlayChatThreadNotFoundError extends NotFoundError {
  readonly code = "OPEN_PLAY_CHAT_THREAD_NOT_FOUND";

  constructor(openPlayId: string) {
    super("Open Play chat thread not found", { openPlayId });
  }
}

export class OpenPlayChatMessageNotAllowedError extends BusinessRuleError {
  readonly code = "OPEN_PLAY_CHAT_MESSAGE_NOT_ALLOWED";

  constructor() {
    super("You cannot send messages to this Open Play chat.");
  }
}
