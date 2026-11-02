"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Plus,
  Search,
  Ban,
  RotateCcw,
  Eye,
  Pencil,
  Users,
  UserCheck,
  UserX,
  Coins,
  Building2,
  X,
  Filter,
  MoreVertical,
  Copy,
  ChevronDown,
} from "lucide-react";

import {
  Button,
  Card,
  Input,
  Pagination,
  Modal,
  SortableHeader,
} from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import { compareStrings, compareNumbers, type SortDirection } from "@/shared/lib/sort-utils";
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
import {
  useMatieres,
  construireCouleursMatieres,
  getCouleurBadgeStyle,
} from "@/modules/matieres";
import { useSessionActive } from "@/modules/centres-sessions";
import {
  useRostersDepartements,
  useAjouterEnseignantRoster,
} from "@/modules/affectation-departementale";
import { useAffectationsParCentre } from "@/modules/affectation";
import {
  useGelEnseignants,
  useModifierGelEnseignants,
} from "@/modules/gel-enseignants";
import { CopierRosterModal } from "../_dashboards/CopierRosterModal";
import type { Role } from "@/types/roles";

type Props = {
  role: Role;
  departementIdCDD: string | null;
  centreIdCC: string | null;
};

const MAX_DEPARTEMENTS_A_LA_CREATION = 2;
const FORMATEUR_FCFA = new Intl.NumberFormat("fr-FR");
const TAILLE_PAGE = 10;

const AVATAR_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-orange-50 text-brand-orange border-orange-200",
];

