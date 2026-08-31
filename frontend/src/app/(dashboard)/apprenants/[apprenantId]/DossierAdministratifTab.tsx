import { CheckCircle2, Circle, Plus } from "lucide-react";

import { Button, Card } from "@/shared/ui";
import {
  useConcours,
  useConcoursDuDossier,
  usePiecesDossierConcours,
  usePiecesRequises,
  useSoldeDossierConcours,
  type Dossier,
  type DossierConcours,
  type PieceRequise,
} from "@/modules/dossiers";
import type { Centre, SessionAcademique } from "@/modules/centres-sessions";

import { BadgeDemo } from "./BadgeDemo";
import { MOCK_DOSSIER, type ConcoursRattacheMock } from "./mocks";

const FCFA = new Intl.NumberFormat("fr-FR");

const LABELS_STATUT_DOSSIER: Record<Dossier["statut"], string> = {
  OUVERT: "Ouvert",
  COMPLET: "Complet",
  CLOTURE: "Clôturé",
};

const CLASSES_STATUT_DOSSIER: Record<Dossier["statut"], string> = {
  OUVERT: "bg-brand-orange/10 text-brand-orange",
  COMPLET: "bg-green-100 text-green-800",
  CLOTURE: "bg-brand-gray/10 text-brand-gray",
};

const RattacherConcoursBouton = () => (
  // L'ajout d'un concours à un dossier existe côté backend
  // (POST /api/dossiers/{id}/concours) mais son flux de saisie (sélection
  // concours + pièces) n'est pas encore construit ici.
  <Button type="button" disabled title="Bientôt disponible">
    <span className="flex items-center gap-1.5">
      <Plus size={14} />
      Rattacher un concours
    </span>
  </Button>
);

