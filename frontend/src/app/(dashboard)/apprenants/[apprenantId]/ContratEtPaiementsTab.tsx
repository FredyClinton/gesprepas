"use client";

import React, { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, Button, Modal } from "@/shared/ui";
import type { Apprenant, CursusApprenant, ContratApprenant } from "@/modules/apprenants";
import { usePhases, useFormations, type Phase, type Formation } from "@/modules/academique";
import { useSessionActive, useCentres } from "@/modules/centres-sessions";
import {
  useMotifs,
  useBilanDuJour,
  useSupprimerEntree,
  EnregistrerVersementModal,
  ModifierVersementModal,
  RecuPaiementModal,
  type DonneesRecuPaiement,
  type Entree,
  type StatutMouvement,
  type VersementItem,
} from "@/modules/financier";
import {
  Coins,
  FileText,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  Layers,
  Calendar,
  Eye,
  Printer,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Pencil,
  Trash2,
  Lock,
  BookOpen,
} from "lucide-react";
import { useVentesApprenant } from "@/modules/livres";
import { NegocierContratPhaseModal } from "./NegocierContratPhaseModal";
import { FicheContratPrintModal } from "./FicheContratPrintModal";

const FCFA = new Intl.NumberFormat("fr-FR");

const LABELS_STATUT_VERSEMENT: Record<StatutMouvement, string> = {
  VALIDE: "Validé",
  EN_ATTENTE: "En attente",
  REJETE: "Rejeté",
};

const CLASSES_STATUT_VERSEMENT: Record<StatutMouvement, string> = {
  VALIDE: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  EN_ATTENTE: "bg-amber-50 text-amber-800 border border-amber-200",
  REJETE: "bg-rose-50 text-rose-800 border border-rose-200",
};

type LigneVersement = {
  id: string;
  date: string;
  motifId: string;
  libelle: string;
  montant: number;
  mode: string;
  statut: StatutMouvement;
  isLivre?: boolean;
  livreTitre?: string | null;
};

interface ContratTrace extends ContratApprenant {
  index: number;
  estInitial: boolean;
  phaseAssociee?: Phase;
  formationAssociee?: Formation;
  montantImpute: number;
  soldeRestantContrat: number;
  tauxCouverture: number;
}

