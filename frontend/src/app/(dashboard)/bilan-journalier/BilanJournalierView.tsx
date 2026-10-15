"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Plus,
  Building2,
  Lock,
  FileSpreadsheet,
  Check,
  CheckCircle2,
  Clock,
  Landmark,
  ChevronDown,
  Layers,
  Pencil,
  X,
} from "lucide-react";
import { useCentres, useSessionActive } from "@/modules/centres-sessions";
import { useFormations, type Formation } from "@/modules/academique";
import {
  useBilanDuJour,
  useMouvementsFinanciers,
  useMotifs,
  useRepartitionFormations,
  useSoumettreBilanCaissier,
  useValiderBilanChefCentre,
  useValiderBilanControleur,
  useAjusterActiviteBilan,
} from "@/modules/financier/data/queries";
import { EnregistrerVersementModal } from "@/modules/financier/components/EnregistrerVersementModal";
import { SaisirSortieModal } from "@/modules/financier/components/SaisirSortieModal";
import { FicheBilanPrintModal } from "@/modules/financier/components/FicheBilanPrintModal";
import { SyntheseNationaleView } from "./SyntheseNationaleView";
import { nombreEnLettres } from "@/shared/lib/nombre-en-lettres";

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

  // Contrôles d'accès et séparation des rôles :
  // - Directeur / Contrôleur : vision nationale consolidée + sélection des centres, mais interdiction d'encaisser/décaisser
  // - Chef de centre / Caissier : restreint strictement au centre affecté, possibilité de saisir versements et sorties
  const estDirecteurOuControleur =
    user?.role === "DIRECTEUR" ||
    user?.role === "COMPTABLE" ||
    user?.role === "ADMIN";

  const peutSaisirMouvement =
    user?.role === "CAISSIER" ||
    user?.role === "CHEF_CENTRE" ||
    user?.role === "CHEF_DE_CENTRE";

  const [vueDirecteur, setVueDirecteur] = useState<"synthese" | "detail">("synthese");
  // Si l'utilisateur n'est pas un directeur ou contrôleur national, il ne peut JAMAIS voir la synthèse nationale
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
  const { data: repartitionFormations = [] } = useRepartitionFormations(bilan?.id || undefined);

  // Mutations pour le circuit des 3 visas
  const { mutate: soumettreCaissier, isPending: enCoursSoumission } =
    useSoumettreBilanCaissier();
  const { mutate: validerChefCentre, isPending: enCoursVisaChef } =
    useValiderBilanChefCentre();
  const { mutate: validerControleur, isPending: enCoursCloture } =
    useValiderBilanControleur();
  const { mutate: ajusterActivite, isPending: enCoursAjustement } =
    useAjusterActiviteBilan();

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

  // Montants convertis en toutes lettres (conforme à la fiche officielle imprimée)
  const totalEntreesLettres = useMemo(() => nombreEnLettres(totalEntrees), [totalEntrees]);
  const totalSortiesLettres = useMemo(() => nombreEnLettres(totalSorties), [totalSorties]);
  const netAVerserLettres = useMemo(() => nombreEnLettres(netAVerser), [netAVerser]);

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

  // Traitement des Visas
  const handleVisaCaissier = () => {
    if (!centreActifId || !sessionActive?.id) return;
    soumettreCaissier({
      centreId: centreActifId,
      sessionId: sessionActive.id,
      date,
      caissierUtilisateurId: currentUserId,
    });
  };

  const handleVisaChefCentre = () => {
    if (!centreActifId || !sessionActive?.id) return;
    validerChefCentre({
      centreId: centreActifId,
      sessionId: sessionActive.id,
      date,
      validateurUtilisateurId: currentUserId,
    });
  };

  const handleVisaComptable = () => {
    if (!bilan?.id) {
      alert("Le bilan doit d'abord faire l'objet du visa de direction avant la clôture comptable.");
      return;
    }
    validerControleur({
      bilanId: bilan.id,
      validateurUtilisateurId: currentUserId,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── BARRE DE NAVIGATION DIRECTEUR / CONTRÔLEUR (Masquée pour le Chef de Centre) ── */}
      {estDirecteurOuControleur && (
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setVueDirecteur("synthese")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                vueEffective === "synthese"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Building2 className="h-4 w-4 text-[#0e4a56]" />
              <span>Synthèse Nationale (Vue d&apos;ensemble)</span>
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
              <FileSpreadsheet className="h-4 w-4 text-[#0e4a56]" />
              <span>Fiche du Centre ({centreActif?.nom || "Centre"})</span>
            </button>
          </div>
        </div>
      )}

      {/* ── AFFICHAGE SELON L'ONGLET SÉLECTIONNÉ ── */}
      {vueEffective === "synthese" ? (
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
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-[#0e4a56] focus:outline-hidden cursor-pointer"
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
                  <Building2 size={14} className="text-[#0e4a56]" />
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

              {/* Boutons d'ajout d'écritures : STRICTEMENT réservés au Caissier et Chef de centre, MASQUÉS pour Directeur/Comptable */}
              {peutSaisirMouvement && (
                <>
                  <button
                    onClick={() => setModalVersementOuverte(true)}
                    disabled={estCloture}
                    type="button"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <Plus size={14} className="text-[#0e4a56]" />
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
                className="flex items-center gap-1.5 rounded-xl bg-[#0e4a56] hover:bg-[#0b3c48] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                type="button"
              >
                <Printer size={14} />
                <span>Imprimer la fiche officielle</span>
              </button>
            </div>
          </div>

          {/* ── CIRCUIT DE VALIDATION DES ÉCRITURES (STEPPER HORIZONTAL) ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3 mb-5">
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
                  {!bilan?.dateVisaCaissier && !estCloture && peutSaisirMouvement && (
                    <div className="mt-2.5">
                      <button
                        onClick={handleVisaCaissier}
                        disabled={enCoursSoumission}
                        type="button"
                        className="rounded-lg bg-[#0e4a56] hover:bg-[#0b3c48] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
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
                  {bilan?.dateVisaCaissier && !bilan?.dateValidationChefCentre && !estCloture && (
                    <div className="mt-2.5">
                      <button
                        onClick={handleVisaChefCentre}
                        disabled={enCoursVisaChef}
                        type="button"
                        className="rounded-lg bg-[#0e4a56] hover:bg-[#0b3c48] px-5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
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
                  {bilan?.dateValidationChefCentre && !estCloture && estDirecteurOuControleur && (
                    <div className="mt-2.5">
                      <button
                        onClick={handleVisaComptable}
                        disabled={enCoursCloture || !bilan?.id}
                        type="button"
                        className="rounded-lg bg-[#0e4a56] hover:bg-[#0b3c48] px-5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {enCoursCloture ? "Clôture..." : "Clôturer le bilan"}
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
          <div className="rounded-2xl border border-slate-300/80 bg-white p-5 sm:p-8 shadow-sm space-y-6">
            
            {/* ── 1. EN-TÊTE OFFICIEL EXCELIS PREPAS ── */}
            <div className="flex flex-col sm:flex-row items-stretch justify-between gap-4 border-b-2 border-slate-900 pb-4">
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    EX<span className="text-[#E65100]">CELIS</span>
                  </span>
                </div>
                <div className="text-[11px] tracking-[0.25em] font-extrabold text-slate-700">
                  P R E P A S
                </div>
                <div className="text-xs font-bold text-slate-800 mt-1">
                  Centre : <span className="text-[#0e4a56]">{centreActif?.nom || "Centre Yaoundé"}</span>
                </div>
              </div>

              <div className="bg-[#E65100] text-white px-4 py-2.5 rounded-lg max-w-xl flex flex-col justify-center text-left sm:text-right shadow-xs">
                <p className="text-[11px] leading-snug font-medium">
                  Centre d&apos;Excellence académique, d&apos;orientation et de préparation aux concours
                  d&apos;entrée dans les grandes écoles et facultés du Cameroun
                </p>
                <p className="text-xs font-black tracking-wide mt-1 text-amber-200">
                  Orientation - Préparation - Réussite
                </p>
              </div>
            </div>

            {/* ── 2. TITRE FICHE & BANDEAU DES 5 INDICATEURS CLÉS ── */}
            <div className="border border-slate-900 rounded-lg overflow-hidden shadow-2xs">
              <div className="bg-slate-100 py-1.5 text-center font-black text-xs sm:text-sm uppercase tracking-wider border-b border-slate-900 text-slate-900">
                FICHE DE BILAN JOURNALIER
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-900 text-center text-xs">
                <div className="p-2 flex flex-col justify-center bg-slate-50/50">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Réf_date</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-[#0e4a56]">{refDate}</span>
                </div>
                <div className="p-2 flex flex-col justify-center relative group">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Nbre Salles</span>
                    {peutSaisirMouvement && !estCloture && (
                      <button
                        onClick={ouvrirModalActivite}
                        className="opacity-70 hover:opacity-100 transition-opacity text-brand-orange hover:text-orange-700"
                        title="Ajuster les salles et cours du jour"
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
                        className="opacity-70 hover:opacity-100 transition-opacity text-brand-orange hover:text-orange-700"
                        title="Ajuster les salles et cours du jour"
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

            {/* ── 3. SECTION 1 : ENTRÉES (TABLEAU OFFICIEL) ── */}
            <div className="rounded-lg overflow-hidden border border-slate-900 shadow-2xs">
              <div className="bg-[#E65100] text-white py-1 px-4 font-black text-center sm:text-left text-xs uppercase tracking-wider flex items-center justify-between">
                <span>ENTRÉES ({entreesDuJour.length} versement{entreesDuJour.length > 1 ? "s" : ""})</span>
                <span className="font-mono text-xs font-bold text-amber-200">
                  Total : {FCFA.format(totalEntrees)} XAF
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 text-left font-bold text-slate-800">
                      <th className="border-r border-slate-900 p-2 text-center w-10">N°</th>
                      <th className="border-r border-slate-900 p-2">Motif / Désignation</th>
                      <th className="border-r border-slate-900 p-2 text-center w-20">Effectifs</th>
                      <th className="border-r border-slate-900 p-2">Nom Caissier</th>
                      <th className="border-r border-slate-900 p-2 text-right w-36">Montant (XAF)</th>
                      <th className="p-2 text-center w-28">Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {entreesDuJour.length > 0 ? (
                      entreesDuJour.map((e, index) => (
                        <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="border-r border-slate-900 p-2 text-center font-bold text-slate-600">
                            {index + 1}
                          </td>
                          <td className="border-r border-slate-900 p-2 font-medium text-slate-900">
                            <div className="font-semibold">{getNomMotif(e.motifId)}</div>
                            {e.formationId && (
                              <span className="inline-block mt-0.5 text-[10px] font-normal text-slate-500">
                                {getNomFormation(e.formationId)}
                              </span>
                            )}
                          </td>
                          <td className="border-r border-slate-900 p-2 text-center font-medium text-slate-700">1</td>
                          <td className="border-r border-slate-900 p-2 text-slate-700">
                            {bilan?.nomCaissier || "Caissier du centre"}
                          </td>
                          <td className="border-r border-slate-900 p-2 text-right font-bold text-slate-900 tabular-nums">
                            {FCFA.format(e.montant)}
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                bilan?.dateVisaCaissier
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {bilan?.dateVisaCaissier ? "Visé" : "En cours"}
                            </span>
                          </td>
                        </tr>
                      ))
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
                <span className="font-mono text-xs font-bold text-rose-200">
                  Total : {FCFA.format(totalSorties)} XAF
                </span>
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
                      <th className="p-2 text-center w-28">Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {sortiesDuJour.length > 0 ? (
                      sortiesDuJour.map((s, index) => (
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
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                bilan?.dateVisaCaissier
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {bilan?.dateVisaCaissier ? "Validé" : "En cours"}
                            </span>
                          </td>
                        </tr>
                      ))
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

            {/* ── 5. RÉCAPITULATIF FINANCIER & MONTANTS EN TOUTES LETTRES ── */}
            <div className="border border-slate-900 rounded-lg overflow-hidden text-xs shadow-2xs">
              <div className="grid grid-cols-12 divide-x divide-slate-900 border-b border-slate-900">
                <div className="col-span-12 sm:col-span-3 p-2 font-bold uppercase bg-slate-50 text-slate-800">
                  Total Général Entrées :
                </div>
                <div className="col-span-6 sm:col-span-3 p-2 font-black text-right text-slate-900 tabular-nums">
                  {FCFA.format(totalEntrees)} XAF
                </div>
                <div className="col-span-6 sm:col-span-6 p-2 italic text-slate-700 bg-white">
                  {totalEntreesLettres}
                </div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900 border-b border-slate-900">
                <div className="col-span-12 sm:col-span-3 p-2 font-bold uppercase bg-slate-50 text-slate-800">
                  Total Général Sorties :
                </div>
                <div className="col-span-6 sm:col-span-3 p-2 font-black text-right text-rose-800 tabular-nums">
                  {FCFA.format(totalSorties)} XAF
                </div>
                <div className="col-span-6 sm:col-span-6 p-2 italic text-slate-700 bg-white">
                  {totalSortiesLettres}
                </div>
              </div>

              <div className="grid grid-cols-12 divide-x divide-slate-900 bg-amber-50/80 font-bold border-t-2 border-slate-900">
                <div className="col-span-12 sm:col-span-3 p-2.5 font-black uppercase text-[#E65100]">
                  Net à verser (Solde final) :
                </div>
                <div className="col-span-6 sm:col-span-3 p-2.5 font-black text-right text-[#E65100] text-sm sm:text-base tabular-nums">
                  {FCFA.format(netAVerser)} XAF
                </div>
                <div className="col-span-6 sm:col-span-6 p-2.5 font-bold text-slate-900 italic">
                  Arrêté le présent solde net à la somme de : {netAVerserLettres}
                </div>
              </div>
            </div>

            {/* ── 6. COORDONNÉES BANCAIRES UBA & CONSIGNES OFFICIELLES ── */}
            <div className="border border-slate-900 rounded-lg p-3 bg-slate-50/60 text-xs shadow-2xs space-y-1">
              <div className="flex items-center gap-2 font-black text-slate-900 uppercase">
                <Landmark size={15} className="text-[#0e4a56]" />
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
                      {bilan?.dateVisaCaissier && !estCloture && (
                        <button
                          onClick={handleVisaChefCentre}
                          disabled={enCoursVisaChef}
                          type="button"
                          className="rounded-lg bg-[#0e4a56] hover:bg-[#0b3c48] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
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
                      {peutSaisirMouvement && !estCloture && (
                        <button
                          onClick={handleVisaCaissier}
                          disabled={enCoursSoumission}
                          type="button"
                          className="rounded-lg bg-[#0e4a56] hover:bg-[#0b3c48] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
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
                      {bilan?.dateValidationChefCentre && !estCloture && estDirecteurOuControleur && (
                        <button
                          onClick={handleVisaComptable}
                          disabled={enCoursCloture || !bilan?.id}
                          type="button"
                          className="rounded-lg bg-[#0e4a56] hover:bg-[#0b3c48] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                        >
                          {enCoursCloture ? "Clôture..." : "Clôturer le bilan"}
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
                  <Layers size={14} className="text-[#0e4a56]" />
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
                              className="h-full bg-[#0e4a56] rounded-full transition-all duration-300"
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
