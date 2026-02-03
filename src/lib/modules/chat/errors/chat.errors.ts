import { BusinessRuleError, InternalError } from "@/lib/shared/kernel/errors";

export class ChatProviderNotConfiguredError extends InternalError {
  readonly code = "CHAT_PROVIDER_NOT_CONFIGURED";

  constructor(message = "Chat provider is not configured") {
    super(message);
  }
}

export class ChatProviderNotSupportedError extends InternalError {
  readonly code = "CHAT_PROVIDER_NOT_SUPPORTED";

  constructor(providerId: string) {
    super("Chat provider is not supported", { providerId });
  }
}

export class ChatInvalidMembersError extends BusinessRuleError {
  readonly code = "CHAT_INVALID_MEMBERS";

  constructor(memberIds: string[]) {
    super("Chat members must be distinct users", { memberIds });
  }
}
