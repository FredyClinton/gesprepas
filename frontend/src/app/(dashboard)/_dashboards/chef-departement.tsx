"use client";

import { useMemo, useState } from "react";
import { UserRound, ClipboardList, AlertTriangle, Search } from "lucide-react";

import { Card } from "@/shared/ui";
import { useDepartement } from "@/modules/departement";
import { useRosterDepartement } from "@/modules/affectation-departementale";
import {
  useAffectations,
  useAssignerEnseignant,
  type Affectation,
} from "@/modules/affectation";
import { useEnseignants, type Enseignant } from "@/modules/personnel";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useSalles } from "@/modules/salle";
import { semaineCouranteDepuis } from "@/shared/lib/semaine";

const PLACEHOLDER = "—";
// `Affectation.semaine` est un entier positif simple côté backend (numéro de
// semaine relatif au début de la session), pas une semaine calendaire ISO — aucun
// endpoint ne fait la correspondance date <-> semaine. On calcule donc la "semaine
// courante" nous-mêmes, à partir de dateDebut/dateFin de la session active, plafonnée
// à la durée réelle de la session — sinon une session restée EN_COURS après sa
// dateFin (ex: données de seed non rafraîchies) ferait grimper le numéro de semaine
// indéfiniment au fil du temps système, sans rapport avec la session elle-même.

