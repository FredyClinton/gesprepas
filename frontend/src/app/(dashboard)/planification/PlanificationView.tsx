"use client";

import { useFormations, Formation } from "@/modules/academique";
import {
  useAffectations,
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
  Centre,
} from "@/modules/centres-sessions";
import {
  useDepartement,
  useDepartements,
  Departement,
} from "@/modules/departement";
import {
  useMatieres,
  construireCouleursMatieres,
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
import { Card } from "@/shared/ui";
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
} from "lucide-react";
import { useState, useMemo } from "react";

type Props = {
  role: Role;
  departementId: string | null;
  // Centre du Chef de Centre connecté — sert uniquement à restreindre l'action
  // "Marquer comme effectuée" à son propre centre ; n'affecte pas ce qui est affiché
  // (les autres centres restent visibles, juste désactivés).
  centreId?: string | null;
  readOnly?: boolean;
};
const MAX_SEANCES_PAR_JOUR = 3;
// Traits renforcés (par rapport au quadrillage fin border-brand-gray/20 déjà sur
// chaque cellule) pour faire ressortir les frontières entre centres (verticale,
// avant la 1ère salle de chaque centre sauf le tout premier) et entre jours
// (horizontale, au-dessus de la 1ère ligne de chaque jour).
const BORDURE_CENTRE = "border-l-2 border-l-brand-anthracite/40";
const BORDURE_JOUR = "border-t-2 border-t-brand-anthracite/40";

