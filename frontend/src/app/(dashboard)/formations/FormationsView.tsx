"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Search,
  BookOpen,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Layers,
  Building2,
  Check,
  ArrowRight,
} from "lucide-react";
import {
  useFormations,
  useCreateFormation,
  useRenommerFormation,
  useSupprimerFormation,
  useAssocierMatiereFormation,
  useDissocierMatiereFormation,
  type Formation,
} from "@/modules/academique";
import {
  useMatieres,
  construireCouleursMatieres,
  getCouleurCardStyle,
  getCouleurBadgeStyle,
  type Matiere,
} from "@/modules/matieres";
import { useCentres, useSessionActive, type Centre, type SessionAcademique } from "@/modules/centres-sessions";
import {
  useCentresAbonnesFormation,
  useAbonnerCentreFormation,
  useDesabonnerCentreFormation,
} from "@/modules/abonnement";
import { Button, Modal } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";

function nettoyerMessageErreur(err: unknown, repli: string): string {
  const msg = messageErreurApi(err, repli);
  // Supprime tout UUID ou identifiant technique
  const sansUuid = msg.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    "",
  );

  const lower = sansUuid.toLowerCase();
  if (
    lower.includes("référencée") ||
    lower.includes("utilisee") ||
    lower.includes("utilisée") ||
    lower.includes("salles sont encore")
  ) {
    return "Cette opération ne peut pas être effectuée car des salles ou des cours y sont encore rattachés.";
  }
  if (lower.includes("déjà abonné") || lower.includes("deja abonne")) {
    return "Ce centre est déjà abonné à cette formation pour cette session.";
  }
  if (lower.includes("rejoint") || lower.includes("non participant")) {
    return "Ce centre n'a pas encore rejoint la session active.";
  }
  if (lower.includes("introuvable")) {
    return "L'élément demandé est introuvable ou a déjà été supprimé.";
  }

  const propre = sansUuid
    .replace(/\b(id|uuid)\b\s*[:=]?\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*:\s*elle est/i, " : elle est")
    .trim();

  return propre || repli;
}

