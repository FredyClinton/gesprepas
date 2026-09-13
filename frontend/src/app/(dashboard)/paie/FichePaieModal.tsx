"use client";

import { useRef, useState } from "react";
import {
  X,
  Printer,
  FileText,
  AlertCircle,
  Building2,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  BookOpen,
  Pencil,
} from "lucide-react";
import {
  useFichePaieDetail,
  useMettreAJourThemeSeance,
} from "@/modules/remuneration/data/queries";
import { formatVolumeHoraire } from "@/modules/remuneration/domain/volumeHoraire";

interface FichePaieModalProps {
  ficheId: string | null;
  onClose: () => void;
}

export function FichePaieModal({ ficheId, onClose }: FichePaieModalProps) {
  const {
    data: fiche,
    isLoading,
    error,
  } = useFichePaieDetail(ficheId || undefined);
  const printContentRef = useRef<HTMLDivElement>(null);

  const [seanceEnEditionId, setSeanceEnEditionId] = useState<string | null>(null);
  const [themeEnEdition, setThemeEnEdition] = useState<string>("");
  const mettreAJourThemeMutation = useMettreAJourThemeSeance();

  function demarrerEditionTheme(affectationId: string, themeActuel: string) {
    setSeanceEnEditionId(affectationId);
    setThemeEnEdition(themeActuel === "Séance de cours" ? "" : themeActuel);
  }

  async function validerEditionTheme(affectationId: string) {
    if (!themeEnEdition.trim()) {
      setSeanceEnEditionId(null);
      return;
    }
    try {
      await mettreAJourThemeMutation.mutateAsync({
        affectationId,
        theme: themeEnEdition.trim(),
      });
      setSeanceEnEditionId(null);
    } catch (err) {
      console.error(err);
    }
  }

  if (!ficheId) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 print:static print:block print:p-0 print:m-0 print:bg-white print:overflow-visible print:h-auto print:max-h-none print:w-auto print:inset-auto print:z-auto">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl print:static print:block print:max-h-none print:h-auto print:w-full print:max-w-none print:overflow-visible print:rounded-none print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-orange flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Fiche de Rémunération Enseignant
              </h3>
              <p className="text-[11px] text-slate-500">
                {fiche?.referenceBordereau
                  ? `Bordereau : ${fiche.referenceBordereau}`
                  : "Chargement..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isLoading || !fiche}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Document */}
        <div
          className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible print:h-auto print:max-h-none print:block"
          ref={printContentRef}
        >
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
              <p className="text-sm text-rose-800">
                Impossible de charger la fiche de paie : {error.message}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
              <div className="border-brand-orange h-8 w-8 animate-spin rounded-full border-3 border-t-transparent" />
              <p className="text-sm">
                Chargement du relevé des séances et montants...
              </p>
            </div>
          ) : fiche ? (
            <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 font-sans text-slate-900 shadow-sm print:border-none print:shadow-none">
              {/* Document Header */}
              <div className="mb-6 border-b-2 border-slate-900 pb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-brand-orange text-xl font-black tracking-tight">
                      EXCELIS PREPAS
                    </span>
                    <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                      Classes Préparatoires & Concours d&apos;Excellence
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded bg-slate-900 px-2.5 py-1 text-xs font-bold tracking-wide text-white uppercase">
                      BULLETIN DE PAIE VACATAIRE
                    </span>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      Réf: {fiche.referenceBordereau}
                    </p>
                  </div>
                </div>
              </div>

              {/* Teacher & Session Info Grid */}
              <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
                <div className="space-y-1.5">
                  <div className="text-sm font-bold text-slate-900">
                    {fiche.enseignantNom} {fiche.enseignantPrenom}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="font-semibold text-slate-700">
                      Matricule :
                    </span>
                    <span className="font-mono">
                      {fiche.enseignantMatricule || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">
                      Département :
                    </span>
                    <span>{fiche.departementNom}</span>
                  </div>
                  {fiche.enseignantTelephone && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{fiche.enseignantTelephone}</span>
                    </div>
                  )}
                  {fiche.enseignantEmail && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{fiche.enseignantEmail}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 border-l border-slate-200 pl-4">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="font-semibold text-slate-700">
                      Session :
                    </span>
                    <span className="font-medium text-slate-900">
                      {fiche.sessionNom}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">
                      Date de paiement :
                    </span>
                    <span>{fiche.datePaiement}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="font-semibold text-slate-700">
                      Tarif de base :
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {Number(fiche.coutParSeance).toLocaleString("fr-FR")} FCFA
                      / séance
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="mr-2 font-semibold text-slate-700">
                      Statut de la fiche :
                    </span>
                    {fiche.statut === "PAYEE" ? (
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        ACQUITTÉE (PAYÉE)
                      </span>
                    ) : (
                      <span className="text-brand-orange inline-flex items-center gap-1 rounded border border-orange-300 bg-orange-50 px-2 py-0.5 text-[11px] font-bold">
                        <Clock className="h-3 w-3" />
                        PROGRAMMÉE (EN ATTENTE)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sessions Breakdown Table */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                    Relevé Détaillé des Séances de Cours (
                    {fiche.seances?.length || 0})
                  </h4>
                  <span className="text-[11px] font-medium text-slate-500">
                    Volume horaire total :{" "}
                    {formatVolumeHoraire(fiche.nombreSeances)}
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-100/90 text-[11px] font-bold text-slate-600">
                      <tr>
                        <th className="w-8 p-2.5 text-center">N°</th>
                        <th className="min-w-[170px] p-2.5">Date & Horaire</th>
                        <th className="min-w-[150px] p-2.5">
                          Formation & Matière
                        </th>
                        <th className="min-w-[160px] p-2.5">
                          Thème / Leçon Dispensée
                        </th>
                        <th className="p-2.5">Centre & Salle</th>
                        <th className="p-2.5 text-right whitespace-nowrap">
                          Montant (FCFA)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {fiche.seances && fiche.seances.length > 0 ? (
                        fiche.seances.map((s, index) => {
                          const dateTexte = s.dateSeance
                            ? new Date(s.dateSeance).toLocaleDateString(
                                "fr-FR",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : `Sem. ${s.semaine} • ${s.jour}`;
                          return (
                            <tr
                              key={s.affectationId}
                              className="transition-colors hover:bg-slate-50/70"
                            >
                              <td className="p-2.5 text-center font-mono font-semibold text-slate-400">
                                {index + 1}
                              </td>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900 capitalize">
                                  {dateTexte}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                                  <Clock className="h-3 w-3 shrink-0 text-slate-400" />
                                  <span className="font-mono font-medium text-slate-700">
                                    {s.horaire || `Séance ${s.creneauSeance}`}
                                  </span>
                                  <span className="text-slate-400">
                                    ({s.duree || "2h30"})
                                  </span>
                                </div>
                                {/* <div className="font-mono text-[10px] text-slate-400">
                                  Sem. {s.semaine} • {s.jour} (Créneau{" "}
                                  {s.creneauSeance})
                                </div> */}
                              </td>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">
                                  {s.matiereNom}
                                </div>
                                <div className="mt-0.5 text-[11px] font-medium text-slate-600">
                                  {s.formationNom}
                                </div>
                              </td>
                              <td className="p-2.5">
                                {seanceEnEditionId === s.affectationId ? (
                                  <div className="flex items-center gap-1.5 print:hidden">
                                    <input
                                      type="text"
                                      autoFocus
                                      value={themeEnEdition}
                                      onChange={(e) => setThemeEnEdition(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          validerEditionTheme(s.affectationId);
                                        } else if (e.key === "Escape") {
                                          setSeanceEnEditionId(null);
                                        }
                                      }}
                                      placeholder="Thème / leçon dispensée..."
                                      className="w-full rounded-md border border-brand-orange bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-2xs focus:outline-hidden"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => validerEditionTheme(s.affectationId)}
                                      disabled={mettreAJourThemeMutation.isPending}
                                      className="rounded bg-brand-orange px-2 py-1 text-[10px] font-bold text-white shadow-2xs hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
                                    >
                                      OK
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSeanceEnEditionId(null)}
                                      className="rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-500 hover:bg-slate-100 cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="group/theme flex items-center justify-between gap-1.5 rounded-lg border border-slate-200/70 bg-slate-50/80 px-2.5 py-1 text-[11px] font-medium text-slate-800 transition-all hover:border-brand-orange/40 hover:bg-white">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <BookOpen className="text-brand-orange h-3 w-3 shrink-0" />
                                      <span className="line-clamp-2">
                                        {s.theme || "Séance de cours"}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        demarrerEditionTheme(s.affectationId, s.theme || "")
                                      }
                                      title="Modifier le thème de ce cours"
                                      className="opacity-0 group-hover/theme:opacity-100 text-slate-400 hover:text-brand-orange transition-opacity p-0.5 rounded cursor-pointer print:hidden shrink-0"
                                    >
                                      <Pencil size={11} />
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="p-2.5 text-slate-600">
                                <div className="font-medium text-slate-800">
                                  {s.centreNom}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {s.salleNom}
                                </div>
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold whitespace-nowrap text-slate-900">
                                {Number(s.coutApplique).toLocaleString("fr-FR")}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-6 text-center text-slate-400"
                          >
                            Aucune séance détaillée trouvée pour cette fiche.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Block */}
              <div className="mb-8 flex justify-end">
                <div className="w-72 rounded-xl border-2 border-slate-900 bg-slate-50/50 p-4">
                  <div className="mb-1.5 flex justify-between text-xs text-slate-600">
                    <span>Nombre total de séances :</span>
                    <span className="font-mono font-bold text-slate-900">
                      {fiche.nombreSeances}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-300 pt-2 text-sm font-black text-slate-900">
                    <span>NET À PERCEVOIR :</span>
                    <span className="text-brand-orange font-mono">
                      {Number(fiche.montantTotal).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures Block */}
              <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-4 text-xs text-slate-600">
                <div className="space-y-12">
                  <p className="font-semibold text-slate-800">
                    Visa & Cachet de la Direction / Comptabilité :
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    Ordonnateur : {fiche.saisiPar || "DIRECTION"}
                  </p>
                </div>
                <div className="space-y-12 text-right">
                  <p className="font-semibold text-slate-800">
                    Pour acquit (Signature de l&apos;enseignant) :
                  </p>
                  <p className="text-[11px] text-slate-400 italic">
                    Reçu le ____________________
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
