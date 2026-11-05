"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Plus,
  Building2,
  Lock,
  FileSpreadsheet,
  ClipboardCheck,
  Check,
  CheckCircle2,
  Clock,
  Landmark,
  ChevronDown,
  ChevronUp,
  Layers,
  Pencil,
  AlertCircle,
  X,
  BookOpen,
  Loader2,
} from "lucide-react";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useFormations, type Formation } from "@/modules/academique";
import { useApprenants } from "@/modules/apprenants";
import {
  useBilanDuJour,
  useMouvementsFinanciers,
  useMotifs,
  useRepartitionFormations,
  useSoumettreBilanCaissier,
  useValiderBilanChefCentre,
  useValiderBilanControleur,
  useValiderMouvement,
  useAjusterActiviteBilan,
} from "@/modules/financier";
import { validerMouvement } from "@/modules/financier/data/client";
import { EnregistrerVersementModal } from "@/modules/financier/components/EnregistrerVersementModal";
import { SaisirSortieModal } from "@/modules/financier/components/SaisirSortieModal";
import { FicheBilanPrintModal } from "@/modules/financier/components/FicheBilanPrintModal";
import { SyntheseNationaleView } from "./SyntheseNationaleView";
import { TableauControleBilansView } from "./TableauControleBilansView";
import { Logo } from "@/shared/ui";

interface SessionUserExtended {
  id?: string;
  centreId?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

const FCFA = new Intl.NumberFormat("fr-FR");

function formaterDateFr(dateIso: string): string {
  if (!dateIso) return "";
  const [annee, mois, jour] = dateIso.split("-").map(Number);
  const d = new Date(annee, mois - 1, jour);
  const formatted = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function BilanJournalierView() {
  const { data: sessionAuth } = useSession();
  const user = sessionAuth?.user as SessionUserExtended | undefined;
  const userCentreId = user?.centreId;
  const rawUserId = user?.id;
  const isUUID =
    rawUserId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);
  const currentUserId = isUUID ? rawUserId : "00000000-0000-0000-0000-000000000000";

  const [messageNotification, setMessageNotification] = useState<{
    type: "succes" | "erreur";
    message: string;
  } | null>(null);

  // Contrôles d'accès et séparation des rôles :
  // - Directeur / Contrôleur : vision nationale consolidée + sélection des centres, interdiction d'encaisser/décaisser
  // - Chef de centre : consultation stricte du bilan de son centre + signature (visa chef de centre). Aucun enregistrement de versement/sortie ni vente de livres !
  // - Caissier : restreint strictement au centre affecté, enregistrement des versements et sorties, vente de livres, arrêté de caisse
  const estDirecteurOuControleur =
    user?.role === "DIRECTEUR" ||
    user?.role === "COMPTABLE";

  const peutSaisirMouvement = user?.role === "CAISSIER";

  const peutViserChefCentre =
    user?.role === "CHEF_CENTRE" ||
    user?.role === "CHEF_DE_CENTRE" ||
    user?.role === "DIRECTEUR";

  const peutViserCaissier =
    user?.role === "CAISSIER" ||
    user?.role === "DIRECTEUR";

  const peutViserComptable =
    user?.role === "COMPTABLE" ||
    user?.role === "DIRECTEUR";

  const [vueDirecteur, setVueDirecteur] = useState<"liste" | "synthese" | "detail">("detail");
  // Si l'utilisateur n'est pas un directeur ou contrôleur national, il ne peut JAMAIS voir la synthèse nationale ni la liste
  const vueEffective = estDirecteurOuControleur ? vueDirecteur : "detail";

  // Navigation Date (par défaut aujourd'hui)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Centres & Sessions
  const { data: centres = [] } = useCentres();
  const { data: sessionActive } = useSessionActive();
  const { data: formations = [] } = useFormations();

  const [centreSelectionneId, setCentreSelectionneId] = useState<string>("");

  // Règle métier stricte : Un chef de centre ne doit voir que le bilan de son centre
  const centreActifId = useMemo(() => {
    if (!estDirecteurOuControleur) {
      return userCentreId || (centres.length > 0 ? centres[0].id : "");
    }
    if (centreSelectionneId) return centreSelectionneId;
    if (userCentreId) return userCentreId;
    if (centres.length > 0) return centres[0].id;
    return "";
  }, [estDirecteurOuControleur, centreSelectionneId, userCentreId, centres]);

  const centreActif = useMemo(
    () => centres.find((c) => c.id === centreActifId),
    [centres, centreActifId],
  );

  // Données financières du jour
  const { data: bilan } = useBilanDuJour(
    centreActifId,
    sessionActive?.id,
    date,
  );
  const { data: mouvements = [] } = useMouvementsFinanciers(
    sessionActive?.id,
    centreActifId,
  );
  const { data: motifs = [] } = useMotifs();
  const { data: apprenants = [] } = useApprenants();
  const { data: repartitionFormations = [] } = useRepartitionFormations(bilan?.id || undefined);

  // Mutations pour le circuit des visas
  const queryClient = useQueryClient();
  const { mutate: soumettreCaissier, isPending: enCoursSoumission } =
    useSoumettreBilanCaissier();
  const { mutate: validerChefCentre, isPending: enCoursVisaChef } =
    useValiderBilanChefCentre();
  const { mutate: validerControleur, isPending: enCoursCloture } =
    useValiderBilanControleur();
  const { mutate: executerValidationMouvement } =
    useValiderMouvement();
  const { mutate: ajusterActivite, isPending: enCoursAjustement } =
    useAjusterActiviteBilan();

  const [enCoursValidationId, setEnCoursValidationId] = useState<string | null>(null);
  const [groupesDeplies, setGroupesDeplies] = useState<Record<string, boolean>>({});

  // Modales
  const [modalVersementOuverte, setModalVersementOuverte] = useState(false);
  const [modalSortieOuverte, setModalSortieOuverte] = useState(false);
  const [modalPrintOuverte, setModalPrintOuverte] = useState(false);
  const [modalActiviteOuverte, setModalActiviteOuverte] = useState(false);
  const [sallesAjustees, setSallesAjustees] = useState<number>(0);
  const [coursAjustes, setCoursAjustes] = useState<number>(0);
  const [afficherVentilation, setAfficherVentilation] = useState(false);

  const ouvrirModalActivite = () => {
    setSallesAjustees(bilan?.nombreSalles ?? 0);
    setCoursAjustes(bilan?.nombreCours ?? 0);
    setModalActiviteOuverte(true);
  };

  // Navigation par jour
  const changerJour = (decalage: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + decalage);
    setDate(d.toISOString().slice(0, 10));
  };

