"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  Pencil,
  Trash2,
  AlertTriangle,
  Star,
  FileSpreadsheet,
} from "lucide-react";
import { useSessionActive, useCentres } from "@/modules/centres-sessions";
import { useFormations } from "@/modules/academique";
import { useMatieres } from "@/modules/matieres";
import { useDepartements } from "@/modules/departement";
import {
  useConcoursBlancs,
  useChangerStatutConcoursBlanc,
  useSupprimerConcoursBlanc,
  useVerrouillerSaisieCentres,
  useCompilerResultatsConcoursBlanc,
  type ConcoursBlanc,
  type EpreuveConcoursBlanc,
  ProgrammerConcoursBlancModal,
  ContenuEpreuveModal,
  BordereauResultatsView,
  SaisieNotesInlineView,
  ExporterBordereauModal,
} from "@/modules/concours-blancs";
import { messageErreurApi } from "@/shared/lib/api-client";

interface ConcoursBlancsViewProps {
  userRole: string;
  userCentreId?: string | null;
  userDepartementId?: string | null;
  userId?: string;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Date non définie";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function ConcoursBlancsView({
  userRole,
  userCentreId,
  userDepartementId,
  userId,
}: ConcoursBlancsViewProps) {
  const { data: sessionActive } = useSessionActive();
  const { data: formations = [] } = useFormations();
  const { data: centres = [] } = useCentres();
  const { data: matieres = [] } = useMatieres();
  const { data: departements = [] } = useDepartements();

  const estDA = userRole === "DIRECTEUR_ACADEMIQUE" || userRole === "DIRECTEUR";
  const estChefDept = userRole === "CHEF_DEPARTEMENT";

  // Départements dont l'utilisateur connecté est le chef
  const mesDepartements = useMemo(() => {
    if (!estChefDept) return [];
    return departements.filter(
      (d) =>
        (userId && d.chefId === userId) ||
        (userDepartementId && d.id === userDepartementId),
    );
  }, [departements, estChefDept, userId, userDepartementId]);

  const mesMatiereIds = useMemo(() => {
    return new Set(mesDepartements.map((d) => d.matiereId));
  }, [mesDepartements]);

  const { data: tousConcoursBlancs = [], isLoading } = useConcoursBlancs(
    sessionActive?.id,
    userRole,
    userCentreId || undefined,
  );
  const changerStatutMutation = useChangerStatutConcoursBlanc();
  const supprimerMutation = useSupprimerConcoursBlanc();
  const verrouillerCentresMutation = useVerrouillerSaisieCentres();
  const compilerMutation = useCompilerResultatsConcoursBlanc();

  // Filtrage selon le centre si utilisateur non-DA
  const concoursBlancs = useMemo(() => {
    if (estDA || !userCentreId) return tousConcoursBlancs;
    return tousConcoursBlancs.filter(
      (cb) =>
        cb.tousLesCentres ||
        (cb.centreIds && cb.centreIds.includes(userCentreId)),
    );
  }, [tousConcoursBlancs, estDA, userCentreId]);

  // Concours Blanc sélectionné pour la consultation
  const [concoursActifId, setConcoursActifId] = useState<string>("");
  const concoursActif = useMemo(() => {
    return (
      concoursBlancs.find((c) => c.id === concoursActifId) ||
      concoursBlancs[0] ||
      null
    );
  }, [concoursBlancs, concoursActifId]);

  // Centres participants au concours actif
  const centresConcoursActif = useMemo(() => {
    if (!concoursActif) return [];
    if (concoursActif.tousLesCentres) return centres;
    return centres.filter((c) => concoursActif.centreIds?.includes(c.id));
  }, [concoursActif, centres]);

  // Modales
  const [modalProgrammerOuvert, setModalProgrammerOuvert] = useState(false);
  const [concoursAModifier, setConcoursAModifier] =
    useState<ConcoursBlanc | null>(null);
  const [modalContenuOuvert, setModalContenuOuvert] = useState(false);
  const [epreuvePourContenu, setEpreuvePourContenu] =
    useState<EpreuveConcoursBlanc | null>(null);

  const [formationSaisieId, setFormationSaisieId] = useState("");
  const [centreSaisieId, setCentreSaisieId] = useState("");

  const effectiveCentreId = useMemo(() => {
    if (userCentreId && !estDA) return userCentreId;
    if (
      centreSaisieId &&
      centresConcoursActif.some((c) => c.id === centreSaisieId)
    ) {
      return centreSaisieId;
    }
    return centresConcoursActif[0]?.id || centres[0]?.id || "";
  }, [userCentreId, estDA, centreSaisieId, centresConcoursActif, centres]);

  const [modalExportOuvert, setModalExportOuvert] = useState(false);
  const [formationExportId, setFormationExportId] = useState<string>("");
  const [toastCompilation, setToastCompilation] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const ouvrirContenuEpreuve = (ep: EpreuveConcoursBlanc) => {
    setEpreuvePourContenu(ep);
    setModalContenuOuvert(true);
  };

  // Onglet actif : palmarès par défaut, ou saisie directe des notes
  const [ongletActif, setOngletActif] = useState<
    "resultats" | "saisie" | "epreuves"
  >("resultats");
  const [menuAdminOuvert, setMenuAdminOuvert] = useState(false);

  return (
    <div className="space-y-6">
      {/* ── En-tête Principal de la page ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Concours Blancs & Évaluations
            </h1>
            <span className="text-brand-orange rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold">
              Session {sessionActive?.annee || "En cours"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Organisation des sessions, saisie des notes par centre et palmarès consolidé.
          </p>
        </div>

        {estDA && sessionActive && (
          <button
            type="button"
            onClick={() => {
              setConcoursAModifier(null);
              setModalProgrammerOuvert(true);
            }}
            className="bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Concours Blanc</span>
          </button>
        )}
      </div>

      {/* ── Vue Master-Detail (comme les Bordereaux) ── */}
      {isLoading ? (
        <div className="flex flex-col lg:flex-row items-start gap-5">
          <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-3">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="animate-pulse space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-3 w-3/4 rounded bg-slate-200" />
            </div>
            <div className="animate-pulse space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-3 w-3/4 rounded bg-slate-200" />
            </div>
          </div>
          <div className="w-full flex-1 min-w-0 space-y-4">
            <div className="animate-pulse space-y-4 rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-6 w-1/3 rounded bg-slate-200" />
              <div className="h-4 w-1/2 rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ) : concoursBlancs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center">
          <div className="text-brand-orange mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Aucun concours blanc programmé pour cette session
          </h3>
          <p className="mt-1 mb-6 max-w-md text-sm text-slate-500">
            Programmez une session d&rsquo;évaluation pour définir les matières, coefficients, organiser le passage des épreuves et compiler les classements.
          </p>
          {estDA && (
            <button
              type="button"
              onClick={() => {
                setConcoursAModifier(null);
                setModalProgrammerOuvert(true);
              }}
              className="bg-brand-orange hover:bg-brand-orange/90 shadow-brand-orange/20 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Programmer le premier Concours Blanc</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-start gap-5">
          {/* Colonne de gauche : Liste des Concours Blancs */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-3">
            <h3 className="px-1 text-xs font-bold tracking-wider text-slate-400 uppercase">
              Concours Blancs ({concoursBlancs.length})
            </h3>

            <div className="space-y-2.5">
              {concoursBlancs.map((cb) => {
                const isSelected = concoursActif?.id === cb.id;
                const isPublie = cb.statut === "PUBLIE";
                const isEnCours = cb.statut === "EN_COURS";
                const isCloture = cb.statut === "CLOTURE";

                return (
                  <div
                    key={cb.id}
                    onClick={() => setConcoursActifId(cb.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-brand-orange bg-orange-50/50 shadow-2xs ring-1 ring-brand-orange"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {cb.titre || `Concours Blanc N°${cb.numero}`}
                      </span>
                      {isPublie ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                          Publié
                        </span>
                      ) : isEnCours ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          <Clock className="h-2.5 w-2.5 text-amber-600" />
                          En cours
                        </span>
                      ) : isCloture ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          <Lock className="h-2.5 w-2.5 text-slate-500" />
                          Clôturé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          Programmé
                        </span>
                      )}
                    </div>

                    <div className="mb-2 text-xs text-slate-500">
                      Épreuves : {formatDate(cb.dateEpreuve)} • Sem. {cb.semaine}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-xs">
                      <span className="text-slate-500">
                        {cb.tousLesCentres
                          ? "Tous les centres"
                          : `${cb.centreIds?.length || 0} centre(s)`}
                      </span>
                      <span className="font-medium text-slate-700">
                        {cb.epreuves?.length || 0} épreuve(s)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Colonne de droite : Concours Blanc Actif (Surface unifiée) */}
          {concoursActif && (
            <div className="w-full flex-1 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
              {/* 1. En-tête simplifié du Concours Blanc */}
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-mono text-base font-bold text-slate-900">
                        {concoursActif.titre || `Concours Blanc N°${concoursActif.numero}`}
                      </h2>
                      {concoursActif.statut === "PUBLIE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Résultats publiés
                        </span>
                      ) : concoursActif.statut === "EN_COURS" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          <Clock className="h-3 w-3 text-amber-600" />
                          Session en cours
                        </span>
                      ) : concoursActif.statut === "CLOTURE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          <Lock className="h-3 w-3 text-slate-500" />
                          Session clôturée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          Session programmée
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Épreuves déroulées le{" "}
                      <span className="font-medium text-slate-700">
                        {formatDate(concoursActif.dateEpreuve)}
                      </span>{" "}
                      • Semaine {concoursActif.semaine}
                    </p>
                  </div>

                  {/* Actions d'en-tête */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Menu Pilotage Session DA */}
                    {estDA && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setMenuAdminOuvert(!menuAdminOuvert)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                        >
                          <span>Pilotage</span>
                          <ChevronRight
                            size={12}
                            className={`transition-transform duration-200 ${
                              menuAdminOuvert ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        {menuAdminOuvert && (
                          <div
                            className="absolute right-0 top-full mt-1 z-30 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg space-y-0.5 text-xs"
                            onMouseLeave={() => setMenuAdminOuvert(false)}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setConcoursAModifier(concoursActif);
                                setModalProgrammerOuvert(true);
                                setMenuAdminOuvert(false);
                              }}
                              className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                            >
                              <Pencil size={13} className="text-slate-400" />
                              <span>Modifier dates & centres</span>
                            </button>

                            <button
                              type="button"
                              disabled={verrouillerCentresMutation.isPending}
                              onClick={() => {
                                verrouillerCentresMutation.mutate({
                                  id: concoursActif.id,
                                  bloquer:
                                    !concoursActif.saisieNotesBloqueeCentre,
                                  role: userRole,
                                });
                                setMenuAdminOuvert(false);
                              }}
                              className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                            >
                              {concoursActif.saisieNotesBloqueeCentre ? (
                                <>
                                  <Unlock
                                    size={13}
                                    className="text-emerald-600"
                                  />
                                  <span>Déverrouiller saisie des centres</span>
                                </>
                              ) : (
                                <>
                                  <Lock size={13} className="text-amber-600" />
                                  <span>Verrouiller saisie des centres</span>
                                </>
                              )}
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            {concoursActif.statut === "PROGRAMME" && (
                              <button
                                type="button"
                                onClick={() => {
                                  changerStatutMutation.mutate({
                                    id: concoursActif.id,
                                    statut: "EN_COURS",
                                  });
                                  setMenuAdminOuvert(false);
                                }}
                                className="w-full flex items-center gap-2 p-2 rounded-lg text-amber-800 hover:bg-amber-50 font-bold text-left cursor-pointer"
                              >
                                <CheckCircle2 size={13} />
                                <span>Démarrer les épreuves (EN COURS)</span>
                              </button>
                            )}

                            {concoursActif.statut === "EN_COURS" && (
                              <button
                                type="button"
                                onClick={() => {
                                  changerStatutMutation.mutate({
                                    id: concoursActif.id,
                                    statut: "PUBLIE",
                                  });
                                  setMenuAdminOuvert(false);
                                }}
                                className="w-full flex items-center gap-2 p-2 rounded-lg text-emerald-800 hover:bg-emerald-50 font-bold text-left cursor-pointer"
                              >
                                <CheckCircle2 size={13} />
                                <span>Publier les résultats</span>
                              </button>
                            )}

                            {concoursActif.statut === "PUBLIE" && (
                              <button
                                type="button"
                                onClick={() => {
                                  changerStatutMutation.mutate({
                                    id: concoursActif.id,
                                    statut: "CLOTURE",
                                  });
                                  setMenuAdminOuvert(false);
                                }}
                                className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-700 hover:bg-slate-100 font-bold text-left cursor-pointer"
                              >
                                <Lock size={13} />
                                <span>Clôturer définitivement</span>
                              </button>
                            )}

                            {concoursActif.statut === "CLOTURE" && (
                              <button
                                type="button"
                                onClick={() => {
                                  changerStatutMutation.mutate({
                                    id: concoursActif.id,
                                    statut: "PUBLIE",
                                  });
                                  setMenuAdminOuvert(false);
                                }}
                                className="w-full flex items-center gap-2 p-2 rounded-lg text-emerald-800 hover:bg-emerald-50 font-bold text-left cursor-pointer"
                              >
                                <Unlock size={13} />
                                <span>Rouvrir le concours (PUBLIÉ)</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              type="button"
                              disabled={supprimerMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Êtes-vous sûr de vouloir supprimer définitivement le « ${concoursActif.titre} » ainsi que toutes ses notes ?`,
                                  )
                                ) {
                                  supprimerMutation.mutate(concoursActif.id, {
                                    onSuccess: () => setConcoursActifId(""),
                                  });
                                  setMenuAdminOuvert(false);
                                }
                              }}
                              className="w-full flex items-center gap-2 p-2 rounded-lg text-red-700 hover:bg-red-50 font-bold text-left cursor-pointer"
                            >
                              <Trash2 size={13} />
                              <span>Supprimer ce concours</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bouton Recalculer / Compiler DA */}
                    {estDA && (
                      <button
                        type="button"
                        disabled={compilerMutation.isPending}
                        onClick={() => {
                          setToastCompilation(null);
                          compilerMutation.mutate(
                            { id: concoursActif.id, role: userRole },
                            {
                              onSuccess: () => {
                                setToastCompilation({
                                  type: "success",
                                  text: "Classements recalculés avec succès !",
                                });
                                setTimeout(
                                  () => setToastCompilation(null),
                                  5000,
                                );
                              },
                              onError: (err) => {
                                setToastCompilation({
                                  type: "error",
                                  text: messageErreurApi(
                                    err,
                                    "Erreur lors du recalcul des classements.",
                                  ),
                                });
                                setTimeout(
                                  () => setToastCompilation(null),
                                  5000,
                                );
                              },
                            },
                          );
                        }}
                        title="Recalculer les moyennes pondérées et les classements"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw
                          size={13}
                          className={
                            compilerMutation.isPending
                              ? "animate-spin text-brand-orange"
                              : "text-slate-500"
                          }
                        />
                        <span>Compiler</span>
                      </button>
                    )}

                    {/* Bouton Exporter */}
                    <button
                      type="button"
                      onClick={() => setModalExportOuvert(true)}
                      title="Imprimer ou exporter le bordereau"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      <FileSpreadsheet size={13} className="text-brand-orange" />
                      <span>Bordereau PDF</span>
                    </button>
                  </div>
                </div>

                {/* Synthèse globale en ligne (affichée une seule fois) */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-slate-600">
                    <div>
                      <span className="text-slate-400">Centres : </span>
                      <span className="font-semibold text-slate-800">
                        {concoursActif.tousLesCentres
                          ? "Tous les centres"
                          : `${concoursActif.centreIds?.length || 0} centre(s)`}
                      </span>
                    </div>
                    <span className="text-slate-200">•</span>
                    <div>
                      <span className="text-slate-400">Épreuves : </span>
                      <span className="font-semibold text-slate-800">
                        {concoursActif.epreuves?.length || 0} matière(s)
                      </span>
                    </div>
                    <span className="text-slate-200">•</span>
                    <div>
                      <span className="text-slate-400">État de la saisie : </span>
                      {concoursActif.saisieNotesBloqueeCentre ? (
                        <span className="font-semibold text-rose-700">
                          Verrouillée
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-700">
                          Ouverte
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Barre d'onglets de navigation métier */}
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 pt-1 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setOngletActif("resultats")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    ongletActif === "resultats"
                      ? "border-brand-orange text-brand-orange"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Sparkles size={13} />
                  <span>Consultation des résultats</span>
                </button>

                {!estChefDept && (
                  <button
                    type="button"
                    onClick={() => setOngletActif("saisie")}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      ongletActif === "saisie"
                        ? "border-brand-orange text-brand-orange"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Pencil size={13} />
                    <span>Saisie des notes</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setOngletActif("epreuves")}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    ongletActif === "epreuves"
                      ? "border-brand-orange text-brand-orange"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Layers size={13} />
                  <span>
                    Matières & Épreuves ({concoursActif.epreuves?.length || 0})
                  </span>
                </button>
              </div>

              {/* Toast info compilation */}
              {toastCompilation && (
                <div
                  className={`m-4 flex items-center gap-2 rounded-lg p-2.5 text-xs font-semibold ${
                    toastCompilation.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {toastCompilation.type === "success" ? (
                    <CheckCircle2
                      size={14}
                      className="shrink-0 text-emerald-600"
                    />
                  ) : (
                    <AlertTriangle
                      size={14}
                      className="shrink-0 text-red-600"
                    />
                  )}
                  <span>{toastCompilation.text}</span>
                </div>
              )}

              {/* 3. Corps selon l'onglet actif */}
              <div>
                {/* MODE 1 : Consultation des résultats */}
                {ongletActif === "resultats" && (
                  <BordereauResultatsView
                    concoursBlanc={concoursActif}
                    formations={formations}
                    centres={
                      centresConcoursActif.length > 0
                        ? centresConcoursActif
                        : centres
                    }
                    matieres={matieres}
                    formationIdActive={
                      formationSaisieId || formations[0]?.id
                    }
                    centreIdFiltre={effectiveCentreId}
                    verrouillerCentre={Boolean(userCentreId && !estDA)}
                    role={userRole}
                    userCentreId={userCentreId || undefined}
                    onOuvrirExportModal={(fId) => {
                      setFormationExportId(fId || "");
                      setModalExportOuvert(true);
                    }}
                    onSaisieNotes={(fId, cId) => {
                      if (fId) setFormationSaisieId(fId);
                      if (cId && cId !== "TOUS") setCentreSaisieId(cId);
                      setOngletActif("saisie");
                    }}
                  />
                )}

                {/* MODE 2 : Saisie des notes en ligne */}
                {ongletActif === "saisie" && !estChefDept && (
                  <SaisieNotesInlineView
                    concoursBlanc={concoursActif}
                    formationId={
                      formationSaisieId || formations[0]?.id || ""
                    }
                    centreId={effectiveCentreId}
                    centres={
                      centresConcoursActif.length > 0
                        ? centresConcoursActif
                        : centres
                    }
                    formations={formations}
                    userRole={userRole}
                    userCentreId={userCentreId || undefined}
                    onChangerFormation={(fId) => setFormationSaisieId(fId)}
                    onChangerCentre={(cId) => setCentreSaisieId(cId)}
                    onPasserConsultation={() => setOngletActif("resultats")}
                  />
                )}

                {/* MODE 3 : Matières & Épreuves */}
                {ongletActif === "epreuves" && (
                  <div className="p-5 space-y-4">
                    {!concoursActif.epreuves ||
                    concoursActif.epreuves.length === 0 ? (
                      <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 space-y-2">
                        <p className="text-xs font-medium text-slate-600">
                          Aucune matière n&rsquo;est encore rattachée à ce concours blanc.
                        </p>
                        {estDA && (
                          <button
                            type="button"
                            onClick={() => {
                              setConcoursAModifier(concoursActif);
                              setModalProgrammerOuvert(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-orange/90 cursor-pointer"
                          >
                            <Pencil size={13} />
                            <span>Configurer les matières</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formations.map((f) => {
                          const epreuvesFiliere =
                            concoursActif.epreuves.filter(
                              (e) => e.formationId === f.id,
                            );
                          if (epreuvesFiliere.length === 0) return null;

                          const totalCoef = epreuvesFiliere.reduce(
                            (acc, ep) => acc + (ep.coefficient || 1),
                            0,
                          );
                          const totalMinutes = epreuvesFiliere.reduce(
                            (acc, ep) => acc + (ep.dureeMinutes || 0),
                            0,
                          );
                          const heuresTotal = Math.floor(totalMinutes / 60);
                          const minutesReste = totalMinutes % 60;
                          const sujetsPrets = epreuvesFiliere.filter((ep) =>
                            Boolean(ep.contenuEvaluation),
                          ).length;
                          const toutPret =
                            sujetsPrets === epreuvesFiliere.length;

                          return (
                            <div
                              key={f.id}
                              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-slate-900">
                                    {f.nom}
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-600">
                                    {heuresTotal > 0
                                      ? `${heuresTotal}h${minutesReste > 0 ? `${minutesReste}m` : ""}`
                                      : `${minutesReste}m`}{" "}
                                    d&rsquo;épreuves
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-600 font-medium">
                                    Coef. total {totalCoef}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                      toutPret
                                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                                        : "text-amber-700 bg-amber-50 border border-amber-200/60"
                                    }`}
                                  >
                                    {sujetsPrets}/{epreuvesFiliere.length}{" "}
                                    sujets prêts
                                  </span>
                                </div>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                      <th className="px-4 py-2">Matière</th>
                                      <th className="px-3 py-2 text-center w-24">
                                        Durée
                                      </th>
                                      <th className="px-3 py-2 text-center w-20">
                                        Coef.
                                      </th>
                                      <th className="px-3 py-2 text-center w-20">
                                        Barème
                                      </th>
                                      <th className="px-3 py-2 text-center w-32">
                                        État du sujet
                                      </th>
                                      <th className="px-4 py-2 text-right w-28">
                                        Action
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {epreuvesFiliere.map((ep) => {
                                      const aContenu = Boolean(
                                        ep.contenuEvaluation,
                                      );
                                      const estMaMatiere =
                                        estChefDept &&
                                        mesMatiereIds.has(ep.matiereId);
                                      const peutEditer =
                                        estDA || estMaMatiere;
                                      const depAssocie = departements.find(
                                        (d) => d.matiereId === ep.matiereId,
                                      );

                                      return (
                                        <tr
                                          key={ep.id}
                                          className={`hover:bg-slate-50/70 transition-colors ${
                                            estMaMatiere
                                              ? "bg-amber-50/30"
                                              : ""
                                          }`}
                                        >
                                          <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-slate-900">
                                                {ep.intitule}
                                              </span>
                                              {estChefDept && estMaMatiere && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                                                  <Star
                                                    size={10}
                                                    className="fill-amber-600 text-amber-600"
                                                  />
                                                  Mon département
                                                </span>
                                              )}
                                              {depAssocie && !estMaMatiere && (
                                                <span className="text-[11px] text-slate-400">
                                                  ({depAssocie.nom})
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2.5 text-center text-slate-600 tabular-nums font-mono">
                                            {ep.dureeMinutes} min
                                          </td>
                                          <td className="px-3 py-2.5 text-center text-slate-800 font-bold tabular-nums font-mono">
                                            {ep.coefficient}
                                          </td>
                                          <td className="px-3 py-2.5 text-center text-slate-600 tabular-nums font-mono">
                                            /{ep.noteMax}
                                          </td>
                                          <td className="px-3 py-2.5 text-center">
                                            {aContenu ? (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                                                <CheckCircle2 size={11} />
                                                Prêt
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                En attente
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                ouvrirContenuEpreuve(ep)
                                              }
                                              className={`text-xs font-semibold hover:underline cursor-pointer ${
                                                peutEditer
                                                  ? "text-brand-orange font-bold"
                                                  : "text-slate-600"
                                              }`}
                                            >
                                              {peutEditer
                                                ? aContenu
                                                  ? "Modifier"
                                                  : "Renseigner"
                                                : "Consulter"}
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modales ── */}
      {sessionActive && (
        <ProgrammerConcoursBlancModal
          isOpen={modalProgrammerOuvert}
          onClose={() => {
            setModalProgrammerOuvert(false);
            setConcoursAModifier(null);
          }}
          sessionId={sessionActive.id}
          formations={formations}
          matieres={matieres}
          centres={centres}
          concoursBlancAModifier={concoursAModifier}
          dernierNumero={concoursBlancs.length}
        />
      )}

      {concoursActif && epreuvePourContenu && (
        <ContenuEpreuveModal
          isOpen={modalContenuOuvert}
          onClose={() => {
            setModalContenuOuvert(false);
            setEpreuvePourContenu(null);
          }}
          concoursBlancId={concoursActif.id}
          concoursBlancTitre={concoursActif.titre}
          epreuve={epreuvePourContenu}
          toutesLesEpreuves={concoursActif.epreuves.filter(
            (e) => e.formationId === epreuvePourContenu.formationId,
          )}
          mesMatiereIds={mesMatiereIds}
          peutEditer={
            estDA ||
            (estChefDept &&
              mesMatiereIds.has(epreuvePourContenu.matiereId))
          }
          departementNom={
            departements.find(
              (d) => d.matiereId === epreuvePourContenu.matiereId,
            )?.nom
          }
          estChefDept={estChefDept}
          role={userRole}
          departementId={userDepartementId || mesDepartements[0]?.id}
        />
      )}

      {concoursActif && formations.length > 0 && (
        <ExporterBordereauModal
          isOpen={modalExportOuvert}
          onClose={() => setModalExportOuvert(false)}
          concoursBlanc={concoursActif}
          formations={formations}
          centres={
            centresConcoursActif.length > 0 ? centresConcoursActif : centres
          }
          formationIdActive={formationExportId || formations[0]?.id || ""}
          centreIdFiltre={userCentreId || undefined}
          sessionAnnee={sessionActive?.annee?.toString() || "2026"}
          role={userRole}
          userCentreId={userCentreId || undefined}
        />
      )}
    </div>
  );
}
