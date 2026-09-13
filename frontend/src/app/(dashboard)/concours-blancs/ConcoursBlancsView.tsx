"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Calendar,
  Clock,
  Plus,
  Building2,
  BookOpen,
  CheckCircle2,
  Layers,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";
import { useSessionActive, useCentres } from "@/modules/centres-sessions";
import { useFormations } from "@/modules/academique";
import { useMatieres } from "@/modules/matieres";
import { useDepartements } from "@/modules/departement";
import { useApprenants } from "@/modules/apprenants";
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
  ExporterBordereauModal,
} from "@/modules/concours-blancs";

interface ConcoursBlancsViewProps {
  userRole: string;
  userCentreId?: string | null;
  userDepartementId?: string | null;
  userId?: string;
}

export function ConcoursBlancsView({
  userRole,
  userCentreId,
  userDepartementId,
  userId,
}: ConcoursBlancsViewProps) {
  const router = useRouter();
  const { data: sessionActive } = useSessionActive();
  const { data: formations = [] } = useFormations();
  const { data: centres = [] } = useCentres();
  const { data: matieres = [] } = useMatieres();
  const { data: departements = [] } = useDepartements();
  const { data: apprenants = [] } = useApprenants();

  const estDA = userRole === "DIRECTEUR_ACADEMIQUE" || userRole === "DIRECTEUR";
  const estChefCentre = userRole === "CHEF_CENTRE";
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
      (cb) => cb.tousLesCentres || (cb.centreIds && cb.centreIds.includes(userCentreId)),
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
  const [concoursAModifier, setConcoursAModifier] = useState<ConcoursBlanc | null>(null);
  const [modalContenuOuvert, setModalContenuOuvert] = useState(false);
  const [epreuvePourContenu, setEpreuvePourContenu] = useState<EpreuveConcoursBlanc | null>(null);

  const [modalSaisieOuvert, setModalSaisieOuvert] = useState(false);
  const [formationSaisieId, setFormationSaisieId] = useState("");
  const [centreSaisieId, setCentreSaisieId] = useState(userCentreId || "");

  // Synchronisation du centre de saisie
  React.useEffect(() => {
    if (userCentreId && !estDA) {
      setCentreSaisieId(userCentreId);
    } else if (centresConcoursActif.length > 0) {
      if (!centreSaisieId || !centresConcoursActif.some((c) => c.id === centreSaisieId)) {
        setCentreSaisieId(centresConcoursActif[0].id);
      }
    }
  }, [userCentreId, estDA, centresConcoursActif, centreSaisieId]);

  const [modalExportOuvert, setModalExportOuvert] = useState(false);
  const [formationExportId, setFormationExportId] = useState<string>("");

  // Apprenants du centre actif pour la saisie des notes
  const apprenantsCentre = useMemo(() => {
    if (!centreSaisieId) return [];
    return apprenants.filter((a) => a.centreId === centreSaisieId);
  }, [apprenants, centreSaisieId]);

  const ouvrirSaisieNotes = (cbId: string, fId: string, cId?: string) => {
    if (estChefDept) return; // Protection absolue : les chefs de département ne remplissent pas les notes
    const targetCentre = cId && cId !== "TOUS" ? cId : centreSaisieId || userCentreId || "";
    router.push(
      `/concours-blancs/${cbId}/saisie?formationId=${fId}${targetCentre ? `&centreId=${targetCentre}` : ""}`,
    );
  };

  const ouvrirContenuEpreuve = (ep: EpreuveConcoursBlanc) => {
    setEpreuvePourContenu(ep);
    setModalContenuOuvert(true);
  };

  const centreConnecte = centres.find((c) => c.id === userCentreId);

  // Onglet actif : résultats consolidés ou épreuves par filière
  const [ongletActif, setOngletActif] = useState<"resultats" | "epreuves">("resultats");
  const [menuAdminOuvert, setMenuAdminOuvert] = useState(false);

  return (
    <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-5 p-4 sm:p-6">
      {/* ── En-tête Principal ── */}
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white shadow-xs">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Concours Blancs & Évaluations
              </h1>
              <p className="text-xs text-slate-500">
                Session {sessionActive?.annee?.toString() || "2025-2026"}
                {centreConnecte ? ` · Centre ${centreConnecte.nom}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Bouton de programmation réservé au DA */}
        {estDA && sessionActive && (
          <button
            type="button"
            onClick={() => {
              setConcoursAModifier(null);
              setModalProgrammerOuvert(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-orange/90 shadow-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus size={15} />
            <span>Nouveau Concours Blanc</span>
          </button>
        )}
      </div>

      {/* ── Sélecteur Épuré des Concours Blancs (Pills horizontaux) ── */}
      {concoursBlancs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {concoursBlancs.map((cb) => {
            const actif = (concoursActif?.id ?? "") === cb.id;
            return (
              <button
                key={cb.id}
                type="button"
                onClick={() => setConcoursActifId(cb.id)}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-left transition-all cursor-pointer shrink-0 ${
                  actif
                    ? "border-brand-orange bg-white shadow-xs ring-2 ring-brand-orange/20 text-slate-900"
                    : "border-slate-200 bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black ${
                    actif ? "bg-brand-orange text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {cb.numero}
                </span>
                <span className="text-xs font-bold">{cb.titre}</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-[9px] font-black uppercase ${
                    cb.statut === "PUBLIE"
                      ? "bg-emerald-100 text-emerald-800"
                      : cb.statut === "EN_COURS"
                        ? "bg-amber-100 text-amber-800"
                        : cb.statut === "CLOTURE"
                          ? "bg-slate-200 text-slate-800"
                          : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {cb.statut === "CLOTURE" ? "CLÔTURÉ" : cb.statut}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Contenu Principal ── */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          Chargement des concours blancs...
        </div>
      ) : !concoursActif ? (
        <div className="p-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Award size={32} className="mx-auto text-slate-300" />
          <p className="font-bold text-slate-600">Aucun concours blanc programmé pour cette session.</p>
          {estDA && (
            <button
              type="button"
              onClick={() => {
                setConcoursAModifier(null);
                setModalProgrammerOuvert(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange/90 cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Programmer le premier Concours Blanc</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Barre Contextuelle & Actions Unifiées (Zéro Redondance) ── */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Détails résumés du concours actif */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase ${
                  concoursActif.statut === "PUBLIE"
                    ? "bg-emerald-100 text-emerald-800"
                    : concoursActif.statut === "EN_COURS"
                      ? "bg-amber-100 text-amber-800"
                      : concoursActif.statut === "CLOTURE"
                        ? "bg-slate-200 text-slate-800"
                        : "bg-blue-100 text-blue-800"
                }`}
              >
                {concoursActif.statut === "CLOTURE" ? "CLÔTURÉ" : concoursActif.statut}
              </span>

              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Calendar size={13} className="text-brand-orange" />
                <span>
                  {new Date(concoursActif.dateEpreuve).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-slate-400 font-normal">
                  (Semaine {concoursActif.semaine} · S{concoursActif.seanceDebut} à S{concoursActif.seanceFin})
                </span>
              </span>

              <span className="text-slate-300">•</span>

              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                <Building2 size={12} className="text-brand-orange" />
                {concoursActif.tousLesCentres
                  ? "Tous les centres"
                  : `${concoursActif.centreIds?.length || 0} centre(s)`}
              </span>

              {concoursActif.saisieNotesBloqueeCentre ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                  <Lock size={11} />
                  Saisie centres verrouillée
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <Unlock size={11} />
                  Saisie centres ouverte
                </span>
              )}
            </div>

            {/* Action d'administration DA (zéro bouton superflu pour les autres rôles) */}
            <div className="flex items-center gap-2">
              {/* Menu d'Administration Réservé au DA */}
              {estDA && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuAdminOuvert(!menuAdminOuvert)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Gérer le concours</span>
                    <ChevronRight
                      size={13}
                      className={`transition-transform duration-200 ${menuAdminOuvert ? "rotate-90" : ""}`}
                    />
                  </button>

                  {/* Dropdown Menu compact */}
                  {menuAdminOuvert && (
                    <div
                      className="absolute right-0 top-full mt-1.5 z-30 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg space-y-0.5 text-xs"
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
                        <span>Modifier date, centres & matières</span>
                      </button>

                      <button
                        type="button"
                        disabled={verrouillerCentresMutation.isPending}
                        onClick={() => {
                          verrouillerCentresMutation.mutate({
                            id: concoursActif.id,
                            bloquer: !concoursActif.saisieNotesBloqueeCentre,
                            role: userRole,
                          });
                          setMenuAdminOuvert(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                      >
                        {concoursActif.saisieNotesBloqueeCentre ? (
                          <>
                            <Unlock size={13} className="text-emerald-600" />
                            <span>Déverrouiller saisie des centres</span>
                          </>
                        ) : (
                          <>
                            <Lock size={13} className="text-amber-600" />
                            <span>Verrouiller saisie des centres</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={compilerMutation.isPending}
                        onClick={() => {
                          compilerMutation.mutate({
                            id: concoursActif.id,
                            role: userRole,
                          });
                          setMenuAdminOuvert(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-brand-orange hover:bg-orange-50 font-bold text-left cursor-pointer"
                      >
                        <RefreshCw size={13} className={compilerMutation.isPending ? "animate-spin" : ""} />
                        <span>Recalculer les classements (Compiler)</span>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      {/* Statuts du concours */}
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
                          <span>Démarrer les épreuves (Passer EN COURS)</span>
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
                          <span>Rouvrir le concours (Passer PUBLIÉ)</span>
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
            </div>
          </div>

          {/* ── Deux Onglets Clairs : Résultats vs Épreuves ── */}
          <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setOngletActif("resultats")}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
                ongletActif === "resultats"
                  ? "border-brand-orange text-brand-orange font-black"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sparkles size={14} />
              <span>Palmarès & Résultats (Bordereau Consolidé)</span>
            </button>

            <button
              type="button"
              onClick={() => setOngletActif("epreuves")}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
                ongletActif === "epreuves"
                  ? "border-brand-orange text-brand-orange font-black"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers size={14} />
              <span>Matières & Sujets par Filière ({concoursActif.epreuves?.length || 0})</span>
            </button>
          </div>

          {/* ── Contenu Onglet 1 : Palmarès & Résultats ── */}
          {ongletActif === "resultats" && (
            <BordereauResultatsView
              concoursBlanc={concoursActif}
              formations={formations}
              centres={centresConcoursActif.length > 0 ? centresConcoursActif : centres}
              matieres={matieres}
              centreIdFiltre={userCentreId || undefined}
              verrouillerCentre={Boolean(userCentreId && !estDA)}
              role={userRole}
              userCentreId={userCentreId || undefined}
              onOuvrirExportModal={(fId) => {
                setFormationExportId(fId || "");
                setModalExportOuvert(true);
              }}
              onSaisieNotes={(fId, cId) => ouvrirSaisieNotes(concoursActif.id, fId, cId)}
            />
          )}

          {/* ── Contenu Onglet 2 : Épreuves & Sujets par Filière ── */}
          {ongletActif === "epreuves" && (
            <div className="space-y-4">
              {(!concoursActif.epreuves || concoursActif.epreuves.length === 0) ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-amber-200 space-y-2">
                  <p className="text-xs font-bold text-amber-900">
                    Aucune matière n&rsquo;est encore rattachée à ce concours blanc.
                  </p>
                  {estDA && (
                    <button
                      type="button"
                      onClick={() => {
                        setConcoursAModifier(concoursActif);
                        setModalProgrammerOuvert(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-3.5 py-1.5 text-xs font-bold text-white hover:bg-brand-orange/90 shadow-xs cursor-pointer"
                    >
                      <Pencil size={13} />
                      <span>Configurer les matières</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {formations.map((f) => {
                    const epreuvesFiliere = concoursActif.epreuves.filter(
                      (e) => e.formationId === f.id,
                    );
                    if (epreuvesFiliere.length === 0) return null;

                    return (
                      <div
                        key={f.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-black text-xs text-slate-900 uppercase">
                            {f.nom}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {epreuvesFiliere.length} matière{epreuvesFiliere.length > 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Liste des épreuves */}
                        <div className="space-y-1.5">
                          {epreuvesFiliere.map((ep) => {
                            const aContenu = Boolean(ep.contenuEvaluation);
                            const estMaMatiere = estChefDept && mesMatiereIds.has(ep.matiereId);
                            const peutEditer = estDA || estMaMatiere;
                            const depAssocie = departements.find((d) => d.matiereId === ep.matiereId);

                            return (
                              <button
                                key={ep.id}
                                type="button"
                                onClick={() => ouvrirContenuEpreuve(ep)}
                                className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                                  estMaMatiere
                                    ? "bg-amber-50/70 hover:bg-amber-100/80 border-amber-300 ring-1 ring-amber-200"
                                    : "bg-slate-50 hover:bg-orange-50/80 border-slate-200/60 hover:border-brand-orange/40"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {peutEditer ? (
                                    <BookOpen size={13} className="text-brand-orange shrink-0" />
                                  ) : (
                                    <Lock size={13} className="text-slate-400 shrink-0" />
                                  )}
                                  <div>
                                    <span className="font-bold text-xs text-slate-800 group-hover:text-brand-orange block">
                                      {ep.intitule}
                                    </span>
                                    {estChefDept && estMaMatiere && (
                                      <span className="text-[9px] font-bold text-amber-700 block">
                                        ★ Mon département
                                      </span>
                                    )}
                                    {estChefDept && !estMaMatiere && depAssocie && (
                                      <span className="text-[9px] text-slate-400 block font-medium">
                                        Dép. {depAssocie.nom}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500 font-semibold">
                                    {ep.dureeMinutes}m · coef {ep.coefficient}
                                  </span>
                                  <span
                                    className={`rounded-md px-1.5 py-0.2 text-[9px] font-black ${
                                      aContenu
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {aContenu ? "Sujet défini" : "À définir"}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            estDA || (estChefDept && mesMatiereIds.has(epreuvePourContenu.matiereId))
          }
          departementNom={
            departements.find((d) => d.matiereId === epreuvePourContenu.matiereId)?.nom
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
          centres={centresConcoursActif.length > 0 ? centresConcoursActif : centres}
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