// Écran partagé (voir page.tsx) : périmètre et droits varient selon le rôle, la
// structure de grille reste la même. Création de créneau et assignation d'enseignant
// sont des actions IMMÉDIATES (comme la modification de matière et la suppression) —
// plus de mise en attente locale ni de bouton "Enregistrer" global (décision du
// 30/08/2026, suite au retrait de ce bouton).
export function PlanificationView({
  role,
  departementId,
  centreId: centreIdChefCentre,
  readOnly = false,
}: Props) {
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;

  const { data: departement } = useDepartement(departementId ?? undefined);
  const { data: departements } = useDepartements();
  const { data: centres } = useCentres();
  const { data: formations } = useFormations();
  const { data: salles } = useSalles(sessionId);
  const { data: matieres } = useMatieres();
  const { data: enseignants } = useEnseignants();

  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;
  // Contrairement au tableau de bord Chef de Département (limité à 1..semaine
  // courante), ici on doit pouvoir naviguer sur TOUTE la session, y compris les
  // semaines futures : construire/consulter le planning à l'avance est le but même
  // de cet écran pour le Directeur Académique.
  const semaineTotale = sessionActive
    ? semaineTotaleSession(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;

  const [semaineChoisie, setSemaineChoisie] = useState<number | null>(null);
  const semaine = semaineChoisie ?? semaineCourante;

  const estChefDepartement = role === "CHEF_DEPARTEMENT";
  const matiereIdFiltre = estChefDepartement
    ? departement?.matiereId
    : undefined;

  const { data: affectations } = useAffectations({
    // Pour un Chef de Département, on ne déclenche la requête qu'une fois son
    // département chargé (sinon useAffectations, qui n'exige plus matiereId,
    // afficherait un instant les créneaux de TOUS les départements).
    sessionId: estChefDepartement
      ? departement
        ? sessionId
        : undefined
      : sessionId,
    semaine,
    matiereId: matiereIdFiltre,
  });

  const peutAssigner =
    !readOnly &&
    (role === "DIRECTEUR_ACADEMIQUE" || role === "CHEF_DEPARTEMENT");
  // Seul le Directeur Académique construit le planning (crée des créneaux) — le
  // Chef de Département n'assigne que sur l'existant (confirmé le 29/08/2026).
  const peutCreerCreneaux = !readOnly && role === "DIRECTEUR_ACADEMIQUE";
  // Chef de Centre : seule action possible, marquer une séance déjà assignée comme
  // effectuée, et seulement sur son propre centre (les autres restent affichés mais
  // désactivés — voir marquage `estCentrePropre` par colonne plus bas).
  const estChefCentre = role === "CHEF_CENTRE";
  const peutMarquerEffectueeGlobalement = !readOnly && estChefCentre;

  const [recherche, setRecherche] = useState("");
  const creer = useCreerCreneau();

  // Colonnes : Centre -> Formation -> Salle. Chef de Département : seulement les
  // salles réellement utilisées par sa matière cette semaine (sinon la grille
  // afficherait l'inventaire complet, hors sujet). Directeur Académique :
  // l'inventaire complet des salles de la session, y compris les vides — il doit
  // voir les emplacements disponibles pour construire le planning.
  const sallesAffichees = useMemo(() => {
    if (!salles) return undefined;
    if (!estChefDepartement) return salles;
    const idsUtilises = new Set((affectations ?? []).map((a) => a.salleId));
    return salles.filter((s) => idsUtilises.has(s.id));
  }, [salles, affectations, estChefDepartement]);

  type GroupeFormation = { formation: Formation; salles: Salle[] };
  type GroupeCentre = { centre: Centre; formations: GroupeFormation[] };

  const colonnes = useMemo<GroupeCentre[]>(() => {
    if (!sallesAffichees || !centres || !formations) return [];
    const parCentre = new Map<string, GroupeCentre>();
    for (const salle of sallesAffichees) {
      const centre = centres.find((c) => c.id === salle.centreId);
      const formation = formations.find((f) => f.id === salle.formationId);
      if (!centre || !formation) continue;
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
    return [...parCentre.values()];
  }, [sallesAffichees, centres, formations]);

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

  function creneauxPour(
    salleId: string,
    jour: Jour,
  ): (Affectation | undefined)[] {
    // Un créneau supprimé (DELETE) n'apparaît plus du tout dans la réponse de
    // l'API — plus besoin de filtrer un statut ANNULEE ici.
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
  // correspondant à la recherche — null si la recherche ne correspond à aucun
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
    !sessionActive || !centres || !formations || !salles || !matieres;

  return (
    // h-full + flex-col : la page remplit exactement la hauteur dispo sous le
    // TopBar (voir (dashboard)/layout.tsx) — seule la grille (flex-1 plus bas)
    // scrolle en interne (horizontal ET vertical), l'en-tête reste fixe pour que
    // le planning complet soit consultable sans scroller la page.
    <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-8">
      {/* En-tête */}
      <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-brand-anthracite text-4xl font-bold uppercase">
            Planning de la semaine
            {estChefDepartement && departement
              ? ` du département :  ${departement.nom}`
              : ""}
          </h1>
          <p className="text-brand-gray mt-1.5 text-base">
            {role === "DIRECTEUR_ACADEMIQUE"
              ? ""
              : peutAssigner
                ? "Assignez des enseignants sur les créneaux de votre département."
                : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <div className="border-brand-gray/20 flex items-center gap-2 rounded-md border bg-white px-3 py-2">
              <Search size={14} className="text-brand-gray" />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un enseignant, une salle..."
                className="w-56 text-sm outline-none"
              />
            </div>
            {seancesEnseignantRecherche !== null && (
              <p className="text-brand-orange text-xs font-bold">
                {seancesEnseignantRecherche} séance
                {seancesEnseignantRecherche > 1 ? "s" : ""} assignée
                {seancesEnseignantRecherche > 1 ? "s" : ""} cette semaine
              </p>
            )}
          </div>

          <div className="border-brand-gray/20 flex items-center gap-1 rounded-md border bg-white px-1 py-1">
            <button
              type="button"
              onClick={() => setSemaineChoisie(Math.max(1, semaine - 1))}
              disabled={semaine <= 1}
              className="text-brand-anthracite rounded p-1.5 disabled:opacity-30"
              aria-label="Semaine précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-brand-anthracite px-2 text-sm font-bold">
              Semaine {semaine}
              {semaine === semaineCourante ? " (en cours)" : ""}
            </span>
            <button
              type="button"
              onClick={() =>
                setSemaineChoisie(Math.min(semaineTotale, semaine + 1))
              }
              disabled={semaine >= semaineTotale}
              className="text-brand-anthracite rounded p-1.5 disabled:opacity-30"
              aria-label="Semaine suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 xl:flex-row">
        {/* Grille */}
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-auto">
            {chargement ? (
              <p className="text-brand-gray p-8 text-center text-sm">
                Chargement...
              </p>
            ) : colonnes.length === 0 ? (
              <p className="text-brand-gray p-8 text-center text-sm">
                {estChefDepartement
                  ? "Aucun créneau planifié pour votre département cette semaine."
                  : "Aucune salle disponible pour cette session."}
              </p>
            ) : (
              <table className="w-full border-collapse text-left text-sm">
                {/* sticky top-0 : les en-têtes (centre/formation/salle) restent
                    visibles pendant le scroll vertical de la grille. */}
                <thead className="sticky top-0 z-20 bg-white">
                  <tr>
                    <th
                      rowSpan={3}
                      className="bg-brand-gray/10 text-brand-anthracite border-brand-gray/20 sticky left-0 z-20 min-w-[90px] border p-2 text-center text-xs font-bold tracking-wide uppercase"
                    >
                      Jours
                    </th>
                    {colonnes.map((groupe, index) => (
                      <th
                        key={groupe.centre.id}
                        colSpan={groupe.formations.reduce(
                          (t, f) => t + f.salles.length,
                          0,
                        )}
                        // Alternance gris/noir (brand-gray / brand-anthracite). Les
                        // couleurs restent identiques pour tous les centres, y compris
                        // pour le Chef de Centre — seule l'interaction change (voir
                        // centreDesactive plus bas), pas l'apparence.
                        className={`border-brand-gray/20 border p-2 text-center text-xs font-bold tracking-wide text-white uppercase ${
                          index % 2 === 0
                            ? "bg-brand-anthracite"
                            : "bg-brand-gray"
                        }`}
                      >
                        {groupe.centre.nom}
                        {groupe.centre.statut === "FERME" && (
                          <span className="bg-brand-white/20 ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] normal-case">
                            Fermé
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {colonnes.map((groupe, groupeIndex) =>
                      groupe.formations.map((gf, formationIndex) => (
                        <th
                          key={gf.formation.id}
                          colSpan={gf.salles.length}
                          className={`bg-brand-orange border-brand-gray/20 border p-2 text-center text-xs font-bold text-white uppercase ${
                            groupeIndex > 0 && formationIndex === 0
                              ? BORDURE_CENTRE
                              : ""
                          }`}
                        >
                          {gf.formation.nom}
                        </th>
                      )),
                    )}
                  </tr>
                  <tr>
                    {colonnes.map((groupe, groupeIndex) =>
                      groupe.formations.map((gf, formationIndex) =>
                        gf.salles.map((salle, salleIndex) => (
                          <th
                            key={salle.id}
                            className={`text-brand-gray border-brand-gray/20 min-w-[110px] border bg-white p-2 text-center text-xs font-bold ${
                              groupeIndex > 0 &&
                              formationIndex === 0 &&
                              salleIndex === 0
                                ? BORDURE_CENTRE
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
                    // Bande alternée par jour (pas par <tr> — un jour peut couvrir
                    // plusieurs lignes/séances via le rowSpan de la cellule
                    // "Jours" ci-dessous, la bande doit couvrir tout ce bloc).
                    const teinteJour =
                      jourIndex % 2 === 1 ? "bg-brand-gray/[0.04]" : "";
                    // Hauteur dynamique : le plus grand nombre de séances
                    // (réelles + en attente) trouvées ce jour-là, toutes
                    // salles confondues, +1 pour garantir à chaque salle une
                    // ligne où afficher "+" (Directeur Académique uniquement).
                    // Hauteur FIXE par jour (jamais dépendante du remplissage
                    // des autres salles) : au plus MAX_SEANCES_PAR_JOUR quand le
                    // Directeur Académique peut créer (garantit un "+ Créneau"
                    // toujours cliquable sur chaque salle, indépendamment des
                    // voisines — corrige le bug du 30/08/2026), sinon juste assez
                    // pour montrer les créneaux réels existants (au cas où une
                    // salle en aurait plus que le plafond, données antérieures
                    // à la règle des 3 max).
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
                      <tr key={`${jour}-${ligne}`} className={teinteJour}>
                        {ligne === 0 && (
                          <td
                            rowSpan={hauteur}
                            className={`bg-brand-gray/5 text-brand-anthracite border-brand-gray/20 border p-2 text-center align-middle text-xs font-bold ${BORDURE_JOUR}`}
                          >
                            {LABELS_JOUR[jour]}
                          </td>
                        )}
                        {colonnes.map((groupe, groupeIndex) =>
                          groupe.formations.map((gf, formationIndex) =>
                            gf.salles.map((salle, salleIndex) => {
                              const contenu = creneauxPour(salle.id, jour);
                              const creneau = contenu[ligne];
                              // Indépendant des salles voisines : une
                              // case vide affiche "+ Créneau" tant que
                              // cette salle précise n'a pas atteint le
                              // plafond, peu importe la hauteur globale
                              // du jour (imposée par une autre salle).
                              const emplacementLibre =
                                !creneau &&
                                ligne < MAX_SEANCES_PAR_JOUR &&
                                peutCreerCreneaux &&
                                groupe.centre.statut !== "FERME";
                              const bordureCentre =
                                groupeIndex > 0 &&
                                formationIndex === 0 &&
                                salleIndex === 0
                                  ? BORDURE_CENTRE
                                  : "";
                              const bordureJour =
                                ligne === 0 ? BORDURE_JOUR : "";
                              // Chef de Centre : les couleurs des autres centres
                              // restent identiques (visibles normalement) — seule
                              // l'action "Marquer effectuée" est réservée à son
                              // propre centre (voir peutMarquerEffectuee ci-dessous,
                              // qui contrôle si la cellule répond au clic).
                              const centreDesactive =
                                estChefCentre &&
                                groupe.centre.id !== centreIdChefCentre;
                              return (
                                <td
                                  key={`${salle.id}-${jour}-${ligne}`}
                                  className={`border-brand-gray/20 border p-1.5 align-middle ${bordureCentre} ${bordureJour}`}
                                >
                                  {creneau && (
                                    <CelluleCreneau
                                      creneau={creneau}
                                      couleur={couleursMatieres.get(
                                        creneau.matiereId,
                                      )}
                                      attenue={!correspondALaRecherche(creneau)}
                                      enseignants={enseignants}
                                      departements={departements}
                                      matieres={matieres}
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
                                      matieres={matieres}
                                      couleursMatieres={couleursMatieres}
                                      onChoisir={(matiereId) =>
                                        creerCreneau(
                                          salle,
                                          jour,
                                          // ligne est 0-indexé, seance commence à 1 —
                                          // exactement la position cliquée, pas "la
                                          // prochaine libre" (corrige le bug du 30/08/2026).
                                          ligne + 1,
                                          matiereId,
                                        )
                                      }
                                    />
                                  )}
                                </td>
                              );
                            }),
                          ),
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            )}
          </div>
          {!chargement && colonnes.length > 0 && (
            <p className="text-brand-gray/70 border-brand-gray/10 border-t p-2 text-xs">
              {totalColonnes} salle(s) affichée(s) · défilement horizontal si la
              grille dépasse l&rsquo;écran.
            </p>
          )}
        </Card>

        {/* Légende — pastilles reprenant exactement les classes bg/texte utilisées
            dans les cases de la grille (voir CelluleCreneau), plutôt qu'un simple
            petit carré de couleur peu contrasté. */}
        <Card className="border-brand-orange/20 bg-brand-orange/5 w-full overflow-y-auto p-4 xl:w-56">
          <div className="mb-3 flex items-center gap-2">
            <Palette size={16} className="text-brand-orange" />
            <h2 className="text-brand-anthracite text-sm font-bold tracking-wide uppercase">
              Légende des matières
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
                return (
                  <span
                    key={matiere.id}
                    className={`rounded-full px-3 py-1.5 text-center text-sm font-bold shadow-sm ${
                      couleur
                        ? `${couleur.bg} ${couleur.texte}`
                        : "bg-brand-gray/10 text-brand-gray"
                    }`}
                  >
                    {matiere.nom}
                  </span>
                );
              })}
            </div>
          )}
        </Card>
      </div>
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
  const peutOuvrir = peutAssigner || peutGererCreneau || peutMarquerEffectuee;
  // Une fois la séance EFFECTUEE, plus aucune modification (assigner, changer la
  // matière, supprimer) — seule la rétro-action du Chef de Centre (vue "marquer",
  // gérée séparément) reste possible.
  const estVerrouilleeEffectuee = creneau.statut === "EFFECTUEE";
  // On ne peut pas confirmer une séance qui n'a pas encore eu lieu (ex : on est
  // lundi, la séance est prévue mardi) — le Chef de Centre ne peut marquer
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

  return (
    <div className={attenue ? "opacity-30" : ""}>
      <div className="relative">
        <button
          type="button"
          onClick={() => peutOuvrir && (ouvert ? fermer() : ouvrir())}
          disabled={!peutOuvrir}
          className={`w-full rounded px-2 py-1 text-left text-xs font-bold transition-colors ${
            couleur
              ? `${couleur.bg} ${couleur.texte}`
              : "bg-brand-gray/10 text-brand-gray"
          } ${
            peutOuvrir ? "cursor-pointer hover:opacity-80" : "cursor-default"
          }`}
        >
          {enseignant ? (
            <span className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1">
                <span>
                  {enseignant.prenom} {enseignant.nom}
                </span>
                {creneau.statut === "EFFECTUEE" && (
                  <CheckCircle2 size={12} className="shrink-0" />
                )}
              </span>
              <span className="text-[10px] font-bold tracking-wide opacity-90">
                {enseignant.matricule}
              </span>
              {/* Contact : pas encore de champ sur Enseignant côté backend — espace
                  réservé en placeholder, à remplacer dès que le champ existera. */}
              <span className="text-[10px] font-normal opacity-70">
                Contact : —
              </span>
            </span>
          ) : peutAssigner || peutGererCreneau ? (
            "+ Assigner"
          ) : (
            "—"
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
                      <UserRound size={13} />
                      Assigner un enseignant
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
                        Échec de l&rsquo;assignation (enseignant peut-être déjà
                        occupé sur ce créneau). Réessayez.
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
                              backend — espace réservé en placeholder, à
                              remplacer dès que le champ existera. */}
                          <span className="text-brand-gray/70 text-[10px]">
                            Contact : —
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
                            className={`h-2.5 w-2.5 rounded-sm ${couleurM?.legende ?? "bg-brand-gray"}`}
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
                      {dateDeLaSeance?.toLocaleDateString("fr-FR")} — impossible
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
// d'assignation d'enseignant (CelluleCreneau) — mais liste des matières, pas des
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
        className="border-brand-gray/30 text-brand-gray hover:border-brand-orange hover:text-brand-orange flex w-full items-center justify-center gap-1 rounded border border-dashed py-1 text-xs font-bold transition-colors"
      >
        <Plus size={12} />
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
                  Aucune matière disponible.
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
                      className={`h-2.5 w-2.5 rounded-sm ${couleur?.legende ?? "bg-brand-gray"}`}
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
