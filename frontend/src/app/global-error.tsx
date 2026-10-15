"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("EXCELIS PRÉPAS — Erreur racine fatale :", error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4 font-sans text-slate-900">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="text-xl font-black text-slate-900">
            Erreur critique du système
          </h1>
          <p className="mt-2 text-xs text-slate-600">
            Une erreur critique est survenue dans l&apos;application EXCELIS PRÉPAS.
            Veuillez recharger la page ou réessayer.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-orange-500"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Réessayer</span>
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              <span>Recharger l&apos;accueil</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

