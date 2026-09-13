"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Building2,
  DoorOpen,
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Check,
  ChevronLeft,
  ExternalLink,
  Calendar,
} from "lucide-react";
import {
  useFormation,
  useRenommerFormation,
  useSupprimerFormation,
  useAssocierMatiereFormation,
  useDissocierMatiereFormation,
} from "@/modules/academique";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import {
  useCentresAbonnesFormation,
  useAbonnerCentreFormation,
  useDesabonnerCentreFormation,
} from "@/modules/abonnement";
import {
  useSalles,
  useCreateSalle,
  useRenommerSalle,
  useSupprimerSalle,
  type Salle,
} from "@/modules/salle";
import {
  useMatieres,
  construireCouleursMatieres,
  getCouleurBadgeStyle,
} from "@/modules/matieres";
import { useDepartements } from "@/modules/departement";
import { Button, Card, Modal } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";

function nettoyerMessageErreur(err: unknown, repli: string): string {
  const msg = messageErreurApi(err, repli);
  const sansUuid = msg.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    "",
  );

  const lower = sansUuid.toLowerCase();
  if (
    lower.includes("référencée") ||
    lower.includes("utilisee") ||
    lower.includes("utilisée") ||
    lower.includes("salles sont encore")
  ) {
    return "Cette opération ne peut pas être effectuée car des salles ou des cours y sont encore rattachés.";
  }
  if (lower.includes("déjà abonné") || lower.includes("deja abonne")) {
    return "Ce centre est déjà abonné à cette formation pour cette session.";
  }
  if (lower.includes("rejoint") || lower.includes("non participant")) {
    return "Ce centre n'a pas encore rejoint la session active.";
  }
  if (lower.includes("introuvable")) {
    return "L'élément demandé est introuvable ou a déjà été supprimé.";
  }

  const propre = sansUuid
    .replace(/\b(id|uuid)\b\s*[:=]?\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*:\s*elle est/i, " : elle est")
    .trim();

  return propre || repli;
}

type Onglet = "centres-salles" | "matieres" | "salles-global";

