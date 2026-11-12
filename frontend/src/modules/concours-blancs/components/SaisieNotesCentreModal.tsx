"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  UserPlus,
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  Award,
  GraduationCap,
  Lock,
} from "lucide-react";
import type { Apprenant } from "@/modules/apprenants";
import type {
  ConcoursBlanc,
  EpreuveConcoursBlanc,
  ResultatCandidat,
  CandidatNotesInput,
  StatutNote,
} from "../types/concours-blanc.types";
import {
  useResultatsConcoursBlanc,
  useEnregistrerNotesConcoursBlanc,
} from "../hooks/useConcoursBlancs";
import {
  SelecteurEtablissement,
  useEtablissements,
  useEnregistrerEtablissement,
} from "@/modules/academique";
import { messageErreurApi } from "@/shared/lib/api-client";

interface SaisieNotesCentreModalProps {
  isOpen: boolean;
  onClose: () => void;
  concoursBlanc: ConcoursBlanc;
  formationId: string;
  formationNom: string;
  centreId: string;
  centreNom: string;
  tousLesApprenantsCentre: Apprenant[];
  tousLesApprenantsSession?: Apprenant[];
  role?: string;
  userCentreId?: string;
  centresDisponibles?: { id: string; nom: string }[];
  onChangerCentre?: (centreId: string) => void;
}

