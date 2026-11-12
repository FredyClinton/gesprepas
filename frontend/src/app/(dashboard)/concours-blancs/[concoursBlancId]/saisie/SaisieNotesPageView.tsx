"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
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
  const estDirecteur = userRole === "DIRECTEUR"; // lecture seule
  const estDA = userRole === "DIRECTEUR_ACADEMIQUE";
  const voitTousCentres = estDA || estDirecteur;

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
    estCloture ||
    estDirecteur ||
    Boolean(concoursBlanc?.saisieNotesBloqueeCentre && !estDA);

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
  const [filtreTableau, setFiltreTableau] = useState<
    "TOUS" | "INCOMPLETS" | "ABSENTS"
  >("TOUS");
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
        const candidatApprenant = apprenants.find(
          (a) => a.id === r.apprenantId,
        );
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
      initLignes.sort((a, b) =>
        a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }),
      );
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
      initLignes.sort((a, b) =>
        a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }),
      );
      setLignes(initLignes);
      setEstModifie(false);
    }
  }, [
    concoursBlanc,
    resultatsExistants,
    epreuves,
    apprenantsCentre,
    apprenants,
    formationId,
  ]);

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
    if (estVerrouille || !concoursBlanc || enregistrerMutation.isPending)
      return;

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
        const majLignes: CandidatNotesInput[] = resultatsEnregistres.map(
          (r) => {
            const candidatApprenant = apprenants.find(
              (a) => a.id === r.apprenantId,
            );
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
                  note:
                    n?.note !== null && n?.note !== undefined ? n.note : null,
                  statut: (n?.statut as StatutNote) || "NOTE",
                };
              }),
            };
          },
        );
        majLignes.sort((a, b) =>
          a.nomComplet.localeCompare(b.nomComplet, "fr", {
            sensitivity: "base",
          }),
        );
        setLignes(majLignes);
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

    const totalCandidatsPresents = totalCandidats - totalCandidatsAbsents;
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

  if (chargementCB) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="animate-pulse text-sm font-semibold text-slate-500">
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
      <div className="sticky top-0 z-30 -mx-4 space-y-2.5 border-b border-slate-200/80 bg-white/95 px-4 py-3 shadow-2xs backdrop-blur-md sm:-mx-8 sm:px-8">
        {/* Ligne 1 : Breadcrumb & Titre & Statut */}
        <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/concours-blancs"
              className="hover:text-brand-orange flex items-center gap-1 font-semibold text-slate-500 transition-colors"
            >
              <ArrowLeft size={13} />
              Concours Blancs
            </Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="font-bold text-slate-700">
              {concoursBlanc.titre}
            </span>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-brand-orange font-bold">
              Feuille de notation
            </span>

            {estCloture ? (
              <span className="ml-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                Clôturé
              </span>
            ) : concoursBlanc.saisieNotesBloqueeCentre ? (
              <span className="ml-1 flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                <Lock size={10} />
                Verrouillé centres
              </span>
            ) : (
              <span className="ml-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Saisie ouverte
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            {notesHorsBareme.length > 0 ? (
              <span className="inline-flex animate-pulse items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                <AlertTriangle size={12} className="text-rose-600" />
                {notesHorsBareme.length} note(s) hors barème
              </span>
            ) : estModifie && !estVerrouille ? (
              <span className="inline-flex animate-pulse items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Modifié non enregistré (Ctrl+S)
              </span>
            ) : null}
            {sauvegardeSucces && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Enregistré !
              </span>
            )}
          </div>
        </div>

        {/* Ligne 2 : Sélecteurs Contextuels (Centre & Filière) + Progression */}
        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-2 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Centre d'examen */}
            <div className="flex items-center gap-1.5">
              <Building2 size={14} className="text-brand-orange shrink-0" />
              {centres.length > 1 && voitTousCentres ? (
                <select
                  value={centreId}
                  onChange={(e) => {
                    setCentreId(e.target.value);
                    router.push(
                      `/concours-blancs/${concoursBlancId}/saisie?formationId=${formationId}&centreId=${e.target.value}`,
                    );
                  }}
                  className="focus:border-brand-orange cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:bg-white"
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

            <span className="hidden text-slate-200 sm:inline">|</span>

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
                      className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
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
          <div className="flex shrink-0 items-center gap-2.5 self-start text-xs lg:self-auto">
            <span className="text-[11px] font-semibold text-slate-500">
              Progression :{" "}
              <strong className="font-bold text-slate-900">
                {stats.totalNotesSaisies}/{stats.totalNotesAttendues}
              </strong>{" "}
              ({stats.pourcentage}%)
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full border border-slate-200/50 bg-slate-100 sm:w-32">
              <div
                className="bg-brand-orange h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.pourcentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Alerte Verrouillage ── */}
      {estVerrouille && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-900">
          <Lock size={18} className="shrink-0 text-red-600" />
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
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <div className="space-y-1">
            <p className="font-bold">
              {erreurValidation ||
                `${notesHorsBareme.length} note(s) hors barème détectée(s) — Validation et enregistrement bloqués`}
            </p>
            {notesHorsBareme.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-rose-800">
                {notesHorsBareme.slice(0, 5).map((inv, i) => (
                  <li key={i}>
                    <span className="font-semibold">{inv.candidatNom}</span> :
                    note de <strong>{inv.note}</strong> en{" "}
                    <em>{inv.epreuveIntitule}</em> (barème autorisé : 0 à{" "}
                    {inv.noteMax})
                  </li>
                ))}
                {notesHorsBareme.length > 5 && (
                  <li>
                    ... et {notesHorsBareme.length - 5} autre(s) note(s) hors
                    barème
                  </li>
                )}
              </ul>
            )}
            <p className="text-[11px] font-medium text-rose-700">
              Veuillez corriger chaque note hors barème pour autoriser
              l&apos;enregistrement de la feuille.
            </p>
          </div>
        </div>
      )}

      {/* ── Alerte si aucune épreuve configurée ── */}
      {epreuves.length === 0 ? (
        <Card className="border-2 border-dashed border-amber-300 bg-amber-50/50 p-12 text-center">
          <AlertTriangle size={36} className="mx-auto mb-3 text-amber-500" />
          <h3 className="text-base font-bold text-slate-800">
            Aucune épreuve configurée pour la filière{" "}
            {formationActive?.nom || ""}
          </h3>
          <p className="mx-auto mt-1 mb-5 max-w-md text-xs text-slate-600">
            Pour pouvoir saisir les notes, vous devez d&rsquo;abord ajouter et
            paramétrer les matières et épreuves de ce concours blanc.
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
          <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 text-xs shadow-2xs sm:flex-row sm:items-center sm:p-3">
            {/* Filtres de statut des notes */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-0.5">
              <button
                type="button"
                onClick={() => setFiltreTableau("TOUS")}
                className={`cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all ${
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
                className={`cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all ${
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
                className={`cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all ${
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
                <Search
                  size={13}
                  className="absolute top-2.5 left-3 text-slate-400"
                />
                <input
                  type="text"
                  value={rechercheTableau}
                  onChange={(e) => setRechercheTableau(e.target.value)}
                  placeholder="Filtrer dans la liste..."
                  className="focus:border-brand-orange w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pr-3 pl-8 text-xs text-slate-800 placeholder-slate-400 shadow-2xs outline-none focus:bg-white"
                />
              </div>

              {!estVerrouille && (
                <button
                  type="button"
                  onClick={() => setPanneauAjoutOuvert(!panneauAjoutOuvert)}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                    panneauAjoutOuvert
                      ? "border-brand-orange text-brand-orange bg-orange-50"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <UserPlus size={13} />
                  <span>
                    {panneauAjoutOuvert ? "Fermer" : "Ajouter candidat"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Tiroir / Zone d'ajout contextuel compact */}
          {!estVerrouille && panneauAjoutOuvert && (
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 text-xs lg:flex-row lg:items-center">
              {/* 1. Recherche élève centre */}
              <div className="relative w-full lg:w-80">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                  <Search size={13} className="shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={rechercheApprenant}
                    onChange={(e) => setRechercheApprenant(e.target.value)}
                    placeholder="Ajouter élève du centre..."
                    className="w-full bg-transparent font-medium text-slate-800 placeholder-slate-400 outline-none"
                  />
                  {rechercheApprenant && (
                    <button
                      type="button"
                      onClick={() => setRechercheApprenant("")}
                      className="cursor-pointer text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {apprenantsSuggeres.length > 0 && (
                  <div className="absolute top-full left-0 z-40 mt-1 max-h-56 w-full divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                    {apprenantsSuggeres.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => ajouterApprenant(a)}
                        className="group flex w-full cursor-pointer items-center justify-between px-3.5 py-2 text-left text-xs transition-colors hover:bg-orange-50"
                      >
                        <div>
                          <span className="block font-bold text-slate-900">
                            {a.nom} {a.prenom}
                          </span>
                          {a.etablissementOrigine && (
                            <span className="block text-[11px] text-slate-500">
                              {a.etablissementOrigine}
                            </span>
                          )}
                        </div>
                        <span className="text-brand-orange text-[11px] font-bold group-hover:underline">
                          + Ajouter
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Candidat hors-liste */}
              <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:w-auto">
                <input
                  type="text"
                  value={nouveauNomHorsListe}
                  onChange={(e) => setNouveauNomHorsListe(e.target.value)}
                  placeholder="Nom candidat libre..."
                  className="focus:border-brand-orange w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-800 shadow-2xs outline-none sm:w-48"
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
                  className="bg-brand-orange hover:bg-brand-orange/90 inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold text-white shadow-2xs transition-all disabled:opacity-40"
                >
                  <Plus size={13} />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Grille de Notation Plein Écran (Tableau Type Tableur Excel-like) ── */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="max-h-[75vh] overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                {/* En-tête Sticky */}
                <thead className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 text-slate-700 shadow-2xs backdrop-blur-xs">
                  <tr>
                    {/* Colonne 1 : N° (Sticky Left) */}
                    <th className="sticky left-0 z-20 w-12 bg-slate-50/95 px-3 py-3 text-center font-bold text-slate-500">
                      N°
                    </th>

                    {/* Colonne 2 : Candidat (Sticky Left) */}
                    <th className="sticky left-12 z-20 min-w-[260px] bg-slate-50/95 px-4 py-3 font-bold text-slate-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                      Nom & Prénom du Candidat
                    </th>

                    {/* Colonne 3 : Établissement d'origine */}
                    <th className="min-w-[200px] px-4 py-3 font-bold text-slate-700">
                      Établissement d&rsquo;origine
                    </th>

                    {/* Colonnes dynamiques des Épreuves */}
                    {epreuves.map((ep) => (
                      <th
                        key={ep.id}
                        className="min-w-[140px] px-3 py-3 text-center font-bold text-slate-900"
                      >
                        <div className="truncate text-xs font-bold">
                          {ep.intitule}
                        </div>
                        <div className="mt-0.5 text-[10px] font-normal text-slate-400">
                          Sur /{ep.noteMax} · Coef {ep.coefficient}
                        </div>
                      </th>
                    ))}

                    {/* Colonne Actions (si DA ou non verrouillé) */}
                    {!estVerrouille && (
                      <th className="w-10 px-2 py-3 text-center font-bold text-slate-400"></th>
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
                          className={`group transition-colors ${
                            estToutAbsent
                              ? "bg-rose-50/15 hover:bg-rose-50/25"
                              : "hover:bg-amber-50/35"
                          }`}
                        >
                          {/* 1. N° */}
                          <td className="sticky left-0 z-10 bg-inherit px-3 py-2 text-center font-mono font-semibold text-slate-400">
                            {idxOriginal + 1}
                          </td>

                          {/* 2. Nom & Prénom */}
                          <td className="sticky left-12 z-10 bg-inherit px-4 py-2 font-bold text-slate-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                {candidat.horsListe && (
                                  <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800 uppercase">
                                    Hors-liste
                                  </span>
                                )}
                                <span className="truncate">
                                  {candidat.nomComplet}
                                </span>
                                {estToutAbsent && (
                                  <span
                                    className="shrink-0 rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-700 uppercase"
                                    title="Absent(e) à la totalité des épreuves"
                                  >
                                    ABS
                                  </span>
                                )}
                              </div>
                              {!estVerrouille && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    basculerTousAbsents(idxOriginal)
                                  }
                                  title={
                                    estToutAbsent
                                      ? "Repasser en mode Note"
                                      : "Marquer absent à toutes les épreuves"
                                  }
                                  className={`shrink-0 cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                                    estToutAbsent
                                      ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                      : "text-slate-400 opacity-0 group-hover:opacity-100 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus:opacity-100"
                                  }`}
                                >
                                  {estToutAbsent ? "Annuler ABS" : "ABS"}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* 3. Établissement (avec SelecteurEtablissement compact) */}
                          <td className="px-3 py-2">
                            <SelecteurEtablissement
                              value={candidat.etablissementOrigine || ""}
                              onChange={(nouvelEtab) => {
                                setLignes((prev) =>
                                  prev.map((lig, lIdx) =>
                                    lIdx === idxOriginal
                                      ? {
                                          ...lig,
                                          etablissementOrigine: nouvelEtab,
                                        }
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
                                className={`px-2 py-1.5 text-center ${
                                  estAbsent ? "bg-rose-50/30" : ""
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  {estAbsent ? (
                                    <span className="w-16 rounded-lg border border-rose-200/80 bg-rose-50 py-1 text-xs font-black text-rose-700">
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
                                      className={`w-16 rounded-lg py-1 text-center text-xs font-bold tabular-nums transition-all outline-none ${
                                        depasseMax
                                          ? "border border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-200"
                                          : noteVal !== ""
                                            ? "focus:border-brand-orange focus:ring-brand-orange/20 border border-transparent bg-slate-50/60 font-black text-slate-900 hover:border-slate-300 hover:bg-white focus:bg-white focus:ring-2"
                                            : "focus:border-brand-orange focus:ring-brand-orange/20 border border-transparent bg-transparent text-slate-400 hover:bg-slate-100/70 focus:bg-white focus:ring-2"
                                      } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                                    />
                                  )}

                                  {/* Bouton rapide Absent */}
                                  {!estVerrouille && (
                                    <button
                                      type="button"
                                      tabIndex={-1}
                                      onClick={() =>
                                        toggleStatutAbsent(idxOriginal, ep.id)
                                      }
                                      title={
                                        estAbsent
                                          ? "Candidat absent (cliquer pour noter)"
                                          : "Marquer comme absent"
                                      }
                                      className={`cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                                        estAbsent
                                          ? "bg-rose-600 text-white shadow-2xs"
                                          : "text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 focus:opacity-100"
                                      }`}
                                    >
                                      ABS
                                    </button>
                                  )}
                                </div>

                                {depasseMax && (
                                  <p className="mt-0.5 text-[10px] font-bold text-rose-600">
                                    Max {ep.noteMax}
                                  </p>
                                )}
                              </td>
                            );
                          })}

                          {/* 5. Supprimer de la feuille (candidats hors-liste) */}
                          {!estVerrouille && (
                            <td className="px-2 py-2 text-center">
                              {candidat.horsListe && (
                                <button
                                  type="button"
                                  onClick={() => supprimerLigne(idxOriginal)}
                                  title="Retirer ce candidat de la feuille"
                                  className="cursor-pointer p-1 text-slate-300 transition-colors hover:text-rose-600"
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
          <div className="fixed right-0 bottom-0 left-0 z-30 flex items-center justify-between border-t border-slate-200 bg-white/95 px-6 py-3 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <span>
                Total sur la feuille :{" "}
                <strong className="text-slate-900">{lignes.length}</strong>{" "}
                candidat(s)
              </span>
              <span>·</span>
              <span>
                Absents :{" "}
                <strong className="text-red-700">
                  {stats.totalCandidatsAbsents}
                </strong>
              </span>
              <span>·</span>
              <span>
                Complétion :{" "}
                <strong className="text-brand-orange">
                  {stats.pourcentage}%
                </strong>
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
                className="bg-brand-orange hover:bg-brand-orange/90 inline-flex cursor-pointer items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-black text-white shadow-xs transition-all disabled:cursor-not-allowed disabled:opacity-40"
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
