"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  OwnUserResponse,
  TokenOrProvider,
  UserResponse,
} from "stream-chat";
import { StreamChat } from "stream-chat";

export interface UseStreamClientInput {
  apiKey: string | null;
  user: {
    id: string;
    name?: string;
    image?: string;
  } | null;
  tokenOrProvider: TokenOrProvider | null;
}

export function useStreamClient({
  apiKey,
  user,
  tokenOrProvider,
}: UseStreamClientInput) {
  const client = useMemo(
    () => (apiKey ? StreamChat.getInstance(apiKey) : null),
    [apiKey],
  );
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!client || !user || !tokenOrProvider) {
      setIsReady(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsReady(false);
    setError(null);

    client
      .connectUser(
        user as unknown as OwnUserResponse | UserResponse,
        tokenOrProvider,
      )
      .then(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err);
        }
      });

    return () => {
      cancelled = true;
      setIsReady(false);
      client.disconnectUser().catch(() => undefined);
    };
  }, [client, user, tokenOrProvider]);

  return { client, isReady, error };
}
