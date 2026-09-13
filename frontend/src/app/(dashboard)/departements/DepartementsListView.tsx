"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  BookOpen,
  Users,
  CalendarClock,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  GraduationCap,
  CheckCircle2,
  Clock,
  Phone,
  UserPlus,
  ChevronRight,
  UserCheck,
  ShieldAlert,
  Palette,
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
  getCouleurCardStyle,
  PALETTE_COULEURS_SELECTION,
  CatalogueMatieresModal,
  type Matiere,
  type CouleurMatiere,
} from "@/modules/matieres";
import {
  useRostersDepartements,
  useAjouterEnseignantRoster,
  useRetirerEnseignantRoster,
} from "@/modules/affectation-departementale";
import { useEnseignants, type Enseignant } from "@/modules/personnel";
import { useUtilisateurs } from "@/modules/utilisateurs";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useFormations, type Formation } from "@/modules/academique";
import { useAffectations } from "@/modules/affectation";
import { semaineCouranteDepuis } from "@/shared/lib/semaine";
import { Button, Modal, Card } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";

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

  // Matieres color map
  const couleursMatieres = useMemo(
    () => construireCouleursMatieres(matieres),
    [matieres],
  );

  // Index maps
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
      .filter((u) => u.role === "CHEF_DEPARTEMENT" && u.departementId)
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

  // Search
  const [recherche, setRecherche] = useState("");

  const departementsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return departements;
    return departements.filter((d) => {
      const matiere = matieresParId.get(d.matiereId);
      const chef = chefsParDepartementId.get(d.id);
      const enseignantIds = rostersParDepartementId.get(d.id) ?? [];
      const correspondEnseignant = enseignantIds.some((id) => {
        const e = enseignantsParId.get(id);
        return (
          e &&
          (`${e.prenom} ${e.nom}`.toLowerCase().includes(q) ||
            e.matricule.toLowerCase().includes(q) ||
            (e.telephone && e.telephone.toLowerCase().includes(q)))
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
    matieresParId,
    chefsParDepartementId,
    rostersParDepartementId,
    enseignantsParId,
  ]);


  // Utilisateurs éligibles au rôle de chef de département
  const chefsDisponibles = useMemo(() => {
    return utilisateurs.filter((u) => u.role === "CHEF_DEPARTEMENT");
  }, [utilisateurs]);

  // KPIs
  const totalEnseignantsUniques = useMemo(() => {
    const ids = new Set(rosters.map((r) => r.enseignantId));
    return ids.size;
  }, [rosters]);

  const totalSeancesSemaine = affectations.length;
  const seancesAssigneesSemaine = affectations.filter(
    (a) => a.enseignantId,
  ).length;
  const tauxAssignation =
    totalSeancesSemaine > 0
      ? Math.round((seancesAssigneesSemaine / totalSeancesSemaine) * 100)
      : 100;

  // Modals state
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

  const [modalRattacherEnseignant, setModalRattacherEnseignant] =
    useState<Enseignant | null>(null);
  const [departementCibleRattachementId, setDepartementCibleRattachementId] =
    useState<string>("");

  const [departementSelectionne, setDepartementSelectionne] =
    useState<Departement | null>(null);

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

  const handleRattacherEnseignant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalRattacherEnseignant || !departementCibleRattachementId || !sessionId)
      return;
    setErreurAction(null);
    try {
      await ajouterRosterMutation.mutateAsync({
        departementId: departementCibleRattachementId,
        sessionId,
        enseignantId: modalRattacherEnseignant.id,
      });
      setModalRattacherEnseignant(null);
      setDepartementCibleRattachementId("");
    } catch (err) {
      setErreurAction(
        messageErreurApi(
          err,
          "Échec du rattachement de l'enseignant au département.",
        ),
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
      if (departementSelectionne?.id === modalSupprimerDep.id) {
        setDepartementSelectionne(null);
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

  const chargement =
    chargementDepartements || chargementMatieres || chargementRosters;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-6">
      {/* ── En-tête ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange shadow-2xs">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Départements Académiques
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Supervision des pôles disciplinaires, nomination des chefs de département et gestion des équipes pédagogiques.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setModalCatalogueMatieres(true)}
            className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 rounded-xl px-4 py-2.5 font-bold text-sm transition-all cursor-pointer"
          >
            <Palette size={16} className="text-brand-orange" />
            <span>Catalogue matières</span>
          </Button>

          <Button
            type="button"
            onClick={ouvrirCreer}
            className="flex items-center gap-2 bg-brand-orange text-white shadow-xs hover:bg-brand-orange/90 rounded-xl px-4 py-2.5 font-bold text-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Nouveau département</span>
          </Button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Building2 size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Départements
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {departements.length}
            </p>
            <p className="text-[11px] text-slate-400">Pôles disciplinaires actifs</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Users size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enseignants mobilisés
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {totalEnseignantsUniques}
            </p>
            <p className="text-[11px] text-slate-400">Dans les rosters de la session</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CalendarClock size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Séances (Sem. {semaineCourante})
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {totalSeancesSemaine}
            </p>
            <p className="text-[11px] text-slate-400">
              {seancesAssigneesSemaine} séances pourvues
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <CheckCircle2 size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Taux d’assignation
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {tauxAssignation}%
            </p>
            <p className="text-[11px] text-slate-400">Couverture des créneaux</p>
          </div>
        </Card>
      </div>

      {/* ── Barre de filtre & Recherche ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 px-2">
          <Building2 size={18} className="text-brand-orange" />
          <span className="text-sm font-bold text-slate-800">
            Départements ({departements.length})
          </span>
        </div>

        {/* Barre de recherche */}
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="relative flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 w-full sm:w-[420px] focus-within:border-brand-orange focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-orange/10 transition-all shadow-2xs"
        >
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un département, une matière, un chef..."
            className="w-full text-xs outline-none text-slate-800 placeholder-slate-400 bg-transparent"
            aria-label="Rechercher"
          />
          {recherche && (
            <button
              type="button"
              onClick={() => setRecherche("")}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Effacer la recherche"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* ── Contenu principal : Grille des Départements ── */}
      {chargement ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-10 bg-slate-200 rounded w-full" />
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-10 bg-slate-200 rounded w-full" />
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-10 bg-slate-200 rounded w-full" />
          </div>
        </div>
      ) : departementsFiltres.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Building2 size={36} className="mx-auto text-slate-300" />
            <h3 className="mt-3 text-sm font-bold text-slate-700">
              Aucun département trouvé
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {recherche
                ? "Aucun département ne correspond à vos critères de recherche."
                : "Créez votre premier département académique pour commencer à structurer les enseignements."}
            </p>
            {!recherche && (
              <Button
                type="button"
                onClick={ouvrirCreer}
                className="mt-4 inline-flex items-center gap-2 bg-brand-orange text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <Plus size={14} />
                Nouveau département
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {departementsFiltres.map((dep) => {
              const matiere = matieresParId.get(dep.matiereId);
              const couleur = matiere
                ? couleursMatieres.get(matiere.id)
                : undefined;
              const chef = chefsParDepartementId.get(dep.id);
              const enseignantsIds = rostersParDepartementId.get(dep.id) ?? [];
              const effectifRoster = enseignantsIds.length;

              // Formations utilisant cette matière
              const formationsConcernees = formations.filter((f) =>
                f.matiereIds?.includes(dep.matiereId),
              );

              // Séances de la semaine pour cette matière
              const seancesMatiere = affectations.filter(
                (a) => a.matiereId === dep.matiereId,
              );
              const seancesPourvues = seancesMatiere.filter(
                (a) => a.enseignantId,
              ).length;

              return (
                <div
                  key={dep.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-brand-orange/40 hover:shadow-md"
                >
                  <div>
                    {/* Carte Top : Titre & Badge Matière */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-bold text-slate-900 group-hover:text-brand-orange transition-colors truncate">
                          {dep.nom}
                        </h2>
                        <div className="mt-2 flex items-center gap-2">
                          {matiere ? (
                            <span
                              style={
                                couleur?.hex
                                  ? getCouleurCardStyle(couleur.hex, true)
                                  : undefined
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide border shadow-2xs ${
                                couleur
                                  ? `${couleur.bg} ${couleur.texte} border-slate-200/60`
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              <BookOpen size={12} className="shrink-0" />
                              <span className="truncate">{matiere.nom}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Matière non liée
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Menu actions */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setModalRenommerDep(dep);
                            setNouveauNomRenommer(dep.nom);
                            setErreurAction(null);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          title="Renommer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalSupprimerDep(dep);
                            setErreurAction(null);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Responsable du département */}
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Chef de département
                        </p>
                        <button
                          type="button"
                          onClick={() => ouvrirAssignerChef(dep)}
                          className="text-[11px] font-bold text-brand-orange hover:text-brand-orange/80 transition-colors flex items-center gap-1 cursor-pointer"
                          title={chef ? "Modifier l’assignation" : "Désigner un chef"}
                        >
                          <UserCheck size={12} />
                          <span>{chef ? "Modifier" : "Assigner"}</span>
                        </button>
                      </div>

                      {chef ? (
                        <div className="mt-1.5 flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white font-bold text-xs shadow-2xs">
                            {chef.prenom[0]}
                            {chef.nom[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {chef.prenom} {chef.nom}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {chef.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex items-center justify-between text-amber-700 bg-amber-50/80 border border-amber-200/60 rounded-lg px-2.5 py-1.5">
                          <div className="flex items-center gap-2">
                            <AlertTriangle
                              size={13}
                              className="shrink-0 text-amber-500"
                            />
                            <span className="text-[11px] font-medium">
                              Poste vacant - non assigné
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Statistiques clés de la carte */}
                    <div className="mt-4 grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                      <div className="rounded-lg bg-slate-50 p-2 text-center">
                        <p className="text-[10px] font-medium text-slate-400 uppercase">
                          Enseignants
                        </p>
                        <p className="mt-0.5 text-sm font-extrabold text-slate-800">
                          {effectifRoster}
                        </p>
                        <p className="text-[10px] text-slate-400">au roster</p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-2 text-center">
                        <p className="text-[10px] font-medium text-slate-400 uppercase">
                          Formations
                        </p>
                        <p className="mt-0.5 text-sm font-extrabold text-slate-800">
                          {formationsConcernees.length}
                        </p>
                        <p className="text-[10px] text-slate-400">au programme</p>
                      </div>
                    </div>

                    {/* Séances de la semaine */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        Semaine en cours :
                      </span>
                      <span className="font-bold text-slate-700">
                        {seancesPourvues}/{seancesMatiere.length} séances assignées
                      </span>
                    </div>
                  </div>

                  {/* Bouton ouvrir détail */}
                  <button
                    type="button"
                    onClick={() => setDepartementSelectionne(dep)}
                    className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all shadow-2xs cursor-pointer"
                  >
                    <span>Détails & Équipe</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

      {/* ── Modale Création Département ── */}
      <Modal
        isOpen={modalCreerOuvert}
        onClose={() => setModalCreerOuvert(false)}
        title="Créer un département académique"
      >
        <form onSubmit={handleCreer} className="flex flex-col gap-4">
          {erreurAction && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-500" />
              <span>{erreurAction}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nom du département *
            </label>
            <input
              type="text"
              value={nomNouveauDep}
              onChange={(e) => setNomNouveauDep(e.target.value)}
              placeholder="Ex: Département de Mathématiques"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/10"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Matière d’enseignement associée *
            </label>
            <div className="flex gap-4 mb-2.5 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="modeMatiere"
                  checked={modeMatiere === "existante"}
                  onChange={() => setModeMatiere("existante")}
                  className="accent-brand-orange"
                />
                <span>Matière existante</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/10"
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/10"
              />
            )}
            <p className="mt-1 text-[11px] text-slate-400">
              Un département académique pilote la pédagogie et les enseignants d’une matière spécifique.
            </p>
          </div>

          {/* Sélecteur de couleur distinctive */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Couleur distinctive de la matière &amp; du département
            </label>
            <div className="flex flex-wrap gap-2.5 items-center">
              {PALETTE_COULEURS_SELECTION.map((c) => {
                const estChoisie =
                  couleurChoisie.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setCouleurChoisie(c.hex)}
                    className={`group relative flex h-8 w-8 items-center justify-center rounded-xl transition-all cursor-pointer ${
                      estChoisie
                        ? "ring-2 ring-brand-orange ring-offset-2 scale-110 shadow-sm"
                        : "hover:scale-105 opacity-85 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={`${c.label} (${c.hex})`}
                  >
                    {estChoisie && (
                      <CheckCircle2 size={16} className="text-white drop-shadow-xs" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Cette couleur sera persistée et utilisée pour identifier visuellement les cours de cette matière dans la grille de planification.
            </p>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
      >
        <form onSubmit={handleRenommer} className="flex flex-col gap-4">
          {erreurAction && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-500" />
              <span>{erreurAction}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nouveau nom du département *
            </label>
            <input
              type="text"
              value={nouveauNomRenommer}
              onChange={(e) => setNouveauNomRenommer(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/10"
              required
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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

      {/* ── Modale Suppression Département avec Gardes-fous ── */}
      <Modal
        isOpen={Boolean(modalSupprimerDep)}
        onClose={() => setModalSupprimerDep(null)}
        title="Supprimer le département"
      >
        <div className="flex flex-col gap-4">
          {erreurAction && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-500" />
              <span>{erreurAction}</span>
            </div>
          )}

          {(() => {
            const dep = modalSupprimerDep;
            if (!dep) return null;
            const rosterDuDep = rostersParDepartementId.get(dep.id) ?? [];
            const formationsDuDep = formations.filter((f) =>
              f.matiereIds?.includes(dep.matiereId),
            );
            const aDesDependances =
              rosterDuDep.length > 0 || formationsDuDep.length > 0;

            return (
              <>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer le département{" "}
                  <span className="font-bold text-slate-900">« {dep.nom} »</span> ?
                </p>

                {aDesDependances ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <ShieldAlert size={16} className="shrink-0 text-amber-600" />
                      <span>Gardes-fous d’intégrité académique activés</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      Ce département ne peut pas être supprimé car des éléments actifs en dépendent :
                    </p>
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-900 font-medium">
                      {rosterDuDep.length > 0 && (
                        <li>
                          <strong>{rosterDuDep.length} enseignant(s)</strong> actuellement rattaché(s) au roster de la session.
                        </li>
                      )}
                      {formationsDuDep.length > 0 && (
                        <li>
                          <strong>{formationsDuDep.length} formation(s)</strong> intègrent cette matière dans leur cursus.
                        </li>
                      )}
                    </ul>
                    <p className="text-[11px] text-amber-700 italic mt-1">
                      Veuillez retirer les enseignants du roster et dissocier la matière des formations avant de pouvoir supprimer ce département.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Ce département ne contient aucun enseignant ni formation liée. Sa suppression libèrera le chef associé et supprimera la matière orpheline.
                  </p>
                )}

                <div className="mt-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setModalSupprimerDep(null)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSupprimer}
                    disabled={supprimerMutation.isPending || aDesDependances}
                    className="bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {supprimerMutation.isPending
                      ? "Suppression..."
                      : aDesDependances
                      ? "Suppression bloquée (dépendances)"
                      : "Supprimer définitivement"}
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      </Modal>

      {/* ── Modale Assigner Chef de Département ── */}
      <Modal
        isOpen={Boolean(modalAssignerChefDep)}
        onClose={() => setModalAssignerChefDep(null)}
        title={`Désigner le chef du ${modalAssignerChefDep?.nom ?? "département"}`}
      >
        <form onSubmit={handleAssignerChef} className="flex flex-col gap-4">
          {erreurAction && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-500" />
              <span>{erreurAction}</span>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Conformément aux règles académiques, seul un utilisateur disposant du rôle{" "}
            <span className="font-bold text-slate-800">Chef de Département</span>{" "}
            peut être nommé responsable de ce département.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Chef de département à assigner *
            </label>
            <select
              value={chefIdChoisi}
              onChange={(e) => setChefIdChoisi(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 bg-white focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/10"
            >
              <option value="">-- Aucun (laisser le poste vacant) --</option>
              {chefsDisponibles.map((u) => {
                const departementsActuels = departements.filter(
                  (d) => d.chefId === u.id || d.id === u.departementId,
                );
                const estCeDep =
                  modalAssignerChefDep?.chefId === u.id ||
                  modalAssignerChefDep?.id === u.departementId;
                const autresDepts = departementsActuels.filter(
                  (d) => d.id !== modalAssignerChefDep?.id,
                );
                return (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} ({u.email})
                    {estCeDep
                      ? " - (Chef actuel de ce département)"
                      : autresDepts.length > 0
                      ? ` - (Déjà chef de : ${autresDepts.map((d) => d.nom).join(", ")})`
                      : " - (Non assigné)"}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
              {assignerChefMutation.isPending
                ? "Enregistrement..."
                : "Confirmer l’assignation"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modale Rattacher un Enseignant non rattaché ── */}
      <Modal
        isOpen={Boolean(modalRattacherEnseignant)}
        onClose={() => setModalRattacherEnseignant(null)}
        title={`Rattacher ${modalRattacherEnseignant ? `${modalRattacherEnseignant.prenom} ${modalRattacherEnseignant.nom}` : "un enseignant"}`}
      >
        <form onSubmit={handleRattacherEnseignant} className="flex flex-col gap-4">
          {erreurAction && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-500" />
              <span>{erreurAction}</span>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Choisissez le département disciplinaire auquel intégrer cet enseignant pour la session active.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Département cible *
            </label>
            <select
              value={departementCibleRattachementId}
              onChange={(e) => setDepartementCibleRattachementId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 bg-white focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/10"
              required
            >
              <option value="">-- Choisir un département --</option>
              {departements.map((d) => {
                const mat = matieresParId.get(d.matiereId);
                return (
                  <option key={d.id} value={d.id}>
                    {d.nom} {mat ? `(${mat.nom})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalRattacherEnseignant(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={
                ajouterRosterMutation.isPending ||
                !departementCibleRattachementId
              }
              className="bg-brand-orange text-white hover:bg-brand-orange/90"
            >
              {ajouterRosterMutation.isPending
                ? "Rattachement en cours..."
                : "Intégrer au département"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modale Détail & Équipe du Département ── */}
      {departementSelectionne && (
        <DepartementDetailModal
          departement={departementSelectionne}
          matiere={matieresParId.get(departementSelectionne.matiereId)}
          chef={chefsParDepartementId.get(departementSelectionne.id)}
          onAssignerChef={() => ouvrirAssignerChef(departementSelectionne)}
          rosterEnseignantIds={
            rostersParDepartementId.get(departementSelectionne.id) ?? []
          }
          enseignantsParId={enseignantsParId}
          tousEnseignants={enseignants}
          formations={formations}
          centres={centres}
          affectations={affectations}
          couleursMatieres={couleursMatieres}
          onClose={() => setDepartementSelectionne(null)}
          onAjouterRoster={(enseignantId) => {
            if (!sessionId) return;
            ajouterRosterMutation.mutate({
              departementId: departementSelectionne.id,
              sessionId,
              enseignantId,
            });
          }}
          onRetirerRoster={(enseignantId) => {
            if (!sessionId) return;
            retirerRosterMutation.mutate({
              departementId: departementSelectionne.id,
              sessionId,
              enseignantId,
            });
          }}
        />
      )}

      {/* ── Modale Catalogue des Matières ── */}
      <CatalogueMatieresModal
        isOpen={modalCatalogueMatieres}
        onClose={() => setModalCatalogueMatieres(false)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT MODALE DÉTAIL D'UN DÉPARTEMENT
// ─────────────────────────────────────────────────────────────────────────────

type DetailModalProps = {
  departement: Departement;
  matiere?: Matiere;
  chef?: { nom: string; prenom: string; email: string; telephone?: string | null };
  onAssignerChef?: () => void;
  rosterEnseignantIds: string[];
  enseignantsParId: Map<string, Enseignant>;
  tousEnseignants: Enseignant[];
  formations: Formation[];
  centres: { id: string; nom: string }[];
  affectations: {
    id: string;
    centreId: string;
    formationId: string;
    matiereId: string;
    enseignantId?: string | null;
    jour: string;
    seance: number;
    semaine: number;
    statut: string;
  }[];
  couleursMatieres: Map<string, CouleurMatiere>;
  onClose: () => void;
  onAjouterRoster: (enseignantId: string) => void;
  onRetirerRoster: (enseignantId: string) => void;
};

function DepartementDetailModal({
  departement,
  matiere,
  chef,
  onAssignerChef,
  rosterEnseignantIds,
  enseignantsParId,
  tousEnseignants,
  formations,
  centres,
  affectations,
  couleursMatieres,
  onClose,
  onAjouterRoster,
  onRetirerRoster,
}: DetailModalProps) {
  const [onglet, setOnglet] = useState<"roster" | "creneaux" | "formations">(
    "roster",
  );

  const [modalAjoutEnseignantOuvert, setModalAjoutEnseignantOuvert] =
    useState(false);
  const [enseignantAajouterId, setEnseignantAajouterId] = useState("");
  const [rechercheRoster, setRechercheRoster] = useState("");

  const enseignantIdsSet = useMemo(
    () => new Set(rosterEnseignantIds),
    [rosterEnseignantIds],
  );

  // Enseignants non encore dans le roster
  const enseignantsDisponibles = useMemo(() => {
    return tousEnseignants.filter((e) => !enseignantIdsSet.has(e.id));
  }, [tousEnseignants, enseignantIdsSet]);

  // Enseignants membres du roster
  const enseignantsRoster = useMemo(() => {
    return rosterEnseignantIds
      .map((id) => enseignantsParId.get(id))
      .filter((e): e is Enseignant => Boolean(e))
      .filter((e) => {
        if (!rechercheRoster.trim()) return true;
        const q = rechercheRoster.toLowerCase();
        return (
          e.nom.toLowerCase().includes(q) ||
          e.prenom.toLowerCase().includes(q) ||
          e.matricule.toLowerCase().includes(q)
        );
      });
  }, [rosterEnseignantIds, enseignantsParId, rechercheRoster]);

  // Créneaux de la matière
  const creneauxMatiere = useMemo(() => {
    return affectations.filter((a) => a.matiereId === departement.matiereId);
  }, [affectations, departement.matiereId]);

  // Formations de la matière
  const formationsMatiere = useMemo(() => {
    return formations.filter((f) =>
      f.matiereIds?.includes(departement.matiereId),
    );
  }, [formations, departement.matiereId]);

  const couleur = matiere ? couleursMatieres.get(matiere.id) : undefined;

  const centresParId = useMemo(() => {
    const map = new Map<string, string>();
    centres.forEach((c) => map.set(c.id, c.nom));
    return map;
  }, [centres]);

  const formationsParId = useMemo(() => {
    const map = new Map<string, string>();
    formations.forEach((f) => map.set(f.id, f.nom));
    return map;
  }, [formations]);

  const validerAjoutEnseignant = () => {
    if (!enseignantAajouterId) return;
    onAjouterRoster(enseignantAajouterId);
    setEnseignantAajouterId("");
    setModalAjoutEnseignantOuvert(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative flex flex-col max-h-[90vh] w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header modal */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/70 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange shadow-2xs">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {departement.nom}
                </h2>
                {matiere && (
                  <span
                    style={
                      couleur?.hex
                        ? getCouleurCardStyle(couleur.hex, true)
                        : undefined
                    }
                    className={`rounded-lg px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide border shadow-2xs ${
                      couleur
                        ? `${couleur.bg} ${couleur.texte} border-slate-200/60`
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {matiere.nom}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-slate-500">
                  {chef
                    ? `Dirigé par ${chef.prenom} ${chef.nom} (${chef.email})`
                    : "Aucun chef de département désigné"}
                </p>
                {onAssignerChef && (
                  <button
                    type="button"
                    onClick={onAssignerChef}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-orange hover:text-brand-orange/80 cursor-pointer"
                  >
                    <UserCheck size={12} />
                    <span>{chef ? "Modifier le chef" : "Désigner un chef"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation par onglets */}
        <div className="flex border-b border-slate-200 bg-white px-5 gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setOnglet("roster")}
            className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              onglet === "roster"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users size={15} />
            <span>Équipe Pédagogique (Roster)</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-extrabold">
              {rosterEnseignantIds.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOnglet("creneaux")}
            className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              onglet === "creneaux"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarClock size={15} />
            <span>Séances de la semaine</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-extrabold">
              {creneauxMatiere.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOnglet("formations")}
            className={`py-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              onglet === "formations"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <GraduationCap size={15} />
            <span>Formations concernées</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 font-extrabold">
              {formationsMatiere.length}
            </span>
          </button>
        </div>

        {/* Corps des onglets */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ONGLET 1 : ROSTER ENSEIGNANTS */}
          {onglet === "roster" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 w-full sm:w-80 focus-within:border-brand-orange focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-orange/10 transition-all shadow-2xs">
                  <Search size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="search"
                    value={rechercheRoster}
                    onChange={(e) => setRechercheRoster(e.target.value)}
                    placeholder="Filtrer les enseignants (nom, matricule)..."
                    className="w-full text-xs outline-none text-slate-700 bg-transparent placeholder-slate-400"
                    aria-label="Filtrer les enseignants du roster"
                  />
                  {rechercheRoster && (
                    <button
                      type="button"
                      onClick={() => setRechercheRoster("")}
                      className="text-slate-400 hover:text-slate-600 p-0.5"
                      title="Effacer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={() => setModalAjoutEnseignantOuvert(true)}
                  className="flex items-center gap-1.5 bg-brand-orange text-white text-xs font-bold px-3 py-2 rounded-xl"
                >
                  <UserPlus size={14} />
                  <span>Ajouter un enseignant</span>
                </Button>
              </div>

              {enseignantsRoster.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Users size={32} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-xs font-bold text-slate-700">
                    Aucun enseignant dans le roster de cette session
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Mobilisez des enseignants pour leur permettre d’animer les cours de cette matière.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Enseignant</th>
                        <th className="p-3">Matricule</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enseignantsRoster.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-black text-[10px] text-slate-700">
                                {e.prenom[0]}
                                {e.nom[0]}
                              </div>
                              <span className="font-bold text-slate-900">
                                {e.prenom} {e.nom}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-600">
                            {e.matricule}
                          </td>
                          <td className="p-3 text-slate-500">
                            {e.telephone ? (
                              <span className="flex items-center gap-1">
                                <Phone size={11} className="text-slate-400" />
                                {e.telephone}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                e.statut === "ACTIF"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {e.statut === "ACTIF" ? "Actif" : "Gelé"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => onRetirerRoster(e.id)}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Retirer du roster de la session"
                            >
                              <Trash2 size={12} />
                              Retirer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ONGLET 2 : CRÉNEAUX DE LA SEMAINE */}
          {onglet === "creneaux" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500">
                Liste des séances programmées cette semaine dans l’ensemble des centres pour la matière{" "}
                <span className="font-bold text-slate-800">{matiere?.nom}</span>.
              </p>

              {creneauxMatiere.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  Aucun créneau planifié pour cette matière cette semaine.
                </div>
              ) : (
                <div className="overflow-hidden overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Jour / Séance</th>
                        <th className="p-3">Centre</th>
                        <th className="p-3">Formation</th>
                        <th className="p-3">Enseignant assigné</th>
                        <th className="p-3 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {creneauxMatiere.map((c) => {
                        const prof = c.enseignantId
                          ? enseignantsParId.get(c.enseignantId)
                          : undefined;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-slate-800">
                              {c.jour} - Séance {c.seance}
                            </td>
                            <td className="p-3 text-slate-600">
                              {centresParId.get(c.centreId) ?? c.centreId}
                            </td>
                            <td className="p-3 text-slate-600">
                              {formationsParId.get(c.formationId) ?? c.formationId}
                            </td>
                            <td className="p-3">
                              {prof ? (
                                <span className="font-bold text-slate-900">
                                  {prof.prenom} {prof.nom}
                                </span>
                              ) : (
                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold">
                                  En attente d’assignation
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  c.statut === "EFFECTUEE"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {c.statut === "EFFECTUEE" ? "Effectuée" : "Planifiée"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ONGLET 3 : FORMATIONS CONCERNÉES */}
          {onglet === "formations" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500">
                Formations académiques intégrant cette matière dans leur cursus d’enseignement :
              </p>

              {formationsMatiere.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  Aucune formation n’intègre actuellement cette matière à son programme.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formationsMatiere.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-brand-orange shadow-2xs">
                        <GraduationCap size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {f.nom}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {f.matiereIds?.length ?? 0} matière(s) au programme
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50/70 p-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>

      {/* Sub-modal Ajout Enseignant Roster */}
      {modalAjoutEnseignantOuvert && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Ajouter un enseignant au roster
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sélectionnez un enseignant à intégrer dans l’équipe du département pour la session active.
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Enseignant disponible
              </label>
              <select
                value={enseignantAajouterId}
                onChange={(e) => setEnseignantAajouterId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 bg-white focus:border-brand-orange focus:outline-none"
              >
                <option value="">-- Choisir un enseignant --</option>
                {enseignantsDisponibles.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.prenom} {e.nom} ({e.matricule})
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalAjoutEnseignantOuvert(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={!enseignantAajouterId}
                onClick={validerAjoutEnseignant}
                className="bg-brand-orange text-white hover:bg-brand-orange/90"
              >
                Ajouter à l’équipe
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
