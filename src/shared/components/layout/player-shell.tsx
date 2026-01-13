"use client";

import { useRouter } from "next/navigation";
import { useLogout, useSession } from "@/features/auth";
import { trpc } from "@/trpc/client";
import { AppShell } from "./app-shell";
import { PlayerNavbar } from "./player-navbar";
import { PlayerSidebar } from "./player-sidebar";

interface PlayerShellProps {
  children: React.ReactNode;
}

export function PlayerShell({ children }: PlayerShellProps) {
  const router = useRouter();
  const { data: sessionUser } = useSession();
  const logoutMutation = useLogout();

  const { data: orgs } = trpc.organization.my.useQuery(undefined, {
    enabled: !!sessionUser,
  });

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
    router.push("/");
  };

  return (
    <AppShell
      sidebar={
        <PlayerSidebar user={user} isOwner={isOwner} isAdmin={isAdmin} />
      }
      navbar={
        <PlayerNavbar
          user={user}
          isOwner={isOwner}
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
      }
    >
      {children}
    </AppShell>
  );
}
