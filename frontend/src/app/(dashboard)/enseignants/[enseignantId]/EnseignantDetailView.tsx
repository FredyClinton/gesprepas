"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  Pencil,
  Ban,
  RotateCcw,
  Trash2,
  X,
  Plus,
  Search,
  Phone,
  CreditCard,
  GraduationCap,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  Building2,
  Layers,
  Coins,
  MapPin,
  User,
  MoreVertical,
  Receipt,
  Eye,
  FileText,
  AlertCircle,
} from "lucide-react";

import { Button, Card, Input, Modal } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import {
  useEnseignant,
  useAncienneteEnseignant,
  useRenommerEnseignant,
  useModifierCoutParSeance,
  useSuspendreEnseignant,
  useReactiverEnseignant,
  useSupprimerEnseignant,
} from "@/modules/personnel";
import { useDepartements, type Departement } from "@/modules/departement";
import {
  useRostersDepartements,
  useAjouterEnseignantRoster,
  useRetirerEnseignantRoster,
} from "@/modules/affectation-departementale";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useSalles } from "@/modules/salle";
import { useMatieres } from "@/modules/matieres";
import {
  useAffectationsParEnseignant,
  LABELS_JOUR,
  type Affectation,
} from "@/modules/affectation";
import {
  useFichesPaieEnseignant,
  type FichePaieEnseignant,
  CLASSES_STATUT_FICHE_PAIE,
  LABELS_STATUT_FICHE_PAIE,
} from "@/modules/remuneration";
import { useGelEnseignants } from "@/modules/gel-enseignants";
import { FichePaieModal } from "@/app/(dashboard)/paie/FichePaieModal";
import type { Role } from "@/types/roles";

const MAX_DEPARTEMENTS = 2;

const renommerSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
});
type RenommerFormValues = z.infer<typeof renommerSchema>;

const coutSchema = z.object({
  coutParSeance: z
    .number({ message: "Doit être un nombre" })
    .min(0, "Ne peut pas être négatif"),
});
type CoutFormValues = z.infer<typeof coutSchema>;

const FORMATEUR_FCFA = new Intl.NumberFormat("fr-FR");

const LABELS_STATUT_SEANCE: Record<string, string> = {
  PLANIFIEE: "Planifiée",
  ASSIGNEE: "Assignée",
  EFFECTUEE: "Effectuée",
  ANNULEE: "Annulée",
};

const CLASSES_STATUT_SEANCE: Record<string, string> = {
  PLANIFIEE: "bg-slate-100 text-slate-700 border border-slate-200",
  ASSIGNEE: "bg-amber-50 text-amber-700 border border-amber-200/80",
  EFFECTUEE: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  ANNULEE: "bg-red-50 text-red-700 border border-red-200/80",
};

