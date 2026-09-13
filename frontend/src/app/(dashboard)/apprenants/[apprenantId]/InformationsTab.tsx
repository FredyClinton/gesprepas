"use client";

import React, { useState } from "react";
import { Card, Button } from "@/shared/ui";
import type { Apprenant, CursusApprenant } from "@/modules/apprenants";
import { usePhases, useFormations } from "@/modules/academique";
import {
  GraduationCap,
  Layers,
  Phone,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Pencil,
  FileText,
} from "lucide-react";
import { ChangerFormationModal } from "./ChangerFormationModal";

const FCFA = new Intl.NumberFormat("fr-FR");

function calculerAge(dateNaissance: string): number {
  const naissance = new Date(dateNaissance);
  const aujourdhui = new Date();
  let age = aujourdhui.getFullYear() - naissance.getFullYear();
  const pasEncoreAnniversaire =
    aujourdhui.getMonth() < naissance.getMonth() ||
    (aujourdhui.getMonth() === naissance.getMonth() &&
      aujourdhui.getDate() < naissance.getDate());
  if (pasEncoreAnniversaire) age -= 1;
  return age;
}

function Champ({
  label,
  valeur,
  icone,
}: {
  label: string;
  valeur: string | React.ReactNode;
  icone?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-brand-gray text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
        {icone}
        <span>{label}</span>
      </p>
      <div className="text-brand-anthracite text-sm sm:text-base font-bold mt-0.5">
        {valeur}
      </div>
    </div>
  );
}

