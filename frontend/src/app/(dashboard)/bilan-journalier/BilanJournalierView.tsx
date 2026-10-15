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
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  GraduationCap,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  FileSpreadsheet,
} from "lucide-react";
import { Card } from "@/shared/ui";
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
  useRepartitionFormations(bilan?.id || undefined);

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

  // Libellé de motif
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
      {/* En-tête principal de la page */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Bilan journalier de caisse
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {centreActif ? centreActif.nom : "Centre"} • {formaterDateFr(date)} • Session {sessionActive?.annee || "en cours"}
          </p>
        </div>

        {/* Contrôles de navigation et actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sélecteur de Centre */}
          {centres.length > 1 && (
            <select
              value={centreActifId}
              onChange={(e) => setCentreSelectionneId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-slate-400 focus:outline-none"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} {c.villeActuelle ? `(${c.villeActuelle})` : ""}
                </option>
              ))}
            </select>
          )}

          {/* Sélecteur de date */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-white shadow-2xs">
            <button
              onClick={() => changerJour(-1)}
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-l-lg transition-colors cursor-pointer"
              title="Jour précédent"
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-800">
              <Calendar size={14} className="text-slate-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs bg-transparent focus:outline-none cursor-pointer tabular-nums"
              />
            </div>
            <button
              onClick={() => changerJour(1)}
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-r-lg transition-colors cursor-pointer"
              title="Jour suivant"
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {!estAujourdhui && (
            <button
              onClick={() => setDate(new Date().toISOString().slice(0, 10))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              type="button"
            >
              Aujourd&apos;hui
            </button>
          )}

          {/* Bouton d'impression */}
          <button
            onClick={() => setModalPrintOuverte(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            type="button"
          >
            <Printer size={15} className="text-slate-500" />
            <span>Imprimer la fiche</span>
          </button>
        </div>
      </div>

      {/* Circuit de validation des 3 visas */}
      <Card className="p-5 border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Circuit de validation des écritures
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Arrêté par la caisse, vérifié par la direction du centre et clôturé par le contrôleur financier.
            </p>
          </div>
          <div>
            {statut === "CLOTURE" && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                <Lock size={13} />
                Journée clôturée et verrouillée
              </span>
            )}
            {statut === "EN_ATTENTE_CONTROLEUR" && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 border border-purple-200">
                <Clock size={13} />
                En attente du visa comptable
              </span>
            )}
            {statut === "SOUMIS_CAISSIER" && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                <Clock size={13} />
                En attente du visa de direction
              </span>
            )}
            {statut === "OUVERT" && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
                <Clock size={13} />
                Caisse ouverte (saisies en cours)
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Étape 1 : Visa Caissier */}
          <div className="rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Arrêté de caisse</span>
                {bilan?.dateVisaCaissier ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 size={13} />
                    Signé
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Non signé</span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-900 font-medium truncate">
                {bilan?.nomCaissier || "Caissier en service"}
              </p>
              {bilan?.dateVisaCaissier && (
                <p className="text-[11px] text-slate-500 tabular-nums">
                  Signé à {new Date(bilan.dateVisaCaissier).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            {!bilan?.dateVisaCaissier && !estCloture && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                <button
                  onClick={handleVisaCaissier}
                  disabled={enCoursSoumission}
                  type="button"
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {enCoursSoumission ? "Signature en cours..." : "Signer l'arrêté de caisse"}
                </button>
              </div>
            )}
          </div>

          {/* Étape 2 : Visa Direction */}
          <div className="rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Visa direction</span>
                {bilan?.dateValidationChefCentre ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 size={13} />
                    Validé
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">En attente</span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-900 font-medium truncate">
                {bilan?.nomChefCentre || "Direction de centre"}
              </p>
              {bilan?.dateValidationChefCentre && (
                <p className="text-[11px] text-slate-500 tabular-nums">
                  Validé à {new Date(bilan.dateValidationChefCentre).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            {!bilan?.dateValidationChefCentre && !estCloture && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                <button
                  onClick={handleVisaChefCentre}
                  disabled={enCoursVisaChef}
                  type="button"
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {enCoursVisaChef ? "Validation..." : "Viser le bilan"}
                </button>
              </div>
            )}
          </div>

          {/* Étape 3 : Visa Comptable */}
          <div className="rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Clôture comptable</span>
                {bilan?.dateValidationControleur ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 size={13} />
                    Clôturé
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">En attente</span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-900 font-medium truncate">
                {bilan?.nomControleur || "Contrôleur financier"}
              </p>
              {bilan?.dateValidationControleur && (
                <p className="text-[11px] text-slate-500 tabular-nums">
                  Clôturé à {new Date(bilan.dateValidationControleur).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            {!estCloture && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                <button
                  onClick={handleVisaComptable}
                  disabled={enCoursCloture || !bilan?.id}
                  type="button"
                  className="w-full rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {enCoursCloture ? "Clôture en cours..." : "Clôturer définitivement"}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Cartes financières synthétiques */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Encaissements */}
        <Card className="p-4 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total des encaissements
            </span>
            <Coins size={16} className="text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {FCFA.format(totalEntrees)} <span className="text-xs font-normal text-slate-500">XAF</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {entreesDuJour.length} versement{entreesDuJour.length > 1 ? "s" : ""} enregistré{entreesDuJour.length > 1 ? "s" : ""}
            </p>
          </div>
        </Card>

        {/* Décaissements */}
        <Card className="p-4 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Décaissements ordonnés
            </span>
            <ArrowUpRight size={16} className="text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-red-600 tabular-nums">
              {FCFA.format(totalSorties)} <span className="text-xs font-normal text-slate-500">XAF</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {sortiesDuJour.length} sortie{sortiesDuJour.length > 1 ? "s" : ""} autorisée{sortiesDuJour.length > 1 ? "s" : ""}
            </p>
          </div>
        </Card>

        {/* Net à verser en banque */}
        <Card className="p-4 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Solde net à verser (Banque)
            </span>
            <Wallet size={16} className="text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {FCFA.format(netAVerser)} <span className="text-xs font-normal text-slate-500">XAF</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Dépôt bancaire UBA attendu avant 15h
            </p>
          </div>
        </Card>

        {/* Activité du jour */}
        <Card className="p-4 border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Activité du jour
            </span>
            <Building2 size={16} className="text-slate-400" />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
            <div>
              <span className="text-slate-500">Salles : </span>
              <span className="font-semibold text-slate-800 tabular-nums">{bilan?.nombreSalles ?? "—"}</span>
            </div>
            <div>
              <span className="text-slate-500">Cours : </span>
              <span className="font-semibold text-slate-800 tabular-nums">{bilan?.nombreCours ?? "—"}</span>
            </div>
            <div>
              <span className="text-slate-500">Inscrits : </span>
              <span className="font-semibold text-slate-800 tabular-nums">{bilan?.effectifNouveauxEleves ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-500">Présents : </span>
              <span className="font-semibold text-slate-800 tabular-nums">{bilan?.effectifTotalCentre ?? 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Barre de navigation des écritures & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Navigation des onglets */}
        <div className="flex items-center gap-1 border-b border-transparent">
          <button
            onClick={() => setOngletActif("entrees")}
            type="button"
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              ongletActif === "entrees"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Encaissements ({entreesDuJour.length})
          </button>
          <button
            onClick={() => setOngletActif("sorties")}
            type="button"
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              ongletActif === "sorties"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Décaissements ({sortiesDuJour.length})
          </button>
          <button
            onClick={() => setOngletActif("repartition")}
            type="button"
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              ongletActif === "repartition"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Ventilation par filière
          </button>
        </div>

        {/* Boutons d'ajout d'écritures */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalVersementOuverte(true)}
            disabled={estCloture}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Plus size={14} className="text-slate-500" />
            <span>Enregistrer un versement</span>
          </button>

          <button
            onClick={() => setModalSortieOuverte(true)}
            disabled={estCloture}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Plus size={14} className="text-slate-500" />
            <span>Saisir une dépense</span>
          </button>
        </div>
      </div>

      {/* Tableaux de données */}
      {ongletActif === "entrees" && (
        <Card className="overflow-hidden border border-slate-200 shadow-xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-600">
                <tr>
                  <th className="p-3 w-12 text-center text-slate-400">#</th>
                  <th className="p-3">Désignation / Motif</th>
                  <th className="p-3">Filière</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entreesDuJour.length > 0 ? (
                  entreesDuJour.map((e, idx) => (
                    <tr key={e.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                      <td className="p-3 font-medium text-slate-900">{getNomMotif(e.motifId)}</td>
                      <td className="p-3 text-slate-600">{getNomFormation(e.formationId)}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            e.statut === "VALIDE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {e.statut === "VALIDE" ? "Validé" : "En cours"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-900 tabular-nums">
                        {FCFA.format(e.montant)} XAF
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Aucun encaissement enregistré pour la journée du {date}.
                    </td>
                  </tr>
                )}
              </tbody>
              {entreesDuJour.length > 0 && (
                <tfoot className="border-t border-slate-200 bg-slate-50/60 font-semibold text-slate-900">
                  <tr>
                    <td colSpan={4} className="p-3 text-right text-slate-600">
                      Total des encaissements
                    </td>
                    <td className="p-3 text-right text-slate-900 tabular-nums text-sm font-bold">
                      {FCFA.format(totalEntrees)} XAF
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}

      {ongletActif === "sorties" && (
        <Card className="overflow-hidden border border-slate-200 shadow-xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 font-semibold text-slate-600">
                <tr>
                  <th className="p-3 w-12 text-center text-slate-400">#</th>
                  <th className="p-3">Motif de la dépense</th>
                  <th className="p-3">Ordonnateur</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortiesDuJour.length > 0 ? (
                  sortiesDuJour.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                      <td className="p-3 font-medium text-slate-900">{getNomMotif(s.motifId)}</td>
                      <td className="p-3 text-slate-600">
                        {s.ordonnateur || "Direction de centre"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            s.statut === "VALIDE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {s.statut === "VALIDE" ? "Validé" : "En cours"}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-red-600 tabular-nums">
                        {FCFA.format(s.montant)} XAF
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Aucun décaissement enregistré pour la journée du {date}.
                    </td>
                  </tr>
                )}
              </tbody>
              {sortiesDuJour.length > 0 && (
                <tfoot className="border-t border-slate-200 bg-slate-50/60 font-semibold text-slate-900">
                  <tr>
                    <td colSpan={4} className="p-3 text-right text-slate-600">
                      Total des décaissements
                    </td>
                    <td className="p-3 text-right text-red-600 tabular-nums text-sm font-bold">
                      {FCFA.format(totalSorties)} XAF
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}

      {ongletActif === "repartition" && (
        <Card className="p-6 border border-slate-200 shadow-xs bg-white">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Ventilation des encaissements par filière
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Part de chaque cycle et formation dans les recettes encaissées aujourd&apos;hui.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {formations.map((f: Formation) => {
              const montantFiliere = entreesDuJour
                .filter((e) => e.formationId === f.id)
                .reduce((a, b) => a + (b.montant || 0), 0);
              const part = totalEntrees > 0 ? Math.round((montantFiliere / totalEntrees) * 100) : 0;

              return (
                <div key={f.id} className="rounded-lg border border-slate-200/80 p-3.5 bg-slate-50/40">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 text-xs truncate">{f.nom}</span>
                    <span className="text-xs font-semibold text-slate-600 tabular-nums">
                      {part}%
                    </span>
                  </div>
                  <div className="mt-2 text-base font-bold text-slate-900 tabular-nums">
                    {FCFA.format(montantFiliere)} <span className="text-xs font-normal text-slate-500">XAF</span>
                  </div>
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-slate-800 rounded-full transition-all"
                      style={{ width: `${part}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Modales */}
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