export function DossierAdministratifTab({
  dossier,
  centres,
  sessions,
}: {
  dossier: Dossier | undefined;
  centres: Centre[] | undefined;
  sessions: SessionAcademique[] | undefined;
}) {
  const { data: concoursDuDossier, isLoading: chargementConcours } =
    useConcoursDuDossier(dossier?.id);
  const { data: piecesRequises } = usePiecesRequises();

  // MOCK — pas encore de dossier réel pour cet apprenant (base de dev vide, ou
  // apprenant qui n'a simplement pas encore de dossier ouvert). On affiche l'état
  // final attendu de l'onglet avec des données fictives plutôt qu'un onglet vide,
  // voir MOCK_DOSSIER dans mocks.ts.
  if (!dossier) {
    return (
      <div className="space-y-6">
        <div className="bg-brand-orange/5 border-brand-orange/20 rounded-md border p-3 text-sm">
          <span className="text-brand-orange font-bold">
            Aperçu de démonstration
          </span>
          <span className="text-brand-gray">
            {" "}
            — cet apprenant n&rsquo;a pas encore de dossier réel. Les données
            ci-dessous sont fictives, à titre d&rsquo;illustration.
          </span>
        </div>

        <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-brand-anthracite text-lg font-bold">
                Dossier d&rsquo;inscription
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${CLASSES_STATUT_DOSSIER[MOCK_DOSSIER.statut]}`}
              >
                {LABELS_STATUT_DOSSIER[MOCK_DOSSIER.statut]}
              </span>
              <BadgeDemo />
            </div>
            <p className="text-brand-gray mt-1 text-sm">
              Ouvert le{" "}
              {new Date(MOCK_DOSSIER.dateOuverture).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-brand-anthracite text-lg font-bold">
              Concours rattachés
            </h2>
            <RattacherConcoursBouton />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {MOCK_DOSSIER.concours.map((c) => (
              <ConcoursRattacheCardMock key={c.nom} concours={c} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-brand-anthracite text-lg font-bold">
              Dossier d&rsquo;inscription
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${CLASSES_STATUT_DOSSIER[dossier.statut]}`}
            >
              {LABELS_STATUT_DOSSIER[dossier.statut]}
            </span>
          </div>
          <p className="text-brand-gray mt-1 text-sm">
            Ouvert le{" "}
            {new Date(dossier.dateOuverture).toLocaleDateString("fr-FR")}
            {dossier.dateCloture &&
              ` · Clôturé le ${new Date(dossier.dateCloture).toLocaleDateString("fr-FR")}`}
          </p>
          {dossier.observation && (
            <p className="text-brand-gray mt-2 text-sm italic">
              &laquo; {dossier.observation} &raquo;
            </p>
          )}
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-brand-anthracite text-lg font-bold">
            Concours rattachés
          </h2>
          <RattacherConcoursBouton />
        </div>
        {chargementConcours && (
          <p className="text-brand-gray text-sm">Chargement...</p>
        )}
        {!chargementConcours && (concoursDuDossier ?? []).length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-brand-gray text-sm">
              Aucun concours rattaché à ce dossier pour l&rsquo;instant.
            </p>
          </Card>
        )}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {concoursDuDossier?.map((dc) => (
            <ConcoursRattacheCard
              key={dc.id}
              dossierConcours={dc}
              piecesRequises={piecesRequises}
              centres={centres}
              sessions={sessions}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConcoursCardVisual({
  nom,
  sousTitre,
  pourcentage,
  montantPaye,
  soldeRestant,
  pieces,
  chargementPieces = false,
}: {
  nom: string;
  sousTitre: string;
  pourcentage: number;
  montantPaye: number | undefined;
  soldeRestant: number | undefined;
  pieces: { id: string; nom: string; quantite: number; validee: boolean }[];
  chargementPieces?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-brand-anthracite text-base font-bold">{nom}</p>
          <p className="text-brand-gray text-xs">{sousTitre}</p>
        </div>
        <span className="bg-brand-anthracite/10 text-brand-anthracite rounded-full px-2.5 py-1 text-xs font-bold">
          {pourcentage}%
        </span>
      </div>

      <div className="bg-brand-gray/10 mt-3 h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-brand-anthracite h-full rounded-full transition-[width]"
          style={{ width: `${pourcentage}%` }}
        />
      </div>

      {montantPaye !== undefined && soldeRestant !== undefined && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-brand-gray text-xs">Payé</p>
            <p className="text-brand-anthracite font-bold">
              {FCFA.format(montantPaye)} FCFA
            </p>
          </div>
          <div>
            <p className="text-brand-gray text-xs">Solde restant</p>
            <p
              className={`font-bold ${soldeRestant > 0 ? "text-brand-orange" : "text-green-800"}`}
            >
              {FCFA.format(soldeRestant)} FCFA
            </p>
          </div>
        </div>
      )}

      <ul className="border-brand-gray/10 mt-4 space-y-2 border-t pt-4">
        {chargementPieces && (
          <li className="text-brand-gray text-sm">Chargement des pièces...</li>
        )}
        {!chargementPieces && pieces.length === 0 && (
          <li className="text-brand-gray text-sm">Aucune pièce exigée.</li>
        )}
        {pieces.map((p) => (
          <li key={p.id} className="flex items-center gap-2 text-sm">
            {p.validee ? (
              <CheckCircle2 size={16} className="text-green-800" />
            ) : (
              <Circle size={16} className="text-brand-gray/50" />
            )}
            <span
              className={
                p.validee ? "text-brand-anthracite" : "text-brand-gray"
              }
            >
              {p.nom}
              {p.quantite > 1 ? ` (x${p.quantite})` : ""}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ConcoursRattacheCard({
  dossierConcours,
  piecesRequises,
  centres,
  sessions,
}: {
  dossierConcours: DossierConcours;
  piecesRequises: PieceRequise[] | undefined;
  centres: Centre[] | undefined;
  sessions: SessionAcademique[] | undefined;
}) {
  const { data: concours } = useConcours(dossierConcours.concoursId);
  const { data: pieces, isLoading: chargementPieces } =
    usePiecesDossierConcours(dossierConcours.id);
  const { data: solde } = useSoldeDossierConcours(dossierConcours.id);

  const centre = centres?.find((c) => c.id === dossierConcours.centreId);
  const session = sessions?.find((s) => s.id === dossierConcours.sessionId);

  const nbValidees = (pieces ?? []).filter(
    (p) => p.statut === "VALIDEE",
  ).length;
  const nbTotal = pieces?.length ?? 0;
  const pourcentage =
    nbTotal > 0 ? Math.round((nbValidees / nbTotal) * 100) : 0;

  return (
    <ConcoursCardVisual
      nom={
        centre
          ? `${concours?.nom ?? "Concours"} (${centre.nom})`
          : (concours?.nom ?? "Concours")
      }
      sousTitre={`${session ? `Session ${session.annee} · ` : ""}Ajouté le ${new Date(dossierConcours.dateAjout).toLocaleDateString("fr-FR")}`}
      pourcentage={pourcentage}
      montantPaye={solde?.montantPaye}
      soldeRestant={solde?.soldeRestant}
      chargementPieces={chargementPieces}
      pieces={(pieces ?? []).map((p) => ({
        id: p.id,
        nom:
          piecesRequises?.find((pr) => pr.id === p.pieceRequiseId)?.nom ??
          "Pièce",
        quantite: p.quantite,
        validee: p.statut === "VALIDEE",
      }))}
    />
  );
}

function ConcoursRattacheCardMock({
  concours,
}: {
  concours: ConcoursRattacheMock;
}) {
  const nbValidees = concours.pieces.filter(
    (p) => p.statut === "VALIDEE",
  ).length;
  const pourcentage = Math.round((nbValidees / concours.pieces.length) * 100);

  return (
    <ConcoursCardVisual
      nom={`${concours.nom} (${concours.centreNom})`}
      sousTitre={`Session ${concours.sessionAnnee} · Ajouté le ${new Date(concours.dateAjout).toLocaleDateString("fr-FR")}`}
      pourcentage={pourcentage}
      montantPaye={concours.montantPaye}
      soldeRestant={concours.soldeRestant}
      pieces={concours.pieces.map((p, index) => ({
        id: `${concours.nom}-${index}`,
        nom: p.nom,
        quantite: p.quantite,
        validee: p.statut === "VALIDEE",
      }))}
    />
  );
}
