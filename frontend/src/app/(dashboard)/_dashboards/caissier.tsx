"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Coins,
  ArrowUpRight,
  Building2,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Pencil,
  Trash2,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  UserPlus,
  Users,
  GraduationCap,
  BookOpen,
  X,
} from "lucide-react";

import { Card, Button, Modal, SkeletonCard, SkeletonTable, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, compareDates, type SortDirection } from "@/shared/lib/sort-utils";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useApprenants } from "@/modules/apprenants";
import { useFormations, usePhases } from "@/modules/academique";
import {
  useBilanDuJour,
  useMouvementsFinanciers,
  useMotifs,
  useRepartitionFormations,
  useSupprimerEntree,
  useSoumettreBilanCaissier,
  EnregistrerVersementModal,
  ModifierVersementModal,
  SaisirSortieModal,
  RecuPaiementModal,
  type VersementItem,
  type DonneesRecuPaiement,
} from "@/modules/financier";
import { useSession } from "next-auth/react";
import { semaineCouranteDepuis } from "@/shared/lib/semaine";

const FCFA = new Intl.NumberFormat("fr-FR");

function getInitiales(prenom?: string, nom?: string) {
  const p = prenom?.trim()?.[0] || "";
  const n = nom?.trim()?.[0] || "";
  return (p + n).toUpperCase() || "EP";
}

const STATUT_BILAN_CONFIG: Record<
  string,
  { label: string; dotClass: string; badgeClass: string; desc: string }
> = {
  OUVERT: {
    label: "Caisse Ouverte (Opérations en cours)",
    dotClass: "bg-brand-orange",
    badgeClass: "bg-brand-orange/10 text-brand-anthracite border border-brand-orange/30 font-bold",
    desc: "Les encaissements et décaissements de la journée peuvent être enregistrés.",
  },
  SOUMIS_CAISSIER: {
    label: "Arrêté soumis (En attente Chef de centre)",
    dotClass: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-900 border border-amber-200/80 font-bold",
    desc: "Votre arrêté de caisse a été visé et transmis pour validation administrative.",
  },
  VISE_CHEF_CENTRE: {
    label: "Visé par Chef de centre (En attente Contrôleur)",
    dotClass: "bg-purple-500",
    badgeClass: "bg-purple-50 text-purple-900 border border-purple-200/80 font-bold",
    desc: "Validé par la direction locale, en cours de vérification par le Contrôleur.",
  },
  CLOTURE: {
    label: "Caisse Clôturée & Verrouillée",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-bold",
    desc: "Bilan définitivement validé et comptabilisé. Écritures verrouillées.",
  },
};

