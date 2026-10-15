"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Plus,
  Coins,
  Clock,
  Building2,
  Lock,
  ArrowUpRight,
  Wallet,
  FileSpreadsheet,
  Check,
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
} from "@/modules/financier/data/queries";
import { EnregistrerVersementModal } from "@/modules/financier/components/EnregistrerVersementModal";
import { SaisirSortieModal } from "@/modules/financier/components/SaisirSortieModal";
import { FicheBilanPrintModal } from "@/modules/financier/components/FicheBilanPrintModal";
import { SyntheseNationaleView } from "./SyntheseNationaleView";

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

  const estDirecteurOuControleur =
    user?.role === "DIRECTEUR" ||
    user?.role === "COMPTABLE" ||
    user?.role === "ADMIN";

  const [vueDirecteur, setVueDirecteur] = useState<"synthese" | "detail">("synthese");

  // Navigation Date (par défaut aujourd'hui)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Centres & Sessions
  const { data: centres = [] } = useCentres();
  const { data: sessionActive } = useSessionActive();
  const { data: formations = [] } = useFormations();

  const [centreSelectionneId, setCentreSelectionneId] = useState<string>("");

  const centreActifId = useMemo(() => {
    if (centreSelectionneId) return centreSelectionneId;
    if (userCentreId) return userCentreId;
    if (centres.length > 0) return centres[0].id;
    return "";
  }, [centreSelectionneId, userCentreId, centres]);

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

  // Modales
  const [modalVersementOuverte, setModalVersementOuverte] = useState(false);
  const [modalSortieOuverte, setModalSortieOuverte] = useState(false);
  const [modalPrintOuverte, setModalPrintOuverte] = useState(false);
  const [ongletActif, setOngletActif] = useState<"entrees" | "sorties" | "repartition">("entrees");

  // Navigation par jour
  const changerJour = (decalage: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + decalage);
    setDate(d.toISOString().slice(0, 10));
  };

  const estAujourdhui = date === new Date().toISOString().slice(0, 10);

  // Mouvements filtrés pour la date sélectionnée
  const entreesDuJour = useMemo(
    () => mouvements.filter((m) => m.type === "ENTREE" && m.date === date),
    [mouvements, date],
  );
  const sortiesDuJour = useMemo(
    () => mouvements.filter((m) => m.type === "SORTIE" && m.date === date),
    [mouvements, date],
  );

  // Calcul des montants
  const totalEntrees = bilan?.totalEntrees ?? entreesDuJour.reduce((a, b) => a + (b.montant || 0), 0);
  const totalSorties = bilan?.totalSorties ?? sortiesDuJour.reduce((a, b) => a + (b.montant || 0), 0);
  const netAVerser = bilan?.netAVerser ?? totalEntrees - totalSorties;

  // Statut du bilan
  const statut = bilan?.statut || "OUVERT";
  const estCloture = statut === "CLOTURE";

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
      {/* ── BARRE DE NAVIGATION PRINCIPALE (Segmented Control Flottant Image 1 & 2) ── */}
      {estDirecteurOuControleur && (
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setVueDirecteur("synthese")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                vueDirecteur === "synthese"
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
                vueDirecteur === "detail"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 text-[#0e4a56]" />
              <span>Analyse par Centre ({centreActif?.nom || "Centre"})</span>
            </button>
          </div>
        </div>
      )}

      {/* ── AFFICHAGE SELON L'ONGLET SÉLECTIONNÉ ── */}
      {estDirecteurOuControleur && vueDirecteur === "synthese" ? (
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
          {/* ── EN-TÊTE DU BILAN DU CENTRE & ACTIONS CONTEXTUELLES GROUPÉES (Style Image 2) ── */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Bilan journalier de caisse
              </h1>
              <p className="mt-1 text-xs text-slate-500 font-normal">
                {centreActif ? centreActif.nom : "Centre"} • {formaterDateFr(date)} • Session {sessionActive?.annee || "en cours"}
              </p>
            </div>

            {/* Actions contextuelles groupées en haut à droite */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sélecteur de Centre */}
              {centres.length > 1 && (
                <select
                  value={centreActifId}
                  onChange={(e) => setCentreSelectionneId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-slate-400 focus:outline-hidden"
                >
                  {centres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} {c.villeActuelle ? `(${c.villeActuelle})` : ""}
                    </option>
                  ))}
                </select>
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

              {/* Bouton Enregistrer versement */}
              <button
                onClick={() => setModalVersementOuverte(true)}
                disabled={estCloture}
                type="button"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus size={14} className="text-[#0e4a56]" />
                <span>Enregistrer un versement</span>
              </button>

              {/* Bouton Saisir dépense */}
              <button
                onClick={() => setModalSortieOuverte(true)}
                disabled={estCloture}
                type="button"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus size={14} className="text-rose-500" />
                <span>Saisir une dépense</span>
              </button>

              {/* Bouton Imprimer fiche */}
              <button
                onClick={() => setModalPrintOuverte(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                type="button"
              >
                <Printer size={14} className="text-slate-500" />
                <span>Imprimer la fiche</span>
              </button>
            </div>
          </div>

          {/* ── CIRCUIT DE VALIDATION EN FLUX VERTICAL "STEPPER" (Style Image 2) ── */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Circuit de validation des écritures
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arrêté par la caisse, vérifié par la direction du centre et clôturé par le contrôleur financier.
                </p>
              </div>
              <div>
                {statut === "CLOTURE" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                    <Lock size={12} />
                    <span>Journée clôturée et verrouillée</span>
                  </span>
                )}
                {statut === "EN_ATTENTE_CONTROLEUR" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    <Clock size={12} />
                    <span>En attente du visa comptable</span>
                  </span>
                )}
                {statut === "SOUMIS_CAISSIER" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    <Clock size={12} />
                    <span>En attente du visa de direction</span>
                  </span>
                )}
                {statut === "OUVERT" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    <Clock size={12} />
                    <span>Caisse ouverte (saisies en cours)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Stepper Vertical Connecté */}
            <div className="max-w-md mx-auto py-2">
              <div className="relative space-y-6">
                {/* Ligne de connexion verticale */}
                <div className="absolute left-[15px] top-[18px] bottom-[18px] w-0.5 bg-slate-200" />

                {/* Étape 1 : Arrêté de caisse */}
                <div className="relative flex items-start gap-4">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors z-10 ${
                      bilan?.dateVisaCaissier
                        ? "bg-emerald-600 text-white"
                        : "bg-white border-2 border-slate-300 text-slate-400"
                    }`}
                  >
                    {bilan?.dateVisaCaissier ? <Check size={16} /> : "1"}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Arrêté de caisse {bilan?.dateVisaCaissier && "✓"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {bilan?.nomCaissier || "Caissier en service"}
                    </p>
                    {!bilan?.dateVisaCaissier && !estCloture && (
                      <div className="mt-2">
                        <button
                          onClick={handleVisaCaissier}
                          disabled={enCoursSoumission}
                          type="button"
                          className="rounded-lg bg-[#0e4a56] hover:bg-[#0b3c48] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {enCoursSoumission ? "Signature en cours..." : "Signer l'arrêté de caisse"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Étape 2 : Visa direction */}
                <div className="relative flex items-start gap-4">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors z-10 ${
                      bilan?.dateValidationChefCentre
                        ? "bg-emerald-600 text-white"
                        : "bg-white border-2 border-slate-300 text-slate-400"
                    }`}
                  >
                    {bilan?.dateValidationChefCentre ? <Check size={16} /> : "2"}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Visa direction {bilan?.dateValidationChefCentre && "✓"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {bilan?.nomChefCentre || "Direction de centre"}
                    </p>
                    {bilan?.dateVisaCaissier && !bilan?.dateValidationChefCentre && !estCloture && (
                      <div className="mt-2">
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
                </div>

                {/* Étape 3 : Clôture comptable */}
                <div className="relative flex items-start gap-4">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors z-10 ${
                      bilan?.dateValidationControleur
                        ? "bg-emerald-600 text-white"
                        : "bg-white border-2 border-slate-300 text-slate-400"
                    }`}
                  >
                    {bilan?.dateValidationControleur ? <Check size={16} /> : "3"}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        Clôture comptable {bilan?.dateValidationControleur && "✓"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {bilan?.nomControleur || "Contrôleur définitivement"}
                    </p>
                    {bilan?.dateValidationChefCentre && !estCloture && (
                      <div className="mt-2">
                        <button
                          onClick={handleVisaComptable}
                          disabled={enCoursCloture || !bilan?.id}
                          type="button"
                          className="rounded-lg bg-[#0e4a56] hover:bg-[#0b3c48] px-5 py-2 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {enCoursCloture ? "Clôture en cours..." : "Clôturer le bilan"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARTES DE MÉTRIQUES UNIFIÉES (Slim & Typographie percutante Image 2) ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Encaissements */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Total des encaissements
                </span>
                <Coins size={15} className="text-slate-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {FCFA.format(totalEntrees)}{" "}
                  <span className="text-xs font-normal text-slate-400">XAF</span>
                </div>
                <p className="mt-1 text-xs text-slate-400 font-normal">
                  {entreesDuJour.length} versement{entreesDuJour.length > 1 ? "s" : ""} enregistré{entreesDuJour.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Décaissements Ordonnés */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Décaissements ordonnés
                </span>
                <ArrowUpRight size={15} className="text-slate-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-rose-600 tabular-nums">
                  {FCFA.format(totalSorties)}{" "}
                  <span className="text-xs font-normal text-slate-400">XAF</span>
                </div>
                <p className="mt-1 text-xs text-slate-400 font-normal">
                  {sortiesDuJour.length} sortie{sortiesDuJour.length > 1 ? "s" : ""} autorisée{sortiesDuJour.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Solde net à verser (Banque) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Solde net à verser (Banque)
                </span>
                <Wallet size={15} className="text-slate-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {FCFA.format(netAVerser)}{" "}
                  <span className="text-xs font-normal text-slate-400">XAF</span>
                </div>
                <p className="mt-1 text-xs text-slate-400 font-normal">
                  Dépôt bancaire UBA attendu avant 15h
                </p>
              </div>
            </div>

            {/* Activité du jour */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Activité du jour
                </span>
                <Building2 size={15} className="text-slate-400" />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
                <div>
                  <span className="text-slate-400">Salles : </span>
                  <span className="font-semibold text-slate-800 tabular-nums">{bilan?.nombreSalles ?? 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Cours : </span>
                  <span className="font-semibold text-slate-800 tabular-nums">{bilan?.nombreCours ?? 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Inscrits : </span>
                  <span className="font-semibold text-slate-800 tabular-nums">{bilan?.effectifNouveauxEleves ?? 0}</span>
                </div>
                <div>
                  <span className="text-slate-400">Présents : </span>
                  <span className="font-semibold text-slate-800 tabular-nums">{bilan?.effectifTotalCentre ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── TABLEAUX DES ÉCRITURES (Avec Tabs Modernes Style Image 2) ── */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Tabs sombres / modernes au-dessus de la table (comme dans Image 2) */}
            <div className="flex items-center gap-1 bg-slate-900 px-4 py-2">
              <button
                onClick={() => setOngletActif("entrees")}
                type="button"
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  ongletActif === "entrees"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Encaissements ({entreesDuJour.length})
              </button>
              <button
                onClick={() => setOngletActif("sorties")}
                type="button"
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  ongletActif === "sorties"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Décaissements ({sortiesDuJour.length})
              </button>
              <button
                onClick={() => setOngletActif("repartition")}
                type="button"
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  ongletActif === "repartition"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Ventilation par filière
              </button>
            </div>

            {/* Onglet Encaissements */}
            {ongletActif === "entrees" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-100 font-semibold text-slate-500">
                    <tr>
                      <th className="py-3.5 pl-6 pr-2 w-10 text-slate-400 font-normal">#</th>
                      <th className="py-3.5 px-4">Désignation / Motif</th>
                      <th className="py-3.5 px-4">Filière</th>
                      <th className="py-3.5 px-4 text-center">Statut</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entreesDuJour.length > 0 ? (
                      entreesDuJour.map((e, idx) => (
                        <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pl-6 pr-2 text-slate-400 tabular-nums">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">{getNomMotif(e.motifId)}</td>
                          <td className="py-3.5 px-4 text-slate-600">{getNomFormation(e.formationId)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                e.statut === "VALIDE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {e.statut === "VALIDE" ? "Validé" : "En cours"}
                            </span>
                          </td>
                          <td className="py-3.5 pl-4 pr-6 text-right font-semibold text-slate-900 tabular-nums">
                            {FCFA.format(e.montant)} XAF
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          Aucun encaissement enregistré pour la journée du {date}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {entreesDuJour.length > 0 && (
                    <tfoot className="border-t border-slate-100 bg-slate-50/50 font-semibold text-slate-900">
                      <tr>
                        <td colSpan={4} className="py-3.5 pl-6 pr-4 text-right text-slate-500">
                          Total des encaissements
                        </td>
                        <td className="py-3.5 pl-4 pr-6 text-right text-slate-900 tabular-nums text-sm font-bold">
                          {FCFA.format(totalEntrees)} XAF
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Onglet Décaissements */}
            {ongletActif === "sorties" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-100 font-semibold text-slate-500">
                    <tr>
                      <th className="py-3.5 pl-6 pr-2 w-10 text-slate-400 font-normal">#</th>
                      <th className="py-3.5 px-4">Motif de la dépense</th>
                      <th className="py-3.5 px-4">Ordonnateur</th>
                      <th className="py-3.5 px-4 text-center">Statut</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortiesDuJour.length > 0 ? (
                      sortiesDuJour.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pl-6 pr-2 text-slate-400 tabular-nums">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">{getNomMotif(s.motifId)}</td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {s.ordonnateur || "Direction de centre"}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                s.statut === "VALIDE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {s.statut === "VALIDE" ? "Validé" : "En cours"}
                            </span>
                          </td>
                          <td className="py-3.5 pl-4 pr-6 text-right font-semibold text-rose-600 tabular-nums">
                            {FCFA.format(s.montant)} XAF
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          Aucun décaissement enregistré pour la journée du {date}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {sortiesDuJour.length > 0 && (
                    <tfoot className="border-t border-slate-100 bg-slate-50/50 font-semibold text-slate-900">
                      <tr>
                        <td colSpan={4} className="py-3.5 pl-6 pr-4 text-right text-slate-500">
                          Total des décaissements
                        </td>
                        <td className="py-3.5 pl-4 pr-6 text-right text-rose-600 tabular-nums text-sm font-bold">
                          {FCFA.format(totalSorties)} XAF
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Onglet Ventilation par filière */}
            {ongletActif === "repartition" && (
              <div className="p-6">
                <div className="space-y-4">
                  {repartitionFormations.length > 0 ? (
                    repartitionFormations.map((r, i) => {
                      const part = totalEntrees > 0 ? (r.montant / totalEntrees) * 100 : 0;
                      return (
                        <div key={r.formationId || i} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">
                              {getNomFormation(r.formationId)}
                            </span>
                            <span className="font-bold text-slate-900 tabular-nums">
                              {FCFA.format(r.montant)} XAF ({part.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-[#0e4a56] rounded-full transition-all duration-300"
                              style={{ width: `${part}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic py-6 text-center">
                      Aucune répartition par filière pour ce bilan.
                    </p>
                  )}
                </div>
              </div>
            )}
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
          codeCentre={centreActif?.villeActuelle?.slice(0, 2) || "YA"}
          bilan={bilan}
          mouvements={mouvements}
          motifs={motifs}
        />
      )}
    </div>
  );
}