function getAvatarStyles(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(prenom: string, nom: string) {
  const p = prenom?.trim() ? prenom.trim()[0] : "";
  const n = nom?.trim() ? nom.trim()[0] : "";
  return (p + n).toUpperCase() || "E";
}

function ActionsEnseignantMenu({
  enseignant,
  peutGerer,
  onToggleStatut,
  isPendingStatut,
}: {
  enseignant: Enseignant;
  peutGerer: boolean;
  onToggleStatut: () => void;
  isPendingStatut: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center justify-end gap-1">
        {/* Action fréquente principale : Consulter la fiche */}
        <Link
          href={`/enseignants/${enseignant.id}`}
          title="Consulter le profil détaillé"
          className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-colors"
        >
          <Eye size={17} />
        </Link>

        {peutGerer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOuvert((o) => !o);
            }}
            title="Options avancées"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical size={17} />
          </button>
        )}
      </div>

      {ouvert && peutGerer && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              setOuvert(false);
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 z-40 mt-1 w-52 rounded-xl border border-slate-200/80 bg-white py-1.5 shadow-xl text-left"
          >
            <Link
              href={`/enseignants/${enseignant.id}?edit=1`}
              onClick={() => setOuvert(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil size={14} className="text-slate-400" />
              Modifier les informations
            </Link>

            {/* Séparateur pour isoler les actions rares et critiques */}
            <div className="my-1 border-t border-slate-100" />

            {/* Action rare / sensible (suspension / réactivation discrète) */}
            <button
              type="button"
              disabled={isPendingStatut}
              onClick={() => {
                setOuvert(false);
                onToggleStatut();
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors text-left ${
                enseignant.statut === "ACTIF"
                  ? "text-rose-600 hover:bg-rose-50"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {enseignant.statut === "ACTIF" ? (
                <>
                  <Ban size={14} className="text-rose-500" />
                  Suspendre l&apos;enseignant
                </>
              ) : (
                <>
                  <RotateCcw size={14} className="text-emerald-500" />
                  Réactiver l&apos;enseignant
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function EnseignantsListView({
  role,
  departementIdCDD,
  centreIdCC,
}: Props) {
  const estDA = role === "DIRECTEUR_ACADEMIQUE";
  const estCDD = role === "CHEF_DEPARTEMENT";
  const estCC = role === "CHEF_CENTRE";

  const { data: gel } = useGelEnseignants();
  // Le gel bloque uniquement le CDD ; tant que l'état n'est pas encore chargé, on
  // reste fermé par défaut pour éviter un flash de boutons actifs.
  const gelEffectifPourCDD = estCDD && (gel === undefined || gel.effectif);
  const peutGerer = estDA || (estCDD && !gelEffectifPourCDD);

  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;
  const {
    data: enseignants,
    isLoading: chargementEnseignants,
    isError: erreurEnseignants,
    refetch: rechargerEnseignants,
  } = useEnseignants();
  const { data: departements } = useDepartements();
  const { data: matieres = [] } = useMatieres();

  const couleursMatieres = useMemo(
    () => construireCouleursMatieres(matieres),
    [matieres],
  );

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const mesDepartementsCDD = useMemo(() => {
    if (!departements) return [];
    return departements.filter(
      (d) =>
        (userId && d.chefId === userId) ||
        (departementIdCDD && d.id === departementIdCDD),
    );
  }, [departements, userId, departementIdCDD]);

  const departementIds = useMemo(() => {
    if (estDA) return departements?.map((d) => d.id) ?? [];
    if (estCDD) return mesDepartementsCDD.map((d) => d.id);
    return [];
  }, [estDA, estCDD, departements, mesDepartementsCDD]);

  const { data: roster, isLoading: chargementRosters } = useRostersDepartements(
    departementIds,
    sessionId,
  );

  // Chef de Centre : pas de rattachement département - le périmètre est déterminé
  // par les créneaux effectivement planifiés dans son centre (l'enseignant n'a pas
  // de lien direct avec un centre dans le modèle de données, seulement via ses
  // affectations).
  const { data: affectationsCentre, isLoading: chargementAffectationsCentre } =
    useAffectationsParCentre(estCC ? (centreIdCC ?? undefined) : undefined, sessionId);
  const idsEnseignantsDuCentre = useMemo(() => {
    if (!affectationsCentre) return new Set<string>();
    return new Set(
      affectationsCentre
        .map((a) => a.enseignantId)
        .filter((id): id is string => Boolean(id)),
    );
  }, [affectationsCentre]);

  // Le roster n'a pas d'endpoint "par enseignant" - on combine ici les rosters
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

  // Tri
  type ColonneTriEnseignants = "nom" | "matricule" | "departement" | "cout" | "statut";
  const [triColonne, setTriColonne] = useState<ColonneTriEnseignants>("nom");
  const [triDirection, setTriDirection] = useState<SortDirection>("asc");

  function handleTri(colonne: ColonneTriEnseignants) {
    if (triColonne === colonne) {
      setTriDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriColonne(colonne);
      setTriDirection("asc");
    }
    setPage(1);
  }

  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [isCopierModalOpen, setIsCopierModalOpen] = useState(false);
  const [menuCreationOuvert, setMenuCreationOuvert] = useState(false);
  const menuCreationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickDehors(event: MouseEvent) {
      if (
        menuCreationRef.current &&
        !menuCreationRef.current.contains(event.target as Node)
      ) {
        setMenuCreationOuvert(false);
      }
    }
    document.addEventListener("mousedown", handleClickDehors);
    return () => document.removeEventListener("mousedown", handleClickDehors);
  }, []);

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
        if (!estDA) {
          const cibles =
            departementsChoisis.length > 0
              ? departementsChoisis
              : mesDepartementsCDD[0]?.id
                ? [mesDepartementsCDD[0].id]
                : departementIdCDD
                  ? [departementIdCDD]
                  : [];
          await Promise.all(
            cibles.map((departementId) =>
              ajouterAuRoster.mutateAsync({
                departementId,
                sessionId,
                enseignantId: nouvel.id,
              }),
            ),
          );
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

  // Chef de Département : ne voit que les enseignants de son roster ; Chef de
  // Centre : ne voit que les enseignants ayant au moins une séance planifiée dans
  // son centre (même logique de périmètre restreint que le reste de l'app).
  const enseignantsVisibles = useMemo(() => {
    if (!enseignants) return undefined;
    if (estDA) return enseignants;
    if (estCC) return enseignants.filter((e) => idsEnseignantsDuCentre.has(e.id));
    const ids = new Set(departementsParEnseignant.keys());
    return enseignants.filter((e) => ids.has(e.id));
  }, [enseignants, estDA, estCC, idsEnseignantsDuCentre, departementsParEnseignant]);

  const enseignantsSansDepartement = useMemo(() => {
    if (!enseignants) return [];
    return enseignants.filter(
      (e) => (departementsParEnseignant.get(e.id)?.length ?? 0) === 0,
    );
  }, [enseignants, departementsParEnseignant]);
  const compteSansDepartement = enseignantsSansDepartement.length;

  const stats = useMemo(() => {
    if (!enseignantsVisibles) {
      return { total: 0, actifs: 0, suspendus: 0, coutMoyen: 0, tauxActifs: 0 };
    }
    const total = enseignantsVisibles.length;
    const actifs = enseignantsVisibles.filter((e) => e.statut === "ACTIF").length;
    const suspendus = enseignantsVisibles.filter((e) => e.statut === "SUSPENDU").length;
    const coutTotal = enseignantsVisibles.reduce(
      (acc, e) => acc + (e.coutParSeance || 0),
      0,
    );
    const coutMoyen = total > 0 ? Math.round(coutTotal / total) : 0;
    const tauxActifs = total > 0 ? Math.round((actifs / total) * 100) : 0;
    return { total, actifs, suspendus, coutMoyen, tauxActifs };
  }, [enseignantsVisibles]);

  const enseignantsFiltres = useMemo(() => {
    if (!enseignantsVisibles) return undefined;
    const filtres = enseignantsVisibles.filter((e) => {
      if (filtreStatut !== "TOUS" && e.statut !== filtreStatut) return false;
      if (filtreDepartement === "SANS_DEPARTEMENT") {
        const deps = departementsParEnseignant.get(e.id) ?? [];
        if (deps.length > 0) return false;
      } else if (filtreDepartement) {
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

    return [...filtres].sort((a, b) => {
      let cmp = 0;
      if (triColonne === "nom") {
        cmp = compareStrings(`${a.nom} ${a.prenom}`, `${b.nom} ${b.prenom}`);
      } else if (triColonne === "matricule") {
        cmp = compareStrings(a.matricule, b.matricule);
      } else if (triColonne === "departement") {
        const depA = departementsParEnseignant.get(a.id)?.[0]?.nom || "";
        const depB = departementsParEnseignant.get(b.id)?.[0]?.nom || "";
        cmp = compareStrings(depA, depB);
      } else if (triColonne === "cout") {
        cmp = compareNumbers(a.coutParSeance, b.coutParSeance);
      } else if (triColonne === "statut") {
        cmp = compareStrings(a.statut, b.statut);
      }
      return triDirection === "asc" ? cmp : -cmp;
    });
  }, [
    enseignantsVisibles,
    filtreStatut,
    filtreDepartement,
    recherche,
    departementsParEnseignant,
    triColonne,
    triDirection,
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

  const departementCDD =
    mesDepartementsCDD[0] ?? departements?.find((d) => d.id === departementIdCDD);
  const chargement =
    chargementEnseignants ||
    (estCC ? chargementAffectationsCentre : chargementRosters || !roster);

  async function toggleGel() {
    if (!gel) return;
    await modifierGel.mutateAsync({
      actif: !gel.actif,
      dateFin: gel.actif ? null : gel.dateFin,
    });
  }

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* ── En-tête Sobre & Compact ── */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Enseignants
            {estCDD && mesDepartementsCDD.length > 0
              ? ` · ${mesDepartementsCDD.map((d) => d.nom).join(" & ")}`
              : ""}
          </h1>
          <p className="text-xs text-slate-500">
            {estDA
              ? "Gestion du corps professoral, compétences et rémunérations de séance"
              : estCC
                ? "Intervenants et chargés de cours dans votre centre"
                : "Enseignants rattachés à vos départements pédagogiques"}
          </p>
          {estCDD && gelEffectifPourCDD && (
            <p className="text-amber-700 mt-1 text-xs font-semibold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Assignations temporairement verrouillées par la direction académique.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {estDA && gel && (
            <div className="border border-slate-200 bg-white shadow-2xs flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 text-[11px] font-medium">Gel assignations :</span>
              <span
                className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                  gel.actif ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {gel.actif ? "Actif" : "Ouvert"}
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={toggleGel}
                disabled={modifierGel.isPending}
                className="text-[11px] px-2 py-0.5 h-auto font-semibold"
              >
                {gel.actif ? "Lever" : "Geler"}
              </Button>
            </div>
          )}

          {peutGerer && (
            <div className="relative inline-flex items-center rounded-lg shadow-2xs" ref={menuCreationRef}>
              <button
                type="button"
                onClick={() => setFormulaireOuvert(true)}
                className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-brand-orange/90 text-white px-3 py-1.5 rounded-l-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Nouvel enseignant</span>
              </button>
              <button
                type="button"
                onClick={() => setMenuCreationOuvert((prev) => !prev)}
                className="bg-brand-orange hover:bg-brand-orange/90 text-white px-2 py-1.5 rounded-r-lg border-l border-white/20 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer"
                title="Options"
                aria-label="Options de création"
              >
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${
                    menuCreationOuvert ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuCreationOuvert && (
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-white p-1.5 shadow-xl border border-slate-200 z-50 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuCreationOuvert(false);
                      setFormulaireOuvert(true);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-orange-50 hover:text-brand-orange text-slate-700 font-semibold cursor-pointer text-left"
                  >
                    <Plus size={14} className="text-brand-orange" />
                    <span>Créer un nouvel enseignant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuCreationOuvert(false);
                      setIsCopierModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-orange-50 hover:text-brand-orange text-slate-700 font-semibold cursor-pointer text-left border-t border-slate-100"
                  >
                    <Copy size={14} className="text-brand-orange" />
                    <span>Copier le roster de la session N-1</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Synthèse Métier ERP Sobre ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-3 sm:gap-0 text-xs">
          <div className="sm:px-3 first:pl-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Effectif Total
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-xs text-slate-400">enregistrés</span>
            </div>
          </div>

          <div className="sm:px-3">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Actifs en cours
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-700">{stats.actifs}</span>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                {stats.tauxActifs}%
              </span>
            </div>
          </div>

          <div className="sm:px-3 pt-2 sm:pt-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Suspendus
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-xl font-bold ${stats.suspendus > 0 ? "text-amber-700" : "text-slate-900"}`}>
                {stats.suspendus}
              </span>
              <span className="text-xs text-slate-400">inactifs</span>
            </div>
          </div>

          <div className="sm:px-3 pt-2 sm:pt-0">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Rémunération Moyenne
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900">
                {FORMATEUR_FCFA.format(stats.coutMoyen)}
              </span>
              <span className="text-xs text-slate-400">FCFA / séance</span>
            </div>
          </div>
        </div>
      </div>


      {/* Pop-up / Modal pour la création d'un nouvel enseignant */}
      <Modal
        isOpen={formulaireOuvert && peutGerer}
        onClose={() => {
          setFormulaireOuvert(false);
          reset();
        }}
        title="Créer un nouvel enseignant"
        description="Renseignez les informations administratives, académiques et contractuelles."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {/* Option de copie rapide depuis la session précédente */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-brand-orange flex items-center justify-center shrink-0">
                <Copy size={14} />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">
                  Reconduire l&apos;équipe existante ?
                </span>
                <span className="text-[11px] text-slate-500">
                  Copiez les enseignants d&apos;une session passée en un clic
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormulaireOuvert(false);
                reset();
                setIsCopierModalOpen(true);
              }}
              className="px-3 py-1.5 font-bold text-brand-orange bg-white border border-orange-200 rounded-lg shadow-2xs hover:bg-orange-50 transition-colors flex items-center gap-1.5 shrink-0 text-xs cursor-pointer"
            >
              <Copy size={13} />
              <span>Copier Roster N-1</span>
            </button>
          </div>

          {/* Section 1 : Identité & Rémunération */}
          <div>
            <h3 className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-3">
              1. Identité & Rémunération
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Nom *"
                placeholder="Ex : Kamdem"
                error={errors.nom?.message}
                {...register("nom")}
              />
              <Input
                label="Prénom *"
                placeholder="Ex : André"
                error={errors.prenom?.message}
                {...register("prenom")}
              />
              <Input
                label="Matricule *"
                placeholder="Ex : ENS-015"
                error={errors.matricule?.message}
                {...register("matricule")}
              />
              <Input
                label="Coût par séance (FCFA) *"
                type="number"
                step="500"
                placeholder="Ex : 5000"
                error={errors.coutParSeance?.message}
                {...register("coutParSeance", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Section 2 : Contact & Pièce d'identité */}
          <div className="border-t border-brand-gray/10 pt-4">
            <h3 className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-3">
              2. Coordonnées & Identification
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Numéro de téléphone"
                type="tel"
                placeholder="Ex : 699123456"
                error={errors.telephone?.message}
                {...register("telephone")}
              />
              <Input
                label="Numéro de CNI"
                placeholder="Ex : 102938475"
                error={errors.numeroCni?.message}
                {...register("numeroCni")}
              />
            </div>
          </div>

          {/* Section 3 : Profil Académique & Recrutement */}
          <div className="border-t border-brand-gray/10 pt-4">
            <h3 className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-3">
              3. Profil Académique & Recrutement
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="École / Fonction"
                placeholder="Ex : ENS Yaoundé"
                error={errors.ecoleFonction?.message}
                {...register("ecoleFonction")}
              />
              <Input
                label="Niveau / Grade"
                placeholder="Ex : Doctorat, PLEG"
                error={errors.niveauGrade?.message}
                {...register("niveauGrade")}
              />
              <Input
                label="Date de recrutement"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                error={errors.dateRecrutement?.message}
                {...register("dateRecrutement")}
              />
            </div>
          </div>

          {/* Section 4 : Rattachement Départemental */}
          <div className="border-t border-brand-gray/10 pt-4">
            <h3 className="text-xs font-bold text-brand-orange uppercase tracking-wider mb-2">
              4. Rattachement
            </h3>
            {estDA ? (
              <div>
                <p className="text-brand-gray text-xs mb-2">
                  Sélectionnez jusqu&apos;à {MAX_DEPARTEMENTS_A_LA_CREATION} départements pour cette session :
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
                        className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          choisi
                            ? "bg-brand-orange border-brand-orange text-white shadow-sm"
                            : "border-brand-gray/30 text-brand-anthracite hover:border-brand-orange"
                        }`}
                      >
                        {d.nom}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : mesDepartementsCDD.length > 1 ? (
              <div>
                <p className="text-brand-gray text-xs mb-2">
                  Sélectionnez le ou les départements de rattachement (max {MAX_DEPARTEMENTS_A_LA_CREATION}) :
                </p>
                <div className="flex flex-wrap gap-2">
                  {mesDepartementsCDD.map((d) => {
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
                        className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          choisi
                            ? "bg-brand-orange border-brand-orange text-white shadow-sm"
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
                <strong className="text-brand-anthracite">{departementCDD?.nom ?? "-"}</strong> pour la session active.
              </p>
            )}
          </div>

          {errors.root && (
            <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600 border border-red-200">
              {errors.root.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-gray/10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFormulaireOuvert(false);
                reset();
              }}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer l'enseignant"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Barre d'outils Recherche & Filtres */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-1 items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 transition-all focus-within:border-brand-orange focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-orange/10">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par nom, prénom, matricule..."
            className="w-full text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
          />
          {recherche && (
            <button
              type="button"
              onClick={() => {
                setRecherche("");
                setPage(1);
              }}
              title="Effacer la recherche"
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtre déroulant Département (Directeur Académique) */}
          {estDA && departements && departements.length > 0 && (
            <div className="relative">
              <select
                value={filtreDepartement}
                onChange={(e) => {
                  setFiltreDepartement(e.target.value);
                  setPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 cursor-pointer shadow-2xs hover:border-slate-300 transition-colors"
              >
                <option value="" className="bg-white text-slate-800">Tous les départements ({stats.total})</option>
                <option value="SANS_DEPARTEMENT" className="bg-white text-slate-800">
                  Sans département ({compteSansDepartement})
                </option>
                {departements.map((d) => {
                  const compte = compteursParDepartement.get(d.id) ?? 0;
                  return (
                    <option key={d.id} value={d.id} className="bg-white text-slate-800">
                      {d.nom} ({compte})
                    </option>
                  );
                })}
              </select>
              <Building2
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          )}

          {/* Filtre déroulant Département (Chef de département à la tête de plusieurs départements) */}
          {estCDD && mesDepartementsCDD.length > 1 && (
            <div className="relative">
              <select
                value={filtreDepartement}
                onChange={(e) => {
                  setFiltreDepartement(e.target.value);
                  setPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 cursor-pointer shadow-2xs hover:border-slate-300 transition-colors"
              >
                <option value="" className="bg-white text-slate-800">Tous mes départements ({stats.total})</option>
                {mesDepartementsCDD.map((d) => {
                  const compte = compteursParDepartement.get(d.id) ?? 0;
                  return (
                    <option key={d.id} value={d.id} className="bg-white text-slate-800">
                      {d.nom} ({compte})
                    </option>
                  );
                })}
              </select>
              <Building2
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          )}

          <div className="relative">
            <select
              value={filtreStatut}
              onChange={(e) => {
                setFiltreStatut(e.target.value as "TOUS" | "ACTIF" | "SUSPENDU");
                setPage(1);
              }}
              className="appearance-none bg-white border border-slate-200 rounded-xl pl-3.5 pr-8 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 cursor-pointer shadow-2xs hover:border-slate-300 transition-colors"
            >
              <option value="TOUS" className="bg-white text-slate-800">Tous les statuts</option>
              <option value="ACTIF" className="bg-white text-slate-800">Actif uniquement</option>
              <option value="SUSPENDU" className="bg-white text-slate-800">Suspendu uniquement</option>
            </select>
            <Filter
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {(recherche || filtreDepartement || filtreStatut !== "TOUS") && (
            <button
              type="button"
              onClick={() => {
                setRecherche("");
                setFiltreDepartement("");
                setFiltreStatut("TOUS");
                setPage(1);
              }}
              className="text-sm font-bold text-slate-500 hover:text-brand-orange flex items-center gap-1.5 px-3 py-2.5 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <RotateCcw size={12} />
              Réinitialiser
            </button>
          )}

        </div>
      </div>

      {/* Tableau complet des enseignants */}
      <Card className="overflow-hidden border border-slate-200/80 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 shadow-xs">
              <tr>
                <SortableHeader
                  columnKey="nom"
                  currentSortKey={triColonne}
                  direction={triDirection}
                  onSort={handleTri}
                  className="px-5 py-3.5"
                >
                  Enseignant
                </SortableHeader>
                <SortableHeader
                  columnKey="matricule"
                  currentSortKey={triColonne}
                  direction={triDirection}
                  onSort={handleTri}
                  className="px-4 py-3.5"
                >
                  Matricule
                </SortableHeader>
                {!estCC && (
                  <SortableHeader
                    columnKey="departement"
                    currentSortKey={triColonne}
                    direction={triDirection}
                    onSort={handleTri}
                    className="px-4 py-3.5"
                  >
                    Département(s)
                  </SortableHeader>
                )}
                <SortableHeader
                  columnKey="cout"
                  currentSortKey={triColonne}
                  direction={triDirection}
                  onSort={handleTri}
                  className="px-4 py-3.5"
                >
                  Contrat
                </SortableHeader>
                <SortableHeader
                  columnKey="statut"
                  currentSortKey={triColonne}
                  direction={triDirection}
                  onSort={handleTri}
                  className="px-4 py-3.5"
                >
                  Statut
                </SortableHeader>
                <th className="px-5 py-3.5 text-right text-xs font-bold tracking-wider uppercase text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {erreurEnseignants && (
                <tr>
                  <td colSpan={estCC ? 5 : 6} className="p-8 text-center text-red-600">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-sm font-semibold">
                        Impossible de charger les enseignants pour le moment.
                      </p>
                      <button
                        type="button"
                        onClick={() => rechargerEnseignants()}
                        className="text-brand-orange hover:underline text-xs font-bold"
                      >
                        Réessayer le chargement
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Squelette de chargement animé */}
              {!erreurEnseignants && chargement && (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse border-b border-slate-100">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-slate-200 rounded" />
                          <div className="h-3 w-20 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-16 bg-slate-100 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-5 w-24 bg-slate-100 rounded-full" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-20 bg-slate-200 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-6 w-16 bg-slate-100 rounded-full" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <div className="h-7 w-7 bg-slate-100 rounded" />
                        <div className="h-7 w-7 bg-slate-100 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {/* État vide illustré */}
              {!erreurEnseignants &&
                !chargement &&
                (!enseignantsFiltres || enseignantsFiltres.length === 0) && (
                  <tr>
                    <td colSpan={estCC ? 5 : 6} className="py-12 text-center">
                      <div className="mx-auto max-w-sm flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-orange-50 text-brand-orange border border-orange-100 flex items-center justify-center mb-3">
                          <Search size={22} />
                        </div>
                        <p className="text-sm font-bold text-slate-800">
                          Aucun enseignant ne correspond aux critères
                        </p>
                        <p className="text-xs text-slate-400 mt-1 mb-4">
                          Modifiez vos critères de recherche ou réinitialisez les filtres.
                        </p>
                        {(recherche || filtreDepartement || filtreStatut !== "TOUS") && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setRecherche("");
                              setFiltreDepartement("");
                              setFiltreStatut("TOUS");
                              setPage(1);
                            }}
                          >
                            <span className="flex items-center gap-1.5 text-xs font-bold">
                              <RotateCcw size={13} />
                              Réinitialiser les filtres
                            </span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

              {/* Liste des enseignants */}
              {enseignantsPage?.map((e) => {
                const deps = departementsParEnseignant.get(e.id) ?? [];
                const roleAffichage =
                 (e.telephone ? `Tél : ${e.telephone}` : "Enseignant")    ||
                  e.niveauGrade ||
                  e.ecoleFonction;
                return (
                  <tr
                    key={e.id}
                    className="group hover:bg-amber-50/70 transition-colors duration-150 border-b border-slate-100 last:border-0"
                  >
                    {/* 1. Nom, Prénom & Avatar */}
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/enseignants/${e.id}`}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 transition-transform group-hover:scale-105 ${getAvatarStyles(
                            `${e.prenom} ${e.nom}`,
                          )}`}
                        >
                          {getInitials(e.prenom, e.nom)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-brand-orange transition-colors">
                            {e.prenom} {e.nom}
                          </p>
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">
                            {roleAffichage}
                          </p>
                        </div>
                      </Link>
                    </td>

                    {/* 2. Matricule */}
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                      {e.matricule}
                    </td>

                    {/* 3. Département(s) - non pertinent pour le Chef de Centre
                        (l'enseignant n'est pas rattaché à un centre dans le
                        modèle de données, seulement à un département). */}
                    {!estCC && (
                      <td className="px-4 py-3.5">
                        {deps.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {deps.map((d) => {
                              const couleur = d.matiereId
                                ? couleursMatieres.get(d.matiereId)
                                : undefined;
                              return (
                                <span
                                  key={d.id}
                                  style={
                                    couleur?.hex
                                      ? getCouleurBadgeStyle(couleur.hex)
                                      : undefined
                                  }
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                                    couleur
                                      ? couleur.badge
                                      : "bg-orange-50 text-brand-orange border-orange-200/70"
                                  }`}
                                >
                                  {d.nom}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                            Sans département
                          </span>
                        )}
                      </td>
                    )}

                    {/* 4. Rémunération */}
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-bold text-slate-900">
                        {FORMATEUR_FCFA.format(e.coutParSeance)}{" "}
                        <span className="text-[11px] font-normal text-slate-400">
                          FCFA
                        </span>
                      </div>
                    </td>

                    {/* 5. Statut */}
                    <td className="px-4 py-3.5">
                      {e.statut === "ACTIF" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Suspendu
                        </span>
                      )}
                    </td>

                    {/* 6. Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <ActionsEnseignantMenu
                        enseignant={e}
                        peutGerer={peutGerer}
                        onToggleStatut={() => toggleStatut(e)}
                        isPendingStatut={
                          suspendre.isPending || reactiver.isPending
                        }
                      />
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

      {sessionId && (
        <CopierRosterModal
          isOpen={isCopierModalOpen}
          onClose={() => setIsCopierModalOpen(false)}
          departementId={
            estCDD && mesDepartementsCDD.length === 1
              ? mesDepartementsCDD[0].id
              : undefined
          }
          departementNom={
            estCDD && mesDepartementsCDD.length === 1
              ? mesDepartementsCDD[0].nom
              : undefined
          }
          departementsDisponibles={
            estCDD ? mesDepartementsCDD : (departements || [])
          }
          sessionCibleId={sessionId}
          sessionCibleNom={sessionActive?.annee}
          onSuccess={() => {
            rechargerEnseignants();
          }}
        />
      )}
    </div>
  );
}


