import { QueryClient } from "@tanstack/react-query";

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
  });
}
