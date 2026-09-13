"use client";

import React, { useMemo, useState } from "react";
import { Card, Button, Modal } from "@/shared/ui";
import type { Apprenant, CursusApprenant, ContratApprenant } from "@/modules/apprenants";
import { usePhases, useFormations, type Phase, type Formation } from "@/modules/academique";
import {
  useMotifs,
  type Entree,
  type StatutMouvement,
  EnregistrerVersementModal,
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
} from "lucide-react";
import { NegocierContratPhaseModal } from "./NegocierContratPhaseModal";

const FCFA = new Intl.NumberFormat("fr-FR");

const LABELS_STATUT_VERSEMENT: Record<StatutMouvement, string> = {
  VALIDE: "Validé",
  EN_ATTENTE: "En attente",
  REJETE: "Rejeté",
};

const CLASSES_STATUT_VERSEMENT: Record<StatutMouvement, string> = {
  VALIDE: "bg-green-100 text-green-800",
  EN_ATTENTE: "bg-brand-orange/10 text-brand-orange",
  REJETE: "bg-red-100 text-red-800",
};

type LigneVersement = {
  id: string;
  date: string;
  libelle: string;
  montant: number;
  mode: string;
  statut: StatutMouvement;
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
  const { data: motifs } = useMotifs("ENTREE");

  const [modalContratOuvert, setModalContratOuvert] = useState(false);
  const [modalVersementOuvert, setModalVersementOuvert] = useState(false);
  const [contratSelectionne, setContratSelectionne] = useState<ContratTrace | null>(null);
  const [copieRef, setCopieRef] = useState<string | null>(null);

  const montantTotalContrat = cursus?.montantTotalCumule ?? apprenant.montantContrat ?? 0;
  const soldeRestantCalcul = Math.max(montantTotalContrat - montantPaye, 0);

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
  const lignesVersements: LigneVersement[] = (versements ?? []).map((v) => ({
    id: v.id,
    date: v.date,
    libelle: motifs?.find((m) => m.id === v.motifId)?.nom ?? "Versement scolarité",
    montant: v.montant,
    mode: "Espèces / Caisse",
    statut: v.statut,
  }));

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

          <Button
            type="button"
            onClick={() => setModalContratOuvert(true)}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold"
          >
            <Plus size={14} />
            <span>Négocier un contrat (Nouvelle phase)</span>
          </Button>
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
              Versements enregistrés, validés et imputés sur le solde global des contrats.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setModalVersementOuvert(true)}
            className="bg-brand-orange hover:bg-brand-orange/90 text-white flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold shadow-2xs"
          >
            <Coins size={13} />
            <span>Enregistrer un versement</span>
          </Button>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lignesTriees.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 text-slate-600">
                      {new Date(v.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{v.libelle}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Modal Fiche Détaillée & Imprimable du Contrat ── */}
      {contratSelectionne && (
        <Modal
          isOpen={Boolean(contratSelectionne)}
          onClose={() => setContratSelectionne(null)}
          title={`Fiche d'Engagement Contrat · ${contratSelectionne.reference}`}
        >
          <div className="space-y-5 print:p-0">
            {/* Bannière Fiche */}
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-orange block tracking-wider">
                  {contratSelectionne.estInitial
                    ? "Contrat Initial d'Admission"
                    : `Avenant Contractuel · Phase ${contratSelectionne.index}`}
                </span>
                <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                  {contratSelectionne.reference}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Signé le {new Date(contratSelectionne.dateSignature).toLocaleDateString("fr-FR")}
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase ${
                    contratSelectionne.soldeRestantContrat === 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <ShieldCheck size={13} />
                  {contratSelectionne.soldeRestantContrat === 0 ? "Intégralement Soldé" : "En cours"}
                </span>
              </div>
            </div>

            {/* Détails Pédagogiques & Étudiant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bénéficiaire
                </span>
                <p className="text-sm font-black text-slate-900">
                  {apprenant.prenom} {apprenant.nom}
                </p>
                {apprenant.etablissementOrigine && (
                  <p className="text-slate-600">
                    Lycée d&rsquo;origine : {apprenant.etablissementOrigine}
                  </p>
                )}
                {apprenant.contactApprenant && (
                  <p className="text-slate-600">Tél : {apprenant.contactApprenant}</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Programme & Phase
                </span>
                <p className="text-sm font-black text-brand-orange flex items-center gap-1.5">
                  <GraduationCap size={15} />
                  <span>{contratSelectionne.formationAssociee?.nom || "Filière assignée"}</span>
                </p>
                <p className="text-slate-700 font-medium flex items-center gap-1.5">
                  <Layers size={13} className="text-slate-400" />
                  <span>{contratSelectionne.phaseAssociee?.libelle || "Phase du cursus"}</span>
                </p>
              </div>
            </div>

            {/* Bilan Financier du Contrat */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                Ventilation Financière de cet engagement
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block">Montant Souscrit</span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">
                    {FCFA.format(contratSelectionne.montantTotal)} F
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 font-bold block">Règlements Imputés</span>
                  <span className="text-sm font-black text-emerald-800 mt-0.5 block">
                    {FCFA.format(contratSelectionne.montantImpute)} F
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                  <span className="text-[10px] text-brand-orange font-bold block">Reste à Solder</span>
                  <span className="text-sm font-black text-brand-orange mt-0.5 block">
                    {FCFA.format(contratSelectionne.soldeRestantContrat)} F
                  </span>
                </div>
              </div>

              {/* Jauge */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>Couverture du contrat</span>
                  <span>{contratSelectionne.tauxCouverture}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      contratSelectionne.tauxCouverture >= 100
                        ? "bg-emerald-500"
                        : "bg-brand-orange"
                    }`}
                    style={{ width: `${contratSelectionne.tauxCouverture}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Observations / Justificatif */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Justificatif & Observations contractuelles
              </span>
              <p className="text-slate-700 font-medium">
                {contratSelectionne.observations || "Aucune observation particulière enregistrée lors de la signature."}
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <Printer size={13} />
                <span>Imprimer la fiche</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setContratSelectionne(null)}
                className="text-xs font-bold cursor-pointer"
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
          sessionId={apprenant.sessionId}
          formationId={apprenant.formationId}
          soldeRestant={soldeRestantCalcul}
        />
      )}
    </div>
  );
}
