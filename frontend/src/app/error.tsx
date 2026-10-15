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
  LifeBuoy,
} from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log error to console for monitoring
    console.error("EXCELIS PRÉPAS — Erreur interceptée :", error);
  }, [error]);

  const handleCopyDetails = async () => {
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 font-sans text-slate-900">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl text-center">
        {/* Error Emblem */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-100 shadow-lg shadow-rose-500/10">
          <div className="absolute inset-0 animate-ping rounded-3xl bg-rose-400/20 opacity-30" />
          <AlertTriangle className="h-10 w-10 text-rose-600" strokeWidth={1.8} />
        </div>

        {/* Badge */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-100/70 px-3 py-1 text-xs font-bold text-rose-800">
          <span>Incident Technique</span>
          {error.digest && (
            <span className="font-mono text-[10px] text-rose-600">
              #{error.digest.slice(0, 8)}
            </span>
          )}
        </div>

        {/* Headings */}
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Une anomalie est survenue
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 sm:text-base">
          L&apos;application a rencontré une interruption inattendue lors du traitement de votre action.
          Vos données déjà enregistrées restent sécurisées.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition active:scale-98 sm:w-auto"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Réessayer</span>
          </button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser la page</span>
          </button>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            <span>Accueil</span>
          </Link>
        </div>

        {/* Collapsible Technical Details Box */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 text-left shadow-xs">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-400" />
              <span>Détails techniques pour le support</span>
            </div>
            {showDetails ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {showDetails && (
            <div className="border-t border-slate-100 bg-slate-50/70 p-5 text-xs">
              <div className="space-y-3">
                {error.digest && (
                  <div>
                    <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                      Identifiant unique (Digest) :
                    </span>
                    <p className="mt-0.5 font-mono text-xs font-bold text-slate-800">
                      {error.digest}
                    </p>
                  </div>
                )}

                <div>
                  <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                    Message d&apos;erreur :
                  </span>
                  <p className="mt-1 rounded-lg border border-rose-200 bg-rose-50/60 p-3 font-mono text-[11px] text-rose-800 break-words">
                    {error.message || "Aucun message spécifique fourni"}
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopyDetails}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Rapport copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Copier le rapport</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Support note */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <LifeBuoy className="h-4 w-4 text-slate-400" />
          <span>
            Besoin d&apos;aide ? Rapprochez-vous de l&apos;équipe informatique d&apos;EXCELIS PRÉPAS.
          </span>
        </div>
      </div>
    </div>
  );
}

