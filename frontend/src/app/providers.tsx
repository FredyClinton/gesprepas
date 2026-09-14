"use client";
import { makeQueryClient } from "@/shared/lib/query-client";
import { setAccessToken } from "@/shared/lib/auth-token";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// Doit rester nettement en dessous des 20 min de durée de vie de l'access token
// (voir src/auth.ts) pour que NextAuth ait l'occasion de le rafraîchir avant qu'il
// n'expire réellement.
const INTERVALLE_REFETCH_SESSION_SECONDES = 5 * 60;

// Tient à jour le cache en mémoire lu par apiFetch (shared/lib/auth-token.ts) et
// force une déconnexion si le rafraîchissement automatique du token a échoué côté
// serveur (callback jwt() de src/auth.ts).
function AuthTokenSync() {
  const { data: session } = useSession();

  useEffect(() => {
    setAccessToken(session?.accessToken);
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      setAccessToken(undefined);
      signOut({ callbackUrl: "/login" });
    }
  }, [session?.error]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  return (
    <SessionProvider refetchInterval={INTERVALLE_REFETCH_SESSION_SECONDES}>
      <AuthTokenSync />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
