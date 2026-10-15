"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Palette,
  Search,
  X,
  Pencil,
  Trash2,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  useDepartements,
  useCreerDepartement,
  useRenommerDepartement,
  useSupprimerDepartement,
  useAssignerChefDepartement,
  type Departement,
} from "@/modules/departement";
import {
  useMatieres,
  construireCouleursMatieres,
  PALETTE_COULEURS_SELECTION,
  CatalogueMatieresModal,
  type Matiere,
} from "@/modules/matieres";
import {
  useRostersDepartements,
  useAjouterEnseignantRoster,
  useRetirerEnseignantRoster,
} from "@/modules/affectation-departementale";
import { useEnseignants, type Enseignant } from "@/modules/personnel";
import { useUtilisateurs } from "@/modules/utilisateurs";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useFormations } from "@/modules/academique";
import { useAffectations } from "@/modules/affectation";
import { semaineCouranteDepuis } from "@/shared/lib/semaine";
import { Button, Modal, Card } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";

import { DepartementDrawer } from "./DepartementDrawer";

export function DepartementsListView() {
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;

  const { data: departements = [], isLoading: chargementDepartements } =
    useDepartements();
  const { data: matieres = [], isLoading: chargementMatieres } = useMatieres();
  const { data: enseignants = [] } = useEnseignants();
  const { data: utilisateurs = [] } = useUtilisateurs();
  const { data: formations = [] } = useFormations();
  const { data: centres = [] } = useCentres();

  const departementIds = useMemo(
    () => departements.map((d) => d.id),
    [departements],
  );
  const { data: rosters = [], isLoading: chargementRosters } =
    useRostersDepartements(departementIds, sessionId);

  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;

  const { data: affectations = [] } = useAffectations({
    sessionId,
    semaine: semaineCourante,
    matiereId: undefined,
  });

  // Mutations
  const creerMutation = useCreerDepartement();
  const renommerMutation = useRenommerDepartement();
  const supprimerMutation = useSupprimerDepartement();
  const assignerChefMutation = useAssignerChefDepartement();
  const ajouterRosterMutation = useAjouterEnseignantRoster();
  const retirerRosterMutation = useRetirerEnseignantRoster();

  // Index maps
  const couleursMatieres = useMemo(
    () => construireCouleursMatieres(matieres),
    [matieres],
  );

  const matieresParId = useMemo(() => {
    const map = new Map<string, Matiere>();
    matieres.forEach((m) => map.set(m.id, m));
    return map;
  }, [matieres]);

  const enseignantsParId = useMemo(() => {
    const map = new Map<string, Enseignant>();
    enseignants.forEach((e) => map.set(e.id, e));
    return map;
  }, [enseignants]);

  const chefsParDepartementId = useMemo(() => {
    const map = new Map<string, (typeof utilisateurs)[0]>();
    departements.forEach((d) => {
      if (d.chefId) {
        const u = utilisateurs.find((user) => user.id === d.chefId);
        if (u) map.set(d.id, u);
      }
    });
    utilisateurs
      .filter(
        (u) =>
          (u.role === "CHEF_DEPARTEMENT" || u.role === "DIRECTEUR_ACADEMIQUE") &&
          u.departementId,
      )
      .forEach((u) => {
        if (!map.has(u.departementId!)) {
          map.set(u.departementId!, u);
        }
      });
    return map;
  }, [departements, utilisateurs]);

  const rostersParDepartementId = useMemo(() => {
    const map = new Map<string, string[]>();
    rosters.forEach((r) => {
      const list = map.get(r.departementId) ?? [];
      list.push(r.enseignantId);
      map.set(r.departementId, list);
    });
    return map;
  }, [rosters]);

  // Utilisateurs éligibles au rôle de chef
  const chefsDisponibles = useMemo(() => {
    return utilisateurs.filter(
      (u) => u.role === "CHEF_DEPARTEMENT" || u.role === "DIRECTEUR_ACADEMIQUE",
    );
  }, [utilisateurs]);

  // Filtres et recherche
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<
    "TOUS" | "VACANT" | "NON_COUVERT"
  >("TOUS");

  // Tiroir latéral
  const [drawerDepartement, setDrawerDepartement] = useState<Departement | null>(
    null,
  );

  // Modales
  const [modalCatalogueMatieres, setModalCatalogueMatieres] = useState(false);
  const [modalCreerOuvert, setModalCreerOuvert] = useState(false);
  const [modalRenommerDep, setModalRenommerDep] = useState<Departement | null>(
    null,
  );
  const [modalSupprimerDep, setModalSupprimerDep] = useState<Departement | null>(
    null,
  );
  const [modalAssignerChefDep, setModalAssignerChefDep] =
    useState<Departement | null>(null);
  const [chefIdChoisi, setChefIdChoisi] = useState<string>("");

  // Form states
  const [nomNouveauDep, setNomNouveauDep] = useState("");
  const [modeMatiere, setModeMatiere] = useState<"existante" | "nouvelle">(
    "existante",
  );
  const [matiereIdChoisie, setMatiereIdChoisie] = useState("");
  const [nomNouvelleMatiere, setNomNouvelleMatiere] = useState("");
  const [couleurChoisie, setCouleurChoisie] = useState<string>(
    PALETTE_COULEURS_SELECTION[0].hex,
  );
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const [nouveauNomRenommer, setNouveauNomRenommer] = useState("");

  // Filtrage des départements
  const departementsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    return departements.filter((d) => {
      const matiere = matieresParId.get(d.matiereId);
      const chef = chefsParDepartementId.get(d.id);
      const enseignantIds = rostersParDepartementId.get(d.id) ?? [];

      // Filtre statut
      if (filtreStatut === "VACANT" && chef) return false;
      if (filtreStatut === "NON_COUVERT") {
        const creneaux = affectations.filter((a) => a.matiereId === d.matiereId);
        const pourvus = creneaux.filter((a) => a.enseignantId).length;
        if (creneaux.length === 0 || pourvus === creneaux.length) return false;
      }

      // Recherche texte
      if (!q) return true;

      const correspondEnseignant = enseignantIds.some((id) => {
        const e = enseignantsParId.get(id);
        return (
          e &&
          (`${e.prenom} ${e.nom}`.toLowerCase().includes(q) ||
            e.matricule.toLowerCase().includes(q))
        );
      });

      return (
        d.nom.toLowerCase().includes(q) ||
        (matiere && matiere.nom.toLowerCase().includes(q)) ||
        (chef &&
          `${chef.prenom} ${chef.nom} ${chef.email}`
            .toLowerCase()
            .includes(q)) ||
        correspondEnseignant
      );
    });
  }, [
    departements,
    recherche,
    filtreStatut,
    matieresParId,
    chefsParDepartementId,
    rostersParDepartementId,
    enseignantsParId,
    affectations,
  ]);

  // Métriques de synthèse ERP
  const totalEnseignantsUniques = useMemo(() => {
    const ids = new Set(rosters.map((r) => r.enseignantId));
    return ids.size;
  }, [rosters]);

  const totalPostesVacants = useMemo(() => {
    return departements.filter((d) => !chefsParDepartementId.has(d.id)).length;
  }, [departements, chefsParDepartementId]);

  const totalSeancesSemaine = affectations.length;
  const seancesAssigneesSemaine = affectations.filter(
    (a) => a.enseignantId,
  ).length;
  const tauxAssignation =
    totalSeancesSemaine > 0
      ? Math.round((seancesAssigneesSemaine / totalSeancesSemaine) * 100)
      : 100;

  // Handlers
  const reinitialiserFormulaireCreation = () => {
    setNomNouveauDep("");
    setModeMatiere("existante");
    setMatiereIdChoisie(matieres[0]?.id ?? "");
    setNomNouvelleMatiere("");
    setCouleurChoisie(PALETTE_COULEURS_SELECTION[0].hex);
    setErreurAction(null);
  };

  const ouvrirCreer = () => {
    reinitialiserFormulaireCreation();
    setModalCreerOuvert(true);
  };

  const ouvrirAssignerChef = (dep: Departement) => {
    const chefActuel = chefsParDepartementId.get(dep.id);
    setChefIdChoisi(chefActuel?.id ?? "");
    setErreurAction(null);
    setModalAssignerChefDep(dep);
  };

  const ouvrirRenommer = (dep: Departement) => {
    setModalRenommerDep(dep);
    setNouveauNomRenommer(dep.nom);
    setErreurAction(null);
  };

  const ouvrirSupprimer = (dep: Departement) => {
    setModalSupprimerDep(dep);
    setErreurAction(null);
  };

  const handleAssignerChef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAssignerChefDep) return;
    setErreurAction(null);
    try {
      await assignerChefMutation.mutateAsync({
        departementId: modalAssignerChefDep.id,
        utilisateurId: chefIdChoisi ? chefIdChoisi : null,
      });
      setModalAssignerChefDep(null);
    } catch (err) {
      setErreurAction(
        messageErreurApi(err, "Échec de l'assignation du chef de département."),
      );
    }
  };

  const handleCreer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurAction(null);

    const nomDep = nomNouveauDep.trim();
    if (!nomDep) {
      setErreurAction("Le nom du département est obligatoire.");
      return;
    }

    let nomMatiere = "";
    if (modeMatiere === "existante") {
      const mat = matieresParId.get(matiereIdChoisie);
      if (!mat) {
        setErreurAction("Veuillez sélectionner une matière.");
        return;
      }
      nomMatiere = mat.nom;
    } else {
      nomMatiere = nomNouvelleMatiere.trim();
      if (!nomMatiere) {
        setErreurAction("Le nom de la matière est obligatoire.");
        return;
      }
    }

    try {
      await creerMutation.mutateAsync({
        nomDepartement: nomDep,
        nomMatiere,
        couleur: couleurChoisie,
      });
      setModalCreerOuvert(false);
      reinitialiserFormulaireCreation();
    } catch (err) {
      setErreurAction(messageErreurApi(err, "Échec de la création du département."));
    }
  };

  const handleRenommer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRenommerDep) return;
    setErreurAction(null);
    const nom = nouveauNomRenommer.trim();
    if (!nom) {
      setErreurAction("Le nom ne peut pas être vide.");
      return;
    }
    try {
      await renommerMutation.mutateAsync({ id: modalRenommerDep.id, nom });
      setModalRenommerDep(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err, "Échec du renommage."));
    }
  };

  const handleSupprimer = async () => {
    if (!modalSupprimerDep) return;
    setErreurAction(null);
    try {
      await supprimerMutation.mutateAsync(modalSupprimerDep.id);
      if (drawerDepartement?.id === modalSupprimerDep.id) {
        setDrawerDepartement(null);
      }
      setModalSupprimerDep(null);
    } catch (err) {
      setErreurAction(
        messageErreurApi(
          err,
          "Impossible de supprimer ce département car des données y sont rattachées.",
        ),
      );
    }
  };

  const handleAjouterRoster = (departementId: string, enseignantId: string) => {
    if (!sessionId) return;
    ajouterRosterMutation.mutate({
      departementId,
      sessionId,
      enseignantId,
    });
  };

  const handleRetirerRoster = (departementId: string, enseignantId: string) => {
    if (!sessionId) return;
    retirerRosterMutation.mutate({
      departementId,
      sessionId,
      enseignantId,
    });
  };

  const chargement =
    chargementDepartements || chargementMatieres || chargementRosters;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5 p-6">
      {/* ── En-tête ERP ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Départements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pôles disciplinaires, nomination des chefs de département et gestion des équipes pédagogiques.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setModalCatalogueMatieres(true)}
            className="flex items-center gap-1.5 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-xs font-medium cursor-pointer"
          >
            <Palette size={14} className="text-slate-500" />
            <span>Catalogue des matières</span>
          </Button>

          <Button
            type="button"
            onClick={ouvrirCreer}
            className="flex items-center gap-1.5 bg-brand-orange text-white hover:bg-brand-orange/90 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-2xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Nouveau département</span>
          </Button>
        </div>
      </div>

      {/* ── Bandeau de synthèse ERP sobre ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-3 md:gap-0">
          <div className="md:px-4 first:pl-2">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Pôles actifs
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {departements.length}
              </span>
              <span className="text-xs text-slate-400">départements</span>
            </div>
          </div>

          <div className="md:px-4">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Direction pédagogique
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-xl font-bold ${
                  totalPostesVacants > 0 ? "text-amber-700" : "text-slate-900"
                }`}
              >
                {totalPostesVacants === 0
                  ? "100%"
                  : `${totalPostesVacants} vacant${totalPostesVacants > 1 ? "s" : ""}`}
              </span>
              <span className="text-xs text-slate-400">
                {totalPostesVacants === 0 ? "pôles pourvus" : "à désigner"}
              </span>
            </div>
          </div>

          <div className="md:px-4 pt-3 md:pt-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Corps professoral
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {totalEnseignantsUniques}
              </span>
              <span className="text-xs text-slate-400">enseignants mobilisés</span>
            </div>
          </div>

          <div className="md:px-4 pt-3 md:pt-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Couverture Semaine {semaineCourante}
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-xl font-bold ${
                  tauxAssignation === 100 ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {tauxAssignation}%
              </span>
              <span className="text-xs text-slate-400">
                ({seancesAssigneesSemaine}/{totalSeancesSemaine} séances)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barre d'outils / Filtres de la table ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de statut */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFiltreStatut("TOUS")}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filtreStatut === "TOUS"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tous ({departements.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltreStatut("VACANT")}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                filtreStatut === "VACANT"
                  ? "bg-white text-amber-800 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-amber-800"
              }`}
            >
              Poste vacant
              {totalPostesVacants > 0 && (
                <span className="rounded-full bg-amber-100 text-amber-800 px-1.5 text-[10px] font-bold">
                  {totalPostesVacants}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFiltreStatut("NON_COUVERT")}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                filtreStatut === "NON_COUVERT"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Créneaux à pourvoir
            </button>
          </div>

          {(recherche || filtreStatut !== "TOUS") && (
            <button
              type="button"
              onClick={() => {
                setRecherche("");
                setFiltreStatut("TOUS");
              }}
              className="text-xs font-medium text-slate-500 hover:text-brand-orange flex items-center gap-1 px-2 py-1 rounded transition-colors"
            >
              <RotateCcw size={12} />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>

        {/* Champ de recherche */}
        <div className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 w-full sm:w-72 focus-within:border-brand-orange focus-within:ring-1 focus-within:ring-brand-orange transition-all">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un département, chef..."
            className="w-full text-xs outline-none text-slate-800 placeholder-slate-400 bg-transparent"
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche("")}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table de données ERP ── */}
      <Card className="overflow-hidden border border-slate-200 bg-white rounded-xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-slate-100">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Département & Discipline</th>
                <th className="py-3 px-4">Direction pédagogique</th>
                <th className="py-3 px-4">Équipe</th>
                <th className="py-3 px-4">Formations</th>
                <th className="py-3 px-4">Séances S{semaineCourante}</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chargement ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 w-36 bg-slate-100 rounded" />
                      <div className="h-3 w-20 bg-slate-100 rounded mt-1.5" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-28 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-16 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-20 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-16 bg-slate-100 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-7 w-20 bg-slate-100 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : departementsFiltres.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">
                      Aucun département trouvé
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {recherche
                        ? "Modifiez votre recherche ou réinitialisez les filtres."
                        : "Créez votre premier département pour commencer."}
                    </p>
                  </td>
                </tr>
              ) : (
                departementsFiltres.map((dep) => {
                  const matiere = matieresParId.get(dep.matiereId);
                  const couleur = matiere
                    ? couleursMatieres.get(matiere.id)
                    : undefined;
                  const chef = chefsParDepartementId.get(dep.id);
                  const rosterIds = rostersParDepartementId.get(dep.id) ?? [];
                  const effectif = rosterIds.length;

                  const creneaux = affectations.filter(
                    (a) => a.matiereId === dep.matiereId,
                  );
                  const creneauxAssures = creneaux.filter(
                    (a) => a.enseignantId,
                  ).length;
                  const tauxCouverture =
                    creneaux.length > 0
                      ? Math.round((creneauxAssures / creneaux.length) * 100)
                      : 100;

                  const formationsConcernees = formations.filter((f) =>
                    f.matiereIds?.includes(dep.matiereId),
                  );

                  return (
                    <tr
                      key={dep.id}
                      onClick={() => setDrawerDepartement(dep)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Département & Discipline */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {couleur?.hex ? (
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: couleur.hex }}
                              title={`Couleur: ${matiere?.nom}`}
                            />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
                          )}
                          <div>
                            <span className="font-semibold text-slate-900 group-hover:text-brand-orange transition-colors">
                              {dep.nom}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {matiere?.nom ?? "Matière non liée"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Direction pédagogique */}
                      <td className="py-3.5 px-4">
                        {chef ? (
                          <div>
                            <span className="font-medium text-slate-900 text-xs block">
                              {chef.prenom} {chef.nom}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {chef.email}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              ouvrirAssignerChef(dep);
                            }}
                            className="inline-flex items-center gap-1.5 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <AlertTriangle size={11} className="text-amber-600" />
                            <span>Non assigné</span>
                          </button>
                        )}
                      </td>

                      {/* Équipe roster */}
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        {effectif > 0 ? (
                          <span className="font-medium">
                            {effectif} enseignant{effectif > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Aucun rattaché</span>
                        )}
                      </td>

                      {/* Formations */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formationsConcernees.length > 0 ? (
                          <span>
                            {formationsConcernees.length} filière{formationsConcernees.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Séances semaine courante */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              creneaux.length > 0 && creneauxAssures < creneaux.length
                                ? "text-amber-700 font-semibold"
                                : "text-slate-800"
                            }`}
                          >
                            {creneauxAssures} / {creneaux.length}
                          </span>
                          {creneaux.length > 0 && (
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                tauxCouverture === 100
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                            />
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setDrawerDepartement(dep)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <span>Gérer l'équipe</span>
                            <ChevronRight size={13} className="text-slate-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => ouvrirRenommer(dep)}
                            className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Renommer"
                          >
                            <Pencil size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => ouvrirSupprimer(dep)}
                            className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Tiroir latéral de gestion du département ── */}
      {drawerDepartement && (
        <DepartementDrawer
          departement={drawerDepartement}
          matiere={matieresParId.get(drawerDepartement.matiereId)}
          couleur={
            drawerDepartement
              ? couleursMatieres.get(drawerDepartement.matiereId)
              : undefined
          }
          chef={chefsParDepartementId.get(drawerDepartement.id)}
          rosterEnseignantIds={
            rostersParDepartementId.get(drawerDepartement.id) ?? []
          }
          enseignantsParId={enseignantsParId}
          tousEnseignants={enseignants}
          formations={formations}
          centres={centres}
          affectations={affectations}
          semaineCourante={semaineCourante}
          isOpen={Boolean(drawerDepartement)}
          onClose={() => setDrawerDepartement(null)}
          onRenommer={ouvrirRenommer}
          onSupprimer={ouvrirSupprimer}
          onAssignerChef={ouvrirAssignerChef}
          onAjouterRoster={(enseignantId) =>
            handleAjouterRoster(drawerDepartement.id, enseignantId)
          }
          onRetirerRoster={(enseignantId) =>
            handleRetirerRoster(drawerDepartement.id, enseignantId)
          }
          isAddingRoster={ajouterRosterMutation.isPending}
        />
      )}

      {/* ── Modale Création Département ── */}
      <Modal
        isOpen={modalCreerOuvert}
        onClose={() => setModalCreerOuvert(false)}
        title="Créer un département"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreer} className="space-y-4">
          {erreurAction && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              {erreurAction}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom du département *
            </label>
            <input
              type="text"
              value={nomNouveauDep}
              onChange={(e) => setNomNouveauDep(e.target.value)}
              placeholder="Ex: Département de Mathématiques"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-orange focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Matière d’enseignement associée *
            </label>
            <div className="flex gap-4 mb-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="modeMatiere"
                  checked={modeMatiere === "existante"}
                  onChange={() => setModeMatiere("existante")}
                  className="accent-brand-orange"
                />
                <span>Matière existante</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="modeMatiere"
                  checked={modeMatiere === "nouvelle"}
                  onChange={() => setModeMatiere("nouvelle")}
                  className="accent-brand-orange"
                />
                <span>Nouvelle matière</span>
              </label>
            </div>

            {modeMatiere === "existante" ? (
              <select
                value={matiereIdChoisie}
                onChange={(e) => setMatiereIdChoisie(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:border-brand-orange focus:outline-none"
              >
                {matieres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={nomNouvelleMatiere}
                onChange={(e) => setNomNouvelleMatiere(e.target.value)}
                placeholder="Ex: Informatique & Algorithmique"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-orange focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Couleur distinctive de référence
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {PALETTE_COULEURS_SELECTION.map((c) => {
                const estChoisie =
                  couleurChoisie.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setCouleurChoisie(c.hex)}
                    className={`h-7 w-7 rounded-md transition-all cursor-pointer flex items-center justify-center ${
                      estChoisie
                        ? "ring-2 ring-brand-orange ring-offset-2 scale-105"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={`${c.label}`}
                  >
                    {estChoisie && (
                      <CheckCircle2 size={14} className="text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalCreerOuvert(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={creerMutation.isPending}
              className="bg-brand-orange text-white hover:bg-brand-orange/90"
            >
              {creerMutation.isPending ? "Création..." : "Créer le département"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modale Renommer Département ── */}
      <Modal
        isOpen={Boolean(modalRenommerDep)}
        onClose={() => setModalRenommerDep(null)}
        title="Renommer le département"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleRenommer} className="space-y-4">
          {erreurAction && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              {erreurAction}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nouveau nom *
            </label>
            <input
              type="text"
              value={nouveauNomRenommer}
              onChange={(e) => setNouveauNomRenommer(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-orange focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalRenommerDep(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={renommerMutation.isPending}
              className="bg-brand-orange text-white hover:bg-brand-orange/90"
            >
              {renommerMutation.isPending ? "Enregistrement..." : "Renommer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modale Supprimer Département ── */}
      <Modal
        isOpen={Boolean(modalSupprimerDep)}
        onClose={() => setModalSupprimerDep(null)}
        title="Supprimer le département"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {erreurAction && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              {erreurAction}
            </div>
          )}

          <p className="text-sm text-slate-600">
            Êtes-vous sûr de vouloir supprimer le département{" "}
            <strong className="text-slate-900">{modalSupprimerDep?.nom}</strong> ?
          </p>

          <p className="text-xs text-slate-400">
            Cette action est irréversible. La suppression sera refusée si des enseignants ou des séances y sont rattachés.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalSupprimerDep(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={supprimerMutation.isPending}
              onClick={handleSupprimer}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {supprimerMutation.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modale Assigner Chef ── */}
      <Modal
        isOpen={Boolean(modalAssignerChefDep)}
        onClose={() => setModalAssignerChefDep(null)}
        title="Désigner le chef de département"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAssignerChef} className="space-y-4">
          {erreurAction && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              {erreurAction}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Responsable pour {modalAssignerChefDep?.nom}
            </label>
            <select
              value={chefIdChoisi}
              onChange={(e) => setChefIdChoisi(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:border-brand-orange focus:outline-none"
            >
              <option value="">-- Aucun chef (Poste vacant) --</option>
              {chefsDisponibles.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.prenom} {u.nom} ({u.email}) - {u.role}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Réservé aux profils Chef de Département et Directeur Académique.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalAssignerChefDep(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={assignerChefMutation.isPending}
              className="bg-brand-orange text-white hover:bg-brand-orange/90"
            >
              {assignerChefMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modale Catalogue des Matières ── */}
      <CatalogueMatieresModal
        isOpen={modalCatalogueMatieres}
        onClose={() => setModalCatalogueMatieres(false)}
      />
    </div>
  );
}
