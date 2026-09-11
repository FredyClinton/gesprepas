"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Eye, UserPlus } from "lucide-react";

import { Button, Card, Pagination } from "@/shared/ui";
import { useApprenants, type Apprenant } from "@/modules/apprenants";
import { useFormations } from "@/modules/academique";
import { useDossierParApprenant } from "@/modules/dossiers";
import { useVersementsApprenant } from "@/modules/financier";

const TAILLE_PAGE = 10;
const FORMATEUR_FCFA = new Intl.NumberFormat("fr-FR");

export function ApprenantsListView({ centreId }: { centreId: string }) {
    const { data: apprenants, isLoading: chargementApprenants } = useApprenants();
    const { data: formations } = useFormations();
    const formationsDuCentre = formations?.filter((f) => f.centreId === centreId);

    const [recherche, setRecherche] = useState("");
    const [filtreFormation, setFiltreFormation] = useState("");
    const [page, setPage] = useState(1);

    // Revient à la page 1 à chaque changement de filtre -- même principe que
    // l'écran Enseignants.
    function changerRecherche(valeur: string) {
        setRecherche(valeur);
        setPage(1);
    }
    function changerFiltreFormation(valeur: string) {
        setFiltreFormation(valeur);
        setPage(1);
    }

    const apprenantsDuCentre = useMemo(
        () => (apprenants ?? []).filter((a) => a.centreId === centreId),
        [apprenants, centreId],
    );

    const apprenantsFiltres = useMemo(() => {
        return apprenantsDuCentre.filter((a) => {
            if (filtreFormation && a.formationId !== filtreFormation) return false;
            if (recherche.trim()) {
                const q = recherche.trim().toLowerCase();
                const texte = `${a.prenom} ${a.nom}`.toLowerCase();
                if (!texte.includes(q)) return false;
            }
            return true;
        });
    }, [apprenantsDuCentre, filtreFormation, recherche]);

    const apprenantsPage = useMemo(
        () => apprenantsFiltres.slice((page - 1) * TAILLE_PAGE, page * TAILLE_PAGE),
        [apprenantsFiltres, page],
    );

    const chargement = chargementApprenants;

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Apprenants
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Gérez la liste des étudiants inscrits dans votre centre.
                    </p>
                </div>
                <Link href="/inscription">
                    <Button type="button">
                        <span className="flex items-center gap-1.5">
                            <UserPlus size={14} />
                            Inscrire un apprenant
                        </span>
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 shadow-2xs">
                    <Search size={14} className="text-slate-400" />
                    <input
                        type="text"
                        value={recherche}
                        onChange={(e) => changerRecherche(e.target.value)}
                        placeholder="Rechercher un apprenant..."
                        className="w-full text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                </div>
                <select
                    value={filtreFormation}
                    onChange={(e) => changerFiltreFormation(e.target.value)}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 outline-none shadow-2xs focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                >
                    <option value="" className="bg-white text-slate-800">Toutes les formations</option>
                    {formationsDuCentre?.map((f) => (
                        <option key={f.id} value={f.id} className="bg-white text-slate-800">
                            {f.nom}
                        </option>
                    ))}
                </select>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-100/90 text-slate-700">
                            <tr>
                                {[
                                    "Nom & Prénom",
                                    "Formation ",
                                    "Paiement",
                                    "Dossier",
                                    "Actions",
                                ].map((titre) => (
                                    <th
                                        key={titre}
                                        className="p-3.5 text-xs font-bold tracking-wider uppercase"
                                    >
                                        {titre}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {chargement && (
                                <tr>
                                    <td colSpan={5} className="text-brand-gray p-4 text-center">
                                        Chargement...
                                    </td>
                                </tr>
                            )}
                            {!chargement && apprenantsFiltres.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-brand-gray p-4 text-center">
                                        Aucun apprenant ne correspond.
                                    </td>
                                </tr>
                            )}
                            {apprenantsPage.map((a) => (
                                <LigneApprenant
                                    key={a.id}
                                    apprenant={a}
                                    nomFormation={
                                        formationsDuCentre?.find((f) => f.id === a.formationId)?.nom
                                    }
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                {!chargement && (
                    <div className="border-brand-gray/10 border-t px-3">
                        <Pagination
                            page={page}
                            totalPages={Math.ceil(apprenantsFiltres.length / TAILLE_PAGE)}
                            totalItems={apprenantsFiltres.length}
                            pageSize={TAILLE_PAGE}
                            onChange={setPage}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}

// Colocalisé : une ligne du tableau. Le statut de paiement et le statut du dossier
// viennent chacun d'un module différent (financier, dossier) - résolus par ligne,
// donc seulement pour les apprenants réellement affichés sur la page courante (pas
// les 142, juste les ~10 visibles).
function LigneApprenant({
    apprenant,
    nomFormation,
}: {
    apprenant: Apprenant;
    nomFormation: string | undefined;
}) {
    const { data: versements, isLoading: chargementVersements } =
        useVersementsApprenant(apprenant.id);
    const {
        data: dossier,
        isLoading: chargementDossier,
        isError: erreurDossier,
    } = useDossierParApprenant(apprenant.id);

    const montantPaye = (versements ?? [])
        .filter((v) => v.statut === "VALIDE")
        .reduce((total, v) => total + v.montant, 0);
    const soldeRestant = apprenant.montantContrat - montantPaye;

    return (
        <tr className="hover:bg-amber-50/70 transition-colors duration-150 border-b border-slate-100 last:border-0">
            <td className="p-3">
                <span className="text-brand-anthracite font-bold">
                    {apprenant.prenom} {apprenant.nom}
                </span>
            </td>
            <td className="text-brand-gray p-3">{nomFormation ?? "-"}</td>
            <td className="p-3">
                {chargementVersements ? (
                    <span className="text-brand-gray text-xs">...</span>
                ) : soldeRestant <= 0 ? (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800 uppercase">
                        Complet
                    </span>
                ) : (
                    <span className="bg-brand-orange/10 text-brand-orange rounded-full px-2.5 py-1 text-xs font-bold uppercase">
                        Solde : {FORMATEUR_FCFA.format(soldeRestant)} FCFA
                    </span>
                )}
            </td>
            <td className="p-3">
                {chargementDossier ? (
                    <span className="text-brand-gray text-xs">...</span>
                ) : erreurDossier || !dossier ? (
                    <span className="bg-brand-gray/10 text-brand-gray rounded-full px-2.5 py-1 text-xs font-bold uppercase">
                        Aucun dossier
                    </span>
                ) : (
                    <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${dossier.statut === "CLOTURE"
                                ? "bg-brand-gray/10 text-brand-gray"
                                : dossier.statut === "COMPLET"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-brand-orange/10 text-brand-orange"
                            }`}
                    >
                        {dossier.statut === "OUVERT"
                            ? "Ouvert"
                            : dossier.statut === "COMPLET"
                                ? "Complet"
                                : "Clôturé"}
                    </span>
                )}
            </td>
            <td className="p-3">
                <Link
                    href={`/apprenants/${apprenant.id}`}
                    title="Voir la fiche"
                    className="text-brand-gray hover:text-brand-orange inline-flex"
                >
                    <Eye size={16} />
                </Link>
            </td>
        </tr>
    );
}
