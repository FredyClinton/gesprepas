"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Modal, Button } from "@/shared/ui";
import {
  useCreerConcours,
  useAjouterPieceAuConcours,
  usePiecesRequises,
} from "@/modules/dossiers";
import { useFormations, usePhases } from "@/modules/academique";
import {
  Calendar,
  AlertCircle,
  CheckSquare,
  Square,
  Loader2,
  Award,
  GraduationCap,
  Plus,
} from "lucide-react";

const FCFA = new Intl.NumberFormat("fr-FR");

const CONCOURS_SUGGESTIONS = [
  "Concours Polytechnique (ENSPY)",
  "Concours Médecine & Pharmacie (FMSP)",
  "Concours ENAM (Administration)",
  "Concours École Normale Supérieure (ENS)",
  "Concours FASA (Agronomie)",
  "Concours IUT (Douala / Bandjoun)",
  "Concours IDE & Sages-Femmes (Santé)",
  "Concours Douanes & Trésor",
  "Concours Police / Gendarmerie",
  "Concours ESSEC / Commerce",
];

interface CreerConcoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onSuccess?: () => void;
}

export function CreerConcoursModal(props: CreerConcoursModalProps) {
  if (!props.isOpen) return null;

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Programmer un concours pour la session"
      maxWidth="max-w-2xl"
    >
      <CreerConcoursForm {...props} />
    </Modal>
  );
}

