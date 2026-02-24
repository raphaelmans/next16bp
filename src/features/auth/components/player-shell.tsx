"use client";

import { useRouter } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { PlayerShell as SharedPlayerShell } from "@/components/layout/player-shell";
import { PlayerSidebar } from "@/components/layout/player-sidebar";
import {
  useMutAuthLogout,
  useQueryAuthMyOrganizations,
  useQueryAuthSession,
} from "@/features/auth/hooks";
import { UnifiedChatInterface } from "@/features/chat/components/unified-chat/unified-chat-interface";
import { AuthPlayerNavbar } from "./player-navbar";
import { PortalSwitcher } from "./portal-switcher";

interface AuthPlayerShellProps {
  children: React.ReactNode;
}

export function AuthPlayerShell({ children }: AuthPlayerShellProps) {
  const router = useRouter();
  const { data: sessionUser } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();

  const { data: orgs } = useQueryAuthMyOrganizations(!!sessionUser);

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

  const isOwner = (orgs?.length ?? 0) > 0;
  const isAdmin = sessionUser?.role === "admin";

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push(appRoutes.index.base);
  };

  return (
    <SharedPlayerShell
      sidebar={
        <PlayerSidebar
          user={user}
          isAdmin={isAdmin}
          portalSwitcher={
            <PortalSwitcher
              variant="sidebar"
              isOwner={isOwner || undefined}
              isAdmin={isAdmin}
            />
          }
        />
      }
      navbar={
        <AuthPlayerNavbar
          user={user}
          isOwner={isOwner}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
      }
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