export function FormationDetailView({
  formationId,
  peutGererAcademique = true,
}: {
  formationId: string;
  peutGererAcademique?: boolean;
}) {
  const router = useRouter();

  // Queries
  const { data: formation, isLoading: chargementFormation } = useFormation(formationId);
  const { data: sessionActive } = useSessionActive();
  const { data: centres = [] } = useCentres();
  const { data: abonnements = [], isLoading: chargementAbonnements } =
    useCentresAbonnesFormation(formationId, sessionActive?.id);
  const { data: toutesLesSalles = [] } = useSalles(sessionActive?.id);
  const { data: matieres = [] } = useMatieres();
  const { data: departements = [] } = useDepartements();

  // Mutations
  const renommerFormation = useRenommerFormation();
  const supprimerFormation = useSupprimerFormation();
  const associerMatiere = useAssocierMatiereFormation();
  const dissocierMatiere = useDissocierMatiereFormation();
  const abonnerCentre = useAbonnerCentreFormation();
  const desabonnerCentre = useDesabonnerCentreFormation();
  const creerSalle = useCreateSalle();
  const renommerSalle = useRenommerSalle();
  const supprimerSalle = useSupprimerSalle();

  // States
  const [onglet, setOnglet] = useState<Onglet>("centres-salles");

  // Modals state
  const [modalRenommerOuvert, setModalRenommerOuvert] = useState(false);
  const [nouveauNomFormation, setNouveauNomFormation] = useState("");
  const [erreurRenommer, setErreurRenommer] = useState<string | null>(null);

  const [modalSuppressionOuvert, setModalSuppressionOuvert] = useState(false);
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);

  const [modalAbonnerCentresOuvert, setModalAbonnerCentresOuvert] = useState(false);
  const [erreurAbonnement, setErreurAbonnement] = useState<string | null>(null);

  const [modalAjoutMatiereOuvert, setModalAjoutMatiereOuvert] = useState(false);
  const [rechercheMatiereModal, setRechercheMatiereModal] = useState("");

  // Room modal state
  const [centrePourAjoutSalle, setCentrePourAjoutSalle] = useState<string | null>(null);
  const [nomNouvelleSalle, setNomNouvelleSalle] = useState("");
  const [erreurSalle, setErreurSalle] = useState<string | null>(null);

  const [salleARenommer, setSalleARenommer] = useState<Salle | null>(null);
  const [nouveauNomSalle, setNouveauNomSalle] = useState("");

  const [salleASupprimer, setSalleASupprimer] = useState<Salle | null>(null);

  // Derived data
  const matieresParId = useMemo(() => {
    const map = new Map<string, (typeof matieres)[0]>();
    matieres.forEach((m) => map.set(m.id, m));
    return map;
  }, [matieres]);

  const couleursMatieres = useMemo(
    () => construireCouleursMatieres(matieres),
    [matieres],
  );

  const centresAbonnes = useMemo(() => {
    return centres.filter((c) => abonnements.some((a) => a.centreId === c.id));
  }, [centres, abonnements]);

  const sallesDeLaFormation = useMemo(() => {
    return toutesLesSalles.filter((s) => s.formationId === formationId);
  }, [toutesLesSalles, formationId]);

  const matieresDeLaFormation = useMemo(() => {
    if (!formation?.matiereIds) return [];
    return formation.matiereIds
      .map((id) => matieresParId.get(id))
      .filter((m): m is (typeof matieres)[0] => Boolean(m));
  }, [formation, matieresParId]);

  // Actions
  async function soumettreRenommerFormation(e: React.FormEvent) {
    e.preventDefault();
    const nomTrim = nouveauNomFormation.trim();
    if (!nomTrim) {
      setErreurRenommer("Le nom de la formation est requis.");
      return;
    }
    setErreurRenommer(null);
    try {
      await renommerFormation.mutateAsync({
        id: formationId,
        nom: nomTrim,
      });
      setModalRenommerOuvert(false);
    } catch (err) {
      setErreurRenommer(nettoyerMessageErreur(err, "Impossible de renommer la formation."));
    }
  }

  async function confirmerSuppressionFormation() {
    setErreurSuppression(null);
    try {
      await supprimerFormation.mutateAsync(formationId);
      router.push("/formations");
    } catch (err) {
      setErreurSuppression(
        nettoyerMessageErreur(
          err,
          "Impossible de supprimer cette formation. Elle est rattachée à des centres ou des salles.",
        ),
      );
    }
  }

  async function basculerMatiere(matiereId: string) {
    const estAssociee = formation?.matiereIds?.includes(matiereId);
    try {
      if (estAssociee) {
        await dissocierMatiere.mutateAsync({ id: formationId, matiereId });
      } else {
        await associerMatiere.mutateAsync({ id: formationId, matiereId });
      }
    } catch (err) {
      alert(nettoyerMessageErreur(err, "Action impossible pour le moment."));
    }
  }

  async function soumettreCreerSalle(e: React.FormEvent) {
    e.preventDefault();
    if (!centrePourAjoutSalle || !sessionActive) return;
    const nomTrim = nomNouvelleSalle.trim();
    if (!nomTrim) {
      setErreurSalle("Le nom de la salle est requis.");
      return;
    }
    setErreurSalle(null);
    try {
      await creerSalle.mutateAsync({
        nom: nomTrim,
        centreId: centrePourAjoutSalle,
        sessionId: sessionActive.id,
        formationId,
      });
      setNomNouvelleSalle("");
      setCentrePourAjoutSalle(null);
    } catch (err) {
      setErreurSalle(nettoyerMessageErreur(err, "Impossible de créer la salle."));
    }
  }

  async function soumettreRenommerSalle(e: React.FormEvent) {
    e.preventDefault();
    if (!salleARenommer) return;
    const nomTrim = nouveauNomSalle.trim();
    if (!nomTrim) return;
    try {
      await renommerSalle.mutateAsync({
        id: salleARenommer.id,
        nom: nomTrim,
      });
      setSalleARenommer(null);
    } catch (err) {
      alert(nettoyerMessageErreur(err, "Impossible de renommer la salle."));
    }
  }

  async function confirmerSuppressionSalle() {
    if (!salleASupprimer) return;
    try {
      await supprimerSalle.mutateAsync(salleASupprimer.id);
      setSalleASupprimer(null);
    } catch (err) {
      alert(nettoyerMessageErreur(err, "Impossible de supprimer la salle."));
    }
  }

  if (chargementFormation) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <GraduationCap className="h-10 w-10 mx-auto text-slate-300 animate-pulse mb-3" />
        <p className="text-sm">Chargement des détails de la formation...</p>
      </main>
    );
  }

  if (!formation) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Formation introuvable</h2>
        <p className="text-sm text-slate-500 mt-1">
          Cette formation n&rsquo;existe plus ou a été supprimée du catalogue.
        </p>
        <Link href="/formations">
          <Button className="mt-4 inline-flex items-center gap-2">
            <ChevronLeft size={16} />
            Retour aux formations
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            href="/formations"
            className="hover:text-brand-orange flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} />
            Catalogue des Formations
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-bold">{formation.nom}</span>
        </div>

        {sessionActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Session active : {sessionActive.annee}
          </div>
        )}
      </div>

      {/* En-tête Principal de la Fiche Formation */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-brand-orange shrink-0 shadow-xs">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {formation.nom}
                </h1>
                {/* <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-brand-orange border border-orange-200">
                  Filière Académique
                </span> */}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Filière globale du catalogue • {matieresDeLaFormation.length} matière(s) au programme
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {peutGererAcademique && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setNouveauNomFormation(formation.nom);
                    setErreurRenommer(null);
                    setModalRenommerOuvert(true);
                  }}
                  className="text-xs h-9 px-3.5 inline-flex items-center gap-1.5 font-semibold"
                >
                  <Pencil size={14} />
                  Renommer
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalAbonnerCentresOuvert(true)}
                  className="text-xs h-9 px-3.5 inline-flex items-center gap-1.5 font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  <Building2 size={14} />
                  Gérer les centres
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setErreurSuppression(null);
                    setModalSuppressionOuvert(true);
                  }}
                  className="text-xs h-9 px-3 text-red-600 hover:bg-red-50 hover:border-red-200"
                  title="Supprimer définitivement la formation"
                >
                  <Trash2 size={14} />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 4 KPIs de Synthèse */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {/* KPI 1 : Centres abonnés */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Centres Abonnés
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {centresAbonnes.length}
                </span>
                <span className="text-xs text-slate-400">
                  / {centres.length} centre(s)
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>

          {/* KPI 2 : Salles de cours */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Salles Allouées
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {sallesDeLaFormation.length}
                </span>
                <span className="text-xs text-slate-400">salle(s) au total</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <DoorOpen className="h-5 w-5" />
            </div>
          </div>

          {/* KPI 3 : Matières */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Programme d&rsquo;études
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {matieresDeLaFormation.length}
                </span>
                <span className="text-xs text-slate-400">matière(s)</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-brand-orange">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>

          {/* KPI 4 : Session */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/60 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Session Active
              </p>
              <p className="text-base font-bold text-slate-900 mt-1">
                {sessionActive ? sessionActive.annee : "Aucune"}
              </p>
              <p className="text-[10px] text-slate-400">
                {sessionActive ? `Statut : ${sessionActive.statut}` : "Non configurée"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Barre d'Onglets */}
        <div className="flex border-b border-slate-200 gap-6 pt-2">
          <button
            type="button"
            onClick={() => setOnglet("centres-salles")}
            className={`pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              onglet === "centres-salles"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 size={16} />
            <span>Centres &amp; Salles</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">
              {centresAbonnes.length} centre(s)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOnglet("matieres")}
            className={`pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              onglet === "matieres"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen size={16} />
            <span>Programme Académique</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">
              {matieresDeLaFormation.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOnglet("salles-global")}
            className={`pb-3.5 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              onglet === "salles-global"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <DoorOpen size={16} />
            <span>Toutes les Salles</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">
              {sallesDeLaFormation.length}
            </span>
          </button>
        </div>
      </div>

      {/* CONTENU ONGLET 1 : CENTRES ASSOCIÉS & LEURS SALLES */}
      {onglet === "centres-salles" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Centres hébergeant cette formation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chaque centre abonné dispose de ses propres salles de cours pour cette filière
              </p>
            </div>

            {peutGererAcademique && (
              <Button
                type="button"
                onClick={() => setModalAbonnerCentresOuvert(true)}
                className="text-xs h-8 px-3.5 inline-flex items-center gap-1.5 font-bold"
              >
                <Plus size={14} />
                Connecter un centre
              </Button>
            )}
          </div>

          {chargementAbonnements ? (
            <p className="py-12 text-center text-xs text-slate-400">
              Chargement des centres abonnés...
            </p>
          ) : centresAbonnes.length === 0 ? (
            <Card className="p-12 text-center rounded-3xl border border-dashed border-slate-200">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                Aucun centre n&rsquo;est encore abonné à cette formation
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Connectez vos centres d&rsquo;enseignement à cette formation pour leur permettre de créer des salles et d&rsquo;accueillir des promotions.
              </p>
              {peutGererAcademique && (
                <Button
                  onClick={() => setModalAbonnerCentresOuvert(true)}
                  className="mt-4 inline-flex items-center gap-2 text-xs"
                >
                  <Plus size={14} />
                  Connecter un premier centre
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {centresAbonnes.map((centre) => {
                const sallesDuCentre = sallesDeLaFormation.filter(
                  (s) => s.centreId === centre.id,
                );
                const abonnement = abonnements.find((a) => a.centreId === centre.id);

                return (
                  <Card
                    key={centre.id}
                    className="rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all"
                  >
                    <div>
                      {/* Top Centre */}
                      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">
                                {centre.nom}
                              </h3>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  centre.statut === "OUVERT"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                              >
                                {centre.statut}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {centre.villeActuelle || "Ville non précisée"}
                              {abonnement?.dateAbonnement && (
                                <> • Abonné le {abonnement.dateAbonnement}</>
                              )}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/centres/${centre.id}`}
                          title="Ouvrir la fiche du centre"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink size={15} />
                        </Link>
                      </div>

                      {/* Liste des Salles créées pour ce centre */}
                      <div className="pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <DoorOpen size={13} />
                            Salles créées ({sallesDuCentre.length})
                          </span>
                          {peutGererAcademique && (
                            <button
                              type="button"
                              onClick={() => {
                                setNomNouvelleSalle("");
                                setErreurSalle(null);
                                setCentrePourAjoutSalle(centre.id);
                              }}
                              className="text-xs font-semibold text-brand-orange hover:underline inline-flex items-center gap-1"
                            >
                              + Ajouter une salle
                            </button>
                          )}
                        </div>

                        {sallesDuCentre.length === 0 ? (
                          <div className="p-3.5 rounded-xl border border-dashed border-slate-200 text-center">
                            <p className="text-xs text-slate-400">
                              Aucune salle configurée dans ce centre pour cette filière.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {sallesDuCentre.map((salle) => (
                              <div
                                key={salle.id}
                                className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <DoorOpen size={14} className="text-slate-400 shrink-0" />
                                  <span className="text-xs font-bold text-slate-800 truncate">
                                    {salle.nom}
                                  </span>
                                </div>

                                {peutGererAcademique && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSalleARenommer(salle);
                                        setNouveauNomSalle(salle.nom);
                                      }}
                                      title="Renommer la salle"
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSalleASupprimer(salle)}
                                      title="Supprimer la salle"
                                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pied de Carte du Centre */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <Link
                        href={`/centres/${centre.id}`}
                        className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        Voir détails du centre
                        <ExternalLink size={12} />
                      </Link>

                      {peutGererAcademique && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!sessionActive) return;
                            if (sallesDuCentre.length > 0) {
                              alert(
                                `Impossible de désabonner ce centre : il possède ${sallesDuCentre.length} salle(s) rattachée(s) à cette formation. Supprimez d'abord ces salles.`,
                              );
                              return;
                            }
                            if (
                              confirm(
                                `Retirer l'abonnement du centre « ${centre.nom} » à cette formation ?`,
                              )
                            ) {
                              try {
                                await desabonnerCentre.mutateAsync({
                                  centreId: centre.id,
                                  sessionId: sessionActive.id,
                                  formationId,
                                });
                              } catch (err) {
                                alert(
                                  nettoyerMessageErreur(
                                    err,
                                    "Impossible de désabonner ce centre.",
                                  ),
                                );
                              }
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
                        >
                          Désabonner
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET 2 : PROGRAMME ACADÉMIQUE & MATIÈRES */}
      {onglet === "matieres" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Matières inscrites au programme
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Matières enseignées dans le cadre de cette formation
              </p>
            </div>

            {peutGererAcademique && (
              <Button
                type="button"
                onClick={() => setModalAjoutMatiereOuvert(true)}
                className="text-xs h-8 px-3.5 inline-flex items-center gap-1.5 font-bold"
              >
                <Plus size={14} />
                Ajouter une matière
              </Button>
            )}
          </div>

          {matieresDeLaFormation.length === 0 ? (
            <Card className="p-12 text-center rounded-3xl border border-dashed border-slate-200">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                Aucune matière n&rsquo;est encore rattachée au programme
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Ajoutez les matières enseignées dans cette formation pour structurer les plannings et affecter les enseignants.
              </p>
              {peutGererAcademique && (
                <Button
                  onClick={() => setModalAjoutMatiereOuvert(true)}
                  className="mt-4 inline-flex items-center gap-2 text-xs"
                >
                  <Plus size={14} />
                  Ajouter des matières
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matieresDeLaFormation.map((matiere) => {
                const couleur = couleursMatieres.get(matiere.id);
                const departement = departements.find((d) => d.matiereId === matiere.id);

                return (
                  <Card
                    key={matiere.id}
                    className="p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            style={{ backgroundColor: couleur?.hex || "#cbd5e1" }}
                            className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                              couleur ? couleur.bg : "bg-slate-300"
                            }`}
                          />
                          <h3 className="text-sm font-bold text-slate-900">
                            {matiere.nom}
                          </h3>
                        </div>

                        {peutGererAcademique && (
                          <button
                            type="button"
                            onClick={() => basculerMatiere(matiere.id)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                            title="Retirer du programme"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Département d&rsquo;attache
                        </p>
                        <p className="text-xs text-slate-700 font-semibold truncate">
                          {departement ? departement.nom : "Général"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Au catalogue</span>
                      {couleur && (
                        <span
                          style={
                            couleur.hex
                              ? getCouleurBadgeStyle(couleur.hex)
                              : undefined
                          }
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${couleur.bg} ${couleur.texte}`}
                        >
                          Matière
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET 3 : VUE CONSOLIDÉE DE TOUTES LES SALLES */}
      {onglet === "salles-global" && (
        <Card className="rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Inventaire consolidé des salles allouées
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toutes les salles dédiées à cette filière à travers les centres pour la session active
              </p>
            </div>

            <div className="text-xs font-bold text-slate-500 px-3 py-1.5 rounded-xl bg-slate-100">
              {sallesDeLaFormation.length} salle(s) au total
            </div>
          </div>

          {sallesDeLaFormation.length === 0 ? (
            <div className="p-12 text-center">
              <DoorOpen className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Aucune salle allouée à cette formation pour le moment
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Les salles sont créées au niveau de chaque centre abonné.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-6">Salle</th>
                    <th className="py-3 px-6">Centre Hébergeur</th>
                    <th className="py-3 px-6">Ville</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sallesDeLaFormation.map((salle) => {
                    const centre = centres.find((c) => c.id === salle.centreId);

                    return (
                      <tr key={salle.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <DoorOpen size={14} />
                          </div>
                          <span>{salle.nom}</span>
                        </td>
                        <td className="py-3.5 px-6 font-semibold">
                          {centre ? (
                            <Link
                              href={`/centres/${centre.id}`}
                              className="hover:text-brand-orange hover:underline inline-flex items-center gap-1"
                            >
                              {centre.nom}
                              <ExternalLink size={11} className="text-slate-400" />
                            </Link>
                          ) : (
                            <span className="text-slate-400 italic">Centre inconnu</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500">
                          {centre?.villeActuelle || "-"}
                        </td>
                        <td className="py-3.5 px-6 text-right space-x-2">
                          {peutGererAcademique && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSalleARenommer(salle);
                                  setNouveauNomSalle(salle.nom);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                                title="Renommer"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSalleASupprimer(salle)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* MODAL : RENOMMER FORMATION */}
      <Modal
        isOpen={modalRenommerOuvert}
        onClose={() => setModalRenommerOuvert(false)}
        title="Renommer la formation"
        description="Modifier le nom officiel de cette formation"
        maxWidth="max-w-md"
      >
        <form onSubmit={soumettreRenommerFormation} className="space-y-4 pt-2">
          {erreurRenommer && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{erreurRenommer}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nouveau nom *
            </label>
            <input
              type="text"
              value={nouveauNomFormation}
              onChange={(e) => setNouveauNomFormation(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalRenommerOuvert(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={renommerFormation.isPending}
              className="font-bold text-xs"
            >
              {renommerFormation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL : GÉRER / ABONNER CENTRES */}
      {modalAbonnerCentresOuvert && (
        <Modal
          isOpen={true}
          onClose={() => setModalAbonnerCentresOuvert(false)}
          title="Centres abonnés"
          description={`Connectez ou déconnectez des centres pour la filière « ${formation.nom} » (Session ${sessionActive?.annee || ""})`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 pt-2">
            {erreurAbonnement && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{erreurAbonnement}</span>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {centres.map((centre) => {
                const aRejoint = Boolean(
                  sessionActive && centre.sessionIds?.includes(sessionActive.id),
                );
                const estAbonne = abonnements.some((a) => a.centreId === centre.id);
                const sallesDuCentre = sallesDeLaFormation.filter(
                  (s) => s.centreId === centre.id,
                );

                return (
                  <div
                    key={centre.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          estAbonne
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {centre.nom}
                          </p>
                          {estAbonne && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="h-3 w-3" />
                              Abonné
                            </span>
                          )}
                          {!aRejoint && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Hors session
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          {centre.villeActuelle || "Ville non précisée"}
                          {estAbonne && ` • ${sallesDuCentre.length} salle(s)`}
                        </p>
                      </div>
                    </div>

                    <div>
                      {!aRejoint ? (
                        <span
                          className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 font-medium"
                          title="Le centre doit d'abord rejoindre la session active"
                        >
                          N&rsquo;a pas rejoint la session
                        </span>
                      ) : estAbonne ? (
                        <button
                          type="button"
                          disabled={desabonnerCentre.isPending}
                          onClick={async () => {
                            if (!sessionActive) return;
                            if (sallesDuCentre.length > 0) {
                              setErreurAbonnement(
                                `Impossible de désabonner ${centre.nom} : ${sallesDuCentre.length} salle(s) y sont rattachée(s).`,
                              );
                              return;
                            }
                            setErreurAbonnement(null);
                            try {
                              await desabonnerCentre.mutateAsync({
                                centreId: centre.id,
                                sessionId: sessionActive.id,
                                formationId,
                              });
                            } catch (err) {
                              setErreurAbonnement(
                                nettoyerMessageErreur(
                                  err,
                                  "Impossible de désabonner ce centre.",
                                ),
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Désabonner
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={abonnerCentre.isPending}
                          onClick={async () => {
                            if (!sessionActive) return;
                            setErreurAbonnement(null);
                            try {
                              await abonnerCentre.mutateAsync({
                                centreId: centre.id,
                                sessionId: sessionActive.id,
                                formationId,
                              });
                            } catch (err) {
                              setErreurAbonnement(
                                nettoyerMessageErreur(
                                  err,
                                  "Impossible d'abonner ce centre.",
                                ),
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Abonner
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {abonnements.length} centre(s) abonné(s)
              </span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalAbonnerCentresOuvert(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL : AJOUTER DES MATIÈRES AU PROGRAMME */}
      <Modal
        isOpen={modalAjoutMatiereOuvert}
        onClose={() => setModalAjoutMatiereOuvert(false)}
        title="Matières au programme"
        description={`Ajoutez ou retirez des matières de la formation « ${formation.nom} »`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer les matières..."
              value={rechercheMatiereModal}
              onChange={(e) => setRechercheMatiereModal(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
            />
            {rechercheMatiereModal && (
              <button
                onClick={() => setRechercheMatiereModal("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {matieres
              .filter((m) =>
                m.nom.toLowerCase().includes(rechercheMatiereModal.trim().toLowerCase()),
              )
              .map((mat) => {
                const estAssociee = formation.matiereIds?.includes(mat.id);
                const couleur = couleursMatieres.get(mat.id);

                return (
                  <div
                    key={mat.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        style={{ backgroundColor: couleur?.hex || "#cbd5e1" }}
                        className={`w-3 h-3 rounded-full shrink-0 ${
                          couleur ? couleur.bg : "bg-slate-300"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {mat.nom}
                        </p>
                        <p className="text-xs text-slate-400">
                          {estAssociee ? "Au programme" : "Non incluse"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={associerMatiere.isPending || dissocierMatiere.isPending}
                      onClick={() => basculerMatiere(mat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        estAssociee
                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {estAssociee ? (
                        <>
                          <X className="h-3.5 w-3.5" />
                          Retirer
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {matieresDeLaFormation.length} matière(s) actuellement au programme
            </span>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalAjoutMatiereOuvert(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL : AJOUTER SALLE DANS UN CENTRE */}
      {centrePourAjoutSalle && (
        <Modal
          isOpen={true}
          onClose={() => setCentrePourAjoutSalle(null)}
          title="Ajouter une salle de cours"
          description={`Créer une salle dédiée à cette formation dans le centre « ${
            centres.find((c) => c.id === centrePourAjoutSalle)?.nom
          } »`}
          maxWidth="max-w-md"
        >
          <form onSubmit={soumettreCreerSalle} className="space-y-4 pt-2">
            {erreurSalle && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{erreurSalle}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nom ou numéro de la salle *
              </label>
              <input
                type="text"
                placeholder="Ex : Salle 101, Amphi A, Labo 3..."
                value={nomNouvelleSalle}
                onChange={(e) => setNomNouvelleSalle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCentrePourAjoutSalle(null)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={creerSalle.isPending}
                className="font-bold text-xs"
              >
                {creerSalle.isPending ? "Création..." : "Créer la salle"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL : RENOMMER SALLE */}
      {salleARenommer && (
        <Modal
          isOpen={true}
          onClose={() => setSalleARenommer(null)}
          title="Renommer la salle"
          description="Modifier le nom ou l'intitulé de la salle de cours"
          maxWidth="max-w-md"
        >
          <form onSubmit={soumettreRenommerSalle} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nouveau nom de la salle *
              </label>
              <input
                type="text"
                value={nouveauNomSalle}
                onChange={(e) => setNouveauNomSalle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange transition-all"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSalleARenommer(null)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={renommerSalle.isPending}
                className="font-bold text-xs"
              >
                {renommerSalle.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL : SUPPRIMER SALLE */}
      {salleASupprimer && (
        <Modal
          isOpen={true}
          onClose={() => setSalleASupprimer(null)}
          title="Supprimer la salle"
          description={`Êtes-vous sûr de vouloir supprimer la salle « ${salleASupprimer.nom} » ?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500">
              Cette action supprimera définitivement cette salle de cours.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSalleASupprimer(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={supprimerSalle.isPending}
                onClick={confirmerSuppressionSalle}
                className="bg-red-600 text-white hover:bg-red-700 font-bold text-xs"
              >
                {supprimerSalle.isPending ? "Suppression..." : "Confirmer"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL : SUPPRESSION FORMATION */}
      <Modal
        isOpen={modalSuppressionOuvert}
        onClose={() => setModalSuppressionOuvert(false)}
        title="Supprimer la formation"
        description={`Êtes-vous sûr de vouloir supprimer définitivement « ${formation.nom} » ?`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-3">
          {erreurSuppression ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>Suppression impossible</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {erreurSuppression}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <p>
                Cette action supprimera cette filière du catalogue permanent. Si des centres, des séances ou des inscriptions y sont encore liés, la suppression sera bloquée.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalSuppressionOuvert(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={supprimerFormation.isPending}
              onClick={confirmerSuppressionFormation}
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 font-bold text-xs"
            >
              {supprimerFormation.isPending ? "Suppression..." : "Confirmer la suppression"}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