export function FormationsView() {
  const { data: formations = [], isLoading: chargementFormations } = useFormations();
  const { data: matieres = [], isLoading: chargementMatieres } = useMatieres();
  const { data: sessionActive } = useSessionActive();
  const { data: centres = [] } = useCentres();

  const creerFormation = useCreateFormation();
  const renommerFormation = useRenommerFormation();
  const supprimerFormation = useSupprimerFormation();
  const associerMatiere = useAssocierMatiereFormation();
  const dissocierMatiere = useDissocierMatiereFormation();

  // Color map for matières
  const couleursMatieres = useMemo(
    () => construireCouleursMatieres(matieres),
    [matieres],
  );

  // Map of matieres by id for quick lookup
  const matieresParId = useMemo(() => {
    const map = new Map<string, Matiere>();
    matieres.forEach((m) => map.set(m.id, m));
    return map;
  }, [matieres]);

  // Search filter
  const [recherche, setRecherche] = useState("");

  // Modals state
  const [modalCreationOuvert, setModalCreationOuvert] = useState(false);
  const [formationARenommer, setFormationARenommer] = useState<Formation | null>(null);
  const [formationASupprimer, setFormationASupprimer] = useState<Formation | null>(null);
  const [formationPourMatieres, setFormationPourMatieres] = useState<Formation | null>(null);
  const [formationPourCentres, setFormationPourCentres] = useState<Formation | null>(null);

  // Form states for creation modal
  const [nouveauNom, setNouveauNom] = useState("");
  const [matieresSelectionnees, setMatieresSelectionnees] = useState<string[]>([]);
  const [erreurCreation, setErreurCreation] = useState<string | null>(null);

  // Form states for rename modal
  const [nomRenommer, setNomRenommer] = useState("");
  const [erreurRenommer, setErreurRenommer] = useState<string | null>(null);

  // Error state for deletion modal
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  // Search filter for subjects inside manage modal
  const [rechercheMatiereModal, setRechercheMatiereModal] = useState("");

  // Filtered formations
  const formationsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return formations;
    return formations.filter((f) => {
      if (f.nom.toLowerCase().includes(q)) return true;
      // Also match if any associated subject name contains query
      const aUneMatiereQuiMatch = f.matiereIds?.some((mid) => {
        const mat = matieresParId.get(mid);
        return mat?.nom.toLowerCase().includes(q);
      });
      return Boolean(aUneMatiereQuiMatch);
    });
  }, [formations, recherche, matieresParId]);

  // KPIs
  const totalFormations = formations.length;
  const totalMatieres = matieres.length;
  const moyenneMatieresParFormation = useMemo(() => {
    if (totalFormations === 0) return "0";
    const totalMatieresAssociees = formations.reduce(
      (acc, f) => acc + (f.matiereIds?.length || 0),
      0,
    );
    return (totalMatieresAssociees / totalFormations).toFixed(1);
  }, [formations, totalFormations]);

  // Handlers
  function ouvrirCreation() {
    setNouveauNom("");
    setMatieresSelectionnees([]);
    setErreurCreation(null);
    setModalCreationOuvert(true);
  }

  async function soumettreCreation(e: React.FormEvent) {
    e.preventDefault();
    const nomNettoye = nouveauNom.trim();
    if (!nomNettoye) {
      setErreurCreation("Le nom de la formation est requis.");
      return;
    }
    setErreurCreation(null);
    try {
      await creerFormation.mutateAsync({
        nom: nomNettoye,
        matiereIds: matieresSelectionnees,
      });
      setModalCreationOuvert(false);
    } catch (err) {
      setErreurCreation(nettoyerMessageErreur(err, "Impossible de créer la formation."));
    }
  }

  function ouvrirRenommer(f: Formation) {
    setFormationARenommer(f);
    setNomRenommer(f.nom);
    setErreurRenommer(null);
  }

  async function soumettreRenommer(e: React.FormEvent) {
    e.preventDefault();
    if (!formationARenommer) return;
    const nomNettoye = nomRenommer.trim();
    if (!nomNettoye) {
      setErreurRenommer("Le nom de la formation est requis.");
      return;
    }
    setErreurRenommer(null);
    try {
      await renommerFormation.mutateAsync({
        id: formationARenommer.id,
        nom: nomNettoye,
      });
      setFormationARenommer(null);
    } catch (err) {
      setErreurRenommer(nettoyerMessageErreur(err, "Impossible de renommer la formation."));
    }
  }

  function ouvrirSuppression(f: Formation) {
    setFormationASupprimer(f);
    setErreurSuppression(null);
  }

  async function confirmerSuppression() {
    if (!formationASupprimer) return;
    setErreurSuppression(null);
    try {
      await supprimerFormation.mutateAsync(formationASupprimer.id);
      setFormationASupprimer(null);
    } catch (err) {
      setErreurSuppression(
        nettoyerMessageErreur(
          err,
          "Impossible de supprimer cette formation. Elle est peut-être utilisée par des centres ou des séances.",
        ),
      );
    }
  }

  async function basculerMatiereDansFormation(formation: Formation, matiereId: string) {
    const estAssociee = formation.matiereIds?.includes(matiereId);
    try {
      if (estAssociee) {
        await dissocierMatiere.mutateAsync({
          id: formation.id,
          matiereId,
        });
      } else {
        await associerMatiere.mutateAsync({
          id: formation.id,
          matiereId,
        });
      }
    } catch (err) {
      alert(nettoyerMessageErreur(err, "Impossible de modifier les matières de la formation."));
    }
  }

  // Formation active for subject modal
  const formationActivePourMatieres = useMemo(() => {
    if (!formationPourMatieres) return null;
    return formations.find((f) => f.id === formationPourMatieres.id) || formationPourMatieres;
  }, [formations, formationPourMatieres]);

  return (
    <main className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 text-brand-orange">
              <GraduationCap className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Formations &amp; Programmes
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            Gestion du catalogue des formations, des matières enseignées et des centres abonnés par session
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sessionActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Session : {sessionActive.annee}
            </div>
          )}
          <Button
            onClick={ouvrirCreation}
            className="flex items-center gap-2 shadow-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Nouvelle formation
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Formations Actives
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {chargementFormations ? "..." : totalFormations}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Filières enregistrées dans le système
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-brand-orange">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Catalogue Matières
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {chargementMatieres ? "..." : totalMatieres}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Matières académiques disponibles
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Moyenne Pédagogique
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {chargementFormations ? "..." : `${moyenneMatieresParFormation}`}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Matières par formation en moyenne
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Layers className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une formation ou une matière..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all shadow-sm"
          />
          {recherche && (
            <button
              onClick={() => setRecherche("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <span>{formationsFiltrees.length}</span>
          <span>{formationsFiltrees.length > 1 ? "formations trouvées" : "formation trouvée"}</span>
        </div>
      </div>

      {/* Grid of formations */}
      {chargementFormations ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Chargement du catalogue des formations...
        </div>
      ) : formationsFiltrees.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-center px-4">
          <GraduationCap className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">
            {recherche ? "Aucune formation ne correspond à votre recherche" : "Aucune formation enregistrée"}
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            {recherche
              ? "Essayez un autre mot-clé pour le nom de la formation ou de la matière."
              : "Créez votre première formation pour lui associer des matières et connecter des centres."}
          </p>
          {!recherche && (
            <Button onClick={ouvrirCreation} className="mt-4 inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Créer une formation
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formationsFiltrees.map((formation) => (
            <CarteFormationItem
              key={formation.id}
              formation={formation}
              sessionActive={sessionActive}
              centres={centres}
              matieresParId={matieresParId}
              couleursMatieres={couleursMatieres}
              onOuvrirRenommer={ouvrirRenommer}
              onOuvrirSuppression={ouvrirSuppression}
              onOuvrirMatieres={setFormationPourMatieres}
              onOuvrirCentres={setFormationPourCentres}
              onBasculerMatiere={basculerMatiereDansFormation}
            />
          ))}
        </div>
      )}

      {/* Modal 1: Creation */}
      <Modal
        isOpen={modalCreationOuvert}
        onClose={() => setModalCreationOuvert(false)}
        title="Nouvelle Formation"
        description="Créez une filière au catalogue et associez-y ses matières initiales"
        maxWidth="max-w-lg"
      >
        <form onSubmit={soumettreCreation} className="space-y-4 pt-2">
          {erreurCreation && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{erreurCreation}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nom de la formation *
            </label>
            <input
              type="text"
              placeholder="Ex: Concours Polytechnique, Médecine, Sciences Po..."
              value={nouveauNom}
              onChange={(e) => setNouveauNom(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Matières au programme ({matieresSelectionnees.length} sélectionnée(s))
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
              {matieres.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Aucune matière n&rsquo;est encore enregistrée dans le catalogue.
                </p>
              ) : (
                matieres.map((m) => {
                  const selectionnee = matieresSelectionnees.includes(m.id);
                  const couleur = couleursMatieres.get(m.id);

                  return (
                    <label
                      key={m.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        selectionnee ? "bg-white shadow-xs border border-slate-200" : "hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectionnee}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setMatieresSelectionnees((prev) => [...prev, m.id]);
                            } else {
                              setMatieresSelectionnees((prev) => prev.filter((id) => id !== m.id));
                            }
                          }}
                          className="rounded text-brand-orange focus:ring-brand-orange h-4 w-4"
                        />
                        <span className="font-semibold text-slate-700">{m.nom}</span>
                      </div>
                      {couleur && (
                        <span
                          style={
                            couleur.hex
                              ? getCouleurBadgeStyle(couleur.hex)
                              : undefined
                          }
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${couleur.bg} ${couleur.texte}`}
                        >
                          Matière
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalCreationOuvert(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={creerFormation.isPending}
              className="shadow-sm font-semibold"
            >
              {creerFormation.isPending ? "Création..." : "Créer la formation"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Rename */}
      <Modal
        isOpen={Boolean(formationARenommer)}
        onClose={() => setFormationARenommer(null)}
        title="Renommer la formation"
        description="Modifiez l'intitulé officiel de cette formation"
        maxWidth="max-w-md"
      >
        <form onSubmit={soumettreRenommer} className="space-y-4 pt-2">
          {erreurRenommer && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{erreurRenommer}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nouveau nom *
            </label>
            <input
              type="text"
              value={nomRenommer}
              onChange={(e) => setNomRenommer(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormationARenommer(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={renommerFormation.isPending}
              className="shadow-sm font-semibold"
            >
              {renommerFormation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Manage Subjects */}
      <Modal
        isOpen={Boolean(formationPourMatieres)}
        onClose={() => setFormationPourMatieres(null)}
        title="Matières au programme"
        description={`Configurez les matières rattachées à la formation « ${formationActivePourMatieres?.nom} »`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer les matières..."
              value={rechercheMatiereModal}
              onChange={(e) => setRechercheMatiereModal(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
            />
            {rechercheMatiereModal && (
              <button
                onClick={() => setRechercheMatiereModal("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {matieres
              .filter((m) =>
                m.nom.toLowerCase().includes(rechercheMatiereModal.trim().toLowerCase()),
              )
              .map((mat) => {
                const estAssociee =
                  formationActivePourMatieres?.matiereIds?.includes(mat.id);
                const couleur = couleursMatieres.get(mat.id);

                return (
                  <div
                    key={mat.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        style={{ backgroundColor: couleur?.hex || "#cbd5e1" }}
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          couleur ? couleur.bg : "bg-slate-300"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {mat.nom}
                        </p>
                        <p className="text-xs text-slate-400">
                          {estAssociee ? "Au programme" : "Non incluse"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={associerMatiere.isPending || dissocierMatiere.isPending}
                      onClick={() =>
                        formationActivePourMatieres &&
                        basculerMatiereDansFormation(formationActivePourMatieres, mat.id)
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        estAssociee
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {estAssociee ? (
                        <>
                          <X className="h-3.5 w-3.5" />
                          Retirer
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {formationActivePourMatieres?.matiereIds?.length || 0} matière(s) au programme
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormationPourMatieres(null)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 4: Manage Subscribed Centres */}
      {formationPourCentres && (
        <ModalGestionCentres
          formation={formationPourCentres}
          sessionActive={sessionActive}
          centres={centres}
          onClose={() => setFormationPourCentres(null)}
        />
      )}

      {/* Modal 5: Suppression Confirmation */}
      <Modal
        isOpen={Boolean(formationASupprimer)}
        onClose={() => setFormationASupprimer(null)}
        title="Supprimer la formation"
        description={`Êtes-vous sûr de vouloir supprimer définitivement « ${formationASupprimer?.nom} » ?`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-3">
          {erreurSuppression ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>Suppression refusée par le système</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {erreurSuppression}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <p>
                Cette action supprimera la formation du catalogue permanent. Si des centres ou des séances y sont déjà rattachés, la suppression sera bloquée.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormationASupprimer(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={supprimerFormation.isPending}
              onClick={confirmerSuppression}
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600"
            >
              {supprimerFormation.isPending ? "Suppression..." : "Confirmer la suppression"}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}

function CarteFormationItem({
  formation,
  sessionActive,
  centres,
  matieresParId,
  couleursMatieres,
  onOuvrirRenommer,
  onOuvrirSuppression,
  onOuvrirMatieres,
  onOuvrirCentres,
  onBasculerMatiere,
}: {
  formation: Formation;
  sessionActive: SessionAcademique | null | undefined;
  centres: Centre[];
  matieresParId: Map<string, Matiere>;
  couleursMatieres: ReturnType<typeof construireCouleursMatieres>;
  onOuvrirRenommer: (f: Formation) => void;
  onOuvrirSuppression: (f: Formation) => void;
  onOuvrirMatieres: (f: Formation) => void;
  onOuvrirCentres: (f: Formation) => void;
  onBasculerMatiere: (f: Formation, mId: string) => void;
}) {
  const matieresIds = formation.matiereIds || [];
  const nbMatieres = matieresIds.length;

  const { data: abonnements = [], isLoading: chargementAbonnements } =
    useCentresAbonnesFormation(formation.id, sessionActive?.id);

  const centresAbonnes = useMemo(() => {
    return centres.filter((c) => abonnements.some((a) => a.centreId === c.id));
  }, [centres, abonnements]);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Card Top */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/formations/${formation.id}`}
            className="flex items-center gap-3 group/title flex-1 min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-700 group-hover:bg-orange-50 group-hover:text-brand-orange group-hover:border-orange-100 transition-colors shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base leading-tight group-hover/title:text-brand-orange transition-colors truncate">
                {formation.nom}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {nbMatieres} {nbMatieres > 1 ? "matières" : "matière"} • {centresAbonnes.length} centre{centresAbonnes.length > 1 ? "s" : ""}
              </p>
            </div>
          </Link>

          {/* Quick action buttons */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onOuvrirRenommer(formation)}
              title="Renommer la formation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onOuvrirSuppression(formation)}
              title="Supprimer la formation"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Section Programme */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Programme
            </span>
            <button
              type="button"
              onClick={() => onOuvrirMatieres(formation)}
              className="text-xs font-semibold text-brand-orange hover:underline inline-flex items-center gap-1"
            >
              Gérer
            </button>
          </div>

          {nbMatieres === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-2.5 text-center">
              <p className="text-xs text-slate-400">
                Aucune matière associée au programme.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {matieresIds.map((mid) => {
                const matiere = matieresParId.get(mid);
                const couleur = couleursMatieres.get(mid);
                const nomMatiere = matiere ? matiere.nom : "Matière";

                return (
                  <span
                    key={mid}
                    style={
                      couleur?.hex
                        ? getCouleurCardStyle(couleur.hex, true)
                        : undefined
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      couleur ? `${couleur.bg} ${couleur.texte}` : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <span>{nomMatiere}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBasculerMatiere(formation, mid);
                      }}
                      title={`Retirer ${nomMatiere}`}
                      className="opacity-70 hover:opacity-100 hover:scale-110 transition-transform"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Section Centres abonnés */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Centres abonnés ({centresAbonnes.length})
            </span>
            {sessionActive && (
              <button
                type="button"
                onClick={() => onOuvrirCentres(formation)}
                className="text-xs font-semibold text-brand-orange hover:underline inline-flex items-center gap-1"
              >
                Gérer
              </button>
            )}
          </div>

          {!sessionActive ? (
            <p className="text-xs text-slate-400 italic">
              Aucune session active.
            </p>
          ) : chargementAbonnements ? (
            <p className="text-xs text-slate-400">Chargement des abonnements...</p>
          ) : centresAbonnes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-2.5 text-center">
              <p className="text-xs text-slate-400">
                Aucun centre abonné pour cette session.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {centresAbonnes.map((centre) => (
                <span
                  key={centre.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                  title={`${centre.nom} (${centre.villeActuelle})`}
                >
                  <Building2 className="h-3 w-3 text-blue-500 shrink-0" />
                  <span className="truncate max-w-[130px]">{centre.nom}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Bottom / Footer */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <button
          type="button"
          onClick={() => onOuvrirCentres(formation)}
          disabled={!sessionActive}
          className="font-semibold text-slate-700 hover:text-brand-orange inline-flex items-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <Building2 className="h-3.5 w-3.5" />
          {centresAbonnes.length} centre{centresAbonnes.length > 1 ? "s" : ""}
        </button>

        <Link
          href={`/formations/${formation.id}`}
          className="font-bold text-brand-orange hover:underline inline-flex items-center gap-1 transition-colors"
        >
          <span>Détails</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function ModalGestionCentres({
  formation,
  sessionActive,
  centres,
  onClose,
}: {
  formation: Formation;
  sessionActive: SessionAcademique | null | undefined;
  centres: Centre[];
  onClose: () => void;
}) {
  const { data: abonnements = [], isLoading: chargementAbonnements } =
    useCentresAbonnesFormation(formation.id, sessionActive?.id);

  const abonnerCentre = useAbonnerCentreFormation();
  const desabonnerCentre = useDesabonnerCentreFormation();

  const [erreur, setErreur] = useState<string | null>(null);
  const [rechercheCentre, setRechercheCentre] = useState("");

  const centresFiltres = useMemo(() => {
    const q = rechercheCentre.trim().toLowerCase();
    if (!q) return centres;
    return centres.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.villeActuelle?.toLowerCase().includes(q),
    );
  }, [centres, rechercheCentre]);

  async function handleAbonner(centreId: string) {
    if (!sessionActive) return;
    setErreur(null);
    try {
      await abonnerCentre.mutateAsync({
        centreId,
        sessionId: sessionActive.id,
        formationId: formation.id,
      });
    } catch (err) {
      setErreur(nettoyerMessageErreur(err, "Impossible d'abonner le centre."));
    }
  }

  async function handleDesabonner(centreId: string) {
    if (!sessionActive) return;
    setErreur(null);
    try {
      await desabonnerCentre.mutateAsync({
        centreId,
        sessionId: sessionActive.id,
        formationId: formation.id,
      });
    } catch (err) {
      setErreur(
        nettoyerMessageErreur(
          err,
          "Impossible de désabonner le centre. Vérifiez qu'aucune salle n'y est rattachée.",
        ),
      );
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Abonnement des centres"
      description={`Connectez ou déconnectez les centres à la formation « ${formation.nom} » pour la session ${sessionActive?.annee || ""}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 pt-2">
        {erreur && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <p className="flex-1">{erreur}</p>
            <button
              onClick={() => setErreur(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un centre par nom ou ville..."
            value={rechercheCentre}
            onChange={(e) => setRechercheCentre(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
          />
          {rechercheCentre && (
            <button
              onClick={() => setRechercheCentre("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {chargementAbonnements ? (
          <p className="py-8 text-center text-xs text-slate-400">
            Chargement des abonnements...
          </p>
        ) : centresFiltres.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            Aucun centre trouvé.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {centresFiltres.map((centre) => {
              const aRejoint = Boolean(
                sessionActive && centre.sessionIds?.includes(sessionActive.id),
              );
              const estAbonne = abonnements.some((a) => a.centreId === centre.id);
              const enCours =
                abonnerCentre.isPending || desabonnerCentre.isPending;

              return (
                <div
                  key={centre.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        estAbonne
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {centre.nom}
                        </p>
                        {estAbonne && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="h-3 w-3" />
                            Abonné
                          </span>
                        )}
                        {!aRejoint && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Hors session
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {centre.villeActuelle || "Ville non précisée"}
                      </p>
                    </div>
                  </div>

                  <div>
                    {!aRejoint ? (
                      <span
                        className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 font-medium"
                        title="Le centre doit d'abord rejoindre la session active"
                      >
                        N&rsquo;a pas rejoint la session
                      </span>
                    ) : estAbonne ? (
                      <button
                        type="button"
                        disabled={enCours}
                        onClick={() => handleDesabonner(centre.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Désabonner
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={enCours}
                        onClick={() => handleAbonner(centre.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Abonner
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {abonnements.length} centre(s) abonné(s) pour la session active
          </span>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
