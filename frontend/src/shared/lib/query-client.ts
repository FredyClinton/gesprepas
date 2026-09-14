import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { ApiError } from "./api-client";

// Filet de sécurité : un 401 renvoyé par le backend malgré un access token présent
// signifie que la session n'est plus valable côté serveur (le rafraîchissement
// automatique - voir src/auth.ts - a déjà échoué à ce stade). On force une
// reconnexion plutôt que de laisser chaque écran gérer ce cas séparément.
function surErreur(erreur: unknown) {
  if (erreur instanceof ApiError && erreur.status === 401) {
    signOut({ callbackUrl: "/login" });
  }
}

// Configuration par défaut du QueryClient TanStack Query, partagée par toute
// l'application. Les modules n'ont pas à recréer leur propre client.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
    queryCache: new QueryCache({ onError: surErreur }),
    mutationCache: new MutationCache({ onError: surErreur }),
  });
}
