"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Terminal,
  RefreshCw,
} from "lucide-react";

export default function DashboardErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("EXCELIS PRÉPAS — Erreur dans l'espace connecté :", error);
  }, [error]);

  const handleCopy = async () => {
    const report = [
      `Date : ${new Date().toISOString()}`,
      `Message : ${error.message || "Erreur non spécifiée"}`,
      error.digest ? `Digest : ${error.digest}` : null,
      error.stack ? `Stack trace :\n${error.stack}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Échec de copie :", err);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl text-center">
        {/* Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm sm:p-10">
          {/* Emblem */}
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 shadow-sm">
            <AlertTriangle className="h-8 w-8" strokeWidth={1.8} />
          </div>

          {/* Badge */}
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-0.5 text-xs font-bold text-rose-700">
            <span>Interruption de service</span>
            {error.digest && (
              <span className="font-mono text-[10px] text-rose-500">
                #{error.digest.slice(0, 8)}
              </span>
            )}
          </div>

          {/* Title & Desc */}
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Impossible de charger cette vue
          </h2>
          <p className="mt-2 text-xs text-slate-600 sm:text-sm">
            Un incident inattendu est survenu lors du chargement des données. Vous pouvez
            réessayer l&apos;opération ou revenir à la page d&apos;accueil.
          </p>

          {/* Actions */}
          <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => reset()}
              className="bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-98 sm:w-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Réessayer</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 sm:w-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Actualiser</span>
            </button>

            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 sm:w-auto"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Tableau de bord</span>
            </Link>
          </div>

          {/* Collapsible Details */}
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100/60"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-slate-400" />
                <span>Détails techniques de l&apos;erreur</span>
              </div>
              {showDetails ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>

            {showDetails && (
              <div className="border-t border-slate-200/80 bg-white p-4 text-xs">
                <p className="font-mono text-[11px] text-rose-700 break-words">
                  {error.message || "Erreur non documentée"}
                </p>
                {error.digest && (
                  <p className="mt-2 font-mono text-[10px] text-slate-400">
                    ID Digest : {error.digest}
                  </p>
                )}
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-400" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footnote */}
        <p className="mt-4 text-[11px] text-slate-400">
          Si l&apos;anomalie se répète, veuillez signaler cet incident à votre administrateur EXCELIS.
        </p>
      </div>
    </div>
  );
}

