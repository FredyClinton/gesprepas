"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  UserPlus,
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
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
  useEtablissements,
  useEnregistrerEtablissement,
} from "@/modules/academique/data/etablissements";

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
  const estDA = role === "DIRECTEUR_ACADEMIQUE" || role === "DIRECTEUR";
  const estCloture = concoursBlanc.statut === "CLOTURE";
  const estVerrouille = estCloture || Boolean(concoursBlanc.saisieNotesBloqueeCentre && !estDA);

  const { data: resultatsExistants = [], isLoading } = useResultatsConcoursBlanc(
    concoursBlanc.id,
    centreId,
    formationId,
    role,
    userCentreId,
  );
  const enregistrerMutation = useEnregistrerNotesConcoursBlanc();

  const [sauvegardeSucces, setSauvegardeSucces] = useState(false);
  const [lignes, setLignes] = useState<CandidatNotesInput[]>([]);

  // Épreuves configurées pour cette formation
  const epreuves = useMemo(() => {
    return concoursBlanc.epreuves.filter((e) => e.formationId === formationId);
  }, [concoursBlanc, formationId]);

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
      setLignes(
        resultatsExistants.map((r) => {
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
        }),
      );
    } else {
      // Pré-remplissage avec les apprenants du centre
      const candidatsInit: CandidatNotesInput[] = tousLesApprenantsCentre.map((a) => ({
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
      }));
      setLignes(candidatsInit);
    }
  }, [isOpen, resultatsExistants, tousLesApprenantsCentre, poolApprenants, formationId, epreuves]);

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
    setLignes((prev) => [nouvelleLigne, ...prev]);
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
    setLignes((prev) => [...prev, nouvelleLigne]);
    setNouveauNomHorsListe("");
    setEtablissementHorsListe("");
  };

  const handleNoteChange = (
    indexCandidat: number,
    epreuveId: string,
    valeur: string,
    statut: StatutNote = "NOTE",
  ) => {
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

  const handleEnregistrer = async () => {
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
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white shadow-xs">
              <Award size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Feuille de notation — {concoursBlanc.titre}
                </h2>
                <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-brand-orange">
                  {formationNom}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                {centresDisponibles && centresDisponibles.length > 1 && onChangerCentre ? (
                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-slate-400" />
                    <span className="font-semibold text-slate-700">Centre :</span>
                    <select
                      value={centreId}
                      onChange={(e) => onChangerCentre(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange"
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
                    <span>Centre : <strong>{centreNom}</strong></span>
                  </span>
                )}
                <span>· Date : {concoursBlanc.dateEpreuve} ({concoursBlanc.jour})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnregistrer}
              disabled={estVerrouille || enregistrerMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange/90 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{enregistrerMutation.isPending ? "Enregistrement..." : "Enregistrer les notes"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {estVerrouille && (
          <div className="my-2 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 border border-red-200 text-xs font-bold text-red-800 shrink-0">
            <Lock size={16} className="text-red-600 shrink-0" />
            <span>
              {estCloture
                ? "Ce concours blanc est définitivement clôturé. La saisie et modification des notes sont fermées."
                : "La saisie des notes a été verrouillée pour les centres par la Direction Académique. Vous pouvez consulter les notes mais la modification est désactivée."}
            </span>
          </div>
        )}

        {sauvegardeSucces && (
          <div className="my-2 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 border border-emerald-200 text-xs font-bold text-emerald-800 animate-in fade-in shrink-0">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Notes enregistrées avec succès pour le centre {centreNom} !</span>
          </div>
        )}

        {/* Barre d'outils d'ajout : Recherche inter-formation & Ajout hors-liste */}
        {!estVerrouille && (
          <div className="py-3 px-4 bg-slate-50 border-b border-slate-200 -mx-6 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
            {/* Outil 1 : Recherche élève d'un autre groupe ou du centre */}
            <div className="relative w-full md:w-80">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs text-xs">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={rechercheApprenant}
                  onChange={(e) => setRechercheApprenant(e.target.value)}
                  placeholder="Chercher un élève (autre groupe / centre)..."
                  className="w-full outline-none text-slate-800 placeholder-slate-400 bg-transparent font-medium"
                />
                {rechercheApprenant && (
                  <button type="button" onClick={() => setRechercheApprenant("")} className="text-slate-400 hover:text-slate-600">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Menu déroulant des résultats de recherche */}
              {apprenantsSuggeres.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {apprenantsSuggeres.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => ajouterApprenantDuCentre(a)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">{a.nom} {a.prenom}</span>
                        {a.etablissementOrigine && (
                          <span className="text-[10px] text-slate-400 block">{a.etablissementOrigine}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-brand-orange font-semibold group-hover:underline">+ Ajouter</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Outil 2 : Ajout d'un nouveau nom (candidat libre / hors liste) */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={nouveauNomHorsListe}
                onChange={(e) => setNouveauNomHorsListe(e.target.value)}
                placeholder="Nom et prénom candidat libre..."
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none w-48"
              />
              <input
                type="text"
                list="liste-etablissements-saisie"
                value={etablissementHorsListe}
                onChange={(e) => setEtablissementHorsListe(e.target.value)}
                placeholder="Établissement / Lycée..."
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none w-36"
              />
              <button
                type="button"
                onClick={ajouterCandidatHorsListe}
                disabled={!nouveauNomHorsListe.trim()}
                className="inline-flex items-center gap-1 rounded-xl border border-dashed border-brand-orange/60 bg-orange-50/60 px-3 py-1.5 text-xs font-bold text-brand-orange hover:bg-brand-orange hover:text-white transition-all cursor-pointer disabled:opacity-40 shrink-0"
              >
                <UserPlus size={13} />
                <span>+ Candidat hors-liste</span>
              </button>
            </div>
          </div>
        )}

        {/* Datalist pour auto-complétion intelligente des établissements */}
        <datalist id="liste-etablissements-saisie">
          {etablissementsCatalogue.map((e) => (
            <option key={e.id} value={e.nom}>
              {e.ville ? `${e.nom} (${e.ville})` : e.nom}
            </option>
          ))}
        </datalist>

        {/* Grille de saisie des notes */}
        <div className="flex-1 overflow-auto -mx-6 px-6 py-2">
          {lignes.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Aucun candidat sur cette feuille de notation. Utilisez la barre ci-dessus pour ajouter des candidats.
            </div>
          ) : (
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-b-slate-300 bg-slate-100/90 text-slate-700">
                  <th className="py-2.5 px-3 w-10 text-center font-bold">N°</th>
                  <th className="py-2.5 px-3 min-w-[200px] font-bold">Nom et Prénom du Candidat</th>
                  <th className="py-2.5 px-3 min-w-[140px] font-bold">Établissement / Statut</th>
                  {epreuves.map((ep) => (
                    <th key={ep.id} className="py-2.5 px-3 text-center min-w-[140px] font-bold border-l border-slate-200">
                      <div>{ep.intitule}</div>
                      <div className="text-[10px] font-normal text-slate-500">
                        Max /{ep.noteMax} · Coef {ep.coefficient}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lignes.map((candidat, idx) => (
                  <tr key={candidat.apprenantId || `hl-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {candidat.horsListe && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 uppercase">
                            Hors-liste
                          </span>
                        )}
                        <span>{candidat.nomComplet}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs">
                      <input
                        type="text"
                        list="liste-etablissements-saisie"
                        disabled={estVerrouille}
                        value={candidat.etablissementOrigine || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLignes((prev) =>
                            prev.map((lig, lIdx) =>
                              lIdx === idx ? { ...lig, etablissementOrigine: val } : lig,
                            ),
                          );
                        }}
                        placeholder="Lycée / Établissement"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-orange focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* Cellules de saisie pour chaque épreuve */}
                    {epreuves.map((ep) => {
                      const noteObj = candidat.notes.find((n) => n.epreuveId === ep.id);
                      const noteVal = noteObj?.note ?? "";
                      const statut = noteObj?.statut ?? "NOTE";

                      return (
                        <td key={ep.id} className="py-1.5 px-3 border-l border-slate-200 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {statut === "NOTE" ? (
                              <input
                                type="number"
                                step="0.25"
                                min={0}
                                max={ep.noteMax}
                                disabled={estVerrouille}
                                value={noteVal}
                                onChange={(e) => handleNoteChange(idx, ep.id, e.target.value, "NOTE")}
                                placeholder="--/20"
                                className="w-18 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                              />
                            ) : (
                              <span
                                className={`w-18 rounded-lg py-1 text-center text-xs font-black uppercase ${
                                  statut === "ABS" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
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
                                handleNoteChange(idx, ep.id, "", e.target.value as StatutNote)
                              }
                              className="rounded-md border border-slate-200 bg-slate-50 px-1 py-1 text-[10px] font-bold text-slate-600 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                            >
                              <option value="NOTE">Note</option>
                              <option value="ABS">ABS</option>
                              <option value="DISP">DISP</option>
                            </select>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pied de modal */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0 text-xs text-slate-500">
          <span>
            Total : <strong>{lignes.length}</strong> candidat{lignes.length > 1 ? "s" : ""} enregistré{lignes.length > 1 ? "s" : ""} pour ce centre
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleEnregistrer}
              disabled={enregistrerMutation.isPending || estVerrouille}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-5 py-2 font-bold text-white hover:bg-brand-orange/90 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} />
              <span>{enregistrerMutation.isPending ? "Enregistrement..." : "Enregistrer les notes"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

