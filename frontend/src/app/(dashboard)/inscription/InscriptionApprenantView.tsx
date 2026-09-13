"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  GraduationCap,
  Calendar,
  Phone,
  Building2,
  Wallet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Layers,
  Award,
  Sparkles,
  School,
  ArrowLeft,
} from "lucide-react";

import { Button, Card } from "@/shared/ui";
import { ApiError } from "@/shared/lib/api-client";
import { useCreerApprenant } from "@/modules/apprenants";
import { useFormations, usePhases } from "@/modules/academique";
import { useSessionActive, useCentres } from "@/modules/centres-sessions";
import { useAbonnementsSession } from "@/modules/abonnement";
import {
  useConcoursSession,
  useCreerDossierInscription,
} from "@/modules/dossiers";
import { EtablissementCombobox } from "@/shared/ui/EtablissementCombobox";

const FORMATEUR_FCFA = new Intl.NumberFormat("fr-FR");

interface InscriptionApprenantViewProps {
  centreId?: string;
  userRole?: string;
}

export function InscriptionApprenantView({
  centreId: initialCentreId,
  userRole,
}: InscriptionApprenantViewProps) {
  const router = useRouter();
  const { data: sessionActive, isLoading: chargementSession } = useSessionActive();
  const { data: centres = [] } = useCentres();
  const { data: formations = [] } = useFormations();
  const { data: phases = [] } = usePhases();
  const { data: abonnements = [] } = useAbonnementsSession(sessionActive?.id);
  const { data: concours = [] } = useConcoursSession(sessionActive?.id);

  const creerApprenantMutation = useCreerApprenant();
  const creerDossierMutation = useCreerDossierInscription();

  // Étape courante de l'assistant (1 à 4)
  const [etape, setEtape] = useState<number>(1);

  // État du formulaire
  const [centreSelectionne, setCentreSelectionne] = useState<string>(
    initialCentreId || centres[0]?.id || "",
  );

  // Synchronisation si initialCentreId arrive ou si les centres se chargent
  React.useEffect(() => {
    if (initialCentreId) {
      setCentreSelectionne(initialCentreId);
    } else if (!centreSelectionne && centres.length > 0) {
      setCentreSelectionne(centres[0].id);
    }
  }, [initialCentreId, centres, centreSelectionne]);

  // Étape 1 : Identité & Contacts
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [contactApprenant, setContactApprenant] = useState("");
  const [etablissementOrigine, setEtablissementOrigine] = useState("");
  const [nomParent, setNomParent] = useState("");
  const [contactParent, setContactParent] = useState("");

  // Étape 2 : Cursus & Phases
  const [formationId, setFormationId] = useState("");
  const [phasesSouscrites, setPhasesSouscrites] = useState<string[]>([]);
  const [concoursCibles, setConcoursCibles] = useState<string[]>([]);

  // Étape 3 : Contrat Financier
  const [preInscrit, setPreInscrit] = useState<boolean>(false);
  const [referenceRecu, setReferenceRecu] = useState("");
  const [montantContrat, setMontantContrat] = useState<number>(0);

  // Erreurs d'étape
  const [erreursEtape, setErreursEtape] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);

  // Formations autorisées pour le centre sélectionné
  const formationsDuCentre = useMemo(() => {
    if (!formations || formations.length === 0) return [];
    if (!centreSelectionne) return formations;
    const idsAbonnes = new Set(
      abonnements
        .filter((a) => a.centreId === centreSelectionne)
        .map((a) => a.formationId),
    );
    if (idsAbonnes.size > 0) {
      return formations.filter((f) => idsAbonnes.has(f.id));
    }
    return formations;
  }, [formations, abonnements, centreSelectionne]);

  // Sélection automatique de la première formation et des phases si vides
  React.useEffect(() => {
    if (!formationId && formationsDuCentre.length > 0) {
      setFormationId(formationsDuCentre[0].id);
    }
  }, [formationsDuCentre, formationId]);

  React.useEffect(() => {
    if (phasesSouscrites.length === 0 && phases.length > 0) {
      // Par défaut souscrire à toutes les phases actives
      setPhasesSouscrites(phases.map((p) => p.id));
    }
  }, [phases, phasesSouscrites]);

  // Calcul de l'âge automatique
  const ageCalcule = useMemo(() => {
    if (!dateNaissance) return null;
    const dateN = new Date(dateNaissance);
    if (isNaN(dateN.getTime())) return null;
    const aujourdhui = new Date();
    let age = aujourdhui.getFullYear() - dateN.getFullYear();
    const m = aujourdhui.getMonth() - dateN.getMonth();
    if (m < 0 || (m === 0 && aujourdhui.getDate() < dateN.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  }, [dateNaissance]);

  // Validation d'étape
  const validerEtape = (numEtape: number): boolean => {
    const errs: Record<string, string> = {};

    if (numEtape === 1) {
      if (!nom.trim()) errs.nom = "Le nom de famille est obligatoire.";
      if (!prenom.trim()) errs.prenom = "Le prénom est obligatoire.";
      if (!dateNaissance) errs.dateNaissance = "La date de naissance est obligatoire.";
      if (!contactApprenant.trim()) errs.contactApprenant = "Le contact téléphonique est obligatoire.";
    }

    if (numEtape === 2) {
      if (!formationId) errs.formationId = "Veuillez sélectionner une filière/formation.";
      if (phasesSouscrites.length === 0)
        errs.phasesSouscrites = "Veuillez cocher au moins une phase pédagogique.";
    }

    if (numEtape === 3) {
      if (!montantContrat || montantContrat <= 0)
        errs.montantContrat = "Le montant total du contrat doit être supérieur à 0 FCFA.";
      if (preInscrit && !referenceRecu.trim())
        errs.referenceRecu = "La référence du reçu de versement est obligatoire pour un pré-inscrit.";
    }

    setErreursEtape(errs);
    return Object.keys(errs).length === 0;
  };

  const allerEtapeSuivante = () => {
    if (validerEtape(etape)) {
      setEtape((prev) => Math.min(prev + 1, 4));
    }
  };

  const allerEtapePrecedente = () => {
    setErreursEtape({});
    setEtape((prev) => Math.max(prev - 1, 1));
  };

  // Soumission finale de l'inscription
  const soumettreInscription = async () => {
    if (!sessionActive || !centreSelectionne) {
      setErreurGlobale("Session académique ou centre manquant.");
      return;
    }

    if (!validerEtape(1) || !validerEtape(2) || !validerEtape(3)) {
      setErreurGlobale("Certains champs obligatoires ne sont pas correctement renseignés.");
      return;
    }

    setErreurGlobale(null);

    try {
      const dateAujourdhui = new Date().toISOString().slice(0, 10);

      // 1. Création de l'Apprenant
      const nouvelApprenant = await creerApprenantMutation.mutateAsync({
        nom: nom.trim(),
        prenom: prenom.trim(),
        dateNaissance,
        dateInscription: dateAujourdhui,
        centreId: centreSelectionne,
        sessionId: sessionActive.id,
        formationId,
        montantContrat: Number(montantContrat),
        dateDefinitionContrat: dateAujourdhui,
        contactApprenant: contactApprenant.trim() || undefined,
        nomParent: nomParent.trim() || undefined,
        contactParent: contactParent.trim() || undefined,
        etablissementOrigine: etablissementOrigine.trim() || undefined,
        preInscrit,
        referenceRecu: preInscrit ? referenceRecu.trim() : undefined,
      });

      // 2. Création orchestrée du Dossier d'Inscription (phases et concours cibles)
      try {
        await creerDossierMutation.mutateAsync({
          apprenantId: nouvelApprenant.id,
          sessionId: sessionActive.id,
          centreId: centreSelectionne,
          montantGlobal: Number(montantContrat),
          dateInscription: dateAujourdhui,
          preInscrit,
          referenceRecu: preInscrit ? referenceRecu.trim() : null,
          phasesSouscrites,
          formationsCibles: [formationId],
          concoursCibles: concoursCibles.length > 0 ? concoursCibles : undefined,
        });
      } catch (errDossier) {
        console.warn("DossierInscription automatique non initialisé :", errDossier);
      }

      // Redirection vers la liste des apprenants
      router.push("/apprenants");
    } catch (err: unknown) {
      console.error("Erreur d'inscription :", err);
      if (err instanceof ApiError) {
        setErreurGlobale(
          (err.body as { message?: string })?.message ||
            "Une erreur est survenue lors de l'enregistrement de l'apprenant.",
        );
      } else {
        setErreurGlobale("Impossible d'enregistrer l'apprenant. Vérifiez votre connexion.");
      }
    }
  };

  const nomFormationChoisie = formations.find((f) => f.id === formationId)?.nom;
  const nomCentreChoisi = centres.find((c) => c.id === centreSelectionne)?.nom;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push("/apprenants")}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft size={14} />
            <span>Retour aux apprenants</span>
          </button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-white shadow-xs">
              <UserPlus size={18} />
            </span>
            <span>Inscription d&rsquo;un Apprenant</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Parcours officiel d&rsquo;admission, souscription aux phases pédagogiques et définition du contrat.
          </p>
        </div>

        {sessionActive && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <Calendar size={14} className="text-brand-orange" />
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Session</span>
              <span className="font-bold text-slate-800">{sessionActive.annee}</span>
            </div>
          </div>
        )}
      </div>

      {!sessionActive && !chargementSession && (
        <Card className="p-6 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">
              Aucune session académique active. Les inscriptions sont bloquées tant qu&rsquo;une session n&rsquo;est pas démarrée.
            </p>
          </div>
        </Card>
      )}

      {sessionActive && (
        <>
          {/* Stepper moderne en 4 étapes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { num: 1, label: "Identité & Famille", desc: "État civil & contacts", icon: User },
                { num: 2, label: "Cursus & Phases", desc: "Filière & phases d'études", icon: Layers },
                { num: 3, label: "Contrat Financier", desc: "Scolarité & pré-inscription", icon: Wallet },
                { num: 4, label: "Récapitulatif", desc: "Validation & confirmation", icon: CheckCircle2 },
              ].map((step) => {
                const estPasse = etape > step.num;
                const estActuel = etape === step.num;
                const Icon = step.icon;

                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => {
                      if (estPasse) setEtape(step.num);
                    }}
                    disabled={!estPasse && !estActuel}
                    className={`flex items-center gap-3 rounded-xl p-2.5 text-left transition-all ${
                      estActuel
                        ? "bg-brand-orange/10 border-2 border-brand-orange"
                        : estPasse
                          ? "bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                          : "opacity-40 border border-transparent cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                        estActuel
                          ? "bg-brand-orange text-white"
                          : estPasse
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {estPasse ? <Check size={14} /> : step.num}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-bold ${
                          estActuel ? "text-brand-orange" : "text-slate-800"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="truncate text-[10px] text-slate-400 font-medium">
                        {step.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message d'erreur global si présent */}
          {erreurGlobale && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{erreurGlobale}</span>
            </div>
          )}

          {/* CONTENU DE L'ÉTAPE 1 : IDENTITÉ & FAMILLE */}
          {etape === 1 && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-brand-orange">
                  <User size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Étape 1 : Identité et Coordonnées de l&rsquo;Élève
                  </h2>
                  <p className="text-xs text-slate-400">
                    Informations personnelles de l&rsquo;apprenant et coordonnées des parents ou tuteurs.
                  </p>
                </div>
              </div>

              {/* État civil */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                  État civil de l&rsquo;apprenant
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nom de famille <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: TCHINDA, KAMGA..."
                      value={nom}
                      onChange={(e) => setNom(e.target.value.toUpperCase())}
                      className={`w-full rounded-xl border bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-brand-orange shadow-2xs placeholder:text-slate-400 ${
                        erreursEtape.nom ? "border-red-400 focus:border-red-500" : "border-slate-200"
                      }`}
                    />
                    {erreursEtape.nom && <p className="text-[11px] font-bold text-red-600 mt-1">{erreursEtape.nom}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prénom(s) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Brice Fabrice"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className={`w-full rounded-xl border bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-brand-orange shadow-2xs placeholder:text-slate-400 ${
                        erreursEtape.prenom ? "border-red-400 focus:border-red-500" : "border-slate-200"
                      }`}
                    />
                    {erreursEtape.prenom && <p className="text-[11px] font-bold text-red-600 mt-1">{erreursEtape.prenom}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Date de naissance <span className="text-red-500">*</span></span>
                      {ageCalcule !== null && (
                        <span className="text-[11px] font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                          {ageCalcule} ans
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={dateNaissance}
                      onChange={(e) => setDateNaissance(e.target.value)}
                      className={`w-full rounded-xl border bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-brand-orange shadow-2xs ${
                        erreursEtape.dateNaissance ? "border-red-400 focus:border-red-500" : "border-slate-200"
                      }`}
                    />
                    {erreursEtape.dateNaissance && <p className="text-[11px] font-bold text-red-600 mt-1">{erreursEtape.dateNaissance}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Téléphone / WhatsApp de l&rsquo;apprenant <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: 699 12 34 56"
                      value={contactApprenant}
                      onChange={(e) => setContactApprenant(e.target.value)}
                      className={`w-full rounded-xl border bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-brand-orange shadow-2xs placeholder:text-slate-400 ${
                        erreursEtape.contactApprenant ? "border-red-400 focus:border-red-500" : "border-slate-200"
                      }`}
                    />
                    {erreursEtape.contactApprenant && <p className="text-[11px] font-bold text-red-600 mt-1">{erreursEtape.contactApprenant}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <School size={13} className="text-slate-400" />
                    <span>Établissement ou Lycée d&rsquo;origine</span>
                  </label>
                  <EtablissementCombobox
                    value={etablissementOrigine}
                    onChange={setEtablissementOrigine}
                    placeholder="Tapez pour filtrer ou créer (ex: Lycée Général Leclerc, Collège Libermann...)"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sélectionnez un lycée suggéré ou tapez un nouveau nom pour l&rsquo;enregistrer automatiquement dans la base de données.
                  </p>
                </div>
              </div>

              {/* Parents / Tuteur */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Parent ou Tuteur Légal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nom complet du parent / tuteur
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: M. KAMGA Joseph"
                      value={nomParent}
                      onChange={(e) => setNomParent(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-brand-orange shadow-2xs placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact téléphonique du parent
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: 677 00 11 22"
                      value={contactParent}
                      onChange={(e) => setContactParent(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-brand-orange shadow-2xs placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* CONTENU DE L'ÉTAPE 2 : CURSUS PÉDAGOGIQUE & PHASES */}
          {etape === 2 && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-brand-orange">
                  <Layers size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Étape 2 : Cursus Pédagogique & Choix des Phases
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sélectionnez la filière d&rsquo;accueil et les phases d&rsquo;apprentissage souscrites par l&rsquo;élève.
                  </p>
                </div>
              </div>

              {/* Centre d'affectation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400" />
                  <span>Centre EXCELIS de composition / d&rsquo;inscription</span>
                </label>
                {initialCentreId ? (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700">
                    <span>{nomCentreChoisi || "Mon centre"}</span>
                    <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 font-medium">
                      Centre fixé
                    </span>
                  </div>
                ) : (
                  <select
                    value={centreSelectionne}
                    onChange={(e) => setCentreSelectionne(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-brand-orange shadow-2xs"
                  >
                    {centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom} {c.villeActuelle ? `(${c.villeActuelle})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Choix visuel de la Formation */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Filière / Formation préparée <span className="text-red-500">*</span>
                </label>
                {formationsDuCentre.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 border border-dashed rounded-xl">
                    Aucune formation active n&rsquo;est abonnée pour ce centre.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formationsDuCentre.map((f) => {
                      const estChoisie = formationId === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFormationId(f.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            estChoisie
                              ? "border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange/20 shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                estChoisie
                                  ? "bg-brand-orange text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <GraduationCap size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">{f.nom}</p>
                              <p className="text-[11px] text-slate-500">{f.matiereIds?.length ?? 0} matière(s) au programme</p>
                            </div>
                          </div>
                          {estChoisie && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-white">
                              <Check size={12} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {erreursEtape.formationId && (
                  <p className="text-xs font-bold text-red-600">{erreursEtape.formationId}</p>
                )}
              </div>

              {/* Sélection des Phases Pédagogiques */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Phases d&rsquo;apprentissage souscrites <span className="text-red-500">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Indiquez les périodes académiques incluses dans cette inscription.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPhasesSouscrites(phases.map((p) => p.id))}
                    className="text-xs font-bold text-brand-orange hover:underline cursor-pointer"
                  >
                    Tout cocher (Cursus complet)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {phases.map((phase) => {
                    const estCochee = phasesSouscrites.includes(phase.id);
                    return (
                      <div
                        key={phase.id}
                        onClick={() => {
                          setPhasesSouscrites((prev) =>
                            estCochee ? prev.filter((id) => id !== phase.id) : [...prev, phase.id],
                          );
                        }}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                          estCochee
                            ? "border-emerald-500 bg-emerald-50/50 shadow-2xs"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={estCochee}
                          onChange={() => {}} // géré par le div parent
                          className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{phase.libelle}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Code officiel : {phase.code}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {erreursEtape.phasesSouscrites && (
                  <p className="text-xs font-bold text-red-600">{erreursEtape.phasesSouscrites}</p>
                )}
              </div>

              {/* Concours Cibles (Optionnel) */}
              {concours.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Concours ciblés par le candidat <span className="text-slate-400 font-normal">(Optionnel)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {concours.map((c: { id: string; nom: string }) => {
                      const estCible = concoursCibles.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setConcoursCibles((prev) =>
                              estCible ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                            );
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            estCible
                              ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <Award size={13} className={estCible ? "text-amber-400" : "text-slate-400"} />
                          <span>{c.nom}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* CONTENU DE L'ÉTAPE 3 : CONTRAT FINANCIER & PRÉ-INSCRIPTION */}
          {etape === 3 && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-brand-orange">
                  <Wallet size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Étape 3 : Contrat Financier & Modalités d&rsquo;Inscription
                  </h2>
                  <p className="text-xs text-slate-400">
                    Définition du montant contractuel de scolarité et statut de réservation/pré-inscription.
                  </p>
                </div>
              </div>

              {/* Mode d'inscription : Directe vs Pré-inscrit */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Statut de l&rsquo;inscription <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => {
                      setPreInscrit(false);
                      setReferenceRecu("");
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      !preInscrit
                        ? "border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange/20 shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-black text-slate-900">Nouvelle Inscription Directe</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      L&rsquo;apprenant s&rsquo;inscrit pour la première fois pour cette session.
                    </p>
                  </div>

                  <div
                    onClick={() => setPreInscrit(true)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      preInscrit
                        ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-900">Élève déjà Pré-inscrit</p>
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 uppercase">
                        Acompte versé
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Une place a déjà été réservée avec un reçu de paiement anticipé.
                    </p>
                  </div>
                </div>
              </div>

              {/* Champ Référence du reçu si pré-inscrit */}
              {preInscrit && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-4 space-y-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Receipt size={14} className="text-amber-600" />
                    <span>Numéro / Référence officielle du reçu de versement <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: REC-2026-0842 ou BVR-4512"
                    value={referenceRecu}
                    onChange={(e) => setReferenceRecu(e.target.value)}
                    className={`w-full rounded-xl border bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-colors focus:border-brand-orange shadow-2xs placeholder:text-slate-400 ${
                      erreursEtape.referenceRecu ? "border-red-400 focus:border-red-500" : "border-slate-200"
                    }`}
                  />
                  {erreursEtape.referenceRecu && (
                    <p className="text-[11px] font-bold text-red-600 mt-1">{erreursEtape.referenceRecu}</p>
                  )}
                  <p className="text-[11px] text-amber-800">
                    Ce reçu sera vérifié par la caisse lors de la validation comptable et déduit du solde restant dû.
                  </p>
                </div>
              )}

              {/* Montant global du contrat */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Montant global du contrat de scolarité (en FCFA) <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    placeholder="Entrez le montant convenu (ex: 250000)..."
                    value={montantContrat > 0 ? montantContrat : ""}
                    onChange={(e) => setMontantContrat(e.target.value === "" ? 0 : Number(e.target.value))}
                    className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-base font-bold text-slate-900 outline-none transition-colors focus:border-brand-orange shadow-2xs pr-16 ${
                      erreursEtape.montantContrat ? "border-red-400 focus:border-red-500" : "border-slate-200"
                    }`}
                  />
                  <div className="absolute right-3.5 top-3 text-xs font-black text-slate-400 pointer-events-none">
                    FCFA
                  </div>
                </div>
                {erreursEtape.montantContrat && (
                  <p className="text-[11px] font-bold text-red-600">{erreursEtape.montantContrat}</p>
                )}
                <p className="text-[11px] text-slate-400">
                  Ce montant définit l&rsquo;engagement financier contractuel convenu pour l&rsquo;ensemble de la scolarité de l&rsquo;apprenant.
                </p>
              </div>
            </Card>
          )}

          {/* CONTENU DE L'ÉTAPE 4 : RÉCAPITULATIF & VALIDATION */}
          {etape === 4 && (
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Étape 4 : Récapitulatif et Fiche Contrat
                  </h2>
                  <p className="text-xs text-slate-400">
                    Vérifiez attentivement l&rsquo;exactitude des informations avant d&rsquo;enregistrer l&rsquo;inscription.
                  </p>
                </div>
              </div>

              {/* Synthèse officielle en carte d'admission */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange font-black text-white text-lg">
                      {nom.charAt(0)}
                      {prenom.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        {nom} {prenom}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {etablissementOrigine ? `Établissement : ${etablissementOrigine}` : "Sans établissement spécifié"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800 uppercase">
                      Prêt à inscrire
                    </span>
                  </div>
                </div>

                {/* Grille des 3 volets du dossier */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Volet 1 : Identité & Contacts */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 font-black text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider text-[11px]">
                      <User size={13} className="text-brand-orange" />
                      <span>Identité & Contacts</span>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <p>
                        <strong>Né(e) le :</strong> {dateNaissance || "—"} {ageCalcule ? `(${ageCalcule} ans)` : ""}
                      </p>
                      <p>
                        <strong>Tél :</strong> {contactApprenant || "—"}
                      </p>
                      <p>
                        <strong>Parent/Tuteur :</strong> {nomParent || "—"}
                      </p>
                      <p>
                        <strong>Tél Parent :</strong> {contactParent || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Volet 2 : Cursus & Phases */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 font-black text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider text-[11px]">
                      <Layers size={13} className="text-brand-orange" />
                      <span>Cursus & Phases</span>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <p>
                        <strong>Centre :</strong> {nomCentreChoisi || "—"}
                      </p>
                      <p>
                        <strong>Filière :</strong> {nomFormationChoisie || "—"}
                      </p>
                      <div>
                        <strong>Phases souscrites :</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {phasesSouscrites.map((pid) => {
                            const pObj = phases.find((p) => p.id === pid);
                            return (
                              <span
                                key={pid}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700"
                              >
                                {pObj?.libelle || pid}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Volet 3 : Contrat Financier */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 font-black text-slate-800 border-b border-slate-100 pb-1.5 uppercase tracking-wider text-[11px]">
                      <Wallet size={13} className="text-brand-orange" />
                      <span>Contrat Scolarité</span>
                    </div>
                    <div className="space-y-1 text-slate-600">
                      <p className="text-base font-black text-brand-orange">
                        {FORMATEUR_FCFA.format(montantContrat)} FCFA
                      </p>
                      <p>
                        <strong>Statut :</strong>{" "}
                        {preInscrit ? (
                          <span className="font-bold text-amber-700">Pré-inscrit (Acompte)</span>
                        ) : (
                          "Inscription directe"
                        )}
                      </p>
                      {preInscrit && (
                        <p>
                          <strong>Réf. Reçu :</strong> {referenceRecu || "—"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Barre de navigation des étapes */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={allerEtapePrecedente}
              disabled={etape === 1}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
            >
              <ChevronLeft size={14} />
              <span>Précédent</span>
            </button>

            <div className="flex items-center gap-3">
              {etape < 4 ? (
                <button
                  type="button"
                  onClick={allerEtapeSuivante}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-orange/90 transition-all cursor-pointer shadow-xs"
                >
                  <span>Suivant</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={soumettreInscription}
                  disabled={creerApprenantMutation.isPending || creerDossierMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Check size={16} />
                  <span>
                    {creerApprenantMutation.isPending
                      ? "Enregistrement en cours..."
                      : "Valider et finaliser l'inscription"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}