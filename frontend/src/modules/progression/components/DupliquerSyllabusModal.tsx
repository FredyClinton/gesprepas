"use client";

import { useMemo, useState } from "react";
import { Copy, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

import { Modal, Button } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import type { Formation } from "@/modules/academique";
import type { Salle } from "@/modules/salle";
import type { Progression, CreerProgressionPayload } from "../domain/types";
import { useCreerProgressionsLot } from "../data/queries";

interface DupliquerSyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  formationActuelleId: string;
  formationActuelleNom: string;
  formations: Formation[];
  salles: Salle[];
  matiereId: string;
  sessionId: string;
  toutesProgressions: Progression[];
}

export function DupliquerSyllabusModal({
  isOpen,
  onClose,
  formationActuelleId,
  formationActuelleNom,
  formations,
  salles,
  matiereId,
  sessionId,
  toutesProgressions,
}: DupliquerSyllabusModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dupliquer un syllabus"
      description="Copiez l'intégralité du programme d'une filière vers une autre pour gagner du temps."
    >
      <DupliquerSyllabusForm
        onClose={onClose}
        formationActuelleId={formationActuelleId}
        formationActuelleNom={formationActuelleNom}
        formations={formations}
        salles={salles}
        matiereId={matiereId}
        sessionId={sessionId}
        toutesProgressions={toutesProgressions}
      />
    </Modal>
  );
}

function DupliquerSyllabusForm({
  onClose,
  formationActuelleId,
  formationActuelleNom,
  formations,
  salles,
  matiereId,
  sessionId,
  toutesProgressions,
}: Omit<DupliquerSyllabusModalProps, "isOpen">) {
  const [sourceFormationId, setSourceFormationId] = useState("");
  const [cibleFormationId, setCibleFormationId] = useState(formationActuelleId);
  const [erreur, setErreur] = useState<string | null>(null);

  const mutationLot = useCreerProgressionsLot();

  // Filières disponibles pour la matière
  const autresFormations = useMemo(() => {
    return formations.filter((f) => f.matiereIds?.includes(matiereId));
  }, [formations, matiereId]);

  // Cours disponibles dans la source
  const coursSource = useMemo(() => {
    if (!sourceFormationId) return [];
    return toutesProgressions.filter(
      (p) =>
        p.formationId === sourceFormationId &&
        p.matiereId === matiereId &&
        p.sessionId === sessionId,
    );
  }, [toutesProgressions, sourceFormationId, matiereId, sessionId]);

  // Cours déjà présents dans la cible
  const coursCibleExistants = useMemo(() => {
    if (!cibleFormationId) return [];
    return toutesProgressions.filter(
      (p) =>
        p.formationId === cibleFormationId &&
        p.matiereId === matiereId &&
        p.sessionId === sessionId,
    );
  }, [toutesProgressions, cibleFormationId, matiereId, sessionId]);

  // Détection des cours à dupliquer (filtrage des doublons éventuels)
  const coursADupliquer = useMemo(() => {
    return coursSource.filter(
      (src) =>
        !coursCibleExistants.some(
          (c) => c.semaine === src.semaine && c.numeroCours === src.numeroCours,
        ),
    );
  }, [coursSource, coursCibleExistants]);

  async function dupliquer() {
    setErreur(null);
    if (!sourceFormationId || !cibleFormationId) {
      setErreur("Veuillez sélectionner la filière source et la filière cible.");
      return;
    }
    if (sourceFormationId === cibleFormationId) {
      setErreur("La source et la cible doivent être différentes.");
      return;
    }
    if (coursADupliquer.length === 0) {
      setErreur("Aucun nouveau cours à dupliquer (tous les cours existent déjà dans la filière cible).");
      return;
    }

    const salleCible = salles.find((s) => s.formationId === cibleFormationId);
    const phaseCible =
      salleCible?.phaseId ||
      coursCibleExistants[0]?.phaseId ||
      salles[0]?.phaseId;

    if (!phaseCible) {
      setErreur("Impossible de déterminer la phase de la filière cible.");
      return;
    }

    const payloads: CreerProgressionPayload[] = coursADupliquer.map((c) => ({
      formationId: cibleFormationId,
      sessionId,
      phaseId: phaseCible,
      matiereId,
      semaine: c.semaine,
      numeroCours: c.numeroCours,
      theme: c.theme,
      contenu: c.contenu,
      exercices: c.exercices || null,
    }));

    try {
      await mutationLot.mutateAsync(payloads);
      onClose();
    } catch (err) {
      setErreur(
        messageErreurApi(err, "Erreur lors de la duplication du syllabus."),
      );
    }
  }

  return (
    <div className="space-y-4">
      {erreur && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={15} className="shrink-0 text-rose-500" />
          <span>{erreur}</span>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Filière source (copier depuis)
            </label>
            <select
              value={sourceFormationId}
              onChange={(e) => setSourceFormationId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
            >
              <option value="">-- Choisir la source --</option>
              {autresFormations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Filière cible (coller vers)
            </label>
            <select
              value={cibleFormationId}
              onChange={(e) => setCibleFormationId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-brand-orange focus:outline-none"
            >
              <option value="">-- Choisir la cible --</option>
              {autresFormations.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        {sourceFormationId && (
          <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between text-xs text-slate-600">
            <span>
              Cours trouvés dans la source : <strong>{coursSource.length}</strong>
            </span>
            <span className="text-brand-orange font-bold">
              {coursADupliquer.length} cours seront créés
            </span>
          </div>
        )}
      </div>

      {sourceFormationId && coursADupliquer.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-3 bg-white text-xs divide-y divide-slate-100">
          <p className="font-bold text-slate-800 pb-2">Aperçu des thèmes qui seront dupliqués :</p>
          {coursADupliquer.slice(0, 8).map((c) => (
            <div key={c.id} className="py-1.5 flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                S{c.semaine} · Cours {c.numeroCours} : {c.theme}
              </span>
              <span className="text-[10px] text-slate-400">À copier</span>
            </div>
          ))}
          {coursADupliquer.length > 8 && (
            <div className="pt-2 text-center text-slate-400 text-[11px]">
              + {coursADupliquer.length - 8} autres cours
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="button"
          disabled={mutationLot.isPending || coursADupliquer.length === 0}
          onClick={dupliquer}
          className="bg-brand-orange hover:bg-brand-orange/90 text-white"
        >
          <Copy size={14} className="mr-1" />
          <span>
            {mutationLot.isPending
              ? "Duplication..."
              : `Dupliquer ${coursADupliquer.length} cours`}
          </span>
        </Button>
      </div>
    </div>
  );
}

