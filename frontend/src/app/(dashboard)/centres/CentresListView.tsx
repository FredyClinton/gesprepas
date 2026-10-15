"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  Ban,
  RotateCcw,
  Pencil,
  Trash2,
  CalendarRange,
  ArrowRight,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
  X,
  Compass,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Card, Input, Modal } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import {
  useCentres,
  useSessions,
  useSessionActive,
  useCreerCentre,
  useRenommerCentre,
  useRelocaliserCentre,
  useFermerCentre,
  useRouvrirCentre,
  useSupprimerCentre,
  useRejoindreSession,
  type Centre,
} from "@/modules/centres-sessions";

// Form schemas
const creerCentreSchema = z.object({
  nom: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  villeInitiale: z.string().min(2, "La ville doit comporter au moins 2 caractères"),
  adresseInitiale: z.string().min(3, "L'adresse doit comporter au moins 3 caractères"),
});
type CreerCentreForm = z.infer<typeof creerCentreSchema>;

const renommerCentreSchema = z.object({
  nom: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
});
type RenommerCentreForm = z.infer<typeof renommerCentreSchema>;

const relocaliserCentreSchema = z.object({
  ville: z.string().min(2, "La ville doit comporter au moins 2 caractères"),
  adresse: z.string().min(3, "L'adresse doit comporter au moins 3 caractères"),
});
type RelocaliserCentreForm = z.infer<typeof relocaliserCentreSchema>;

