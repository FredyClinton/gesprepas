"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  Pencil,
  Ban,
  RotateCcw,
  Trash2,
  X,
  Plus,
  Search,
} from "lucide-react";

import { Button, Card, Input, iconButtonClass } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import {
  useEnseignant,
  useRenommerEnseignant,
  useModifierCoutParSeance,
  useSuspendreEnseignant,
  useReactiverEnseignant,
  useSupprimerEnseignant,
} from "@/modules/personnel";
import { useDepartements, type Departement } from "@/modules/departement";
import {
  useRostersDepartements,
  useAjouterEnseignantRoster,
  useRetirerEnseignantRoster,
} from "@/modules/affectation-departementale";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useSalles } from "@/modules/salle";
import { useMatieres } from "@/modules/matieres";
import {
  useAffectationsParEnseignant,
  LABELS_JOUR,
} from "@/modules/affectation";
import { useGelEnseignants } from "@/modules/gel-enseignants";
import type { Role } from "@/types/roles";

const MAX_DEPARTEMENTS = 2;

const renommerSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
});
type RenommerFormValues = z.infer<typeof renommerSchema>;

const coutSchema = z.object({
  coutParSeance: z
    .number({ message: "Doit être un nombre" })
    .min(0, "Ne peut pas être négatif"),
});
type CoutFormValues = z.infer<typeof coutSchema>;

const FORMATEUR_FCFA = new Intl.NumberFormat("fr-FR");

const LABELS_STATUT_SEANCE: Record<string, string> = {
  PLANIFIEE: "Planifiée",
  ASSIGNEE: "Assignée",
  EFFECTUEE: "Effectuée",
  ANNULEE: "Annulée",
};

const CLASSES_STATUT_SEANCE: Record<string, string> = {
  PLANIFIEE: "bg-brand-gray/10 text-brand-gray",
  ASSIGNEE: "bg-brand-orange/10 text-brand-orange",
  EFFECTUEE: "bg-green-100 text-green-800",
  ANNULEE: "bg-red-100 text-red-800",
};

