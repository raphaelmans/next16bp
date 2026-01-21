import { trpc } from "@/trpc/client";

export function useSubmitContactMessage() {
  return trpc.contact.submit.useMutation();
}
