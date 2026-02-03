import { notFound } from "next/navigation";
import { ChatPocClient } from "@/features/chat/components/ChatPocClient";
import { env } from "@/lib/env";

export default function ChatPocPage() {
  if (process.env.NODE_ENV === "production" && env.CHAT_POC_ENABLED !== true) {
    notFound();
  }

  return <ChatPocClient />;
}
