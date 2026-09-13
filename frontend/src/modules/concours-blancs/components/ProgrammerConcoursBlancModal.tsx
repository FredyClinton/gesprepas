"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Award,
  Layers,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  AlertCircle,
  Building2,
} from "lucide-react";
import type { Formation } from "@/modules/academique";
import type { Matiere } from "@/modules/matieres";
import type { Centre } from "@/modules/centres-sessions";
import { useCreerConcoursBlanc, useModifierConcoursBlanc } from "../hooks/useConcoursBlancs";
import type { JourSemaine, ConcoursBlanc } from "../types/concours-blanc.types";

interface ProgrammerConcoursBlancModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  formations: Formation[];
  matieres: Matiere[];
  centres: Centre[];
  concoursBlancAModifier?: ConcoursBlanc | null;
  dernierNumero?: number;
}

interface EpreuveConfig {
  matiereId: string;
  intitule: string;
  dureeMinutes: number;
  noteMax: number;
  coefficient: number;
}

const JOURS_SEMAINE: { key: JourSemaine; label: string; jsIndex: number }[] = [
  { key: "LUNDI", label: "Lundi", jsIndex: 1 },
  { key: "MARDI", label: "Mardi", jsIndex: 2 },
  { key: "MERCREDI", label: "Mercredi", jsIndex: 3 },
  { key: "JEUDI", label: "Jeudi", jsIndex: 4 },
  { key: "VENDREDI", label: "Vendredi", jsIndex: 5 },
  { key: "SAMEDI", label: "Samedi", jsIndex: 6 },
];

