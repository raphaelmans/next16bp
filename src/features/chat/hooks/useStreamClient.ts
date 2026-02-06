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

  const userId = user?.id ?? null;
  const userName = user?.name;
  const userImage = user?.image;

  useEffect(() => {
    if (!client || !userId || !tokenOrProvider) {
      setIsReady(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsReady(false);
    setError(null);

    const userPayload = {
      id: userId,
      ...(userName ? { name: userName } : {}),
      ...(userImage ? { image: userImage } : {}),
    };

    const connectAsync = async () => {
      try {
        const currentUserId = (client as unknown as { userID?: unknown })
          .userID;

        if (currentUserId === userId) {
          if (!cancelled) {
            setIsReady(true);
          }
          return;
        }

        if (
          typeof currentUserId === "string" &&
          currentUserId.length > 0 &&
          currentUserId !== userId
        ) {
          await client.disconnectUser();
        }

        await client.connectUser(
          userPayload as unknown as OwnUserResponse | UserResponse,
          tokenOrProvider,
        );

        if (!cancelled) {
          setIsReady(true);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err);
        }
      }
    };

    void connectAsync();

    return () => {
      cancelled = true;
      setIsReady(false);
    };
  }, [client, tokenOrProvider, userId, userImage, userName]);

  return { client, isReady, error };
}