export function SaisieNotesCentreModal({
  isOpen,
  onClose,
  concoursBlanc,
  formationId,
  formationNom,
  centreId,
  centreNom,
  tousLesApprenantsCentre,
  tousLesApprenantsSession,
  role,
  userCentreId,
  centresDisponibles,
  onChangerCentre,
}: SaisieNotesCentreModalProps) {
  const estDirecteur = role === "DIRECTEUR"; // lecture seule
  const estDA = role === "DIRECTEUR_ACADEMIQUE";
  const estCloture = concoursBlanc.statut === "CLOTURE";
  const estVerrouille =
    estCloture ||
    estDirecteur ||
    Boolean(concoursBlanc.saisieNotesBloqueeCentre && !estDA);

  const { data: resultatsExistants = [], isLoading } =
    useResultatsConcoursBlanc(
      concoursBlanc.id,
      centreId,
      formationId,
      role,
      userCentreId,
    );
  const enregistrerMutation = useEnregistrerNotesConcoursBlanc();

  const [sauvegardeSucces, setSauvegardeSucces] = useState(false);
  const [lignes, setLignes] = useState<CandidatNotesInput[]>([]);
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);

  // Épreuves configurées pour cette formation
  const epreuves = useMemo(() => {
    return concoursBlanc.epreuves.filter((e) => e.formationId === formationId);
  }, [concoursBlanc, formationId]);

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

  // États pour l'ajout d'élèves
  const [rechercheApprenant, setRechercheApprenant] = useState("");
  const [nouveauNomHorsListe, setNouveauNomHorsListe] = useState("");
  const [etablissementHorsListe, setEtablissementHorsListe] = useState("");

  const { data: etablissementsCatalogue = [] } = useEtablissements();
  const enregistrerEtabMutation = useEnregistrerEtablissement();

  const poolApprenants = useMemo(() => {
    return tousLesApprenantsSession && tousLesApprenantsSession.length > 0
      ? tousLesApprenantsSession
      : tousLesApprenantsCentre;
  }, [tousLesApprenantsSession, tousLesApprenantsCentre]);

  // Initialisation des lignes dès l'ouverture ou chargement des résultats
  useEffect(() => {
    if (!isOpen) return;

    if (resultatsExistants.length > 0) {
      const initLignes = resultatsExistants.map((r) => {
        const app = poolApprenants.find((a) => a.id === r.apprenantId);
        const etablissement =
          r.etablissementOrigine && r.etablissementOrigine.trim() !== ""
            ? r.etablissementOrigine
            : app?.etablissementOrigine || "";

        return {
          id: r.id, // Conservation essentielle de l'ID pour mise à jour in-place
          formationId,
          apprenantId: r.apprenantId,
          nomComplet: r.nomComplet,
          etablissementOrigine: etablissement,
          horsListe: r.horsListe,
          notes: epreuves.map((ep) => {
            const n = r.notes.find((note) => note.epreuveId === ep.id);
            return {
              epreuveId: ep.id,
              note: n?.note ?? null,
              statut: n?.statut ?? "NOTE",
            };
          }),
        };
      });
      initLignes.sort((a, b) =>
        a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }),
      );
      setLignes(initLignes);
    } else {
      // Pré-remplissage avec les apprenants du centre triés par ordre alphabétique
      const candidatsInit: CandidatNotesInput[] = tousLesApprenantsCentre.map(
        (a) => ({
          formationId,
          apprenantId: a.id,
          nomComplet: `${a.nom} ${a.prenom}`.trim(),
          etablissementOrigine: a.etablissementOrigine || "",
          horsListe: false,
          notes: epreuves.map((ep) => ({
            epreuveId: ep.id,
            note: null,
            statut: "NOTE",
          })),
        }),
      );
      candidatsInit.sort((a, b) =>
        a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }),
      );
      setLignes(candidatsInit);
    }
  }, [
    isOpen,
    resultatsExistants,
    tousLesApprenantsCentre,
    poolApprenants,
    formationId,
    epreuves,
  ]);

  if (!isOpen) return null;

  // Filtrage des suggestions de recherche d'élèves
  const apprenantsSuggeres = poolApprenants.filter((a) => {
    const nomComplet = `${a.nom} ${a.prenom}`.toLowerCase();
    const q = rechercheApprenant.toLowerCase().trim();
    if (!q) return false;
    const estDejaPresent = lignes.some((l) => l.apprenantId === a.id);
    return !estDejaPresent && nomComplet.includes(q);
  });

  const ajouterApprenantDuCentre = (apprenant: Apprenant) => {
    if (lignes.some((c) => c.apprenantId === apprenant.id)) return;
    const nouvelleLigne: CandidatNotesInput = {
      formationId,
      apprenantId: apprenant.id,
      nomComplet: `${apprenant.nom} ${apprenant.prenom}`.trim(),
      etablissementOrigine: apprenant.etablissementOrigine || "",
      horsListe: false,
      notes: epreuves.map((ep) => ({
        epreuveId: ep.id,
        note: null,
        statut: "NOTE",
      })),
    };
    setLignes((prev) => {
      const next = [...prev, nouvelleLigne];
      next.sort((a, b) =>
        a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }),
      );
      return next;
    });
    setRechercheApprenant("");
  };

  const ajouterCandidatHorsListe = () => {
    if (!nouveauNomHorsListe.trim()) return;
    const nomEtab = etablissementHorsListe.trim();
    if (nomEtab && nomEtab.toLowerCase() !== "candidat libre") {
      enregistrerEtabMutation.mutate({ nom: nomEtab });
    }

    const nouvelleLigne: CandidatNotesInput = {
      formationId,
      apprenantId: null,
      nomComplet: nouveauNomHorsListe.trim(),
      etablissementOrigine: nomEtab || "Candidat Libre",
      horsListe: true,
      notes: epreuves.map((ep) => ({
        epreuveId: ep.id,
        note: null,
        statut: "NOTE",
      })),
    };
    setLignes((prev) => {
      const next = [...prev, nouvelleLigne];
      next.sort((a, b) =>
        a.nomComplet.localeCompare(b.nomComplet, "fr", { sensitivity: "base" }),
      );
      return next;
    });
    setNouveauNomHorsListe("");
    setEtablissementHorsListe("");
  };

  const handleNoteChange = (
    indexCandidat: number,
    epreuveId: string,
    valeur: string,
    statut: StatutNote = "NOTE",
  ) => {
    setErreurValidation(null);
    setLignes((prev) => {
      const copy = [...prev];
      const c = { ...copy[indexCandidat] };
      c.notes = c.notes.map((n) => {
        if (n.epreuveId !== epreuveId) return n;
        if (statut === "ABS" || statut === "DISP") {
          return { ...n, statut, note: null };
        }
        const numVal = valeur === "" ? null : parseFloat(valeur);
        return {
          ...n,
          statut: "NOTE",
          note: isNaN(numVal as number) ? null : numVal,
        };
      });
      copy[indexCandidat] = c;
      return copy;
    });
  };

  const basculerTousAbsents = (indexCandidat: number) => {
    setLignes((prev) => {
      const copy = [...prev];
      const c = { ...copy[indexCandidat] };
      const estDejaTousAbs =
        c.notes.length > 0 && c.notes.every((n) => n.statut === "ABS");
      c.notes = c.notes.map((n) => ({
        ...n,
        statut: estDejaTousAbs ? "NOTE" : "ABS",
        note: null,
      }));
      copy[indexCandidat] = c;
      return copy;
    });
  };

  const handleEnregistrer = async () => {
    if (estVerrouille || !concoursBlanc || enregistrerMutation.isPending)
      return;

    if (notesHorsBareme.length > 0) {
      setErreurValidation(
        `Validation impossible : ${notesHorsBareme.length} note(s) hors barème détectée(s). Les notes doivent obligatoirement être comprises entre 0 et le barème maximal autorisé.`,
      );
      return;
    }

    setErreurValidation(null);
    try {
      await enregistrerMutation.mutateAsync({
        id: concoursBlanc.id,
        payload: {
          centreId,
          candidats: lignes,
        },
        role,
        userCentreId,
      });
      setSauvegardeSucces(true);
      setTimeout(() => setSauvegardeSucces(false), 3000);
    } catch (err) {
      setErreurValidation(
        messageErreurApi(err, "Erreur lors de l'enregistrement des notes."),
      );
    }
  };

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs duration-150 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex shrink-0 flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="bg-brand-orange flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs">
              <Award size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Feuille de notation — {concoursBlanc.titre}
                </h2>
                <span className="text-brand-orange rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold">
                  {formationNom}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {centresDisponibles &&
                centresDisponibles.length > 1 &&
                onChangerCentre ? (
                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">
                      Centre :
                    </span>
                    <select
                      value={centreId}
                      onChange={(e) => onChangerCentre(e.target.value)}
                      className="focus:border-brand-orange rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-800 outline-none"
                    >
                      {centresDisponibles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-slate-400" />
                    <span>
                      Centre : <strong>{centreNom}</strong>
                    </span>
                  </span>
                )}
                <span>
                  · Date : {concoursBlanc.dateEpreuve} ({concoursBlanc.jour})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnregistrer}
              disabled={
                estVerrouille ||
                enregistrerMutation.isPending ||
                notesHorsBareme.length > 0
              }
              title={
                notesHorsBareme.length > 0
                  ? `Enregistrement bloqué : ${notesHorsBareme.length} note(s) hors barème`
                  : undefined
              }
              className="bg-brand-orange hover:bg-brand-orange/90 inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              <span>
                {enregistrerMutation.isPending
                  ? "Enregistrement..."
                  : notesHorsBareme.length > 0
                    ? `Bloqué (${notesHorsBareme.length} hors barème)`
                    : "Enregistrer les notes"}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Bannière Notes Hors Barème */}
        {(notesHorsBareme.length > 0 || erreurValidation) && (
          <div className="my-2 flex shrink-0 items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 shadow-2xs">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0 text-rose-600"
            />
            <div className="space-y-1">
              <p className="font-bold">
                {erreurValidation ||
                  `${notesHorsBareme.length} note(s) hors barème détectée(s) — Enregistrement bloqué`}
              </p>
              {notesHorsBareme.length > 0 && (
                <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-rose-800">
                  {notesHorsBareme.slice(0, 4).map((inv, i) => (
                    <li key={i}>
                      <span className="font-semibold">{inv.candidatNom}</span> :
                      note de <strong>{inv.note}</strong> en{" "}
                      <em>{inv.epreuveIntitule}</em> (barème autorisé : 0 à{" "}
                      {inv.noteMax})
                    </li>
                  ))}
                  {notesHorsBareme.length > 4 && (
                    <li>
                      ... et {notesHorsBareme.length - 4} autre(s) note(s) hors
                      barème
                    </li>
                  )}
                </ul>
              )}
              <p className="text-[11px] font-medium text-rose-700">
                Chaque note doit être comprise entre 0 et la note maximale de
                l&apos;épreuve.
              </p>
            </div>
          </div>
        )}

        {estVerrouille && (
          <div className="my-2 flex shrink-0 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-800">
            <Lock size={16} className="shrink-0 text-red-600" />
            <span>
              {estCloture
                ? "Ce concours blanc est définitivement clôturé. La saisie et modification des notes sont fermées."
                : "La saisie des notes a été verrouillée pour les centres par la Direction Académique. Vous pouvez consulter les notes mais la modification est désactivée."}
            </span>
          </div>
        )}

        {sauvegardeSucces && (
          <div className="animate-in fade-in my-2 flex shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>
              Notes enregistrées avec succès pour le centre {centreNom} !
            </span>
          </div>
        )}

        {/* Barre d'outils d'ajout : Recherche inter-formation & Ajout hors-liste */}
        {!estVerrouille && (
          <div className="-mx-6 flex shrink-0 flex-col items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 md:flex-row">
            {/* Outil 1 : Recherche élève d'un autre groupe ou du centre */}
            <div className="relative w-full md:w-80">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-2xs">
                <Search size={14} className="shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={rechercheApprenant}
                  onChange={(e) => setRechercheApprenant(e.target.value)}
                  placeholder="Chercher un élève (autre groupe / centre)..."
                  className="w-full bg-transparent font-medium text-slate-800 placeholder-slate-400 outline-none"
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

              {/* Menu déroulant des résultats de recherche */}
              {apprenantsSuggeres.length > 0 && (
                <div className="absolute top-full left-0 z-30 mt-1 max-h-48 w-full divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {apprenantsSuggeres.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => ajouterApprenantDuCentre(a)}
                      className="group flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-orange-50"
                    >
                      <div>
                        <span className="block font-bold text-slate-800">
                          {a.nom} {a.prenom}
                        </span>
                        {a.etablissementOrigine && (
                          <span className="block text-[10px] text-slate-400">
                            {a.etablissementOrigine}
                          </span>
                        )}
                      </div>
                      <span className="text-brand-orange text-[10px] font-semibold group-hover:underline">
                        + Ajouter
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Outil 2 : Ajout d'un nouveau nom (candidat libre / hors liste) */}
            <div className="flex w-full items-center gap-2 md:w-auto">
              <input
                type="text"
                value={nouveauNomHorsListe}
                onChange={(e) => setNouveauNomHorsListe(e.target.value)}
                placeholder="Nom et prénom candidat libre..."
                className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
              />
              <div className="w-52">
                <SelecteurEtablissement
                  value={etablissementHorsListe}
                  onChange={setEtablissementHorsListe}
                  placeholder="Établissement / Lycée..."
                  variant="compact"
                />
              </div>
              <button
                type="button"
                onClick={ajouterCandidatHorsListe}
                disabled={!nouveauNomHorsListe.trim()}
                className="border-brand-orange/60 text-brand-orange hover:bg-brand-orange inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-dashed bg-orange-50/60 px-3 py-1.5 text-xs font-bold transition-all hover:text-white disabled:opacity-40"
              >
                <UserPlus size={13} />
                <span>+ Candidat hors-liste</span>
              </button>
            </div>
          </div>
        )}

        {/* Grille de saisie des notes */}
        <div className="-mx-6 flex-1 overflow-auto px-6 py-2">
          {lignes.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Aucun candidat sur cette feuille de notation. Utilisez la barre
              ci-dessus pour ajouter des candidats.
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-b-slate-300 bg-slate-100/90 text-slate-700">
                  <th className="w-10 px-3 py-2.5 text-center font-bold">N°</th>
                  <th className="min-w-[200px] px-3 py-2.5 font-bold">
                    Nom et Prénom du Candidat
                  </th>
                  <th className="min-w-[140px] px-3 py-2.5 font-bold">
                    Établissement / Statut
                  </th>
                  {epreuves.map((ep) => (
                    <th
                      key={ep.id}
                      className="min-w-[140px] border-l border-slate-200 px-3 py-2.5 text-center font-bold"
                    >
                      <div>{ep.intitule}</div>
                      <div className="text-[10px] font-normal text-slate-500">
                        Max /{ep.noteMax} · Coef {ep.coefficient}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lignes.map((candidat, idx) => {
                  const estToutAbsent =
                    candidat.notes.length > 0 &&
                    candidat.notes.every((n) => n.statut === "ABS");

                  return (
                    <tr
                      key={candidat.apprenantId || `hl-${idx}`}
                      className={`transition-colors ${
                        estToutAbsent
                          ? "bg-rose-50/20 hover:bg-rose-50/30"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="px-3 py-2 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-900">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {candidat.horsListe && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 uppercase">
                                Hors-liste
                              </span>
                            )}
                            <span>{candidat.nomComplet}</span>
                            {estToutAbsent && (
                              <span
                                className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-700 uppercase"
                                title="Absent(e) à la totalité des épreuves"
                              >
                                ABS
                              </span>
                            )}
                          </div>
                          {!estVerrouille && (
                            <button
                              type="button"
                              onClick={() => basculerTousAbsents(idx)}
                              title={
                                estToutAbsent
                                  ? "Repasser en mode Note"
                                  : "Marquer absent à toutes les épreuves"
                              }
                              className={`cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold transition-all ${
                                estToutAbsent
                                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                  : "border border-slate-200 text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                              }`}
                            >
                              {estToutAbsent ? "Annuler ABS" : "ABS"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="min-w-[160px] px-3 py-2 text-xs">
                        <SelecteurEtablissement
                          value={candidat.etablissementOrigine || ""}
                          disabled={estVerrouille}
                          onChange={(nouvelEtab) => {
                            setLignes((prev) =>
                              prev.map((lig, lIdx) =>
                                lIdx === idx
                                  ? { ...lig, etablissementOrigine: nouvelEtab }
                                  : lig,
                              ),
                            );
                          }}
                          variant="compact"
                          placeholder="Lycée / Établissement"
                        />
                      </td>

                      {/* Cellules de saisie pour chaque épreuve */}
                      {epreuves.map((ep) => {
                        const noteObj = candidat.notes.find(
                          (n) => n.epreuveId === ep.id,
                        );
                        const noteVal = noteObj?.note ?? "";
                        const statut = noteObj?.statut ?? "NOTE";
                        const depasseMax =
                          typeof noteVal === "number" &&
                          (noteVal > ep.noteMax || noteVal < 0);

                        return (
                          <td
                            key={ep.id}
                            className="border-l border-slate-200 px-3 py-1.5 text-center"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {statut === "NOTE" ? (
                                  <input
                                    type="number"
                                    step="0.25"
                                    min={0}
                                    max={ep.noteMax}
                                    disabled={estVerrouille}
                                    value={noteVal}
                                    onChange={(e) =>
                                      handleNoteChange(
                                        idx,
                                        ep.id,
                                        e.target.value,
                                        "NOTE",
                                      )
                                    }
                                    placeholder={`--/${ep.noteMax}`}
                                    title={
                                      depasseMax
                                        ? noteVal < 0
                                          ? "Note négative interdite !"
                                          : `Note ${noteVal} hors barème ! Le barème maximal est de ${ep.noteMax}.`
                                        : undefined
                                    }
                                    className={`w-18 rounded-lg border px-2 py-1 text-center text-xs font-bold transition outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                                      depasseMax
                                        ? "border-2 border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-200"
                                        : "focus:border-brand-orange border-slate-200 text-slate-800"
                                    }`}
                                  />
                                ) : (
                                  <span
                                    className={`w-18 rounded-lg py-1 text-center text-xs font-black uppercase ${
                                      statut === "ABS"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {statut}
                                  </span>
                                )}

                                {/* Menu bascule NOTE / ABS / DISP */}
                                <select
                                  value={statut}
                                  disabled={estVerrouille}
                                  onChange={(e) =>
                                    handleNoteChange(
                                      idx,
                                      ep.id,
                                      "",
                                      e.target.value as StatutNote,
                                    )
                                  }
                                  className="rounded-md border border-slate-200 bg-slate-50 px-1 py-1 text-[10px] font-bold text-slate-600 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                                >
                                  <option value="NOTE">Note</option>
                                  <option value="ABS">ABS</option>
                                  <option value="DISP">DISP</option>
                                </select>
                              </div>
                              {depasseMax && (
                                <span className="mt-0.5 text-[9px] font-bold whitespace-nowrap text-rose-600">
                                  {noteVal < 0 ? "< 0 !" : `max ${ep.noteMax}`}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pied de modal */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
          <span>
            Total : <strong>{lignes.length}</strong> candidat
            {lignes.length > 1 ? "s" : ""} enregistré
            {lignes.length > 1 ? "s" : ""} pour ce centre
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleEnregistrer}
              disabled={
                enregistrerMutation.isPending ||
                estVerrouille ||
                notesHorsBareme.length > 0
              }
              title={
                notesHorsBareme.length > 0
                  ? `Enregistrement bloqué : ${notesHorsBareme.length} note(s) hors barème`
                  : undefined
              }
              className="bg-brand-orange hover:bg-brand-orange/90 inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-5 py-2 font-bold text-white shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} />
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
      </div>
    </div>
  );
}
