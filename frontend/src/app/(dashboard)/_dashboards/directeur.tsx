"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  Wallet,
  ChevronDown,
  Download,
  Search,
  ArrowUpRight,
  ShieldCheck,
  GraduationCap,
  UserX,
  Layers,
  ArrowRight,
  BookOpen,
  LayoutGrid,
  List,
  CheckCircle,
  HelpCircle,
  Phone,
} from "lucide-react";

import { Button, Card, Skeleton, SkeletonCard, SkeletonTable, SortableHeader } from "@/shared/ui";
import { compareStrings, compareNumbers, type SortDirection } from "@/shared/lib/sort-utils";
import { useApprenants } from "@/modules/apprenants";
import {
  useCentres,
  useSessionActive,
  useSessions,
  EvolutionPerformancesMultiCentres,
} from "@/modules/centres-sessions";
import { useMouvementsFinanciers, useMotifs } from "@/modules/financier";
import { useDossiers } from "@/modules/dossiers";
import { useStatsVentesLivres } from "@/modules/livres";
import { useUtilisateurs } from "@/modules/utilisateurs";
import { useFormations } from "@/modules/academique";

const FCFA = new Intl.NumberFormat("fr-FR");

function getInitiales(prenom?: string, nom?: string) {
  const p = prenom?.trim()?.[0] || "";
  const n = nom?.trim()?.[0] || "";
  return (p + n).toUpperCase() || "EP";
}

type TriOption =
  | "recouvrement_desc"
  | "recouvrement_asc"
  | "ca_desc"
  | "ca_asc"
  | "effectif_desc"
  | "effectif_asc"
  | "nom_asc"
  | "nom_desc"
  | "encaisse_desc"
  | "encaisse_asc"
  | "reste_desc"
  | "reste_asc";
type FiltreStatutType = "TOUS" | "OUVERT" | "FERME" | "ALERTE_RECOUVREMENT" | "SANS_CHEF";
type ModeAffichageCentres = "tableau" | "grille";

