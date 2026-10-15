"use client";

import { useMemo, useState } from "react";
import {
  CalendarRange,
  GraduationCap,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  X,
  Building2,
  CalendarCheck,
  CalendarClock,
  Clock,
  Pencil,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Card, Input, Modal } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import {
  useSessions,
  useSessionActive,
  useCentres,
  useCreerSession,
  useModifierSession,
  useDemarrerSession,
  useCloturerSession,
  useSupprimerSession,
  useSemaines,
  useAjouterSemaine,
  type SessionAcademique,
} from "@/modules/centres-sessions";
import {
  usePhases,
  useCreerPhase,
  useModifierPhase,
  useSupprimerPhase,
  type Phase,
} from "@/modules/academique";
import { semaineCouranteDepuis, semaineTotaleSession } from "@/shared/lib/semaine";

// Validation Schemas
const creerSessionSchema = z
  .object({
    annee: z
      .string()
      .regex(/^\d{4}-\d{4}$/, "Le format de l'année doit être AAAA-AAAA (ex : 2024-2025)"),
    dateDebut: z.string().min(1, "La date de début est obligatoire"),
    dateFin: z.string().min(1, "La date de fin est obligatoire"),
  })
  .refine((data) => new Date(data.dateFin) > new Date(data.dateDebut), {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["dateFin"],
  });
type CreerSessionForm = z.infer<typeof creerSessionSchema>;

const phaseSchema = z
  .object({
    code: z
      .string()
      .min(1, "Le code est obligatoire")
      .max(10, "Le code ne peut pas dépasser 10 caractères")
      .toUpperCase(),
    libelle: z.string().min(2, "Le libellé doit comporter au moins 2 caractères"),
    dateDebut: z.string().min(1, "La date de début est obligatoire"),
    dateFin: z.string().min(1, "La date de fin est obligatoire"),
  })
  .refine((data) => new Date(data.dateFin) >= new Date(data.dateDebut), {
    message: "La date de fin doit être postérieure ou égale à la date de début",
    path: ["dateFin"],
  });
type PhaseForm = z.infer<typeof phaseSchema>;

function formaterDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SessionsPhasesView() {
  const [ongletActif, setOngletActif] = useState<"sessions" | "phases">("sessions");

  // Données Sessions & Centres
  const { data: sessions = [], isLoading: chargementSessions } = useSessions();
  const { data: sessionActive } = useSessionActive();
  const { data: centres = [] } = useCentres();

  // Données Phases
  const { data: phases = [], isLoading: chargementPhases } = usePhases();

  // Mutations Sessions
  const creerSessionMutation = useCreerSession();
  const modifierSessionMutation = useModifierSession();
  const demarrerSessionMutation = useDemarrerSession();
  const cloturerSessionMutation = useCloturerSession();
  const supprimerSessionMutation = useSupprimerSession();

  // Mutations Phases
  const creerPhaseMutation = useCreerPhase();
  const modifierPhaseMutation = useModifierPhase();
  const supprimerPhaseMutation = useSupprimerPhase();

  // Modales Sessions
  const [modalCreerSession, setModalCreerSession] = useState(false);
  const [sessionAModifier, setSessionAModifier] = useState<SessionAcademique | null>(null);
  const [sessionADemarrer, setSessionADemarrer] = useState<SessionAcademique | null>(null);
  const [sessionACloturer, setSessionACloturer] = useState<SessionAcademique | null>(null);
  const [sessionASupprimer, setSessionASupprimer] = useState<SessionAcademique | null>(null);
  const [sessionPourSemaines, setSessionPourSemaines] = useState<SessionAcademique | null>(null);

  // Modales Phases
  const [modalCreerPhase, setModalCreerPhase] = useState(false);
  const [phaseAModifier, setPhaseAModifier] = useState<Phase | null>(null);
  const [phaseASupprimer, setPhaseASupprimer] = useState<Phase | null>(null);

  // Erreur globale
  const [erreurAction, setErreurAction] = useState<string | null>(null);

  // Forms
  const formSession = useForm<CreerSessionForm>({
    resolver: zodResolver(creerSessionSchema),
    defaultValues: { annee: "", dateDebut: "", dateFin: "" },
  });

  const formModifierSession = useForm<CreerSessionForm>({
    resolver: zodResolver(creerSessionSchema),
  });

  const formPhase = useForm<PhaseForm>({
    resolver: zodResolver(phaseSchema),
    defaultValues: { code: "", libelle: "", dateDebut: "", dateFin: "" },
  });

  const formModifierPhase = useForm<PhaseForm>({
    resolver: zodResolver(phaseSchema),
  });

  // KPIs Sessions
  const statsSessions = useMemo(() => {
    const total = sessions.length;
    const planifiees = sessions.filter((s) => s.statut === "PLANIFIEE").length;
    const cloturees = sessions.filter((s) => s.statut === "CLOTUREE").length;
    return { total, planifiees, cloturees };
  }, [sessions]);

  // Handlers Sessions
  const handleCreerSession = async (data: CreerSessionForm) => {
    setErreurAction(null);
    try {
      await creerSessionMutation.mutateAsync(data);
      formSession.reset();
      setModalCreerSession(false);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleOuvrirModifierSession = (session: SessionAcademique) => {
    setErreurAction(null);
    setSessionAModifier(session);
    formModifierSession.reset({
      annee: session.annee,
      dateDebut: session.dateDebut,
      dateFin: session.dateFin,
    });
  };

  const handleModifierSession = async (data: CreerSessionForm) => {
    if (!sessionAModifier) return;
    setErreurAction(null);
    try {
      await modifierSessionMutation.mutateAsync({
        id: sessionAModifier.id,
        input: data,
      });
      setSessionAModifier(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleDemarrerSession = async () => {
    if (!sessionADemarrer) return;
    setErreurAction(null);
    try {
      await demarrerSessionMutation.mutateAsync(sessionADemarrer.id);
      setSessionADemarrer(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleCloturerSession = async () => {
    if (!sessionACloturer) return;
    setErreurAction(null);
    try {
      await cloturerSessionMutation.mutateAsync(sessionACloturer.id);
      setSessionACloturer(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleSupprimerSession = async () => {
    if (!sessionASupprimer) return;
    setErreurAction(null);
    try {
      await supprimerSessionMutation.mutateAsync(sessionASupprimer.id);
      setSessionASupprimer(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  // Handlers Phases
  const handleCreerPhase = async (data: PhaseForm) => {
    setErreurAction(null);
    try {
      await creerPhaseMutation.mutateAsync({
        code: data.code.trim().toUpperCase(),
        libelle: data.libelle.trim(),
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
      });
      formPhase.reset();
      setModalCreerPhase(false);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleOuvrirModifierPhase = (phase: Phase) => {
    setErreurAction(null);
    setPhaseAModifier(phase);
    formModifierPhase.reset({
      code: phase.code,
      libelle: phase.libelle,
      dateDebut: phase.dateDebut || "",
      dateFin: phase.dateFin || "",
    });
  };

  const handleModifierPhase = async (data: PhaseForm) => {
    if (!phaseAModifier) return;
    setErreurAction(null);
    try {
      await modifierPhaseMutation.mutateAsync({
        id: phaseAModifier.id,
        code: data.code.trim().toUpperCase(),
        libelle: data.libelle.trim(),
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
      });
      setPhaseAModifier(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  const handleSupprimerPhase = async () => {
    if (!phaseASupprimer) return;
    setErreurAction(null);
    try {
      await supprimerPhaseMutation.mutateAsync(phaseASupprimer.id);
      setPhaseASupprimer(null);
    } catch (err) {
      setErreurAction(messageErreurApi(err));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Header avec switcher d'onglets et bouton d'action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange shadow-sm">
              <CalendarRange size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Sessions & Phases Académiques
              </h1>
              <p className="text-sm text-slate-500">
                Supervision des promotions, cycle de vie des sessions et découpage pédagogique
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {ongletActif === "sessions" ? (
            <Button
              onClick={() => {
                setErreurAction(null);
                formSession.reset();
                setModalCreerSession(true);
              }}
              className="shadow-sm"
            >
              <Plus size={18} />
              Nouvelle session
            </Button>
          ) : (
            <Button
              onClick={() => {
                setErreurAction(null);
                formPhase.reset();
                setModalCreerPhase(true);
              }}
              className="shadow-sm"
            >
              <Plus size={18} />
              Nouvelle phase
            </Button>
          )}
        </div>
      </div>

      {/* Alerte d'erreur globale */}
      {erreurAction && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-red-600" />
            <span>{erreurAction}</span>
          </div>
          <button
            type="button"
            onClick={() => setErreurAction(null)}
            className="text-red-600 hover:text-red-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Barre de navigation des onglets */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setOngletActif("sessions")}
          className={`flex items-center gap-2.5 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            ongletActif === "sessions"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          <CalendarRange size={18} />
          Sessions académiques ({sessions.length})
        </button>
        <button
          type="button"
          onClick={() => setOngletActif("phases")}
          className={`flex items-center gap-2.5 border-b-2 px-5 py-3 text-sm font-bold transition-all ${
            ongletActif === "phases"
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
          }`}
        >
          <Layers size={18} />
          Phases d&rsquo;apprentissage ({phases.length})
        </button>
      </div>

      {/* =========================================================================
          CONTENU ONGLET 1 : SESSIONS ACADÉMIQUES
      ========================================================================= */}
      {ongletActif === "sessions" && (
        <div className="space-y-8">
          {/* Cartes KPI Sessions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Session Active */}
            <Card className="p-5 border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/20 to-emerald-50/50 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Session en cours
                </span>
                <span className="relative flex h-3 w-3">
                  {sessionActive && (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </>
                  )}
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {sessionActive ? `Session ${sessionActive.annee}` : "Aucune active"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {sessionActive
                  ? `Du ${formaterDate(sessionActive.dateDebut)} au ${formaterDate(sessionActive.dateFin)}`
                  : "Aucune session n'a le statut EN_COURS actuellement"}
              </p>
            </Card>

            {/* Sessions Planifiées */}
            <Card className="p-5 border border-amber-200 bg-gradient-to-br from-white via-amber-50/20 to-amber-50/40 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-orange">
                  Sessions planifiées
                </span>
                <span className="rounded-lg bg-amber-100 p-2 text-brand-orange">
                  <CalendarClock size={18} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {chargementSessions ? "…" : statsSessions.planifiees}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Prêtes à être démarrées pour une future rentrée
              </p>
            </Card>

            {/* Sessions Clôturées */}
            <Card className="p-5 border border-slate-200 shadow-xs bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Sessions archivées
                </span>
                <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <CalendarCheck size={18} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-800">
                {chargementSessions ? "…" : statsSessions.cloturees}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Sessions passées clôturées pour les audits
              </p>
            </Card>
          </div>

          {/* Liste des sessions */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Toutes les sessions de formation
            </h2>

            {chargementSessions ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse p-6">
                    <div className="h-6 w-1/3 rounded-md bg-slate-200" />
                    <div className="mt-4 h-4 w-1/2 rounded-md bg-slate-100" />
                  </Card>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-slate-200">
                <CalendarRange size={32} className="mx-auto text-slate-400" />
                <h3 className="mt-3 text-base font-bold text-slate-900">
                  Aucune session enregistrée
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Créez votre première session académique pour lancer l&rsquo;activité pédagogique.
                </p>
                <Button
                  onClick={() => setModalCreerSession(true)}
                  className="mt-4"
                >
                  <Plus size={16} />
                  Créer une session
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {sessions.map((session) => {
                  const estEnCours = session.statut === "EN_COURS";
                  const estPlanifiee = session.statut === "PLANIFIEE";
                  const estCloturee = session.statut === "CLOTUREE";

                  // Centres rattachés
                  const centresRattaches = centres.filter((c) =>
                    c.sessionIds.includes(session.id),
                  );

                  // Calcul semaine courante / total
                  const nbSemainesEstime = semaineTotaleSession(
                    session.dateDebut,
                    session.dateFin,
                  );
                  const semaineActuelle = estEnCours
                    ? semaineCouranteDepuis(session.dateDebut, session.dateFin)
                    : null;

                  return (
                    <Card
                      key={session.id}
                      className={`relative overflow-hidden border transition-all rounded-2xl p-6 ${
                        estEnCours
                          ? "border-emerald-300 shadow-md bg-gradient-to-r from-white via-white to-emerald-50/20"
                          : "border-slate-200/80 bg-white shadow-xs hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        {/* Section gauche : Info générale */}
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-black tracking-tight text-slate-900">
                              Session {session.annee}
                            </h3>

                            {/* Badge Statut */}
                            {estEnCours && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                En cours
                              </span>
                            )}
                            {estPlanifiee && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-brand-orange uppercase tracking-wide">
                                <Clock size={13} />
                                Planifiée
                              </span>
                            )}
                            {estCloturee && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 uppercase tracking-wide">
                                <CheckCircle2 size={13} />
                                Clôturée
                              </span>
                            )}
                          </div>

                          {/* Période */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} className="text-brand-orange" />
                              Du <strong className="text-slate-800">{formaterDate(session.dateDebut)}</strong> au{" "}
                              <strong className="text-slate-800">{formaterDate(session.dateFin)}</strong>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} className="text-slate-400" />
                              {nbSemainesEstime} semaines prévues
                              {semaineActuelle && (
                                <span className="ml-1 rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                                  Semaine {semaineActuelle} en cours
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Centres rattachés */}
                          <div className="pt-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                              <Building2 size={13} />
                              Centres rattachés ({centresRattaches.length}) :
                            </span>
                            {centresRattaches.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">
                                Aucun centre rattaché pour l&rsquo;instant
                              </span>
                            ) : (
                              centresRattaches.map((c) => (
                                <span
                                  key={c.id}
                                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200/60"
                                >
                                  {c.nom}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Section droite : Actions de cycle de vie */}
                        <div className="flex flex-wrap items-center gap-2.5 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          {/* Gestion des semaines */}
                          <Button
                            variant="secondary"
                            onClick={() => setSessionPourSemaines(session)}
                            className="text-xs"
                          >
                            <CalendarClock size={15} />
                            Semaines de cours
                          </Button>

                          {/* Modifier la session (si non clôturée) */}
                          {!estCloturee && (
                            <Button
                              variant="secondary"
                              onClick={() => handleOuvrirModifierSession(session)}
                              className="text-xs"
                            >
                              <Pencil size={15} />
                              Modifier
                            </Button>
                          )}

                          {/* Démarrer la session (si planifiée) */}
                          {estPlanifiee && (
                            <Button
                              onClick={() => {
                                setErreurAction(null);
                                setSessionADemarrer(session);
                              }}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Play size={15} />
                              Démarrer la session
                            </Button>
                          )}

                          {/* Clôturer la session (si en cours) */}
                          {estEnCours && (
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setErreurAction(null);
                                setSessionACloturer(session);
                              }}
                              className="text-xs border-amber-300 text-amber-900 hover:bg-amber-50"
                            >
                              <CheckCircle2 size={15} className="text-amber-600" />
                              Clôturer la session
                            </Button>
                          )}

                          {/* Supprimer (si planifiée ou clôturée) */}
                          {!estEnCours && (
                            <button
                              type="button"
                              onClick={() => {
                                setErreurAction(null);
                                setSessionASupprimer(session);
                              }}
                              title="Supprimer la session"
                              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENU ONGLET 2 : PHASES PÉDAGOGIQUES
      ========================================================================= */}
      {ongletActif === "phases" && (
        <div className="space-y-8">
          {/* Bannière explicative */}
          <Card className="p-5 border border-brand-orange/20 bg-gradient-to-r from-amber-50/60 via-white to-white shadow-xs rounded-2xl">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-brand-orange/10 p-2.5 text-brand-orange shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Structure des phases d&rsquo;apprentissage
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  Les phases découpent l&rsquo;année académique en jalons pédagogiques clés
                  (ex: P1 - Fondamentaux, P2 - Approfondissement, CC - Concours Blancs, Révisions intensives).
                  Elles permettent le calcul des progressions, des soldes par phase et la traçabilité des évaluations.
                </p>
              </div>
            </div>
          </Card>

          {/* Séquence visuelle des phases */}
          {phases.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Parcours type séquentiel
              </span>
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                {phases.map((phase, idx) => (
                  <div key={phase.id} className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-brand-orange text-white px-1.5 py-0.5 text-[10px] font-black">
                          {phase.code}
                        </span>
                        <span>{phase.libelle}</span>
                      </div>
                      {phase.dateDebut && phase.dateFin && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          {formaterDate(phase.dateDebut)} - {formaterDate(phase.dateFin)}
                        </span>
                      )}
                    </div>
                    {idx < phases.length - 1 && (
                      <ArrowRight size={14} className="text-slate-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste détaillée des phases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Catalogue des phases configurées
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {phases.length} phase{phases.length > 1 ? "s" : ""}
              </span>
            </div>

            {chargementPhases ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse p-6">
                    <div className="h-6 w-1/3 rounded-md bg-slate-200" />
                    <div className="mt-4 h-4 w-2/3 rounded-md bg-slate-100" />
                  </Card>
                ))}
              </div>
            ) : phases.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-slate-200">
                <Layers size={32} className="mx-auto text-slate-400" />
                <h3 className="mt-3 text-base font-bold text-slate-900">
                  Aucune phase configurée
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Définissez votre première phase d&rsquo;apprentissage (ex : P1 - Fondamentaux).
                </p>
                <Button
                  onClick={() => setModalCreerPhase(true)}
                  className="mt-4"
                >
                  <Plus size={16} />
                  Ajouter une phase
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {phases.map((phase) => {
                  const today = new Date().toISOString().split("T")[0];
                  const aDesDates = phase.dateDebut && phase.dateFin;
                  const estEnCours =
                    aDesDates &&
                    today >= phase.dateDebut! &&
                    today <= phase.dateFin!;
                  const estAVenir = aDesDates && today < phase.dateDebut!;
                  const estAchevee = aDesDates && today > phase.dateFin!;

                  return (
                    <Card
                      key={phase.id}
                      className="flex flex-col justify-between border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all rounded-2xl"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-brand-orange/10 px-2.5 py-1 text-xs font-black text-brand-orange border border-brand-orange/20">
                              {phase.code}
                            </span>
                            {estEnCours && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                En cours
                              </span>
                            )}
                            {estAVenir && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                À venir
                              </span>
                            )}
                            {estAchevee && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                Achevée
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOuvrirModifierPhase(phase)}
                              title="Modifier la phase"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setErreurAction(null);
                                setPhaseASupprimer(phase);
                              }}
                              title="Supprimer la phase"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <h4 className="mt-3 text-base font-bold text-slate-900 line-clamp-2">
                          {phase.libelle}
                        </h4>

                        {/* Dates de la phase */}
                        <div className="mt-3.5 flex items-center gap-1.5 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100">
                          <Calendar size={14} className="text-brand-orange shrink-0" />
                          <span>
                            {aDesDates ? (
                              <>
                                Du <strong className="text-slate-800">{formaterDate(phase.dateDebut!)}</strong> au{" "}
                                <strong className="text-slate-800">{formaterDate(phase.dateFin!)}</strong>
                              </>
                            ) : (
                              <span className="italic text-slate-400">Dates non planifiées</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>Code système</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {phase.code}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          MODALE : CRÉATION D'UNE SESSION
      ========================================================= */}
      <Modal
        isOpen={modalCreerSession}
        onClose={() => setModalCreerSession(false)}
        title="Nouvelle session académique"
        description="Créez une session de formation pour la prochaine rentrée académique."
      >
        <form
          onSubmit={formSession.handleSubmit(handleCreerSession)}
          className="space-y-4 pt-2"
        >
          <Input
            label="Année académique (AAAA-AAAA)"
            placeholder="Ex : 2025-2026"
            {...formSession.register("annee")}
            error={formSession.formState.errors.annee?.message}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date de rentrée / début"
              type="date"
              {...formSession.register("dateDebut")}
              error={formSession.formState.errors.dateDebut?.message}
            />
            <Input
              label="Date de clôture / fin"
              type="date"
              {...formSession.register("dateFin")}
              error={formSession.formState.errors.dateFin?.message}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalCreerSession(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={creerSessionMutation.isPending}
            >
              {creerSessionMutation.isPending ? "Création…" : "Créer la session"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================
          MODALE : MODIFIER SESSION
      ========================================================= */}
      <Modal
        isOpen={Boolean(sessionAModifier)}
        onClose={() => setSessionAModifier(null)}
        title="Modifier la session académique"
        description="Mettez à jour les informations et dates de la session académique."
      >
        <form
          onSubmit={formModifierSession.handleSubmit(handleModifierSession)}
          className="space-y-4 pt-2"
        >
          <Input
            label="Année académique (AAAA-AAAA)"
            placeholder="Ex : 2025-2026"
            {...formModifierSession.register("annee")}
            error={formModifierSession.formState.errors.annee?.message}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date de rentrée / début"
              type="date"
              {...formModifierSession.register("dateDebut")}
              error={formModifierSession.formState.errors.dateDebut?.message}
            />
            <Input
              label="Date de clôture / fin"
              type="date"
              {...formModifierSession.register("dateFin")}
              error={formModifierSession.formState.errors.dateFin?.message}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSessionAModifier(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={modifierSessionMutation.isPending}
            >
              {modifierSessionMutation.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================
          MODALE : DÉMARRER SESSION
      ========================================================= */}
      <Modal
        isOpen={Boolean(sessionADemarrer)}
        onClose={() => setSessionADemarrer(null)}
        title="Démarrer la session académique"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-600">
            Êtes-vous sûr de vouloir démarrer la session{" "}
            <strong className="text-slate-900">{sessionADemarrer?.annee}</strong> ?
          </p>
          <div className="rounded-xl bg-amber-50 p-3.5 text-xs text-amber-800 border border-amber-200">
            <p className="font-semibold">Note importante :</p>
            <p className="mt-0.5">
              Cette session deviendra la session en cours active dans tout le réseau EXCELIS.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSessionADemarrer(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={demarrerSessionMutation.isPending}
              onClick={handleDemarrerSession}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {demarrerSessionMutation.isPending ? "Démarrage…" : "Confirmer le démarrage"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* =========================================================
          MODALE : CLÔTURER SESSION
      ========================================================= */}
      <Modal
        isOpen={Boolean(sessionACloturer)}
        onClose={() => setSessionACloturer(null)}
        title="Clôturer la session académique"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
            <AlertTriangle size={20} className="shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Clôture définitive de la session</p>
              <p className="mt-1 text-xs text-amber-700">
                Vous vous apprêtez à clôturer la session{" "}
                <span className="font-bold">{sessionACloturer?.annee}</span>.
                Une fois clôturée, aucune nouvelle saisie de notes ou de séances ne pourra être effectuée.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSessionACloturer(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={cloturerSessionMutation.isPending}
              onClick={handleCloturerSession}
            >
              {cloturerSessionMutation.isPending ? "Clôture en cours…" : "Confirmer la clôture"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* =========================================================
          MODALE : SUPPRIMER SESSION
      ========================================================= */}
      <Modal
        isOpen={Boolean(sessionASupprimer)}
        onClose={() => setSessionASupprimer(null)}
        title="Supprimer la session académique"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-200">
            <AlertTriangle size={20} className="shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Attention : action irréversible</p>
              <p className="mt-1 text-xs text-red-700">
                Vous vous apprêtez à supprimer la session{" "}
                <span className="font-bold">{sessionASupprimer?.annee}</span>.
                Cette opération ne peut réussir que si aucune formation n&rsquo;y est encore attachée.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSessionASupprimer(null)}
            >
              Annuler
            </Button>
            <button
              type="button"
              disabled={supprimerSessionMutation.isPending}
              onClick={handleSupprimerSession}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {supprimerSessionMutation.isPending ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </div>
      </Modal>

      {/* =========================================================
          MODALE : GESTION DES SEMAINES D'UNE SESSION
      ========================================================= */}
      {sessionPourSemaines && (
        <ModalSemainesSession
          session={sessionPourSemaines}
          onClose={() => setSessionPourSemaines(null)}
        />
      )}

      {/* =========================================================
          MODALE : CRÉATION D'UNE PHASE
      ========================================================= */}
      <Modal
        isOpen={modalCreerPhase}
        onClose={() => setModalCreerPhase(false)}
        title="Nouvelle phase pédagogique"
        description="Ajoutez un jalon d'évaluation ou d'apprentissage dans le cursus."
      >
        <form
          onSubmit={formPhase.handleSubmit(handleCreerPhase)}
          className="space-y-4 pt-2"
        >
          <Input
            label="Code de la phase (ex: P1, P2, CC)"
            placeholder="Ex : P1"
            {...formPhase.register("code")}
            error={formPhase.formState.errors.code?.message}
          />
          <Input
            label="Libellé complet"
            placeholder="Ex : Phase 1 - Fondamentaux & Méthodes"
            {...formPhase.register("libelle")}
            error={formPhase.formState.errors.libelle?.message}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date de début"
              type="date"
              {...formPhase.register("dateDebut")}
              error={formPhase.formState.errors.dateDebut?.message}
            />
            <Input
              label="Date de fin"
              type="date"
              {...formPhase.register("dateFin")}
              error={formPhase.formState.errors.dateFin?.message}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalCreerPhase(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={creerPhaseMutation.isPending}
            >
              {creerPhaseMutation.isPending ? "Création…" : "Enregistrer la phase"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================
          MODALE : MODIFICATION D'UNE PHASE
      ========================================================= */}
      <Modal
        isOpen={Boolean(phaseAModifier)}
        onClose={() => setPhaseAModifier(null)}
        title="Modifier la phase pédagogique"
        description="Mettez à jour le code, le libellé ou les dates de cette phase."
      >
        <form
          onSubmit={formModifierPhase.handleSubmit(handleModifierPhase)}
          className="space-y-4 pt-2"
        >
          <Input
            label="Code de la phase"
            placeholder="Ex : P1"
            {...formModifierPhase.register("code")}
            error={formModifierPhase.formState.errors.code?.message}
          />
          <Input
            label="Libellé complet"
            placeholder="Ex : Phase 1 - Fondamentaux"
            {...formModifierPhase.register("libelle")}
            error={formModifierPhase.formState.errors.libelle?.message}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date de début"
              type="date"
              {...formModifierPhase.register("dateDebut")}
              error={formModifierPhase.formState.errors.dateDebut?.message}
            />
            <Input
              label="Date de fin"
              type="date"
              {...formModifierPhase.register("dateFin")}
              error={formModifierPhase.formState.errors.dateFin?.message}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPhaseAModifier(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={modifierPhaseMutation.isPending}
            >
              {modifierPhaseMutation.isPending ? "Enregistrement…" : "Mettre à jour"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =========================================================
          MODALE : SUPPRESSION D'UNE PHASE
      ========================================================= */}
      <Modal
        isOpen={Boolean(phaseASupprimer)}
        onClose={() => setPhaseASupprimer(null)}
        title="Supprimer la phase"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-200">
            <AlertTriangle size={20} className="shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Suppression de la phase {phaseASupprimer?.code}</p>
              <p className="mt-1 text-xs text-red-700">
                Êtes-vous certain de vouloir supprimer cette phase pédagogique ?
                Cette action peut impacter les modules ou tableaux de bord associés.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPhaseASupprimer(null)}
            >
              Annuler
            </Button>
            <button
              type="button"
              disabled={supprimerPhaseMutation.isPending}
              onClick={handleSupprimerPhase}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {supprimerPhaseMutation.isPending ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * Sous-composant de modale pour gérer les semaines associées à une session
 */
function ModalSemainesSession({
  session,
  onClose,
}: {
  session: SessionAcademique;
  onClose: () => void;
}) {
  const { data: semaines = [], isLoading } = useSemaines(session.id);
  const ajouterSemaineMutation = useAjouterSemaine(session.id);
  const [erreur, setErreur] = useState<string | null>(null);

  // Prochain numéro suggéré
  const prochainNumero = semaines.length > 0 ? Math.max(...semaines) + 1 : 1;
  const [numeroPerso, setNumeroPerso] = useState<string>(String(prochainNumero));

  const handleAjouterSemaine = async (num: number) => {
    setErreur(null);
    try {
      await ajouterSemaineMutation.mutateAsync(num);
      setNumeroPerso(String(num + 1));
    } catch (err) {
      setErreur(messageErreurApi(err));
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Semaines de cours - Session ${session.annee}`}
      description="Gestion des semaines pédagogiques planifiées pour cette année académique."
    >
      <div className="space-y-5 pt-2">
        {erreur && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {erreur}
          </div>
        )}

        {/* Action rapide d'ajout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Prochaine semaine suggérée
            </span>
            <p className="text-base font-black text-slate-900">
              Semaine S{prochainNumero}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={ajouterSemaineMutation.isPending}
              onClick={() => handleAjouterSemaine(prochainNumero)}
              className="text-xs"
            >
              <Plus size={15} />
              Ajouter S{prochainNumero}
            </Button>
          </div>
        </div>

        {/* Grille des semaines déjà créées */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Semaines créées ({semaines.length})
            </span>
          </div>

          {isLoading ? (
            <p className="text-xs text-slate-400 py-3 text-center">Chargement...</p>
          ) : semaines.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center italic">
              Aucune semaine n&rsquo;a encore été ajoutée à cette session.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 max-h-56 overflow-y-auto p-1">
              {semaines.map((num) => (
                <div
                  key={num}
                  className="flex items-center justify-center rounded-xl bg-white p-2.5 text-xs font-bold text-slate-800 border border-slate-200 shadow-xs"
                >
                  S{num}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

