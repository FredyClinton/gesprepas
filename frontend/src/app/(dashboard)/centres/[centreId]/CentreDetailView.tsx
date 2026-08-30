"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  MapPin,
  Info,
  Users,
  LineChart,
  CalendarRange,
  GraduationCap,
  DoorOpen,
  Plus,
  ChevronDown,
  Ban,
  RotateCcw,
  Pencil,
  Trash2,
  ArrowRightLeft,
} from "lucide-react";

import { Button, Card, Input } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import {
  useCentres,
  useSessionActive,
  useSessions,
  useRelocaliserCentre,
  useLocalisations,
  useFermerCentre,
  useRouvrirCentre,
  useRejoindreSession,
  relocalisationSchema,
  type Centre,
  type RelocalisationFormValues,
} from "@/modules/centres-sessions";
import {
  useFormations,
  useCreateFormation,
  useRenommerFormation,
  useSupprimerFormation,
  formationSchema,
  type Formation,
  type FormationFormValues,
} from "@/modules/academique";
import {
  useSalles,
  useCreateSalle,
  useRenommerSalle,
  useReaffecterFormationSalle,
  useSupprimerSalle,
  type Salle,
} from "@/modules/salle";

type Onglet = "informations" | "personnel" | "performances";

export function CentreDetailView({
  centreId,
  peutGererAcademique,
  peutRelocaliser,
  peutFermerCentre = false,
  peutRejoindreSession = false,
  masquerRetour = false,
}: {
  centreId: string;
  peutGererAcademique: boolean;
  // Réservé au Directeur et au Chef de Centre — le Directeur Académique gère les
  // formations/salles depuis cette même page mais ne relocalise pas le centre.
  peutRelocaliser: boolean;
  // Réservé au Directeur seul — ni le Directeur Académique ni le Chef de Centre ne
  // peuvent fermer/rouvrir un centre.
  peutFermerCentre?: boolean;
  // Réservé au Directeur et au Directeur Académique — pas au Chef de Centre.
  peutRejoindreSession?: boolean;
  // Le Chef de Centre (écran "Mon centre") n'a pas accès à /centres — pas de lien de
  // retour à afficher dans ce cas.
  masquerRetour?: boolean;
}) {
  const { data: centres, isLoading } = useCentres();
  const { data: sessionActive } = useSessionActive();
  const [onglet, setOnglet] = useState<Onglet>("informations");
  const fermerCentre = useFermerCentre();
  const rouvrirCentre = useRouvrirCentre();

  const centre = centres?.find((c) => c.id === centreId);
  const rejointSessionActive =
    centre && sessionActive
      ? centre.sessionIds.includes(sessionActive.id)
      : false;

  async function toggleStatutCentre() {
    if (!centre) return;
    if (centre.statut === "OUVERT") {
      await fermerCentre.mutateAsync(centre.id);
    } else {
      await rouvrirCentre.mutateAsync(centre.id);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <p className="text-brand-gray p-8 text-center text-base">
          Chargement...
        </p>
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="p-10 text-center">
          <p className="text-brand-anthracite text-lg font-bold">
            Centre introuvable
          </p>
          {!masquerRetour && (
            <Link
              href="/centres"
              className="text-brand-orange mt-3 inline-block text-sm font-bold"
            >
              Retour à la liste des centres
            </Link>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        {!masquerRetour && (
          <Link
            href="/centres"
            className="text-brand-gray hover:text-brand-anthracite mb-4 inline-flex items-center gap-1.5 text-sm font-bold"
          >
            <ArrowLeft size={16} />
            Retour à la liste des centres
          </Link>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-brand-orange/10 text-brand-orange rounded-lg p-3">
              <MapPin size={26} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-brand-anthracite text-4xl font-bold">
                  {centre.nom}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    centre.statut === "OUVERT"
                      ? "bg-green-100 text-green-800"
                      : "bg-brand-gray/10 text-brand-gray"
                  }`}
                >
                  {centre.statut === "OUVERT" ? "Ouvert" : "Fermé"}
                </span>
              </div>
            </div>
          </div>
          {peutFermerCentre && (
            <Button
              type="button"
              variant="secondary"
              onClick={toggleStatutCentre}
              disabled={fermerCentre.isPending || rouvrirCentre.isPending}
            >
              <span className="flex items-center gap-1.5">
                {centre.statut === "OUVERT" ? (
                  <Ban size={16} />
                ) : (
                  <RotateCcw size={16} />
                )}
                {centre.statut === "OUVERT"
                  ? "Fermer le centre"
                  : "Rouvrir le centre"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="border-brand-gray/20 flex gap-8 border-b">
        <button
          type="button"
          onClick={() => setOnglet("informations")}
          className={`flex items-center gap-2 border-b-2 pb-3 text-base font-bold ${
            onglet === "informations"
              ? "border-brand-orange text-brand-orange"
              : "text-brand-gray border-transparent"
          }`}
        >
          <Info size={18} />
          Informations &amp; Paramètres
        </button>
        <button
          type="button"
          onClick={() => setOnglet("personnel")}
          className={`flex items-center gap-2 border-b-2 pb-3 text-base font-bold ${
            onglet === "personnel"
              ? "border-brand-orange text-brand-orange"
              : "text-brand-gray border-transparent"
          }`}
        >
          <Users size={18} />
          Personnel
        </button>
        <button
          type="button"
          onClick={() => setOnglet("performances")}
          className={`flex items-center gap-2 border-b-2 pb-3 text-base font-bold ${
            onglet === "performances"
              ? "border-brand-orange text-brand-orange"
              : "text-brand-gray border-transparent"
          }`}
        >
          <LineChart size={18} />
          Performances
        </button>
      </div>

      {onglet === "informations" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <SessionsRejointes
              centreId={centre.id}
              sessionIds={centre.sessionIds}
              peutRejoindreSession={peutRejoindreSession}
            />
            <InformationsDuCentre
              centre={centre}
              peutRelocaliser={peutRelocaliser}
            />
          </div>
          <FormationsEtSalles
            centreId={centre.id}
            sessionId={sessionActive?.id}
            rejointSessionActive={rejointSessionActive}
            peutGererAcademique={peutGererAcademique}
          />
        </div>
      )}

      {onglet === "personnel" && (
        <OngletPlaceholder icone={<Users size={28} />} />
      )}

      {onglet === "performances" && (
        <OngletPlaceholder icone={<LineChart size={28} />} />
      )}
    </div>
  );
}

// Onglets "Personnel" et "Performances" : pas encore implémentés côté backend pour
// ce périmètre — simple placeholder en attendant.
function OngletPlaceholder({ icone }: { icone: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-16 text-center">
      <div className="bg-brand-gray/10 text-brand-gray rounded-full p-4">
        {icone}
      </div>
      <p className="text-brand-anthracite text-base font-bold">
        Bientôt disponible
      </p>
      <p className="text-brand-gray text-sm">
        Cet onglet sera implémenté dans une prochaine version.
      </p>
    </Card>
  );
}

// Colocalisé : liste des sessions académiques rejointes par ce centre, plus un point
// d'entrée pour en rejoindre une nouvelle. On ne propose que les sessions EN_COURS ou
// PLANIFIEE (pas les CLOTUREE) — le backend rejette de toute façon une session
// clôturée (SessionNonUtilisableException), mais autant ne pas la proposer.
function SessionsRejointes({
  centreId,
  sessionIds,
  peutRejoindreSession,
}: {
  centreId: string;
  sessionIds: string[];
  peutRejoindreSession: boolean;
}) {
  const { data: sessions } = useSessions();
  const sessionsDuCentre = sessions?.filter((s) => sessionIds.includes(s.id));
  const sessionsDisponibles = sessions?.filter(
    (s) => !sessionIds.includes(s.id) && s.statut !== "CLOTUREE",
  );

  const [selecteurOuvert, setSelecteurOuvert] = useState(false);
  const rejoindre = useRejoindreSession();

  async function rejoindreSession(sessionId: string) {
    await rejoindre.mutateAsync({ id: centreId, sessionId });
    setSelecteurOuvert(false);
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-brand-anthracite text-xl font-bold">
          Sessions rejointes
        </h2>
        {peutRejoindreSession &&
          sessionsDisponibles &&
          sessionsDisponibles.length > 0 && (
            <button
              type="button"
              onClick={() => setSelecteurOuvert((o) => !o)}
              className="text-brand-orange flex items-center gap-1 text-xs font-bold"
            >
              <Plus size={12} />
              Rejoindre une session
            </button>
          )}
      </div>

      {selecteurOuvert && (
        <div className="border-brand-gray/20 mb-3 flex flex-wrap gap-2 rounded-md border p-3">
          {sessionsDisponibles?.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => rejoindreSession(session.id)}
              disabled={rejoindre.isPending}
              className="border-brand-gray/30 text-brand-anthracite hover:border-brand-orange rounded-full border px-3 py-1.5 text-xs font-bold disabled:opacity-50"
            >
              {session.annee} —{" "}
              {session.statut === "EN_COURS" ? "En cours" : "Planifiée"}
            </button>
          ))}
        </div>
      )}
      {rejoindre.isError && (
        <p className="mb-3 text-xs font-bold text-red-600">
          Échec de l&rsquo;opération. Réessayez.
        </p>
      )}

      <Card className="overflow-hidden">
        <ul className="divide-brand-gray/10 divide-y">
          {sessionsDuCentre === undefined && (
            <li className="text-brand-gray p-5 text-center text-sm">
              Chargement...
            </li>
          )}
          {sessionsDuCentre?.length === 0 && (
            <li className="text-brand-gray p-5 text-center text-sm">
              Ce centre n&rsquo;a rejoint aucune session pour l&rsquo;instant.
            </li>
          )}
          {sessionsDuCentre?.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between p-5"
            >
              <div className="flex items-center gap-4">
                <div className="bg-brand-orange/10 text-brand-orange rounded-lg p-2">
                  <CalendarRange size={20} />
                </div>
                <div>
                  <p className="text-brand-anthracite text-base font-bold">
                    {session.annee}
                  </p>
                  <p className="text-brand-gray text-sm">
                    {new Date(session.dateDebut).toLocaleDateString("fr-FR")} —{" "}
                    {new Date(session.dateFin).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  session.statut === "EN_COURS"
                    ? "bg-brand-blue/10 text-brand-blue"
                    : session.statut === "PLANIFIEE"
                      ? "bg-brand-orange/10 text-brand-orange"
                      : "bg-brand-gray/10 text-brand-gray"
                }`}
              >
                {session.statut === "EN_COURS"
                  ? "En cours"
                  : session.statut === "PLANIFIEE"
                    ? "Planifiée"
                    : "Clôturée"}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

// Colocalisé : adresse actuelle, relocalisation, historique des adresses (repliable).
// L'historique n'est PAS sur `Centre` (CentreResponse ne l'embarque pas) : c'est un
// endpoint séparé, GET /api/centres/{id}/localisations (voir useLocalisations).
function InformationsDuCentre({
  centre,
  peutRelocaliser,
}: {
  centre: Centre;
  peutRelocaliser: boolean;
}) {
  const [ouvrirFormulaire, setOuvrirFormulaire] = useState(false);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const relocaliser = useRelocaliserCentre();
  const { data: historique, isLoading: chargementHistorique } =
    useLocalisations(centre.id);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RelocalisationFormValues>({
    resolver: zodResolver(relocalisationSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await relocaliser.mutateAsync({ id: centre.id, ...values });
      reset();
      setOuvrirFormulaire(false);
    } catch (erreur) {
      setError("root", {
        message: messageErreurApi(
          erreur,
          "Relocalisation impossible pour le moment. Réessayez.",
        ),
      });
    }
  });

  // Historique trié le plus récent en premier, comme sur la maquette.
  const historiqueTrie = [...(historique ?? [])].sort(
    (a, b) =>
      new Date(b.dateDebutValidite).getTime() -
      new Date(a.dateDebutValidite).getTime(),
  );

  return (
    <section>
      <h2 className="text-brand-anthracite mb-4 text-xl font-bold">
        Informations du Centre
      </h2>
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-brand-anthracite text-sm font-bold tracking-wide uppercase">
            Adresse actuelle
          </h3>
          {peutRelocaliser && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOuvrirFormulaire((o) => !o)}
            >
              {ouvrirFormulaire ? "Annuler" : "Relocaliser le centre"}
            </Button>
          )}
        </div>

        {!ouvrirFormulaire || !peutRelocaliser ? (
          <p className="text-brand-anthracite text-base">
            {centre.adresseActuelle}, {centre.villeActuelle}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Nouvelle adresse"
                placeholder="Ex : Avenue Kennedy"
                error={errors.adresse?.message}
                {...register("adresse")}
              />
              <Input
                label="Nouvelle ville"
                placeholder="Ex : Yaoundé"
                error={errors.ville?.message}
                {...register("ville")}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Enregistrement..."
                : "Confirmer la relocalisation"}
            </Button>
            {errors.root && (
              <p className="text-sm font-bold text-red-600">
                {errors.root.message}
              </p>
            )}
          </form>
        )}

        <button
          type="button"
          onClick={() => setHistoriqueOuvert((o) => !o)}
          className="text-brand-anthracite border-brand-gray/15 mt-5 flex w-full items-center justify-between border-t pt-4 text-sm font-bold tracking-wide uppercase"
        >
          Historique des adresses
          <ChevronDown
            size={16}
            className={`transition-transform ${historiqueOuvert ? "rotate-180" : ""}`}
          />
        </button>

        {historiqueOuvert && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-brand-gray/15 border-b">
                  {["Adresse", "Ville", "Date de début", "Date de fin"].map(
                    (titre) => (
                      <th
                        key={titre}
                        className="text-brand-gray p-3 text-xs font-bold tracking-wide uppercase"
                      >
                        {titre}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-brand-gray/10 divide-y">
                {chargementHistorique && (
                  <tr>
                    <td colSpan={4} className="text-brand-gray p-4 text-center">
                      Chargement...
                    </td>
                  </tr>
                )}
                {!chargementHistorique && historiqueTrie.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-brand-gray p-4 text-center">
                      Aucun historique pour l&rsquo;instant.
                    </td>
                  </tr>
                )}
                {historiqueTrie.map((loc) => (
                  <tr key={loc.id}>
                    <td className="text-brand-anthracite p-3 font-bold">
                      {loc.adresse}
                    </td>
                    <td className="text-brand-gray p-3">{loc.ville}</td>
                    <td className="text-brand-gray p-3">
                      {new Date(loc.dateDebutValidite).toLocaleDateString(
                        "fr-FR",
                      )}
                    </td>
                    <td className="p-3">
                      {loc.dateFinValidite ? (
                        <span className="text-brand-gray">
                          {new Date(loc.dateFinValidite).toLocaleDateString(
                            "fr-FR",
                          )}
                        </span>
                      ) : (
                        <span className="bg-brand-blue/10 text-brand-blue rounded-full px-3 py-1.5 text-xs font-bold">
                          Actuelle
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}

// Colocalisé : panneau "Formations & Salles associées" — création de formation,
// puis chaque formation existante avec ses salles et un point d'ajout de salle dédié.
function FormationsEtSalles({
  centreId,
  sessionId,
  rejointSessionActive,
  peutGererAcademique,
}: {
  centreId: string;
  sessionId: string | undefined;
  rejointSessionActive: boolean;
  peutGererAcademique: boolean;
}) {
  const { data: formations, isLoading: chargementFormations } = useFormations();
  const { data: salles } = useSalles(sessionId);
  const creerFormation = useCreateFormation();

  const formationsDuCentre = formations?.filter((f) => f.centreId === centreId);
  const sallesDuCentre = salles?.filter((s) => s.centreId === centreId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormationFormValues>({ resolver: zodResolver(formationSchema) });

  const onSubmit = handleSubmit(async (values) => {
    if (!sessionId) return;
    try {
      await creerFormation.mutateAsync({
        nom: values.nom,
        centreId,
        sessionId,
      });
      reset();
    } catch (erreur) {
      setError("root", {
        message: messageErreurApi(
          erreur,
          "Création impossible pour le moment. Réessayez.",
        ),
      });
    }
  });

  return (
    <section className="space-y-6">
      <h2 className="text-brand-anthracite text-xl font-bold">
        Formations &amp; Salles
      </h2>

      {peutGererAcademique && !rejointSessionActive && (
        <Card className="p-6">
          <p className="text-brand-gray text-sm">
            Ce centre n&rsquo;a pas rejoint la session active — la création de
            formations y est bloquée côté backend tant que ce n&rsquo;est pas
            fait.
          </p>
        </Card>
      )}

      <div>
        <h3 className="text-brand-anthracite mb-3 text-sm font-bold tracking-wide uppercase">
          Mes Formations
        </h3>
        <div className="space-y-4">
          {chargementFormations && (
            <Card className="text-brand-gray p-5 text-center text-sm">
              Chargement...
            </Card>
          )}
          {!chargementFormations && formationsDuCentre?.length === 0 && (
            <Card className="text-brand-gray p-5 text-center text-sm">
              Aucune formation pour ce centre pour l&rsquo;instant.
            </Card>
          )}
          {formationsDuCentre?.map((formation) => (
            <CarteFormation
              key={formation.id}
              formation={formation}
              autresFormationsDuCentre={
                formationsDuCentre.filter((f) => f.id !== formation.id) ?? []
              }
              salles={
                sallesDuCentre?.filter((s) => s.formationId === formation.id) ??
                []
              }
              centreId={centreId}
              sessionId={sessionId}
              peutGerer={peutGererAcademique}
            />
          ))}
        </div>
      </div>

      {peutGererAcademique && (
        <Card className="p-6">
          <h3 className="text-brand-anthracite mb-3 text-sm font-bold tracking-wide uppercase">
            Ajouter une formation
          </h3>
          <form
            onSubmit={onSubmit}
            className="flex items-start gap-3"
            noValidate
          >
            <div className="flex-1">
              <Input
                label="Nom de la formation"
                placeholder="Saisir une nouvelle formation..."
                error={errors.nom?.message}
                {...register("nom")}
              />
            </div>
            <div className="pt-6">
              <Button type="submit" disabled={isSubmitting || !sessionId}>
                <span className="flex items-center gap-1.5">
                  <Plus size={16} />
                  {isSubmitting ? "Ajout..." : "Ajouter"}
                </span>
              </Button>
            </div>
          </form>
          {errors.root && (
            <p className="mt-2 text-xs font-bold text-red-600">
              {errors.root.message}
            </p>
          )}
        </Card>
      )}
    </section>
  );
}

const nomInlineSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
});
type NomInlineFormValues = z.infer<typeof nomInlineSchema>;

function CarteFormation({
  formation,
  autresFormationsDuCentre,
  salles,
  centreId,
  sessionId,
  peutGerer,
}: {
  formation: Formation;
  autresFormationsDuCentre: Formation[];
  salles: Salle[];
  centreId: string;
  sessionId: string | undefined;
  peutGerer: boolean;
}) {
  // Pliable comme la zone de relocalisation du centre : repliée par défaut, pour une
  // interface plus épurée quand il y a beaucoup de formations.
  const [ouvert, setOuvert] = useState(false);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [renommageOuvert, setRenommageOuvert] = useState(false);
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);
  const creerSalle = useCreateSalle();
  const renommerFormation = useRenommerFormation();
  const supprimerFormation = useSupprimerFormation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof nomInlineSchema>>({
    resolver: zodResolver(nomInlineSchema),
  });

  const {
    register: registerRenommer,
    handleSubmit: handleSubmitRenommer,
    reset: resetRenommer,
    setError: setErrorRenommer,
    formState: { errors: errorsRenommer, isSubmitting: renommageEnCours },
  } = useForm<NomInlineFormValues>({ resolver: zodResolver(nomInlineSchema) });

  const onSubmit = handleSubmit(async (values) => {
    if (!sessionId) return;
    try {
      await creerSalle.mutateAsync({
        nom: values.nom,
        centreId,
        sessionId,
        formationId: formation.id,
      });
      reset();
      setAjoutOuvert(false);
    } catch (erreur) {
      setError("root", {
        message: messageErreurApi(
          erreur,
          "Création impossible pour le moment. Réessayez.",
        ),
      });
    }
  });

  const onSubmitRenommer = handleSubmitRenommer(async (values) => {
    try {
      await renommerFormation.mutateAsync({ id: formation.id, ...values });
      setRenommageOuvert(false);
    } catch (erreur) {
      setErrorRenommer("root", {
        message: messageErreurApi(
          erreur,
          "Renommage impossible pour le moment. Réessayez.",
        ),
      });
    }
  });

  async function confirmerSuppression() {
    await supprimerFormation.mutateAsync(formation.id);
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-5">
        <div className="flex flex-1 items-center gap-2">
          <GraduationCap size={18} className="text-brand-orange shrink-0" />
          {renommageOuvert ? (
            <div className="flex-1">
              <form
                onSubmit={onSubmitRenommer}
                className="flex items-center gap-2"
                noValidate
              >
                <input
                  autoFocus
                  className="border-brand-gray/30 text-brand-anthracite w-full rounded border px-2 py-1 text-sm font-bold"
                  defaultValue={formation.nom}
                  {...registerRenommer("nom")}
                />
                <button
                  type="submit"
                  disabled={renommageEnCours}
                  className="text-brand-orange text-xs font-bold"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setRenommageOuvert(false)}
                  className="text-brand-gray text-xs font-bold"
                >
                  Annuler
                </button>
              </form>
              {errorsRenommer.nom && (
                <p className="mt-1 text-xs font-bold text-red-600">
                  {errorsRenommer.nom.message}
                </p>
              )}
              {errorsRenommer.root && (
                <p className="mt-1 text-xs font-bold text-red-600">
                  {errorsRenommer.root.message}
                </p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setOuvert((o) => !o)}
              className="text-brand-anthracite flex-1 text-left text-base font-bold"
            >
              {formation.nom}
            </button>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-3">
          <span className="text-brand-gray text-xs font-bold">
            {salles.length} salle{salles.length > 1 ? "s" : ""}
          </span>
          {peutGerer && !renommageOuvert && (
            <>
              <button
                type="button"
                onClick={() => {
                  resetRenommer({ nom: formation.nom });
                  setRenommageOuvert(true);
                }}
                className="text-brand-gray hover:text-brand-orange"
                title="Renommer la formation"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmationSuppression(true)}
                className="text-brand-gray hover:text-red-600"
                title="Supprimer la formation"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <button type="button" onClick={() => setOuvert((o) => !o)}>
            <ChevronDown
              size={16}
              className={`text-brand-gray transition-transform ${ouvert ? "rotate-180" : ""}`}
            />
          </button>
        </span>
      </div>

      {confirmationSuppression && (
        <div className="mx-5 mb-4 rounded-md border border-red-200 p-3">
          <p className="text-brand-anthracite text-sm font-bold">
            Supprimer définitivement la formation {formation.nom} ?
          </p>
          <p className="text-brand-gray mt-1 text-xs">
            Impossible si des salles ou des créneaux y font encore référence (le
            backend refusera avec une erreur 409).
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={confirmerSuppression}
              disabled={supprimerFormation.isPending}
              className="rounded bg-red-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {supprimerFormation.isPending ? "Suppression..." : "Confirmer"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmationSuppression(false)}
              className="border-brand-gray/30 text-brand-anthracite rounded border px-3 py-1.5 text-sm font-bold"
            >
              Annuler
            </button>
          </div>
          {supprimerFormation.isError && (
            <p className="mt-2 text-xs font-bold text-red-600">
              Échec de la suppression — vérifiez qu&rsquo;aucune salle ni
              créneau n&rsquo;y fait encore référence.
            </p>
          )}
        </div>
      )}

      {ouvert && (
        <div className="border-brand-gray/15 border-t p-5 pt-4">
          {salles.length === 0 ? (
            <p className="text-brand-gray mb-3 text-sm">
              Aucune salle pour cette formation.
            </p>
          ) : (
            <ul className="divide-brand-gray/10 mb-3 divide-y">
              {salles.map((salle) => (
                <SalleItem
                  key={salle.id}
                  salle={salle}
                  autresFormationsDuCentre={autresFormationsDuCentre}
                  peutGerer={peutGerer}
                />
              ))}
            </ul>
          )}

          {peutGerer &&
            (ajoutOuvert ? (
              <form
                onSubmit={onSubmit}
                className="flex items-start gap-3"
                noValidate
              >
                <div className="flex-1">
                  <Input
                    label="Nom de la salle"
                    placeholder="Ex : Salle 102"
                    error={errors.nom?.message}
                    {...register("nom")}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Button type="submit" disabled={isSubmitting || !sessionId}>
                    {isSubmitting ? "..." : "OK"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setAjoutOuvert(false);
                    }}
                    className="text-brand-gray text-sm font-bold"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAjoutOuvert(true)}
                disabled={!sessionId}
                className="border-brand-gray/30 text-brand-gray hover:border-brand-orange hover:text-brand-orange w-full rounded-md border border-dashed py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Ajouter une salle
              </button>
            ))}
          {errors.root && (
            <p className="mt-2 text-xs font-bold text-red-600">
              {errors.root.message}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// Ligne "salle" repliable en édition : renommer, réaffecter à une autre formation du
// même centre, ou supprimer. `autresFormationsDuCentre` exclut déjà la formation
// courante — on ne propose que des destinations réellement différentes.
function SalleItem({
  salle,
  autresFormationsDuCentre,
  peutGerer,
}: {
  salle: Salle;
  autresFormationsDuCentre: Formation[];
  peutGerer: boolean;
}) {
  const [renommageOuvert, setRenommageOuvert] = useState(false);
  const [reaffectationOuverte, setReaffectationOuverte] = useState(false);
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);
  const renommerSalle = useRenommerSalle();
  const reaffecterFormation = useReaffecterFormationSalle();
  const supprimerSalle = useSupprimerSalle();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NomInlineFormValues>({ resolver: zodResolver(nomInlineSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await renommerSalle.mutateAsync({ id: salle.id, ...values });
      setRenommageOuvert(false);
    } catch (erreur) {
      setError("root", {
        message: messageErreurApi(
          erreur,
          "Renommage impossible pour le moment. Réessayez.",
        ),
      });
    }
  });

  async function reaffecter(formationId: string) {
    await reaffecterFormation.mutateAsync({ id: salle.id, formationId });
    setReaffectationOuverte(false);
  }

  async function confirmerSuppression() {
    await supprimerSalle.mutateAsync(salle.id);
  }

  if (renommageOuvert) {
    return (
      <li className="py-2">
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2"
          noValidate
        >
          <DoorOpen size={14} className="text-brand-gray shrink-0" />
          <input
            autoFocus
            className="border-brand-gray/30 text-brand-anthracite w-full rounded border px-2 py-1 text-sm font-bold"
            defaultValue={salle.nom}
            {...register("nom")}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="text-brand-orange text-xs font-bold"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              setRenommageOuvert(false);
            }}
            className="text-brand-gray text-xs font-bold"
          >
            Annuler
          </button>
        </form>
        {(errors.nom || errors.root) && (
          <p className="mt-1 text-xs font-bold text-red-600">
            {errors.nom?.message ?? errors.root?.message}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className="py-2">
      <div className="flex items-center gap-2 text-sm">
        <DoorOpen size={14} className="text-brand-gray shrink-0" />
        <span className="text-brand-anthracite flex-1 font-bold">
          {salle.nom}
        </span>
        {peutGerer && (
          <span className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                reset({ nom: salle.nom });
                setRenommageOuvert(true);
              }}
              className="text-brand-gray hover:text-brand-orange"
              title="Renommer la salle"
            >
              <Pencil size={14} />
            </button>
            {autresFormationsDuCentre.length > 0 && (
              <button
                type="button"
                onClick={() => setReaffectationOuverte((o) => !o)}
                className="text-brand-gray hover:text-brand-orange"
                title="Déplacer vers une autre formation"
              >
                <ArrowRightLeft size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmationSuppression(true)}
              className="text-brand-gray hover:text-red-600"
              title="Supprimer la salle"
            >
              <Trash2 size={14} />
            </button>
          </span>
        )}
      </div>

      {reaffectationOuverte && (
        <div className="border-brand-gray/20 mt-2 flex flex-wrap gap-2 rounded-md border p-2.5">
          {autresFormationsDuCentre.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => reaffecter(f.id)}
              disabled={reaffecterFormation.isPending}
              className="border-brand-gray/30 text-brand-anthracite hover:border-brand-orange rounded-full border px-2.5 py-1 text-xs font-bold disabled:opacity-50"
            >
              {f.nom}
            </button>
          ))}
        </div>
      )}
      {reaffecterFormation.isError && (
        <p className="mt-1 text-xs font-bold text-red-600">
          Échec du déplacement. Réessayez.
        </p>
      )}

      {confirmationSuppression && (
        <div className="mt-2 rounded-md border border-red-200 p-2.5">
          <p className="text-brand-anthracite text-xs font-bold">
            Supprimer définitivement la salle {salle.nom} ?
          </p>
          <p className="text-brand-gray mt-1 text-xs">
            Impossible si des créneaux y font encore référence.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={confirmerSuppression}
              disabled={supprimerSalle.isPending}
              className="rounded bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {supprimerSalle.isPending ? "Suppression..." : "Confirmer"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmationSuppression(false)}
              className="border-brand-gray/30 text-brand-anthracite rounded border px-2.5 py-1 text-xs font-bold"
            >
              Annuler
            </button>
          </div>
          {supprimerSalle.isError && (
            <p className="mt-2 text-xs font-bold text-red-600">
              Échec de la suppression — vérifiez qu&rsquo;aucun créneau
              n&rsquo;y fait encore référence.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
