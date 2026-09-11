"use client";

import React, { useState } from "react";
import {
  Palette,
  Search,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Modal, Button } from "@/shared/ui";
import {
  useMatieres,
  useChangerCouleurMatiere,
  useModifierMatiere,
  useCreerMatiere,
  useSupprimerMatiere,
} from "../data/queries";
import { PALETTE_COULEURS_SELECTION, trouverCouleurParHex } from "../couleurs";
import { GoogleSheetColorPicker } from "./GoogleSheetColorPicker";
import type { Matiere } from "../domain/types";

interface CatalogueMatieresModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CatalogueMatieresModal({
  isOpen,
  onClose,
}: CatalogueMatieresModalProps) {
  const { data: matieres = [], isLoading } = useMatieres();
  const changerCouleurMutation = useChangerCouleurMatiere();
  const modifierMutation = useModifierMatiere();
  const creerMutation = useCreerMatiere();
  const supprimerMutation = useSupprimerMatiere();

  const [recherche, setRecherche] = useState("");
  const [nouvelleMatiereNom, setNouvelleMatiereNom] = useState("");
  const [nouvelleMatiereCouleur, setNouvelleMatiereCouleur] = useState<string>(
    PALETTE_COULEURS_SELECTION[0].hex,
  );
  const [showAjout, setShowAjout] = useState(false);

  // État d'édition inline de nom
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNom, setEditingNom] = useState("");

  // Matières filtrées
  const matieresFiltrees = matieres.filter((m) =>
    m.nom.toLowerCase().includes(recherche.toLowerCase().trim()),
  );

  const handleChangerCouleur = async (matiere: Matiere, hex: string) => {
    try {
      await changerCouleurMutation.mutateAsync({
        id: matiere.id,
        couleur: hex,
      });
    } catch (error) {
      console.error("Erreur lors de la modification de la couleur :", error);
    }
  };

  const handleCreerMatiere = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nouvelleMatiereNom.trim()) return;

    try {
      await creerMutation.mutateAsync({
        nom: nouvelleMatiereNom.trim(),
        couleur: nouvelleMatiereCouleur,
      });
      setNouvelleMatiereNom("");
      setShowAjout(false);
    } catch (error) {
      console.error("Erreur lors de la création de la matière :", error);
    }
  };

  const handleEnregistrerNom = async (matiere: Matiere) => {
    if (!editingNom.trim() || editingNom.trim() === matiere.nom) {
      setEditingId(null);
      return;
    }

    try {
      await modifierMutation.mutateAsync({
        id: matiere.id,
        payload: { nom: editingNom.trim() },
      });
      setEditingId(null);
    } catch (error) {
      console.error("Erreur lors du renommage de la matière :", error);
    }
  };

  const handleSupprimer = async (matiere: Matiere) => {
    if (
      !confirm(
        `Voulez-vous vraiment supprimer la matière "${matiere.nom}" ? Cette action est irréversible.`,
      )
    ) {
      return;
    }

    try {
      await supprimerMutation.mutateAsync(matiere.id);
    } catch (error: any) {
      alert(
        error?.message ||
          "Impossible de supprimer cette matière : elle est probablement liée à un département ou un cours.",
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catalogue des matières"
      description="Personnalisez le libellé et la couleur associée à chaque matière pour une lisibilité parfaite dans les plannings et progressions."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Barre d'action supérieure */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher une matière..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy transition-all"
            />
          </div>

          <Button
            variant={showAjout ? "secondary" : "primary"}
            onClick={() => setShowAjout(!showAjout)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs"
          >
            {showAjout ? (
              <>
                <X size={15} /> Annuler
              </>
            ) : (
              <>
                <Plus size={15} /> Ajouter une matière
              </>
            )}
          </Button>
        </div>

        {/* Panneau d'ajout rapide */}
        {showAjout && (
          <form
            onSubmit={handleCreerMatiere}
            className="p-4 rounded-xl border border-brand-burgundy/20 bg-brand-burgundy/5 space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-burgundy">
              <Sparkles size={16} /> Nouvelle discipline
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nom de la matière
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Analyse Mathématique, Chimie Organique..."
                  value={nouvelleMatiereNom}
                  onChange={(e) => setNouvelleMatiereNom(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 focus:border-brand-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Couleur représentative
                </label>
                <div className="flex items-center gap-2">
                  <GoogleSheetColorPicker
                    couleurActive={nouvelleMatiereCouleur}
                    onSelectCouleur={setNouvelleMatiereCouleur}
                    boutonLibelle="Choisir la couleur (nuancier)"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-burgundy/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAjout(false)}
                className="py-1.5 px-3 text-xs"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={creerMutation.isPending || !nouvelleMatiereNom.trim()}
                className="py-1.5 px-3 text-xs"
              >
                {creerMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1" /> Création...
                  </>
                ) : (
                  "Créer la matière"
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Liste des matières */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin text-brand-burgundy" />
            <p className="text-sm">Chargement du catalogue...</p>
          </div>
        ) : matieresFiltrees.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-500">
            <p className="font-medium text-sm">Aucune matière trouvée</p>
            <p className="text-xs text-slate-400 mt-1">
              {recherche
                ? "Essayez une autre recherche."
                : "Cliquez sur « Ajouter une matière » pour enrichir votre catalogue."}
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
            {matieresFiltrees.map((matiere) => {
              const couleurResolue = trouverCouleurParHex(matiere.couleur);
              const hexActuel = matiere.couleur || "#3B82F6";
              const isEditing = editingId === matiere.id;

              return (
                <div
                  key={matiere.id}
                  className="p-3.5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Nom & Édition */}
                  <div className="flex items-center gap-3 min-w-[200px] flex-1">
                    {/* Badge de couleur circulaire */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs border border-black/10"
                      style={{ backgroundColor: hexActuel }}
                    >
                      <Palette size={13} className="text-white drop-shadow-xs" />
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingNom}
                          onChange={(e) => setEditingNom(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEnregistrerNom(matiere);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          className="px-2 py-1 text-sm bg-white border border-brand-burgundy rounded-md focus:outline-none focus:ring-2 focus:ring-brand-burgundy/20 flex-1"
                        />
                        <button
                          onClick={() => handleEnregistrerNom(matiere)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Valider"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          title="Annuler"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="font-semibold text-slate-800 text-sm">
                          {matiere.nom}
                        </span>
                        <button
                          onClick={() => {
                            setEditingId(matiere.id);
                            setEditingNom(matiere.nom);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-brand-anthracite hover:bg-slate-200/50 rounded"
                          title="Renommer la matière"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sélecteur de couleur Google Sheets */}
                  <div className="flex items-center gap-3 shrink-0">
                    <GoogleSheetColorPicker
                      couleurActive={hexActuel}
                      onSelectCouleur={(hex) => handleChangerCouleur(matiere, hex)}
                      align="right"
                    />

                    {/* Aperçu du badge textuel */}
                    <div className="hidden sm:block">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                          couleurResolue?.badge ||
                          "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {matiere.nom.substring(0, 10)}
                      </span>
                    </div>

                    {/* Supprimer */}
                    <button
                      type="button"
                      onClick={() => handleSupprimer(matiere)}
                      disabled={supprimerMutation.isPending}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                      title="Supprimer la matière"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