  const estAujourdhui = date === new Date().toISOString().slice(0, 10);

  // Mouvements filtrés pour la date sélectionnée
  const entreesDuJour = useMemo(
    () => mouvements.filter((m) => m.type === "ENTREE" && m.date === date && m.statut !== "REJETE"),
    [mouvements, date],
  );
  const sortiesDuJour = useMemo(
    () => mouvements.filter((m) => m.type === "SORTIE" && m.date === date && m.statut !== "REJETE"),
    [mouvements, date],
  );

  // Calcul des montants
  const totalEntrees = bilan?.totalEntrees ?? entreesDuJour.reduce((a, b) => a + (b.montant || 0), 0);
  const totalSorties = bilan?.totalSorties ?? sortiesDuJour.reduce((a, b) => a + (b.montant || 0), 0);
  const netAVerser = bilan?.netAVerser ?? totalEntrees - totalSorties;

  // Statut du bilan
  const statut = bilan?.statut || "OUVERT";
  const estCloture = statut === "CLOTURE";

  // Réf_date officielle (ex: YA/15/10/2026)
  const [annee, mois, jour] = (date || "").split("-");
  const codeCentre = centreActif?.villeActuelle?.slice(0, 2).toUpperCase() || "YA";
  const refDate = `${codeCentre}/${jour || "__"}/${mois || "__"}/${annee || "2026"}`;

  // Libellés
  const getNomMotif = (motifId: string) => {
    return motifs.find((m) => m.id === motifId)?.nom || "Opération financière";
  };

  const getNomFormation = (formationId: string | null | undefined) => {
    if (!formationId) return "Tronc commun / Général";
    return formations.find((f: Formation) => f.id === formationId)?.nom || "Formation";
  };

  // Regroupement des entrées par Désignation / Formation
  interface GroupeEntree {
    cle: string;
    titre: string;
    motifNom: string;
    formationNom: string | null;
    isLivre: boolean;
    items: (typeof entreesDuJour);
    effectif: number;
    montantTotal: number;
    nbValides: number;
    nbEnAttente: number;
    tousValides: boolean;
  }

  const groupesEntrees = useMemo(() => {
    const map = new Map<string, GroupeEntree>();

    entreesDuJour.forEach((e) => {
      const motifNom = getNomMotif(e.motifId);
      const isLivre =
        e.motifId === "00000000-0000-0000-0000-000000000012" ||
        motifNom.toLowerCase().includes("livre") ||
        Boolean(e.livreTitre) ||
        Boolean(e.details);

      let cle = "";
      let titre = "";
      let formationNom: string | null = null;

      if (isLivre) {
        const titreLivre = e.details || e.livreTitre || "Vente de livres";
        cle = `livre__${titreLivre}`;
        titre = `Achat de livre : ${titreLivre}`;
      } else if (e.formationId) {
        formationNom = getNomFormation(e.formationId);
        cle = `${e.motifId}__${e.formationId}`;
        titre = `${motifNom} de ${formationNom}`;
      } else {
        cle = `${e.motifId}__general`;
        titre = motifNom;
      }

      if (!map.has(cle)) {
        map.set(cle, {
          cle,
          titre,
          motifNom,
          formationNom,
          isLivre,
          items: [],
          effectif: 0,
          montantTotal: 0,
          nbValides: 0,
          nbEnAttente: 0,
          tousValides: false,
        });
      }

      const grp = map.get(cle)!;
      grp.items.push(e);
      grp.effectif += 1;
      grp.montantTotal += e.montant;
      if (e.statut === "VALIDE") {
        grp.nbValides += 1;
      } else {
        grp.nbEnAttente += 1;
      }
    });

    map.forEach((grp) => {
      grp.tousValides = grp.items.length > 0 && grp.nbValides === grp.items.length;
    });

    return Array.from(map.values());
  }, [entreesDuJour, motifs, formations]);

  const tousDeplies =
    groupesEntrees.length > 0 &&
    groupesEntrees.every((g) => !!groupesDeplies[g.cle]);

  const toggleGroupe = (cle: string) => {
    setGroupesDeplies((prev) => ({ ...prev, [cle]: !prev[cle] }));
  };

  const toggleTousGroupes = () => {
    if (tousDeplies) {
      setGroupesDeplies({});
    } else {
      const next: Record<string, boolean> = {};
      groupesEntrees.forEach((g) => {
        next[g.cle] = true;
      });
      setGroupesDeplies(next);
    }
  };

  // Validation individuelle d'un item par le contrôleur (comptable)
  const handleValiderMouvement = (mouvementId: string) => {
    setEnCoursValidationId(mouvementId);
    executerValidationMouvement(
      {
        mouvementId,
        decision: "VALIDE",
        validateurUtilisateurId: currentUserId,
      },
      {
        onSuccess: () => {
          setEnCoursValidationId(null);
          setMessageNotification({
            type: "succes",
            message: "L'écriture financière a été visée et validée par le contrôle avec succès.",
          });
        },
        onError: (err: any) => {
          setEnCoursValidationId(null);
          setMessageNotification({
            type: "erreur",
            message: err?.message || "Erreur lors de la validation du mouvement.",
          });
        },
      },
    );
  };

