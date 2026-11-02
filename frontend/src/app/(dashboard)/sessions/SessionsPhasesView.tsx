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
    <div className="flex min-h-full w-full flex-col gap-4">
      {/* ── En-tête Sobre & Compact ── */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Sessions & Phases Académiques
          </h1>
          <p className="text-xs text-slate-500">
            Supervision des promotions, cycle de vie des sessions et jalons pédagogiques
          </p>
        </div>

        <div className="flex items-center gap-2">
          {ongletActif === "sessions" ? (
            <button
              type="button"
              onClick={() => {
                setErreurAction(null);
                formSession.reset();
                setModalCreerSession(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-orange/90 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Nouvelle session</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErreurAction(null);
                formPhase.reset();
                setModalCreerPhase(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-orange/90 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Nouvelle phase</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerte d'erreur globale */}
      {erreurAction && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0 text-red-600" />
            <span>{erreurAction}</span>
          </div>
          <button
            type="button"
            onClick={() => setErreurAction(null)}
            className="text-red-600 hover:text-red-900 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Barre de navigation des onglets */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setOngletActif("sessions")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all cursor-pointer ${
            ongletActif === "sessions"
              ? "border-brand-orange text-brand-orange font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarRange size={14} />
          <span>Sessions académiques ({sessions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setOngletActif("phases")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all cursor-pointer ${
            ongletActif === "phases"
              ? "border-brand-orange text-brand-orange font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers size={14} />
          <span>Phases d&rsquo;apprentissage ({phases.length})</span>
        </button>
      </div>

      {/* =========================================================================
          CONTENU ONGLET 1 : SESSIONS ACADÉMIQUES
      ========================================================================= */}
      {ongletActif === "sessions" && (
        <div className="space-y-4">
          {/* Synthèse Métier Compacte */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs text-xs">
            {/* Session en cours */}
            <div className="sm:px-3 first:pl-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Session Active
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-base font-bold text-slate-900">
                  {sessionActive ? `Session ${sessionActive.annee}` : "Aucune session active"}
                </span>
                {sessionActive && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                    En cours
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {sessionActive
                  ? `${formaterDate(sessionActive.dateDebut)} → ${formaterDate(sessionActive.dateFin)}`
                  : "Démarrer une session planifiée"}
              </p>
            </div>

            {/* Sessions Planifiées */}
            <div className="sm:px-3 pt-2 sm:pt-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Planifiées (Futur)
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-base font-bold text-slate-900">
                  {chargementSessions ? "…" : statsSessions.planifiees}
                </span>
                <span className="text-xs text-slate-500">promotion(s) en préparation</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">Prêtes pour la prochaine rentrée</p>
            </div>

            {/* Sessions Clôturées */}
            <div className="sm:px-3 pt-2 sm:pt-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Archivées (Passé)
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-base font-bold text-slate-900">
                  {chargementSessions ? "…" : statsSessions.cloturees}
                </span>
                <span className="text-xs text-slate-500">session(s) archivée(s)</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">Consultables pour audits & historiques</p>
            </div>
          </div>

          {/* Tableau dense des sessions */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            {chargementSessions ? (
              <div className="p-10 text-center text-xs text-slate-400">Chargement des sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700">Aucune session académique enregistrée.</p>
                <button
                  type="button"
                  onClick={() => setModalCreerSession(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Créer la première session</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Promotion</th>
                      <th className="px-3 py-2.5">Période</th>
                      <th className="px-3 py-2.5 text-center">Durée</th>
                      <th className="px-3 py-2.5">Centres participants</th>
                      <th className="px-3 py-2.5 text-center">Statut</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((session) => {
                      const estEnCours = session.statut === "EN_COURS";
                      const estPlanifiee = session.statut === "PLANIFIEE";
                      const estCloturee = session.statut === "CLOTUREE";

                      const centresRattaches = centres.filter((c) =>
                        c.sessionIds.includes(session.id),
                      );

                      const nbSemainesEstime = semaineTotaleSession(
                        session.dateDebut,
                        session.dateFin,
                      );
                      const semaineActuelle = estEnCours
                        ? semaineCouranteDepuis(session.dateDebut, session.dateFin)
                        : null;

                      return (
                        <tr
                          key={session.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            estEnCours ? "bg-emerald-50/20" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {session.annee}
                              </span>
                              {estEnCours && (
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Session courante" />
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3 text-slate-600">
                            <span>{formaterDate(session.dateDebut)}</span>
                            <span className="text-slate-400 mx-1">→</span>
                            <span>{formaterDate(session.dateFin)}</span>
                          </td>

                          <td className="px-3 py-3 text-center text-slate-600 tabular-nums">
                            <span>{nbSemainesEstime} sem.</span>
                            {semaineActuelle && (
                              <span className="ml-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                S{semaineActuelle}
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex flex-wrap items-center gap-1 max-w-xs">
                              {centresRattaches.length === 0 ? (
                                <span className="text-slate-400 italic">Aucun centre</span>
                              ) : (
                                centresRattaches.map((c) => (
                                  <span
                                    key={c.id}
                                    className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700"
                                  >
                                    {c.nom}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3 text-center">
                            {estEnCours && (
                              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60">
                                En cours
                              </span>
                            )}
                            {estPlanifiee && (
                              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60">
                                Planifiée
                              </span>
                            )}
                            {estCloturee && (
                              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold text-slate-600 bg-slate-100">
                                Clôturée
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {/* Semaines de cours */}
                              <button
                                type="button"
                                onClick={() => setSessionPourSemaines(session)}
                                title="Gérer le calendrier des semaines"
                                className="rounded px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
                              >
                                Semaines
                              </button>

                              {/* Modifier la session (si non clôturée) */}
                              {!estCloturee && (
                                <button
                                  type="button"
                                  onClick={() => handleOuvrirModifierSession(session)}
                                  title="Modifier les dates de la session"
                                  className="rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                                >
                                  Modifier
                                </button>
                              )}

                              {/* Démarrer la session (si planifiée) */}
                              {estPlanifiee && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setErreurAction(null);
                                    setSessionADemarrer(session);
                                  }}
                                  title="Démarrer officiellement la promotion"
                                  className="rounded px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer transition-colors"
                                >
                                  Démarrer
                                </button>
                              )}

                              {/* Clôturer la session (si en cours) */}
                              {estEnCours && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setErreurAction(null);
                                    setSessionACloturer(session);
                                  }}
                                  title="Clôturer définitivement la session"
                                  className="rounded px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-50 cursor-pointer transition-colors"
                                >
                                  Clôturer
                                </button>
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
                                  className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                >
                                  <Trash2 size={13} />
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
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENU ONGLET 2 : PHASES PÉDAGOGIQUES
      ========================================================================= */}
      {ongletActif === "phases" && (
        <div className="space-y-4">
          {/* Séquence visuelle compacte */}
          {phases.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                Enchaînement chronologique des phases
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {phases.map((phase, idx) => (
                  <div key={phase.id} className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
                      <span className="rounded bg-brand-orange text-white px-1 py-0.2 text-[10px] font-bold">
                        {phase.code}
                      </span>
                      <span>{phase.libelle}</span>
                    </div>
                    {idx < phases.length - 1 && (
                      <ArrowRight size={13} className="text-slate-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tableau dense des phases */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            {chargementPhases ? (
              <div className="p-10 text-center text-xs text-slate-400">Chargement des phases...</div>
            ) : phases.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-700">Aucune phase pédagogique configurée.</p>
                <button
                  type="button"
                  onClick={() => setModalCreerPhase(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Ajouter une phase</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5 w-24">Code</th>
                      <th className="px-4 py-2.5">Intitulé de la phase</th>
                      <th className="px-4 py-2.5">Période indicative</th>
                      <th className="px-3 py-2.5 text-center w-28">État</th>
                      <th className="px-4 py-2.5 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
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
                        <tr key={phase.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5 font-bold font-mono text-slate-800">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-brand-orange font-bold">
                              {phase.code}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">
                            {phase.libelle}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">
                            {aDesDates ? (
                              <span>
                                {formaterDate(phase.dateDebut!)}
                                <span className="text-slate-400 mx-1">→</span>
                                {formaterDate(phase.dateFin!)}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Non définie</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {estEnCours && (
                              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60">
                                En cours
                              </span>
                            )}
                            {estAVenir && (
                              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-50">
                                À venir
                              </span>
                            )}
                            {estAchevee && (
                              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-100">
                                Achevée
                              </span>
                            )}
                            {!aDesDates && (
                              <span className="text-[10px] text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOuvrirModifierPhase(phase)}
                                title="Modifier la phase"
                                className="rounded p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setErreurAction(null);
                                  setPhaseASupprimer(phase);
                                }}
                                title="Supprimer la phase"
                                className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

