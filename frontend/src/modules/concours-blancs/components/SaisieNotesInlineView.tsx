"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Save,
  CheckCircle2,
  Lock,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
  AlertTriangle,
} from "lucide-react";
import type { Centre } from "@/modules/centres-sessions";
import { type Formation, SelecteurEtablissement } from "@/modules/academique";
import { useApprenants, type Apprenant } from "@/modules/apprenants";
import {
  useResultatsConcoursBlanc,
  useEnregistrerNotesConcoursBlanc,
} from "../hooks/useConcoursBlancs";
import type {
  ConcoursBlanc,
  EpreuveConcoursBlanc,
  ResultatCandidat,
  CandidatNotesInput,
  StatutNote,
} from "../types/concours-blanc.types";
import { messageErreurApi } from "@/shared/lib/api-client";

interface SaisieNotesInlineViewProps {
  concoursBlanc: ConcoursBlanc;
  formationId: string;
  centreId: string;
  centres: Centre[];
  formations: Formation[];
  userRole: string;
  userCentreId?: string;
  onChangerFormation: (fId: string) => void;
  onChangerCentre: (cId: string) => void;
  onPasserConsultation?: () => void;
}

function buildInitialLignes(
  resultatsExistants: ResultatCandidat[],
  apprenantsCentre: Apprenant[],
  epreuves: EpreuveConcoursBlanc[],
  formationId: string,
  apprenants: Apprenant[],
): CandidatNotesInput[] {
  if (resultatsExistants && resultatsExistants.length > 0) {
    const list: CandidatNotesInput[] = resultatsExistants.map((r) => {
      const candidatApprenant = apprenants.find((a) => a.id === r.apprenantId);
      return {
        id: r.id,
        formationId: r.formationId || formationId,
        apprenantId: r.apprenantId,
        nomComplet: r.nomComplet,
        etablissementOrigine:
          r.etablissementOrigine ||
          candidatApprenant?.etablissementOrigine ||
          "",
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
    list.sort((a, b) =>
      a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }),
    );
    return list;
  }

  const list: CandidatNotesInput[] = apprenantsCentre.map((a) => ({
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
  list.sort((a, b) =>
    a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }),
  );
  return list;
}

interface SaisieTableContentProps {
  concoursBlanc: ConcoursBlanc;
  formationId: string;
  centreId: string;
  centres: Centre[];
  formations: Formation[];
  userRole: string;
  userCentreId?: string;
  onChangerFormation: (fId: string) => void;
  onChangerCentre: (cId: string) => void;
  onPasserConsultation?: () => void;
  initialResultats: ResultatCandidat[];
  epreuves: EpreuveConcoursBlanc[];
  apprenantsCentre: Apprenant[];
  apprenants: Apprenant[];
}

function SaisieTableContent({
  concoursBlanc,
  formationId,
  centreId,
  centres,
  formations,
  userRole,
  userCentreId,
  onChangerFormation,
  onChangerCentre,
  initialResultats,
  epreuves,
  apprenantsCentre,
  apprenants,
}: SaisieTableContentProps) {
  const estDA = userRole === "DIRECTEUR_ACADEMIQUE" || userRole === "DIRECTEUR";
  const centreActif = centres.find((c) => c.id === centreId) || centres[0];
  const formationActive =
    formations.find((f) => f.id === formationId) || formations[0];

  const estCloture = concoursBlanc.statut === "CLOTURE";
  const estVerrouille =
    estCloture || Boolean(concoursBlanc.saisieNotesBloqueeCentre && !estDA);

  const enregistrerMutation = useEnregistrerNotesConcoursBlanc();

  // Initialisation directe sans useEffect
  const [lignes, setLignes] = useState<CandidatNotesInput[]>(() =>
    buildInitialLignes(
      initialResultats,
      apprenantsCentre,
      epreuves,
      formationId,
      apprenants,
    ),
  );
  const [sauvegardeSucces, setSauvegardeSucces] = useState(false);
  const [estModifie, setEstModifie] = useState(false);
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);

  // Synchronisation des lignes si les données serveur sont rafraîchies et qu'aucune modification locale n'est en cours
  useEffect(() => {
    if (!estModifie && initialResultats && initialResultats.length > 0) {
      setLignes(
        buildInitialLignes(
          initialResultats,
          apprenantsCentre,
          epreuves,
          formationId,
          apprenants,
        ),
      );
    }
  }, [initialResultats, apprenantsCentre, epreuves, formationId, apprenants, estModifie]);

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
  const [filtreTableau, setFiltreTableau] = useState<
    "TOUS" | "INCOMPLETS" | "ABSENTS"
  >("TOUS");
  const [rechercheTableau, setRechercheTableau] = useState("");
  const [panneauAjoutOuvert, setPanneauAjoutOuvert] = useState(false);

  // Suggestions pour ajout d'élève déjà inscrit
  const apprenantsSuggeres = useMemo(() => {
    if (!rechercheApprenant.trim()) return [];
    const q = rechercheApprenant.trim().toLowerCase();
    const dejaPresents = new Set(
      lignes.map((l) => l.apprenantId).filter(Boolean),
    );
    return apprenants
      .filter((a) => !dejaPresents.has(a.id))
      .filter(
        (a) =>
          a.nom.toLowerCase().includes(q) ||
          a.prenom.toLowerCase().includes(q) ||
          (a.etablissementOrigine &&
            a.etablissementOrigine.toLowerCase().includes(q)),
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
      next.sort((x, y) =>
        x.nomComplet.localeCompare(y.nomComplet, "fr", { sensitivity: "base" }),
      );
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
      next.sort((x, y) =>
        x.nomComplet.localeCompare(y.nomComplet, "fr", { sensitivity: "base" }),
      );
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
      const estDejaTousAbs =
        c.notes.length > 0 && c.notes.every((n) => n.statut === "ABS");
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
        `Validation impossible : ${notesHorsBareme.length} note(s) hors barème détectée(s). Les notes doivent obligatoirement être comprises entre 0 et le barème maximal de l'épreuve.`,
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
        setLignes(
          buildInitialLignes(
            resultatsEnregistres,
            apprenantsCentre,
            epreuves,
            formationId,
            apprenants,
          ),
        );
      }
      setSauvegardeSucces(true);
      setEstModifie(false);
      setTimeout(() => setSauvegardeSucces(false), 4000);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement des notes", err);
      setErreurValidation(
        messageErreurApi(err, "Erreur lors de l'enregistrement des notes."),
      );
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
    apprenantsCentre,
    epreuves,
    formationId,
    apprenants,
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
        lig.notes.length > 0 && lig.notes.every((n) => n.statut === "ABS");
      if (estToutAbsent) {
        totalCandidatsAbsents += 1;
      }
      for (const n of lig.notes) {
        if (n.statut === "ABS") {
          totalNotesSaisies += 1;
        } else if (
          n.statut === "NOTE" &&
          n.note !== null &&
          n.note !== undefined
        ) {
          totalNotesSaisies += 1;
        }
      }
    }

    const nbIncomplets = lignes.filter((lig) =>
      lig.notes.some(
        (n) => n.statut === "NOTE" && (n.note === null || n.note === undefined),
      ),
    ).length;
    const pourcentage =
      totalNotesAttendues > 0
        ? Math.round((totalNotesSaisies / totalNotesAttendues) * 100)
        : 0;

    return {
      totalCandidats,
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
          const matchEtab = lig.etablissementOrigine
            ?.toLowerCase()
            .includes(q);
          if (!matchNom && !matchEtab) return false;
        }

        if (filtreTableau === "ABSENTS") {
          return (
            lig.notes.length > 0 && lig.notes.every((n) => n.statut === "ABS")
          );
        }

        if (filtreTableau === "INCOMPLETS") {
          return lig.notes.some(
            (n) =>
              n.statut === "NOTE" && (n.note === null || n.note === undefined),
          );
        }

        return true;
      });
  }, [lignes, rechercheTableau, filtreTableau]);

  return (
    <div className="space-y-3">
      {/* ── Barre contextuelle intégrée : Sélecteurs + Progression + Enregistrement ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Sélecteur de filière */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Filière :</span>
            <select
              value={formationId}
              onChange={(e) => onChangerFormation(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange cursor-pointer"
            >
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-300">|</span>

          {/* Sélecteur de centre */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">Centre :</span>
            {centres.length > 1 && estDA ? (
              <select
                value={centreId}
                onChange={(e) => onChangerCentre(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-brand-orange cursor-pointer"
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-800">
                {centreActif?.nom || "Centre connecté"}
              </span>
            )}
          </div>

          <span className="text-slate-300 hidden md:inline">|</span>

          {/* Avancement */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              Saisie :{" "}
              <strong className="text-slate-900 font-bold">
                {stats.totalNotesSaisies}/{stats.totalNotesAttendues}
              </strong>{" "}
              ({stats.pourcentage}%)
            </span>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-brand-orange transition-all duration-300"
                style={{ width: `${stats.pourcentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bouton d'action Enregistrer */}
        <div className="flex items-center gap-2">
          {notesHorsBareme.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-300 animate-pulse">
              <AlertTriangle size={12} className="text-rose-600" />
              {notesHorsBareme.length} note(s) hors barème
            </span>
          ) : estModifie && !estVerrouille ? (
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Non enregistré (Ctrl+S)
            </span>
          ) : null}
          {sauvegardeSucces && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 size={12} className="text-emerald-600" />
              Enregistré !
            </span>
          )}

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
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-brand-orange/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save size={13} />
            <span>
              {enregistrerMutation.isPending
                ? "Enregistrement..."
                : notesHorsBareme.length > 0
                  ? `Bloqué (${notesHorsBareme.length} hors barème)`
                  : "Enregistrer"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Bannière d'Alerte Notes Hors Barème ── */}
      {(notesHorsBareme.length > 0 || erreurValidation) && (
        <div className="mx-4 flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 shadow-2xs">
          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
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

      {/* ── Alerte Verrouillage ── */}
      {estVerrouille && (
        <div className="mx-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
          <Lock size={15} className="text-rose-600 shrink-0" />
          <span>
            {estCloture
              ? "Ce concours blanc est clôturé. Les notes sont en lecture seule."
              : "La saisie des notes est verrouillée par la Direction Académique."}
          </span>
        </div>
      )}

      {/* ── Alerte si aucune épreuve ── */}
      {epreuves.length === 0 ? (
        <div className="m-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-8 text-center text-xs">
          <AlertTriangle size={28} className="mx-auto text-amber-500 mb-2" />
          <p className="font-bold text-slate-800">
            Aucune épreuve configurée pour la filière{" "}
            {formationActive?.nom || ""}
          </p>
          <p className="text-slate-500 mt-1">
            Configurez les matières et coefficients de ce concours blanc pour activer la saisie.
          </p>
        </div>
      ) : (
        <>
          {/* ── Barre de recherche & filtres de saisie ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 text-xs">
            {/* Filtres de statut */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFiltreTableau("TOUS")}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  filtreTableau === "TOUS"
                    ? "bg-slate-900 text-white font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tous ({lignes.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltreTableau("INCOMPLETS")}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  filtreTableau === "INCOMPLETS"
                    ? "bg-amber-600 text-white font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Incomplets ({stats.nbIncomplets})
              </button>
              <button
                type="button"
                onClick={() => setFiltreTableau("ABSENTS")}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  filtreTableau === "ABSENTS"
                    ? "bg-rose-700 text-white font-bold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Absents ({stats.totalCandidatsAbsents})
              </button>
            </div>

            {/* Recherche & Ajout */}
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={rechercheTableau}
                  onChange={(e) => setRechercheTableau(e.target.value)}
                  placeholder="Filtrer un candidat..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-1 pr-3 pl-8 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-brand-orange"
                />
              </div>

              {!estVerrouille && (
                <button
                  type="button"
                  onClick={() => setPanneauAjoutOuvert(!panneauAjoutOuvert)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    panneauAjoutOuvert
                      ? "border-brand-orange bg-orange-50 text-brand-orange"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <UserPlus size={12} />
                  <span>{panneauAjoutOuvert ? "Fermer" : "Ajouter élève"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Tiroir d'ajout rapide d'élèves */}
          {!estVerrouille && panneauAjoutOuvert && (
            <div className="mx-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/90 p-3 text-xs">
              <div className="relative w-full lg:w-72">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 shadow-2xs">
                  <Search size={13} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={rechercheApprenant}
                    onChange={(e) => setRechercheApprenant(e.target.value)}
                    placeholder="Chercher élève du centre..."
                    className="w-full outline-none text-slate-800 placeholder-slate-400 bg-transparent text-xs"
                  />
                  {rechercheApprenant && (
                    <button
                      type="button"
                      onClick={() => setRechercheApprenant("")}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {apprenantsSuggeres.length > 0 && (
                  <div className="absolute top-full left-0 z-40 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg divide-y divide-slate-100">
                    {apprenantsSuggeres.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => ajouterApprenant(a)}
                        className="flex w-full items-center justify-between p-2 text-left text-xs hover:bg-orange-50 cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {a.nom} {a.prenom}
                          </span>
                          {a.etablissementOrigine && (
                            <span className="text-[10px] text-slate-500 block">
                              {a.etablissementOrigine}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-brand-orange">
                          + Ajouter
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Candidat hors liste */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={nouveauNomHorsListe}
                  onChange={(e) => setNouveauNomHorsListe(e.target.value)}
                  placeholder="Nom candidat libre..."
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-brand-orange"
                />
                <div className="w-full sm:w-48">
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
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-brand-orange px-3 py-1 font-bold text-white hover:bg-brand-orange/90 disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <Plus size={12} />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Tableau de saisie en ligne des notes ── */}
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="w-10 py-2.5 px-3 text-center text-slate-400">
                    N°
                  </th>
                  <th className="min-w-[200px] py-2.5 px-4 font-bold text-slate-800">
                    Candidat
                  </th>
                  <th className="min-w-[150px] py-2.5 px-3 font-semibold text-slate-600">
                    Établissement
                  </th>
                  {epreuves.map((ep) => (
                    <th
                      key={ep.id}
                      className="min-w-[110px] py-2.5 px-2 text-center"
                    >
                      <div className="font-bold text-slate-900 truncate">
                        {ep.intitule}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        /{ep.noteMax} · c.{ep.coefficient}
                      </div>
                    </th>
                  ))}
                  <th className="w-20 py-2.5 px-3 text-right font-bold text-slate-800">
                    Total
                  </th>
                  {!estVerrouille && <th className="w-8 py-2.5 px-2"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {lignesFiltrees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={epreuves.length + 5}
                      className="py-12 text-center text-slate-400"
                    >
                      Aucun candidat ne correspond aux filtres.
                    </td>
                  </tr>
                ) : (
                  lignesFiltrees.map((candidat) => {
                    const idxOriginal = candidat.idxOriginal;
                    const estToutAbsent =
                      candidat.notes.length > 0 &&
                      candidat.notes.every((n) => n.statut === "ABS");

                    const totalPoints = candidat.notes.reduce((sum, n) => {
                      if (
                        n.statut === "NOTE" &&
                        n.note !== null &&
                        n.note !== undefined
                      ) {
                        const ep = epreuves.find((e) => e.id === n.epreuveId);
                        const coef = ep?.coefficient || 1;
                        return sum + n.note * coef;
                      }
                      return sum;
                    }, 0);

                    return (
                      <tr
                        key={candidat.apprenantId || `hl-${idxOriginal}`}
                        className={`transition-colors hover:bg-slate-50/70 ${
                          estToutAbsent ? "bg-rose-50/15" : ""
                        }`}
                      >
                        {/* N° */}
                        <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {idxOriginal + 1}
                        </td>

                        {/* Candidat */}
                        <td className="py-2 px-4 font-semibold text-slate-900">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {candidat.horsListe && (
                                <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 uppercase shrink-0">
                                  Libre
                                </span>
                              )}
                              <span className="truncate">
                                {candidat.nomComplet}
                              </span>
                            </div>

                            {!estVerrouille && (
                              <button
                                type="button"
                                onClick={() => basculerTousAbsents(idxOriginal)}
                                title={
                                  estToutAbsent
                                    ? "Annuler l'absence"
                                    : "Marquer absent à tout"
                                }
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition cursor-pointer shrink-0 ${
                                  estToutAbsent
                                    ? "bg-rose-100 text-rose-700"
                                    : "text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                                }`}
                              >
                                {estToutAbsent ? "Annuler ABS" : "ABS"}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Établissement */}
                        <td className="py-2 px-3 text-slate-600">
                          <span className="truncate block max-w-[180px] text-[11px]">
                            {candidat.etablissementOrigine || "—"}
                          </span>
                        </td>

                        {/* Épreuves */}
                        {epreuves.map((ep) => {
                          const noteObj = candidat.notes.find(
                            (n) => n.epreuveId === ep.id,
                          );
                          const noteVal =
                            noteObj?.note !== null &&
                            noteObj?.note !== undefined
                              ? noteObj.note
                              : "";
                          const statut = noteObj?.statut ?? "NOTE";
                          const estAbsent = statut === "ABS";
                          const depasseMax =
                            typeof noteVal === "number" &&
                            (noteVal > ep.noteMax || noteVal < 0);

                          return (
                            <td
                              key={ep.id}
                              className={`py-1 px-1.5 text-center ${
                                estAbsent
                                  ? "bg-rose-50/30"
                                  : depasseMax
                                    ? "bg-rose-50/40"
                                    : ""
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center">
                                <div className="flex items-center justify-center gap-1">
                                  {estAbsent ? (
                                    <span className="w-14 rounded bg-rose-50 py-1 text-center font-bold text-[11px] text-rose-700 border border-rose-200">
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
                                      title={
                                        depasseMax
                                          ? noteVal < 0
                                            ? "Note négative interdite !"
                                            : `Note ${noteVal} hors barème ! Le barème maximal est de ${ep.noteMax}.`
                                          : undefined
                                      }
                                      className={`w-14 rounded-md border text-center font-mono text-xs font-bold py-1 outline-none transition ${
                                        depasseMax
                                          ? "border-2 border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-200"
                                          : noteVal !== ""
                                            ? "border-slate-200 bg-white text-slate-900 focus:border-brand-orange"
                                            : "border-slate-200 bg-slate-50/50 text-slate-400 focus:border-brand-orange focus:bg-white"
                                      }`}
                                    />
                                  )}

                                  {!estVerrouille && (
                                    <button
                                      type="button"
                                      tabIndex={-1}
                                      onClick={() =>
                                        toggleStatutAbsent(idxOriginal, ep.id)
                                      }
                                      title={
                                        estAbsent
                                          ? "Saisir une note"
                                          : "Marquer absent"
                                      }
                                      className={`rounded px-1 py-0.5 text-[9px] font-bold cursor-pointer transition ${
                                        estAbsent
                                          ? "bg-rose-600 text-white"
                                          : "text-slate-300 hover:text-rose-600"
                                      }`}
                                    >
                                      ABS
                                    </button>
                                  )}
                                </div>
                                {depasseMax && (
                                  <span className="text-[9px] font-bold text-rose-600 whitespace-nowrap mt-0.5">
                                    {noteVal < 0 ? "< 0 !" : `max ${ep.noteMax}`}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Total */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {estToutAbsent ? (
                            <span className="text-rose-600 text-[11px]">
                              ABS
                            </span>
                          ) : (
                            <span>{totalPoints.toFixed(2)}</span>
                          )}
                        </td>

                        {/* Suppression candidat hors liste */}
                        {!estVerrouille && (
                          <td className="py-2 px-2 text-center">
                            {candidat.horsListe && (
                              <button
                                type="button"
                                onClick={() => supprimerLigne(idxOriginal)}
                                title="Retirer"
                                className="text-slate-300 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 size={12} />
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
        </>
      )}
    </div>
  );
}

export function SaisieNotesInlineView({
  concoursBlanc,
  formationId,
  centreId,
  centres,
  formations,
  userRole,
  userCentreId,
  onChangerFormation,
  onChangerCentre,
  onPasserConsultation,
}: SaisieNotesInlineViewProps) {
  const { data: apprenants = [] } = useApprenants();

  const epreuves = useMemo(() => {
    if (!concoursBlanc?.epreuves) return [];
    return concoursBlanc.epreuves.filter((e) => e.formationId === formationId);
  }, [concoursBlanc, formationId]);

  const { data: resultatsExistants = [], isLoading: chargementResultats } =
    useResultatsConcoursBlanc(
      concoursBlanc.id,
      centreId,
      formationId,
      userRole,
      userCentreId,
    );

  const sessionId = concoursBlanc.sessionId;
  const apprenantsCentre = useMemo(() => {
    if (!centreId) return [];
    return apprenants.filter(
      (a) =>
        a.centreId === centreId &&
        (!formationId || a.formationId === formationId) &&
        (!sessionId || a.sessionId === sessionId),
    );
  }, [apprenants, centreId, formationId, sessionId]);

  if (chargementResultats) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Chargement des résultats et de la feuille de notation...
      </div>
    );
  }

  // Key de réinitialisation automatique et propre
  const tableKey = `${concoursBlanc.id}-${centreId}-${formationId}-${resultatsExistants.length}`;

  return (
    <SaisieTableContent
      key={tableKey}
      concoursBlanc={concoursBlanc}
      formationId={formationId}
      centreId={centreId}
      centres={centres}
      formations={formations}
      userRole={userRole}
      userCentreId={userCentreId}
      onChangerFormation={onChangerFormation}
      onChangerCentre={onChangerCentre}
      onPasserConsultation={onPasserConsultation}
      initialResultats={resultatsExistants}
      epreuves={epreuves}
      apprenantsCentre={apprenantsCentre}
      apprenants={apprenants}
    />
  );
}
