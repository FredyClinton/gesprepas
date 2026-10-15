"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 font-sans text-slate-900">
      {/* Background ambient gradient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl text-center">
        {/* Top Tag & Visual */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-100 shadow-lg shadow-orange-500/10">
          <FileQuestion className="h-10 w-10 text-brand-orange" strokeWidth={1.75} />
        </div>

        {/* 404 Large Number */}
        <div className="mb-2">
          <span className="font-mono text-7xl font-black tracking-tighter text-slate-900 sm:text-8xl">
            4<span className="text-brand-orange">0</span>4
          </span>
        </div>

        {/* Headings */}
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Page introuvable
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600 sm:text-base">
          La ressource demandée n&apos;existe pas, a été déplacée ou son adresse URL est incorrecte.
        </p>

        {/* Main Action Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Page précédente</span>
          </button>

          <Link
            href="/"
            className="bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition active:scale-98 sm:w-auto"
          >
            <Home className="h-4 w-4" />
            <span>Tableau de bord</span>
          </Link>
        </div>

        {/* Footer brand signature */}
        <p className="mt-12 text-xs text-slate-400">
          EXCELIS PRÉPAS &bull; ERP Gesprepas &bull; Plateforme de gestion académique
        </p>
      </div>
    </div>
  );
}