export function CentresListView() {
  const { data: centres = [], isLoading: chargementCentres } = useCentres();
  const { data: sessions = [] } = useSessions();
  const { data: sessionActive } = useSessionActive();

  // Mutations
  const creerMutation = useCreerCentre();
  const renommerMutation = useRenommerCentre();
  const relocaliserMutation = useRelocaliserCentre();
  const fermerMutation = useFermerCentre();
  const rouvrirMutation = useRouvrirCentre();
  const supprimerMutation = useSupprimerCentre();
  const rejoindreSessionMutation = useRejoindreSession();

  // Local UI states
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<"TOUS" | "OUVERT" | "FERME">("TOUS");
  const [filtreVille, setFiltreVille] = useState<string>("TOUTES");
  const [vueFormat, setVueFormat] = useState<"grille" | "tableau">("grille");

  // Modals state
  const [modalCreerOuverte, setModalCreerOuverte] = useState(false);
  const [centreAModifier, setCentreAModifier] = useState<Centre | null>(null);
  const [centreARelocaliser, setCentreARelocaliser] = useState<Centre | null>(null);
  const [centreARattacher, setCentreARattacher] = useState<Centre | null>(null);
  const [centreASupprimer, setCentreASupprimer] = useState<Centre | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const [erreurAction, setErreurAction] = useState<string | null>(null);

  // Villes uniques
  const villesDisponibles = useMemo(() => {
    const set = new Set<string>();
    centres.forEach((c) => {
      if (c.villeActuelle) set.add(c.villeActuelle);
    });
    return Array.from(set).sort();
  }, [centres]);

  // Statistiques KPIs
  const stats = useMemo(() => {
    const total = centres.length;
    const ouverts = centres.filter((c) => c.statut === "OUVERT").length;
    const fermes = centres.filter((c) => c.statut === "FERME").length;
    const nbVilles = villesDisponibles.length;
    return { total, ouverts, fermes, nbVilles };
  }, [centres, villesDisponibles]);

  // Filtrage
  const centresFiltres = useMemo(() => {
    return centres.filter((c) => {
      const matchRecherche =
        c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
        c.villeActuelle.toLowerCase().includes(recherche.toLowerCase()) ||
        c.adresseActuelle.toLowerCase().includes(recherche.toLowerCase());
      const matchStatut =
        filtreStatut === "TOUS" || c.statut === filtreStatut;
      const matchVille =
        filtreVille === "TOUTES" || c.villeActuelle === filtreVille;
      return matchRecherche && matchStatut && matchVille;
    });
  }, [centres, recherche, filtreStatut, filtreVille]);

  // Forms
  const formCreer = useForm<CreerCentreForm>({
    resolver: zodResolver(creerCentreSchema),
    defaultValues: { nom: "", villeInitiale: "", adresseInitiale: "" },
  });

  const formRenommer = useForm<RenommerCentreForm>({
    resolver: zodResolver(renommerCentreSchema),
  });

  const formRelocaliser = useForm<RelocaliserCentreForm>({
    resolver: zodResolver(relocaliserCentreSchema),
  });

  // Actions
  const handleCreerCentre = async (data: CreerCentreForm) => {
    setErreurAction(null);
    try {
      await creerMutation.mutateAsync(data);
      formCreer.reset();
      setModalCreerOuverte(false);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleOuvrirRenommer = (centre: Centre) => {
    setErreurAction(null);
    setCentreAModifier(centre);
    formRenommer.reset({ nom: centre.nom });
  };

  const handleRenommer = async (data: RenommerCentreForm) => {
    if (!centreAModifier) return;
    setErreurAction(null);
    try {
      await renommerMutation.mutateAsync({ id: centreAModifier.id, nom: data.nom });
      setCentreAModifier(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleOuvrirRelocaliser = (centre: Centre) => {
    setErreurAction(null);
    setCentreARelocaliser(centre);
    formRelocaliser.reset({
      ville: centre.villeActuelle,
      adresse: centre.adresseActuelle,
    });
  };

  const handleRelocaliser = async (data: RelocaliserCentreForm) => {
    if (!centreARelocaliser) return;
    setErreurAction(null);
    try {
      await relocaliserMutation.mutateAsync({
        id: centreARelocaliser.id,
        ville: data.ville,
        adresse: data.adresse,
      });
      setCentreARelocaliser(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleToggleStatut = async (centre: Centre) => {
    setErreurAction(null);
    try {
      if (centre.statut === "OUVERT") {
        await fermerMutation.mutateAsync(centre.id);
      } else {
        await rouvrirMutation.mutateAsync(centre.id);
      }
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleOuvrirRattacher = (centre: Centre) => {
    setErreurAction(null);
    setCentreARattacher(centre);
    // Pré-sélectionner la 1ère session non encore rejointe
    const sessionsNonRejointes = sessions.filter(
      (s) => !centre.sessionIds.includes(s.id),
    );
    setSelectedSessionId(sessionsNonRejointes[0]?.id || "");
  };

  const handleRattacherSession = async () => {
    if (!centreARattacher || !selectedSessionId) return;
    setErreurAction(null);
    try {
      await rejoindreSessionMutation.mutateAsync({
        id: centreARattacher.id,
        sessionId: selectedSessionId,
      });
      setCentreARattacher(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleSupprimer = async () => {
    if (!centreASupprimer) return;
    setErreurAction(null);
    try {
      await supprimerMutation.mutateAsync(centreASupprimer.id);
      setCentreASupprimer(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header avec action principale */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange shadow-sm">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Centres de formation
              </h1>
              <p className="text-sm text-slate-500">
                Gestion des campus EXCELIS, statuts d&rsquo;ouverture, implantations et rattachements
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => {
            setErreurAction(null);
            formCreer.reset();
            setModalCreerOuverte(true);
          }}
          className="shadow-sm"
        >
          <Plus size={18} />
          Nouveau centre
        </Button>
      </div>

      {/* Alerte d'erreur globale si action échouée */}
      {erreurAction && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-red-600" />
            <span>{erreurAction}</span>
          </div>
          <button
            type="button"
            onClick={() => setErreurAction(null)}
            className="text-red-600 hover:text-red-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4.5 border border-slate-200/80 shadow-xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Centres
            </span>
            <span className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Building2 size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {chargementCentres ? "…" : stats.total}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Campus enregistrés</p>
        </Card>

        <Card className="p-4.5 border border-emerald-100 shadow-xs bg-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Centres ouverts
            </span>
            <span className="rounded-lg bg-emerald-100/80 p-2 text-emerald-700">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">
            {chargementCentres ? "…" : stats.ouverts}
          </p>
          <p className="mt-0.5 text-xs text-emerald-700">En activité</p>
        </Card>

        <Card className="p-4.5 border border-slate-200/80 shadow-xs bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Centres fermés
            </span>
            <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
              <Ban size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-700">
            {chargementCentres ? "…" : stats.fermes}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Temporairement inactifs</p>
        </Card>

        <Card className="p-4.5 border border-amber-100 shadow-xs bg-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-orange">
              Villes couvertes
            </span>
            <span className="rounded-lg bg-amber-100/80 p-2 text-brand-orange">
              <MapPin size={18} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {chargementCentres ? "…" : stats.nbVilles}
          </p>
          <p className="mt-0.5 text-xs text-amber-700">Pôles géographiques</p>
        </Card>
      </div>

      {/* Barre d'outils : Recherche, Filtres & Vue */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Recherche */}
        <div className="relative flex-1 sm:max-w-md">
          <Search
            size={18}
            className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="Rechercher un centre, une ville ou une adresse..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
          />
          {recherche && (
            <button
              onClick={() => setRecherche("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtres et mode d'affichage */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Statut Tabs */}
          <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setFiltreStatut("TOUS")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                filtreStatut === "TOUS"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Tous ({centres.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltreStatut("OUVERT")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                filtreStatut === "OUVERT"
                  ? "bg-white text-emerald-700 shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Ouverts ({stats.ouverts})
            </button>
            <button
              type="button"
              onClick={() => setFiltreStatut("FERME")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                filtreStatut === "FERME"
                  ? "bg-white text-slate-700 shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Fermés ({stats.fermes})
            </button>
          </div>

          {/* Filtre Ville */}
          {villesDisponibles.length > 1 && (
            <div className="relative">
              <select
                value={filtreVille}
                onChange={(e) => setFiltreVille(e.target.value)}
                className="h-9 rounded-xl border border-slate-200/80 bg-white px-3 pr-8 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-orange focus:outline-none"
              >
                <option value="TOUTES">Toutes les villes</option>
                {villesDisponibles.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bascule Grille / Tableau */}
          <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 text-slate-600">
            <button
              type="button"
              onClick={() => setVueFormat("grille")}
              title="Vue grille"
              className={`rounded-lg p-1.5 transition-all ${
                vueFormat === "grille"
                  ? "bg-white text-brand-orange shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setVueFormat("tableau")}
              title="Vue tableau"
              className={`rounded-lg p-1.5 transition-all ${
                vueFormat === "tableau"
                  ? "bg-white text-brand-orange shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              <TableIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Liste des centres */}
      {chargementCentres ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="h-6 w-2/3 rounded-md bg-slate-200" />
              <div className="mt-4 h-4 w-1/2 rounded-md bg-slate-100" />
              <div className="mt-8 h-8 rounded-md bg-slate-100" />
            </Card>
          ))}
        </div>
      ) : centresFiltres.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-slate-200">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Building2 size={28} />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            Aucun centre trouvé
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {recherche || filtreStatut !== "TOUS" || filtreVille !== "TOUTES"
              ? "Aucun résultat ne correspond à vos critères de recherche."
              : "Aucun centre n'a encore été configuré. Commencez par créer votre premier campus."}
          </p>
          {(recherche || filtreStatut !== "TOUS" || filtreVille !== "TOUTES") && (
            <button
              onClick={() => {
                setRecherche("");
                setFiltreStatut("TOUS");
                setFiltreVille("TOUTES");
              }}
              className="mt-4 text-xs font-bold text-brand-orange hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </Card>
      ) : vueFormat === "grille" ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {centresFiltres.map((centre) => {
            const rejointSessionActive = sessionActive
              ? centre.sessionIds.includes(sessionActive.id)
              : false;

            return (
              <Card
                key={centre.id}
                className="group relative flex flex-col justify-between overflow-hidden border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md rounded-2xl"
              >
                <div>
                  {/* Top: Avatar, Name, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange/20 to-amber-500/20 text-brand-orange font-bold text-lg border border-brand-orange/30">
                        <Building2 size={24} />
                        <span
                          className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
                            centre.statut === "OUVERT"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                      </div>
                      <div>
                        <Link
                          href={`/centres/${centre.id}`}
                          className="font-bold text-slate-900 hover:text-brand-orange transition-colors text-base line-clamp-1"
                        >
                          {centre.nom}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <MapPin size={13} className="text-brand-orange shrink-0" />
                          <span className="font-semibold text-slate-700">
                            {centre.villeActuelle}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                        centre.statut === "OUVERT"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          centre.statut === "OUVERT"
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />
                      {centre.statut === "OUVERT" ? "Ouvert" : "Fermé"}
                    </span>
                  </div>

                  {/* Adresse actuelle */}
                  <div className="mt-4 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-600 border border-slate-100">
                    <p className="font-medium line-clamp-2 text-slate-700">
                      {centre.adresseActuelle || "Aucune adresse renseignée"}
                    </p>
                  </div>

                  {/* Session badges info */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${
                        rejointSessionActive
                          ? "bg-emerald-100/70 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <CalendarRange size={13} />
                      {rejointSessionActive
                        ? `Session active (${sessionActive?.annee})`
                        : "Non rattaché session en cours"}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 font-medium">
                      {centre.sessionIds.length} session{centre.sessionIds.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    {/* Actions directes */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOuvrirRenommer(centre)}
                        title="Renommer le centre"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOuvrirRelocaliser(centre)}
                        title="Relocaliser (adresse / ville)"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      >
                        <Compass size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatut(centre)}
                        title={centre.statut === "OUVERT" ? "Fermer le centre" : "Rouvrir le centre"}
                        className={`rounded-lg p-2 transition-colors ${
                          centre.statut === "OUVERT"
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {centre.statut === "OUVERT" ? (
                          <Ban size={15} />
                        ) : (
                          <RotateCcw size={15} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOuvrirRattacher(centre)}
                        title="Rattacher à une session"
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-orange transition-colors"
                      >
                        <CalendarRange size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setErreurAction(null);
                          setCentreASupprimer(centre);
                        }}
                        title="Supprimer définitivement"
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Accès fiche détaillée */}
                    <Link
                      href={`/centres/${centre.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:text-brand-orange/80 transition-colors"
                    >
                      Détails
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Vue Tableau */
        <Card className="overflow-hidden border border-slate-200/80 shadow-xs rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Centre & Implantation</th>
                  <th className="px-5 py-3.5">Adresse</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5">Session Active</th>
                  <th className="px-5 py-3.5">Total Sessions</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {centresFiltres.map((centre) => {
                  const rejointSessionActive = sessionActive
                    ? centre.sessionIds.includes(sessionActive.id)
                    : false;

                  return (
                    <tr
                      key={centre.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange font-bold text-sm">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <Link
                              href={`/centres/${centre.id}`}
                              className="font-bold text-slate-900 hover:text-brand-orange transition-colors"
                            >
                              {centre.nom}
                            </Link>
                            <p className="text-xs text-slate-500">
                              {centre.villeActuelle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate">
                        {centre.adresseActuelle || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                            centre.statut === "OUVERT"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              centre.statut === "OUVERT"
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {centre.statut === "OUVERT" ? "Ouvert" : "Fermé"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {rejointSessionActive ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/70 px-2 py-1 font-semibold text-emerald-800">
                            <CheckCircle2 size={13} />
                            Oui ({sessionActive?.annee})
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Non</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                        {centre.sessionIds.length}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOuvrirRenommer(centre)}
                            title="Renommer"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOuvrirRelocaliser(centre)}
                            title="Relocaliser"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Compass size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatut(centre)}
                            title={centre.statut === "OUVERT" ? "Fermer" : "Rouvrir"}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                          >
                            {centre.statut === "OUVERT" ? (
                              <Ban size={15} className="text-amber-600" />
                            ) : (
                              <RotateCcw size={15} className="text-emerald-600" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOuvrirRattacher(centre)}
                            title="Rattacher session"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-orange"
                          >
                            <CalendarRange size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setErreurAction(null);
                              setCentreASupprimer(centre);
                            }}
                            title="Supprimer"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                          <Link
                            href={`/centres/${centre.id}`}
                            className="rounded-lg p-1.5 text-brand-orange hover:bg-brand-orange/10"
                            title="Voir la fiche"
                          >
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* =========================================================
          MODALE : CRÉATION D'UN CENTRE
      ========================================================= */}
      <Modal
        isOpen={modalCreerOuverte}
        onClose={() => setModalCreerOuverte(false)}
        title="Nouveau centre de formation"
        description="Créez un nouveau campus EXCELIS avec sa localisation initiale."
      >
        <form
          onSubmit={formCreer.handleSubmit(handleCreerCentre)}
          className="space-y-4 pt-2"
        >
          <Input
            label="Nom du centre"
            placeholder="Ex : Campus Douala - Bonapriso"
            {...formCreer.register("nom")}
            error={formCreer.formState.errors.nom?.message}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Ville"
              placeholder="Ex : Douala"
              {...formCreer.register("villeInitiale")}
              error={formCreer.formState.errors.villeInitiale?.message}
            />
            <Input
              label="Adresse / Quartier"
              placeholder="Ex : Rue Njo-Njo, face Collège..."
              {...formCreer.register("adresseInitiale")}
              error={formCreer.formState.errors.adresseInitiale?.message}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalCreerOuverte(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={creerMutation.isPending}
            >
              {creerMutation.isPending ? "Création en cours…" : "Créer le centre"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================
          MODALE : RENOMMER UN CENTRE
      ========================================================= */}
      <Modal
        isOpen={Boolean(centreAModifier)}
        onClose={() => setCentreAModifier(null)}
        title="Renommer le centre"
        description="Modifiez la dénomination officielle de ce campus."
      >
        <form
          onSubmit={formRenommer.handleSubmit(handleRenommer)}
          className="space-y-4 pt-2"
        >
          <Input
            label="Nouveau nom du centre"
            placeholder="Ex : Campus Yaoundé - Bastos"
            {...formRenommer.register("nom")}
            error={formRenommer.formState.errors.nom?.message}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCentreAModifier(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={renommerMutation.isPending}
            >
              {renommerMutation.isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================
          MODALE : RELOCALISER UN CENTRE
      ========================================================= */}
      <Modal
        isOpen={Boolean(centreARelocaliser)}
        onClose={() => setCentreARelocaliser(null)}
        title="Relocaliser le centre"
        description="Enregistrez une nouvelle adresse géographique. L'ancienne sera conservée dans l'historique."
      >
        <form
          onSubmit={formRelocaliser.handleSubmit(handleRelocaliser)}
          className="space-y-4 pt-2"
        >
          <Input
            label="Ville"
            placeholder="Ex : Yaoundé"
            {...formRelocaliser.register("ville")}
            error={formRelocaliser.formState.errors.ville?.message}
          />
          <Input
            label="Nouvelle adresse complète"
            placeholder="Ex : Nouvelle rue, Immeuble..."
            {...formRelocaliser.register("adresse")}
            error={formRelocaliser.formState.errors.adresse?.message}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCentreARelocaliser(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={relocaliserMutation.isPending}
            >
              {relocaliserMutation.isPending ? "Relocalisation…" : "Valider la relocalisation"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================
          MODALE : RATTACHER À UNE SESSION
      ========================================================= */}
      <Modal
        isOpen={Boolean(centreARattacher)}
        onClose={() => setCentreARattacher(null)}
        title="Rattacher à une session académique"
        description={`Sélectionnez la session académique à rattacher à ${centreARattacher?.nom}.`}
      >
        <div className="space-y-4 pt-2">
          {sessions.filter((s) => !centreARattacher?.sessionIds.includes(s.id)).length === 0 ? (
            <p className="text-sm text-slate-500 py-3 text-center">
              Ce centre est déjà rattaché à toutes les sessions existantes.
            </p>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-brand-anthracite">
                Session académique
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full rounded-md border border-brand-gray/30 bg-white px-3 py-2 text-sm focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/30 focus:outline-none"
              >
                {sessions
                  .filter((s) => !centreARattacher?.sessionIds.includes(s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      Session {s.annee} ({s.statut === "EN_COURS" ? "En cours" : s.statut})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCentreARattacher(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={rejoindreSessionMutation.isPending || !selectedSessionId}
              onClick={handleRattacherSession}
            >
              {rejoindreSessionMutation.isPending ? "Rattachement…" : "Confirmer le rattachement"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* =========================================================
          MODALE : CONFIRMATION SUPPRESSION
      ========================================================= */}
      <Modal
        isOpen={Boolean(centreASupprimer)}
        onClose={() => setCentreASupprimer(null)}
        title="Supprimer le centre"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-200">
            <AlertTriangle size={20} className="shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Attention : action irréversible</p>
              <p className="mt-1 text-xs text-red-700">
                Vous vous apprêtez à supprimer définitivement le centre{" "}
                <span className="font-bold">{centreASupprimer?.nom}</span>.
                Cette opération échouera si des apprenants ou des données y sont encore rattachés.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCentreASupprimer(null)}
            >
              Annuler
            </Button>
            <button
              type="button"
              disabled={supprimerMutation.isPending}
              onClick={handleSupprimer}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {supprimerMutation.isPending ? "Suppression…" : "Supprimer définitivement"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