export function ProgrammerConcoursBlancModal({
  isOpen,
  onClose,
  sessionId,
  formations,
  matieres,
  centres,
  concoursBlancAModifier,
  dernierNumero = 0,
}: ProgrammerConcoursBlancModalProps) {
  const estModification = Boolean(concoursBlancAModifier);
  const creerMutation = useCreerConcoursBlanc();
  const modifierMutation = useModifierConcoursBlanc();

  const [numero, setNumero] = useState(dernierNumero + 1);
  const [titre, setTitre] = useState(`Concours Blanc N°${dernierNumero + 1}`);
  const [dateEpreuve, setDateEpreuve] = useState("");
  const [jour, setJour] = useState<JourSemaine>("SAMEDI");
  const [semaine, setSemaine] = useState(1);
  const [seanceDebut, setSeanceDebut] = useState(1);
  const [seanceFin, setSeanceFin] = useState(3);

  // Centres participants
  const [tousLesCentres, setTousLesCentres] = useState(true);
  const [centresSelectionnes, setCentresSelectionnes] = useState<string[]>([]);

  // Formations sélectionnées -> liste des épreuves configurées
  const [formationsSelectionnees, setFormationsSelectionnees] = useState<string[]>([]);
  const [epreuvesParFormation, setEpreuvesParFormation] = useState<Record<string, EpreuveConfig[]>>({});

  const prevIsOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (concoursBlancAModifier) {
        setNumero(concoursBlancAModifier.numero);
        setTitre(concoursBlancAModifier.titre);
        setDateEpreuve(concoursBlancAModifier.dateEpreuve);
        setJour(concoursBlancAModifier.jour);
        setSemaine(concoursBlancAModifier.semaine);
        setSeanceDebut(concoursBlancAModifier.seanceDebut);
        setSeanceFin(concoursBlancAModifier.seanceFin);
        setTousLesCentres(concoursBlancAModifier.tousLesCentres ?? true);
        setCentresSelectionnes(
          concoursBlancAModifier.centreIds && concoursBlancAModifier.centreIds.length > 0
            ? concoursBlancAModifier.centreIds
            : centres.map((c) => c.id),
        );

        const fIds = Array.from(new Set(concoursBlancAModifier.epreuves.map((e) => e.formationId)));
        setFormationsSelectionnees(fIds);

        const map: Record<string, EpreuveConfig[]> = {};
        for (const ep of concoursBlancAModifier.epreuves) {
          if (!map[ep.formationId]) map[ep.formationId] = [];
          map[ep.formationId].push({
            matiereId: ep.matiereId,
            intitule: ep.intitule,
            dureeMinutes: ep.dureeMinutes,
            noteMax: ep.noteMax,
            coefficient: ep.coefficient,
          });
        }
        setEpreuvesParFormation(map);
      } else {
        setNumero(dernierNumero + 1);
        setTitre(`Concours Blanc N°${dernierNumero + 1}`);
        setDateEpreuve("");
        setJour("SAMEDI");
        setSemaine(1);
        setSeanceDebut(1);
        setSeanceFin(3);
        setTousLesCentres(true);
        setCentresSelectionnes(centres.map((c) => c.id));
        setFormationsSelectionnees([]);
        setEpreuvesParFormation({});
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, concoursBlancAModifier, dernierNumero, centres]);

  if (!isOpen) return null;

  // Calcul automatique du jour à partir de la date
  const handleDateChange = (val: string) => {
    setDateEpreuve(val);
    if (!val) return;
    const d = new Date(val);
    const day = d.getDay();
    const match = JOURS_SEMAINE.find((j) => j.jsIndex === day);
    if (match) setJour(match.key);
  };

  const toggleFormation = (fId: string) => {
    if (formationsSelectionnees.includes(fId)) {
      setFormationsSelectionnees((prev) => prev.filter((id) => id !== fId));
    } else {
      setFormationsSelectionnees((prev) => [...prev, fId]);
      // Initialiser avec les matières de la formation si non configuré
      if (!epreuvesParFormation[fId]) {
        const formation = formations.find((f) => f.id === fId);
        const matieresF = matieres.filter((m) => formation?.matiereIds?.includes(m.id));
        const initEpreuves: EpreuveConfig[] = matieresF.map((m) => ({
          matiereId: m.id,
          intitule: m.nom,
          dureeMinutes: 120,
          noteMax: 20,
          coefficient: 1,
        }));
        setEpreuvesParFormation((prev) => ({ ...prev, [fId]: initEpreuves }));
      }
    }
  };

  const ajouterMatiereAFormation = (fId: string, mId: string) => {
    const current = epreuvesParFormation[fId] ?? [];
    if (current.some((e) => e.matiereId === mId)) return;
    const matiere = matieres.find((m) => m.id === mId);
    if (!matiere) return;

    setEpreuvesParFormation((prev) => ({
      ...prev,
      [fId]: [
        ...current,
        {
          matiereId: mId,
          intitule: matiere.nom,
          dureeMinutes: 120,
          noteMax: 20,
          coefficient: 1,
        },
      ],
    }));
  };

  const retirerEpreuve = (fId: string, mId: string) => {
    setEpreuvesParFormation((prev) => ({
      ...prev,
      [fId]: (prev[fId] ?? []).filter((e) => e.matiereId !== mId),
    }));
  };

  const modifierEpreuve = (
    fId: string,
    mId: string,
    champ: keyof EpreuveConfig,
    valeur: string | number,
  ) => {
    setEpreuvesParFormation((prev) => ({
      ...prev,
      [fId]: (prev[fId] ?? []).map((e) =>
        e.matiereId === mId ? { ...e, [champ]: valeur } : e,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateEpreuve) {
      alert("Veuillez sélectionner la date du concours blanc.");
      return;
    }
    if (formationsSelectionnees.length === 0) {
      alert("Veuillez sélectionner au moins une formation concernée.");
      return;
    }
    if (!tousLesCentres && centresSelectionnes.length === 0) {
      alert("Veuillez sélectionner au moins un centre concerné ou cocher 'Tous les centres'.");
      return;
    }

    const epreuvesPayload = formationsSelectionnees.flatMap((fId) => {
      const configs = epreuvesParFormation[fId] ?? [];
      return configs.map((c) => ({
        formationId: fId,
        matiereId: c.matiereId,
        intitule: c.intitule,
        dureeMinutes: Number(c.dureeMinutes) || 120,
        noteMax: Number(c.noteMax) || 20,
        coefficient: Number(c.coefficient) || 1,
      }));
    });

    if (epreuvesPayload.length === 0) {
      alert("Veuillez configurer au moins une matière d'épreuve.");
      return;
    }

    if (estModification && concoursBlancAModifier) {
      await modifierMutation.mutateAsync({
        id: concoursBlancAModifier.id,
        payload: {
          titre,
          numero: Number(numero) || 1,
          dateEpreuve,
          jour,
          semaine: Number(semaine) || 1,
          seanceDebut: Number(seanceDebut) || 1,
          seanceFin: Number(seanceFin) || 3,
          tousLesCentres,
          centreIds: tousLesCentres ? [] : centresSelectionnes,
          epreuves: epreuvesPayload,
        },
      });
    } else {
      await creerMutation.mutateAsync({
        sessionId,
        titre,
        numero: Number(numero) || 1,
        dateEpreuve,
        jour,
        semaine: Number(semaine) || 1,
        seanceDebut: Number(seanceDebut) || 1,
        seanceFin: Number(seanceFin) || 3,
        tousLesCentres,
        centreIds: tousLesCentres ? [] : centresSelectionnes,
        epreuves: epreuvesPayload,
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange text-white shadow-xs">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {estModification ? "Modifier le Concours Blanc" : "Programmer un Concours Blanc"}
              </h2>
              <p className="text-xs text-slate-500">
                Planification de l&rsquo;examen, réservation de créneau et paramétrage des épreuves
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps formulaire */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5">
          {/* Bloc 1 : Informations Générales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Titre du Concours Blanc
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro d&rsquo;édition
              </label>
              <input
                type="number"
                min={1}
                value={numero}
                onChange={(e) => {
                  setNumero(Number(e.target.value));
                  setTitre(`Concours Blanc N°${e.target.value}`);
                }}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Semaine académique
              </label>
              <input
                type="number"
                min={1}
                value={semaine}
                onChange={(e) => setSemaine(Number(e.target.value))}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date de l&rsquo;épreuve
              </label>
              <input
                type="date"
                value={dateEpreuve}
                onChange={(e) => handleDateChange(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-orange focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jour
              </label>
              <select
                value={jour}
                onChange={(e) => setJour(e.target.value as JourSemaine)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-orange focus:outline-none"
              >
                {JOURS_SEMAINE.map((j) => (
                  <option key={j.key} value={j.key}>
                    {j.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Séance Début
              </label>
              <select
                value={seanceDebut}
                onChange={(e) => setSeanceDebut(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-orange focus:outline-none"
              >
                <option value={1}>Séance 1 (Matin)</option>
                <option value={2}>Séance 2 (Midi)</option>
                <option value={3}>Séance 3 (Après-midi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Séance Fin
              </label>
              <select
                value={seanceFin}
                onChange={(e) => setSeanceFin(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-brand-orange focus:outline-none"
              >
                <option value={1}>Séance 1</option>
                <option value={2}>Séance 2</option>
                <option value={3}>Séance 3</option>
              </select>
            </div>
          </div>

          {/* Bloc 2 : Centres concernés */}
          <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Building2 size={16} className="text-brand-orange" />
                <span>Centres concernés par le Concours Blanc</span>
              </label>
              {!tousLesCentres && (
                <span className="text-[11px] font-bold text-brand-orange bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                  {centresSelectionnes.length} / {centres.length} centre(s) sélectionné(s)
                </span>
              )}
            </div>

            {/* Sélecteur de mode de participation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTousLesCentres(true);
                  setCentresSelectionnes(centres.map((c) => c.id));
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  tousLesCentres
                    ? "bg-white border-brand-orange shadow-xs ring-2 ring-brand-orange/15"
                    : "bg-white/60 border-slate-200 hover:bg-white text-slate-600"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    tousLesCentres ? "bg-brand-orange text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  🌐
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Tous les centres</div>
                  <div className="text-[11px] text-slate-500">
                    Tous les {centres.length} centres de la session participent
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTousLesCentres(false);
                  if (centresSelectionnes.length === 0) {
                    setCentresSelectionnes(centres.map((c) => c.id));
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  !tousLesCentres
                    ? "bg-white border-brand-orange shadow-xs ring-2 ring-brand-orange/15"
                    : "bg-white/60 border-slate-200 hover:bg-white text-slate-600"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                    !tousLesCentres ? "bg-brand-orange text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  🏛️
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Sélectionner les centres</div>
                  <div className="text-[11px] text-slate-500">
                    Choisir manuellement les centres participants
                  </div>
                </div>
              </button>
            </div>

            {/* Liste explicite des centres lorsque sélection manuelle active */}
            {!tousLesCentres && (
              <div className="pt-2 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Cochez les centres participants :</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCentresSelectionnes(centres.map((c) => c.id))}
                      className="text-brand-orange font-bold hover:underline cursor-pointer"
                    >
                      Tout sélectionner
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() => setCentresSelectionnes([])}
                      className="text-slate-500 hover:text-slate-700 font-bold hover:underline cursor-pointer"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {centres.map((c) => {
                    const estCoche = centresSelectionnes.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (estCoche) {
                            setCentresSelectionnes((prev) => prev.filter((id) => id !== c.id));
                          } else {
                            setCentresSelectionnes((prev) => [...prev, c.id]);
                          }
                        }}
                        className={`inline-flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer border ${
                          estCoche
                            ? "bg-brand-orange text-white border-brand-orange shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="truncate">{c.nom}</span>
                        {estCoche ? (
                          <CheckSquare size={14} className="shrink-0" />
                        ) : (
                          <Square size={14} className="shrink-0 text-slate-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {centresSelectionnes.length === 0 && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    <span>Attention : Veuillez sélectionner au moins un centre.</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bloc 3 : Formations & Épreuves */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers size={16} className="text-brand-orange" />
              <span>Formations & Épreuves concernées</span>
            </h3>

            {/* Sélecteur de filières participantes */}
            <div className="flex flex-wrap gap-2">
              {formations.map((f) => {
                const estSelectionne = formationsSelectionnees.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFormation(f.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                      estSelectionne
                        ? "bg-brand-orange text-white border-brand-orange shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {estSelectionne ? <CheckSquare size={14} /> : <Square size={14} />}
                    <span>{f.nom}</span>
                  </button>
                );
              })}
            </div>

            {/* Configuration des épreuves pour chaque filière cochée */}
            <div className="space-y-4 pt-2">
              {formationsSelectionnees.map((fId) => {
                const formation = formations.find((f) => f.id === fId);
                const epreuves = epreuvesParFormation[fId] ?? [];
                const matieresDispos = matieres.filter(
                  (m) => !epreuves.some((e) => e.matiereId === m.id),
                );

                return (
                  <div
                    key={fId}
                    className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900 uppercase">
                          {formation?.nom}
                        </span>
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-brand-orange">
                          {epreuves.length} épreuve{epreuves.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Ajout d'une matière supplémentaire */}
                      {matieresDispos.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                ajouterMatiereAFormation(fId, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
                          >
                            <option value="" disabled>
                              + Ajouter une matière...
                            </option>
                            {matieresDispos.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nom}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Tableau des matières de cette formation */}
                    {epreuves.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        Aucune matière configurée pour cette filière.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                              <th className="py-2">Matière</th>
                              <th className="py-2 w-28">Durée (min)</th>
                              <th className="py-2 w-24">Note Max</th>
                              <th className="py-2 w-24">Coefficient</th>
                              <th className="py-2 w-10 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {epreuves.map((ep) => (
                              <tr key={ep.matiereId} className="hover:bg-slate-50/60">
                                <td className="py-2 pr-2 font-bold text-slate-800">
                                  {ep.intitule}
                                </td>
                                <td className="py-2 pr-2">
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} className="text-slate-400" />
                                    <input
                                      type="number"
                                      min={15}
                                      step={15}
                                      value={ep.dureeMinutes}
                                      onChange={(e) =>
                                        modifierEpreuve(
                                          fId,
                                          ep.matiereId,
                                          "dureeMinutes",
                                          Number(e.target.value),
                                        )
                                      }
                                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800"
                                    />
                                  </div>
                                </td>
                                <td className="py-2 pr-2">
                                  <input
                                    type="number"
                                    min={1}
                                    value={ep.noteMax}
                                    onChange={(e) =>
                                      modifierEpreuve(
                                        fId,
                                        ep.matiereId,
                                        "noteMax",
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800"
                                  />
                                </td>
                                <td className="py-2 pr-2">
                                  <input
                                    type="number"
                                    min={0.5}
                                    step={0.5}
                                    value={ep.coefficient}
                                    onChange={(e) =>
                                      modifierEpreuve(
                                        fId,
                                        ep.matiereId,
                                        "coefficient",
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800"
                                  />
                                </td>
                                <td className="py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => retirerEpreuve(fId, ep.matiereId)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    title="Retirer cette épreuve"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-orange-50/70 p-3 border border-orange-200/60 text-xs text-slate-600">
            <AlertCircle size={15} className="text-brand-orange shrink-0" />
            <span>
              Les créneaux de ce concours blanc seront automatiquement réservés sur la grille de planification
              pour l&rsquo;ensemble des salles des filières sélectionnées.
            </span>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creerMutation.isPending || modifierMutation.isPending}
              className="rounded-xl bg-brand-orange px-5 py-2 text-xs font-bold text-white hover:bg-brand-orange/90 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {creerMutation.isPending || modifierMutation.isPending
                ? "Enregistrement en cours..."
                : estModification
                  ? "Enregistrer les modifications"
                  : "Valider et Programmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

