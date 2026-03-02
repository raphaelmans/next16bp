"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { appRoutes } from "@/common/app-routes";
import { PlayerBottomTabs } from "@/components/layout/player-bottom-tabs";
import { PlayerShell as SharedPlayerShell } from "@/components/layout/player-shell";
import { PlayerSidebar } from "@/components/layout/player-sidebar";
import {
  PORTAL_STORAGE_KEY,
  useMutAuthLogout,
  useQueryAuthSession,
  useQueryAuthUserPreference,
} from "@/features/auth/hooks";
import { UnifiedChatInterface } from "@/features/chat/components/unified-chat/unified-chat-interface";
import { AuthPlayerNavbar } from "./player-navbar";

interface AuthPlayerShellProps {
  children: React.ReactNode;
}

export function AuthPlayerShell({ children }: AuthPlayerShellProps) {
  const router = useRouter();
  const { data: sessionUser } = useQueryAuthSession();
  const { data: userPreference } = useQueryAuthUserPreference(!!sessionUser);

  // Immediate seed while DB preference loads (fallback for first visit)
  useEffect(() => {
    try {
      const current = localStorage.getItem(PORTAL_STORAGE_KEY);
      if (current === "owner") {
        localStorage.setItem(PORTAL_STORAGE_KEY, "organization");
      } else if (!current) {
        localStorage.setItem(PORTAL_STORAGE_KEY, "player");
      }
    } catch {}
    // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API lacks Safari/Firefox support
    document.cookie =
      "kudos.portal-context=player; path=/; max-age=31536000; samesite=lax";
  }, []);

  // Sync from DB preference (authoritative — overrides stale localStorage)
  useEffect(() => {
    if (userPreference?.defaultPortal) {
      try {
        localStorage.setItem(PORTAL_STORAGE_KEY, userPreference.defaultPortal);
      } catch {}
    }
  }, [userPreference?.defaultPortal]);
  const logoutMutation = useMutAuthLogout();

  const user = sessionUser
    ? {
        name: sessionUser.email?.split("@")[0] || "Player",
        email: sessionUser.email || "",
        avatarUrl: null,
      }
    : {
        name: "Player",
        email: "",
        avatarUrl: null,
      };

  const isAdmin = sessionUser?.role === "admin";

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push(appRoutes.index.base);
  };

  return (
    <SharedPlayerShell
      sidebar={<PlayerSidebar user={user} isAdmin={isAdmin} />}
      navbar={
        <AuthPlayerNavbar
          user={user}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
      }
      bottomNav={<PlayerBottomTabs />}
      floatingPanel={
        <UnifiedChatInterface
          surface="floating"
          domain="reservation"
          reservationConfig={{
            kind: "player",
            storageKeys: {
              open: "player:chat:open",
              activeReservationThreadId:
                "player:chat:activeReservationThreadId",
            },
            ui: {
              sheetTitle: "Messages",
              sheetDescription: "Reservation conversations",
            },
            labels: {
              listPrimary: (meta) => (meta ? meta.placeName : null),
              listSecondary: () => null,
              threadTitle: (meta) => meta?.placeName ?? "Messages",
            },
          }}
        />
      }
    >
      {children}
    </SharedPlayerShell>
  );
}
