"use client";

import { useFormations, Formation } from "@/modules/academique";
import {
  useAffectations,
  useAffectationsMultiMatiere,
  useAssignerEnseignant,
  useAnnulerEffectuee,
  useCreerCreneau,
  useMarquerEffectuee,
  useModifierMatiere,
  useSupprimerCreneau,
  JOURS,
  LABELS_JOUR,
  type Affectation,
  type CreerCreneauInput,
  type Jour,
} from "@/modules/affectation";
import { useRosterDepartement } from "@/modules/affectation-departementale";
import {
  useSessionActive,
  useCentres,
  useSemaines,
  Centre,
} from "@/modules/centres-sessions";
import { useAbonnementsSession } from "@/modules/abonnement";
import {
  useDepartement,
  useDepartements,
  Departement,
} from "@/modules/departement";
import {
  useMatieres,
  construireCouleursMatieres,
  getCouleurCardStyle,
  isCouleurClaire,
  CouleurMatiere,
  Matiere,
} from "@/modules/matieres";
import { useEnseignants, Enseignant } from "@/modules/personnel";
import { useSalles, Salle } from "@/modules/salle";
import {
  dateSeance,
  semaineCouranteDepuis,
  semaineTotaleSession,
} from "@/shared/lib/semaine";
import {
  useConcoursBlancs,
  ContenuEpreuveModal,
  type ConcoursBlanc,
  type EpreuveConcoursBlanc,
} from "@/modules/concours-blancs";
import { Card, Modal, Button } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import { Role } from "@/types/roles";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  UserRound,
  BookOpen,
  Trash2,
  Palette,
  CheckCircle2,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Phone,
} from "lucide-react";
import { useState, useMemo } from "react";

type Props = {
  role: Role;
  departementId: string | null;
  // Centre de l'utilisateur connecté (Chef de Centre ou tout personnel rattaché à un centre).
  // Lorsque renseigné, la grille n'affiche strictement que ce centre.
  centreId?: string | null;
  readOnly?: boolean;
  chefId?: string;
};
const MAX_SEANCES_PAR_JOUR = 3;
// Valeur du sélecteur "Département :" représentant la vue combinée d'un chef qui
// dirige plusieurs départements — jamais un vrai UUID de département, donc pas de
// risque de collision.
const TOUS_DEPARTEMENTS_VALEUR = "__TOUS__";
// Traits renforcés (par rapport au quadrillage fin border-brand-gray/20 déjà sur
// chaque cellule) pour faire ressortir les frontières entre centres (verticale,
// avant la 1ère salle de chaque centre sauf le tout premier) et entre jours
// (horizontale, au-dessus de la 1ère ligne de chaque jour).
const BORDURE_JOUR = "border-t-[3px] border-t-slate-600";