export function ChefDepartementDashboard({
  departementId,
}: {
  departementId: string;
}) {
  const { data: departement } = useDepartement(departementId);
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;

  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;

  // null = "pas encore choisi manuellement" -> on suit la semaine courante tant
  // que l'utilisateur n'a rien sélectionné lui-même dans le menu.
  const [semaineChoisie, setSemaineChoisie] = useState<number | null>(null);
  const semaine = semaineChoisie ?? semaineCourante;

  const { data: roster } = useRosterDepartement(departementId, sessionId);
  const { data: enseignants } = useEnseignants();
  const { data: centres } = useCentres();
  const { data: salles } = useSalles(sessionId);

  const { data: affectations, isLoading: chargementAffectations } =
    useAffectations({
      // sessionId volontairement forcé à undefined tant que le département n'est
      // pas chargé : useAffectations ne requiert plus matiereId pour se déclencher
      // (Directeur Académique doit pouvoir lister sans filtre de matière), donc ce
      // garde-fou local reste nécessaire ici pour ne pas afficher des créneaux
      // d'un autre département le temps du premier chargement.
      sessionId: departement ? sessionId : undefined,
      semaine,
      matiereId: departement?.matiereId,
    });

  const enseignantsDuDepartement = useMemo(() => {
    if (!roster || !enseignants) return undefined;
    const ids = new Set(roster.map((r) => r.enseignantId));
    return enseignants.filter((e) => ids.has(e.id));
  }, [roster, enseignants]);

  const creneauxEnAttente = affectations?.filter(
    (a) => a.statut === "PLANIFIEE",
  );

  const chargementInitial = !departement || !sessionActive;

  const nomCentre = (centreId: string) =>
    centres?.find((c) => c.id === centreId)?.nom ?? PLACEHOLDER;
  const nomSalle = (salleId: string) =>
    salles?.find((s) => s.id === salleId)?.nom ?? PLACEHOLDER;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-brand-anthracite text-4xl font-bold uppercase">
            {departement ? `Département : ${departement.nom}` : "Mon Département"}
          </h1>
          <p className="text-brand-gray mt-1.5 text-base">
            Aperçu et gestion des activités pédagogiques.
          </p>
        </div>

        {/* Sélecteur de semaine — fonctionnel : semaines 1 à la semaine courante,
            calculée depuis la date de début de la session active. */}
        <label className="flex items-center gap-2">
          <span className="sr-only">Semaine</span>
          <select
            value={semaine}
            onChange={(e) => setSemaineChoisie(Number(e.target.value))}
            className="border-brand-gray/20 text-brand-anthracite rounded-md border bg-white px-3 py-2 text-sm font-bold"
          >
            {Array.from({ length: semaineCourante }, (_, i) => i + 1).map(
              (n) => (
                <option key={n} value={n}>
                  Semaine {n}
                  {n === semaineCourante ? " (en cours)" : ""}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <KpiCard
          label="Nombre d'enseignants"
          value={
            chargementInitial
              ? "…"
              : (enseignantsDuDepartement?.length ?? PLACEHOLDER)
          }
          icon={UserRound}
          note="Roster du département pour la session en cours"
        />
        <KpiCard
          label="Nombre de cours"
          value={
            chargementInitial || chargementAffectations
              ? "…"
              : (affectations?.length ?? PLACEHOLDER)
          }
          icon={ClipboardList}
          note={`Semaine ${semaine}`}
        />
        <KpiCard
          label="En attente d'assignation"
          value={
            chargementInitial || chargementAffectations
              ? "…"
              : (creneauxEnAttente?.length ?? PLACEHOLDER)
          }
          icon={AlertTriangle}
          tone={
            creneauxEnAttente && creneauxEnAttente.length > 0
              ? "danger"
              : "default"
          }
        />
      </div>

      {/* Créneaux en attente d'assignation */}
      <Card className="overflow-hidden">
        <div className="border-brand-gray/20 border-b p-5">
          <h2 className="text-brand-anthracite text-lg font-bold">
            Créneaux en attente d&rsquo;assignation
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-anthracite text-brand-white">
              <tr>
                {["Matière", "Centre", "Salle", "Séance", "Action"].map(
                  (titre) => (
                    <th
                      key={titre}
                      className="p-4 text-xs font-bold tracking-wide uppercase"
                    >
                      {titre}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-brand-gray/10 divide-y">
              {(chargementInitial || chargementAffectations) && (
                <tr>
                  <td colSpan={5} className="text-brand-gray p-5 text-center">
                    Chargement...
                  </td>
                </tr>
              )}
              {!chargementInitial &&
                !chargementAffectations &&
                (!creneauxEnAttente || creneauxEnAttente.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-brand-gray p-5 text-center">
                      Aucun créneau en attente d&rsquo;assignation pour la
                      semaine {semaine}.
                    </td>
                  </tr>
                )}
              {creneauxEnAttente?.map((creneau) => (
                <tr key={creneau.id}>
                  {/* Un département n'a aujourd'hui qu'une seule matière (voir
                            modules/departement/domain/types.ts) : tous les créneaux de ce
                            tableau la partagent déjà, donc departement.nom sert de libellé
                            de colonne plutôt qu'une résolution Matiere dédiée. */}
                  <td className="text-brand-anthracite p-4 font-bold">
                    {departement?.nom ?? PLACEHOLDER}
                  </td>
                  <td className="text-brand-gray p-4 text-sm">
                    {nomCentre(creneau.centreId)}
                  </td>
                  <td className="text-brand-gray p-4 text-sm">
                    {nomSalle(creneau.salleId)}
                  </td>
                  <td className="text-brand-gray p-4 text-sm">
                    Séance {creneau.seance} — Semaine {creneau.semaine}
                  </td>
                  <td className="p-4">
                    <AssignerCreneauDropdown
                      creneau={creneau}
                      enseignants={enseignantsDuDepartement}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Progression pédagogique — même limite que sur l'écran Directeur Académique :
          pas de total de séances prévues par matière, donc pas de pourcentage honnête. */}
      <Card className="p-6">
        <h2 className="text-brand-anthracite mb-4 text-lg font-bold">
          Progression Pédagogique par Formation
        </h2>
        <div className="border-brand-gray/20 bg-brand-gray/5 rounded-md border border-dashed p-6 text-center">
          <p className="text-brand-gray text-sm">
            Pas encore calculable : le suivi de progression enregistre les
            séances données (thème, contenu, exercices) mais pas de total de
            séances prévues par matière — impossible d&rsquo;en tirer un
            pourcentage honnête pour l&rsquo;instant.
          </p>
        </div>
      </Card>
    </div>
  );
}

type KpiCardProps = {
  label: string;
  value: string | number;
  icon: typeof UserRound;
  tone?: "default" | "danger";
  note?: string;
};

// Colocalisé, même charte que le KpiCard de DirecteurDashboard.
function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  note,
}: KpiCardProps) {
  return (
    <Card className="flex flex-col gap-2.5 p-5">
      <div className="flex items-start justify-between">
        <span className="text-brand-gray text-xs font-bold tracking-wide uppercase">
          {label}
        </span>
        <div
          className={`rounded-lg p-2 ${tone === "danger"
            ? "bg-red-50 text-red-600"
            : "bg-brand-orange/10 text-brand-orange"
            }`}
        >
          <Icon size={18} />
        </div>
      </div>
      <div
        className={`text-3xl font-bold ${tone === "danger" ? "text-red-600" : "text-brand-anthracite"
          }`}
      >
        {value}
      </div>
      {note && <p className="text-brand-gray/70 text-xs">{note}</p>}
    </Card>
  );
}

// Colocalisé : bouton "Assigner" + menu déroulant avec recherche parmi les
// enseignants du roster du département. Fermeture au clic extérieur via un
// backdrop plein écran (pas de listener document — plus simple, pas d'effet à
// nettoyer).
function AssignerCreneauDropdown({
  creneau,
  enseignants,
}: {
  creneau: Affectation;
  enseignants: Enseignant[] | undefined;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const assigner = useAssignerEnseignant();

  const resultats = useMemo(() => {
    if (!enseignants) return [];
    const q = recherche.trim().toLowerCase();
    if (!q) return enseignants;
    return enseignants.filter((e) =>
      `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase().includes(q),
    );
  }, [enseignants, recherche]);

  function choisir(enseignantId: string) {
    assigner.mutate(
      { id: creneau.id, enseignantId },
      { onSuccess: () => setOuvert(false) },
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        className="bg-brand-orange text-brand-white hover:bg-brand-orange/90 rounded-md px-3 py-1.5 text-xs font-bold transition-colors"
      >
        Assigner
      </button>

      {ouvert && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOuvert(false)}
          />
          <div className="border-brand-gray/20 absolute right-0 z-20 mt-2 w-64 rounded-md border bg-white p-2 shadow-lg">
            <div className="border-brand-gray/20 mb-2 flex items-center gap-2 rounded-md border px-2 py-1.5">
              <Search size={14} className="text-brand-gray" />
              <input
                autoFocus
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un enseignant..."
                className="w-full text-sm outline-none"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {enseignants === undefined && (
                <p className="text-brand-gray p-2 text-xs">Chargement...</p>
              )}
              {enseignants?.length === 0 && (
                <p className="text-brand-gray p-2 text-xs">
                  Aucun enseignant dans le roster du département.
                </p>
              )}
              {enseignants &&
                enseignants.length > 0 &&
                resultats.length === 0 && (
                  <p className="text-brand-gray p-2 text-xs">Aucun résultat.</p>
                )}
              {resultats.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => choisir(e.id)}
                  disabled={assigner.isPending}
                  className="hover:bg-brand-gray/10 text-brand-anthracite flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm disabled:opacity-50"
                >
                  <span>
                    {e.prenom} {e.nom}
                  </span>
                  <span className="text-brand-gray text-xs">{e.matricule}</span>
                </button>
              ))}
            </div>
            {assigner.isError && (
              <p className="mt-1 px-2 text-xs font-bold text-red-600">
                Échec de l&rsquo;assignation — l&rsquo;enseignant est peut-être
                déjà occupé sur ce créneau.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