  // Validation groupée pour toutes les transactions d'un groupe
  const handleValiderGroupe = async (items: (typeof entreesDuJour)) => {
    const aValider = items.filter((x) => x.statut !== "VALIDE");
    if (aValider.length === 0) return;
    try {
      for (const it of aValider) {
        await validerMouvement({
          mouvementId: it.id,
          decision: "VALIDE",
          validateurUtilisateurId: currentUserId,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["bilan-du-jour"] });
      queryClient.invalidateQueries({ queryKey: ["mouvements-financiers"] });
      setMessageNotification({
        type: "succes",
        message: `${aValider.length} écriture(s) ont été visées et validées avec succès.`,
      });
    } catch (err: any) {
      setMessageNotification({
        type: "erreur",
        message: err?.message || "Erreur lors de la validation.",
      });
    }
  };

  // Traitement des Visas
  const handleVisaCaissier = () => {
    if (!centreActifId || !sessionActive?.id) {
      setMessageNotification({ type: "erreur", message: "Centre ou session active non défini." });
      return;
    }
    setMessageNotification(null);
    soumettreCaissier(
      {
        centreId: centreActifId,
        sessionId: sessionActive.id,
        date,
        caissierUtilisateurId: currentUserId,
      },
      {
        onSuccess: () => {
          setMessageNotification({
            type: "succes",
            message: "Arrêté de caisse visé avec succès. Transmis au Chef de centre.",
          });
        },
        onError: (err: any) => {
          setMessageNotification({
            type: "erreur",
            message: err?.message || "Erreur lors de la signature de l'arrêté de caisse par le caissier.",
          });
        },
      },
    );
  };

  const handleVisaChefCentre = () => {
    if (!centreActifId || !sessionActive?.id) {
      setMessageNotification({ type: "erreur", message: "Centre ou session active non défini." });
      return;
    }
    setMessageNotification(null);
    validerChefCentre(
      {
        centreId: centreActifId,
        sessionId: sessionActive.id,
        date,
        validateurUtilisateurId: currentUserId,
      },
      {
        onSuccess: () => {
          setMessageNotification({
            type: "succes",
            message: "Bilan validé par le Chef de centre avec succès. Transmis au Contrôleur / Comptable.",
          });
        },
        onError: (err: any) => {
          setMessageNotification({
            type: "erreur",
            message: err?.message || "Erreur lors de la validation du bilan par le Chef de centre.",
          });
        },
      },
    );
  };

  const handleVisaComptable = () => {
    if (!bilan?.id && (!centreActifId || !sessionActive?.id)) {
      setMessageNotification({
        type: "erreur",
        message: "Centre ou session active non défini.",
      });
      return;
    }
    setMessageNotification(null);
    const params = bilan?.id
      ? { bilanId: bilan.id, validateurUtilisateurId: currentUserId }
      : {
          centreId: centreActifId,
          sessionId: sessionActive!.id,
          date,
          validateurUtilisateurId: currentUserId,
        };

    validerControleur(params, {
      onSuccess: () => {
        setMessageNotification({
          type: "succes",
          message:
            "Visa et validation du bilan enregistrés. L'ensemble des écritures du jour passe à l'état validé.",
        });
      },
      onError: (err: any) => {
        setMessageNotification({
          type: "erreur",
          message: err?.message || "Erreur lors de la validation du bilan.",
        });
      },
    });
  };

  return (
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* Messages de retour visa ou erreur */}
      {messageNotification && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-medium transition-all ${
            messageNotification.type === "succes"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {messageNotification.type === "succes" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{messageNotification.message}</span>
          </div>
          <button
            onClick={() => setMessageNotification(null)}
            className="p-1 font-bold text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── BARRE DE NAVIGATION DIRECTEUR / CONTRÔLEUR (Masquée pour le Chef de Centre) ── */}
      {estDirecteurOuControleur && (
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setVueDirecteur("liste")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                vueEffective === "liste"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardCheck className="h-4 w-4 text-brand-orange" />
              <span>Contrôle des Bilans</span>
            </button>
            <button
              type="button"
              onClick={() => setVueDirecteur("synthese")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                vueEffective === "synthese"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="h-4 w-4 text-brand-orange" />
              <span>Synthèse du Jour</span>
            </button>
            <button
              type="button"
              onClick={() => setVueDirecteur("detail")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                vueEffective === "detail"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 text-brand-orange" />
              <span>Fiche Journalière</span>
            </button>
          </div>
        </div>
      )}

      {/* ── AFFICHAGE SELON L'ONGLET SÉLECTIONNÉ ── */}
      {vueEffective === "liste" ? (
        <TableauControleBilansView
          onSelectBilan={(id, d) => {
            setCentreSelectionneId(id);
            setDate(d);
            setVueDirecteur("detail");
          }}
        />
      ) : vueEffective === "synthese" ? (
        <SyntheseNationaleView
          date={date}
          onChangerDate={setDate}
          onChangerJour={changerJour}
          onSelectCentre={(id) => {
            setCentreSelectionneId(id);
            setVueDirecteur("detail");
          }}
        />
      ) : (
        <>
          {/* ── BARRE D'ACTIONS OPÉRATIONNELLES ET FILTRES DU BILAN ── */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Fiche de bilan journalier
                </h1>
                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-500/20">
                  {codeCentre}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-normal">
                {centreActif ? centreActif.nom : "Centre"} • {formaterDateFr(date)} • Session {sessionActive?.annee || "en cours"}
              </p>
            </div>

            {/* Actions contextuelles groupées en haut à droite */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sélecteur de Centre : uniquement pour Directeur / Contrôleur national */}
              {estDirecteurOuControleur && centres.length > 1 ? (
                <div className="flex items-center">
                  <select
                    value={centreActifId}
                    onChange={(e) => setCentreSelectionneId(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-brand-orange focus:outline-hidden cursor-pointer"
                  >
                    {centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} {c.villeActuelle ? `(${c.villeActuelle})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
                  <Building2 size={14} className="text-brand-orange" />
                  <span>{centreActif?.nom || "Centre"}</span>
                  {centreActif?.villeActuelle && (
                    <span className="text-[11px] text-slate-400">({centreActif.villeActuelle})</span>
                  )}
                </div>
              )}

              {/* Sélecteur de date */}
              <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs p-0.5">
                <button
                  onClick={() => changerJour(-1)}
                  className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="Jour précédent"
                  type="button"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-800">
                  <Calendar size={13} className="text-slate-500" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="text-xs bg-transparent focus:outline-hidden cursor-pointer tabular-nums"
                  />
                </div>
                <button
                  onClick={() => changerJour(1)}
                  className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="Jour suivant"
                  type="button"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {!estAujourdhui && (
                <button
                  onClick={() => setDate(new Date().toISOString().slice(0, 10))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                  type="button"
                >
                  Aujourd&apos;hui
                </button>
              )}

              {/* Boutons d'ajout d'écritures : STRICTEMENT réservés au Caissier (Chef de centre en lecture seule) */}
              {peutSaisirMouvement && (
                <>
                  <button
                    onClick={() => setModalVersementOuverte(true)}
                    disabled={estCloture}
                    type="button"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Plus size={14} className="text-brand-orange" />
                    <span>Enregistrer versement</span>
                  </button>

                  <button
                    onClick={() => setModalSortieOuverte(true)}
                    disabled={estCloture}
                    type="button"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Plus size={14} className="text-rose-500" />
                    <span>Saisir dépense</span>
                  </button>
                </>
              )}

              {/* Bouton Imprimer fiche officielle */}
              <button
                onClick={() => setModalPrintOuverte(true)}
                className="flex items-center gap-1.5 rounded-xl bg-brand-anthracite hover:bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                type="button"
              >
                <Printer size={14} />
                <span>Imprimer la fiche officielle</span>
              </button>
            </div>
          </div>

          {/* ── CIRCUIT DE VALIDATION DES ÉCRITURES (STEPPER HORIZONTAL) ── */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Circuit de validation de la journée
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arrêté par la caisse, vérifié par la direction du centre et clôturé par le contrôleur financier.
                </p>
              </div>
              <div>
                {statut === "CLOTURE" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                    <Lock size={12} />
                    <span>Journée clôturée et verrouillée</span>
                  </span>
                )}
                {statut === "SOUMIS_CAISSIER" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                    <Clock size={12} />
                    <span>En attente du visa de direction</span>
                  </span>
                )}
                {statut === "OUVERT" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                    <Clock size={12} />
                    <span>Caisse ouverte (saisies en cours)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Stepper horizontal connecté */}
            <div className="relative pt-2 pb-2">
              <div className="hidden md:block absolute top-[20px] left-[16%] right-[16%] h-0.5 bg-slate-200 z-0" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {/* Étape 1 : Arrêté de caisse */}
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-2xs ${
                      bilan?.dateVisaCaissier
                        ? "bg-emerald-600 text-white"
                        : "bg-white border-2 border-slate-300 text-slate-400"
                    }`}
                  >
                    {bilan?.dateVisaCaissier ? <Check size={18} /> : "1"}
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-slate-900">
                      Arrêté de caisse {bilan?.dateVisaCaissier && "✓"}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {bilan?.nomCaissier || "Caissier en service"}
                    </p>
                    {bilan?.dateVisaCaissier && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Signé à {new Date(bilan.dateVisaCaissier).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  {!bilan?.dateVisaCaissier && !estCloture && peutViserCaissier && (
                    <div className="mt-2.5">
                      <button
                        onClick={handleVisaCaissier}
                        disabled={enCoursSoumission}
                        type="button"
                        className="rounded-lg bg-brand-orange hover:bg-brand-orange/90 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {enCoursSoumission ? "Signature..." : "Signer l'arrêté de caisse"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Étape 2 : Visa direction */}
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-2xs ${
                      bilan?.dateValidationChefCentre
                        ? "bg-emerald-600 text-white"
                        : "bg-white border-2 border-slate-300 text-slate-400"
                    }`}
                  >
                    {bilan?.dateValidationChefCentre ? <Check size={18} /> : "2"}
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-slate-900">
                      Visa direction {bilan?.dateValidationChefCentre && "✓"}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {bilan?.nomChefCentre || "Direction de centre"}
                    </p>
                    {bilan?.dateValidationChefCentre && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Validé à {new Date(bilan.dateValidationChefCentre).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  {bilan?.dateVisaCaissier && !bilan?.dateValidationChefCentre && !estCloture && peutViserChefCentre && (
                    <div className="mt-2.5">
                      <button
                        onClick={handleVisaChefCentre}
                        disabled={enCoursVisaChef}
                        type="button"
                        className="rounded-lg bg-brand-orange hover:bg-brand-orange/90 px-5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {enCoursVisaChef ? "Validation..." : "Viser le bilan"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Étape 3 : Clôture comptable */}
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-2xs ${
                      bilan?.dateValidationControleur
                        ? "bg-emerald-600 text-white"
                        : "bg-white border-2 border-slate-300 text-slate-400"
                    }`}
                  >
                    {bilan?.dateValidationControleur ? <Check size={18} /> : "3"}
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-slate-900">
                      Clôture comptable {bilan?.dateValidationControleur && "✓"}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {bilan?.nomControleur || "Contrôleur financier"}
                    </p>
                    {bilan?.dateValidationControleur && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Clôturé à {new Date(bilan.dateValidationControleur).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  {!estCloture && peutViserComptable && (
                    <div className="mt-2.5">
                      <button
                        onClick={handleVisaComptable}
                        disabled={enCoursCloture}
                        type="button"
                        className="rounded-lg bg-brand-anthracite hover:bg-black px-5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {enCoursCloture ? "Visa en cours..." : "Viser et clôturer le bilan"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* ── LA FICHE DE BILAN JOURNALIER (DESIGN FIDÈLE À LA FICHE IMPRIMÉE) ── */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-5">
            
            {/* ── 1. EN-TÊTE OFFICIEL EXCELIS PREPAS ── */}
            <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 border-b-2 border-slate-900 pb-4">
              <div className="flex flex-col justify-center gap-1.5">
                <img
                  src="/images/logo-excelis.png"
                  alt="EXCELIS PRÉPAS"
                  className="h-11 sm:h-12 w-auto object-contain shrink-0"
                  loading="eager"
                  decoding="sync"
                />
                <div className="text-xs font-bold text-slate-800 mt-1">
                  Centre : <span className="text-brand-orange font-black">{centreActif?.nom || "Centre Yaoundé"}</span>
                </div>
              </div>

              <div className="bg-brand-orange text-white px-4 py-2.5 rounded-lg max-w-xl flex flex-col justify-center text-left sm:text-right shadow-xs">
                <p className="text-[11px] leading-snug font-medium">
                  Centre d&apos;Excellence académique, d&apos;orientation et de préparation aux concours
                  d&apos;entrée dans les grandes écoles et facultés du Cameroun
                </p>
                <p className="text-xs font-black tracking-wide mt-1 text-amber-200">
                  Orientation - Préparation - Réussite
                </p>
              </div>
            </div>

            {/* ── 2. TITRE FICHE & BANDEAU DES 5 INDICATEURS CLÉS (ASPECT TABLEAU) ── */}
            <div className="border border-slate-900 rounded-lg overflow-hidden shadow-2xs">
              <div className="bg-slate-100 py-1.5 text-center font-black text-xs sm:text-sm uppercase tracking-wider border-b border-slate-900 text-slate-900">
                FICHE DE BILAN JOURNALIER
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-900 text-center text-xs">
                <div className="p-2 flex flex-col justify-center bg-slate-50/50">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Réf_date</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-brand-anthracite">{refDate}</span>
                </div>
                <div className="p-2 flex flex-col justify-center relative group">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Nbre Salles</span>
                    {peutSaisirMouvement && !estCloture && (
                      <button
                        onClick={ouvrirModalActivite}
                        className="opacity-70 hover:opacity-100 transition-opacity text-brand-orange hover:text-orange-700 cursor-pointer"
                        title="Ajuster les salles et cours du jour"
                        type="button"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <span className="font-bold text-sm text-slate-900 tabular-nums">{bilan?.nombreSalles ?? 0}</span>
                </div>
                <div className="p-2 flex flex-col justify-center relative group">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Nbre Cours</span>
                    {peutSaisirMouvement && !estCloture && (
                      <button
                        onClick={ouvrirModalActivite}
                        className="opacity-70 hover:opacity-100 transition-opacity text-brand-orange hover:text-orange-700 cursor-pointer"
                        title="Ajuster les salles et cours du jour"
                        type="button"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <span className="font-bold text-sm text-slate-900 tabular-nums">{bilan?.nombreCours ?? 0}</span>
                </div>
                <div className="p-2 flex flex-col justify-center bg-blue-50/30">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Nouveaux Élèves</span>
                  <span className="font-bold text-sm text-blue-700 tabular-nums">
                    {bilan?.effectifNouveauxEleves ?? 0}
                  </span>
                </div>
                <div className="p-2 flex flex-col justify-center bg-amber-50/60 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Effectif Total Centre</span>
                  <span className="font-bold text-sm text-amber-800 tabular-nums">
                    {bilan?.effectifTotalCentre ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 3. SECTION 1 : ENTRÉES REGROUPÉES (TABLEAU OFFICIEL) ── */}
            <div className="rounded-lg overflow-hidden border border-slate-900 shadow-2xs">
              <div className="bg-brand-orange text-white py-1.5 px-4 font-black text-center sm:text-left text-xs uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>
                    ENTRÉES ({entreesDuJour.length} versement{entreesDuJour.length > 1 ? "s" : ""})
                  </span>
                  {groupesEntrees.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleTousGroupes}
                      className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[10px] font-bold tracking-normal transition-colors cursor-pointer"
                    >
                      {tousDeplies ? "Tout replier" : "Tout déplier"}
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 text-left font-bold text-slate-800">
                      <th className="border-r border-slate-900 p-2 text-center w-10">N°</th>
                      <th className="border-r border-slate-900 p-2">Motif / Désignation</th>
                      <th className="border-r border-slate-900 p-2 text-center w-24">Effectifs</th>
                      <th className="border-r border-slate-900 p-2">Nom Caissier</th>
                      <th className="border-r border-slate-900 p-2 text-right w-36">Montant Total (XAF)</th>
                      <th className="p-2 text-center w-36">Visa Contrôle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {groupesEntrees.length > 0 ? (
                      groupesEntrees.map((grp, index) => {
                        const estDeplie = !!groupesDeplies[grp.cle];
                        return (
                          <React.Fragment key={grp.cle}>
                            {/* Ligne principale du groupe */}
                            <tr
                              className={`transition-colors border-b border-slate-300 ${
                                estDeplie ? "bg-slate-50/90 font-medium" : "hover:bg-slate-50/80"
                              }`}
                            >
                              <td className="border-r border-slate-900 p-2 text-center font-bold text-slate-600">
                                {index + 1}
                              </td>
                              <td className="border-r border-slate-900 p-2 font-medium text-slate-900">
                                <button
                                  type="button"
                                  onClick={() => toggleGroupe(grp.cle)}
                                  className="flex items-center gap-2 text-left hover:text-brand-orange transition-colors w-full cursor-pointer group"
                                >
                                  <div className="p-1 rounded bg-slate-100 group-hover:bg-orange-50 text-slate-600 group-hover:text-brand-orange transition-colors shrink-0">
                                    {estDeplie ? (
                                      <ChevronUp size={14} className="shrink-0" />
                                    ) : (
                                      <ChevronDown size={14} className="shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                    {grp.isLivre && <BookOpen size={13} className="text-purple-600 shrink-0" />}
                                    <span className="font-bold text-slate-900 group-hover:text-brand-orange">
                                      {grp.titre}
                                    </span>
                                    {grp.isLivre && (
                                      <span className="text-[9px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200 px-1 py-0.2 rounded">
                                        Hors contrat
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </td>
                              <td className="border-r border-slate-900 p-2 text-center font-extrabold text-slate-900 tabular-nums">
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-black">
                                  {grp.effectif}
                                </span>
                              </td>
                              <td className="border-r border-slate-900 p-2 text-slate-700 font-medium">
                                {bilan?.nomCaissier || "Caissier du centre"}
                              </td>
                              <td className="border-r border-slate-900 p-2 text-right font-black text-slate-900 tabular-nums">
                                {FCFA.format(grp.montantTotal)}
                              </td>
                              <td className="p-2 text-center">
                                {grp.tousValides ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <CheckCircle2 size={12} className="text-emerald-700" />
                                    Tous visés ({grp.effectif})
                                  </span>
                                ) : (
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                      {grp.nbValides}/{grp.effectif} visé(s)
                                    </span>
                                    {peutViserComptable && !estCloture && (
                                      <button
                                        type="button"
                                        onClick={() => handleValiderGroupe(grp.items)}
                                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                                        title="Viser toutes les transactions en attente"
                                      >
                                        Tout viser
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>

                            {/* Lignes Accordéon : Intégrées proprement dans la grille du tableau sans boîte imbriquée */}
                            {estDeplie &&
                              grp.items.map((item, itIdx) => {
                                const app = apprenants.find((a) => a.id === item.apprenantId);
                                const nomApp = app ? `${app.nom} ${app.prenom}` : "Versement direct";
                                const estItemValide = item.statut === "VALIDE";
                                const enChargement = enCoursValidationId === item.id;

                                return (
                                  <tr
                                    key={item.id}
                                    className="bg-slate-50/70 hover:bg-amber-50/40 border-b border-slate-200 transition-colors"
                                  >
                                    <td className="border-r border-slate-900 p-2 text-center text-slate-400 font-mono text-[10px]">
                                      {itIdx + 1}
                                    </td>
                                    <td className="border-r border-slate-900 p-2 pl-6 sm:pl-8">
                                      <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/70 shrink-0" />
                                        <div className="min-w-0">
                                          {app ? (
                                            <Link
                                              href={`/apprenants/${app.id}`}
                                              className="font-bold text-slate-900 hover:text-brand-orange transition-colors"
                                            >
                                              {nomApp}
                                            </Link>
                                          ) : (
                                            <span className="font-bold text-slate-900">{nomApp}</span>
                                          )}
                                          {item.details && (
                                            <span className="text-[10px] text-slate-400 block">{item.details}</span>
                                          )}
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                          {item.id.slice(0, 8).toUpperCase()}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="border-r border-slate-900 p-2 text-center text-slate-400 text-xs">
                                      &mdash;
                                    </td>
                                    <td className="border-r border-slate-900 p-2 text-slate-600 text-xs">
                                      {bilan?.nomCaissier || "Caissier du centre"}
                                    </td>
                                    <td className="border-r border-slate-900 p-2 text-right font-black text-emerald-800 tabular-nums">
                                      +{FCFA.format(item.montant)} F
                                    </td>
                                    <td className="p-2 text-center">
                                      {estItemValide ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                          <CheckCircle2 size={12} className="text-emerald-700" />
                                          Visé & Validé
                                        </span>
                                      ) : peutViserComptable && !estCloture ? (
                                        <button
                                          type="button"
                                          onClick={() => handleValiderMouvement(item.id)}
                                          disabled={enChargement}
                                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                          title="Viser directement cette transaction"
                                        >
                                          {enChargement ? (
                                            <>
                                              <Loader2 size={12} className="animate-spin" />
                                              Visa...
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle2 size={12} />
                                              Viser directement
                                            </>
                                          )}
                                        </button>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                                          <Clock size={11} className="text-amber-700" />
                                          En attente
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400 italic bg-white">
                          Aucun encaissement enregistré pour la journée du {dateLisibleFormat(date)}.
                        </td>
                      </tr>
                    )}
                    {/* Ligne Total Entrées */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-900">
                      <td colSpan={4} className="border-r border-slate-900 p-2 text-right uppercase tracking-wide">
                        Total Général Entrées :
                      </td>
                      <td className="border-r border-slate-900 p-2 text-right font-black text-slate-900 text-sm tabular-nums">
                        {FCFA.format(totalEntrees)} XAF
                      </td>
                      <td className="p-2 bg-slate-50"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 4. SECTION 2 : SORTIES (ORDONNATEURS & VALIDATEURS) ── */}
            <div className="rounded-lg overflow-hidden border border-slate-900 shadow-2xs">
              <div className="bg-[#8B0000] text-white py-1 px-4 font-black text-center sm:text-left text-xs uppercase tracking-wider flex items-center justify-between">
                <span>SORTIES ({sortiesDuJour.length} décaissement{sortiesDuJour.length > 1 ? "s" : ""})</span>
                {peutViserComptable && !estCloture && sortiesDuJour.some((s) => s.statut !== "VALIDE") && (
                  <button
                    type="button"
                    onClick={() => handleValiderGroupe(sortiesDuJour)}
                    className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-white text-rose-900 hover:bg-rose-50 shadow-2xs transition-colors cursor-pointer"
                    title="Viser tous les décaissements en attente"
                  >
                    Tout viser ({sortiesDuJour.filter((s) => s.statut !== "VALIDE").length})
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 text-left font-bold text-slate-800">
                      <th className="border-r border-slate-900 p-2 text-center w-10">N°</th>
                      <th className="border-r border-slate-900 p-2">Motif de la dépense</th>
                      <th className="border-r border-slate-900 p-2 text-right w-36">Montant (XAF)</th>
                      <th className="border-r border-slate-900 p-2">Ordonnateur</th>
                      <th className="border-r border-slate-900 p-2">Validateur / Caisse</th>
                      <th className="p-2 text-center w-32">Statut & Contrôle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {sortiesDuJour.length > 0 ? (
                      sortiesDuJour.map((s, index) => {
                        const estItemValide = s.statut === "VALIDE";
                        const enChargement = enCoursValidationId === s.id;

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="border-r border-slate-900 p-2 text-center font-bold text-slate-600">
                              {index + 1}
                            </td>
                            <td className="border-r border-slate-900 p-2 font-medium text-slate-900">
                              {getNomMotif(s.motifId)}
                            </td>
                            <td className="border-r border-slate-900 p-2 text-right font-bold text-rose-700 tabular-nums">
                              {FCFA.format(s.montant)}
                            </td>
                            <td className="border-r border-slate-900 p-2 font-semibold text-slate-800">
                              {s.ordonnateur || "Direction de centre"}
                            </td>
                            <td className="border-r border-slate-900 p-2 text-slate-700">
                              {bilan?.nomCaissier || "Caisse centrale"}
                            </td>
                            <td className="p-2 text-center">
                              {estItemValide ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 size={12} className="text-emerald-700" />
                                  Visé & Validé
                                </span>
                              ) : peutViserComptable && !estCloture ? (
                                <button
                                  type="button"
                                  onClick={() => handleValiderMouvement(s.id)}
                                  disabled={enChargement}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                  title="Viser directement ce décaissement"
                                >
                                  {enChargement ? (
                                    <>
                                      <Loader2 size={12} className="animate-spin" />
                                      Visa...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={12} />
                                      Viser
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                  En attente
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400 italic bg-white">
                          Aucun décaissement enregistré pour la journée du {dateLisibleFormat(date)}.
                        </td>
                      </tr>
                    )}
                    {/* Ligne Total Sorties */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-900">
                      <td colSpan={2} className="border-r border-slate-900 p-2 text-right uppercase tracking-wide">
                        Total Général Sorties :
                      </td>
                      <td className="border-r border-slate-900 p-2 text-right font-black text-rose-800 text-sm tabular-nums">
                        {FCFA.format(totalSorties)} XAF
                      </td>
                      <td colSpan={3} className="p-2 bg-slate-50"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 5. RÉSUMÉ FINANCIER (TABLEAU RÉCAPITULATIF ÉPURÉ) ── */}
            <div className="border border-slate-900 rounded-lg overflow-hidden text-xs shadow-2xs">
              <div className="grid grid-cols-12 divide-x divide-slate-900 border-b border-slate-900">
                <div className="col-span-12 sm:col-span-4 p-2.5 font-bold uppercase bg-slate-50 text-slate-800">
                  Total Général Entrées :
                </div>
                <div className="col-span-12 sm:col-span-8 p-2.5 font-black text-right sm:text-left text-slate-900 tabular-nums text-sm bg-white">
                  {FCFA.format(totalEntrees)} XAF
                </div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900 border-b border-slate-900">
                <div className="col-span-12 sm:col-span-4 p-2.5 font-bold uppercase bg-slate-50 text-slate-800">
                  Total Général Sorties :
                </div>
                <div className="col-span-12 sm:col-span-8 p-2.5 font-black text-right sm:text-left text-rose-800 tabular-nums text-sm bg-white">
                  {FCFA.format(totalSorties)} XAF
                </div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900 bg-amber-50/80 font-bold border-t-2 border-slate-900">
                <div className="col-span-12 sm:col-span-4 p-2.5 font-black uppercase text-brand-orange">
                  Net à verser (Solde final) :
                </div>
                <div className="col-span-12 sm:col-span-8 p-2.5 font-black text-right sm:text-left text-brand-orange text-base tabular-nums">
                  {FCFA.format(netAVerser)} XAF
                </div>
              </div>
            </div>

            {/* ── 6. COORDONNÉES BANCAIRES UBA & CONSIGNES OFFICIELLES ── */}
            <div className="border border-slate-900 rounded-lg p-3 bg-slate-50/60 text-xs shadow-2xs space-y-1">
              <div className="flex items-center gap-2 font-black text-slate-900 uppercase">
                <Landmark size={15} className="text-brand-anthracite" />
                <span>UNITED BANK FOR AFRICA (UBA) CAMEROON S.A</span>
              </div>
              <div className="text-slate-800 font-medium">
                Noms du Compte : <span className="font-bold">ABEGA FLORE ERNESTINE</span> – N° de
                compte : <span className="font-bold font-mono text-slate-900">12002015501</span> – CODE BANQUE :{" "}
                <span className="font-bold font-mono text-slate-900">10033</span>
              </div>
              <p className="text-[11px] text-slate-600 italic leading-snug pt-0.5">
                NB : Les versements se font tous les jours au plus tard à 15H, de même cette fiche
                doit parvenir par tous les moyens au responsable administratif de votre centre pour
                contrôle et archivage avant fermeture effective de vos bureaux.
              </p>
            </div>

            {/* ── 7. CADRE OFFICIEL DES 3 VISAS AVEC BOUTONS D'ACTION INTÉGRÉS ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border border-slate-900 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-900 text-center text-xs overflow-hidden shadow-2xs">
              
              {/* Visa Directeur de centre */}
              <div className="flex flex-col min-h-[140px] bg-white">
                <div className="bg-slate-100 p-2 font-bold border-b border-slate-900 text-slate-900">
                  Visa Directeur(s) de centre
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between items-center gap-2">
                  {bilan?.dateValidationChefCentre ? (
                    <>
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs mt-2">
                        <CheckCircle2 size={16} />
                        <span>Visé & Approuvé</span>
                      </div>
                      <div className="text-xs text-slate-700 font-semibold">
                        {bilan.nomChefCentre || "Chef de centre"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(bilan.dateValidationChefCentre).toLocaleString("fr-FR")}
                      </div>
                    </>
                  ) : (
                    <div className="my-auto flex flex-col items-center gap-2">
                      <span className="text-xs text-slate-400 italic">Cadre réservé au visa</span>
                      {bilan?.dateVisaCaissier && !estCloture && peutViserChefCentre && (
                        <button
                          onClick={handleVisaChefCentre}
                          disabled={enCoursVisaChef}
                          type="button"
                          className="rounded-lg bg-brand-orange hover:bg-brand-orange/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                        >
                          {enCoursVisaChef ? "Visa en cours..." : "Viser le bilan"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Visa Caissier */}
              <div className="flex flex-col min-h-[140px] bg-white">
                <div className="bg-slate-100 p-2 font-bold border-b border-slate-900 text-slate-900">
                  Visa Caissier(s)
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between items-center gap-2">
                  {bilan?.dateVisaCaissier ? (
                    <>
                      <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs mt-2">
                        <CheckCircle2 size={16} />
                        <span>Caisse arrêtée</span>
                      </div>
                      <div className="text-xs text-slate-700 font-semibold">
                        {bilan.nomCaissier || "Caissier"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(bilan.dateVisaCaissier).toLocaleString("fr-FR")}
                      </div>
                    </>
                  ) : (
                    <div className="my-auto flex flex-col items-center gap-2">
                      <span className="text-xs text-slate-400 italic">Cadre réservé au visa</span>
                      {peutViserCaissier && !estCloture && (
                        <button
                          onClick={handleVisaCaissier}
                          disabled={enCoursSoumission}
                          type="button"
                          className="rounded-lg bg-brand-orange hover:bg-brand-orange/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                        >
                          {enCoursSoumission ? "Signature..." : "Signer l'arrêté"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Visa Comptable */}
              <div className="flex flex-col min-h-[140px] bg-white">
                <div className="bg-slate-100 p-2 font-bold border-b border-slate-900 text-slate-900">
                  Visa Comptable (Contrôleur)
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between items-center gap-2">
                  {bilan?.dateValidationControleur ? (
                    <>
                      <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs mt-2">
                        <CheckCircle2 size={16} />
                        <span>Contrôlé & Clôturé</span>
                      </div>
                      <div className="text-xs text-slate-700 font-semibold">
                        {bilan.nomControleur || "Comptable"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(bilan.dateValidationControleur).toLocaleString("fr-FR")}
                      </div>
                    </>
                  ) : (
                    <div className="my-auto flex flex-col items-center gap-2">
                      <span className="text-xs text-slate-400 italic">Cadre réservé au visa</span>
                      {!estCloture && peutViserComptable && (
                        <button
                          onClick={handleVisaComptable}
                          disabled={enCoursCloture}
                          type="button"
                          className="rounded-lg bg-brand-anthracite hover:bg-black px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                        >
                          {enCoursCloture ? "Visa en cours..." : "Viser et clôturer"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── 8. VENTILATION PAR FILIÈRE (ACCORDÉON OPTIONNEL) ── */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAfficherVentilation(!afficherVentilation)}
                className="flex items-center justify-between w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-brand-orange" />
                  <span>Détail de la ventilation par filière ({repartitionFormations.length})</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${afficherVentilation ? "rotate-180" : ""}`}
                />
              </button>

              {afficherVentilation && (
                <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  {repartitionFormations.length > 0 ? (
                    repartitionFormations.map((r, i) => {
                      const part = totalEntrees > 0 ? (r.montant / totalEntrees) * 100 : 0;
                      return (
                        <div key={r.formationId || i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">
                              {getNomFormation(r.formationId)}
                            </span>
                            <span className="font-bold text-slate-900 tabular-nums">
                              {FCFA.format(r.montant)} XAF ({part.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className="h-full bg-brand-orange rounded-full transition-all duration-300"
                              style={{ width: `${part}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-2">
                      Aucune ventilation par filière disponible pour ce bilan.
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </>
      )}

      {/* ── MODALES OPÉRATIONNELLES ── */}
      {modalVersementOuverte && sessionActive && (
        <EnregistrerVersementModal
          isOpen={modalVersementOuverte}
          onClose={() => setModalVersementOuverte(false)}
          centreId={centreActifId}
          sessionId={sessionActive.id}
        />
      )}

      {modalSortieOuverte && sessionActive && (
        <SaisirSortieModal
          isOpen={modalSortieOuverte}
          onClose={() => setModalSortieOuverte(false)}
          centreId={centreActifId}
          sessionId={sessionActive.id}
          dateDefaut={date}
        />
      )}

      {modalPrintOuverte && (
        <FicheBilanPrintModal
          isOpen={modalPrintOuverte}
          onClose={() => setModalPrintOuverte(false)}
          date={date}
          nomCentre={centreActif?.nom || "Centre Yaoundé"}
          codeCentre={codeCentre}
          bilan={bilan}
          mouvements={mouvements}
          motifs={motifs}
          formations={formations}
        />
      )}

      {/* ── MODALE AJUSTEMENT ACTIVITÉ DU JOUR ── */}
      {modalActiviteOuverte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-brand-orange">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Activité Journalière
                  </h3>
                  <p className="text-xs text-slate-500">
                    Salles et cours du jour (Planning)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalActiviteOuverte(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-relaxed">
              💡 <strong>Comptage automatique :</strong> Les cours validés du jour dans le planning et les salles occupées sont automatiquement comptabilisés. Vous pouvez corriger ou forcer ces valeurs avant la clôture du bilan.
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de Salles Occupées / Utilisées
                </label>
                <input
                  type="number"
                  min="0"
                  value={sallesAjustees}
                  onChange={(e) => setSallesAjustees(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-brand-orange focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de Cours Validés / Effectués
                </label>
                <input
                  type="number"
                  min="0"
                  value={coursAjustes}
                  onChange={(e) => setCoursAjustes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-brand-orange focus:outline-hidden focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalActiviteOuverte(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={enCoursAjustement || !sessionActive}
                onClick={() => {
                  if (!sessionActive) return;
                  ajusterActivite(
                    {
                      centreId: centreActifId,
                      sessionId: sessionActive.id,
                      date,
                      nombreSalles: sallesAjustees,
                      nombreCours: coursAjustes,
                      utilisateurId: currentUserId,
                    },
                    {
                      onSuccess: () => setModalActiviteOuverte(false),
                    }
                  );
                }}
                className="flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {enCoursAjustement ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function dateLisibleFormat(dateIso: string): string {
  if (!dateIso) return "";
  const [annee, mois, jour] = dateIso.split("-");
  return `${jour}/${mois}/${annee}`;
}