export function InformationsTab({
  apprenant,
  nomFormation,
  nomCentre,
  cursus,
}: {
  apprenant: Apprenant;
  nomFormation: string | undefined;
  nomCentre: string | undefined;
  cursus?: CursusApprenant | null;
}) {
  const { data: phases = [] } = usePhases();
  const { data: formations = [] } = useFormations();

  const [modalChangerOuvert, setModalChangerOuvert] = useState(false);

  // Inscription active en cours
  const inscriptionActive = cursus?.inscriptionsPhases.find(
    (i) => i.statut?.toUpperCase() === "EN_COURS" || i.phaseId === cursus?.phaseActiveId,
  ) || cursus?.inscriptionsPhases[0];

  const phaseActiveObj = phases.find((p) => p.id === inscriptionActive?.phaseId);
  const formationActiveObj = formations.find(
    (f) => f.id === (inscriptionActive?.formationId || apprenant.formationId),
  );

  return (
    <div className="space-y-6">
      {/* ── 1. Cursus & Historique des Phases (Non-écrasement) ── */}
      <Card className="p-6 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="text-brand-orange" size={20} />
              <h2 className="text-brand-anthracite text-lg font-bold">
                Parcours Académique & Phases Pédagogiques
              </h2>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Historique immuable des filières suivies phase par phase. Les filières antérieures sont conservées.
            </p>
          </div>

          {inscriptionActive && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalChangerOuvert(true)}
              className="flex items-center gap-1.5 self-start sm:self-auto text-xs"
            >
              <Pencil size={13} />
              <span>Changer de filière (Phase active)</span>
            </Button>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {(!cursus || cursus.inscriptionsPhases.length === 0) ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center font-black text-sm">
                  1
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                    Phase Initiale
                  </span>
                  <span className="text-base font-black text-slate-900">
                    {nomFormation || "Filière assignée"}
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold uppercase">
                En cours
              </span>
            </div>
          ) : (
            cursus.inscriptionsPhases.map((ins, idx) => {
              const phaseObj = phases.find((p) => p.id === ins.phaseId);
              const formObj = formations.find((f) => f.id === ins.formationId);
              const formPrecObj = ins.formationPrecedenteId
                ? formations.find((f) => f.id === ins.formationPrecedenteId)
                : null;
              const contratAssocie = cursus?.contrats?.find(
                (c) => c.id === ins.contratId || c.phaseId === ins.phaseId,
              );
              const estEnCours = ins.statut?.toUpperCase() === "EN_COURS";

              return (
                <div
                  key={ins.id || idx}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                    estEnCours
                      ? "bg-orange-50/40 border-orange-200 shadow-2xs"
                      : "bg-slate-50/70 border-slate-200"
                  } gap-3`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        estEnCours
                          ? "bg-brand-orange text-white shadow-xs"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {phaseObj?.code || `P${idx + 1}`}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          {formObj?.nom || "Filière inconnue"}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          · {phaseObj?.libelle || "Phase"}
                        </span>
                      </div>
                      {formPrecObj && (
                        <p className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                          <ArrowRight size={11} />
                          <span>Transféré depuis {formPrecObj.nom}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Inscrit le {new Date(ins.dateDebut).toLocaleDateString("fr-FR")}
                        {ins.dateFin ? ` — Clôturé le ${new Date(ins.dateFin).toLocaleDateString("fr-FR")}` : ""}
                      </p>
                      {contratAssocie && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
                            <FileText size={11} className="text-brand-orange" />
                            <span>{contratAssocie.reference}</span>
                          </span>
                          <span className="font-black text-slate-800 text-xs">
                            {FCFA.format(contratAssocie.montantTotal)} FCFA
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {contratAssocie.statut}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {estEnCours ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-black uppercase">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Phase Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200/80 text-slate-700 px-3 py-1 text-xs font-bold uppercase">
                        Terminé
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* ── 2. Données Personnelles & Établissement (Données réelles) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2 bg-white border border-slate-200">
          <h2 className="text-brand-anthracite text-lg font-bold">
            Données personnelles
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Champ label="Nom" valeur={apprenant.nom} />
            <Champ label="Prénom" valeur={apprenant.prenom} />
            <Champ
              label="Date de naissance"
              valeur={`${new Date(apprenant.dateNaissance).toLocaleDateString("fr-FR")} (${calculerAge(apprenant.dateNaissance)} ans)`}
              icone={<Calendar size={13} className="text-slate-400" />}
            />
            <Champ
              label="Date d'admission"
              valeur={new Date(apprenant.dateInscription).toLocaleDateString("fr-FR")}
            />
            <Champ
              label="Centre de préparation"
              valeur={nomCentre ?? "-"}
              icone={<Building2 size={13} className="text-slate-400" />}
            />
            <Champ
              label="Filière active"
              valeur={formationActiveObj?.nom || nomFormation || "-"}
              icone={<GraduationCap size={13} className="text-brand-orange" />}
            />
            <Champ
              label="Téléphone de l'apprenant"
              valeur={apprenant.contactApprenant || <span className="text-slate-400 font-normal italic">Non renseigné</span>}
              icone={<Phone size={13} className="text-brand-orange" />}
            />
            <Champ
              label="Établissement ou Lycée d'origine"
              valeur={apprenant.etablissementOrigine || <span className="text-slate-400 font-normal italic">Non renseigné</span>}
              icone={<Building2 size={13} className="text-brand-orange" />}
            />
          </div>
        </Card>

        {/* ── 3. Tuteur / Contact Référent & Statut ── */}
        <div className="space-y-6">
          <Card className="p-6 bg-white border border-slate-200">
            <h2 className="text-brand-anthracite text-lg font-bold">
              Parent / Tuteur
            </h2>
            <div className="mt-4 space-y-4">
              <Champ
                label="Nom du parent / tuteur"
                valeur={apprenant.nomParent || <span className="text-slate-400 font-normal italic">Non renseigné</span>}
                icone={<User size={13} className="text-slate-400" />}
              />
              <Champ
                label="Contact téléphonique parent"
                valeur={apprenant.contactParent || <span className="text-slate-400 font-normal italic">Non renseigné</span>}
                icone={<Phone size={13} className="text-slate-400" />}
              />
            </div>
          </Card>

          <Card className="p-6 bg-white border border-slate-200">
            <h2 className="text-brand-anthracite text-lg font-bold">
              Type d&rsquo;admission
            </h2>
            <div className="mt-3">
              {apprenant.preInscrit ? (
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    <Clock size={13} />
                    Pré-inscrit (Acompte)
                  </span>
                  {apprenant.referenceRecu && (
                    <p className="text-xs text-slate-600 font-medium">
                      Réf. reçu acompte : <strong>{apprenant.referenceRecu}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 size={13} />
                  Inscription définitive
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Changement de filière */}
      {modalChangerOuvert && (
        <ChangerFormationModal
          isOpen={modalChangerOuvert}
          onClose={() => setModalChangerOuvert(false)}
          apprenantId={apprenant.id}
          nomApprenant={`${apprenant.prenom} ${apprenant.nom}`}
          inscriptionActive={inscriptionActive}
          nomFormationActuelle={formationActiveObj?.nom || nomFormation}
          nomPhaseActuelle={phaseActiveObj?.libelle}
        />
      )}
    </div>
  );
}
