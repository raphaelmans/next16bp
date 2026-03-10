import { getServerSession } from "@/lib/shared/infra/auth/server-session";
import { AuthenticationError } from "@/lib/shared/kernel/errors";

export async function requireApiSession() {
  const session = await getServerSession();

  if (!session) {
    throw new AuthenticationError("Authentication required");
  }

  return session;
}
