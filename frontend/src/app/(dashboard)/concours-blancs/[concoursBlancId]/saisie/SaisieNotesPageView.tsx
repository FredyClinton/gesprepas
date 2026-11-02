"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Lock,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Card, Button } from "@/shared/ui";
import { useCentres } from "@/modules/centres-sessions";
import { useFormations, SelecteurEtablissement } from "@/modules/academique";
import { useApprenants, type Apprenant } from "@/modules/apprenants";
import {
  useConcoursBlanc,
  useResultatsConcoursBlanc,
  useEnregistrerNotesConcoursBlanc,
} from "@/modules/concours-blancs/hooks/useConcoursBlancs";
import type {
  CandidatNotesInput,
  StatutNote,
} from "@/modules/concours-blancs/types/concours-blanc.types";
import { messageErreurApi } from "@/shared/lib/api-client";

interface Props {
  concoursBlancId: string;
  initialFormationId?: string;
  initialCentreId?: string;
  userRole: string;
  userCentreId?: string;
}

export function SaisieNotesPageView({
  concoursBlancId,
  initialFormationId,
  initialCentreId,
  userRole,
  userCentreId,
}: Props) {
  const router = useRouter();
  const estDA = userRole === "DIRECTEUR_ACADEMIQUE" || userRole === "DIRECTEUR";

  const { data: concoursBlanc, isLoading: chargementCB } = useConcoursBlanc(
    concoursBlancId,
    userRole,
    userCentreId,
  );
  const { data: centres = [] } = useCentres();
  const { data: formations = [] } = useFormations();
  const { data: apprenants = [] } = useApprenants();

  // Centre sélectionné
  const [centreId, setCentreId] = useState<string>(
    initialCentreId || userCentreId || centres[0]?.id || "",
  );

  // Formation sélectionnée
  const [formationId, setFormationId] = useState<string>(
    initialFormationId || formations[0]?.id || "",
  );

  // Synchronisation initiale dès que les listes chargent
  useEffect(() => {
    if (!centreId && centres.length > 0) {
      setCentreId(userCentreId || centres[0].id);
    }
  }, [centres, centreId, userCentreId]);

  useEffect(() => {
    if (!formationId && formations.length > 0) {
      setFormationId(formations[0].id);
    }
  }, [formations, formationId]);

  const centreActif = centres.find((c) => c.id === centreId);
  const formationActive = formations.find((f) => f.id === formationId);

  // Épreuves pour la formation active
  const epreuves = useMemo(() => {
    if (!concoursBlanc?.epreuves) return [];
    return concoursBlanc.epreuves.filter((e) => e.formationId === formationId);
  }, [concoursBlanc, formationId]);

  // Statuts de verrouillage
  const estCloture = concoursBlanc?.statut === "CLOTURE";
  const estVerrouille =
    estCloture || Boolean(concoursBlanc?.saisieNotesBloqueeCentre && !estDA);

  // Résultats existants
  const { data: resultatsExistants = [], isLoading: chargementResultats } =
    useResultatsConcoursBlanc(
      concoursBlancId,
      centreId,
      formationId,
      userRole,
      userCentreId,
    );

  const enregistrerMutation = useEnregistrerNotesConcoursBlanc();

  // Lignes de saisie des notes
  const [lignes, setLignes] = useState<CandidatNotesInput[]>([]);
  const [sauvegardeSucces, setSauvegardeSucces] = useState(false);
  const [estModifie, setEstModifie] = useState(false);
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);

  // Détection exhaustive des notes hors barème (< 0 ou > noteMax de l'épreuve)
  const notesHorsBareme = useMemo(() => {
    const mapEpreuves = new Map(epreuves.map((e) => [e.id, e]));
    const invalides: {
      candidatNom: string;
      epreuveIntitule: string;
      note: number;
      noteMax: number;
    }[] = [];

    for (const cand of lignes) {
      for (const n of cand.notes) {
        if (n.statut === "NOTE" && n.note !== null && n.note !== undefined) {
          const ep = mapEpreuves.get(n.epreuveId);
          if (ep && (n.note < 0 || n.note > ep.noteMax)) {
            invalides.push({
              candidatNom: cand.nomComplet,
              epreuveIntitule: ep.intitule,
              note: n.note,
              noteMax: ep.noteMax,
            });
          }
        }
      }
    }
    return invalides;
  }, [lignes, epreuves]);

  // Outils d'ajout
  const [rechercheApprenant, setRechercheApprenant] = useState("");
  const [nouveauNomHorsListe, setNouveauNomHorsListe] = useState("");
  const [etablissementHorsListe, setEtablissementHorsListe] = useState("");

  // Filtre d'affichage
  const [filtreTableau, setFiltreTableau] = useState<"TOUS" | "INCOMPLETS" | "ABSENTS">("TOUS");
  const [rechercheTableau, setRechercheTableau] = useState("");
  const [panneauAjoutOuvert, setPanneauAjoutOuvert] = useState(false);

  // Apprenants du centre
  const apprenantsCentre = useMemo(() => {
    if (!centreId) return [];
    return apprenants.filter(
      (a) =>
        a.centreId === centreId &&
        (!formationId || a.formationId === formationId) &&
        (!concoursBlanc?.sessionId || a.sessionId === concoursBlanc.sessionId),
    );
  }, [apprenants, centreId, formationId, concoursBlanc?.sessionId]);

  // Initialisation des lignes
  useEffect(() => {
    if (!concoursBlanc) return;

    if (resultatsExistants && resultatsExistants.length > 0) {
      const initLignes: CandidatNotesInput[] = resultatsExistants.map((r) => {
        const candidatApprenant = apprenants.find((a) => a.id === r.apprenantId);
        return {
          id: r.id,
          formationId: r.formationId || formationId,
          apprenantId: r.apprenantId,
          nomComplet: r.nomComplet,
          etablissementOrigine:
            r.etablissementOrigine || candidatApprenant?.etablissementOrigine || "",
          horsListe: !r.apprenantId,
          notes: epreuves.map((ep) => {
            const n = r.notes.find((note) => note.epreuveId === ep.id);
            return {
              epreuveId: ep.id,
              note: n?.note !== null && n?.note !== undefined ? n.note : null,
              statut: (n?.statut as StatutNote) || "NOTE",
            };
          }),
        };
      });
      initLignes.sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }));
      setLignes(initLignes);
      setEstModifie(false);
    } else {
      // Préremplissage avec les apprenants du centre inscrits dans cette formation triés alphabétiquement
      const initLignes: CandidatNotesInput[] = apprenantsCentre.map((a) => ({
        formationId: a.formationId || formationId,
        apprenantId: a.id,
        nomComplet: `${a.nom} ${a.prenom}`.trim(),
        etablissementOrigine: a.etablissementOrigine || "",
        horsListe: false,
        notes: epreuves.map((ep) => ({
          epreuveId: ep.id,
          note: null,
          statut: "NOTE" as StatutNote,
        })),
      }));
      initLignes.sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }));
      setLignes(initLignes);
      setEstModifie(false);
    }
  }, [concoursBlanc, resultatsExistants, epreuves, apprenantsCentre, apprenants, formationId]);

  // Suggestions pour ajout d'élève déjà inscrit
  const apprenantsSuggeres = useMemo(() => {
    if (!rechercheApprenant.trim()) return [];
    const q = rechercheApprenant.trim().toLowerCase();
    const dejaPresents = new Set(lignes.map((l) => l.apprenantId).filter(Boolean));
    return apprenants
      .filter((a) => !dejaPresents.has(a.id))
      .filter(
        (a) =>
          a.nom.toLowerCase().includes(q) ||
          a.prenom.toLowerCase().includes(q) ||
          (a.etablissementOrigine && a.etablissementOrigine.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [rechercheApprenant, lignes, apprenants]);

  const ajouterApprenant = (a: Apprenant) => {
    setLignes((prev) => {
      const next = [
        ...prev,
        {
          formationId: a.formationId || formationId,
          apprenantId: a.id,
          nomComplet: `${a.nom} ${a.prenom}`.trim(),
          etablissementOrigine: a.etablissementOrigine || "",
          horsListe: false,
          notes: epreuves.map((ep) => ({
            epreuveId: ep.id,
            note: null,
            statut: "NOTE" as StatutNote,
          })),
        },
      ];
      next.sort((x, y) => x.nomComplet.localeCompare(y.nomComplet, "fr", { sensitivity: "base" }));
      return next;
    });
    setRechercheApprenant("");
    setEstModifie(true);
  };

  const ajouterCandidatHorsListe = () => {
    const nom = nouveauNomHorsListe.trim();
    if (!nom) return;

    setLignes((prev) => {
      const next = [
        ...prev,
        {
          formationId: formationId,
          nomComplet: nom,
          etablissementOrigine: etablissementHorsListe.trim() || undefined,
          horsListe: true,
          notes: epreuves.map((ep) => ({
            epreuveId: ep.id,
            note: null,
            statut: "NOTE" as StatutNote,
          })),
        },
      ];
      next.sort((x, y) => x.nomComplet.localeCompare(y.nomComplet, "fr", { sensitivity: "base" }));
      return next;
    });
    setNouveauNomHorsListe("");
    setEtablissementHorsListe("");
    setEstModifie(true);
  };

  const supprimerLigne = (idxASupprimer: number) => {
    setLignes((prev) => prev.filter((_, idx) => idx !== idxASupprimer));
    setEstModifie(true);
  };

  const basculerTousAbsents = (candidatIdx: number) => {
    setLignes((prev) => {
      const next = [...prev];
      const c = { ...next[candidatIdx] };
      const estDejaTousAbs = c.notes.length > 0 && c.notes.every((n) => n.statut === "ABS");
      c.notes = c.notes.map((n) => ({
        ...n,
        statut: estDejaTousAbs ? "NOTE" : "ABS",
        note: null,
      }));
      next[candidatIdx] = c;
      return next;
    });
    setEstModifie(true);
  };

  const handleNoteChange = (
    candidatIdx: number,
    epreuveId: string,
    valeur: string | number,
    statut: StatutNote = "NOTE",
  ) => {
    setErreurValidation(null);
    setLignes((prev) => {
      const next = [...prev];
      const c = { ...next[candidatIdx] };
      const notes = [...c.notes];
      const nIdx = notes.findIndex((n) => n.epreuveId === epreuveId);

      const parsedNote: number | null =
        statut === "NOTE"
          ? valeur === "" || Number.isNaN(Number(valeur))
            ? null
            : Number(valeur)
          : null;

      if (nIdx >= 0) {
        notes[nIdx] = { epreuveId, note: parsedNote, statut };
      } else {
        notes.push({ epreuveId, note: parsedNote, statut });
      }

      c.notes = notes;
      next[candidatIdx] = c;
      return next;
    });
    setEstModifie(true);
    setSauvegardeSucces(false);
  };

  const toggleStatutAbsent = (candidatIdx: number, epreuveId: string) => {
    if (estVerrouille) return;
    const cand = lignes[candidatIdx];
    const n = cand?.notes.find((note) => note.epreuveId === epreuveId);
    const nouveauStatut: StatutNote = n?.statut === "ABS" ? "NOTE" : "ABS";
    handleNoteChange(candidatIdx, epreuveId, "", nouveauStatut);
  };

  const handleEnregistrer = useCallback(async () => {
    if (estVerrouille || !concoursBlanc || enregistrerMutation.isPending) return;

    // Blocage strict si des notes sont hors barème
    if (notesHorsBareme.length > 0) {
      setErreurValidation(
        `Validation impossible : ${notesHorsBareme.length} note(s) hors barème détectée(s). Les notes doivent être comprises entre 0 et le barème maximal autorisé.`,
      );
      return;
    }

    setErreurValidation(null);
    try {
      const resultatsEnregistres = await enregistrerMutation.mutateAsync({
        id: concoursBlanc.id,
        payload: {
          centreId,
          candidats: lignes,
        },
        role: userRole,
        userCentreId,
      });
      if (resultatsEnregistres && resultatsEnregistres.length > 0) {
        const majLignes: CandidatNotesInput[] = resultatsEnregistres.map((r) => {
          const candidatApprenant = apprenants.find((a) => a.id === r.apprenantId);
          return {
            id: r.id,
            formationId: r.formationId || formationId,
            apprenantId: r.apprenantId,
            nomComplet: r.nomComplet,
            etablissementOrigine:
              r.etablissementOrigine || candidatApprenant?.etablissementOrigine || "",
            horsListe: !r.apprenantId,
            notes: epreuves.map((ep) => {
              const n = r.notes.find((note) => note.epreuveId === ep.id);
              return {
                epreuveId: ep.id,
                note: n?.note !== null && n?.note !== undefined ? n.note : null,
                statut: (n?.statut as StatutNote) || "NOTE",
              };
            }),
          };
        });
        majLignes.sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }));
        setLignes(majLignes);
      }
      setSauvegardeSucces(true);
      setEstModifie(false);
      setTimeout(() => setSauvegardeSucces(false), 4000);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement des notes", err);
      setErreurValidation(messageErreurApi(err, "Erreur lors de l'enregistrement des notes."));
    }
  }, [
    estVerrouille,
    concoursBlanc,
    notesHorsBareme,
    centreId,
    userRole,
    userCentreId,
    lignes,
    enregistrerMutation,
    apprenants,
    formationId,
    epreuves,
  ]);

  // Raccourci clavier Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void handleEnregistrer();
      }
    };
    window.addEventListener("keydown", handleKeyDownGlobal);
    return () => window.removeEventListener("keydown", handleKeyDownGlobal);
  }, [handleEnregistrer]);

  // Statistiques en direct
  const stats = useMemo(() => {
    const totalCandidats = lignes.length;
    let totalNotesSaisies = 0;
    const totalNotesAttendues = totalCandidats * epreuves.length;
    let totalCandidatsAbsents = 0;

    for (const lig of lignes) {
      const estToutAbsent =
        lig.notes.length > 0 &&
        lig.notes.every((n) => n.statut === "ABS");
      if (estToutAbsent) {
        totalCandidatsAbsents += 1;
      }
      for (const n of lig.notes) {
        if (n.statut === "ABS") {
          totalNotesSaisies += 1;
        } else if (n.statut === "NOTE" && n.note !== null && n.note !== undefined) {
          totalNotesSaisies += 1;
        }
      }
    }

    const totalCandidatsPresents = totalCandidats - totalCandidatsAbsents;
    const nbIncomplets = lignes.filter((lig) =>
      lig.notes.some((n) => n.statut === "NOTE" && (n.note === null || n.note === undefined))
    ).length;
    const pourcentage =
      totalNotesAttendues > 0
        ? Math.round((totalNotesSaisies / totalNotesAttendues) * 100)
        : 0;

    return {
      totalCandidats,
      totalCandidatsPresents,
      totalCandidatsAbsents,
      totalNotesSaisies,
      totalNotesAttendues,
      pourcentage,
      nbIncomplets,
    };
  }, [lignes, epreuves]);

  // Filtrage des lignes pour l'affichage
  const lignesFiltrees = useMemo(() => {
    return lignes
      .map((lig, idxOriginal) => ({ ...lig, idxOriginal }))
      .filter((lig) => {
        if (rechercheTableau.trim()) {
          const q = rechercheTableau.trim().toLowerCase();
          const matchNom = lig.nomComplet.toLowerCase().includes(q);
          const matchEtab = lig.etablissementOrigine?.toLowerCase().includes(q);
          if (!matchNom && !matchEtab) return false;
        }

        if (filtreTableau === "ABSENTS") {
          return lig.notes.length > 0 && lig.notes.every((n) => n.statut === "ABS");
        }

        if (filtreTableau === "INCOMPLETS") {
          return lig.notes.some((n) => n.statut === "NOTE" && (n.note === null || n.note === undefined));
        }

        return true;
      });
  }, [lignes, rechercheTableau, filtreTableau]);

  if (chargementCB) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Chargement de la feuille de notation...
        </p>
      </div>
    );
  }

  if (!concoursBlanc) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <Card className="p-8">
          <p className="text-base font-bold text-slate-800">
            Concours blanc introuvable.
          </p>
          <Link
            href="/concours-blancs"
            className="text-brand-orange mt-4 inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
          >
            <ArrowLeft size={14} />
            Retour à la liste des concours blancs
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── En-tête Contextuel Unique (Sticky) ── */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs space-y-2.5">
        {/* Ligne 1 : Breadcrumb & Titre & Statut */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/concours-blancs"
              className="text-slate-500 hover:text-brand-orange flex items-center gap-1 font-semibold transition-colors"
            >
              <ArrowLeft size={13} />
              Concours Blancs
            </Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-700 font-bold">{concoursBlanc.titre}</span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-brand-orange font-bold">Feuille de notation</span>

            {estCloture ? (
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                Clôturé
              </span>
            ) : concoursBlanc.saisieNotesBloqueeCentre ? (
              <span className="ml-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 flex items-center gap-1">
                <Lock size={10} />
                Verrouillé centres
              </span>
            ) : (
              <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Saisie ouverte
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            {notesHorsBareme.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-300 animate-pulse">
                <AlertTriangle size={12} className="text-rose-600" />
                {notesHorsBareme.length} note(s) hors barème
              </span>
            ) : estModifie && !estVerrouille ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Modifié non enregistré (Ctrl+S)
              </span>
            ) : null}
            {sauvegardeSucces && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Enregistré !
              </span>
            )}
          </div>
        </div>

        {/* Ligne 2 : Sélecteurs Contextuels (Centre & Filière) + Progression */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Centre d'examen */}
            <div className="flex items-center gap-1.5">
              <Building2 size={14} className="text-brand-orange shrink-0" />
              {centres.length > 1 && estDA ? (
                <select
                  value={centreId}
                  onChange={(e) => {
                    setCentreId(e.target.value);
                    router.push(
                      `/concours-blancs/${concoursBlancId}/saisie?formationId=${formationId}&centreId=${e.target.value}`,
                    );
                  }}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange focus:bg-white cursor-pointer"
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-bold text-slate-800">
                  {centreActif?.nom || "Centre non spécifié"}
                </span>
              )}
            </div>

            <span className="text-slate-200 hidden sm:inline">|</span>

            {/* Filières (pills compactes) */}
            <div className="flex items-center gap-1.5">
              <GraduationCap size={14} className="text-brand-orange shrink-0" />
              <div className="flex flex-wrap gap-1">
                {formations.map((f) => {
                  const estActive = f.id === formationId;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setFormationId(f.id);
                        router.push(
                          `/concours-blancs/${concoursBlancId}/saisie?formationId=${f.id}&centreId=${centreId}`,
                        );
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        estActive
                          ? "bg-brand-orange text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                      }`}
                    >
                      {f.nom}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Progression compacte */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0 text-xs">
            <span className="text-[11px] font-semibold text-slate-500">
              Progression : <strong className="text-slate-900 font-bold">{stats.totalNotesSaisies}/{stats.totalNotesAttendues}</strong> ({stats.pourcentage}%)
            </span>
            <div className="w-24 sm:w-32 h-1.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/50">
              <div
                className="h-full bg-brand-orange rounded-full transition-all duration-300"
                style={{ width: `${stats.pourcentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

        {/* ── Alerte Verrouillage ── */}
        {estVerrouille && (
          <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-900">
            <Lock size={18} className="text-red-600 shrink-0" />
            <div>
              {estCloture
                ? "Ce concours blanc est définitivement clôturé. Les notes sont consultables en lecture seule."
                : "La saisie des notes est actuellement verrouillée pour les centres par la Direction Académique. Seul le Directeur Académique dispose du droit de modification."}
            </div>
          </div>
        )}

        {/* ── Bannière d'Alerte Notes Hors Barème ── */}
        {(notesHorsBareme.length > 0 || erreurValidation) && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-2xs">
            <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                {erreurValidation ||
                  `${notesHorsBareme.length} note(s) hors barème détectée(s) — Validation et enregistrement bloqués`}
              </p>
              {notesHorsBareme.length > 0 && (
                <ul className="list-disc pl-4 text-[11px] text-rose-800 space-y-0.5">
                  {notesHorsBareme.slice(0, 5).map((inv, i) => (
                    <li key={i}>
                      <span className="font-semibold">{inv.candidatNom}</span> : note de{" "}
                      <strong>{inv.note}</strong> en <em>{inv.epreuveIntitule}</em> (barème autorisé : 0 à {inv.noteMax})
                    </li>
                  ))}
                  {notesHorsBareme.length > 5 && (
                    <li>... et {notesHorsBareme.length - 5} autre(s) note(s) hors barème</li>
                  )}
                </ul>
              )}
              <p className="text-[11px] font-medium text-rose-700">
                Veuillez corriger chaque note hors barème pour autoriser l&apos;enregistrement de la feuille.
              </p>
            </div>
          </div>
        )}

      {/* ── Alerte si aucune épreuve configurée ── */}
      {epreuves.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-amber-300 bg-amber-50/50">
          <AlertTriangle size={36} className="mx-auto text-amber-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Aucune épreuve configurée pour la filière {formationActive?.nom || ""}
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 mb-5">
            Pour pouvoir saisir les notes, vous devez d&rsquo;abord ajouter et paramétrer les matières et épreuves de ce concours blanc.
          </p>
          <Link href="/concours-blancs">
            <Button type="button">
              <span className="flex items-center gap-1.5 text-xs font-bold">
                Configurer les épreuves dans le Concours Blanc
              </span>
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* ── Barre d'outils unifiée et minimaliste ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            {/* Filtres de statut des notes */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => setFiltreTableau("TOUS")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filtreTableau === "TOUS"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tous ({lignes.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltreTableau("INCOMPLETS")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filtreTableau === "INCOMPLETS"
                    ? "bg-white text-amber-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Notes manquantes ({stats.nbIncomplets})
              </button>
              <button
                type="button"
                onClick={() => setFiltreTableau("ABSENTS")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filtreTableau === "ABSENTS"
                    ? "bg-white text-rose-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Absents ({stats.totalCandidatsAbsents})
              </button>
            </div>

            {/* Recherche & Action d'ajout */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-60">
                <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={rechercheTableau}
                  onChange={(e) => setRechercheTableau(e.target.value)}
                  placeholder="Filtrer dans la liste..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-brand-orange focus:bg-white shadow-2xs"
                />
              </div>

              {!estVerrouille && (
                <button
                  type="button"
                  onClick={() => setPanneauAjoutOuvert(!panneauAjoutOuvert)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                    panneauAjoutOuvert
                      ? "border-brand-orange bg-orange-50 text-brand-orange"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <UserPlus size={13} />
                  <span>{panneauAjoutOuvert ? "Fermer" : "Ajouter candidat"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Tiroir / Zone d'ajout contextuel compact */}
          {!estVerrouille && panneauAjoutOuvert && (
            <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
              {/* 1. Recherche élève centre */}
              <div className="relative w-full lg:w-80">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                  <Search size={13} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={rechercheApprenant}
                    onChange={(e) => setRechercheApprenant(e.target.value)}
                    placeholder="Ajouter élève du centre..."
                    className="w-full outline-none text-slate-800 placeholder-slate-400 bg-transparent font-medium"
                  />
                  {rechercheApprenant && (
                    <button
                      type="button"
                      onClick={() => setRechercheApprenant("")}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {apprenantsSuggeres.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl z-40 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {apprenantsSuggeres.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => ajouterApprenant(a)}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-orange-50 flex items-center justify-between group cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {a.nom} {a.prenom}
                          </span>
                          {a.etablissementOrigine && (
                            <span className="text-[11px] text-slate-500 block">
                              {a.etablissementOrigine}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-brand-orange font-bold group-hover:underline">
                          + Ajouter
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Candidat hors-liste */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                <input
                  type="text"
                  value={nouveauNomHorsListe}
                  onChange={(e) => setNouveauNomHorsListe(e.target.value)}
                  placeholder="Nom candidat libre..."
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-800 outline-none w-full sm:w-48 focus:border-brand-orange shadow-2xs"
                />

                <div className="w-full sm:w-56">
                  <SelecteurEtablissement
                    value={etablissementHorsListe}
                    onChange={setEtablissementHorsListe}
                    placeholder="Lycée d'origine..."
                    variant="compact"
                  />
                </div>

                <button
                  type="button"
                  onClick={ajouterCandidatHorsListe}
                  disabled={!nouveauNomHorsListe.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-orange px-3.5 py-1.5 font-bold text-white hover:bg-brand-orange/90 transition-all cursor-pointer disabled:opacity-40 shrink-0 shadow-2xs"
                >
                  <Plus size={13} />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Grille de Notation Plein Écran (Tableau Type Tableur Excel-like) ── */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="overflow-x-auto max-h-[75vh]">
              <table className="w-full border-collapse text-left text-xs">
                {/* En-tête Sticky */}
                <thead className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-xs text-slate-700 border-b border-slate-200 shadow-2xs">
                  <tr>
                    {/* Colonne 1 : N° (Sticky Left) */}
                    <th className="sticky left-0 z-20 bg-slate-50/95 py-3 px-3 w-12 text-center font-bold text-slate-500">
                      N°
                    </th>

                    {/* Colonne 2 : Candidat (Sticky Left) */}
                    <th className="sticky left-12 z-20 bg-slate-50/95 py-3 px-4 min-w-[260px] font-bold text-slate-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                      Nom & Prénom du Candidat
                    </th>

                    {/* Colonne 3 : Établissement d'origine */}
                    <th className="py-3 px-4 min-w-[200px] font-bold text-slate-700">
                      Établissement d&rsquo;origine
                    </th>

                    {/* Colonnes dynamiques des Épreuves */}
                    {epreuves.map((ep) => (
                      <th
                        key={ep.id}
                        className="py-3 px-3 text-center min-w-[140px] font-bold text-slate-900"
                      >
                        <div className="text-xs font-bold truncate">
                          {ep.intitule}
                        </div>
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                          Sur /{ep.noteMax} · Coef {ep.coefficient}
                        </div>
                      </th>
                    ))}

                    {/* Colonne Actions (si DA ou non verrouillé) */}
                    {!estVerrouille && (
                      <th className="py-3 px-2 w-10 text-center font-bold text-slate-400">
                        
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {lignesFiltrees.length === 0 ? (
                    <tr>
                      <td
                        colSpan={epreuves.length + 4}
                        className="py-16 text-center text-xs text-slate-400"
                      >
                        Aucun candidat ne correspond aux filtres actuels.
                      </td>
                    </tr>
                  ) : (
                    lignesFiltrees.map((candidat) => {
                      const idxOriginal = candidat.idxOriginal;
                      const estToutAbsent =
                        candidat.notes.length > 0 &&
                        candidat.notes.every((n) => n.statut === "ABS");

                      return (
                        <tr
                          key={candidat.apprenantId || `hl-${idxOriginal}`}
                          className={`transition-colors group ${
                            estToutAbsent ? "bg-rose-50/15 hover:bg-rose-50/25" : "hover:bg-amber-50/35"
                          }`}
                        >
                          {/* 1. N° */}
                          <td className="sticky left-0 z-10 bg-inherit py-2 px-3 text-center font-mono font-semibold text-slate-400">
                            {idxOriginal + 1}
                          </td>

                          {/* 2. Nom & Prénom */}
                          <td className="sticky left-12 z-10 bg-inherit py-2 px-4 font-bold text-slate-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {candidat.horsListe && (
                                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800 uppercase shrink-0">
                                    Hors-liste
                                  </span>
                                )}
                                <span className="truncate">{candidat.nomComplet}</span>
                                {estToutAbsent && (
                                  <span
                                    className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-700 uppercase shrink-0"
                                    title="Absent(e) à la totalité des épreuves"
                                  >
                                    ABS
                                  </span>
                                )}
                              </div>
                              {!estVerrouille && (
                                <button
                                  type="button"
                                  onClick={() => basculerTousAbsents(idxOriginal)}
                                  title={estToutAbsent ? "Repasser en mode Note" : "Marquer absent à toutes les épreuves"}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                                    estToutAbsent
                                      ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                      : "text-slate-400 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  }`}
                                >
                                  {estToutAbsent ? "Annuler ABS" : "ABS"}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* 3. Établissement (avec SelecteurEtablissement compact) */}
                          <td className="py-2 px-3">
                            <SelecteurEtablissement
                              value={candidat.etablissementOrigine || ""}
                              onChange={(nouvelEtab) => {
                                setLignes((prev) =>
                                  prev.map((lig, lIdx) =>
                                    lIdx === idxOriginal
                                      ? { ...lig, etablissementOrigine: nouvelEtab }
                                      : lig,
                                  ),
                                );
                                setEstModifie(true);
                              }}
                              disabled={estVerrouille}
                              variant="compact"
                              placeholder="Établissement..."
                            />
                          </td>

                          {/* 4. Cellules de Notation par Épreuve (Excel-like) */}
                          {epreuves.map((ep) => {
                            const noteObj = candidat.notes.find((n) => n.epreuveId === ep.id);
                            const noteVal = noteObj?.note !== null && noteObj?.note !== undefined ? noteObj.note : "";
                            const statut = noteObj?.statut ?? "NOTE";
                            const estAbsent = statut === "ABS";
                            const depasseMax =
                              typeof noteVal === "number" &&
                              (noteVal > ep.noteMax || noteVal < 0);

                            return (
                              <td
                                key={ep.id}
                                className={`py-1.5 px-2 text-center ${
                                  estAbsent ? "bg-rose-50/30" : ""
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {estAbsent ? (
                                    <span className="w-16 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80 font-black text-xs">
                                      ABS
                                    </span>
                                  ) : (
                                    <input
                                      type="number"
                                      step="0.25"
                                      min={0}
                                      max={ep.noteMax}
                                      disabled={estVerrouille}
                                      value={noteVal}
                                      onChange={(e) =>
                                        handleNoteChange(
                                          idxOriginal,
                                          ep.id,
                                          e.target.value,
                                          "NOTE",
                                        )
                                      }
                                      placeholder="—"
                                      className={`w-16 rounded-lg text-center text-xs transition-all outline-none font-bold tabular-nums py-1 ${
                                        depasseMax
                                          ? "border border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-200"
                                          : noteVal !== ""
                                            ? "border border-transparent bg-slate-50/60 hover:bg-white hover:border-slate-300 focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/20 font-black text-slate-900"
                                            : "border border-transparent bg-transparent hover:bg-slate-100/70 focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/20 text-slate-400"
                                      } disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed`}
                                    />
                                  )}

                                  {/* Bouton rapide Absent */}
                                  {!estVerrouille && (
                                    <button
                                      type="button"
                                      tabIndex={-1}
                                      onClick={() => toggleStatutAbsent(idxOriginal, ep.id)}
                                      title={
                                        estAbsent
                                          ? "Candidat absent (cliquer pour noter)"
                                          : "Marquer comme absent"
                                      }
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                        estAbsent
                                          ? "bg-rose-600 text-white shadow-2xs"
                                          : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                      }`}
                                    >
                                      ABS
                                    </button>
                                  )}
                                </div>

                                {depasseMax && (
                                  <p className="text-[10px] font-bold text-rose-600 mt-0.5">
                                    Max {ep.noteMax}
                                  </p>
                                )}
                              </td>
                            );
                          })}

                          {/* 5. Supprimer de la feuille (candidats hors-liste) */}
                          {!estVerrouille && (
                            <td className="py-2 px-2 text-center">
                              {candidat.horsListe && (
                                <button
                                  type="button"
                                  onClick={() => supprimerLigne(idxOriginal)}
                                  title="Retirer ce candidat de la feuille"
                                  className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Barre d'Actions Inférieure Flottante ── */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold">
              <span>
                Total sur la feuille :{" "}
                <strong className="text-slate-900">{lignes.length}</strong> candidat(s)
              </span>
              <span>·</span>
              <span>
                Absents :{" "}
                <strong className="text-red-700">{stats.totalCandidatsAbsents}</strong>
              </span>
              <span>·</span>
              <span>
                Complétion :{" "}
                <strong className="text-brand-orange">{stats.pourcentage}%</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/concours-blancs">
                <Button variant="secondary" type="button">
                  <span className="text-xs font-bold">Fermer la feuille</span>
                </Button>
              </Link>

              <button
                type="button"
                onClick={handleEnregistrer}
                disabled={
                  estVerrouille ||
                  enregistrerMutation.isPending ||
                  notesHorsBareme.length > 0 ||
                  (!estModifie && !sauvegardeSucces)
                }
                title={
                  notesHorsBareme.length > 0
                    ? `Enregistrement bloqué : ${notesHorsBareme.length} note(s) hors barème`
                    : undefined
                }
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-6 py-2.5 text-xs font-black text-white hover:bg-brand-orange/90 shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={15} />
                <span>
                  {enregistrerMutation.isPending
                    ? "Enregistrement..."
                    : notesHorsBareme.length > 0
                      ? `Bloqué (${notesHorsBareme.length} hors barème)`
                      : "Enregistrer les notes"}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

