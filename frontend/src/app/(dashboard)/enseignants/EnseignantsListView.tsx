"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus, Search, Ban, RotateCcw, Eye, Pencil } from "lucide-react";

import { Button, Card, Input, Pagination, iconButtonClass } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import {
  useEnseignants,
  useCreerEnseignant,
  useSuspendreEnseignant,
  useReactiverEnseignant,
  enseignantSchema,
  type EnseignantFormValues,
  type Enseignant,
} from "@/modules/personnel";
import { useDepartements, type Departement } from "@/modules/departement";
import { useSessionActive } from "@/modules/centres-sessions";
import {
  useRostersDepartements,
  useRosterDepartement,
  useAjouterEnseignantRoster,
} from "@/modules/affectation-departementale";
import {
  useGelEnseignants,
  useModifierGelEnseignants,
} from "@/modules/gel-enseignants";
import type { Role } from "@/types/roles";

type Props = {
  role: Role;
  departementIdCDD: string | null;
};

const MAX_DEPARTEMENTS_A_LA_CREATION = 2;
const FORMATEUR_FCFA = new Intl.NumberFormat("fr-FR");
const TAILLE_PAGE = 10;

export function EnseignantsListView({ role, departementIdCDD }: Props) {
  const estDA = role === "DIRECTEUR_ACADEMIQUE";
  const estCDD = role === "CHEF_DEPARTEMENT";

  const { data: gel } = useGelEnseignants();
  // Le gel bloque uniquement le CDD ; tant que l'état n'est pas encore chargé, on
  // reste fermé par défaut pour éviter un flash de boutons actifs.
  const gelEffectifPourCDD = estCDD && (gel === undefined || gel.effectif);
  const peutGerer = estDA || (estCDD && !gelEffectifPourCDD);

  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;
  const { data: enseignants, isLoading: chargementEnseignants } =
    useEnseignants();
  const { data: departements } = useDepartements();

  const departementIds = useMemo(
    () => (estDA ? (departements?.map((d) => d.id) ?? []) : []),
    [estDA, departements],
  );
  const { data: rosterGlobal } = useRostersDepartements(
    departementIds,
    sessionId,
  );
  const { data: rosterCDD } = useRosterDepartement(
    departementIdCDD ?? undefined,
    sessionId,
  );
  const roster = estDA ? rosterGlobal : rosterCDD;

  // Le roster n'a pas d'endpoint "par enseignant" — on combine ici les rosters
  // (déjà récupérés en parallèle par département) pour savoir à quels départements
  // appartient chaque enseignant.
  const departementsParEnseignant = useMemo(() => {
    const map = new Map<string, Departement[]>();
    if (!roster || !departements) return map;
    for (const entree of roster) {
      const dep = departements.find((d) => d.id === entree.departementId);
      if (!dep) continue;
      const liste = map.get(entree.enseignantId) ?? [];
      liste.push(dep);
      map.set(entree.enseignantId, liste);
    }
    return map;
  }, [roster, departements]);

  const [recherche, setRecherche] = useState("");
  const [filtreDepartement, setFiltreDepartement] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<
    "TOUS" | "ACTIF" | "SUSPENDU"
  >("TOUS");
  const [page, setPage] = useState(1);
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  // Uniquement pour le Directeur Académique -- rattachement facultatif, max 2,
  // choisi à la création (décision du 31/08/2026).
  const [departementsChoisis, setDepartementsChoisis] = useState<string[]>([]);

  const creerEnseignant = useCreerEnseignant();
  const ajouterAuRoster = useAjouterEnseignantRoster();
  const suspendre = useSuspendreEnseignant();
  const reactiver = useReactiverEnseignant();
  const modifierGel = useModifierGelEnseignants();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EnseignantFormValues>({
    resolver: zodResolver(enseignantSchema),
  });

  function toggleDepartementChoisi(id: string) {
    setDepartementsChoisis((prev) => {
      if (prev.includes(id)) return prev.filter((d) => d !== id);
      if (prev.length >= MAX_DEPARTEMENTS_A_LA_CREATION) return prev;
      return [...prev, id];
    });
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const nouvel = await creerEnseignant.mutateAsync(values);
      if (sessionId) {
        if (!estDA && departementIdCDD) {
          // Chef de Département : rattachement automatique à son propre
          // département (décision du 31/08/2026).
          await ajouterAuRoster.mutateAsync({
            departementId: departementIdCDD,
            sessionId,
            enseignantId: nouvel.id,
          });
        } else if (estDA && departementsChoisis.length > 0) {
          // Directeur Académique : rattachement facultatif, jusqu'à 2 choisis.
          await Promise.all(
            departementsChoisis.map((departementId) =>
              ajouterAuRoster.mutateAsync({
                departementId,
                sessionId,
                enseignantId: nouvel.id,
              }),
            ),
          );
        }
      }
      reset();
      setDepartementsChoisis([]);
      setFormulaireOuvert(false);
    } catch (erreur) {
      setError("root", {
        message: messageErreurApi(
          erreur,
          "Création impossible pour le moment. Réessayez.",
        ),
      });
    }
  });

  // Chef de Département : ne voit que les enseignants de son roster (même logique
  // de périmètre restreint que le reste de l'app pour ce rôle).
  const enseignantsVisibles = useMemo(() => {
    if (!enseignants) return undefined;
    if (estDA) return enseignants;
    const ids = new Set(departementsParEnseignant.keys());
    return enseignants.filter((e) => ids.has(e.id));
  }, [enseignants, estDA, departementsParEnseignant]);

  const enseignantsFiltres = useMemo(() => {
    if (!enseignantsVisibles) return undefined;
    return enseignantsVisibles.filter((e) => {
      if (filtreStatut !== "TOUS" && e.statut !== filtreStatut) return false;
      if (filtreDepartement) {
        const deps = departementsParEnseignant.get(e.id) ?? [];
        if (!deps.some((d) => d.id === filtreDepartement)) return false;
      }
      if (recherche.trim()) {
        const q = recherche.trim().toLowerCase();
        const texte = `${e.prenom} ${e.nom} ${e.matricule}`.toLowerCase();
        if (!texte.includes(q)) return false;
      }
      return true;
    });
  }, [
    enseignantsVisibles,
    filtreStatut,
    filtreDepartement,
    recherche,
    departementsParEnseignant,
  ]);

  const totalPages = enseignantsFiltres
    ? Math.max(1, Math.ceil(enseignantsFiltres.length / TAILLE_PAGE))
    : 1;
  const enseignantsPage = useMemo(() => {
    if (!enseignantsFiltres) return undefined;
    const debut = (page - 1) * TAILLE_PAGE;
    return enseignantsFiltres.slice(debut, debut + TAILLE_PAGE);
  }, [enseignantsFiltres, page]);

  const compteursParDepartement = useMemo(() => {
    const compteurs = new Map<string, number>();
    for (const deps of departementsParEnseignant.values()) {
      for (const d of deps) {
        compteurs.set(d.id, (compteurs.get(d.id) ?? 0) + 1);
      }
    }
    return compteurs;
  }, [departementsParEnseignant]);

  async function toggleStatut(e: Enseignant) {
    if (e.statut === "ACTIF") {
      await suspendre.mutateAsync(e.id);
    } else {
      await reactiver.mutateAsync(e.id);
    }
  }

  const departementCDD = departements?.find((d) => d.id === departementIdCDD);
  const chargement = chargementEnseignants || !roster;

  async function toggleGel() {
    if (!gel) return;
    await modifierGel.mutateAsync({
      actif: !gel.actif,
      dateFin: gel.actif ? null : gel.dateFin,
    });
  }

  return (
    // h-full + flex-col : la page remplit exactement la hauteur dispo sous le
    // TopBar (voir (dashboard)/layout.tsx) — seul le tableau (flex-1 plus bas)
    // scrolle en interne, le reste (filtres, en-tête...) reste fixe à l'écran
    // pour que toute la liste soit consultable sans scroller la page.
    <div className="mx-auto flex h-full max-w-7xl flex-col gap-5">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-brand-anthracite text-4xl font-bold uppercase">
            Enseignants
            {estCDD && departementCDD
              ? `  du département de ${departementCDD.nom}`
              : ""}
          </h1>
          {estDA && (
            <p className="text-brand-gray mt-1.5 text-base">
              Gestion du corps professoral.
            </p>
          )}
          {/* Gel : intégré ici (au lieu d'une bande pleine largeur isolée) pour
              ne pas manger une ligne entière au-dessus du tableau. */}
          {estCDD && gelEffectifPourCDD && (
            <p className="text-brand-orange mt-1.5 text-xs font-bold">
              Gestion temporairement indisponible.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {estDA && gel && (
            <div className="border-brand-gray/20 flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs">
              <span className="text-brand-gray">
                Gestion CDD :{" "}
                <strong className="text-brand-anthracite">
                  {/* {gel.effectif ? "gelée" : "ouverte"} */}
                </strong>
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={toggleGel}
                disabled={modifierGel.isPending}
              >
                {gel.actif ? "Lever le gel" : "Geler"}
              </Button>
            </div>
          )}
          {peutGerer && (
            <Button
              type="button"
              onClick={() => setFormulaireOuvert((o) => !o)}
            >
              <span className="flex items-center gap-1.5 px-3 py-2">
                <Plus size={14} />
                {formulaireOuvert ? "Annuler" : "Nouvel enseignant"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {estDA && departements && departements.length > 0 && (
        <div className="border-brand-gray/15 bg-brand-white flex shrink-0 flex-wrap items-center gap-2 rounded-lg border p-2.5">
          <button
            type="button"
            onClick={() => {
              setFiltreDepartement("");
              setPage(1);
            }}
            className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${filtreDepartement === ""
                ? "bg-brand-orange border-brand-orange text-white shadow-sm"
                : "border-brand-gray/30 text-brand-anthracite hover:border-brand-orange hover:text-brand-orange"
              }`}
          >
            Tous
          </button>
          {departements.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setFiltreDepartement(d.id);
                setPage(1);
              }}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${filtreDepartement === d.id
                  ? "bg-brand-orange border-brand-orange text-white shadow-sm"
                  : "border-brand-gray/30 text-brand-anthracite hover:border-brand-orange hover:text-brand-orange"
                }`}
            >
              {d.nom} : {compteursParDepartement.get(d.id) ?? 0}
            </button>
          ))}
        </div>
      )}

      {formulaireOuvert && peutGerer && (
        <Card className="shrink-0 p-6">
          <h2 className="text-brand-anthracite mb-4 text-sm font-bold uppercase">
            Nouvel enseignant
          </h2>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Nom"
                error={errors.nom?.message}
                {...register("nom")}
              />
              <Input
                label="Prénom"
                error={errors.prenom?.message}
                {...register("prenom")}
              />
              <Input
                label="Matricule"
                placeholder="Ex : ENS-011"
                error={errors.matricule?.message}
                {...register("matricule")}
              />
              <Input
                label="Coût par séance (FCFA)"
                type="number"
                step="0.01"
                error={errors.coutParSeance?.message}
                {...register("coutParSeance", { valueAsNumber: true })}
              />
            </div>

            {estDA ? (
              <div>
                <p className="text-brand-anthracite mb-1.5 text-xs font-bold tracking-wide uppercase">
                  Départements (facultatif, {MAX_DEPARTEMENTS_A_LA_CREATION}{" "}
                  max)
                </p>
                <div className="flex flex-wrap gap-2">
                  {departements?.map((d) => {
                    const choisi = departementsChoisis.includes(d.id);
                    const desactive =
                      !choisi &&
                      departementsChoisis.length >=
                      MAX_DEPARTEMENTS_A_LA_CREATION;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        disabled={desactive}
                        onClick={() => toggleDepartementChoisi(d.id)}
                        className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${choisi
                            ? "bg-brand-orange border-brand-orange text-white"
                            : "border-brand-gray/30 text-brand-anthracite hover:border-brand-orange"
                          }`}
                      >
                        {d.nom}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-brand-gray text-xs">
                Sera automatiquement rattaché au département{" "}
                <strong>{departementCDD?.nom ?? "—"}</strong> pour la session
                active.
              </p>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer"}
            </Button>
            {errors.root && (
              <p className="text-sm font-bold text-red-600">
                {errors.root.message}
              </p>
            )}
          </form>
        </Card>
      )}

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="border-brand-gray/20 flex flex-1 items-center gap-2 rounded-md border bg-white px-3 py-2">
          <Search size={14} className="text-brand-gray" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un nom, un matricule..."
            className="w-full text-sm outline-none"
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => {
            setFiltreStatut(e.target.value as "TOUS" | "ACTIF" | "SUSPENDU");
            setPage(1);
          }}
          className="border-brand-gray/30 rounded-md border bg-white px-3 py-2 text-sm"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="ACTIF">Actif</option>
          <option value="SUSPENDU">Suspendu</option>
        </select>
      </div>

      {/* flex-1 + min-h-0 : cette Card (et non la page) absorbe tout l'espace
          restant — seul le tableau à l'intérieur scrolle (en-tête sticky), le
          reste de l'écran (filtres au-dessus, pagination en dessous) ne
          bouge pas. */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-anthracite text-brand-white sticky top-0 z-10">
              <tr>
                {[
                  "Nom & Prénom",
                  "Matricule",
                  "Département(s)",
                  "Coût / séance",
                  "Statut",
                  "Actions",
                ].map((titre) => (
                  <th
                    key={titre}
                    className="p-2.5 text-xs font-bold tracking-wide uppercase"
                  >
                    {titre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-brand-gray/10 divide-y">
              {chargement && (
                <tr>
                  <td colSpan={6} className="text-brand-gray p-5 text-center">
                    Chargement...
                  </td>
                </tr>
              )}
              {!chargement && enseignantsFiltres?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-brand-gray p-5 text-center">
                    Aucun enseignant ne correspond.
                  </td>
                </tr>
              )}
              {enseignantsPage?.map((e) => {
                const deps = departementsParEnseignant.get(e.id) ?? [];
                return (
                  <tr key={e.id} className="even:bg-brand-gray/[0.04]">
                    <td className="p-2.5">
                      <span className="text-brand-anthracite text-sm font-bold">
                        {e.prenom} {e.nom}
                      </span>
                    </td>
                    <td className="text-brand-gray p-2.5 text-sm">
                      {e.matricule}
                    </td>
                    <td className="text-brand-gray p-2.5 text-sm">
                      {deps.length > 0
                        ? deps.map((d) => d.nom).join(", ")
                        : "—"}
                    </td>
                    <td className="text-brand-gray p-2.5 text-sm">
                      {FORMATEUR_FCFA.format(e.coutParSeance)} FCFA
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${e.statut === "ACTIF"
                            ? "bg-green-100 text-green-800"
                            : "bg-brand-gray/10 text-brand-gray"
                          }`}
                      >
                        {e.statut === "ACTIF" ? "Actif" : "Suspendu"}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/enseignants/${e.id}`}
                          title="Voir le détail"
                          className={iconButtonClass()}
                        >
                          <Eye size={18} />
                        </Link>
                        {peutGerer && (
                          <>
                            <Link
                              href={`/enseignants/${e.id}?edit=1`}
                              title="Modifier"
                              className={iconButtonClass()}
                            >
                              <Pencil size={18} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleStatut(e)}
                              disabled={
                                suspendre.isPending || reactiver.isPending
                              }
                              title={
                                e.statut === "ACTIF" ? "Suspendre" : "Réactiver"
                              }
                              className={iconButtonClass()}
                            >
                              {e.statut === "ACTIF" ? (
                                <Ban size={18} />
                              ) : (
                                <RotateCcw size={18} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={setPage}
          totalItems={enseignantsFiltres?.length ?? 0}
          pageSize={TAILLE_PAGE}
          label="enseignant"
        />
      </Card>
    </div>
  );
}
