"use client";

import {
    Users,
    Wallet,
    AlertTriangle,
    ClipboardCheck,
    BookOpen,
    FileCheck,
} from "lucide-react";

import { Card } from "@/shared/ui";
import { useApprenants } from "@/modules/apprenants";
import { useFormations } from "@/modules/academique";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useBilanDuJour, useRepartitionFormations } from "@/modules/finances";

const PLACEHOLDER = "—";

const STATUT_BILAN_LABEL: Record<string, string> = {
    EN_ATTENTE_CONTROLEUR: "À valider",
    CLOTURE: "Clôturé",
};

function formatFcfa(montant: number): string {
    return `${montant.toLocaleString("fr-FR")} FCFA`;
}

export function ChefCentreDashboard({ centreId }: { centreId: string }) {
    const { data: centres } = useCentres();
    const { data: sessionActive } = useSessionActive();
    const { data: apprenants, isLoading: chargementApprenants } =
        useApprenants();
    const { data: formations, isLoading: chargementFormations } =
        useFormations();
    const { data: bilan, isLoading: chargementBilan } = useBilanDuJour(
        centreId,
        sessionActive?.id,
    );
    const { data: repartition } = useRepartitionFormations(bilan?.id);

    const centre = centres?.find((c) => c.id === centreId);
    const formationsDuCentre = formations?.filter(
        (f) => f.centreId === centreId,
    );

    const effectifFormation = (formationId: string) =>
        apprenants?.filter(
            (a) => a.centreId === centreId && a.formationId === formationId,
        ).length ?? 0;

    const montantRecouvreFormation = (formationId: string) => {
        const ligne = repartition?.find((r) => r.formationId === formationId);
        return ligne ? formatFcfa(ligne.montant) : PLACEHOLDER;
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* En-tête de page : spécifique à cet écran */}
            <div>
                <h1 className="text-brand-anthracite text-3xl font-bold">
                    Vue d&rsquo;ensemble{centre ? ` - ${centre.nom}` : ""}
                </h1>
                <p className="text-brand-gray mt-1 text-sm">
                    Synthèse opérationnelle du centre
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {/* Présence du jour : sous-valeurs multiples. Présents/Absents nécessitent
            FichePresenceJournaliere (module non construit) — seul "Nouveaux" est réel
            (bilan du jour). */}
                <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                            Présence du jour
                        </span>
                        <div className="bg-brand-orange/10 text-brand-orange rounded p-1.5">
                            <Users size={16} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-brand-anthracite text-xl font-bold">
                            {PLACEHOLDER}
                            <span className="text-brand-gray ml-1 text-xs font-normal">
                                Présents
                            </span>
                        </span>
                        <span className="text-xl font-bold text-red-600">
                            {PLACEHOLDER}
                            <span className="text-brand-gray ml-1 text-xs font-normal">
                                Absents
                            </span>
                        </span>
                    </div>
                    <p className="text-brand-gray text-xs">
                        {chargementBilan ? "…" : (bilan?.effectifNouveauxEleves ?? 0)}{" "}
                        nouveaux
                    </p>
                </Card>

                <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                            Entrées financières
                        </span>
                        <div className="bg-brand-orange/10 text-brand-orange rounded p-1.5">
                            <Wallet size={16} />
                        </div>
                    </div>
                    <div className="text-brand-anthracite text-2xl font-bold">
                        {chargementBilan
                            ? "…"
                            : bilan
                                ? formatFcfa(bilan.totalEntrees)
                                : PLACEHOLDER}
                    </div>
                </Card>

                <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                            Dossiers reçus
                        </span>
                        <div className="rounded bg-red-50 p-1.5 text-red-600">
                            <AlertTriangle size={16} />
                        </div>
                    </div>
                    <div className="text-brand-anthracite text-2xl font-bold">
                        {PLACEHOLDER}
                    </div>
                    <p className="text-brand-gray/70 text-xs">
                        Endpoint agrégé à construire
                    </p>
                </Card>

                <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                            État bilan journalier
                        </span>
                        <div className="bg-brand-orange/10 text-brand-orange rounded p-1.5">
                            <ClipboardCheck size={16} />
                        </div>
                    </div>
                    <div>
                        {chargementBilan ? (
                            <span className="text-brand-gray text-sm">…</span>
                        ) : bilan ? (
                            <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${bilan.statut === "EN_ATTENTE_CONTROLEUR"
                                        ? "bg-brand-orange/10 text-brand-orange"
                                        : "bg-brand-blue/10 text-brand-blue"
                                    }`}
                            >
                                {STATUT_BILAN_LABEL[bilan.statut]}
                            </span>
                        ) : (
                            <span className="text-brand-anthracite text-sm font-bold">
                                {PLACEHOLDER}
                            </span>
                        )}
                    </div>
                </Card>

                {/* Livrets : placeholders assumés (voir conversation projet — "on travaillera
            sur les documents plus tard") */}
                <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                            Livrets vendus
                        </span>
                        <div className="bg-brand-orange/10 text-brand-orange rounded p-1.5">
                            <BookOpen size={16} />
                        </div>
                    </div>
                    <div className="text-brand-anthracite text-2xl font-bold">
                        {PLACEHOLDER}
                    </div>
                </Card>

                <Card className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between">
                        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                            Livrets reçus
                        </span>
                        <div className="bg-brand-orange/10 text-brand-orange rounded p-1.5">
                            <FileCheck size={16} />
                        </div>
                    </div>
                    <div className="text-brand-anthracite text-2xl font-bold">
                        {PLACEHOLDER}
                    </div>
                </Card>
            </div>

            {/* KPIs par formation */}
            <Card className="overflow-hidden">
                <div className="border-brand-gray/20 flex items-center justify-between border-b p-4">
                    <h2 className="text-brand-anthracite text-base font-bold">
                        KPIs du Centre
                    </h2>
                    <button type="button" className="text-brand-orange text-sm font-bold">
                        Tout valider
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-brand-anthracite text-brand-white">
                            <tr>
                                {[
                                    "Formation/Classe",
                                    "Effectif",
                                    "Présence (%)",
                                    "Dossiers Val. (%)",
                                    "Montant recouvré",
                                    "Livrets dist.",
                                ].map((titre) => (
                                    <th
                                        key={titre}
                                        className="p-3 text-xs font-bold tracking-wide uppercase"
                                    >
                                        {titre}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-brand-gray/10 divide-y">
                            {chargementFormations && (
                                <tr>
                                    <td colSpan={6} className="text-brand-gray p-4 text-center">
                                        Chargement...
                                    </td>
                                </tr>
                            )}
                            {formationsDuCentre?.length === 0 && !chargementFormations && (
                                <tr>
                                    <td colSpan={6} className="text-brand-gray p-4 text-center">
                                        Aucune formation pour ce centre.
                                    </td>
                                </tr>
                            )}
                            {formationsDuCentre?.map((formation) => (
                                <tr key={formation.id}>
                                    <td className="text-brand-anthracite p-3 font-bold">
                                        {formation.nom}
                                    </td>
                                    <td className="text-brand-anthracite p-3 font-bold">
                                        {chargementApprenants
                                            ? "…"
                                            : effectifFormation(formation.id)}
                                    </td>
                                    <td className="text-brand-gray p-3">{PLACEHOLDER}</td>
                                    <td className="text-brand-gray p-3">{PLACEHOLDER}</td>
                                    <td className="text-brand-gray p-3">
                                        {montantRecouvreFormation(formation.id)}
                                    </td>
                                    <td className="text-brand-gray p-3">{PLACEHOLDER}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}