export function EnseignantDetailView({
  enseignantId,
  role,
}: {
  enseignantId: string;
  role: Role;
}) {
  const estDA = role === "DIRECTEUR_ACADEMIQUE";
  const estCDD = role === "CHEF_DEPARTEMENT";
  const { data: gel } = useGelEnseignants();
  const gelEffectifPourCDD = estCDD && (gel === undefined || gel.effectif);
  const peutGerer = estDA || (estCDD && !gelEffectifPourCDD);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: enseignant, isLoading, isError } = useEnseignant(enseignantId);
  const { data: anciennete } = useAncienneteEnseignant(enseignantId);
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;
  const { data: departements } = useDepartements();
  const departementIds = useMemo(
    () => departements?.map((d) => d.id) ?? [],
    [departements],
  );
  const { data: roster } = useRostersDepartements(departementIds, sessionId);
  const { data: centres } = useCentres();
  const { data: salles } = useSalles(sessionId);
  const { data: matieres } = useMatieres();
  const { data: seances, isLoading: chargementSeances } =
    useAffectationsParEnseignant(enseignantId, sessionId);
  const { data: fichesPaie, isLoading: chargementFiches } =
    useFichesPaieEnseignant(enseignantId, sessionId);

  const departementsDeCetEnseignant: Departement[] = useMemo(() => {
    if (!roster || !departements) return [];
    const ids = new Set(
      roster
        .filter((r) => r.enseignantId === enseignantId)
        .map((r) => r.departementId),
    );
    return departements.filter((d) => ids.has(d.id));
  }, [roster, departements, enseignantId]);

  const departementsDisponibles = useMemo(
    () =>
      (departements ?? []).filter(
        (d) => !departementsDeCetEnseignant.some((dd) => dd.id === d.id),
      ),
    [departements, departementsDeCetEnseignant],
  );

  // Toutes les séances de l'enseignant sur la session, quel que soit leur statut
  // (planifiée, assignée, effectuée ou annulée) - pas seulement celles déjà
  // effectuées, pour que le Directeur Académique voie aussi ce qui reste à venir.
  const toutesLesSeances = useMemo(
    () =>
      (seances ?? []).sort(
        (a, b) => a.semaine - b.semaine || a.seance - b.seance,
      ),
    [seances],
  );

  const seancesEffectueesCount = useMemo(
    () => toutesLesSeances.filter((s) => s.statut === "EFFECTUEE").length,
    [toutesLesSeances],
  );
  const tauxRealisation = useMemo(() => {
    if (toutesLesSeances.length === 0) return 0;
    return Math.round((seancesEffectueesCount / toutesLesSeances.length) * 100);
  }, [toutesLesSeances, seancesEffectueesCount]);

  // Décomposition financière détaillée des honoraires
  const statsPaiement = useMemo(() => {
    const coutParDefaut = enseignant?.coutParSeance ?? 0;
    let totalAcquis = 0;
    let totalPaye = 0;
    let totalProgramme = 0;
    let totalEnAttente = 0;
    let countPayees = 0;
    let countProgrammees = 0;
    let countEnAttente = 0;

    for (const s of toutesLesSeances) {
      if (s.statut === "EFFECTUEE") {
        const montant = s.coutApplique ?? coutParDefaut;
        totalAcquis += montant;

        if (s.statutPaiement === "PAYEE") {
          totalPaye += montant;
          countPayees++;
        } else if (s.statutPaiement === "PROGRAMMEE") {
          totalProgramme += montant;
          countProgrammees++;
        } else {
          totalEnAttente += montant;
          countEnAttente++;
        }
      }
    }

    return {
      totalAcquis,
      totalPaye,
      totalProgramme,
      totalEnAttente,
      countPayees,
      countProgrammees,
      countEnAttente,
    };
  }, [toutesLesSeances, enseignant?.coutParSeance]);

  const montantCumule = statsPaiement.totalAcquis;

  const [ongletActif, setOngletActif] = useState<"seances" | "paiements">("seances");
  const [ficheDetailSelectionnee, setFicheDetailSelectionnee] =
    useState<FichePaieEnseignant | null>(null);

  const [editionNom, setEditionNom] = useState(false);
  const [editionCout, setEditionCout] = useState(false);
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);
  const [menuOptionsOuvert, setMenuOptionsOuvert] = useState(false);
  const [selecteurRattachementOuvert, setSelecteurRattachementOuvert] =
    useState(false);

  const [recherche, setRecherche] = useState("");
  const [filtreMatiereId, setFiltreMatiereId] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreStatutPaiement, setFiltreStatutPaiement] = useState("");

  const renommer = useRenommerEnseignant();
  const modifierCout = useModifierCoutParSeance();
  const suspendre = useSuspendreEnseignant();
  const reactiver = useReactiverEnseignant();
  const supprimer = useSupprimerEnseignant();
  const rattacher = useAjouterEnseignantRoster();
  const detacher = useRetirerEnseignantRoster();

  const formNom = useForm<RenommerFormValues>({
    resolver: zodResolver(renommerSchema),
  });
  const formCout = useForm<CoutFormValues>({
    resolver: zodResolver(coutSchema),
  });

  // Synchronise l'ouverture du formulaire avec le paramètre d'URL ?edit=1 une fois
  // les données chargées (pas d'alternative sans effet : enseignant est
  // indisponible au tout premier rendu).
  useEffect(() => {
    if (searchParams.get("edit") === "1" && enseignant && peutGerer) {
      formNom.reset({ nom: enseignant.nom, prenom: enseignant.prenom });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditionNom(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enseignant, peutGerer]);

  async function onSubmitNom(values: RenommerFormValues) {
    try {
      await renommer.mutateAsync({ id: enseignantId, ...values });
      setEditionNom(false);
    } catch (erreur) {
      formNom.setError("root", {
        message: messageErreurApi(erreur, "Échec de la modification."),
      });
    }
  }

  async function onSubmitCout(values: CoutFormValues) {
    try {
      await modifierCout.mutateAsync({
        id: enseignantId,
        coutParSeance: values.coutParSeance,
      });
      setEditionCout(false);
    } catch (erreur) {
      formCout.setError("root", {
        message: messageErreurApi(erreur, "Échec de la modification."),
      });
    }
  }

  async function toggleStatut() {
    if (!enseignant) return;
    if (enseignant.statut === "ACTIF") {
      await suspendre.mutateAsync(enseignantId);
    } else {
      await reactiver.mutateAsync(enseignantId);
    }
  }

  async function confirmerSuppression() {
    await supprimer.mutateAsync(enseignantId);
    router.push("/enseignants");
  }

  async function rattacherDepartement(departementId: string) {
    if (!sessionId) return;
    await rattacher.mutateAsync({ departementId, sessionId, enseignantId });
    setSelecteurRattachementOuvert(false);
  }

  async function detacherDepartement(departementId: string) {
    if (!sessionId) return;
    await detacher.mutateAsync({ departementId, sessionId, enseignantId });
  }

  const matieresDesSeances = useMemo(() => {
    const ids = new Set(toutesLesSeances.map((s) => s.matiereId));
    return (matieres ?? []).filter((m) => ids.has(m.id));
  }, [toutesLesSeances, matieres]);

  const statutsDesSeances = useMemo(() => {
    const ids = new Set(toutesLesSeances.map((s) => s.statut));
    return Array.from(ids);
  }, [toutesLesSeances]);

  const seancesFiltrees = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLowerCase();
    return toutesLesSeances.filter((s) => {
      if (filtreMatiereId && s.matiereId !== filtreMatiereId) return false;
      if (filtreStatut && s.statut !== filtreStatut) return false;
      if (filtreStatutPaiement) {
        if (filtreStatutPaiement === "PAYEE" && s.statutPaiement !== "PAYEE") {
          return false;
        }
        if (
          filtreStatutPaiement === "PROGRAMMEE" &&
          s.statutPaiement !== "PROGRAMMEE"
        ) {
          return false;
        }
        if (
          filtreStatutPaiement === "NON_PAYEE" &&
          (s.statut !== "EFFECTUEE" ||
            s.statutPaiement === "PAYEE" ||
            s.statutPaiement === "PROGRAMMEE")
        ) {
          return false;
        }
        if (
          filtreStatutPaiement === "A_ECHOIR" &&
          s.statut !== "PLANIFIEE" &&
          s.statut !== "ASSIGNEE"
        ) {
          return false;
        }
      }
      if (!rechercheNormalisee) return true;
      const nomMatiere = matieres?.find((m) => m.id === s.matiereId)?.nom ?? "";
      const nomCentre = centres?.find((c) => c.id === s.centreId)?.nom ?? "";
      const nomSalle = salles?.find((sa) => sa.id === s.salleId)?.nom ?? "";
      const cible = `${nomMatiere} ${nomCentre} ${nomSalle}`.toLowerCase();
      return cible.includes(rechercheNormalisee);
    });
  }, [
    toutesLesSeances,
    filtreMatiereId,
    filtreStatut,
    filtreStatutPaiement,
    recherche,
    matieres,
    centres,
    salles,
  ]);

  function getBadgePaiement(s: Affectation) {
    if (s.statutPaiement === "PAYEE") {
      return {
        label: "Payée",
        badgeClass:
          "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
        icon: CheckCircle2,
      };
    }
    if (s.statutPaiement === "PROGRAMMEE") {
      return {
        label: "Programmée",
        badgeClass: "bg-blue-50 text-blue-700 border border-blue-200/80",
        icon: Clock,
      };
    }
    if (s.statut === "EFFECTUEE") {
      return {
        label: "En attente",
        badgeClass: "bg-amber-50 text-amber-700 border border-amber-200/80",
        icon: Coins,
      };
    }
    if (s.statut === "ANNULEE") {
      return {
        label: "Non due",
        badgeClass: "bg-slate-100 text-slate-500 border border-slate-200",
        icon: null,
      };
    }
    return {
      label: "À venir",
      badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
      icon: null,
    };
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <p className="text-brand-gray p-8 text-center text-base">
          Chargement...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="p-10 text-center">
          <p className="font-bold text-red-600">Erreur de chargement</p>
          <p className="text-brand-gray mt-1.5 text-sm">
            L&rsquo;appel à <code>/api/enseignants/{enseignantId}</code> a
            échoué (réseau, serveur, ou l&rsquo;identifiant n&rsquo;existe pas).
            Vérifiez l&rsquo;onglet Network du navigateur pour le code exact.
          </p>
          <Link
            href="/enseignants"
            className="text-brand-orange mt-3 inline-block text-sm font-bold"
          >
            Retour à la liste
          </Link>
        </Card>
      </div>
    );
  }

  if (!enseignant) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="p-10 text-center">
          <p className="text-brand-anthracite text-lg font-bold">
            Enseignant introuvable
          </p>
          <Link
            href="/enseignants"
            className="text-brand-orange mt-3 inline-block text-sm font-bold"
          >
            Retour à la liste
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Alerte gel éventuel pour le Chef de Département */}
      {gelEffectifPourCDD && (
        <Card className="border-amber-300/80 bg-amber-50/70 p-4">
          <p className="text-amber-900 text-sm font-medium">
            La gestion de cet enseignant (édition, suspension, rattachement) est
            temporairement indisponible suite au gel des effectifs.
          </p>
        </Card>
      )}

      {/* Navigation fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/enseignants"
          className="hover:text-brand-orange inline-flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Enseignants
        </Link>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-brand-anthracite truncate">
          {enseignant.prenom} {enseignant.nom}
        </span>
      </div>

      {/* Hero Banner d'identité */}
      <Card className="p-6 relative overflow-hidden bg-gradient-to-r from-white via-white to-slate-50/70 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar initiales stylé */}
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-orange to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-brand-orange/20">
                {enseignant.prenom?.charAt(0)}
                {enseignant.nom?.charAt(0)}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                  enseignant.statut === "ACTIF"
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                }`}
                title={
                  enseignant.statut === "ACTIF"
                    ? "Enseignant actif"
                    : "Enseignant suspendu"
                }
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {enseignant.prenom} {enseignant.nom}
                </h1>
                {peutGerer && (
                  <button
                    type="button"
                    onClick={() => {
                      formNom.reset({
                        nom: enseignant.nom,
                        prenom: enseignant.prenom,
                      });
                      setEditionNom(true);
                    }}
                    className="text-slate-400 hover:text-brand-orange p-1 rounded-md transition-colors"
                    title="Modifier l'identité"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                    enseignant.statut === "ACTIF"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      enseignant.statut === "ACTIF"
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {enseignant.statut === "ACTIF" ? "Actif" : "Suspendu"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-400">MATRICULE :</span>
                  <span className="font-mono font-bold text-brand-anthracite bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {enseignant.matricule}
                  </span>
                </div>
                {enseignant.ecoleFonction && (
                  <div className="flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400" />
                    <span>{enseignant.ecoleFonction}</span>
                  </div>
                )}
                {enseignant.niveauGrade && (
                  <div className="flex items-center gap-1">
                    <Award size={13} className="text-slate-400" />
                    <span>{enseignant.niveauGrade}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {peutGerer && (
            <div className="relative inline-block text-left self-start md:self-center">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs h-9 px-3"
                  onClick={() => {
                    formNom.reset({
                      nom: enseignant.nom,
                      prenom: enseignant.prenom,
                    });
                    setEditionNom(true);
                  }}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <Pencil size={14} />
                    Modifier le profil
                  </span>
                </Button>

                <button
                  type="button"
                  onClick={() => setMenuOptionsOuvert((o) => !o)}
                  title="Plus d'actions"
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              {menuOptionsOuvert && (
                <>
                  <button
                    type="button"
                    aria-label="Fermer le menu"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setMenuOptionsOuvert(false)}
                  />
                  <div className="absolute right-0 z-40 mt-1 w-56 rounded-xl border border-slate-200/80 bg-white py-1.5 shadow-xl text-left">
                    {/* Action de suspension discrète */}
                    <button
                      type="button"
                      disabled={suspendre.isPending || reactiver.isPending}
                      onClick={() => {
                        setMenuOptionsOuvert(false);
                        toggleStatut();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors text-left ${
                        enseignant.statut === "ACTIF"
                          ? "text-amber-700 hover:bg-amber-50"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {enseignant.statut === "ACTIF" ? (
                        <>
                          <Ban size={14} className="text-amber-600" />
                          Suspendre l&apos;enseignant
                        </>
                      ) : (
                        <>
                          <RotateCcw size={14} className="text-emerald-600" />
                          Réactiver l&apos;enseignant
                        </>
                      )}
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* Action de suppression critique discrète */}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOptionsOuvert(false);
                        setConfirmationSuppression(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                    >
                      <Trash2 size={14} className="text-rose-500" />
                      Supprimer définitivement
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 4 Cartes Métriques KPI vivantes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Séances Planifiées */}
        <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow border border-slate-200/80">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Calendar size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Séances session
            </p>
            <p className="text-2xl font-black text-brand-anthracite">
              {toutesLesSeances.length}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {sessionActive?.annee ? `Session ${sessionActive.annee}` : "Toutes séances"}
            </p>
          </div>
        </Card>

        {/* Card 2: Séances Effectuées */}
        <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow border border-slate-200/80">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Effectuées
              </p>
              <span className="text-xs font-bold text-emerald-600">
                {tauxRealisation}%
              </span>
            </div>
            <p className="text-2xl font-black text-brand-anthracite">
              {seancesEffectueesCount}
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(tauxRealisation, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Card 3: Rémunération estimée */}
        <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow border border-slate-200/80">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-brand-orange">
            <Coins size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cumul honoraires
            </p>
            <p
              className="text-xl font-black text-brand-anthracite truncate"
              title={`${FORMATEUR_FCFA.format(montantCumule)} FCFA`}
            >
              {FORMATEUR_FCFA.format(montantCumule)}{" "}
              <span className="text-xs font-bold text-slate-500">FCFA</span>
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] truncate">
              <span className="font-bold text-emerald-600">
                {FORMATEUR_FCFA.format(statsPaiement.totalPaye)} payés
              </span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-amber-600">
                {FORMATEUR_FCFA.format(statsPaiement.totalEnAttente + statsPaiement.totalProgramme)} en cours
              </span>
            </div>
          </div>
        </Card>

        {/* Card 4: Ancienneté */}
        <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow border border-slate-200/80">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Clock size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ancienneté
            </p>
            <p className="text-lg font-black text-brand-anthracite truncate">
              {anciennete
                ? `${anciennete.ancienneteAnnees} ans ${anciennete.ancienneteMois} mois`
                : "-"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {enseignant.dateRecrutement
                ? `Recruté le ${new Date(enseignant.dateRecrutement).toLocaleDateString("fr-FR")}`
                : "Date non renseignée"}
            </p>
          </div>
        </Card>
      </div>

      {/* Corps en 2 colonnes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Colonne gauche : Profil, Coordonnées & Départements */}
        <div className="space-y-6 lg:col-span-1">
          {/* Card Coordonnées & État Civil */}
          <Card className="p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User size={18} className="text-brand-orange" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Coordonnées & CNI
              </h2>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500 shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Téléphone
                  </p>
                  {enseignant.telephone ? (
                    <a
                      href={`tel:${enseignant.telephone}`}
                      className="text-sm font-semibold text-brand-anthracite hover:text-brand-orange transition-colors"
                    >
                      {enseignant.telephone}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-slate-400">-</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500 shrink-0">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Numéro CNI
                  </p>
                  <p className="text-sm font-semibold text-brand-anthracite font-mono">
                    {enseignant.numeroCni || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500 shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Date de Recrutement
                  </p>
                  <p className="text-sm font-semibold text-brand-anthracite">
                    {enseignant.dateRecrutement
                      ? new Date(enseignant.dateRecrutement).toLocaleDateString("fr-FR")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Profil Académique & Honoraires */}
          <Card className="p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-brand-orange" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Profil & Honoraires
                </h2>
              </div>
              {peutGerer && (
                <button
                  type="button"
                  onClick={() => {
                    formCout.reset({
                      coutParSeance: enseignant.coutParSeance,
                    });
                    setEditionCout(true);
                  }}
                  className="text-xs text-brand-orange hover:text-brand-orange/80 font-bold inline-flex items-center gap-1"
                  title="Modifier le tarif"
                >
                  <Pencil size={12} />
                  Modifier
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500 shrink-0">
                  <Building2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    École d&rsquo;origine / Fonction
                  </p>
                  <p className="text-sm font-semibold text-brand-anthracite">
                    {enseignant.ecoleFonction || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-50 text-slate-500 shrink-0">
                  <Award size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Niveau / Grade
                  </p>
                  <p className="text-sm font-semibold text-brand-anthracite">
                    {enseignant.niveauGrade || "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 text-brand-orange shrink-0">
                  <Coins size={16} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Tarif par séance
                  </p>
                  <p className="text-base font-bold text-brand-anthracite">
                    {FORMATEUR_FCFA.format(enseignant.coutParSeance)} FCFA
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Départements Rattachés (Roster) */}
          <Card className="p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-brand-orange" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Départements
                </h2>
              </div>
              {peutGerer &&
                departementsDeCetEnseignant.length < MAX_DEPARTEMENTS &&
                departementsDisponibles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelecteurRattachementOuvert((o) => !o)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-brand-orange/80 transition-colors"
                  >
                    <Plus size={14} />
                    Rattacher
                  </button>
                )}
            </div>

            {selecteurRattachementOuvert && (
              <div className="rounded-xl border border-brand-orange/30 bg-brand-orange/5 p-3 space-y-2">
                <p className="text-xs font-semibold text-brand-anthracite">
                  Choisir un département à rattacher :
                </p>
                <div className="flex flex-wrap gap-2">
                  {departementsDisponibles.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => rattacherDepartement(d.id)}
                      disabled={rattacher.isPending}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-brand-anthracite shadow-sm hover:border-brand-orange hover:text-brand-orange disabled:opacity-50 transition-colors"
                    >
                      + {d.nom}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {departementsDeCetEnseignant.length === 0 ? (
              <div className="py-4 text-center">
                <Layers size={28} className="mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs text-slate-500">
                  Aucun département rattaché sur cette session.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {departementsDeCetEnseignant.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs"
                  >
                    <Layers size={13} className="text-slate-400" />
                    {d.nom}
                    {peutGerer && (
                      <button
                        type="button"
                        onClick={() => detacherDepartement(d.id)}
                        disabled={detacher.isPending}
                        aria-label={`Détacher ${d.nom}`}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-50 ml-0.5 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}

            {(rattacher.isError || detacher.isError) && (
              <p className="text-xs font-bold text-red-600">
                Échec de l&rsquo;opération. Veuillez réessayer.
              </p>
            )}
          </Card>
        </div>

        {/* Colonne droite : Planning des Séances & Historique des Paiements */}
        <div className="lg:col-span-2 space-y-4">
          {/* Navigation par Onglets vivante et moderne */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setOngletActif("seances")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                ongletActif === "seances"
                  ? "bg-brand-anthracite text-white shadow-sm"
                  : "text-slate-600 hover:text-brand-anthracite hover:bg-slate-100"
              }`}
            >
              <Calendar size={16} />
              <span>Planning des Séances</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  ongletActif === "seances"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {toutesLesSeances.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOngletActif("paiements")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                ongletActif === "paiements"
                  ? "bg-brand-anthracite text-white shadow-sm"
                  : "text-slate-600 hover:text-brand-anthracite hover:bg-slate-100"
              }`}
            >
              <Receipt size={16} />
              <span>Historique & Fiches de paie</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  ongletActif === "paiements"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {fichesPaie?.length ?? 0}
              </span>
            </button>
          </div>

          {/* Onglet 1 : Planning & Séances avec Statut Paiement */}
          {ongletActif === "seances" && (
            <Card className="overflow-hidden border border-slate-200/80 shadow-sm">
              {/* Entête du tableau avec recherche et filtres */}
              <div className="border-b border-slate-200/80 bg-slate-50/50 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-brand-anthracite">
                        Planning & Séances
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
                        {seancesFiltrees.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Session {sessionActive?.annee ?? "en cours"} · Affectations et suivi des paiements
                    </p>
                  </div>
                </div>

                {/* Panneau de recherche et filtres bien démarqué et lisible */}
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
                  {/* Ligne 1 : Recherche principale + Bouton réinitialiser */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="relative flex-1">
                      <Search
                        size={17}
                        className="text-brand-orange absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Rechercher une matière, un centre, une salle..."
                        className="w-full h-10 rounded-lg border border-slate-300 bg-slate-50/60 pr-9 pl-9 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 focus:outline-hidden transition-all"
                      />
                      {recherche && (
                        <button
                          type="button"
                          onClick={() => setRecherche("")}
                          className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                          title="Effacer la recherche"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {(recherche ||
                      filtreMatiereId ||
                      filtreStatut ||
                      filtreStatutPaiement) && (
                      <button
                        type="button"
                        onClick={() => {
                          setRecherche("");
                          setFiltreMatiereId("");
                          setFiltreStatut("");
                          setFiltreStatutPaiement("");
                        }}
                        className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shrink-0"
                      >
                        <RotateCcw size={13} />
                        <span>Réinitialiser les filtres</span>
                      </button>
                    )}
                  </div>

                  {/* Ligne 2 : Les 3 filtres déroulants avec libellés et icônes visibles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                    {/* Filtre Matière */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Layers size={12} className="text-slate-400" />
                        Matière
                      </label>
                      <select
                        value={filtreMatiereId}
                        onChange={(e) => setFiltreMatiereId(e.target.value)}
                        className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 focus:outline-hidden"
                      >
                        <option value="">Toutes les matières</option>
                        {matieresDesSeances.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtre Statut de séance */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-slate-400" />
                        Statut Séance
                      </label>
                      <select
                        value={filtreStatut}
                        onChange={(e) => setFiltreStatut(e.target.value)}
                        className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 focus:outline-hidden"
                      >
                        <option value="">Tous les statuts séances</option>
                        {statutsDesSeances.map((statut) => (
                          <option key={statut} value={statut}>
                            {LABELS_STATUT_SEANCE[statut] ?? statut}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtre Paiement */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Coins size={12} className="text-slate-400" />
                        Statut Paiement
                      </label>
                      <select
                        value={filtreStatutPaiement}
                        onChange={(e) => setFiltreStatutPaiement(e.target.value)}
                        className="h-9.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15 focus:outline-hidden"
                      >
                        <option value="">Tous les paiements</option>
                        <option value="PAYEE">Payées</option>
                        <option value="PROGRAMMEE">Programmées</option>
                        <option value="NON_PAYEE">En attente (Non payées)</option>
                        <option value="A_ECHOIR">À échoir</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tableau SaaS stylé */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold text-xs tracking-wider uppercase">
                    <tr>
                      <th className="px-5 py-3.5">Semaine & Créneau</th>
                      <th className="px-5 py-3.5">Matière</th>
                      <th className="px-5 py-3.5">Centre</th>
                      <th className="px-5 py-3.5">Statut Séance</th>
                      <th className="px-5 py-3.5 text-right">Paiement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chargementSeances && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-sm text-slate-500"
                        >
                          Chargement des séances...
                        </td>
                      </tr>
                    )}
                    {!chargementSeances && seancesFiltrees.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-10 text-center">
                          <Calendar
                            size={32}
                            className="mx-auto text-slate-300 mb-2"
                          />
                          <p className="text-sm font-semibold text-slate-700">
                            {toutesLesSeances.length === 0
                              ? "Aucune séance affectée pour cette session"
                              : "Aucune séance ne correspond aux critères"}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {toutesLesSeances.length === 0
                              ? "Les séances assignées apparaîtront ici automatiquement."
                              : "Essayez de modifier ou réinitialiser vos filtres."}
                          </p>
                        </td>
                      </tr>
                    )}
                    {seancesFiltrees.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-amber-50/70 transition-colors duration-150 border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-brand-orange" />
                            <div>
                              <p className="font-bold text-brand-anthracite text-xs sm:text-sm">
                                Semaine {s.semaine} · {LABELS_JOUR[s.jour] ?? s.jour}
                              </p>
                              <p className="text-xs text-slate-500">
                                Séance n°{s.seance}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-brand-anthracite text-xs sm:text-sm">
                            {matieres?.find((m) => m.id === s.matiereId)?.nom ??
                              "-"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span className="font-medium">
                              {centres?.find((c) => c.id === s.centreId)?.nom ??
                                "-"}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 border border-slate-200">
                              {salles?.find((sa) => sa.id === s.salleId)?.nom ??
                                "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                              CLASSES_STATUT_SEANCE[s.statut] ??
                              "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {LABELS_STATUT_SEANCE[s.statut] ?? s.statut}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {(() => {
                            const badge = getBadgePaiement(s);
                            const Icone = badge.icon;
                            const montant =
                              s.coutApplique ?? enseignant.coutParSeance;
                            return (
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${badge.badgeClass}`}
                                >
                                  {Icone && <Icone size={12} />}
                                  {badge.label}
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  {FORMATEUR_FCFA.format(montant)} FCFA
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Onglet 2 : Historique des Paiements & Fiches de Paie */}
          {ongletActif === "paiements" && (
            <div className="space-y-4">
              {/* Synthèse financière de l'enseignant */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="p-4 border border-slate-200/80 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-brand-orange">
                      <Coins size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Total Honoraires
                      </p>
                      <p className="text-lg font-black text-brand-anthracite">
                        {FORMATEUR_FCFA.format(statsPaiement.totalAcquis)} <span className="text-xs font-medium">FCFA</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {seancesEffectueesCount} séance(s) effectuée(s)
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border border-slate-200/80 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        Déjà Payé
                      </p>
                      <p className="text-lg font-black text-emerald-700">
                        {FORMATEUR_FCFA.format(statsPaiement.totalPaye)} <span className="text-xs font-medium">FCFA</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {statsPaiement.countPayees} séance(s) soldée(s)
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border border-slate-200/80 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        En Bordereau
                      </p>
                      <p className="text-lg font-black text-blue-700">
                        {FORMATEUR_FCFA.format(statsPaiement.totalProgramme)} <span className="text-xs font-medium">FCFA</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {statsPaiement.countProgrammees} séance(s) programmée(s)
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border border-slate-200/80 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase text-slate-400">
                        En Attente Décompte
                      </p>
                      <p className="text-lg font-black text-amber-700">
                        {FORMATEUR_FCFA.format(statsPaiement.totalEnAttente)} <span className="text-xs font-medium">FCFA</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {statsPaiement.countEnAttente} séance(s) à mandater
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Message informatif si séances en attente */}
              {statsPaiement.countEnAttente > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <span className="font-bold">
                      {statsPaiement.countEnAttente} séance(s) effectuée(s) d&rsquo;une valeur de {FORMATEUR_FCFA.format(statsPaiement.totalEnAttente)} FCFA
                    </span>{" "}
                    sont prêtes à être intégrées au prochain bordereau de décompte de rémunération de la session.
                  </div>
                </div>
              )}

              {/* Tableau des fiches de paie émises */}
              <Card className="overflow-hidden border border-slate-200/80 shadow-sm">
                <div className="border-b border-slate-200/80 bg-slate-50/50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-brand-anthracite">
                        Fiches de Paie & Règlements
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Historique des fiches individuelles issues des bordereaux de paie
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                      {fichesPaie?.length ?? 0} fiche(s)
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold text-xs tracking-wider uppercase">
                      <tr>
                        <th className="px-5 py-3.5">Référence Fiche / Bordereau</th>
                        <th className="px-5 py-3.5">Date de paiement</th>
                        <th className="px-5 py-3.5">Volume séances</th>
                        <th className="px-5 py-3.5">Montant net</th>
                        <th className="px-5 py-3.5">Statut</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {chargementFiches && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-sm text-slate-500"
                          >
                            Chargement des fiches de paie...
                          </td>
                        </tr>
                      )}
                      {!chargementFiches && (!fichesPaie || fichesPaie.length === 0) && (
                        <tr>
                          <td colSpan={6} className="p-10 text-center">
                            <Receipt
                              size={32}
                              className="mx-auto text-slate-300 mb-2"
                            />
                            <p className="text-sm font-semibold text-slate-700">
                              Aucune fiche de paie émise pour l&rsquo;instant
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Les fiches de paie sont générées automatiquement lors de la validation des bordereaux de décompte par la direction.
                            </p>
                          </td>
                        </tr>
                      )}
                      {fichesPaie?.map((fiche) => (
                        <tr
                          key={fiche.id}
                          className="hover:bg-amber-50/70 transition-colors duration-150 border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-brand-orange shrink-0" />
                              <div>
                                <p className="font-mono font-bold text-xs sm:text-sm text-brand-anthracite">
                                  {fiche.referenceBordereau || `FICHE-${fiche.id.slice(0, 8)}`}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  ID: {fiche.id.slice(0, 13)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Calendar size={13} className="text-slate-400" />
                              <span>
                                {fiche.datePaiement
                                  ? new Date(fiche.datePaiement).toLocaleDateString("fr-FR")
                                  : "-"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-semibold text-slate-700">
                              {fiche.nombreSeances} séance{fiche.nombreSeances > 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-black text-brand-anthracite">
                              {FORMATEUR_FCFA.format(fiche.montantTotal)} FCFA
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                                CLASSES_STATUT_FICHE_PAIE[fiche.statut] ??
                                "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {fiche.statut === "PAYEE" && <CheckCircle2 size={12} />}
                              {fiche.statut === "PROGRAMMEE" && <Clock size={12} />}
                              {LABELS_STATUT_FICHE_PAIE[fiche.statut] ?? fiche.statut}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              type="button"
                              variant="secondary"
                              className="text-xs h-8 px-2.5 font-bold inline-flex items-center gap-1"
                              onClick={() => setFicheDetailSelectionnee(fiche)}
                            >
                              <Eye size={13} />
                              Détail
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'édition du Nom & Prénom */}
      <Modal
        isOpen={editionNom}
        onClose={() => setEditionNom(false)}
        title="Modifier l'enseignant"
        description="Mise à jour de l'état civil de l'enseignant."
      >
        <form
          onSubmit={formNom.handleSubmit(onSubmitNom)}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Nom"
            error={formNom.formState.errors.nom?.message}
            {...formNom.register("nom")}
          />
          <Input
            label="Prénom"
            error={formNom.formState.errors.prenom?.message}
            {...formNom.register("prenom")}
          />
          {formNom.formState.errors.root && (
            <p className="text-xs font-bold text-red-600">
              {formNom.formState.errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditionNom(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={formNom.formState.isSubmitting}
            >
              {formNom.formState.isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal d'édition du Coût par Séance */}
      <Modal
        isOpen={editionCout}
        onClose={() => setEditionCout(false)}
        title="Modifier les honoraires"
        description="Montant forfaitaire versé par séance effectuée."
      >
        <form
          onSubmit={formCout.handleSubmit(onSubmitCout)}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Coût par séance (FCFA)"
            type="number"
            step="1"
            error={formCout.formState.errors.coutParSeance?.message}
            {...formCout.register("coutParSeance", { valueAsNumber: true })}
          />
          {formCout.formState.errors.root && (
            <p className="text-xs font-bold text-red-600">
              {formCout.formState.errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditionCout(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={formCout.formState.isSubmitting}
            >
              {formCout.formState.isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmation de Suppression */}
      <Modal
        isOpen={confirmationSuppression}
        onClose={() => setConfirmationSuppression(false)}
        title="Confirmer la suppression"
        description="Cette action est irréversible."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Êtes-vous sûr de vouloir supprimer définitivement le profil de{" "}
            <span className="font-bold text-brand-anthracite">
              {enseignant.prenom} {enseignant.nom}
            </span>{" "}
            (matricule: <code className="font-mono text-xs font-semibold">{enseignant.matricule}</code>) ?
          </p>
          <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800">
            Attention : la suppression sera bloquée par le système si l&rsquo;enseignant possède des séances ou affectations actives.
          </div>
          {supprimer.isError && (
            <p className="text-xs font-bold text-red-600">
              Échec de la suppression - vérifiez qu&rsquo;aucune affectation n&rsquo;y fait encore référence.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmationSuppression(false)}
            >
              Annuler
            </Button>
            <button
              type="button"
              onClick={confirmerSuppression}
              disabled={supprimer.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {supprimer.isPending ? "Suppression..." : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Détail Fiche de Paie Complète (avec séances, thèmes, impressions) */}
      <FichePaieModal
        ficheId={ficheDetailSelectionnee?.id || null}
        onClose={() => setFicheDetailSelectionnee(null)}
      />
    </div>
  );
}
