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

  // Outils d'ajout
  const [rechercheApprenant, setRechercheApprenant] = useState("");
  const [nouveauNomHorsListe, setNouveauNomHorsListe] = useState("");
  const [etablissementHorsListe, setEtablissementHorsListe] = useState("");

  // Filtre d'affichage
  const [filtreTableau, setFiltreTableau] = useState<"TOUS" | "INCOMPLETS" | "ABSENTS">("TOUS");
  const [rechercheTableau, setRechercheTableau] = useState("");

  // Apprenants du centre
  const apprenantsCentre = useMemo(() => {
    if (!centreId) return [];
    return apprenants.filter(
      (a) => a.centreId === centreId && (!formationId || a.formationId === formationId),
    );
  }, [apprenants, centreId, formationId]);

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
      setLignes(initLignes);
      setEstModifie(false);
    } else {
      // Préremplissage avec les apprenants du centre inscrits dans cette formation
      const initLignes: CandidatNotesInput[] = apprenantsCentre.map((a) => ({
        formationId: a.formationId || formationId,
        apprenantId: a.id,
        nomComplet: `${a.nom} ${a.prenom}`,
        etablissementOrigine: a.etablissementOrigine || "",
        horsListe: false,
        notes: epreuves.map((ep) => ({
          epreuveId: ep.id,
          note: null,
          statut: "NOTE" as StatutNote,
        })),
      }));
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
    setLignes((prev) => [
      ...prev,
      {
        formationId: a.formationId || formationId,
        apprenantId: a.id,
        nomComplet: `${a.nom} ${a.prenom}`,
        etablissementOrigine: a.etablissementOrigine || "",
        horsListe: false,
        notes: epreuves.map((ep) => ({
          epreuveId: ep.id,
          note: null,
          statut: "NOTE" as StatutNote,
        })),
      },
    ]);
    setRechercheApprenant("");
    setEstModifie(true);
  };

  const ajouterCandidatHorsListe = () => {
    const nom = nouveauNomHorsListe.trim();
    if (!nom) return;

    setLignes((prev) => [
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
    ]);
    setNouveauNomHorsListe("");
    setEtablissementHorsListe("");
    setEstModifie(true);
  };

  const supprimerLigne = (idxASupprimer: number) => {
    setLignes((prev) => prev.filter((_, idx) => idx !== idxASupprimer));
    setEstModifie(true);
  };

  const handleNoteChange = (
    candidatIdx: number,
    epreuveId: string,
    valeur: string | number,
    statut: StatutNote = "NOTE",
  ) => {
    setLignes((prev) => {
      const next = [...prev];
      const c = { ...next[candidatIdx] };
      const notes = [...c.notes];
      const nIdx = notes.findIndex((n) => n.epreuveId === epreuveId);

      const parsedNote: number | null =
        statut === "NOTE"
          ? valeur === "" || Number.isNaN(Number(valeur))
            ? null
            : Math.max(0, Number(valeur))
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
    if (estVerrouille || !concoursBlanc) return;

    try {
      await enregistrerMutation.mutateAsync({
        id: concoursBlanc.id,
        payload: {
          centreId,
          candidats: lignes,
        },
        role: userRole,
        userCentreId,
      });
      setSauvegardeSucces(true);
      setEstModifie(false);
      setTimeout(() => setSauvegardeSucces(false), 4000);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement des notes", err);
    }
  }, [estVerrouille, concoursBlanc, centreId, userRole, userCentreId, lignes, enregistrerMutation]);

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
    let totalAbsents = 0;

    for (const lig of lignes) {
      for (const n of lig.notes) {
        if (n.statut === "ABS") {
          totalAbsents += 1;
          totalNotesSaisies += 1;
        } else if (n.statut === "NOTE" && n.note !== null && n.note !== undefined) {
          totalNotesSaisies += 1;
        }
      }
    }

    const pourcentage =
      totalNotesAttendues > 0
        ? Math.round((totalNotesSaisies / totalNotesAttendues) * 100)
        : 0;

    return { totalCandidats, totalNotesSaisies, totalNotesAttendues, totalAbsents, pourcentage };
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
          return lig.notes.some((n) => n.statut === "ABS");
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
      {/* ── En-tête Supérieur Sticky ── */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3.5 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href="/concours-blancs"
              className="hover:text-brand-orange flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={13} />
              Concours Blancs
            </Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-800 font-bold">{concoursBlanc.titre}</span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-brand-orange font-bold">Feuille de notation</span>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Saisie des notes — {concoursBlanc.titre}
            </h1>
            {estCloture ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 border border-slate-200">
                Clôturé
              </span>
            ) : concoursBlanc.saisieNotesBloqueeCentre ? (
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200 flex items-center gap-1">
                <Lock size={12} />
                Verrouillé aux centres
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                Saisie ouverte
              </span>
            )}
          </div>
        </div>

        {/* Contrôles et Sauvegarde */}
        <div className="flex items-center gap-3">
          {estModifie && !estVerrouille && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Non enregistré (Ctrl+S)
            </span>
          )}

          {sauvegardeSucces && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Enregistré !
            </span>
          )}

          <Link href="/concours-blancs">
            <Button variant="secondary" type="button">
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <ArrowLeft size={13} />
                Retour
              </span>
            </Button>
          </Link>

          <button
            type="button"
            onClick={handleEnregistrer}
            disabled={estVerrouille || enregistrerMutation.isPending || (!estModifie && !sauvegardeSucces)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 text-xs font-black text-white hover:bg-brand-orange/90 shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={15} />
            <span>
              {enregistrerMutation.isPending
                ? "Enregistrement en cours..."
                : "Enregistrer les notes (Ctrl+S)"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Sélecteurs de Contexte : Centre & Filière ── */}
      <Card className="p-4 bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Choix du Centre */}
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-brand-orange shrink-0" />
              <span className="text-xs font-bold text-slate-700">Centre d&rsquo;examen :</span>
              {centres.length > 1 && estDA ? (
                <select
                  value={centreId}
                  onChange={(e) => {
                    setCentreId(e.target.value);
                    router.push(
                      `/concours-blancs/${concoursBlancId}/saisie?formationId=${formationId}&centreId=${e.target.value}`,
                    );
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange focus:bg-white"
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-800 border border-slate-200">
                  {centreActif?.nom || "Centre non spécifié"}
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Choix de la Filière / Formation */}
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-brand-orange shrink-0" />
              <span className="text-xs font-bold text-slate-700">Filière :</span>
              <div className="flex flex-wrap gap-1.5">
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
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        estActive
                          ? "bg-brand-orange text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.nom}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mini barre de progression de la saisie */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-500">
                Progression :{" "}
                <strong className="text-slate-900">
                  {stats.totalNotesSaisies} / {stats.totalNotesAttendues}
                </strong>{" "}
                notes ({stats.pourcentage}%)
              </p>
              <div className="w-36 h-2 rounded-full bg-slate-100 overflow-hidden mt-1 border border-slate-200/60">
                <div
                  className="h-full bg-brand-orange rounded-full transition-all duration-300"
                  style={{ width: `${stats.pourcentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

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
          {/* ── Barre d'outils Candidats ── */}
          {!estVerrouille && (
            <Card className="p-4 bg-slate-50/90 border border-slate-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* 1. Ajout d'un apprenant déjà existant dans le centre ou la session */}
                <div className="relative w-full lg:w-96">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs text-xs">
                    <Search size={14} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={rechercheApprenant}
                      onChange={(e) => setRechercheApprenant(e.target.value)}
                      placeholder="Ajouter un élève du centre / autre groupe..."
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

                {/* 2. Ajout rapide d'un Candidat Hors-liste avec le Sélecteur d'Établissement moderne */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                  <input
                    type="text"
                    value={nouveauNomHorsListe}
                    onChange={(e) => setNouveauNomHorsListe(e.target.value)}
                    placeholder="Nom complet candidat libre..."
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none w-full sm:w-56 focus:border-brand-orange shadow-2xs"
                  />

                  {/* Sélecteur d'établissement intelligent avec création directe */}
                  <div className="w-full sm:w-64">
                    <SelecteurEtablissement
                      value={etablissementHorsListe}
                      onChange={setEtablissementHorsListe}
                      placeholder="Lycée d'origine..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={ajouterCandidatHorsListe}
                    disabled={!nouveauNomHorsListe.trim()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-orange/70 bg-orange-50/80 px-4 py-2 text-xs font-bold text-brand-orange hover:bg-brand-orange hover:text-white transition-all cursor-pointer disabled:opacity-40 shrink-0 shadow-2xs"
                  >
                    <UserPlus size={14} />
                    <span>+ Candidat hors-liste</span>
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* ── Filtres du Tableau ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Afficher :</span>
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setFiltreTableau("TOUS")}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
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
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    filtreTableau === "INCOMPLETS"
                      ? "bg-white text-amber-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Notes manquantes
                </button>
                <button
                  type="button"
                  onClick={() => setFiltreTableau("ABSENTS")}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    filtreTableau === "ABSENTS"
                      ? "bg-white text-red-700 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Absents ({stats.totalAbsents})
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={rechercheTableau}
                onChange={(e) => setRechercheTableau(e.target.value)}
                placeholder="Filtrer dans la liste..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {/* ── Grille de Notation Plein Écran (Tableau Type Tableur) ── */}
          <Card className="overflow-hidden border border-slate-200 shadow-xs">
            <div className="overflow-x-auto max-h-[75vh]">
              <table className="w-full border-collapse text-left text-xs">
                {/* En-tête Sticky */}
                <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xs text-slate-700 border-b border-slate-200 shadow-2xs">
                  <tr>
                    {/* Colonne 1 : N° (Sticky Left) */}
                    <th className="sticky left-0 z-20 bg-slate-100 py-3 px-3 w-12 text-center font-bold text-slate-500 border-r border-slate-200">
                      N°
                    </th>

                    {/* Colonne 2 : Candidat (Sticky Left) */}
                    <th className="sticky left-12 z-20 bg-slate-100 py-3 px-4 min-w-[260px] font-bold text-slate-800 border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      Nom & Prénom du Candidat
                    </th>

                    {/* Colonne 3 : Établissement d'origine */}
                    <th className="py-3 px-4 min-w-[220px] font-bold text-slate-800 border-r border-slate-200">
                      Établissement d&rsquo;origine
                    </th>

                    {/* Colonnes dynamiques des Épreuves */}
                    {epreuves.map((ep) => (
                      <th
                        key={ep.id}
                        className="py-3 px-3 text-center min-w-[150px] font-bold border-r border-slate-200 last:border-r-0 bg-slate-50/80"
                      >
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {ep.intitule}
                        </div>
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Sur /{ep.noteMax} · Coef {ep.coefficient}
                        </div>
                      </th>
                    ))}

                    {/* Colonne Actions (si DA ou non verrouillé) */}
                    {!estVerrouille && (
                      <th className="py-3 px-2 w-12 text-center font-bold text-slate-500">
                        
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

                      return (
                        <tr
                          key={candidat.apprenantId || `hl-${idxOriginal}`}
                          className="hover:bg-amber-50/50 transition-colors group"
                        >
                          {/* 1. N° */}
                          <td className="sticky left-0 z-10 bg-white group-hover:bg-amber-50/90 py-2.5 px-3 text-center font-mono font-bold text-slate-400 border-r border-slate-100">
                            {idxOriginal + 1}
                          </td>

                          {/* 2. Nom & Prénom */}
                          <td className="sticky left-12 z-10 bg-white group-hover:bg-amber-50/90 py-2.5 px-4 font-bold text-slate-900 border-r border-slate-100 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                            <div className="flex items-center gap-2">
                              {candidat.horsListe && (
                                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800 uppercase shrink-0">
                                  Hors-liste
                                </span>
                              )}
                              <span className="truncate">{candidat.nomComplet}</span>
                            </div>
                          </td>

                          {/* 3. Établissement (avec SelecteurEtablissement compact) */}
                          <td className="py-2.5 px-3 border-r border-slate-100">
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

                          {/* 4. Cellules de Notation par Épreuve */}
                          {epreuves.map((ep) => {
                            const noteObj = candidat.notes.find((n) => n.epreuveId === ep.id);
                            const noteVal = noteObj?.note !== null && noteObj?.note !== undefined ? noteObj.note : "";
                            const statut = noteObj?.statut ?? "NOTE";
                            const estAbsent = statut === "ABS";
                            const depasseMax =
                              typeof noteVal === "number" && noteVal > ep.noteMax;

                            return (
                              <td
                                key={ep.id}
                                className={`py-2 px-3 border-r border-slate-100 text-center ${
                                  estAbsent ? "bg-red-50/50" : ""
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  {estAbsent ? (
                                    <span className="w-18 py-1 rounded-lg bg-red-100 text-red-700 font-black text-xs">
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
                                      placeholder={`--/${ep.noteMax}`}
                                      className={`w-20 rounded-lg border px-2.5 py-1 text-center text-xs font-bold transition-all outline-none ${
                                        depasseMax
                                          ? "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200"
                                          : noteVal !== ""
                                          ? "border-slate-300 bg-white font-black text-slate-900 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                                          : "border-slate-200 bg-slate-50 text-slate-700 focus:border-brand-orange focus:bg-white"
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
                                      className={`px-1.5 py-1 rounded text-[10px] font-black transition-colors cursor-pointer ${
                                        estAbsent
                                          ? "bg-red-600 text-white"
                                          : "bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                      }`}
                                    >
                                      ABS
                                    </button>
                                  )}
                                </div>

                                {depasseMax && (
                                  <p className="text-[10px] font-bold text-red-600 mt-0.5">
                                    Max {ep.noteMax}
                                  </p>
                                )}
                              </td>
                            );
                          })}

                          {/* 5. Supprimer de la feuille (candidats hors-liste) */}
                          {!estVerrouille && (
                            <td className="py-2.5 px-2 text-center">
                              {candidat.horsListe && (
                                <button
                                  type="button"
                                  onClick={() => supprimerLigne(idxOriginal)}
                                  title="Retirer ce candidat de la feuille"
                                  className="p-1 text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
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
          </Card>

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
                <strong className="text-red-700">{stats.totalAbsents}</strong>
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
                disabled={estVerrouille || enregistrerMutation.isPending || (!estModifie && !sauvegardeSucces)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-6 py-2.5 text-xs font-black text-white hover:bg-brand-orange/90 shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={15} />
                <span>
                  {enregistrerMutation.isPending
                    ? "Enregistrement..."
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