function CreerConcoursForm({
  onClose,
  sessionId,
  onSuccess,
}: CreerConcoursModalProps) {
  const { data: cataloguePieces = [], isLoading: chargementPieces } = usePiecesRequises();
  const { data: formations = [] } = useFormations();
  const { data: phases = [] } = usePhases();

  const [nom, setNom] = useState("");
  const [formationId, setFormationId] = useState(formations[0]?.id || "");
  const [phaseId, setPhaseId] = useState(phases[0]?.id || "");

  const datesInitiales = useMemo(() => {
    const now = new Date();
    const dateCentre = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    const dateOfficielle = new Date(now.getTime() + 45 * 24 * 3600 * 1000);
    return {
      centre: dateCentre.toISOString().split("T")[0],
      officielle: dateOfficielle.toISOString().split("T")[0],
    };
  }, []);

  const [dateLimiteRecevabiliteCentre, setDateLimiteRecevabiliteCentre] = useState(
    datesInitiales.centre,
  );
  const [dateLimiteDepot, setDateLimiteDepot] = useState(datesInitiales.officielle);

  // Initialisation des pièces cochées par défaut
  const [piecesSelectionnees, setPiecesSelectionnees] = useState<Record<string, boolean>>({});
  const [aEteInitialise, setAEteInitialise] = useState(false);

  useEffect(() => {
    if (!aEteInitialise && cataloguePieces.length > 0) {
      const init: Record<string, boolean> = {};
      cataloguePieces.filter((p) => p.actif).forEach((p) => {
        init[p.id] = true;
      });
      setPiecesSelectionnees(init);
      setAEteInitialise(true);
    }
  }, [cataloguePieces, aEteInitialise]);

  const [erreur, setErreur] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creerConcoursMutation = useCreerConcours();
  const ajouterPieceMutation = useAjouterPieceAuConcours();

  const effectiveFormationId = formationId || formations[0]?.id || "";
  const effectivePhaseId = phaseId || phases[0]?.id || "";

  // Calcul du montant estimé des pièces cochées
  const { totalCochees, montantTotalPieces } = useMemo(() => {
    let count = 0;
    let sum = 0;
    cataloguePieces.forEach((p) => {
      if (piecesSelectionnees[p.id]) {
        count += 1;
        sum += p.montant;
      }
    });
    return { totalCochees: count, montantTotalPieces: sum };
  }, [cataloguePieces, piecesSelectionnees]);

  function handleTogglePiece(id: string) {
    setPiecesSelectionnees((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function handleSelectAll(select: boolean) {
    const updated: Record<string, boolean> = {};
    cataloguePieces.filter((p) => p.actif).forEach((p) => {
      updated[p.id] = select;
    });
    setPiecesSelectionnees(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    const nomNettoye = nom.trim();
    if (!nomNettoye) {
      setErreur("Veuillez renseigner le nom du concours.");
      return;
    }
    if (!sessionId) {
      setErreur("Session académique non définie.");
      return;
    }
    if (!effectiveFormationId) {
      setErreur("Veuillez sélectionner une formation.");
      return;
    }
    if (!effectivePhaseId) {
      setErreur("Veuillez sélectionner une phase académique.");
      return;
    }
    if (!dateLimiteRecevabiliteCentre || !dateLimiteDepot) {
      setErreur("Veuillez définir les deux dates limites.");
      return;
    }
    if (new Date(dateLimiteRecevabiliteCentre) > new Date(dateLimiteDepot)) {
      setErreur(
        "La date limite de recevabilité au centre doit être antérieure ou égale à la date limite officielle.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const nouveauConcours = await creerConcoursMutation.mutateAsync({
        nom: nomNettoye,
        sessionId,
        formationId: effectiveFormationId,
        phaseId: effectivePhaseId,
        dateLimiteDepot,
        dateLimiteRecevabiliteCentre,
      });

      const idsPiecesCochees = Object.entries(piecesSelectionnees)
        .filter(([, coche]) => coche)
        .map(([id]) => id);

      if (idsPiecesCochees.length > 0) {
        await Promise.all(
          idsPiecesCochees.map((pieceRequiseId) =>
            ajouterPieceMutation.mutateAsync({
              concoursId: nouveauConcours.id,
              pieceRequiseId,
            }),
          ),
        );
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setErreur(
        err instanceof Error ? err.message : "Erreur lors de la programmation du concours.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {erreur && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{erreur}</span>
        </div>
      )}

      {/* Intitulé du concours */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Award size={14} className="text-brand-orange" />
          Intitulé du concours officiel
        </label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : Concours Polytechnique (ENSPY)..."
          className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all font-medium"
          required
          autoFocus
        />

        {/* Suggestions rapides */}
        <div className="pt-1">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">
            Suggestions rapides :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CONCOURS_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setNom(suggestion)}
                className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-orange-50 hover:text-brand-orange text-slate-600 rounded-md border border-slate-200 transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Formation & Phase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap size={14} className="text-brand-orange" />
            Formation / Filière cible
          </label>
          <select
            value={effectiveFormationId}
            onChange={(e) => setFormationId(e.target.value)}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
            required
          >
            {formations.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Phase académique
          </label>
          <select
            value={effectivePhaseId}
            onChange={(e) => setPhaseId(e.target.value)}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
            required
          >
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.libelle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Échéances / Délais */}
      <div className="p-4 bg-orange-50/50 border border-orange-200/60 rounded-2xl space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-orange flex items-center gap-1.5">
          <Calendar size={14} /> Délais & Échéances de la session
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              1. Date limite interne (Recevabilité Centre)
            </label>
            <input
              type="date"
              value={dateLimiteRecevabiliteCentre}
              onChange={(e) => setDateLimiteRecevabiliteCentre(e.target.value)}
              className="w-full p-2.5 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
              required
            />
            <p className="text-[10px] text-slate-400">
              Date maximale pour que l&rsquo;apprenant dépose ses pièces au centre.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              2. Date limite officielle (Dépôt École)
            </label>
            <input
              type="date"
              value={dateLimiteDepot}
              onChange={(e) => setDateLimiteDepot(e.target.value)}
              className="w-full p-2.5 text-xs font-mono font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
              required
            />
            <p className="text-[10px] text-slate-400">
              Date officielle de clôture fixée par l&rsquo;établissement organisateur.
            </p>
          </div>
        </div>
      </div>

      {/* Liste à cocher des pièces requises */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Pièces exigées pour ce concours ({totalCochees} sélectionnée{totalCochees > 1 ? "s" : ""})
            </label>
            <span className="text-[11px] text-slate-400">
              Cochez les pièces requises. Le tarif global standard sera de{" "}
              <strong className="text-brand-orange font-mono">{FCFA.format(montantTotalPieces)} FCFA</strong>.
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="text-[11px] font-bold text-brand-orange hover:underline cursor-pointer"
            >
              Tout cocher
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
            >
              Tout décocher
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {chargementPieces ? (
            <div className="p-4 text-center text-xs text-slate-400">
              <Loader2 size={16} className="animate-spin inline mr-1" /> Chargement du catalogue...
            </div>
          ) : cataloguePieces.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Aucune pièce configurée dans le catalogue.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 w-10 text-center">Cocher</th>
                  <th className="p-2.5">Libellé de la pièce</th>
                  <th className="p-2.5 text-right">Tarif</th>
                  <th className="p-2.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cataloguePieces
                  .filter((p) => p.actif)
                  .sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }))
                  .map((piece, index) => {
                    const estCoche = Boolean(piecesSelectionnees[piece.id]);
                    const isEven = index % 2 === 0;
                    return (
                      <tr
                        key={piece.id}
                        onClick={() => handleTogglePiece(piece.id)}
                        className={`cursor-pointer select-none transition-colors ${
                          estCoche
                            ? "bg-orange-50/50 hover:bg-orange-50/80"
                            : isEven
                            ? "bg-white hover:bg-slate-100/60"
                            : "bg-slate-50/75 hover:bg-slate-100/60"
                        }`}
                      >
                        <td className="p-2.5 text-center font-mono text-[11px] font-semibold text-slate-400">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="p-2.5 text-center">
                          {estCoche ? (
                            <CheckSquare size={16} className="text-brand-orange mx-auto" />
                          ) : (
                            <Square size={16} className="text-slate-300 mx-auto" />
                          )}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`font-semibold ${estCoche ? "text-slate-900 font-bold" : "text-slate-600"}`}
                          >
                            {piece.nom}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-700">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {FCFA.format(piece.montant)} FCFA
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              estCoche
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-slate-100 text-slate-400 border-slate-200"
                            }`}
                          >
                            {estCoche ? "Exigée" : "Exclue"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !nom.trim()}
          className="bg-brand-orange text-white hover:bg-brand-orange/90 font-semibold"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 size={15} className="animate-spin" /> Enregistrement...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Plus size={15} /> Programmer le concours
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