// Écran partagé (voir page.tsx) : périmètre et droits varient selon le rôle, la
// structure de grille reste la même. Création de créneau et assignation d'enseignant
// sont des actions IMMÉDIATES (comme la modification de matière et la suppression) -
// plus de mise en attente locale ni de bouton "Enregistrer" global (décision du
// 30/08/2026, suite au retrait de ce bouton).
export function PlanificationView({
  role,
  departementId,
  centreId,
  readOnly = false,
  chefId,
}: Props) {
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;
  const { data: semainesPersistantes = [] } = useSemaines(sessionId);

  const { data: departements = [] } = useDepartements();

  const estChefDepartement = role === "CHEF_DEPARTEMENT";

  // Pour un chef de département dirigeant plusieurs départements
  const mesDepartements = useMemo(() => {
    if (!estChefDepartement || !departements || departements.length === 0)
      return [];
    if (chefId) {
      const depts = departements.filter(
        (d) => d.chefId === chefId || (departementId && d.id === departementId),
      );
      if (depts.length > 0) return depts;
    }
    if (departementId) {
      const d = departements.find((dep) => dep.id === departementId);
      if (d) return [d];
    }
    return [];
  }, [estChefDepartement, departements, chefId, departementId]);

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  // Vue combinée, uniquement proposée à un chef qui dirige effectivement plus
  // d'un département (voir le sélecteur "Département :" dans l'en-tête).
  const vueTousDepartements =
    selectedDeptId === TOUS_DEPARTEMENTS_VALEUR && mesDepartements.length > 1;

  const departementEffectifId = useMemo(() => {
    if (vueTousDepartements) return undefined;
    if (
      selectedDeptId &&
      mesDepartements.some((d) => d.id === selectedDeptId)
    ) {
      return selectedDeptId;
    }
    if (mesDepartements.length > 0) {
      return mesDepartements[0].id;
    }
    if (departementId) return departementId;
    return undefined;
  }, [vueTousDepartements, selectedDeptId, mesDepartements, departementId]);

  const { data: departement } = useDepartement(
    vueTousDepartements ? undefined : departementEffectifId,
  );
  const { data: centres } = useCentres();
  const { data: formations } = useFormations();
  const { data: salles } = useSalles(sessionId);
  const { data: matieres } = useMatieres();
  const { data: enseignants } = useEnseignants();
  const { data: abonnementsSession = [], isLoading: chargementAbonnements } =
    useAbonnementsSession(sessionId);

  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;
  // Contrairement au tableau de bord Chef de Département (limité à 1..semaine
  // courante), ici on doit pouvoir naviguer sur TOUTE la session, y compris les
  // semaines futures : construire/consulter le planning à l'avance est le but même
  // de cet écran pour le Directeur Académique.
  const semaineTotaleCalculee = sessionActive
    ? semaineTotaleSession(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;
  const semaineTotale = Math.max(
    semaineTotaleCalculee,
    ...semainesPersistantes,
    1,
  );

  const [semaineChoisie, setSemaineChoisie] = useState<number | null>(null);
  const semaine = semaineChoisie ?? semaineCourante;

  const { data: concoursBlancsSession = [] } = useConcoursBlancs(sessionId);
  const [epreuveActiveModal, setEpreuveActiveModal] = useState<EpreuveConcoursBlanc | null>(null);
  const [epreuvesConcoursModal, setEpreuvesConcoursModal] = useState<EpreuveConcoursBlanc[]>([]);
  const [cbActifModal, setCbActifModal] = useState<ConcoursBlanc | null>(null);

  const concoursBlancsSemaine = useMemo(() => {
    return concoursBlancsSession.filter((cb) => cb.semaine === semaine);
  }, [concoursBlancsSession, semaine]);

  const matiereIdFiltre = estChefDepartement
    ? departement?.matiereId
    : undefined;

  const { data: affectationsUnDepartement } = useAffectations({
    // Pour un Chef de Département, on ne déclenche la requête qu'une fois son
    // département chargé (sinon useAffectations, qui n'exige plus matiereId,
    // afficherait un instant les créneaux de TOUS les départements). En vue
    // combinée ("Tous mes départements"), cette requête reste désactivée : c'est
    // useAffectationsMultiMatiere qui prend le relais ci-dessous.
    sessionId:
      estChefDepartement && !vueTousDepartements
        ? departement
          ? sessionId
          : undefined
        : vueTousDepartements
          ? undefined
          : sessionId,
    semaine,
    matiereId: matiereIdFiltre,
    centreId: centreId ?? undefined,
  });

  const { data: affectationsTousDepartements } = useAffectationsMultiMatiere({
    sessionId: vueTousDepartements ? sessionId : undefined,
    semaine,
    matiereIds: vueTousDepartements
      ? mesDepartements.map((d) => d.matiereId)
      : [],
    centreId: centreId ?? undefined,
  });

  const affectations = vueTousDepartements
    ? affectationsTousDepartements
    : affectationsUnDepartement;

  const peutAssigner =
    !readOnly &&
    (role === "DIRECTEUR_ACADEMIQUE" || role === "CHEF_DEPARTEMENT");
  // Seul le Directeur Académique construit le planning (crée des créneaux) - le
  // Chef de Département n'assigne que sur l'existant (confirmé le 29/08/2026).
  const peutCreerCreneaux = !readOnly && role === "DIRECTEUR_ACADEMIQUE";
  // Chef de Centre : seule action possible, marquer une séance déjà assignée comme
  // effectuée, et seulement sur son propre centre.
  const estChefCentre = role === "CHEF_CENTRE";
  const peutMarquerEffectueeGlobalement = !readOnly && estChefCentre;

  const [recherche, setRecherche] = useState("");
  const [zoom, setZoom] = useState(100);
  const [modalPublierOuvert, setModalPublierOuvert] = useState(false);
  const [copie, setCopie] = useState(false);
  const creer = useCreerCreneau();

  // Colonnes : Centre -> Formation -> Salle.
  // Personnel de centre (Chef de Centre ou autre) : uniquement les salles de son centre.
  // Chef de Département : seulement les salles réellement utilisées par sa matière cette semaine.
  // Directeur Académique : l'inventaire complet des salles de la session, y compris les vides.
  const sallesAffichees = useMemo(() => {
    if (!salles) return undefined;
    let baseSalles = salles;
    if (centreId) {
      baseSalles = baseSalles.filter((s) => s.centreId === centreId);
    }
    if (!estChefDepartement) return baseSalles;
    const idsUtilises = new Set((affectations ?? []).map((a) => a.salleId));
    return baseSalles.filter((s) => idsUtilises.has(s.id));
  }, [salles, affectations, estChefDepartement, centreId]);

  type GroupeFormation = { formation: Formation; salles: Salle[] };
  type GroupeCentre = { centre: Centre; formations: GroupeFormation[] };

  const colonnes = useMemo<GroupeCentre[]>(() => {
    if (!sallesAffichees || !centres || !formations) return [];

    // Clés centreId:formationId auxquelles les centres sont abonnés pour cette session
    const abonnementsActifs = new Set(
      abonnementsSession.map((a) => `${a.centreId}:${a.formationId}`),
    );

    const centresFiltres = centreId
      ? centres.filter((c) => c.id === centreId)
      : centres;

    const parCentre = new Map<string, GroupeCentre>();
    for (const salle of sallesAffichees) {
      if (centreId && salle.centreId !== centreId) continue;
      const centre = centresFiltres.find((c) => c.id === salle.centreId);
      const formation = formations.find((f) => f.id === salle.formationId);
      if (!centre || !formation) continue;

      // Filtrer : Le centre DOIT être abonné à cette formation pour cette session
      if (!abonnementsActifs.has(`${centre.id}:${formation.id}`)) continue;

      if (!parCentre.has(centre.id)) {
        parCentre.set(centre.id, { centre, formations: [] });
      }
      const groupeCentre = parCentre.get(centre.id)!;
      let groupeFormation = groupeCentre.formations.find(
        (g) => g.formation.id === formation.id,
      );
      if (!groupeFormation) {
        groupeFormation = { formation, salles: [] };
        groupeCentre.formations.push(groupeFormation);
      }
      groupeFormation.salles.push(salle);
    }

    // Uniquement les formations qui ont des salles et les centres qui en contiennent, triées par ordre alphabétique
    return [...parCentre.values()]
      .map((gc) => ({
        ...gc,
        formations: gc.formations
          .filter((gf) => gf.salles.length > 0)
          .sort((a, b) =>
            a.formation.nom.localeCompare(b.formation.nom, "fr", {
              sensitivity: "base",
            }),
          )
          .map((gf) => ({
            ...gf,
            salles: [...gf.salles].sort((s1, s2) =>
              s1.nom.localeCompare(s2.nom, "fr", { numeric: true }),
            ),
          })),
      }))
      .filter((gc) => gc.formations.length > 0);
  }, [sallesAffichees, centres, formations, abonnementsSession, centreId]);

  const totalColonnes = colonnes.reduce(
    (total, groupe) =>
      total + groupe.formations.reduce((t, f) => t + f.salles.length, 0),
    0,
  );

  const matieresVisibles = useMemo(() => {
    if (!matieres || !affectations) return [];
    const ids = new Set(affectations.map((a) => a.matiereId));
    return matieres.filter((m) => ids.has(m.id));
  }, [matieres, affectations]);

  const couleursMatieres = useMemo(
    () => construireCouleursMatieres(matieres ?? []),
    [matieres],
  );

  const matieresParFormationId = useMemo(() => {
    const map = new Map<string, Matiere[]>();
    if (!formations || !matieres) return map;
    for (const f of formations) {
      const allowed = new Set(f.matiereIds ?? []);
      map.set(
        f.id,
        matieres.filter((m) => allowed.has(m.id)),
      );
    }
    return map;
  }, [formations, matieres]);

  function creneauxPour(
    salleId: string,
    jour: Jour,
  ): (Affectation | undefined)[] {
    // Un créneau supprimé (DELETE) n'apparaît plus du tout dans la réponse de
    // l'API - plus besoin de filtrer un statut ANNULEE ici.
    const reels = (affectations ?? []).filter(
      (a) => a.salleId === salleId && a.jour === jour,
    );
    const seanceMax = Math.max(
      MAX_SEANCES_PAR_JOUR,
      ...reels.map((a) => a.seance),
    );
    const parSeance: (Affectation | undefined)[] = Array.from(
      { length: seanceMax },
      () => undefined,
    );
    for (const a of reels) {
      parSeance[a.seance - 1] = a;
    }
    return parSeance;
  }

  async function creerCreneau(
    salle: Salle,
    jour: Jour,
    seance: number,
    matiereId: string,
  ) {
    if (!sessionId) return;
    // Garde-fou défensif : le bouton "+ Créneau" ne doit déjà plus s'afficher au-delà
    // du plafond (voir emplacementLibre plus bas), mais on vérifie quand même ici.
    if (seance > MAX_SEANCES_PAR_JOUR) return;
    const input: CreerCreneauInput = {
      centreId: salle.centreId,
      sessionId,
      formationId: salle.formationId,
      salleId: salle.id,
      matiereId,
      jour,
      seance,
      semaine,
    };
    await creer.mutateAsync(input);
  }

  function correspondALaRecherche(creneau: Affectation): boolean {
    if (!recherche.trim()) return true;
    const q = recherche.trim().toLowerCase();
    const enseignant = enseignants?.find((e) => e.id === creneau.enseignantId);
    const matiere = matieres?.find((m) => m.id === creneau.matiereId);
    const salle = salles?.find((s) => s.id === creneau.salleId);
    const formation = formations?.find((f) => f.id === creneau.formationId);
    const texte = [
      enseignant ? `${enseignant.prenom} ${enseignant.nom}` : "",
      matiere?.nom ?? "",
      salle?.nom ?? "",
      formation?.nom ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return texte.includes(q);
  }

  // Nombre de séances déjà assignées cette semaine au(x) enseignant(s)
  // correspondant à la recherche - null si la recherche ne correspond à aucun
  // enseignant par son nom (recherche vide, ou elle ne matche qu'une
  // salle/matière/formation, auquel cas ce compteur n'a pas de sens).
  const seancesEnseignantRecherche = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q || !enseignants) return null;
    const idsCorrespondants = new Set(
      enseignants
        .filter((e) => `${e.prenom} ${e.nom}`.toLowerCase().includes(q))
        .map((e) => e.id),
    );
    if (idsCorrespondants.size === 0) return null;
    return (affectations ?? []).filter(
      (a) => a.enseignantId && idsCorrespondants.has(a.enseignantId),
    ).length;
  }, [recherche, enseignants, affectations]);

  const chargement =
    !sessionActive ||
    !centres ||
    !formations ||
    !salles ||
    !matieres ||
    chargementAbonnements;

  const centreConnecte = useMemo(
    () => (centreId ? centres?.find((c) => c.id === centreId) : undefined),
    [centres, centreId],
  );

  const urlPublique =
    typeof window !== "undefined"
      ? `${window.location.origin}/planning/public?semaine=${semaine}${centreId ? `&centreId=${centreId}` : ""}`
      : `/planning/public?semaine=${semaine}${centreId ? `&centreId=${centreId}` : ""}`;

  const copierLien = async () => {
    try {
      await navigator.clipboard.writeText(urlPublique);
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4">
      {/* ── En-tête ── */}
      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Planning de la semaine
            {estChefDepartement && vueTousDepartements
              ? ` - ${mesDepartements.map((d) => d.nom).join(" & ")}`
              : estChefDepartement && departement
                ? ` - ${departement.nom}`
                : ""}
            {centreConnecte ? ` - ${centreConnecte.nom}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {role === "DIRECTEUR_ACADEMIQUE"
              ? "Vue d'ensemble de toutes les séances planifiées."
              : centreConnecte
                ? `Planning du centre ${centreConnecte.nom}.`
                : peutAssigner
                  ? vueTousDepartements
                    ? "Assignez des enseignants sur les créneaux de vos départements."
                    : "Assignez des enseignants sur les créneaux de votre département."
                  : "Consultez le planning de la semaine en cours."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sélecteur de département si Chef de plusieurs départements */}
          {estChefDepartement && mesDepartements.length > 1 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">
                Département :
              </span>
              <select
                value={
                  vueTousDepartements
                    ? TOUS_DEPARTEMENTS_VALEUR
                    : departementEffectifId
                }
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="cursor-pointer bg-transparent text-xs font-bold text-slate-800 outline-none"
              >
                {mesDepartements.map((d) => (
                  <option key={d.id} value={d.id} className="bg-white text-slate-800">
                    {d.nom}
                  </option>
                ))}
                <option value={TOUS_DEPARTEMENTS_VALEUR} className="bg-white text-slate-800">
                  Tous mes départements
                </option>
              </select>
            </div>
          )}

          {/* Recherche */}
          <div className="flex flex-col gap-1">
            <div className="focus-within:border-brand-orange focus-within:ring-brand-orange/10 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xs focus-within:ring-2">
              <Search size={15} className="shrink-0 text-slate-400" />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un enseignant, une salle..."
                className="w-52 text-sm text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>
            {seancesEnseignantRecherche !== null && (
              <p className="text-brand-orange px-1 text-xs font-bold">
                {seancesEnseignantRecherche} séance
                {seancesEnseignantRecherche > 1 ? "s" : ""} assignée
                {seancesEnseignantRecherche > 1 ? "s" : ""} cette semaine
              </p>
            )}
          </div>

          {/* Navigation semaine */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1 py-1 shadow-xs">
            <button
              type="button"
              onClick={() => setSemaineChoisie(Math.max(1, semaine - 1))}
              disabled={semaine <= 1}
              className="text-brand-anthracite rounded-lg p-2 transition-colors hover:bg-slate-100 disabled:opacity-30"
              aria-label="Semaine précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-brand-anthracite px-3 text-sm font-bold whitespace-nowrap">
              Semaine {semaine}
              {semaine === semaineCourante ? (
                <span className="text-brand-orange ml-1.5 text-xs font-normal">
                  (en cours)
                </span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={() =>
                setSemaineChoisie(Math.min(semaineTotale, semaine + 1))
              }
              disabled={semaine >= semaineTotale}
              className="text-brand-anthracite rounded-lg p-2 transition-colors hover:bg-slate-100 disabled:opacity-30"
              aria-label="Semaine suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1 py-1 shadow-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              disabled={zoom <= 50}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
              aria-label="Réduire"
              title="Réduire"
            >
              <span className="text-base leading-none font-bold">−</span>
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="w-10 px-2 text-center text-xs font-bold text-slate-500 tabular-nums hover:text-slate-700"
              title="Réinitialiser le zoom"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              disabled={zoom >= 150}
              className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30"
              aria-label="Agrandir"
              title="Agrandir"
            >
              <span className="text-base leading-none font-bold">+</span>
            </button>
          </div>

          {/* Bouton Publier */}
          <Button
            type="button"
            onClick={() => setModalPublierOuvert(true)}
            className="bg-brand-orange hover:bg-brand-orange/90 flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white shadow-xs transition-all"
            title="Générer un lien public de ce planning"
          >
            <Share2 size={15} />
            <span>Publier</span>
          </Button>
        </div>
      </div>

      {/* ── Grille + Légende ── */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
        {/* Grille planning (Centres → Formations → Salles × Jours) */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div
            className="min-h-0 flex-1 overflow-auto"
            style={{ zoom: zoom / 100 }}
          >
            {chargement ? (
              <p className="text-brand-gray p-8 text-center text-sm">
                Chargement...
              </p>
            ) : colonnes.length === 0 ? (
              <p className="text-brand-gray p-8 text-center text-sm">
                {estChefDepartement
                  ? "Aucun créneau planifié pour votre département cette semaine."
                  : centreConnecte
                    ? `Aucune formation abonnée disposant de salles pour le centre ${centreConnecte.nom} dans cette session.`
                    : "Aucune formation abonnée disposant de salles pour cette session."}
              </p>
            ) : (
              <table className="min-w-max w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-30 bg-white">
                  {/* Ligne 1 : Centres */}
                  <tr>
                    <th
                      rowSpan={3}
                      className="sticky left-0 z-30 w-[52px] min-w-[52px] border-r border-r-slate-300 border-b border-b-slate-300 bg-slate-100 p-1 text-center align-middle text-[10px] font-bold tracking-wide text-slate-700 uppercase shadow-[1px_0_0_0_#e2e8f0] sm:w-[64px] sm:min-w-[64px] sm:p-2 sm:text-xs sm:tracking-wider"
                    >
                      Jour
                    </th>
                    <th
                      rowSpan={3}
                      className="sticky left-[52px] z-30 w-[36px] min-w-[36px] border-r border-r-slate-300 border-b border-b-slate-300 bg-slate-100 p-1 text-center align-middle text-[10px] font-bold tracking-wide text-slate-700 uppercase shadow-[1px_0_0_0_#e2e8f0] sm:left-[64px] sm:w-[40px] sm:min-w-[40px] sm:p-2 sm:text-xs sm:tracking-wider"
                    >
                      Séance
                    </th>
                    {colonnes.map((groupe, index) => (
                      <th
                        key={groupe.centre.id}
                        colSpan={groupe.formations.reduce(
                          (t, f) => t + f.salles.length,
                          0,
                        )}
                        className={`border-r border-b p-2.5 text-center text-xs font-bold tracking-wider text-white uppercase ${
                          index % 2 === 0 ? "bg-slate-700" : "bg-slate-600"
                        } ${index > 0 ? "border-l-2 border-l-slate-400" : ""}`}
                      >
                        {groupe.centre.nom}
                        {groupe.centre.statut === "FERME" && (
                          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-normal normal-case">
                            Fermé
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                  {/* Ligne 2 : Formations */}
                  <tr>
                    {colonnes.map((groupe, groupeIndex) =>
                      groupe.formations.map((gf, formationIndex) => (
                        <th
                          key={gf.formation.id}
                          colSpan={gf.salles.length}
                          className={`bg-orange-100/60 text-orange-950 border-r border-b border-orange-200/80 p-2 text-center text-xs font-black uppercase tracking-wide ${
                            groupeIndex > 0 && formationIndex === 0
                              ? "border-l-2 border-l-slate-400"
                              : ""
                          }`}
                        >
                          {gf.formation.nom}
                        </th>
                      )),
                    )}
                  </tr>
                  {/* Ligne 3 : Salles */}
                  <tr>
                    {colonnes.map((groupe, groupeIndex) =>
                      groupe.formations.map((gf, formationIndex) =>
                        gf.salles.map((salle, salleIndex) => (
                          <th
                            key={salle.id}
                            className={`min-w-[88px] border-r border-r-slate-300 border-b border-b-slate-300 bg-slate-50 p-1.5 text-center text-[10px] font-semibold text-slate-700 sm:min-w-[120px] sm:p-2.5 sm:text-xs ${
                              groupeIndex > 0 &&
                              formationIndex === 0 &&
                              salleIndex === 0
                                ? "border-l-2 border-l-slate-400"
                                : ""
                            }`}
                          >
                            {salle.nom}
                          </th>
                        )),
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {JOURS.map((jour, jourIndex) => {
                    const teinteJour =
                      jourIndex % 2 === 1 ? "bg-slate-50/60" : "bg-white";
                    const hauteur = Math.max(
                      1,
                      peutCreerCreneaux ? MAX_SEANCES_PAR_JOUR : 1,
                      ...colonnes.flatMap((groupe) =>
                        groupe.formations.flatMap((gf) =>
                          gf.salles.map(
                            (salle) => creneauxPour(salle.id, jour).length,
                          ),
                        ),
                      ),
                    );
                    return Array.from({ length: hauteur }).map((_, ligne) => (
                      <tr
                        key={`${jour}-${ligne}`}
                        className={`${teinteJour} transition-colors duration-100 hover:bg-amber-50/40`}
                      >
                        {ligne === 0 && (
                          <td
                            rowSpan={hauteur}
                            className={`sticky left-0 z-20 w-[52px] min-w-[52px] border-r border-r-slate-300 border-b border-b-slate-300 bg-slate-50/95 p-1 text-center align-middle text-[10px] shadow-[1px_0_0_0_#e2e8f0] backdrop-blur-xs sm:w-[64px] sm:min-w-[64px] sm:p-2 sm:text-xs ${
                              jourIndex > 0 ? BORDURE_JOUR : ""
                            }`}
                          >
                            <span className="bg-brand-anthracite inline-block rounded-lg px-2.5 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-xs">
                              {LABELS_JOUR[jour]}
                            </span>
                          </td>
                        )}
                        <td
                          className={`sticky left-[52px] z-20 w-[36px] min-w-[36px] border-r border-r-slate-300 border-b border-b-slate-300 bg-slate-50/95 p-1 text-center align-middle text-[10px] shadow-[1px_0_0_0_#e2e8f0] backdrop-blur-xs sm:left-[64px] sm:w-[40px] sm:min-w-[40px] sm:p-2 sm:text-xs ${
                            ligne === 0 && jourIndex > 0 ? BORDURE_JOUR : ""
                          }`}
                        >
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-black text-slate-700 shadow-2xs">
                            S{ligne + 1}
                          </span>
                        </td>
                        {colonnes.map((groupe, groupeIndex) =>
                          groupe.formations.map((gf, formationIndex) => {
                            const matieresFormation =
                              matieresParFormationId.get(gf.formation.id) ?? [];
                            return gf.salles.map((salle, salleIndex) => {
                              const contenu = creneauxPour(salle.id, jour);
                              const creneau = contenu[ligne];
                              const seanceNum = ligne + 1;
                              const concoursSurCreneau = concoursBlancsSemaine.find(
                                (cb) =>
                                  cb.jour === jour &&
                                  seanceNum >= cb.seanceDebut &&
                                  seanceNum <= cb.seanceFin &&
                                  (cb.tousLesCentres || (cb.centreIds && cb.centreIds.includes(groupe.centre.id))) &&
                                  cb.epreuves.some((e) => e.formationId === gf.formation.id),
                              );
                              const epreuvesConcours = concoursSurCreneau
                                ? concoursSurCreneau.epreuves.filter(
                                    (e) => e.formationId === gf.formation.id,
                                  )
                                : [];
                              const emplacementLibre =
                                !creneau &&
                                !concoursSurCreneau &&
                                ligne < MAX_SEANCES_PAR_JOUR &&
                                peutCreerCreneaux &&
                                groupe.centre.statut !== "FERME";
                              const bordureCentre =
                                groupeIndex > 0 &&
                                formationIndex === 0 &&
                                salleIndex === 0
                                  ? "border-l-2 border-l-slate-400"
                                  : "";
                              const bordureJour =
                                ligne === 0 && jourIndex > 0
                                  ? BORDURE_JOUR
                                  : "";
                              const centreDesactive =
                                estChefCentre &&
                                Boolean(centreId) &&
                                groupe.centre.id !== centreId;
                              return (
                                <td
                                  key={`${salle.id}-${jour}-${ligne}`}
                                  className={`border-r border-r-slate-300 border-b border-b-slate-300 p-1.5 align-middle ${bordureCentre} ${bordureJour}`}
                                >
                                  {concoursSurCreneau && (
                                    <div
                                      onClick={() => {
                                        setCbActifModal(concoursSurCreneau);
                                        setEpreuvesConcoursModal(epreuvesConcours);
                                        const epDuChef = epreuvesConcours.find((e) =>
                                          mesDepartements.some((d) => d.matiereId === e.matiereId),
                                        );
                                        setEpreuveActiveModal(epDuChef || epreuvesConcours[0] || null);
                                      }}
                                      className="w-full cursor-pointer rounded-xl border border-orange-300/80 bg-gradient-to-r from-orange-500 to-amber-500 p-2 text-white shadow-xs hover:shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[64px]"
                                      title="Créneau Concours Blanc - Cliquez pour voir les épreuves et les contenus"
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                                          Concours Blanc
                                        </span>
                                        <span className="text-[10px] font-bold text-orange-100">
                                          S{concoursSurCreneau.seanceDebut}-S{concoursSurCreneau.seanceFin}
                                        </span>
                                      </div>
                                      <div className="font-bold text-xs truncate mt-0.5">
                                        {concoursSurCreneau.titre}
                                      </div>
                                      {/* Affichage de TOUTES LES MATIÈRES du concours blanc */}
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {epreuvesConcours.map((e) => (
                                          <span
                                            key={e.id}
                                            className="inline-flex items-center gap-1 rounded bg-black/25 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-2xs leading-tight"
                                          >
                                            <span>{e.intitule}</span>
                                            <span className="text-orange-200 text-[8px] font-normal">
                                              {e.dureeMinutes ? `${Math.round(e.dureeMinutes / 60)}h` : ""}{e.coefficient ? ` · c${e.coefficient}` : ""}
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {creneau && !concoursSurCreneau && (
                                    <CelluleCreneau
                                      creneau={creneau}
                                      couleur={couleursMatieres.get(
                                        creneau.matiereId,
                                      )}
                                      attenue={!correspondALaRecherche(creneau)}
                                      enseignants={enseignants}
                                      departements={departements}
                                      matieres={matieresFormation}
                                      couleursMatieres={couleursMatieres}
                                      sessionId={sessionId}
                                      dateDebutSession={
                                        sessionActive?.dateDebut
                                      }
                                      peutAssigner={peutAssigner}
                                      peutGererCreneau={peutCreerCreneaux}
                                      peutMarquerEffectuee={
                                        peutMarquerEffectueeGlobalement &&
                                        !centreDesactive
                                      }
                                    />
                                  )}
                                  {emplacementLibre && (
                                    <CreerCreneauPopover
                                      matieres={matieresFormation}
                                      couleursMatieres={couleursMatieres}
                                      onChoisir={(matiereId) =>
                                        creerCreneau(
                                          salle,
                                          jour,
                                          ligne + 1,
                                          matiereId,
                                        )
                                      }
                                    />
                                  )}
                                </td>
                              );
                            });
                          }),
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            )}
          </div>
          {!chargement && colonnes.length > 0 && (
            <p className="shrink-0 border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
              {totalColonnes} salle(s) · défilement horizontal si la grille
              dépasse l&rsquo;écran
            </p>
          )}
        </div>

        {/* Légende des matières */}
        <Card className="border-brand-orange/20 bg-brand-orange/5 w-full shrink-0 max-h-48 xl:max-h-none overflow-y-auto p-4 xl:w-52">
          <div className="mb-3 flex items-center gap-2">
            <Palette size={15} className="text-brand-orange" />
            <h2 className="text-brand-anthracite text-xs font-bold tracking-wider uppercase">
              Légende
            </h2>
          </div>
          {matieresVisibles.length === 0 ? (
            <p className="text-brand-gray text-sm">
              Aucune matière visible cette semaine.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {matieresVisibles.map((matiere) => {
                const couleur = couleursMatieres.get(matiere.id);
                const hex = couleur?.hex || matiere.couleur;
                return (
                  <span
                    key={matiere.id}
                    className="rounded-lg px-3 py-1.5 text-center text-xs font-bold shadow-xs border"
                    style={getCouleurCardStyle(hex, true)}
                  >
                    {matiere.nom}
                  </span>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Modal Publier / Partager le planning ── */}
      <Modal
        isOpen={modalPublierOuvert}
        onClose={() => {
          setModalPublierOuvert(false);
          setCopie(false);
        }}
        title={`Publier le planning - Semaine ${semaine}`}
        description="Générez un lien direct pour partager le planning de cette semaine (grille complète et légende). Ce lien fonctionne sans connexion et sans barre latérale."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-500 uppercase">
              Lien public de la semaine {semaine}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={urlPublique}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs text-slate-700 outline-none select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={copierLien}
                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                  copie
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-800 text-white shadow-xs hover:bg-slate-900"
                }`}
              >
                {copie ? <Check size={14} /> : <Copy size={14} />}
                {copie ? "Copié !" : "Copier"}
              </button>
            </div>
            {copie && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <Check size={12} />
                Lien copié dans le presse-papier !
              </p>
            )}
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs leading-relaxed text-amber-900">
            💡 <strong>Astuce :</strong> Vous pouvez envoyer ce lien aux
            formateurs ou aux apprenants. Ils visualisent immédiatement la
            grille et la légende de la semaine {semaine}, sans menu ni sidebar.
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setModalPublierOuvert(false)}
              className="cursor-pointer rounded-lg px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              Fermer
            </button>
            <a
              href={`/planning/public?semaine=${semaine}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-orange hover:bg-brand-orange/90 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <ExternalLink size={13} />
              Ouvrir la vue
            </a>
          </div>
        </div>
      </Modal>

      {/* ── Modale de Contenu de l'Épreuve du Concours Blanc ── */}
      {cbActifModal && epreuveActiveModal && (
        <ContenuEpreuveModal
          isOpen={Boolean(cbActifModal && epreuveActiveModal)}
          onClose={() => {
            setCbActifModal(null);
            setEpreuveActiveModal(null);
            setEpreuvesConcoursModal([]);
          }}
          concoursBlancId={cbActifModal.id}
          concoursBlancTitre={cbActifModal.titre}
          epreuve={epreuveActiveModal}
          toutesLesEpreuves={epreuvesConcoursModal}
          mesMatiereIds={new Set(mesDepartements.map((d) => d.matiereId))}
          peutEditer={
            role === "DIRECTEUR_ACADEMIQUE" ||
            (estChefDepartement &&
              mesDepartements.some((d) => d.matiereId === epreuveActiveModal.matiereId))
          }
          departementNom={
            departements.find((d) => d.matiereId === epreuveActiveModal.matiereId)?.nom
          }
          estChefDept={estChefDepartement}
          role={role}
          departementId={departementId || mesDepartements[0]?.id}
        />
      )}
    </div>
  );
}

// Colocalisé : une case de la grille. Résout le département correspondant à la
// matière du créneau (pour restreindre la recherche au bon roster), affiche le
// choix en attente s'il y en a un, et délègue la sauvegarde réelle au bouton
// "Enregistrer" du parent plutôt que de sauvegarder immédiatement (voir note en
// tête de fichier).
// Colocalisé : une case de la grille. Résout le département correspondant à la
// matière du créneau (pour restreindre la recherche au bon roster). Directeur
// Académique (`peutGererCreneau`) : menu à 3 options (assigner / modifier la
// matière / supprimer). Chef de Département : va directement à la recherche
// d'enseignant, comme avant (pas de menu à choisir). Assigner, modifier la matière
// et supprimer sont toutes des actions IMMÉDIATES (pas de mise en attente locale).
type VueMenuCreneau = "actions" | "assigner" | "matiere" | "marquer";

function CelluleCreneau({
  creneau,
  couleur,
  attenue,
  enseignants,
  departements,
  matieres,
  couleursMatieres,
  sessionId,
  dateDebutSession,
  peutAssigner,
  peutGererCreneau,
  peutMarquerEffectuee,
}: {
  creneau: Affectation;
  couleur: CouleurMatiere | undefined;
  attenue: boolean;
  enseignants: Enseignant[] | undefined;
  departements: Departement[] | undefined;
  matieres: Matiere[] | undefined;
  couleursMatieres: Map<string, CouleurMatiere>;
  sessionId: string | undefined;
  dateDebutSession: string | undefined;
  peutAssigner: boolean;
  peutGererCreneau: boolean;
  peutMarquerEffectuee: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [vue, setVue] = useState<VueMenuCreneau>("actions");
  const [recherche, setRecherche] = useState("");
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);

  const assignerMutation = useAssignerEnseignant();
  const modifierMatiereMutation = useModifierMatiere();
  const supprimerMutation = useSupprimerCreneau();
  const marquerEffectueeMutation = useMarquerEffectuee();
  const annulerEffectueeMutation = useAnnulerEffectuee();

  const departementDeLaMatiere = departements?.find(
    (d) => d.matiereId === creneau.matiereId,
  );
  const { data: roster } = useRosterDepartement(
    departementDeLaMatiere?.id,
    sessionId,
  );

  const enseignantsEligibles = useMemo(() => {
    if (!roster || !enseignants) return undefined;
    const ids = new Set(roster.map((r) => r.enseignantId));
    // Un enseignant suspendu ne doit plus être proposable à l'assignation (le
    // backend le refuserait de toute façon, voir EnseignantSuspenduException).
    return enseignants.filter((e) => ids.has(e.id) && e.statut !== "SUSPENDU");
  }, [roster, enseignants]);

  const resultatsEnseignants = useMemo(() => {
    if (!enseignantsEligibles) return [];
    const q = recherche.trim().toLowerCase();
    if (!q) return enseignantsEligibles;
    return enseignantsEligibles.filter((e) =>
      `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(q),
    );
  }, [enseignantsEligibles, recherche]);

  const resultatsMatieres = useMemo(() => {
    if (!matieres) return [];
    const q = recherche.trim().toLowerCase();
    if (!q) return matieres;
    return matieres.filter((m) => m.nom.toLowerCase().includes(q));
  }, [matieres, recherche]);

  const enseignant = enseignants?.find((e) => e.id === creneau.enseignantId);
  const matiere = matieres?.find((m) => m.id === creneau.matiereId);
  const peutOuvrir = peutAssigner || peutGererCreneau || peutMarquerEffectuee;
  // Une fois la séance EFFECTUEE, plus aucune modification (assigner, changer la
  // matière, supprimer) - seule la rétro-action du Chef de Centre (vue "marquer",
  // gérée séparément) reste possible.
  const estVerrouilleeEffectuee = creneau.statut === "EFFECTUEE";
  // On ne peut pas confirmer une séance qui n'a pas encore eu lieu (ex : on est
  // lundi, la séance est prévue mardi) - le Chef de Centre ne peut marquer
  // "effectuée" qu'une fois la date de la séance atteinte ou dépassée.
  const dateDeLaSeance = dateDebutSession
    ? dateSeance(dateDebutSession, creneau.semaine, JOURS.indexOf(creneau.jour))
    : undefined;
  const seanceEstFuture =
    dateDeLaSeance !== undefined &&
    dateDeLaSeance.getTime() > new Date().getTime();

  function fermer() {
    setOuvert(false);
    setVue("actions");
    setRecherche("");
    setConfirmationSuppression(false);
  }

  function ouvrir() {
    // Le Chef de Département n'a que l'assignation, le Chef de Centre que le
    // marquage "effectuée" -- vont droit au but, pas de menu à traverser.
    setVue(
      peutGererCreneau ? "actions" : peutAssigner ? "assigner" : "marquer",
    );
    setOuvert(true);
  }

  async function choisirEnseignant(enseignantId: string) {
    try {
      await assignerMutation.mutateAsync({ id: creneau.id, enseignantId });
      fermer();
    } catch {
      // Erreur affichée via assignerMutation.isError, popover reste ouvert.
    }
  }

  async function choisirMatiere(matiereId: string) {
    try {
      await modifierMatiereMutation.mutateAsync({ id: creneau.id, matiereId });
      fermer();
    } catch {
      // Erreur affichée via modifierMatiereMutation.isError, popover reste ouvert.
    }
  }

  async function confirmerSuppression() {
    try {
      await supprimerMutation.mutateAsync(creneau.id);
      fermer();
    } catch {
      // Erreur affichée via supprimerMutation.isError, popover reste ouvert.
    }
  }

  async function confirmerEffectuee() {
    try {
      await marquerEffectueeMutation.mutateAsync(creneau.id);
      fermer();
    } catch {
      // Erreur affichée via marquerEffectueeMutation.isError, popover reste ouvert.
    }
  }

  // Rétro-action : le Chef de Centre confirme une séance par erreur -> il doit
  // pouvoir revenir sur son action, le créneau retrouve son statut précédent
  // (ASSIGNEE, enseignant conservé).
  async function confirmerAnnulationEffectuee() {
    try {
      await annulerEffectueeMutation.mutateAsync(creneau.id);
      fermer();
    } catch {
      // Erreur affichée via annulerEffectueeMutation.isError, popover reste ouvert.
    }
  }

  const hex = couleur?.hex || matiere?.couleur || "#94a3b8";
  const isLight = isCouleurClaire(hex);

  return (
    <div className={attenue ? "opacity-30" : ""}>
      <div className="relative">
        <button
          type="button"
          onClick={() => peutOuvrir && (ouvert ? fermer() : ouvrir())}
          disabled={!peutOuvrir}
          style={{
            borderColor: hex,
          }}
          className={`group/slot relative w-full rounded-xl bg-white border-2 p-2.5 text-left shadow-2xs transition-all hover:bg-slate-50/60 hover:shadow-xs ${
            peutOuvrir
              ? "cursor-pointer"
              : "cursor-default"
          }`}
        >
          {/* Si enseignant assigné : Enseignant avec tranche matière */}
          {enseignant ? (
            <div className="flex flex-col gap-1.5">
              {/* En-tête de carte : Badge Matière + Statut Fait */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-700 max-w-[130px] truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="truncate">{matiere?.nom ?? "Matière"}</span>
                </span>

                {creneau.statut === "EFFECTUEE" && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                    <CheckCircle2 size={10} className="text-emerald-600" />
                    <span>Fait</span>
                  </span>
                )}
              </div>

              {/* Corps Enseignant : Avatar avec anneau couleur + Nom + Téléphone */}
              <div className="flex items-start gap-2 min-w-0 pt-0.5">
                <span
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white text-[10px] font-black shadow-2xs"
                  style={{
                    borderColor: hex,
                    color: isLight ? "#0f172a" : hex,
                  }}
                >
                  {enseignant.prenom[0]}
                  {enseignant.nom[0]}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {enseignant.nom} {enseignant.prenom}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 rounded-md border border-slate-200/90 bg-slate-50 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 shadow-2xs">
                    <Phone size={11} className="text-brand-orange shrink-0" />
                    <span className="truncate tracking-wide">
                      {enseignant.telephone || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Si aucun enseignant assigné */
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-700 max-w-[130px] truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="truncate">{matiere?.nom ?? "Matière"}</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  -
                </span>
              </div>

              {peutAssigner || peutGererCreneau ? (
                <div className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/70 px-2 py-1 text-[11px] font-bold text-amber-800 shadow-2xs transition-colors hover:bg-amber-100">
                  <UserRound size={12} className="shrink-0 text-amber-700" />
                  <span>+ Assigner</span>
                </div>
              ) : (
                <span className="text-[10px] italic text-slate-400">
                  Aucun enseignant
                </span>
              )}
            </div>
          )}
        </button>

        {ouvert && (
          <>
            <button
              type="button"
              aria-label="Fermer le menu"
              className="fixed inset-0 z-10 cursor-default"
              onClick={fermer}
            />
            <div className="border-brand-gray/20 absolute left-0 z-20 mt-1 w-56 rounded-md border bg-white p-2 shadow-lg">
              {vue === "actions" &&
                !confirmationSuppression &&
                (estVerrouilleeEffectuee ? (
                  <p className="text-brand-gray p-1 text-xs">
                    Séance déjà effectuée.
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setVue("assigner")}
                      className="hover:bg-brand-gray/10 text-brand-anthracite flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-bold"
                    >
                      <UserRound size={13} />+ Assigner un enseignant
                    </button>
                    <button
                      type="button"
                      onClick={() => setVue("matiere")}
                      className="hover:bg-brand-gray/10 text-brand-anthracite flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-bold"
                    >
                      <BookOpen size={13} />
                      Modifier la matière
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmationSuppression(true)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} />
                      Supprimer le créneau
                    </button>
                  </div>
                ))}

              {vue === "actions" && confirmationSuppression && (
                <div className="space-y-2 p-1">
                  <p className="text-brand-anthracite text-xs font-bold">
                    Supprimer ce créneau ?
                  </p>
                  {supprimerMutation.isError && (
                    <p className="text-xs font-bold text-red-600">
                      Échec de la suppression. Réessayez.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={confirmerSuppression}
                      disabled={supprimerMutation.isPending}
                      className="flex-1 rounded bg-red-600 px-2 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {supprimerMutation.isPending
                        ? "Suppression..."
                        : "Confirmer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmationSuppression(false)}
                      className="border-brand-gray/30 text-brand-anthracite flex-1 rounded border px-2 py-1 text-xs font-bold"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {vue === "assigner" &&
                (estVerrouilleeEffectuee ? (
                  <p className="text-brand-gray p-1 text-xs">
                    Séance déjà effectuée.
                  </p>
                ) : (
                  <>
                    {peutGererCreneau && (
                      <button
                        type="button"
                        onClick={() => setVue("actions")}
                        className="text-brand-gray hover:text-brand-anthracite mb-1 flex items-center gap-1 text-xs font-bold"
                      >
                        <ChevronLeft size={12} />
                        Retour
                      </button>
                    )}
                    <div className="border-brand-gray/20 mb-2 flex items-center gap-2 rounded-md border px-2 py-1.5">
                      <Search size={12} className="text-brand-gray" />
                      <input
                        autoFocus
                        type="text"
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full text-xs outline-none"
                      />
                    </div>
                    {assignerMutation.isError && (
                      <p className="mb-1 px-1 text-xs font-bold text-red-600">
                        {messageErreurApi(
                          assignerMutation.error,
                          "Échec de l’assignation. Réessayez.",
                        )}
                      </p>
                    )}
                    <div className="max-h-40 overflow-y-auto">
                      {!departementDeLaMatiere && (
                        <p className="text-brand-gray p-2 text-xs">
                          Aucun département rattaché à cette matière.
                        </p>
                      )}
                      {departementDeLaMatiere &&
                        enseignantsEligibles === undefined && (
                          <p className="text-brand-gray p-2 text-xs">
                            Chargement...
                          </p>
                        )}
                      {departementDeLaMatiere &&
                        enseignantsEligibles?.length === 0 && (
                          <p className="text-brand-gray p-2 text-xs">
                            Aucun enseignant dans le roster de ce département.
                          </p>
                        )}
                      {resultatsEnseignants.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => choisirEnseignant(e.id)}
                          disabled={assignerMutation.isPending}
                          className="hover:bg-brand-gray/10 text-brand-anthracite flex w-full flex-col items-start gap-0.5 rounded px-2 py-1 text-left text-xs disabled:opacity-50"
                        >
                          <span>
                            {e.prenom} {e.nom}
                          </span>
                          <span className="text-brand-gray text-[10px] font-bold tracking-wide">
                            {e.matricule}
                          </span>
                          {/* Contact : pas encore de champ sur Enseignant côté
                              backend - espace réservé en placeholder, à
                              remplacer dès que le champ existera. */}
                          <span className="text-brand-gray/70 text-[10px]">
                            Contact : -
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                ))}

              {vue === "matiere" && (
                <>
                  <button
                    type="button"
                    onClick={() => setVue("actions")}
                    className="text-brand-gray hover:text-brand-anthracite mb-1 flex items-center gap-1 text-xs font-bold"
                  >
                    <ChevronLeft size={12} />
                    Retour
                  </button>
                  <div className="border-brand-gray/20 mb-2 flex items-center gap-2 rounded-md border px-2 py-1.5">
                    <Search size={12} className="text-brand-gray" />
                    <input
                      autoFocus
                      type="text"
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      placeholder="Rechercher une matière..."
                      className="w-full text-xs outline-none"
                    />
                  </div>
                  {modifierMatiereMutation.isError && (
                    <p className="mb-1 px-1 text-xs font-bold text-red-600">
                      Échec de la modification. Réessayez.
                    </p>
                  )}
                  <div className="max-h-40 overflow-y-auto">
                    {resultatsMatieres.map((m) => {
                      const couleurM = couleursMatieres.get(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => choisirMatiere(m.id)}
                          disabled={modifierMatiereMutation.isPending}
                          className="hover:bg-brand-gray/10 text-brand-anthracite flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs disabled:opacity-50"
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-sm shrink-0 ${couleurM?.legende ?? "bg-brand-gray"}`}
                            style={{ backgroundColor: couleurM?.hex || m.couleur }}
                          />
                          {m.nom}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {vue === "marquer" && (
                <div className="space-y-2 p-1">
                  {creneau.statut === "EFFECTUEE" ? (
                    <>
                      <p className="text-brand-gray text-xs">
                        Séance déjà marquée comme effectuée.
                      </p>
                      {annulerEffectueeMutation.isError && (
                        <p className="text-xs font-bold text-red-600">
                          Échec. Réessayez.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={confirmerAnnulationEffectuee}
                        disabled={annulerEffectueeMutation.isPending}
                        className="border-brand-gray/30 text-brand-anthracite w-full rounded border px-2 py-1 text-xs font-bold hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {annulerEffectueeMutation.isPending ? "..." : "Annuler"}
                      </button>
                    </>
                  ) : creneau.statut !== "ASSIGNEE" ? (
                    <p className="text-brand-gray text-xs">
                      Cette séance doit d&rsquo;abord avoir un enseignant
                      assigné.
                    </p>
                  ) : seanceEstFuture ? (
                    <p className="text-brand-gray text-xs">
                      Cette séance est prévue le{" "}
                      {dateDeLaSeance?.toLocaleDateString("fr-FR")} - impossible
                      de la marquer effectuée avant qu&rsquo;elle n&rsquo;ait eu
                      lieu.
                    </p>
                  ) : (
                    <>
                      <p className="text-brand-anthracite text-xs font-bold">
                        Marquer cette séance comme effectuée ?
                      </p>
                      {marquerEffectueeMutation.isError && (
                        <p className="text-xs font-bold text-red-600">
                          Échec. Réessayez.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={confirmerEffectuee}
                          disabled={marquerEffectueeMutation.isPending}
                          className="flex-1 rounded bg-green-600 px-2 py-1 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {marquerEffectueeMutation.isPending
                            ? "..."
                            : "Confirmer"}
                        </button>
                        <button
                          type="button"
                          onClick={fermer}
                          className="border-brand-gray/30 text-brand-anthracite flex-1 rounded border px-2 py-1 text-xs font-bold"
                        >
                          Annuler
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Colocalisé : bouton "+" sur une case vide (Directeur Académique uniquement) + menu
// déroulant avec recherche parmi les matières, même pattern visuel que le dropdown
// d'assignation d'enseignant (CelluleCreneau) - mais liste des matières, pas des
// enseignants. Choisir une matière crée le créneau immédiatement (voir
// creerCreneau dans le composant parent).
function CreerCreneauPopover({
  matieres,
  couleursMatieres,
  onChoisir,
}: {
  matieres: Matiere[] | undefined;
  couleursMatieres: Map<string, CouleurMatiere>;
  onChoisir: (matiereId: string) => Promise<void>;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);

  const resultats = useMemo(() => {
    if (!matieres) return [];
    const q = recherche.trim().toLowerCase();
    if (!q) return matieres;
    return matieres.filter((m) => m.nom.toLowerCase().includes(q));
  }, [matieres, recherche]);

  async function choisir(matiereId: string) {
    setEnCours(true);
    setErreur(false);
    try {
      await onChoisir(matiereId);
      setOuvert(false);
      setRecherche("");
    } catch {
      setErreur(true);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className="group hover:border-brand-orange/60 hover:text-brand-orange flex min-h-[46px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200/80 bg-slate-50/40 py-2.5 text-xs font-semibold text-slate-400 transition-all hover:bg-orange-50/40"
        title="Créer un créneau sur cette séance"
      >
        <Plus
          size={14}
          className="group-hover:text-brand-orange text-slate-400 transition-transform group-hover:scale-125"
        />
        <span className="text-[11px] font-medium opacity-80">+</span>
      </button>

      {ouvert && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOuvert(false)}
          />
          <div className="border-brand-gray/20 absolute left-0 z-20 mt-1 w-56 rounded-md border bg-white p-2 shadow-lg">
            <div className="border-brand-gray/20 mb-2 flex items-center gap-2 rounded-md border px-2 py-1.5">
              <Search size={12} className="text-brand-gray" />
              <input
                autoFocus
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une matière..."
                className="w-full text-xs outline-none"
              />
            </div>
            {erreur && (
              <p className="mb-1 px-1 text-xs font-bold text-red-600">
                Échec de la création. Réessayez.
              </p>
            )}
            <div className="max-h-40 overflow-y-auto">
              {matieres === undefined && (
                <p className="text-brand-gray p-2 text-xs">Chargement...</p>
              )}
              {matieres?.length === 0 && (
                <p className="text-brand-gray p-2 text-xs">
                  Aucune matière au programme de cette formation.
                </p>
              )}
              {resultats.map((m) => {
                const couleur = couleursMatieres.get(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => choisir(m.id)}
                    disabled={enCours}
                    className="hover:bg-brand-gray/10 text-brand-anthracite flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs disabled:opacity-50"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-sm shrink-0 ${couleur?.legende ?? "bg-brand-gray"}`}
                      style={{ backgroundColor: couleur?.hex || m.couleur }}
                    />
                    {m.nom}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