export function EnseignantDetailView({
  enseignantId,
  role,
}: {
  enseignantId: string;
  role: Role;
}) {
  const estDA = role === "DIRECTEUR_ACADEMIQUE";
  const estCDD = role === "CHEF_DEPARTEMENT";
  const { data: gel } = useGelEnseignants();
  const gelEffectifPourCDD = estCDD && (gel === undefined || gel.effectif);
  const peutGerer = estDA || (estCDD && !gelEffectifPourCDD);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: enseignant, isLoading, isError } = useEnseignant(enseignantId);
  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;
  const { data: departements } = useDepartements();
  const departementIds = useMemo(
    () => departements?.map((d) => d.id) ?? [],
    [departements],
  );
  const { data: roster } = useRostersDepartements(departementIds, sessionId);
  const { data: centres } = useCentres();
  const { data: salles } = useSalles(sessionId);
  const { data: matieres } = useMatieres();
  const { data: seances, isLoading: chargementSeances } =
    useAffectationsParEnseignant(enseignantId, sessionId);

  const departementsDeCetEnseignant: Departement[] = useMemo(() => {
    if (!roster || !departements) return [];
    const ids = new Set(
      roster
        .filter((r) => r.enseignantId === enseignantId)
        .map((r) => r.departementId),
    );
    return departements.filter((d) => ids.has(d.id));
  }, [roster, departements, enseignantId]);

  const departementsDisponibles = useMemo(
    () =>
      (departements ?? []).filter(
        (d) => !departementsDeCetEnseignant.some((dd) => dd.id === d.id),
      ),
    [departements, departementsDeCetEnseignant],
  );

  // Toutes les séances de l'enseignant sur la session, quel que soit leur statut
  // (planifiée, assignée, effectuée ou annulée) — pas seulement celles déjà
  // effectuées, pour que le Directeur Académique voie aussi ce qui reste à venir.
  const toutesLesSeances = useMemo(
    () =>
      (seances ?? []).sort(
        (a, b) => a.semaine - b.semaine || a.seance - b.seance,
      ),
    [seances],
  );

  const [editionNom, setEditionNom] = useState(false);
  const [editionCout, setEditionCout] = useState(false);
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);
  const [selecteurRattachementOuvert, setSelecteurRattachementOuvert] =
    useState(false);

  const [recherche, setRecherche] = useState("");
  const [filtreMatiereId, setFiltreMatiereId] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");

  const renommer = useRenommerEnseignant();
  const modifierCout = useModifierCoutParSeance();
  const suspendre = useSuspendreEnseignant();
  const reactiver = useReactiverEnseignant();
  const supprimer = useSupprimerEnseignant();
  const rattacher = useAjouterEnseignantRoster();
  const detacher = useRetirerEnseignantRoster();

  const formNom = useForm<RenommerFormValues>({
    resolver: zodResolver(renommerSchema),
  });
  const formCout = useForm<CoutFormValues>({
    resolver: zodResolver(coutSchema),
  });

  // Synchronise l'ouverture du formulaire avec le paramètre d'URL ?edit=1 une fois
  // les données chargées (pas d'alternative sans effet : enseignant est
  // indisponible au tout premier rendu).
  useEffect(() => {
    if (searchParams.get("edit") === "1" && enseignant && peutGerer) {
      formNom.reset({ nom: enseignant.nom, prenom: enseignant.prenom });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditionNom(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enseignant, peutGerer]);

  async function onSubmitNom(values: RenommerFormValues) {
    try {
      await renommer.mutateAsync({ id: enseignantId, ...values });
      setEditionNom(false);
    } catch (erreur) {
      formNom.setError("root", {
        message: messageErreurApi(erreur, "Échec de la modification."),
      });
    }
  }

  async function onSubmitCout(values: CoutFormValues) {
    try {
      await modifierCout.mutateAsync({
        id: enseignantId,
        coutParSeance: values.coutParSeance,
      });
      setEditionCout(false);
    } catch (erreur) {
      formCout.setError("root", {
        message: messageErreurApi(erreur, "Échec de la modification."),
      });
    }
  }

  async function toggleStatut() {
    if (!enseignant) return;
    if (enseignant.statut === "ACTIF") {
      await suspendre.mutateAsync(enseignantId);
    } else {
      await reactiver.mutateAsync(enseignantId);
    }
  }

  async function confirmerSuppression() {
    await supprimer.mutateAsync(enseignantId);
    router.push("/enseignants");
  }

  async function rattacherDepartement(departementId: string) {
    if (!sessionId) return;
    await rattacher.mutateAsync({ departementId, sessionId, enseignantId });
    setSelecteurRattachementOuvert(false);
  }

  async function detacherDepartement(departementId: string) {
    if (!sessionId) return;
    await detacher.mutateAsync({ departementId, sessionId, enseignantId });
  }

  const matieresDesSeances = useMemo(() => {
    const ids = new Set(toutesLesSeances.map((s) => s.matiereId));
    return (matieres ?? []).filter((m) => ids.has(m.id));
  }, [toutesLesSeances, matieres]);

  const statutsDesSeances = useMemo(() => {
    const ids = new Set(toutesLesSeances.map((s) => s.statut));
    return Array.from(ids);
  }, [toutesLesSeances]);

  const seancesFiltrees = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLowerCase();
    return toutesLesSeances.filter((s) => {
      if (filtreMatiereId && s.matiereId !== filtreMatiereId) return false;
      if (filtreStatut && s.statut !== filtreStatut) return false;
      if (!rechercheNormalisee) return true;
      const nomMatiere = matieres?.find((m) => m.id === s.matiereId)?.nom ?? "";
      const nomCentre = centres?.find((c) => c.id === s.centreId)?.nom ?? "";
      const nomSalle = salles?.find((sa) => sa.id === s.salleId)?.nom ?? "";
      const cible = `${nomMatiere} ${nomCentre} ${nomSalle}`.toLowerCase();
      return cible.includes(rechercheNormalisee);
    });
  }, [
    toutesLesSeances,
    filtreMatiereId,
    filtreStatut,
    recherche,
    matieres,
    centres,
    salles,
  ]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <p className="text-brand-gray p-8 text-center text-base">
          Chargement...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="p-10 text-center">
          <p className="font-bold text-red-600">Erreur de chargement</p>
          <p className="text-brand-gray mt-1.5 text-sm">
            L&rsquo;appel à <code>/api/enseignants/{enseignantId}</code> a
            échoué (réseau, serveur, ou l&rsquo;identifiant n&rsquo;existe pas).
            Vérifiez l&rsquo;onglet Network du navigateur pour le code exact.
          </p>
          <Link
            href="/enseignants"
            className="text-brand-orange mt-3 inline-block text-sm font-bold"
          >
            Retour à la liste
          </Link>
        </Card>
      </div>
    );
  }

  if (!enseignant) {
    return (
      <div className="mx-auto max-w-7xl">
        <Card className="p-10 text-center">
          <p className="text-brand-anthracite text-lg font-bold">
            Enseignant introuvable
          </p>
          <Link
            href="/enseignants"
            className="text-brand-orange mt-3 inline-block text-sm font-bold"
          >
            Retour à la liste
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {gelEffectifPourCDD && (
        <Card className="border-brand-orange/30 bg-brand-orange/5 p-4">
          <p className="text-brand-anthracite text-sm">
            La gestion de cet enseignant (édition, suspension, rattachement) est
            temporairement indisponible.
          </p>
        </Card>
      )}

      <Link
        href="/enseignants"
        className="text-brand-gray hover:text-brand-anthracite inline-flex items-center gap-1.5 text-sm font-bold"
      >
        <ArrowLeft size={16} />
        Retour à la liste
      </Link>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-brand-anthracite text-xl font-bold">
                  {enseignant.prenom} {enseignant.nom}
                </h1>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    enseignant.statut === "ACTIF"
                      ? "bg-green-100 text-green-800"
                      : "bg-brand-gray/10 text-brand-gray"
                  }`}
                >
                  {enseignant.statut === "ACTIF" ? "Actif" : "Suspendu"}
                </span>
              </div>
              {peutGerer && !editionNom && !editionCout && (
                <button
                  type="button"
                  onClick={() => {
                    formNom.reset({
                      nom: enseignant.nom,
                      prenom: enseignant.prenom,
                    });
                    setEditionNom(true);
                  }}
                  className={iconButtonClass()}
                  title="Modifier le nom"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>

            {editionNom && (
              <form
                onSubmit={formNom.handleSubmit(onSubmitNom)}
                className="mt-4 space-y-3"
                noValidate
              >
                <Input
                  label="Nom"
                  error={formNom.formState.errors.nom?.message}
                  {...formNom.register("nom")}
                />
                <Input
                  label="Prénom"
                  error={formNom.formState.errors.prenom?.message}
                  {...formNom.register("prenom")}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={formNom.formState.isSubmitting}
                  >
                    Enregistrer
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditionNom(false)}
                  >
                    Annuler
                  </Button>
                </div>
                {formNom.formState.errors.root && (
                  <p className="text-xs font-bold text-red-600">
                    {formNom.formState.errors.root.message}
                  </p>
                )}
              </form>
            )}

            <div className="mt-4 space-y-3">
              <h2 className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                Détails
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                    Matricule
                  </p>
                  <p className="text-brand-anthracite text-base font-bold">
                    {enseignant.matricule}
                  </p>
                </div>
                <div className={editionCout ? "col-span-2" : undefined}>
                  <div className="flex items-center gap-2">
                    <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                      Coût par séance
                    </p>
                    {peutGerer && !editionCout && !editionNom && (
                      <button
                        type="button"
                        onClick={() => {
                          formCout.reset({
                            coutParSeance: enseignant.coutParSeance,
                          });
                          setEditionCout(true);
                        }}
                        className={iconButtonClass()}
                        title="Modifier le coût"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                  {editionCout ? (
                    <form
                      onSubmit={formCout.handleSubmit(onSubmitCout)}
                      className="mt-1.5 flex flex-wrap items-center gap-2"
                      noValidate
                    >
                      <input
                        type="number"
                        step="0.01"
                        className="border-brand-gray/30 w-28 rounded border px-2 py-1.5 text-sm"
                        {...formCout.register("coutParSeance", {
                          valueAsNumber: true,
                        })}
                      />
                      <Button
                        type="submit"
                        disabled={formCout.formState.isSubmitting}
                      >
                        OK
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditionCout(false)}
                      >
                        Annuler
                      </Button>
                    </form>
                  ) : (
                    <p className="text-brand-anthracite text-base font-bold">
                      {FORMATEUR_FCFA.format(enseignant.coutParSeance)} FCFA
                    </p>
                  )}
                  {formCout.formState.errors.root && (
                    <p className="mt-1 text-xs font-bold text-red-600">
                      {formCout.formState.errors.root.message}
                    </p>
                  )}
                </div>
                {/* Champs pas encore disponibles côté backend (pas de colonne/DTO) —
                    affichage en placeholder en attendant leur ajout. */}
                <div>
                  <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                    Téléphone
                  </p>
                  <p className="text-brand-gray/60 text-base italic">—</p>
                </div>
                <div>
                  <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                    Numéro CNI
                  </p>
                  <p className="text-brand-gray/60 text-base italic">—</p>
                </div>
                <div>
                  <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                    École / Fonction
                  </p>
                  <p className="text-brand-gray/60 text-base italic">—</p>
                </div>
                <div>
                  <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                    Niveau / Grade
                  </p>
                  <p className="text-brand-gray/60 text-base italic">—</p>
                </div>
              </div>
            </div>

            <div className="border-brand-gray/10 mt-4 space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-brand-gray text-xs font-bold tracking-wide uppercase">
                  Départements
                </h2>
                {peutGerer &&
                  departementsDeCetEnseignant.length < MAX_DEPARTEMENTS &&
                  departementsDisponibles.length > 0 && (
                    <Button
                      type="button"
                      onClick={() => setSelecteurRattachementOuvert((o) => !o)}
                      className="px-3 py-1.5 text-xs"
                    >
                      <Plus size={14} />
                      Rattacher
                    </Button>
                  )}
              </div>

              {selecteurRattachementOuvert && (
                <div className="border-brand-gray/20 flex flex-wrap gap-2 rounded-md border p-3">
                  {departementsDisponibles.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => rattacherDepartement(d.id)}
                      disabled={rattacher.isPending}
                      className="border-brand-gray/30 text-brand-anthracite hover:border-brand-orange rounded-full border px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                    >
                      {d.nom}
                    </button>
                  ))}
                </div>
              )}

              {departementsDeCetEnseignant.length === 0 ? (
                <p className="text-brand-gray text-sm">
                  Aucun département pour l&rsquo;instant.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {departementsDeCetEnseignant.map((d) => (
                    <span
                      key={d.id}
                      className="bg-brand-gray/10 text-brand-anthracite inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                    >
                      {d.nom}
                      {peutGerer && (
                        <button
                          type="button"
                          onClick={() => detacherDepartement(d.id)}
                          disabled={detacher.isPending}
                          aria-label={`Détacher ${d.nom}`}
                          className="hover:text-red-600 disabled:opacity-50"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {(rattacher.isError || detacher.isError) && (
                <p className="text-xs font-bold text-red-600">
                  Échec de l&rsquo;opération. Réessayez.
                </p>
              )}
            </div>

            {peutGerer && (
              <div className="border-brand-gray/10 mt-4 space-y-2 border-t pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={toggleStatut}
                  disabled={suspendre.isPending || reactiver.isPending}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {enseignant.statut === "ACTIF" ? (
                      <Ban size={16} />
                    ) : (
                      <RotateCcw size={16} />
                    )}
                    {enseignant.statut === "ACTIF" ? "Suspendre" : "Réactiver"}
                  </span>
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmationSuppression(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Supprimer le profil
                </button>

                {confirmationSuppression && (
                  <div className="rounded-md border border-red-200 p-3">
                    <p className="text-brand-anthracite text-sm font-bold">
                      Supprimer définitivement {enseignant.prenom}{" "}
                      {enseignant.nom} ?
                    </p>
                    <p className="text-brand-gray mt-1 text-xs">
                      Impossible tant que cet enseignant a encore des
                      affectations en cours.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={confirmerSuppression}
                        disabled={supprimer.isPending}
                        className="rounded bg-red-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {supprimer.isPending ? "Suppression..." : "Confirmer"}
                      </button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setConfirmationSuppression(false)}
                      >
                        Annuler
                      </Button>
                    </div>
                    {supprimer.isError && (
                      <p className="mt-2 text-xs font-bold text-red-600">
                        Échec de la suppression — vérifiez qu&rsquo;aucune
                        affectation n&rsquo;y fait encore référence.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <div className="border-brand-gray/20 space-y-3 border-b p-5">
              <div>
                <h2 className="text-brand-anthracite text-lg font-bold">
                  Séances
                </h2>
                <p className="text-brand-gray mt-1 text-sm">
                  Session {sessionActive?.annee ?? "-"}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="text-brand-gray absolute top-1/2 left-3 -translate-y-1/2"
                  />
                  <input
                    type="text"
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    placeholder="Rechercher par matière, centre ou salle..."
                    className="border-brand-gray/30 w-full rounded-md border py-2 pr-3 pl-9 text-sm"
                  />
                </div>
                <select
                  value={filtreMatiereId}
                  onChange={(e) => setFiltreMatiereId(e.target.value)}
                  className="border-brand-gray/30 text-brand-anthracite rounded-md border px-3 py-2 text-sm"
                >
                  <option value="">Toutes les matières</option>
                  {matieresDesSeances.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
                </select>
                <select
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value)}
                  className="border-brand-gray/30 text-brand-anthracite rounded-md border px-3 py-2 text-sm uppercase"
                >
                  <option value="" className="normal-case">
                    Tous les statuts
                  </option>
                  {statutsDesSeances.map((statut) => (
                    <option key={statut} value={statut}>
                      {LABELS_STATUT_SEANCE[statut] ?? statut}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-anthracite text-brand-white">
                  <tr>
                    {[
                      "Semaine / Jour / Séance",
                      "Centre",
                      "Matière",
                      "Salle",
                      "Statut",
                    ].map((titre) => (
                      <th
                        key={titre}
                        className="p-4 text-xs font-bold tracking-wide uppercase"
                      >
                        {titre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-brand-gray/10 divide-y">
                  {chargementSeances && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-brand-gray p-5 text-center"
                      >
                        Chargement...
                      </td>
                    </tr>
                  )}
                  {!chargementSeances && seancesFiltrees.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-brand-gray p-5 text-center"
                      >
                        {toutesLesSeances.length === 0
                          ? "Aucune séance pour l'instant."
                          : "Aucune séance ne correspond à la recherche."}
                      </td>
                    </tr>
                  )}
                  {seancesFiltrees.map((s) => (
                    <tr key={s.id}>
                      <td className="text-brand-anthracite p-4 font-bold">
                        Semaine {s.semaine} · {LABELS_JOUR[s.jour]} · Séance{" "}
                        {s.seance}
                      </td>
                      <td className="text-brand-gray p-4 text-sm">
                        {centres?.find((c) => c.id === s.centreId)?.nom ?? "—"}
                      </td>
                      <td className="text-brand-gray p-4 text-sm">
                        {matieres?.find((m) => m.id === s.matiereId)?.nom ??
                          "—"}
                      </td>
                      <td className="text-brand-gray p-4 text-sm">
                        {salles?.find((sa) => sa.id === s.salleId)?.nom ?? "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase ${
                            CLASSES_STATUT_SEANCE[s.statut] ??
                            "bg-brand-gray/10 text-brand-gray"
                          }`}
                        >
                          {LABELS_STATUT_SEANCE[s.statut] ?? s.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
