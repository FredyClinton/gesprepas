"use client";

import {
    UserRound,
    AlertTriangle,
    ClipboardList,
    Download,
} from "lucide-react";

import { Button, Card } from "@/shared/ui";
import { useEnseignants } from "@/modules/personnel";

const PLACEHOLDER = "—";

export function DirecteurAcademiqueDashboard() {
    const { data: enseignants, isLoading: chargementEnseignants } =
        useEnseignants();

    const enseignantsActifs = enseignants?.filter(
        (e) => e.statut === "ACTIF",
    ).length;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* En-tête de page */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-brand-anthracite text-3xl font-bold">
                        Vue d&rsquo;ensemble Pédagogique
                    </h1>
                    <p className="text-brand-gray mt-1 text-sm">
                        Aperçu de l&rsquo;activité pédagogique du réseau
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Export — visuel uniquement, comme sur l'écran Directeur */}
                    <Button variant="secondary">
                        <Download size={16} />
                        Exporter Rapport
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                            Enseignants actifs
                        </span>
                        <div className="bg-brand-orange/10 text-brand-orange rounded p-1.5">
                            <UserRound size={16} />
                        </div>
                    </div>
                    <div className="text-brand-anthracite text-3xl font-bold">
                        {chargementEnseignants ? "…" : (enseignantsActifs ?? PLACEHOLDER)}
                    </div>
                </Card>

                <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                            Créneaux non assignés
                        </span>
                        <div className="rounded bg-red-50 p-1.5 text-red-600">
                            <AlertTriangle size={16} />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{PLACEHOLDER}</div>
                    <p className="text-brand-gray/70 text-xs">
                        Endpoint agrégé à construire
                    </p>
                </Card>

                <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                            Nombre de cours
                        </span>
                        <div className="bg-brand-orange/10 text-brand-orange rounded p-1.5">
                            <ClipboardList size={16} />
                        </div>
                    </div>
                    <div className="text-brand-anthracite text-3xl font-bold">
                        {PLACEHOLDER}
                    </div>
                    <p className="text-brand-gray/70 text-xs">
                        Aucune date sur les séances enregistrées — pas de filtre
                        &laquo;&nbsp;ce mois&nbsp;&raquo; possible aujourd&rsquo;hui
                    </p>
                </Card>
            </div>

            {/* Progression pédagogique */}
            <Card className="p-4">
                <h2 className="text-brand-anthracite mb-4 text-base font-bold">
                    Progression Pédagogique par Formation
                </h2>
                <div className="border-brand-gray/20 bg-brand-gray/5 rounded-md border border-dashed p-6 text-center">
                    <p className="text-brand-gray text-sm">
                        Pas encore calculable : le suivi de progression enregistre les
                        séances données (thème, contenu, exercices) mais pas de total de
                        séances prévues par matière — impossible d&rsquo;en tirer un
                        pourcentage honnête pour l&rsquo;instant.
                    </p>
                </div>
            </Card>
        </div>
    );
}