"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestLogout } from "@/lib/logout-client";

interface SessionUser {
  id: number;
  workspaceId: number | null;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  sidebarAccess: string[];
}

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (!response.ok) {
      setUser(null);
      router.replace("/");
      return;
    }
    const result: { user: SessionUser } = await response.json();
    setUser(result.user);
  };

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          if (active) {
            setUser(null);
            router.replace("/");
          }
          return;
        }
        const result: { user: SessionUser } = await response.json();
        if (active) {
          setUser(result.user);
        }
      })
      .catch(() => {
        if (active) router.replace("/");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const logout = async () => {
    await requestLogout();
    setUser(null);
    router.replace("/");
  };

  if (loading || !user) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Checking your session...</span>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within SessionProvider");
  return context;
}