export function DirecteurDashboard() {
  const router = useRouter();
  const [sessionIdSelectionnee, setSessionIdSelectionnee] = useState<string | null>(null);
  const [rechercheCentre, setRechercheCentre] = useState("");
  const [filtreStatutCentre, setFiltreStatutCentre] = useState<FiltreStatutType>("TOUS");
  const [triOption, setTriOption] = useState<TriOption>("recouvrement_desc");
  const [modeAffichage, setModeAffichage] = useState<ModeAffichageCentres>("tableau");

  function handleTriHeader(colonne: "nom" | "effectif" | "ca" | "encaisse" | "reste" | "recouvrement") {
    if (colonne === "nom") {
      setTriOption((prev) => (prev === "nom_asc" ? "nom_desc" : "nom_asc"));
    } else if (colonne === "effectif") {
      setTriOption((prev) => (prev === "effectif_desc" ? "effectif_asc" : "effectif_desc"));
    } else if (colonne === "ca") {
      setTriOption((prev) => (prev === "ca_desc" ? "ca_asc" : "ca_desc"));
    } else if (colonne === "encaisse") {
      setTriOption((prev) => (prev === "encaisse_desc" ? "encaisse_asc" : "encaisse_desc"));
    } else if (colonne === "reste") {
      setTriOption((prev) => (prev === "reste_desc" ? "reste_asc" : "reste_desc"));
    } else if (colonne === "recouvrement") {
      setTriOption((prev) => (prev === "recouvrement_desc" ? "recouvrement_asc" : "recouvrement_desc"));
    }
  }

  // Données de base
  const { data: sessions = [], isLoading: chargementSessions } = useSessions();
  const { data: sessionActive, isLoading: chargementSessionActive } = useSessionActive();
  const { data: centres = [], isLoading: chargementCentres } = useCentres();
  const { data: utilisateurs = [] } = useUtilisateurs();
  const { data: apprenants = [], isLoading: chargementApprenants } = useApprenants();
  const { data: formations = [] } = useFormations();
  const { data: motifs = [] } = useMotifs();

  // Session de référence : sélectionnée par l'utilisateur ou la session active par défaut
  const sessionCourante = useMemo(() => {
    if (sessionIdSelectionnee) {
      return sessions.find((s) => s.id === sessionIdSelectionnee) ?? sessionActive ?? sessions[0];
    }
    return sessionActive ?? sessions[0];
  }, [sessionIdSelectionnee, sessions, sessionActive]);

  const activeSessionId = sessionCourante?.id;

  // Données liées à la session
  const { data: mouvements = [], isLoading: chargementMouvements } = useMouvementsFinanciers(activeSessionId);
  const { data: dossiers = [], isLoading: chargementDossiers } = useDossiers(activeSessionId);
  const { data: statsVentesLivres, isLoading: chargementLivres } = useStatsVentesLivres({
    sessionId: activeSessionId || "",
  });

  const chargementGlobal =
    chargementSessions ||
    chargementSessionActive ||
    chargementCentres ||
    chargementApprenants ||
    chargementMouvements ||
    chargementDossiers ||
    chargementLivres;

  // Filtrer les apprenants de la session courante (si session définie)
  const apprenantsSession = useMemo(() => {
    if (!activeSessionId) return apprenants;
    return apprenants.filter((a) => !a.sessionId || a.sessionId === activeSessionId);
  }, [apprenants, activeSessionId]);

  // Mouvements non rejetés
  const entreesValides = useMemo(
    () => mouvements.filter((m) => m.type === "ENTREE" && m.statut !== "REJETE"),
    [mouvements],
  );
  const sortiesValides = useMemo(
    () => mouvements.filter((m) => m.type === "SORTIE" && m.statut !== "REJETE"),
    [mouvements],
  );

  // Dictionnaire des motifs pour affichage rapide
  const mapMotifs = useMemo(() => {
    const map = new Map<string, string>();
    motifs.forEach((m) => map.set(m.id, m.nom));
    return map;
  }, [motifs]);

  // Statistiques détaillées par centre
  const statsParCentre = useMemo(() => {
    return centres.map((centre) => {
      // Chef de centre
      const chef = utilisateurs.find(
        (u) => u.role === "CHEF_CENTRE" && u.centreId === centre.id,
      );

      // Apprenants du centre
      const apprenantsDuCentre = apprenantsSession.filter((a) => a.centreId === centre.id);
      const effectif = apprenantsDuCentre.length;
      const preInscrits = apprenantsDuCentre.filter((a) => a.preInscrit).length;
      const confirmes = effectif - preInscrits;

      // Chiffre d'affaires contractuel
      const caContrats = apprenantsDuCentre.reduce((acc, a) => acc + (a.montantContrat || 0), 0);

      // Entrées / Sorties financières du centre
      const entreesCentre = entreesValides.filter((m) => m.centreId === centre.id);
      const sortiesCentre = sortiesValides.filter((m) => m.centreId === centre.id);
      const encaisse = entreesCentre.reduce((acc, m) => acc + m.montant, 0);
      const decaisse = sortiesCentre.reduce((acc, m) => acc + m.montant, 0);
      const soldeNet = encaisse - decaisse;

      // Taux de recouvrement
      const resteARecouvrer = Math.max(0, caContrats - encaisse);
      const tauxRecouvrement =
        caContrats > 0 ? Math.min(100, Math.round((encaisse / caContrats) * 100)) : 100;

      // Dossiers concours du centre
      const dossiersCentre = dossiers.filter((d) => d.centreId === centre.id);
      const dossiersTotal = dossiersCentre.length;
      const dossiersComplets = dossiersCentre.filter((d) => d.statut === "COMPLET").length;

      // Livres / Annales
      const ventilationLivre = statsVentesLivres?.parCentre?.find((p) => p.centreId === centre.id);
      const livresQuantite = ventilationLivre?.quantiteVendue || 0;
      const livresCa = ventilationLivre?.montantTotal || 0;

      // Détail des formations du centre
      const formationsDuCentre = formations
        .map((f) => {
          const elevesF = apprenantsDuCentre.filter((a) => a.formationId === f.id);
          const caF = elevesF.reduce((acc, a) => acc + (a.montantContrat || 0), 0);
          const encF = entreesCentre
            .filter((m) => m.formationId === f.id || elevesF.some((a) => a.id === m.apprenantId))
            .reduce((acc, m) => acc + m.montant, 0);
          const resteF = Math.max(0, caF - encF);
          const tauxF = caF > 0 ? Math.min(100, Math.round((encF / caF) * 100)) : 0;
          return {
            id: f.id,
            nom: f.nom,
            effectif: elevesF.length,
            attendu: caF,
            encaisse: encF,
            reste: resteF,
            taux: tauxF,
          };
        })
        .filter((f) => f.effectif > 0 || f.attendu > 0 || f.encaisse > 0);

      return {
        id: centre.id,
        nom: centre.nom,
        ville: centre.villeActuelle,
        statut: centre.statut,
        chef,
        effectif,
        confirmes,
        preInscrits,
        caContrats,
        encaisse,
        decaisse,
        soldeNet,
        resteARecouvrer,
        tauxRecouvrement,
        dossiersTotal,
        dossiersComplets,
        livresQuantite,
        livresCa,
        formations: formationsDuCentre,
      };
    });
  }, [
    centres,
    utilisateurs,
    apprenantsSession,
    entreesValides,
    sortiesValides,
    dossiers,
    statsVentesLivres,
    formations,
  ]);

  // Agrégats consolidés pour l'ensemble du réseau
  const consolidéReseau = useMemo(() => {
    const centresActifs = centres.filter((c) => c.statut === "OUVERT").length;
    const effectifTotal = statsParCentre.reduce((acc, c) => acc + c.effectif, 0);
    const confirmesTotal = statsParCentre.reduce((acc, c) => acc + c.confirmes, 0);
    const preInscritsTotal = statsParCentre.reduce((acc, c) => acc + c.preInscrits, 0);
    const caTotal = statsParCentre.reduce((acc, c) => acc + c.caContrats, 0);
    const encaisseTotal = statsParCentre.reduce((acc, c) => acc + c.encaisse, 0);
    const decaisseTotal = statsParCentre.reduce((acc, c) => acc + c.decaisse, 0);
    const soldeConsolide = encaisseTotal - decaisseTotal;
    const resteARecouvrerTotal = Math.max(0, caTotal - encaisseTotal);
    const tauxRecouvrementGlobal =
      caTotal > 0 ? Math.min(100, Math.round((encaisseTotal / caTotal) * 100)) : 100;
    const dossiersTotal = statsParCentre.reduce((acc, c) => acc + c.dossiersTotal, 0);
    const dossiersCompletsTotal = statsParCentre.reduce((acc, c) => acc + c.dossiersComplets, 0);
    const livresTotal = statsParCentre.reduce((acc, c) => acc + c.livresQuantite, 0);
    const livresCaTotal = statsParCentre.reduce((acc, c) => acc + c.livresCa, 0);
    const moyenneApprenantParCentre =
      centresActifs > 0 ? Math.round(effectifTotal / centresActifs) : 0;
    const moyenneCaParApprenant =
      effectifTotal > 0 ? Math.round(caTotal / effectifTotal) : 0;

    return {
      centresActifs,
      centresTotal: centres.length,
      effectifTotal,
      confirmesTotal,
      preInscritsTotal,
      pctConfirmes: effectifTotal > 0 ? Math.round((confirmesTotal / effectifTotal) * 100) : 0,
      caTotal,
      encaisseTotal,
      decaisseTotal,
      soldeConsolide,
      resteARecouvrerTotal,
      tauxRecouvrementGlobal,
      dossiersTotal,
      dossiersCompletsTotal,
      livresTotal,
      livresCaTotal,
      moyenneApprenantParCentre,
      moyenneCaParApprenant,
    };
  }, [centres, statsParCentre]);

  // Alertes réseau stratégiques
  const alertesDirecteur = useMemo(() => {
    const alertes: Array<{
      id: string;
      titre: string;
      description: string;
      gravite: "danger" | "warning" | "info";
      centreId?: string;
    }> = [];

    // 1. Centres en retard critique de recouvrement (<50% avec plus de 5 apprenants)
    statsParCentre.forEach((c) => {
      if (c.statut === "OUVERT" && c.effectif >= 5 && c.tauxRecouvrement < 50) {
        alertes.push({
          id: `recouvrement-${c.id}`,
          titre: `Recouvrement critique : ${c.nom}`,
          description: `Seulement ${c.tauxRecouvrement}% des frais recouvrés (${FCFA.format(c.encaisse)} FCFA encaissés sur ${FCFA.format(c.caContrats)} FCFA attendus).`,
          gravite: "danger",
          centreId: c.id,
        });
      }
    });

    // 2. Centres ouverts sans Chef de centre désigné
    statsParCentre.forEach((c) => {
      if (c.statut === "OUVERT" && !c.chef) {
        alertes.push({
          id: `chef-manquant-${c.id}`,
          titre: `Vacance de poste : ${c.nom}`,
          description: "Aucun chef de centre n'est actuellement affecté à la gestion opérationnelle de ce centre.",
          gravite: "warning",
          centreId: c.id,
        });
      }
    });

    // 3. Volant de pré-inscriptions à transformer
    if (consolidéReseau.preInscritsTotal > 0 && consolidéReseau.effectifTotal > 0) {
      const pctPreInscrits = Math.round(
        (consolidéReseau.preInscritsTotal / consolidéReseau.effectifTotal) * 100,
      );
      if (pctPreInscrits >= 25) {
        alertes.push({
          id: "preinscriptions-reseau",
          titre: `${consolidéReseau.preInscritsTotal} pré-inscriptions en attente (${pctPreInscrits}% de l'effectif)`,
          description: "Un volume important d'apprenants n'a pas encore finalisé le premier versement d'inscription.",
          gravite: "warning",
        });
      }
    }

    return alertes;
  }, [statsParCentre, consolidéReseau]);

  // Filtrage et tri de la table ou de la grille
  const centresAffiches = useMemo(() => {
    let resultats = [...statsParCentre];

    // Filtre texte
    if (rechercheCentre.trim()) {
      const q = rechercheCentre.toLowerCase().trim();
      resultats = resultats.filter(
        (c) =>
          c.nom.toLowerCase().includes(q) ||
          c.ville?.toLowerCase().includes(q) ||
          c.chef?.nom?.toLowerCase().includes(q) ||
          c.chef?.prenom?.toLowerCase().includes(q),
      );
    }

    // Filtre statut
    if (filtreStatutCentre === "OUVERT") {
      resultats = resultats.filter((c) => c.statut === "OUVERT");
    } else if (filtreStatutCentre === "FERME") {
      resultats = resultats.filter((c) => c.statut === "FERME");
    } else if (filtreStatutCentre === "ALERTE_RECOUVREMENT") {
      resultats = resultats.filter((c) => c.statut === "OUVERT" && c.effectif > 0 && c.tauxRecouvrement < 50);
    } else if (filtreStatutCentre === "SANS_CHEF") {
      resultats = resultats.filter((c) => c.statut === "OUVERT" && !c.chef);
    }

    // Tri
    resultats.sort((a, b) => {
      switch (triOption) {
        case "recouvrement_desc":
          return b.tauxRecouvrement - a.tauxRecouvrement;
        case "recouvrement_asc":
          return a.tauxRecouvrement - b.tauxRecouvrement;
        case "ca_desc":
          return b.caContrats - a.caContrats;
        case "ca_asc":
          return a.caContrats - b.caContrats;
        case "effectif_desc":
          return b.effectif - a.effectif;
        case "effectif_asc":
          return a.effectif - b.effectif;
        case "encaisse_desc":
          return b.encaisse - a.encaisse;
        case "encaisse_asc":
          return a.encaisse - b.encaisse;
        case "reste_desc":
          return b.resteARecouvrer - a.resteARecouvrer;
        case "reste_asc":
          return a.resteARecouvrer - b.resteARecouvrer;
        case "nom_desc":
          return b.nom.localeCompare(a.nom, "fr", { sensitivity: "base" });
        case "nom_asc":
        default:
          return a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" });
      }
    });

    return resultats;
  }, [statsParCentre, rechercheCentre, filtreStatutCentre, triOption]);

  // Ventilation des effectifs et CA par formation
  const repartitionFormations = useMemo(() => {
    return formations
      .map((f) => {
        const apprenantsF = apprenantsSession.filter((a) => a.formationId === f.id);
        const effectif = apprenantsF.length;
        const ca = apprenantsF.reduce((acc, a) => acc + (a.montantContrat || 0), 0);
        const part =
          consolidéReseau.effectifTotal > 0
            ? Math.round((effectif / consolidéReseau.effectifTotal) * 100)
            : 0;
        return {
          id: f.id,
          nom: f.nom,
          effectif,
          ca,
          part,
        };
      })
      .filter((f) => f.effectif > 0)
      .sort((a, b) => b.effectif - a.effectif);
  }, [formations, apprenantsSession, consolidéReseau.effectifTotal]);

  // Ventilation des effectifs par centre pour le directeur
  const ventilationEffectifsCentres = useMemo(() => {
    return statsParCentre
      .filter((c) => c.statut === "OUVERT" || c.effectif > 0)
      .map((c) => {
        const part =
          consolidéReseau.effectifTotal > 0
            ? Math.round((c.effectif / consolidéReseau.effectifTotal) * 100)
            : 0;
        return {
          id: c.id,
          nom: c.nom,
          ville: c.ville,
          effectif: c.effectif,
          confirmes: c.confirmes,
          preInscrits: c.preInscrits,
          caContrats: c.caContrats,
          tauxRecouvrement: c.tauxRecouvrement,
          part,
        };
      })
      .sort((a, b) => b.effectif - a.effectif || b.nom.localeCompare(a.nom, "fr"));
  }, [statsParCentre, consolidéReseau.effectifTotal]);

  // Calculs pour le module comparatif multi-vues (Chiffre d'affaires & Encaissement par centre)
  const centresPourGraphique = useMemo(() => {
    return statsParCentre
      .filter((c) => c.statut === "OUVERT")
      .map((c) => ({
        id: c.id,
        nom: c.nom,
        sousTitre: c.ville || "Sans localisation",
        attendu: c.caContrats,
        encaisse: c.encaisse,
        resteARecouvrer: c.resteARecouvrer,
        tauxRecouvrement: c.tauxRecouvrement,
        effectif: c.effectif,
        detailsUrl: `/centres/${c.id}/ventilation`,
        formations: c.formations,
      }));
  }, [statsParCentre]);

  // Formations consolidées du réseau pour comparaison multi-vues
  const itemsFormationsGlobales = useMemo(() => {
    return formations
      .map((f) => {
        const elevesF = apprenantsSession.filter((a) => a.formationId === f.id);
        const ca = elevesF.reduce((acc, a) => acc + (a.montantContrat || 0), 0);
        const enc = entreesValides
          .filter((m) => m.formationId === f.id || elevesF.some((a) => a.id === m.apprenantId))
          .reduce((acc, m) => acc + m.montant, 0);
        const reste = Math.max(0, ca - enc);
        const taux = ca > 0 ? Math.min(100, Math.round((enc / ca) * 100)) : 0;
        return {
          id: f.id,
          nom: f.nom,
          sousTitre: `${elevesF.length} apprenant(s)`,
          attendu: ca,
          encaisse: enc,
          resteARecouvrer: reste,
          tauxRecouvrement: taux,
          effectif: elevesF.length,
        };
      })
      .filter((f) => f.effectif > 0 || f.attendu > 0 || f.encaisse > 0);
  }, [formations, apprenantsSession, entreesValides]);

  // Export CSV de la synthèse réseau
  const exporterSyntheseCSV = () => {
    const enTetes = [
      "Centre",
      "Ville",
      "Statut",
      "Chef de Centre",
      "Effectif Total",
      "Inscrits Confirmes",
      "Pre-Inscrits",
      "Chiffre d'Affaires (FCFA)",
      "Total Encaisse (FCFA)",
      "Total Decaisse (FCFA)",
      "Solde Net (FCFA)",
      "Reste a Recouvrer (FCFA)",
      "Taux de Recouvrement (%)",
      "Dossiers Total",
      "Dossiers Complets",
      "Livrets Vendus",
      "CA Livrets (FCFA)",
    ];

    const lignes = statsParCentre.map((c) => [
      `"${c.nom.replace(/"/g, '""')}"`,
      `"${(c.ville || "").replace(/"/g, '""')}"`,
      c.statut,
      `"${c.chef ? `${c.chef.prenom} ${c.chef.nom}`.replace(/"/g, '""') : "Non assigne"}"`,
      c.effectif,
      c.confirmes,
      c.preInscrits,
      c.caContrats,
      c.encaisse,
      c.decaisse,
      c.soldeNet,
      c.resteARecouvrer,
      c.tauxRecouvrement,
      c.dossiersTotal,
      c.dossiersComplets,
      c.livresQuantite,
      c.livresCa,
    ]);

    // Ligne de totalisation consolidée
    lignes.push([
      `"TOTAL CONSOLIDE RESEAU"`,
      `""`,
      `"${consolidéReseau.centresActifs} / ${consolidéReseau.centresTotal} actifs"`,
      `""`,
      consolidéReseau.effectifTotal,
      consolidéReseau.confirmesTotal,
      consolidéReseau.preInscritsTotal,
      consolidéReseau.caTotal,
      consolidéReseau.encaisseTotal,
      consolidéReseau.decaisseTotal,
      consolidéReseau.soldeConsolide,
      consolidéReseau.resteARecouvrerTotal,
      consolidéReseau.tauxRecouvrementGlobal,
      consolidéReseau.dossiersTotal,
      consolidéReseau.dossiersCompletsTotal,
      consolidéReseau.livresTotal,
      consolidéReseau.livresCaTotal,
    ]);

    const contenuCSV = [enTetes.join(";"), ...lignes.map((l) => l.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + contenuCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    const anneeSession = sessionCourante?.annee ? `_${sessionCourante.annee}` : "";
    lien.setAttribute("href", url);
    lien.setAttribute(
      "download",
      `synthese_reseau_excelis${anneeSession}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
  };

  if (chargementGlobal) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={6} columns={7} />
      </div>
    );
  }

  const nombreCentresEnAlerte = statsParCentre.filter(
    (c) => c.statut === "OUVERT" && c.effectif > 0 && c.tauxRecouvrement < 50,
  ).length;
  const nombreCentresSansChef = statsParCentre.filter(
    (c) => c.statut === "OUVERT" && !c.chef,
  ).length;

  return (
    <div className="w-full space-y-8 pb-16 print:max-w-none print:p-0">
      {/* 1. EN-TÊTE EXÉCUTIF COMPACT */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between print:border-none print:p-0">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Tableau de Bord Exécutif
            </h1>
            {sessionCourante && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                Session {sessionCourante.annee}
              </span>
            )}
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {consolidéReseau.centresActifs} centres actifs
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Pilotage stratégique multi-centres et consolidation financière.
          </p>
        </div>

        {/* Commandes exécutives */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Link
            href="/personnel"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Users size={14} className="text-brand-orange" />
            <span>Personnel</span>
          </Link>

          <div className="relative">
            <select
              value={sessionCourante?.id || ""}
              onChange={(e) => setSessionIdSelectionnee(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-2xs transition hover:border-slate-300 focus:border-brand-orange focus:outline-none cursor-pointer"
              aria-label="Sélectionner la session académique"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  Session {s.annee} {s.statut === "EN_COURS" ? "(En cours)" : `(${s.statut.toLowerCase()})`}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <Button
            onClick={exporterSyntheseCSV}
            className="rounded-xl shadow-xs text-xs font-bold py-2 cursor-pointer"
          >
            <Download size={14} />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* 2. BENTO GRID DE KPIS EXÉCUTIFS (4 CARTES MAJEURES) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* CARTE 1 : Pipeline Inscriptions & Effectif */}
        <Card className="flex flex-col justify-between rounded-2xl border-slate-200/90 p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Effectif Réseau
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tabular-nums tracking-tight text-slate-900">
                {consolidéReseau.effectifTotal}
              </span>
              <span className="text-xs font-semibold text-slate-500">apprenants</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Moyenne : <strong className="text-slate-800">{consolidéReseau.moyenneApprenantParCentre}</strong> élèves / centre
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                {consolidéReseau.confirmesTotal} confirmés ({consolidéReseau.pctConfirmes}%)
              </span>
              <span className="font-semibold text-amber-700">
                {consolidéReseau.preInscritsTotal} pré-inscrits
              </span>
            </div>
            {/* Jauge bicolore élégante */}
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${consolidéReseau.pctConfirmes}%` }}
                title={`${consolidéReseau.pctConfirmes}% confirmés`}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${100 - consolidéReseau.pctConfirmes}%` }}
                title="Pré-inscriptions en attente"
              />
            </div>
          </div>
        </Card>

        {/* CARTE 2 : Volume Contractuel / Chiffre d'Affaires */}
        <Card className="flex flex-col justify-between rounded-2xl border-slate-200/90 p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Volume Contractuel
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-brand-orange">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900 xl:text-3xl">
                {FCFA.format(consolidéReseau.caTotal)}{" "}
                <span className="text-xs font-bold text-slate-500">FCFA</span>
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Panier moyen : <strong className="text-slate-800">{FCFA.format(consolidéReseau.moyenneCaParApprenant)} FCFA</strong>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Centres sous contrat :</span>
              <span className="font-bold text-slate-800">
                {statsParCentre.filter((c) => c.caContrats > 0).length} sur {consolidéReseau.centresTotal}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Taux d&apos;activité :</span>
              <span className="font-semibold text-emerald-700">
                {consolidéReseau.centresTotal > 0
                  ? Math.round((consolidéReseau.centresActifs / consolidéReseau.centresTotal) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </Card>

        {/* CARTE 3 : Recouvrement Réel & Encaissements */}
        <Card className="flex flex-col justify-between rounded-2xl border-slate-200/90 p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Recouvrement Réel
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                  consolidéReseau.tauxRecouvrementGlobal >= 80
                    ? "bg-emerald-50 text-emerald-600"
                    : consolidéReseau.tauxRecouvrementGlobal >= 50
                      ? "bg-amber-50 text-amber-600"
                      : "bg-rose-50 text-rose-600"
                }`}
              >
                <Wallet size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900 xl:text-3xl">
                {FCFA.format(consolidéReseau.encaisseTotal)}{" "}
                <span className="text-xs font-bold text-slate-500">FCFA</span>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">Performance :</span>
              <span
                className={`rounded-md px-1.5 py-0.5 font-bold ${
                  consolidéReseau.tauxRecouvrementGlobal >= 80
                    ? "bg-emerald-100 text-emerald-800"
                    : consolidéReseau.tauxRecouvrementGlobal >= 50
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                }`}
              >
                {consolidéReseau.tauxRecouvrementGlobal}% encaissé
              </span>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Reste à recouvrer :</span>
              <span className="font-bold text-rose-700">
                {FCFA.format(consolidéReseau.resteARecouvrerTotal)} FCFA
              </span>
            </div>
            {/* Jauge fine */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  consolidéReseau.tauxRecouvrementGlobal >= 80
                    ? "bg-emerald-500"
                    : consolidéReseau.tauxRecouvrementGlobal >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${consolidéReseau.tauxRecouvrementGlobal}%` }}
              />
            </div>
          </div>
        </Card>

        {/* CARTE 4 : Trésorerie Nette & Pôles Annexes */}
        <Card className="flex flex-col justify-between rounded-2xl border-slate-200/90 p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Trésorerie Nette
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900 xl:text-3xl">
                {FCFA.format(consolidéReseau.soldeConsolide)}{" "}
                <span className="text-xs font-bold text-slate-500">FCFA</span>
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Total décaissé : {FCFA.format(consolidéReseau.decaisseTotal)} FCFA
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Layers size={13} className="text-slate-400" /> Dossiers concours :
              </span>
              <span className="font-bold text-slate-800">
                {consolidéReseau.dossiersTotal} ({consolidéReseau.dossiersCompletsTotal} ok)
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <BookOpen size={13} className="text-slate-400" /> Vente d&apos;annales :
              </span>
              <span className="font-bold text-slate-800">
                {consolidéReseau.livresTotal} ex. ({FCFA.format(consolidéReseau.livresCaTotal)} F)
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. VIGIE DIRECTORIALE & ALERTES RÉSEAU */}
      {alertesDirecteur.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs print:hidden">
          <div className="flex items-center gap-2 pb-2.5 border-b border-amber-200/60">
            <AlertTriangle size={16} className="text-amber-600" />
            <h2 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              Vigie Réseau — {alertesDirecteur.length} alerte{alertesDirecteur.length > 1 ? "s" : ""} prioritaire{alertesDirecteur.length > 1 ? "s" : ""}
            </h2>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {alertesDirecteur.map((alerte) => (
              <div
                key={alerte.id}
                className="flex items-start justify-between gap-2.5 rounded-xl border border-amber-200/70 bg-white p-3 text-xs shadow-2xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        alerte.gravite === "danger"
                          ? "bg-rose-500"
                          : alerte.gravite === "warning"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <span>{alerte.titre}</span>
                  </div>
                  <p className="text-slate-600 leading-snug">{alerte.description}</p>
                </div>

                {alerte.centreId && (
                  <Link
                    href={`/centres/${alerte.centreId}/ventilation${activeSessionId ? `?session=${activeSessionId}` : ""}`}
                    className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-bold text-brand-orange hover:bg-slate-100 transition-colors"
                    title="Consulter le centre"
                  >
                    Voir <ArrowUpRight size={11} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SUPERVISION MULTI-CENTRES */}
      <Card className="overflow-hidden rounded-2xl border-slate-200/90 shadow-xs">
        {/* Barre d'outils et de filtrage */}
        <div className="flex flex-col gap-4 border-b border-slate-200/80 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-brand-orange" />
              <h2 className="text-base font-black text-slate-900">
                Supervision Multi-Centres
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Consultez et comparez les centres du réseau sous format tabulaire ou fiches visuelles
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 print:hidden">
            {/* Barre de recherche */}
            <div className="relative min-w-[220px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Filtrer centre, ville, chef..."
                value={rechercheCentre}
                onChange={(e) => setRechercheCentre(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-brand-orange focus:bg-white focus:outline-none"
              />
            </div>

            {/* Filtres d'état rapides en pills */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFiltreStatutCentre("TOUS")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  filtreStatutCentre === "TOUS"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tous ({centres.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltreStatutCentre("OUVERT")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  filtreStatutCentre === "OUVERT"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Ouverts ({centres.filter((c) => c.statut === "OUVERT").length})
              </button>
              {nombreCentresEnAlerte > 0 && (
                <button
                  type="button"
                  onClick={() => setFiltreStatutCentre("ALERTE_RECOUVREMENT")}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    filtreStatutCentre === "ALERTE_RECOUVREMENT"
                      ? "bg-rose-50 text-rose-700 shadow-2xs"
                      : "text-rose-600 hover:text-rose-800"
                  }`}
                >
                  En retard ({nombreCentresEnAlerte})
                </button>
              )}
              {nombreCentresSansChef > 0 && (
                <button
                  type="button"
                  onClick={() => setFiltreStatutCentre("SANS_CHEF")}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    filtreStatutCentre === "SANS_CHEF"
                      ? "bg-amber-50 text-amber-800 shadow-2xs"
                      : "text-amber-700 hover:text-amber-900"
                  }`}
                >
                  Sans chef ({nombreCentresSansChef})
                </button>
              )}
            </div>

            {/* Toggle Mode Tableau / Grille (Signature Dribbble ERP) */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModeAffichage("tableau")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                  modeAffichage === "tableau"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Affichage Tableau"
              >
                <List size={14} />
                <span>Tableau</span>
              </button>
              <button
                type="button"
                onClick={() => setModeAffichage("grille")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition ${
                  modeAffichage === "grille"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Affichage Cartes Bento"
              >
                <LayoutGrid size={14} />
                <span>Cartes</span>
              </button>
            </div>

          </div>
        </div>

        {/* AFFICHAGE OPTION 1 : VUE GRILLE DE CARTES BENTO PAR CENTRE */}
        {modeAffichage === "grille" ? (
          <div className="p-6">
            {centresAffiches.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-500">
                Aucun centre ne correspond aux critères sélectionnés.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {centresAffiches.map((centre) => {
                  const estOuvert = centre.statut === "OUVERT";
                  return (
                    <div
                      key={centre.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-brand-orange/50 hover:shadow-sm"
                    >
                      <div>
                        {/* En-tête de carte */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                                estOuvert ? "bg-emerald-500 shadow-2xs" : "bg-slate-400"
                              }`}
                            />
                            <div>
                              <Link
                                href={`/centres/${centre.id}/ventilation${activeSessionId ? `?session=${activeSessionId}` : ""}`}
                                className="font-bold text-slate-900 transition hover:text-brand-orange"
                              >
                                {centre.nom}
                              </Link>
                              <div className="text-[11px] text-slate-500">
                                {centre.ville || "Localisation non précisée"}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              estOuvert
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {estOuvert ? "Opérationnel" : "Fermé"}
                          </span>
                        </div>

                        {/* Responsable */}
                        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                              {centre.chef ? getInitiales(centre.chef.prenom, centre.chef.nom) : "—"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">
                                {centre.chef ? `${centre.chef.prenom} ${centre.chef.nom}` : "Sans chef assigné"}
                              </div>
                              {centre.chef?.telephone && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                  <Phone size={10} /> {centre.chef.telephone}
                                </div>
                              )}
                            </div>
                          </div>
                          {centre.chef ? (
                            <CheckCircle size={14} className="text-emerald-500" />
                          ) : (
                            <HelpCircle size={14} className="text-amber-500" />
                          )}
                        </div>

                        {/* Métriques clés */}
                        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Effectif</span>
                            <div className="font-black text-slate-900 text-base">{centre.effectif} élèves</div>
                            <span className="text-[10px] text-slate-500">{centre.confirmes} confirmés</span>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-white p-2.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Recouvrement</span>
                            <div
                              className={`font-black text-base ${
                                centre.tauxRecouvrement >= 80
                                  ? "text-emerald-700"
                                  : centre.tauxRecouvrement >= 50
                                    ? "text-amber-700"
                                    : "text-rose-700"
                              }`}
                            >
                              {centre.tauxRecouvrement}%
                            </div>
                            <span className="text-[10px] text-slate-500">{FCFA.format(centre.encaisse)} F</span>
                          </div>
                        </div>

                        {/* Jauge de recouvrement */}
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Objectif : {FCFA.format(centre.caContrats)} F</span>
                            <span>Reste : {FCFA.format(centre.resteARecouvrer)} F</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                centre.tauxRecouvrement >= 80
                                  ? "bg-emerald-500"
                                  : centre.tauxRecouvrement >= 50
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                              }`}
                              style={{ width: `${centre.tauxRecouvrement}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer de carte */}
                      <div className="mt-4 border-t border-slate-100 pt-3 text-right">
                        <Link
                          href={`/centres/${centre.id}/ventilation${activeSessionId ? `?session=${activeSessionId}` : ""}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline"
                        >
                          Ventilation &amp; Détails <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* AFFICHAGE OPTION 2 : VUE TABLEAU HAUTE FIDÉLITÉ */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                <tr>
                  <SortableHeader
                    label="Centre & Implantation"
                    sortKey="nom"
                    currentSortKey={triOption.startsWith("nom") ? "nom" : undefined}
                    direction={triOption === "nom_desc" ? "desc" : "asc"}
                    onSort={() => handleTriHeader("nom")}
                    className="whitespace-nowrap"
                  />
                  <th className="px-3.5 py-3 font-bold tracking-wider uppercase whitespace-nowrap">Chef de Centre</th>
                  <SortableHeader
                    label="Effectif"
                    sortKey="effectif"
                    currentSortKey={triOption.startsWith("effectif") ? "effectif" : undefined}
                    direction={triOption === "effectif_asc" ? "asc" : "desc"}
                    onSort={() => handleTriHeader("effectif")}
                    align="right"
                    className="whitespace-nowrap"
                  />
                  <SortableHeader
                    label="Chiffre d'Affaires"
                    sortKey="ca"
                    currentSortKey={triOption.startsWith("ca") ? "ca" : undefined}
                    direction={triOption === "ca_asc" ? "asc" : "desc"}
                    onSort={() => handleTriHeader("ca")}
                    align="right"
                    className="whitespace-nowrap"
                  />
                  <SortableHeader
                    label="Total Encaissé"
                    sortKey="encaisse"
                    currentSortKey={triOption.startsWith("encaisse") ? "encaisse" : undefined}
                    direction={triOption === "encaisse_asc" ? "asc" : "desc"}
                    onSort={() => handleTriHeader("encaisse")}
                    align="right"
                    className="whitespace-nowrap"
                  />
                  <SortableHeader
                    label="Reste à Recouvrer"
                    sortKey="reste"
                    currentSortKey={triOption.startsWith("reste") ? "reste" : undefined}
                    direction={triOption === "reste_asc" ? "asc" : "desc"}
                    onSort={() => handleTriHeader("reste")}
                    align="right"
                    className="whitespace-nowrap"
                  />
                  <SortableHeader
                    label="Taux de Recouvrement"
                    sortKey="recouvrement"
                    currentSortKey={triOption.startsWith("recouvrement") ? "recouvrement" : undefined}
                    direction={triOption === "recouvrement_asc" ? "asc" : "desc"}
                    onSort={() => handleTriHeader("recouvrement")}
                    className="whitespace-nowrap"
                  />
                  <th className="px-3.5 py-3 text-center font-bold tracking-wider uppercase whitespace-nowrap">Dossiers Concours</th>
                  <th className="px-3.5 py-3 text-right font-bold tracking-wider uppercase whitespace-nowrap">Librairie</th>
                  <th className="px-3.5 py-3 text-right font-bold tracking-wider uppercase print:hidden whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {centresAffiches.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      Aucun centre ne correspond aux critères sélectionnés.
                    </td>
                  </tr>
                ) : (
                  centresAffiches.map((centre) => {
                    const estOuvert = centre.statut === "OUVERT";
                    return (
                      <tr
                        key={centre.id}
                        onClick={() =>
                          router.push(
                            `/centres/${centre.id}/ventilation${activeSessionId ? `?session=${activeSessionId}` : ""}`,
                          )
                        }
                        className="cursor-pointer transition-colors hover:bg-slate-50/80"
                      >
                        {/* 1. Centre & Ville (1 ligne) */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white ${
                                estOuvert ? "bg-emerald-500 shadow-2xs" : "bg-slate-400"
                              }`}
                              title={estOuvert ? "Centre opérationnel" : "Centre inactif"}
                            />
                            <Link
                              href={`/centres/${centre.id}/ventilation${activeSessionId ? `?session=${activeSessionId}` : ""}`}
                              className="font-bold text-slate-900 transition hover:text-brand-orange"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {centre.nom}
                            </Link>
                            {centre.ville && (
                              <span className="text-[11px] text-slate-400 font-normal">
                                • {centre.ville}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Chef de centre (1 ligne) */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {centre.chef ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200">
                                {getInitiales(centre.chef.prenom, centre.chef.nom)}
                              </div>
                              <span className="font-semibold text-slate-800">
                                {centre.chef.prenom} {centre.chef.nom}
                              </span>
                              {centre.chef.telephone && (
                                <span className="text-[11px] text-slate-400 font-normal">
                                  ({centre.chef.telephone})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              <UserX size={12} /> Non assigné
                            </span>
                          )}
                        </td>

                        {/* 3. Effectif (1 ligne) */}
                        <td className="px-3.5 py-2.5 text-right font-medium whitespace-nowrap">
                          <span className="font-black text-slate-900 tabular-nums">
                            {centre.effectif}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-1.5 font-normal">
                            ({centre.confirmes} inscrits{centre.preInscrits > 0 ? ` • ${centre.preInscrits} pré` : ""})
                          </span>
                        </td>

                        {/* 4. CA Contrats (1 ligne) */}
                        <td className="px-3.5 py-2.5 text-right font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                          {FCFA.format(centre.caContrats)}{" "}
                          <span className="text-[10px] text-slate-400">F</span>
                        </td>

                        {/* 5. Total Encaissé (1 ligne) */}
                        <td className="px-3.5 py-2.5 text-right font-bold tabular-nums text-emerald-700 whitespace-nowrap">
                          {FCFA.format(centre.encaisse)}{" "}
                          <span className="text-[10px] text-emerald-500">F</span>
                        </td>

                        {/* 6. Reste à Recouvrer (1 ligne) */}
                        <td className="px-3.5 py-2.5 text-right font-bold tabular-nums text-rose-700 whitespace-nowrap">
                          {FCFA.format(centre.resteARecouvrer)}{" "}
                          <span className="text-[10px] text-rose-400">F</span>
                        </td>

                        {/* 7. Jauge Taux de Recouvrement (1 ligne) */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 shrink-0">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  centre.tauxRecouvrement >= 80
                                    ? "bg-emerald-500"
                                    : centre.tauxRecouvrement >= 50
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                }`}
                                style={{ width: `${centre.tauxRecouvrement}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-bold tabular-nums ${
                                centre.tauxRecouvrement >= 80
                                  ? "text-emerald-700"
                                  : centre.tauxRecouvrement >= 50
                                    ? "text-amber-700"
                                    : "text-rose-700"
                              }`}
                            >
                              {centre.tauxRecouvrement}%
                            </span>
                          </div>
                        </td>

                        {/* 8. Dossiers Concours (1 ligne) */}
                        <td className="px-3.5 py-2.5 text-center font-medium whitespace-nowrap">
                          {centre.dossiersTotal > 0 ? (
                            <span>
                              <span className="font-bold text-slate-900">
                                {centre.dossiersTotal}
                              </span>
                              <span className="text-[11px] text-slate-500 font-normal">
                                {" "}({centre.dossiersComplets} ok)
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* 9. Librairie (1 ligne) */}
                        <td className="px-3.5 py-2.5 text-right font-medium whitespace-nowrap">
                          {centre.livresQuantite > 0 ? (
                            <span>
                              <span className="font-bold text-slate-900">
                                {centre.livresQuantite} ex.
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal ml-1">
                                ({FCFA.format(centre.livresCa)} F)
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* 10. Action (1 ligne) */}
                        <td className="px-3.5 py-2.5 text-right print:hidden whitespace-nowrap">
                          <Link
                            href={`/centres/${centre.id}/ventilation${activeSessionId ? `?session=${activeSessionId}` : ""}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs transition hover:border-brand-orange hover:bg-slate-50 hover:text-brand-orange"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Détails <ArrowUpRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* LIGNE DE TOTALISATION CONSOLIDÉE DU RÉSEAU (1 ligne) */}
              <tfoot className="border-t-2 border-slate-300 bg-slate-100/90 font-bold text-slate-900">
                <tr>
                  <td className="px-3.5 py-2.5 font-black uppercase whitespace-nowrap" colSpan={2}>
                    TOTAL CONSOLIDÉ DU RÉSEAU ({consolidéReseau.centresActifs} / {consolidéReseau.centresTotal} centres)
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-black tabular-nums whitespace-nowrap">
                    <span>{consolidéReseau.effectifTotal}</span>
                    <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                      ({consolidéReseau.confirmesTotal} inscrits{consolidéReseau.preInscritsTotal > 0 ? ` • ${consolidéReseau.preInscritsTotal} pré` : ""})
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-black tabular-nums whitespace-nowrap">
                    {FCFA.format(consolidéReseau.caTotal)} F
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-black tabular-nums text-emerald-800 whitespace-nowrap">
                    {FCFA.format(consolidéReseau.encaisseTotal)} F
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-black tabular-nums text-rose-800 whitespace-nowrap">
                    {FCFA.format(consolidéReseau.resteARecouvrerTotal)} F
                  </td>
                  <td className="px-3.5 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-black">
                      <span
                        className={
                          consolidéReseau.tauxRecouvrementGlobal >= 80
                            ? "text-emerald-800"
                            : "text-amber-800"
                        }
                      >
                        {consolidéReseau.tauxRecouvrementGlobal}%
                      </span>
                      <span className="text-[10px] font-normal text-slate-500">global</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-center font-black whitespace-nowrap">
                    {consolidéReseau.dossiersTotal} ({consolidéReseau.dossiersCompletsTotal} ok)
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-black whitespace-nowrap">
                    <span>{consolidéReseau.livresTotal} ex.</span>{" "}
                    <span className="text-[11px] font-normal text-slate-500">
                      ({FCFA.format(consolidéReseau.livresCaTotal)} F)
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 print:hidden whitespace-nowrap"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* ── 5. Visualisation Graphique : Évolution comparative des centres — Session active ── */}
      <EvolutionPerformancesMultiCentres
        sessionActive={sessionCourante}
        centres={centres}
        apprenantsSession={apprenantsSession}
        entreesValides={entreesValides}
      />

      {/* 6. DEUX VOLETS STRATÉGIQUES EN BENTO GRID (PÉDAGOGIE & TRÉSORERIE) */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        {/* Volet A : Répartition Pédagogique par Formation */}
        <Card className="flex flex-col justify-between overflow-hidden rounded-3xl border-slate-200/90 p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-brand-orange" />
                <h3 className="text-sm font-bold text-slate-900">
                  Ventilation par Filière de Formation
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {repartitionFormations.length} filières actives
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {repartitionFormations.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  Aucune formation enregistrée avec des apprenants pour cette session.
                </p>
              ) : (
                repartitionFormations.map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-800">
                        {f.nom}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{f.effectif} élèves</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{f.part}%</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-emerald-700">{FCFA.format(f.ca)} F</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-orange transition-all duration-300"
                        style={{ width: `${f.part}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-3 text-right">
            <Link
              href="/formations"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline"
            >
              Gérer le catalogue des formations <ArrowRight size={13} />
            </Link>
          </div>
        </Card>

        {/* Volet B : Ventilation des Effectifs des Centres */}
        <Card className="flex flex-col justify-between overflow-hidden rounded-3xl border-slate-200/90 p-6 shadow-xs">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-brand-orange" />
                <h3 className="text-sm font-bold text-slate-900">
                  Ventilation des Effectifs par Centre
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {ventilationEffectifsCentres.length} centres
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {ventilationEffectifsCentres.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  Aucun apprenant enregistré dans les centres pour cette session.
                </p>
              ) : (
                ventilationEffectifsCentres.map((c) => (
                  <div key={c.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/centres/${c.id}/ventilation${activeSessionId ? `?session=${activeSessionId}` : ""}`}
                          className="font-bold text-slate-800 hover:text-brand-orange transition-colors"
                        >
                          {c.nom}
                        </Link>
                        {c.ville && (
                          <span className="text-[11px] text-slate-400">
                            • {c.ville}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">
                          {c.effectif} {c.effectif > 1 ? "élèves" : "élève"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">{c.part}%</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500">
                          {c.confirmes} confirmés{c.preInscrits > 0 ? ` / ${c.preInscrits} pré` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${c.part}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-3 text-right">
            <Link
              href="/centres"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline"
            >
              Consulter la liste des centres <ArrowRight size={13} />
            </Link>
          </div>
        </Card>
      </div>

    </div>
  );
}