export function ContratEtPaiementsTab({
  apprenant,
  versements,
  montantPaye,
  soldeRestant,
  cursus,
}: {
  apprenant: Apprenant;
  versements: Entree[] | undefined;
  montantPaye: number;
  soldeRestant: number;
  cursus?: CursusApprenant | null;
}) {
  const { data: phases = [] } = usePhases();
  const { data: formations = [] } = useFormations();
  const { data: centres = [] } = useCentres();
  const { data: sessionActive } = useSessionActive();
  const { data: motifs } = useMotifs("ENTREE");
  const { data: bilanDuJour } = useBilanDuJour(apprenant.centreId, apprenant.sessionId);
  const { data: authSession } = useSession();
  const { data: ventesApprenant = [] } = useVentesApprenant(apprenant.id);
  const userRole = authSession?.user?.role;

  const peutEncaisser = userRole === "CAISSIER";
  const peutModifierOperationFinanciere = userRole === "CAISSIER";
  const peutNegocierContrat =
    userRole === "CHEF_CENTRE" ||
    userRole === "DIRECTEUR" ||
    userRole === "DIRECTEUR_ACADEMIQUE";

  const [modalContratOuvert, setModalContratOuvert] = useState(false);
  const [modalVersementOuvert, setModalVersementOuvert] = useState(false);
  const [contratSelectionne, setContratSelectionne] = useState<ContratTrace | null>(null);
  const [recuAImprimer, setRecuAImprimer] = useState<DonneesRecuPaiement | null>(null);
  const [copieRef, setCopieRef] = useState<string | null>(null);

  const [versementAModifier, setVersementAModifier] = useState<VersementItem | null>(null);
  const [versementASupprimer, setVersementASupprimer] = useState<{
    id: string;
    montant: number;
    libelle: string;
    date: string;
  } | null>(null);
  const [erreurActionVersement, setErreurActionVersement] = useState<string | null>(null);

  const supprimerEntreeMutation = useSupprimerEntree();

  const montantTotalContrat = cursus?.montantTotalCumule ?? apprenant.montantContrat ?? 0;
  const soldeRestantCalcul = Math.max(montantTotalContrat - montantPaye, 0);

  const nomCentreApprenant =
    centres.find((c) => c.id === apprenant.centreId)?.nom || "Centre EXCELIS PRÉPAS";
  const nomFormationApprenant =
    formations.find((f) => f.id === apprenant.formationId)?.nom || "";

  const imprimerRecuVersement = (v: LigneVersement) => {
    const userObj = authSession?.user as { prenom?: string; nom?: string } | undefined;
    const nomCaissier =
      userObj?.prenom && userObj?.nom
        ? `${userObj.prenom} ${userObj.nom}`
        : authSession?.user?.name || "Service Caisse";

    setRecuAImprimer({
      id: v.id,
      date: v.date,
      heure: "12:00",
      montant: v.montant,
      nomApprenant: `${apprenant.prenom} ${apprenant.nom}`,
      contactApprenant: apprenant.contactApprenant,
      nomFormation: nomFormationApprenant,
      motif: v.libelle,
      nomCentre: nomCentreApprenant,
      nomCaissier,
      montantContrat: v.isLivre ? undefined : montantTotalContrat,
      soldeRestant: v.isLivre ? undefined : soldeRestantCalcul,
    });
  };

  // Liste brute des contrats avec fallback d'admission initial
  const contratsBruts: ContratApprenant[] = useMemo(() => {
    if (cursus?.contrats && cursus.contrats.length > 0) {
      return [...cursus.contrats].sort(
        (a, b) => new Date(a.dateSignature).getTime() - new Date(b.dateSignature).getTime(),
      );
    }
    return [
      {
        id: "init",
        apprenantId: apprenant.id,
        reference: `CTR-${new Date(apprenant.dateInscription).getFullYear()}-INIT`,
        dateSignature: apprenant.dateDefinitionContrat || apprenant.dateInscription,
        montantTotal: apprenant.montantContrat ?? 0,
        statut: "ACTIF",
        observations: "Contrat d'engagement initial (Admission)",
        formationId: apprenant.formationId,
      },
    ];
  }, [cursus?.contrats, apprenant]);

  // Traçabilité avancée avec imputation comptable FIFO des versements
  const contratsTraces: ContratTrace[] = useMemo(() => {
    let soldePayeDisponible = montantPaye;

    return contratsBruts.map((c, index) => {
      // 1. Résolution de la phase
      let phaseAssociee = c.phaseId ? phases.find((p) => p.id === c.phaseId) : undefined;
      if (!phaseAssociee) {
        const ins = cursus?.inscriptionsPhases?.find((i) => i.contratId === c.id);
        if (ins) {
          phaseAssociee = phases.find((p) => p.id === ins.phaseId);
        } else if (index === 0 && phases.length > 0) {
          phaseAssociee = phases[0];
        }
      }

      // 2. Résolution de la formation
      let formationAssociee = c.formationId
        ? formations.find((f) => f.id === c.formationId)
        : undefined;
      if (!formationAssociee) {
        const ins = cursus?.inscriptionsPhases?.find((i) => i.contratId === c.id);
        if (ins) {
          formationAssociee = formations.find((f) => f.id === ins.formationId);
        } else {
          formationAssociee = formations.find((f) => f.id === apprenant.formationId);
        }
      }

      // 3. Imputation FIFO des paiements
      const montantImpute = Math.min(c.montantTotal, Math.max(0, soldePayeDisponible));
      soldePayeDisponible = Math.max(0, soldePayeDisponible - c.montantTotal);
      const soldeRestantContrat = Math.max(0, c.montantTotal - montantImpute);
      const tauxCouverture =
        c.montantTotal > 0 ? Math.min(100, Math.round((montantImpute / c.montantTotal) * 100)) : 100;

      return {
        ...c,
        index: index + 1,
        estInitial: index === 0,
        phaseAssociee,
        formationAssociee,
        montantImpute,
        soldeRestantContrat,
        tauxCouverture,
      };
    });
  }, [contratsBruts, phases, formations, cursus?.inscriptionsPhases, apprenant.formationId, montantPaye]);

  // Historique des versements
  const lignesVersements: LigneVersement[] = (versements ?? []).map((v) => {
    const motifNom = motifs?.find((m) => m.id === v.motifId)?.nom;
    const isLivre =
      v.motifId === "00000000-0000-0000-0000-000000000012" ||
      (motifNom ? motifNom.toLowerCase().includes("livre") : false) ||
      Boolean(v.livreTitre);

    const venteLiee = ventesApprenant.find(
      (vt) => vt.entreeId === v.id || (isLivre && vt.dateVente === v.date && vt.montantTotal === v.montant),
    );
    const titreLivre = v.livreTitre || venteLiee?.livreTitre;

    return {
      id: v.id,
      date: v.date,
      motifId: v.motifId,
      libelle: isLivre && titreLivre ? `Livre : ${titreLivre}` : (motifNom ?? "Versement scolarité"),
      montant: v.montant,
      mode: isLivre ? "Vente Boutique" : "Espèces / Caisse",
      statut: v.statut,
      isLivre,
      livreTitre: titreLivre,
    };
  });

  const lignesTriees = [...lignesVersements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const phasesDejaSuivies = (cursus?.inscriptionsPhases || []).map((i) => i.phaseId);

  const copierReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopieRef(ref);
    setTimeout(() => setCopieRef(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Cartes Synthèse Financière Globale ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5 bg-white border border-slate-200 shadow-2xs">
          <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
            Total des contrats cumulés
          </p>
          <p className="text-brand-anthracite mt-1 text-2xl font-black">
            {FCFA.format(montantTotalContrat)} FCFA
          </p>
          <p className="text-slate-400 mt-1 text-xs">
            {contratsTraces.length} engagement{contratsTraces.length > 1 ? "s" : ""} contractuel{contratsTraces.length > 1 ? "s" : ""} (1 initial + {Math.max(0, contratsTraces.length - 1)} avenant{contratsTraces.length > 2 ? "s" : ""})
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 shadow-2xs">
          <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
            Montant total réglé
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-700">
            {FCFA.format(montantPaye)} FCFA
          </p>
          <p className="text-slate-400 mt-1 text-xs">
            {lignesVersements.filter((v) => v.statut === "VALIDE").length} versement(s) validé(s)
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 shadow-2xs">
          <p className="text-brand-gray text-xs font-bold tracking-wide uppercase">
            Reste global à solder
          </p>
          <p
            className={`mt-1 text-2xl font-black ${
              soldeRestantCalcul > 0 ? "text-brand-orange" : "text-emerald-700"
            }`}
          >
            {FCFA.format(soldeRestantCalcul)} FCFA
          </p>
          <p className="text-slate-400 mt-1 text-xs">
            {soldeRestantCalcul === 0 ? "Contrats intégralement apurés" : "Solde en cours de recouvrement"}
          </p>
        </Card>
      </div>

      {/* ── 2. Frise Chronologique de Traçabilité des Contrats ── */}
      <Card className="p-6 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="text-brand-orange" size={20} />
              <h2 className="text-brand-anthracite text-lg font-bold">
                Frise Chronologique des Contrats & Avenants
              </h2>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Traçabilité visuelle de l&rsquo;évolution contractuelle de l&rsquo;élève au fil des phases pédagogiques.
            </p>
          </div>

          {peutNegocierContrat && (
            <Button
              type="button"
              onClick={() => setModalContratOuvert(true)}
              className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold"
            >
              <Plus size={14} />
              <span>Négocier un contrat (Nouvelle phase)</span>
            </Button>
          )}
        </div>

        {/* Stepper horizontal moderne */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contratsTraces.map((c) => (
            <div
              key={c.id}
              onClick={() => setContratSelectionne(c)}
              className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-orange-50/40 hover:border-orange-200 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                    c.estInitial
                      ? "bg-slate-200 text-slate-800"
                      : "bg-orange-100 text-brand-orange"
                  }`}
                >
                  {c.estInitial ? "Contrat Initial" : `Avenant Phase ${c.index}`}
                </span>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    c.soldeRestantContrat === 0
                      ? "bg-emerald-100 text-emerald-800"
                      : c.montantImpute > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {c.soldeRestantContrat === 0
                    ? "Soldé 100%"
                    : c.montantImpute > 0
                    ? `Couvert ${c.tauxCouverture}%`
                    : "Non réglé"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-900 mb-1">
                <FileText size={13} className="text-brand-orange shrink-0" />
                <span>{c.reference}</span>
              </div>

              <p className="text-xs text-slate-600 font-semibold mb-2 line-clamp-1">
                {c.formationAssociee?.nom || "Programme d'études"}
                {c.phaseAssociee ? ` · ${c.phaseAssociee.libelle}` : ""}
              </p>

              <div className="flex items-end justify-between pt-2 border-t border-slate-200/70 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Montant engagé</span>
                  <span className="font-black text-slate-900">{FCFA.format(c.montantTotal)} F</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block">Reste à payer</span>
                  <span
                    className={`font-black ${
                      c.soldeRestantContrat === 0 ? "text-emerald-700" : "text-brand-orange"
                    }`}
                  >
                    {FCFA.format(c.soldeRestantContrat)} F
                  </span>
                </div>
              </div>

              {/* Jauge d'imputation miniature */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    c.tauxCouverture >= 100
                      ? "bg-emerald-500"
                      : c.tauxCouverture > 0
                      ? "bg-brand-orange"
                      : "bg-slate-300"
                  }`}
                  style={{ width: `${c.tauxCouverture}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 3. Tableau Détaillé des Contrats d'engagement ── */}
      <Card className="p-6 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="text-brand-orange" size={20} />
              <h2 className="text-brand-anthracite text-lg font-bold">
                Registre Détaillé des Contrats d&rsquo;Engagement
              </h2>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Traçabilité comptable et juridique de chaque contrat avec ventilation des montants et état d&rsquo;apurement.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="p-3 font-bold">N° & Réf. Contrat</th>
                <th className="p-3 font-bold">Phase & Programme</th>
                <th className="p-3 font-bold">Date de signature</th>
                <th className="p-3 font-bold">Objet / Observations</th>
                <th className="p-3 font-bold text-right">Montant Contractuel</th>
                <th className="p-3 font-bold text-right">Montant Imputé</th>
                <th className="p-3 font-bold text-right">Solde Dû</th>
                <th className="p-3 font-bold text-center">Couverture</th>
                <th className="p-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contratsTraces.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Référence */}
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">{c.reference}</span>
                      <button
                        type="button"
                        onClick={() => copierReference(c.reference)}
                        title="Copier la référence"
                        className="text-slate-400 hover:text-brand-orange p-0.5 transition-colors"
                      >
                        {copieRef === c.reference ? (
                          <Check size={12} className="text-emerald-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                    <span
                      className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                        c.estInitial ? "bg-slate-100 text-slate-700" : "bg-orange-100 text-brand-orange"
                      }`}
                    >
                      {c.estInitial ? "Initial" : `Avenant ${c.index}`}
                    </span>
                  </td>

                  {/* Phase & Formation */}
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                        <GraduationCap size={12} className="text-brand-orange" />
                        <span>{c.formationAssociee?.nom || "Filière assignée"}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <Layers size={11} className="text-slate-400" />
                        <span>{c.phaseAssociee?.libelle || "Phase du cursus"}</span>
                      </span>
                    </div>
                  </td>

                  {/* Date de signature */}
                  <td className="p-3 text-slate-600 whitespace-nowrap">
                    {new Date(c.dateSignature).toLocaleDateString("fr-FR")}
                  </td>

                  {/* Observations */}
                  <td className="p-3 text-slate-600 max-w-[220px]">
                    <span className="line-clamp-2" title={c.observations || ""}>
                      {c.observations || "Contrat d'engagement standard"}
                    </span>
                  </td>

                  {/* Montant Contractuel */}
                  <td className="p-3 text-right font-black text-slate-900 whitespace-nowrap">
                    {FCFA.format(c.montantTotal)} FCFA
                  </td>

                  {/* Montant Imputé */}
                  <td className="p-3 text-right font-bold text-emerald-800 whitespace-nowrap">
                    {FCFA.format(c.montantImpute)} FCFA
                  </td>

                  {/* Solde Dû sur ce contrat */}
                  <td
                    className={`p-3 text-right font-black whitespace-nowrap ${
                      c.soldeRestantContrat === 0 ? "text-emerald-700" : "text-brand-orange"
                    }`}
                  >
                    {FCFA.format(c.soldeRestantContrat)} FCFA
                  </td>

                  {/* Taux de Couverture */}
                  <td className="p-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase ${
                        c.soldeRestantContrat === 0
                          ? "bg-emerald-100 text-emerald-800"
                          : c.montantImpute > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.soldeRestantContrat === 0 ? (
                        <>
                          <CheckCircle2 size={11} />
                          Soldé
                        </>
                      ) : (
                        `${c.tauxCouverture}%`
                      )}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setContratSelectionne(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:text-brand-orange hover:border-brand-orange/40 hover:bg-orange-50/50 shadow-2xs transition-all cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>Fiche</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── 4. Historique des Versements Encaissés ── */}
      <Card className="p-6 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
          <div>
            <h2 className="text-brand-anthracite text-lg font-bold">
              Historique des Règlements Encaissés
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Versements de scolarité imputés sur les contrats (les achats de livres sont des ventes annexes non déduites du contrat).
            </p>
          </div>
          {peutEncaisser && (
            <Button
              type="button"
              onClick={() => setModalVersementOuvert(true)}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold shadow-2xs"
            >
              <Coins size={13} />
              <span>Enregistrer un versement</span>
            </Button>
          )}
        </div>

        {lignesTriees.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Aucun versement n&rsquo;a encore été enregistré pour cet apprenant.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="p-3 font-bold">Date</th>
                  <th className="p-3 font-bold">Libellé</th>
                  <th className="p-3 font-bold">Mode de règlement</th>
                  <th className="p-3 font-bold">Statut</th>
                  <th className="p-3 font-bold text-right">Montant</th>
                  <th className="p-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lignesTriees.map((v) => {
                  const aujourdhuiStr = new Date().toISOString().slice(0, 10);
                  const bilanAujourdhuiValide =
                    bilanDuJour?.statut === "EN_ATTENTE_CONTROLEUR" || bilanDuJour?.statut === "CLOTURE";
                  const isDateVerrouillee =
                    (v.date === aujourdhuiStr && bilanAujourdhuiValide) ||
                    (v.date < aujourdhuiStr && v.statut === "VALIDE");

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 text-slate-600">
                        {new Date(v.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {v.isLivre && (
                            <BookOpen size={13} className="text-purple-600 inline shrink-0" />
                          )}
                          <span>{v.libelle}</span>
                          {v.isLivre && (
                            <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                              Hors contrat
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">{v.mode}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                            CLASSES_STATUT_VERSEMENT[v.statut]
                          }`}
                        >
                          {LABELS_STATUT_VERSEMENT[v.statut]}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        {FCFA.format(v.montant)} FCFA
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => imprimerRecuVersement(v)}
                            className="p-1 rounded-md text-slate-500 hover:text-brand-orange hover:bg-orange-50 transition-colors cursor-pointer"
                            title="Imprimer le reçu officiel de versement"
                          >
                            <Printer size={13} />
                          </button>

                          {isDateVerrouillee ? (
                            <span
                              title="Bilan clôturé pour cette date (modification verrouillée)"
                              className="inline-flex items-center gap-1 text-slate-400 p-1 cursor-not-allowed"
                            >
                              <Lock size={13} />
                            </span>
                          ) : peutModifierOperationFinanciere ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setVersementAModifier({
                                    id: v.id,
                                    montant: v.montant,
                                    date: v.date,
                                    motifId: v.motifId,
                                    motifNom: v.libelle,
                                    apprenantId: apprenant.id,
                                    apprenantNom: `${apprenant.prenom} ${apprenant.nom}`,
                                  })
                                }
                                className="p-1 rounded-md text-slate-500 hover:text-brand-orange hover:bg-orange-50 transition-colors cursor-pointer"
                                title="Modifier ce versement"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setErreurActionVersement(null);
                                  setVersementASupprimer({
                                    id: v.id,
                                    montant: v.montant,
                                    libelle: v.libelle,
                                    date: v.date,
                                  });
                                }}
                                className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Supprimer ce versement"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : null}
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

      {/* ── Modal Fiche Détaillée & Imprimable du Contrat ── */}
      <FicheContratPrintModal
        isOpen={Boolean(contratSelectionne)}
        onClose={() => setContratSelectionne(null)}
        contrat={contratSelectionne}
        apprenant={apprenant}
        nomCentre={nomCentreApprenant}
      />

      {/* Modal Négocier Contrat pour une nouvelle phase */}
      {modalContratOuvert && (
        <NegocierContratPhaseModal
          isOpen={modalContratOuvert}
          onClose={() => setModalContratOuvert(false)}
          apprenantId={apprenant.id}
          nomApprenant={`${apprenant.prenom} ${apprenant.nom}`}
          phasesDejaSuivies={phasesDejaSuivies}
        />
      )}

      {/* Modal Enregistrer Versement */}
      {modalVersementOuvert && (
        <EnregistrerVersementModal
          isOpen={modalVersementOuvert}
          onClose={() => setModalVersementOuvert(false)}
          apprenantId={apprenant.id}
          nomApprenant={`${apprenant.prenom} ${apprenant.nom}`}
          centreId={apprenant.centreId}
          sessionId={sessionActive?.id || apprenant.sessionId}
          formationId={apprenant.formationId}
          soldeRestant={soldeRestantCalcul}
          onSuccessRecu={(donnees) => setRecuAImprimer(donnees)}
        />
      )}

      {/* ── Modal Modification de Versement ── */}
      {versementAModifier && (
        <ModifierVersementModal
          isOpen={Boolean(versementAModifier)}
          onClose={() => setVersementAModifier(null)}
          versement={versementAModifier}
          soldeRestant={soldeRestantCalcul}
        />
      )}

      {/* ── Modal Confirmation Suppression Versement ── */}
      {versementASupprimer && (
        <Modal
          isOpen={Boolean(versementASupprimer)}
          onClose={() => {
            if (!supprimerEntreeMutation.isPending) {
              setVersementASupprimer(null);
              setErreurActionVersement(null);
            }
          }}
          title="Confirmer la suppression du versement"
        >
          <div className="space-y-4">
            {erreurActionVersement && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{erreurActionVersement}</span>
              </div>
            )}

            <p className="text-xs text-slate-600">
              Êtes-vous certain de vouloir supprimer ce versement ?
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Montant :</span>
                <span className="font-bold text-slate-900">{FCFA.format(versementASupprimer.montant)} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date :</span>
                <span className="font-bold text-slate-900">{new Date(versementASupprimer.date).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Motif :</span>
                <span className="font-bold text-slate-900">{versementASupprimer.libelle}</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Attention :</strong> Cette action est irréversible. Si ce versement est lié à une vente d'ouvrages,
                les enregistrements de vente associés seront automatiquement annulés.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                disabled={supprimerEntreeMutation.isPending}
                onClick={() => {
                  setVersementASupprimer(null);
                  setErreurActionVersement(null);
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                disabled={supprimerEntreeMutation.isPending}
                onClick={async () => {
                  setErreurActionVersement(null);
                  try {
                    await supprimerEntreeMutation.mutateAsync(versementASupprimer.id);
                    setVersementASupprimer(null);
                  } catch (err: unknown) {
                    const msg =
                      err instanceof Error
                        ? err.message
                        : "Impossible de supprimer ce versement : le bilan de cette journée est déjà validé.";
                    setErreurActionVersement(msg);
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {supprimerEntreeMutation.isPending ? "Suppression..." : "Confirmer la suppression"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal d'impression officielle du reçu de versement ── */}
      <RecuPaiementModal
        isOpen={Boolean(recuAImprimer)}
        onClose={() => setRecuAImprimer(null)}
        recu={recuAImprimer}
      />
    </div>
  );
}
