import { env } from "@/lib/env";
import { ChatProviderNotSupportedError } from "../errors/chat.errors";
import type { IChatProvider } from "../providers/chat.provider";
import { StreamChatProvider } from "../providers/stream-chat.provider";
import { ChatService } from "../services/chat.service";

let chatProvider: IChatProvider | null = null;
let chatService: ChatService | null = null;

export function makeChatProvider(): IChatProvider {
  if (!chatProvider) {
    const providerId = env.CHAT_PROVIDER ?? "stream";

    if (providerId === "stream") {
      chatProvider = new StreamChatProvider(
        env.STREAM_CHAT_API_KEY,
        env.STREAM_CHAT_API_SECRET,
      );
    } else {
      throw new ChatProviderNotSupportedError(providerId);
    }
  }

  return chatProvider;
}

export function makeChatService(): ChatService {
  if (!chatService) {
    chatService = new ChatService(makeChatProvider());
  }

  return chatService;
}