export function CaissierDashboard({ centreId }: { centreId: string }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || "";

  // Modals d'actions spécifiques au Caissier
  const [modalVersementOuverte, setModalVersementOuverte] = useState(false);
  const [modalSortieOuverte, setModalSortieOuverte] = useState(false);
  const [versementAModifier, setVersementAModifier] = useState<VersementItem | null>(null);
  const [versementASupprimer, setVersementASupprimer] = useState<{
    id: string;
    montant: number;
    libelle: string;
    date: string;
  } | null>(null);

  // Modal Reçu de Paiement
  const [recuSelectionne, setRecuSelectionne] = useState<DonneesRecuPaiement | null>(null);
  const [modalRecuOuverte, setModalRecuOuverte] = useState(false);

  // Filtres du journal de transactions
  const [rechercheTransaction, setRechercheTransaction] = useState("");
  const [filtreType, setFiltreType] = useState<"TOUS" | "ENTREE" | "SORTIE">("TOUS");
  const [filtreStatut, setFiltreStatut] = useState<"TOUS" | "VALIDE" | "EN_ATTENTE">("TOUS");

  // Tris des tableaux
  type TriCaissierFormationColonne = "nom" | "effectif" | "contrats" | "encaisse" | "reste" | "taux";
  const [triFormationColonne, setTriFormationColonne] = useState<TriCaissierFormationColonne>("effectif");
  const [triFormationDirection, setTriFormationDirection] = useState<SortDirection>("desc");

  function handleTriFormation(colonne: TriCaissierFormationColonne) {
    if (triFormationColonne === colonne) {
      setTriFormationDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriFormationColonne(colonne);
      setTriFormationDirection(colonne === "nom" ? "asc" : "desc");
    }
  }

  type TriCaissierTransactionColonne = "date" | "eleve" | "motif" | "montant" | "statut";
  const [triTransactionColonne, setTriTransactionColonne] = useState<TriCaissierTransactionColonne>("date");
  const [triTransactionDirection, setTriTransactionDirection] = useState<SortDirection>("desc");

  function handleTriTransaction(colonne: TriCaissierTransactionColonne) {
    if (triTransactionColonne === colonne) {
      setTriTransactionDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTriTransactionColonne(colonne);
      setTriTransactionDirection(colonne === "date" || colonne === "montant" ? "desc" : "asc");
    }
  }
  const [actionEnCours, setActionEnCours] = useState(false);
  const [erreurAction, setErreurAction] = useState<string | null>(null);
  const [succesAction, setSuccesAction] = useState<string | null>(null);

  // Données
  const { data: centres = [] } = useCentres();
  const { data: sessionActive, isLoading: chargementSession } = useSessionActive();
  const { data: phases = [] } = usePhases();
  const { data: apprenants = [], isLoading: chargementApprenants } = useApprenants();
  const { data: formations = [], isLoading: chargementFormations } = useFormations();
  const { data: bilan, isLoading: chargementBilan } = useBilanDuJour(
    centreId,
    sessionActive?.id,
  );
  const { data: repartition } = useRepartitionFormations(bilan?.id ?? undefined);
  const { data: mouvements = [], isLoading: chargementMouvements } = useMouvementsFinanciers(
    sessionActive?.id,
    centreId,
  );
  const { data: motifs = [] } = useMotifs();

  const supprimerEntreeMutation = useSupprimerEntree();
  const { mutate: soumettreCaissier, isPending: enCoursSoumission } = useSoumettreBilanCaissier();

  const centreCourant = useMemo(
    () => centres.find((c) => c.id === centreId),
    [centres, centreId],
  );

  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;

  const dateAujourdhuiIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  // 1. Apprenants du centre
  const apprenantsDuCentre = useMemo(() => {
    if (!sessionActive?.id) {
      return apprenants.filter((a) => a.centreId === centreId);
    }
    return apprenants.filter(
      (a) => a.centreId === centreId && a.sessionId === sessionActive.id,
    );
  }, [apprenants, centreId, sessionActive]);

  const effectifTotal = apprenantsDuCentre.length;
  const preInscrits = apprenantsDuCentre.filter((a) => a.preInscrit).length;
  const definitifs = effectifTotal - preInscrits;
  const pctDefinitifs = effectifTotal > 0 ? Math.round((definitifs / effectifTotal) * 100) : 0;
  const pctPreInscrits = effectifTotal > 0 ? 100 - pctDefinitifs : 0;

  // 2. Mouvements du centre et calculs de caisse
  const entreesCentre = useMemo(() => {
    return mouvements
      .filter((m) => m.type === "ENTREE" && m.statut !== "REJETE")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [mouvements]);

  const totalContratsCentre = useMemo(
    () => apprenantsDuCentre.reduce((sum, a) => sum + (a.montantContrat || 0), 0),
    [apprenantsDuCentre],
  );

  // Mouvements d'aujourd'hui
  const mouvementsDuJour = useMemo(() => {
    return mouvements.filter((m) => {
      const dateMvt = (m.date || "").split("T")[0];
      return dateMvt === dateAujourdhuiIso;
    });
  }, [mouvements, dateAujourdhuiIso]);

  // Caisse du Jour (Flux Net)
  const { totalEntreesAuj, totalSortiesAuj, netCaisseAuj, totalLivresAuj } = useMemo(() => {
    let eAuj = 0;
    let sAuj = 0;
    let livresAuj = 0;

    mouvementsDuJour.forEach((m) => {
      if (m.statut !== "REJETE") {
        if (m.type === "ENTREE") {
          eAuj += m.montant;
          const isLivre =
            m.motifId === "00000000-0000-0000-0000-000000000012" ||
            motifs.find((x) => x.id === m.motifId)?.nom?.toLowerCase().includes("livre");
          if (isLivre) livresAuj += m.montant;
        } else if (m.type === "SORTIE") {
          sAuj += m.montant;
        }
      }
    });

    const totalE = bilan?.totalEntrees && bilan.totalEntrees > 0 ? bilan.totalEntrees : eAuj;
    const totalS = bilan?.totalSorties ?? sAuj;
    const net = bilan?.netAVerser ?? totalE - totalS;

    return {
      totalEntreesAuj: totalE,
      totalSortiesAuj: totalS,
      netCaisseAuj: net,
      totalLivresAuj: livresAuj,
    };
  }, [mouvementsDuJour, bilan, motifs]);

  // Recouvrement global scolarité
  const montantTotalEncaisse = useMemo(
    () => entreesCentre.reduce((sum, e) => sum + e.montant, 0),
    [entreesCentre],
  );
  const resteGlobalRecouvrer = Math.max(0, totalContratsCentre - montantTotalEncaisse);
  const tauxRecouvrementGlobal =
    totalContratsCentre > 0
      ? Math.min(100, Math.round((montantTotalEncaisse / totalContratsCentre) * 100))
      : 0;

  // 3. Performance & Recouvrement par Filière
  const statsFormations = useMemo(() => {
    return formations.map((formation) => {
      const eleves = apprenantsDuCentre.filter((a) => a.formationId === formation.id);
      const totalEleves = eleves.length;
      const preInscritsFormation = eleves.filter((a) => a.preInscrit).length;
      const definitifsFormation = totalEleves - preInscritsFormation;
      const contratsFormation = eleves.reduce((sum, a) => sum + (a.montantContrat || 0), 0);

      const encaisseFormation = entreesCentre
        .filter(
          (e) =>
            e.formationId === formation.id ||
            eleves.some((a) => a.id === e.apprenantId),
        )
        .reduce((sum, e) => sum + e.montant, 0);

      const ligneBilan = repartition?.find((r) => r.formationId === formation.id);
      const encaisseAffiche = encaisseFormation > 0 ? encaisseFormation : (ligneBilan?.montant || 0);

      const taux =
        contratsFormation > 0
          ? Math.min(100, Math.round((encaisseAffiche / contratsFormation) * 100))
          : 0;

      return {
        id: formation.id,
        nom: formation.nom,
        totalEleves,
        definitifsFormation,
        preInscritsFormation,
        contratsFormation,
        encaisseAffiche,
        resteARecouvrer: Math.max(0, contratsFormation - encaisseAffiche),
        taux,
      };
    });
  }, [formations, apprenantsDuCentre, entreesCentre, repartition]);

  const totalStatsFormations = useMemo(() => {
    const totaux = statsFormations.reduce(
      (acc, f) => ({
        totalEleves: acc.totalEleves + f.totalEleves,
        definitifsFormation: acc.definitifsFormation + f.definitifsFormation,
        preInscritsFormation: acc.preInscritsFormation + f.preInscritsFormation,
        contratsFormation: acc.contratsFormation + f.contratsFormation,
        encaisseAffiche: acc.encaisseAffiche + f.encaisseAffiche,
        resteARecouvrer: acc.resteARecouvrer + f.resteARecouvrer,
      }),
      {
        totalEleves: 0,
        definitifsFormation: 0,
        preInscritsFormation: 0,
        contratsFormation: 0,
        encaisseAffiche: 0,
        resteARecouvrer: 0,
      },
    );

    const tauxGlobal =
      totaux.contratsFormation > 0
        ? Math.min(100, Math.round((totaux.encaisseAffiche / totaux.contratsFormation) * 100))
        : 0;

    return { ...totaux, tauxGlobal };
  }, [statsFormations]);

  // Tri interactif des formations
  const statsFormationsTriees = useMemo(() => {
    return [...statsFormations].sort((a, b) => {
      let res = 0;
      switch (triFormationColonne) {
        case "nom":
          res = compareStrings(a.nom, b.nom);
          break;
        case "effectif":
          res = compareNumbers(a.totalEleves, b.totalEleves);
          break;
        case "contrats":
          res = compareNumbers(a.contratsFormation, b.contratsFormation);
          break;
        case "encaisse":
          res = compareNumbers(a.encaisseAffiche, b.encaisseAffiche);
          break;
        case "reste":
          res = compareNumbers(a.resteARecouvrer, b.resteARecouvrer);
          break;
        case "taux":
          res = compareNumbers(a.taux, b.taux);
          break;
      }
      return triFormationDirection === "asc" ? res : -res;
    });
  }, [statsFormations, triFormationColonne, triFormationDirection]);


  // 4. Filtrage dynamique et tri du journal des transactions
  const transactionsAffichees = useMemo(() => {
    const list = mouvements.filter((m) => {
      if (filtreType !== "TOUS" && m.type !== filtreType) return false;
      if (filtreStatut !== "TOUS") {
        if (filtreStatut === "VALIDE" && m.statut !== "VALIDE") return false;
        if (filtreStatut === "EN_ATTENTE" && m.statut === "VALIDE") return false;
      }

      if (!rechercheTransaction.trim()) return true;
      const q = rechercheTransaction.toLowerCase();

      const motif = motifs.find((x) => x.id === m.motifId)?.nom || "";
      const apprenant = apprenantsDuCentre.find((a) => a.id === m.apprenantId);
      const nomApprenant = apprenant ? `${apprenant.nom} ${apprenant.prenom}` : "";
      const ordonnateur = m.ordonnateur || "";

      return (
        motif.toLowerCase().includes(q) ||
        (m.details && m.details.toLowerCase().includes(q)) ||
        nomApprenant.toLowerCase().includes(q) ||
        ordonnateur.toLowerCase().includes(q) ||
        m.montant.toString().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      let res = 0;
      switch (triTransactionColonne) {
        case "date":
          res = compareDates(a.date, b.date);
          break;
        case "eleve": {
          const appA = apprenantsDuCentre.find((x) => x.id === a.apprenantId);
          const nomA = appA ? `${appA.nom} ${appA.prenom}` : a.ordonnateur || "";
          const appB = apprenantsDuCentre.find((x) => x.id === b.apprenantId);
          const nomB = appB ? `${appB.nom} ${appB.prenom}` : b.ordonnateur || "";
          res = compareStrings(nomA, nomB);
          break;
        }
        case "motif": {
          const motifA = motifs.find((x) => x.id === a.motifId)?.nom || "";
          const motifB = motifs.find((x) => x.id === b.motifId)?.nom || "";
          res = compareStrings(motifA, motifB);
          break;
        }
        case "montant":
          res = compareNumbers(a.montant, b.montant);
          break;
        case "statut":
          res = compareStrings(a.statut || "", b.statut || "");
          break;
      }
      return triTransactionDirection === "asc" ? res : -res;
    });
  }, [mouvements, filtreType, filtreStatut, rechercheTransaction, motifs, apprenantsDuCentre, triTransactionColonne, triTransactionDirection]);


  // Statut du bilan
  const statutBilan = bilan?.statut || "OUVERT";
  const configStatut = STATUT_BILAN_CONFIG[statutBilan] || STATUT_BILAN_CONFIG.OUVERT;
  const caisseEstVerrouillee = statutBilan === "CLOTURE";
  const visaCaissierEffectue = !!bilan?.dateVisaCaissier;

  // Handlers actions caissier
  const handleVisaCaissier = () => {
    if (!sessionActive?.id || !centreId) return;
    setErreurAction(null);
    setSuccesAction(null);
    soumettreCaissier(
      {
        centreId,
        sessionId: sessionActive.id,
        date: dateAujourdhuiIso,
        caissierUtilisateurId: currentUserId,
      },
      {
        onSuccess: () => {
          setSuccesAction(
            "L'arrêté de caisse a été visé et transmis au Chef de centre avec succès.",
          );
        },
        onError: (err: any) => {
          setErreurAction(
            err?.message || "Erreur lors de la soumission de l'arrêté de caisse.",
          );
        },
      },
    );
  };

  const ouvrirRecuMouvement = (m: (typeof mouvements)[0]) => {
    const motifLibelle = motifs.find((x) => x.id === m.motifId)?.nom || "Versement";
    const app = apprenantsDuCentre.find((a) => a.id === m.apprenantId);
    const nomApp = app ? `${app.nom} ${app.prenom}` : "Apprenant";
    const formationNom =
      formations.find((f) => f.id === (m.formationId || app?.formationId))?.nom || "";

    const isLivre =
      m.motifId === "00000000-0000-0000-0000-000000000012" ||
      motifLibelle.toLowerCase().includes("livre");

    const totalVerseApp = mouvements
      .filter((x) => x.type === "ENTREE" && x.statut !== "REJETE" && x.apprenantId === m.apprenantId)
      .reduce((s, x) => s + x.montant, 0);

    const reliquat = app?.montantContrat
      ? Math.max(0, app.montantContrat - totalVerseApp)
      : undefined;

    const userObj = session?.user as { prenom?: string; nom?: string } | undefined;
    const nomCaissier =
      userObj?.prenom && userObj?.nom
        ? `${userObj.prenom} ${userObj.nom}`
        : session?.user?.name || "Caissier en service";

    setRecuSelectionne({
      id: m.id,
      date: (m.date || "").split("T")[0],
      heure: m.date?.includes("T")
        ? new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : undefined,
      montant: m.montant,
      nomApprenant: nomApp,
      contactApprenant: app?.contactApprenant,
      nomFormation: formationNom,
      nomCentre: centreCourant?.nom || "Centre EXCELIS",
      nomCaissier,
      montantContrat: isLivre ? undefined : app?.montantContrat,
      totalVerse: isLivre ? undefined : totalVerseApp,
      soldeRestant: isLivre ? undefined : reliquat,
      motif: isLivre && m.details ? `Livre : ${m.details}` : motifLibelle,
    });
    setModalRecuOuverte(true);
  };

  const confirmerSuppressionVersement = async () => {
    if (!versementASupprimer) return;
    try {
      setActionEnCours(true);
      await supprimerEntreeMutation.mutateAsync(versementASupprimer.id);
      setVersementASupprimer(null);
    } catch (e: any) {
      setErreurAction(e?.message || "Erreur lors de la suppression du versement.");
    } finally {
      setActionEnCours(false);
    }
  };

  const chargementGlobal =
    chargementSession || chargementApprenants || chargementBilan || chargementMouvements;

  if (chargementGlobal) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <SkeletonCard className="h-44 rounded-2xl" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
        </div>
        <SkeletonTable rows={6} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-12">
      {/* ── 1. En-tête Opérationnel Hero Caissier ── */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-bold uppercase ${configStatut.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${configStatut.dotClass}`} />
                <span>{configStatut.label}</span>
              </span>

              {sessionActive && (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                  <Calendar size={12} className="text-slate-500" />
                  Session {sessionActive.annee}
                </span>
              )}

              {phases.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200/70 px-2 py-0.5 font-bold text-amber-900">
                  <Layers size={12} className="text-brand-orange" />
                  Semaine {semaineCourante}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Guichet &amp; Caisse · {centreCourant?.nom ?? "Centre Opérationnel"}
            </h1>

            <p className="text-xs text-slate-500 font-medium">
              {centreCourant?.adresseActuelle ? `${centreCourant.adresseActuelle}, ` : ""}
              {centreCourant?.villeActuelle ?? "Caisse locale"}
            </p>
          </div>

          {/* Actions directes du guichet */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <Button
              type="button"
              disabled={caisseEstVerrouillee}
              onClick={() => setModalVersementOuverte(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center gap-2 text-xs font-bold shadow-xs cursor-pointer px-3.5 py-2 rounded-lg transition-all disabled:opacity-50"
            >
              <Coins size={14} />
              <span>Nouveau versement</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={caisseEstVerrouillee}
              onClick={() => setModalSortieOuverte(true)}
              className="flex items-center gap-2 text-xs font-bold cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg text-slate-800 transition-all disabled:opacity-50"
            >
              <Plus size={14} />
              <span>Nouvelle sortie</span>
            </Button>

            <Link href="/inscription">
              <Button
                type="button"
                variant="secondary"
                className="flex items-center gap-2 text-xs font-bold cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg text-slate-800 transition-all"
              >
                <UserPlus size={14} />
                <span>Inscrire élève</span>
              </Button>
            </Link>

            <Link href="/bilan-journalier">
              <Button
                type="button"
                variant="secondary"
                className="flex items-center gap-2 text-xs font-bold cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg text-slate-800 transition-all"
              >
                <FileText size={14} />
                <span>Bilan &amp; Arrêté</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Messages d'alerte et de confirmation */}
        {erreurAction && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-rose-600" />
              <span>{erreurAction}</span>
            </div>
            <button
              onClick={() => setErreurAction(null)}
              className="text-rose-500 hover:text-rose-700 font-bold p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {succesAction && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{succesAction}</span>
            </div>
            <button
              onClick={() => setSuccesAction(null)}
              className="text-emerald-500 hover:text-emerald-700 font-bold p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Les 4 KPIs Majeurs identiques au Chef de centre ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {/* KPI 1 : Caisse du Jour (Flux Net) */}
        <div
          onClick={() => !caisseEstVerrouillee && setModalVersementOuverte(true)}
          className="group flex flex-col h-full cursor-pointer"
        >
          <Card className="p-5 bg-white border border-slate-200 hover:border-brand-orange/50 transition-all shadow-2xs group-hover:shadow-sm h-full flex flex-col justify-between min-h-[210px]">
            {/* Header */}
            <div className="flex items-start justify-between min-h-[36px]">
              <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
                Caisse du Jour (Net)
              </span>
              <div className="bg-orange-50 text-brand-orange rounded-xl p-2.5 ring-1 ring-orange-500/10 group-hover:scale-105 transition-transform shrink-0">
                <Coins size={18} />
              </div>
            </div>

            {/* Corps */}
            <div className="my-3 flex-1 flex flex-col justify-between space-y-3">
              <div className="min-h-[46px]">
                <span className="text-slate-900 text-2xl lg:text-[26px] font-black tabular-nums tracking-tight block">
                  {FCFA.format(netCaisseAuj)} F
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] font-bold">
                  <span className="text-emerald-700 font-black">+{FCFA.format(totalEntreesAuj)} F</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-rose-700 font-black">-{FCFA.format(totalSortiesAuj)} F</span>
                </div>
              </div>

              {/* Jauge visuelle bicolore */}
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 flex gap-0.5">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
                    style={{
                      width: `${
                        totalEntreesAuj + totalSortiesAuj > 0
                          ? Math.max(
                              15,
                              Math.min(
                                85,
                                Math.round(
                                  (totalEntreesAuj / (totalEntreesAuj + totalSortiesAuj)) * 100,
                                ),
                              ),
                            )
                          : 50
                      }%`,
                    }}
                    title="Entrées"
                  />
                  <div
                    className="h-full bg-rose-400 transition-all duration-500 rounded-r-full"
                    style={{
                      width: `${
                        totalEntreesAuj + totalSortiesAuj > 0
                          ? Math.max(
                              15,
                              Math.min(
                                85,
                                Math.round(
                                  (totalSortiesAuj / (totalEntreesAuj + totalSortiesAuj)) * 100,
                                ),
                              ),
                            )
                          : 50
                      }%`,
                    }}
                    title="Sorties"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold mt-auto h-8">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className={`h-1.5 w-1.5 rounded-full ${configStatut.dotClass}`} />
                <span>{configStatut.label.split("(")[0]}</span>
              </span>
              <span className="inline-flex items-center gap-0.5 text-brand-orange">
                <span>Encaisser</span>
                <ArrowUpRight size={13} />
              </span>
            </div>
          </Card>
        </div>

        {/* KPI 2 : Recouvrement Global */}
        <Link href="/finances" className="group flex flex-col h-full">
          <Card className="p-5 bg-white border border-slate-200 hover:border-brand-orange/50 transition-all shadow-2xs group-hover:shadow-sm h-full flex flex-col justify-between min-h-[210px]">
            {/* Header */}
            <div className="flex items-start justify-between min-h-[36px]">
              <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
                Recouvrement Global
              </span>
              <div className="bg-emerald-50 text-emerald-700 rounded-xl p-2.5 ring-1 ring-emerald-600/10 group-hover:scale-105 transition-transform shrink-0">
                <Wallet size={18} />
              </div>
            </div>

            {/* Corps */}
            <div className="my-3 flex-1 flex flex-col justify-between space-y-3">
              <div className="min-h-[46px]">
                <span className="text-slate-900 text-2xl lg:text-[26px] font-black tabular-nums tracking-tight block">
                  {FCFA.format(montantTotalEncaisse)} F
                </span>
                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                  sur {FCFA.format(totalContratsCentre)} F souscrits
                </p>
              </div>

              {/* Jauge */}
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${tauxRecouvrementGlobal}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold mt-auto h-8">
              <span className="text-slate-500">
                Taux : <strong className="text-emerald-700 font-black">{tauxRecouvrementGlobal}%</strong>
              </span>
              <span className="text-slate-500">
                Reste : <strong className="text-brand-orange font-black">{FCFA.format(resteGlobalRecouvrer)} F</strong>
              </span>
            </div>
          </Card>
        </Link>

        {/* KPI 3 : Effectif Apprenants */}
        <Link href="/apprenants" className="group flex flex-col h-full">
          <Card className="p-5 bg-white border border-slate-200 hover:border-brand-orange/50 transition-all shadow-2xs group-hover:shadow-sm h-full flex flex-col justify-between min-h-[210px]">
            {/* Header */}
            <div className="flex items-start justify-between min-h-[36px]">
              <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
                Effectif &amp; Inscriptions
              </span>
              <div className="bg-orange-50 text-brand-orange rounded-xl p-2.5 ring-1 ring-orange-500/10 group-hover:scale-105 transition-transform shrink-0">
                <Users size={18} />
              </div>
            </div>

            {/* Corps */}
            <div className="my-3 flex-1 flex flex-col justify-between space-y-3">
              <div className="min-h-[46px]">
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-900 text-3xl font-black tabular-nums tracking-tight">
                    {effectifTotal}
                  </span>
                  <span className="text-xs font-bold text-slate-500">élèves au centre</span>
                </div>
              </div>

              {/* Jauge */}
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 flex gap-0.5">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
                    style={{ width: `${pctDefinitifs}%` }}
                    title={`${definitifs} définitifs (${pctDefinitifs}%)`}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all duration-500 rounded-r-full"
                    style={{ width: `${pctPreInscrits}%` }}
                    title={`${preInscrits} pré-inscrits (${pctPreInscrits}%)`}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold mt-auto h-8">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="inline-flex items-center gap-1 text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {definitifs} déf.
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {preInscrits} pré-ins.
                </span>
              </span>
              <span className="inline-flex items-center gap-0.5 text-brand-orange">
                <span>Apprenants</span>
                <ArrowUpRight size={13} />
              </span>
            </div>
          </Card>
        </Link>

        {/* KPI 4 : Ventes Livres & Boutique */}
        <Link href="/livres" className="group flex flex-col h-full">
          <Card className="p-5 bg-white border border-slate-200 hover:border-brand-orange/50 transition-all shadow-2xs group-hover:shadow-sm h-full flex flex-col justify-between min-h-[210px]">
            {/* Header */}
            <div className="flex items-start justify-between min-h-[36px]">
              <span className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">
                Boutique / Livres (Jour)
              </span>
              <div className="bg-purple-50 text-purple-700 rounded-xl p-2.5 ring-1 ring-purple-600/10 group-hover:scale-105 transition-transform shrink-0">
                <BookOpen size={18} />
              </div>
            </div>

            {/* Corps */}
            <div className="my-3 flex-1 flex flex-col justify-between space-y-3">
              <div className="min-h-[46px]">
                <span className="text-slate-900 text-2xl lg:text-[26px] font-black tabular-nums tracking-tight block">
                  {FCFA.format(totalLivresAuj)} F
                </span>
                <p className="text-xs text-purple-800 font-bold mt-0.5 truncate">
                  Ventes annexes (Hors contrat scolarité)
                </p>
              </div>

              {/* Jauge */}
              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{
                      width: `${totalEntreesAuj > 0 ? Math.min(100, Math.round((totalLivresAuj / totalEntreesAuj) * 100)) : 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-orange font-bold mt-auto h-8">
              <span className="text-purple-900 font-extrabold text-[11px]">Boutique EXCELIS</span>
              <span className="inline-flex items-center gap-0.5">
                <span>Ventes livres</span>
                <ArrowUpRight size={13} />
              </span>
            </div>
          </Card>
        </Link>
      </div>

      {/* ── 3. Section Centrale : Tableaux (65%) & Volet Opérationnel Caissier (35%) ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Colonne Gauche : Tableaux (2 colonnes) */}
        <div className="space-y-8 lg:col-span-2">

          {/* Tableau 1 : Performance & Recouvrement par Filière (Identique Chef de centre) */}
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <GraduationCap className="text-brand-orange" size={20} />
                  <span>Recouvrement par Filière</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Effectifs inscrits, contrats souscrits et montants recouvrés par filière dans le centre.
                </p>
              </div>

              <Link
                href="/apprenants"
                className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1"
              >
                <span>Voir les apprenants</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                    <SortableHeader
                      label="Filière / Programme"
                      columnKey="nom"
                      currentSortColumn={triFormationColonne}
                      currentSortDirection={triFormationDirection}
                      onSort={handleTriFormation}
                      align="left"
                    />
                    <SortableHeader
                      label="Effectif Total"
                      columnKey="effectif"
                      currentSortColumn={triFormationColonne}
                      currentSortDirection={triFormationDirection}
                      onSort={handleTriFormation}
                      align="center"
                    />
                    <SortableHeader
                      label="Contrats Souscrits"
                      columnKey="contrats"
                      currentSortColumn={triFormationColonne}
                      currentSortDirection={triFormationDirection}
                      onSort={handleTriFormation}
                      align="right"
                    />
                    <SortableHeader
                      label="Encaissé"
                      columnKey="encaisse"
                      currentSortColumn={triFormationColonne}
                      currentSortDirection={triFormationDirection}
                      onSort={handleTriFormation}
                      align="right"
                    />
                    <SortableHeader
                      label="Reste Dû"
                      columnKey="reste"
                      currentSortColumn={triFormationColonne}
                      currentSortDirection={triFormationDirection}
                      onSort={handleTriFormation}
                      align="right"
                    />
                    <SortableHeader
                      label="Taux"
                      columnKey="taux"
                      currentSortColumn={triFormationColonne}
                      currentSortDirection={triFormationDirection}
                      onSort={handleTriFormation}
                      align="center"
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chargementFormations ? (
                    <tr>
                      <td colSpan={6} className="text-slate-400 p-6 text-center text-xs">
                        Chargement des filières...
                      </td>
                    </tr>
                  ) : statsFormationsTriees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-slate-400 p-6 text-center text-xs">
                        Aucune formation active trouvée.
                      </td>
                    </tr>
                  ) : (
                    statsFormationsTriees.map((f) => (
                      <tr key={f.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 text-sm block">
                            {f.nom}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {f.definitifsFormation} définitif(s) · {f.preInscritsFormation} pré-inscrit(s)
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-100 font-bold text-slate-800">
                            {f.totalEleves}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-black text-slate-900">
                          {FCFA.format(f.contratsFormation)} F
                        </td>
                        <td className="p-3.5 text-right font-bold text-emerald-800">
                          {FCFA.format(f.encaisseAffiche)} F
                        </td>
                        <td className="p-3.5 text-right font-bold text-brand-orange">
                          {FCFA.format(f.resteARecouvrer)} F
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                                f.taux >= 100
                                  ? "bg-emerald-100 text-emerald-800"
                                  : f.taux > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {f.taux}%
                            </span>
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${f.taux}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {statsFormations.length > 0 && (
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50/80 font-bold text-slate-800">
                    <tr>
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 block">Total Consolidé</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {statsFormations.length} filière(s) active(s)
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-full bg-slate-200/80 font-black text-slate-900 tabular-nums">
                          {totalStatsFormations.totalEleves}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 tabular-nums">
                        {FCFA.format(totalStatsFormations.contratsFormation)} F
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-800 tabular-nums">
                        {FCFA.format(totalStatsFormations.encaisseAffiche)} F
                      </td>
                      <td className="p-3.5 text-right font-black text-brand-orange tabular-nums">
                        {FCFA.format(totalStatsFormations.resteARecouvrer)} F
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            {totalStatsFormations.tauxGlobal}%
                          </span>
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${totalStatsFormations.tauxGlobal}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>

          {/* Tableau 2 : Journal des Transactions Encaissées avec ACTIONS CAISSIER */}
          <Card className="overflow-hidden border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-brand-orange" size={20} />
                  <span>Journal des Règlements Encaissés &amp; Mouvements</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    {transactionsAffichees.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Écritures financières enregistrées. Vous pouvez émettre un reçu, modifier ou supprimer un versement.
                </p>
              </div>

              {/* Barre de recherche et filtres */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={rechercheTransaction}
                    onChange={(e) => setRechercheTransaction(e.target.value)}
                    placeholder="Filtrer élève, motif..."
                    className="h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50/70 placeholder:text-slate-400 focus:bg-white focus:border-brand-orange focus:outline-none transition-all w-44 sm:w-48"
                  />
                </div>

                {/* Filtre Type */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/60 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setFiltreType("TOUS")}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      filtreType === "TOUS"
                        ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltreType("ENTREE")}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      filtreType === "ENTREE"
                        ? "bg-white text-emerald-800 shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-emerald-800"
                    }`}
                  >
                    Entrées
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltreType("SORTIE")}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                      filtreType === "SORTIE"
                        ? "bg-white text-rose-800 shadow-2xs font-extrabold"
                        : "text-slate-500 hover:text-rose-800"
                    }`}
                  >
                    Sorties
                  </button>
                </div>

                <Link
                  href="/finances"
                  className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 ml-0.5"
                >
                  <span>Tout voir</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {transactionsAffichees.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search size={16} />
                </div>
                <p className="font-medium">
                  {rechercheTransaction.trim()
                    ? "Aucun règlement ne correspond à votre filtre."
                    : "Aucun mouvement financier enregistré pour le moment."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                      <SortableHeader
                        label="Date"
                        columnKey="date"
                        currentSortColumn={triTransactionColonne}
                        currentSortDirection={triTransactionDirection}
                        onSort={handleTriTransaction}
                        align="left"
                      />
                      <SortableHeader
                        label="Élève / Bénéficiaire"
                        columnKey="eleve"
                        currentSortColumn={triTransactionColonne}
                        currentSortDirection={triTransactionDirection}
                        onSort={handleTriTransaction}
                        align="left"
                      />
                      <SortableHeader
                        label="Motif"
                        columnKey="motif"
                        currentSortColumn={triTransactionColonne}
                        currentSortDirection={triTransactionDirection}
                        onSort={handleTriTransaction}
                        align="left"
                      />
                      <SortableHeader
                        label="Montant"
                        columnKey="montant"
                        currentSortColumn={triTransactionColonne}
                        currentSortDirection={triTransactionDirection}
                        onSort={handleTriTransaction}
                        align="right"
                      />
                      <SortableHeader
                        label="Statut"
                        columnKey="statut"
                        currentSortColumn={triTransactionColonne}
                        currentSortDirection={triTransactionDirection}
                        onSort={handleTriTransaction}
                        align="center"
                      />
                      <th className="p-3 font-bold text-right">Actions Caissier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactionsAffichees.slice(0, 15).map((m) => {
                      const apprenant = apprenantsDuCentre.find((a) => a.id === m.apprenantId);
                      const formation = formations.find((f) => f.id === m.formationId);
                      const motif = motifs.find((x) => x.id === m.motifId);
                      const aujourdhuiStr = new Date().toISOString().slice(0, 10);
                      const isDateAuj = m.date?.split("T")[0] === aujourdhuiStr;
                      const isEntree = m.type === "ENTREE";

                      const motifNom = motif?.nom || (isEntree ? "Versement scolarité" : "Décaissement");
                      const isLivre =
                        m.motifId === "00000000-0000-0000-0000-000000000012" ||
                        motifNom.toLowerCase().includes("livre");

                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-bold text-slate-800 block">
                              {new Date(m.date).toLocaleDateString("fr-FR")}
                            </span>
                            {isDateAuj && (
                              <span className="inline-block mt-0.5 rounded px-1.5 py-0.2 bg-emerald-100 text-[10px] font-black text-emerald-800">
                                Aujourd&apos;hui
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`h-7 w-7 rounded-full border text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                  isEntree
                                    ? "bg-slate-100 border-slate-200 text-slate-700"
                                    : "bg-rose-50 border-rose-200 text-rose-700"
                                }`}
                              >
                                {isEntree
                                  ? getInitiales(apprenant?.prenom, apprenant?.nom)
                                  : "SO"}
                              </div>
                              <div className="min-w-0">
                                {apprenant ? (
                                  <Link
                                    href={`/apprenants/${apprenant.id}`}
                                    className="font-bold text-slate-900 hover:text-brand-orange transition-colors truncate block"
                                  >
                                    {apprenant.prenom} {apprenant.nom}
                                  </Link>
                                ) : (
                                  <span className="font-bold text-slate-900 block truncate">
                                    {m.ordonnateur || (isEntree ? "Versement divers" : "Sortie de caisse")}
                                  </span>
                                )}
                                {formation && (
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {formation.nom}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] inline-flex items-center gap-1">
                                {isLivre && <BookOpen size={12} className="text-purple-600 shrink-0" />}
                                <span>{isLivre && m.details ? `Livre : ${m.details}` : motifNom}</span>
                              </span>
                              {isLivre && (
                                <span className="text-[9px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200 px-1 py-0.2 rounded">
                                  Hors contrat
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right font-black tabular-nums whitespace-nowrap">
                            <span className={isEntree ? "text-emerald-700" : "text-rose-700"}>
                              {isEntree ? "+" : "-"}
                              {FCFA.format(m.montant)} F
                            </span>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                m.statut === "VALIDE"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  m.statut === "VALIDE" ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                              />
                              {m.statut === "VALIDE" ? "Validé" : "En cours"}
                            </span>
                          </td>

                          {/* ACTIONS EXCLUSIVES AU CAISSIER */}
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* 1. Imprimer reçu (uniquement pour les entrées) */}
                              {isEntree && (
                                <button
                                  type="button"
                                  onClick={() => ouvrirRecuMouvement(m)}
                                  title="Imprimer le reçu de paiement"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:text-brand-orange hover:border-brand-orange/40 hover:bg-orange-50/50 shadow-2xs transition-all cursor-pointer"
                                >
                                  <Printer size={12} />
                                  <span className="hidden sm:inline">Reçu</span>
                                </button>
                              )}

                              {/* 2. Modifier versement */}
                              {isEntree && !caisseEstVerrouillee && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVersementAModifier({
                                      id: m.id,
                                      montant: m.montant,
                                      date: m.date?.split("T")[0] || "",
                                      motifId: m.motifId,
                                      motifNom: motifNom,
                                      apprenantId: m.apprenantId || undefined,
                                      apprenantNom: apprenant ? `${apprenant.nom} ${apprenant.prenom}` : undefined,
                                    })
                                  }
                                  title="Modifier ce versement"
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-brand-orange hover:border-brand-orange/40 hover:bg-orange-50/50 shadow-2xs transition-all cursor-pointer"
                                >
                                  <Pencil size={12} />
                                </button>
                              )}

                              {/* 3. Supprimer versement */}
                              {isEntree && !caisseEstVerrouillee && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVersementASupprimer({
                                      id: m.id,
                                      montant: m.montant,
                                      libelle: motifNom,
                                      date: m.date?.split("T")[0] || "",
                                    })
                                  }
                                  title="Supprimer ce versement"
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 shadow-2xs transition-all cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Colonne Droite : Arrêté Journalier & Visa Caissier (35%) */}
        <div className="space-y-6">
          <Card className="p-5 bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <ShieldCheck size={17} />
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Arrêté de Caisse du Jour
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${configStatut.badgeClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${configStatut.dotClass}`} />
                {configStatut.label.split("(")[0]}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Recettes du jour :</span>
                <strong className="text-emerald-700 font-black">+{FCFA.format(totalEntreesAuj)} F</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Dépenses du jour :</span>
                <strong className="text-rose-700 font-black">-{FCFA.format(totalSortiesAuj)} F</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-extrabold">
                <span className="text-slate-800">Net en caisse à verser :</span>
                <span className="text-slate-900 font-black text-sm">{FCFA.format(netCaisseAuj)} F</span>
              </div>
            </div>

            {erreurAction && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 text-rose-600 mt-0.5" />
                <span>{erreurAction}</span>
              </div>
            )}
            {succesAction && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600 mt-0.5" />
                <span>{succesAction}</span>
              </div>
            )}

            {visaCaissierEffectue ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Arrêté visé le {bilan?.dateVisaCaissier ? new Date(bilan.dateVisaCaissier).toLocaleDateString("fr-FR") : "ce jour"}. Transmis au Chef de centre.
                </span>
              </div>
            ) : caisseEstVerrouillee ? (
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-700 font-medium">
                <Clock size={16} className="text-slate-500 shrink-0" />
                <span>Caisse clôturée pour cette date. Écritures verrouillées.</span>
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleVisaCaissier}
                disabled={enCoursSoumission}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {enCoursSoumission ? "Transmission en cours..." : "Viser & Soumettre l'arrêté au Chef de centre"}
              </Button>
            )}
          </Card>
        </div>
      </div>

      {/* ── 4. Modales Fonctionnelles du Caissier ── */}
      {/* Modale d'enregistrement d'un versement */}
      {modalVersementOuverte && (
        <EnregistrerVersementModal
          isOpen={modalVersementOuverte}
          onClose={() => setModalVersementOuverte(false)}
          centreId={centreId}
          sessionId={sessionActive?.id || ""}
          onSuccessRecu={(recu) => {
            setRecuSelectionne(recu);
            setModalRecuOuverte(true);
          }}
        />
      )}

      {/* Modale de saisie d'une sortie de caisse */}
      {modalSortieOuverte && (
        <SaisirSortieModal
          isOpen={modalSortieOuverte}
          onClose={() => setModalSortieOuverte(false)}
          centreId={centreId}
          sessionId={sessionActive?.id || ""}
        />
      )}

      {/* Modale de modification d'un versement */}
      {versementAModifier && (
        <ModifierVersementModal
          isOpen={Boolean(versementAModifier)}
          onClose={() => setVersementAModifier(null)}
          versement={versementAModifier}
        />
      )}

      {/* Modale de confirmation de suppression d'un versement */}
      {versementASupprimer && (
        <Modal
          isOpen={Boolean(versementASupprimer)}
          onClose={() => setVersementASupprimer(null)}
          title="Confirmer la suppression du versement"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Êtes-vous sûr de vouloir supprimer le versement de{" "}
              <strong className="text-slate-900 font-black">
                {FCFA.format(versementASupprimer.montant)} FCFA
              </strong>{" "}
              enregistré le {new Date(versementASupprimer.date).toLocaleDateString("fr-FR")} ?
            </p>
            <p className="text-rose-600 font-medium">
              Cette écriture sera définitivement supprimée du journal de caisse et le solde dû de l&rsquo;apprenant sera réajusté.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setVersementASupprimer(null)}
                disabled={actionEnCours}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                onClick={confirmerSuppressionVersement}
                disabled={actionEnCours}
              >
                {actionEnCours ? "Suppression..." : "Supprimer définitivement"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modale d'impression de Reçu de Paiement */}
      {recuSelectionne && (
        <RecuPaiementModal
          isOpen={modalRecuOuverte}
          onClose={() => {
            setModalRecuOuverte(false);
            setRecuSelectionne(null);
          }}
          recu={recuSelectionne}
        />
      )}
    </div>
  );
}
