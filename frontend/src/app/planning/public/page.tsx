"use client";

import { Suspense, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  useAffectations,
  JOURS,
  LABELS_JOUR,
  type Affectation,
  type Jour,
} from "@/modules/affectation";
import { useSessionActive, useCentres, type Centre } from "@/modules/centres-sessions";
import { useFormations, type Formation } from "@/modules/academique";
import {
  useMatieres,
  construireCouleursMatieres,
  type Matiere,
  type CouleurMatiere,
} from "@/modules/matieres";

import { useEnseignants, type Enseignant } from "@/modules/personnel";
import { useSalles, type Salle } from "@/modules/salle";
import { useAbonnementsSession } from "@/modules/abonnement";
import {
  useProgressions,
  construireMappingAffectationsProgressions,
  type Progression,
  type InfoProgressionAffectation,
} from "@/modules/progression";
import { Modal } from "@/shared/ui";
import { semaineCouranteDepuis } from "@/shared/lib/semaine";
import {
  Palette,
  CalendarDays,
  CheckCircle2,
  Search,
  X,
  Phone,
  BookOpen,
  MapPin,
  Clock,
  User,
  FileText,
  Sparkles,
} from "lucide-react";

const MAX_SEANCES_PAR_JOUR = 3;
const BORDURE_JOUR = "border-t-[3px] border-t-slate-600";


function PlanningPublicContenu() {
  const searchParams = useSearchParams();
  const semaineParam = searchParams.get("semaine");
  const centreIdParam = searchParams.get("centreId");

  const [recherche, setRecherche] = useState("");

  const { data: sessionActive } = useSessionActive();
  const sessionId = sessionActive?.id;

  const semaineCourante = sessionActive
    ? semaineCouranteDepuis(sessionActive.dateDebut, sessionActive.dateFin)
    : 1;

  const semaine = semaineParam ? parseInt(semaineParam, 10) : semaineCourante;

  const { data: centres } = useCentres();
  const { data: formations } = useFormations();
  const { data: salles } = useSalles(sessionId);
  const { data: matieres } = useMatieres();
  const { data: enseignants } = useEnseignants();
  const { data: abonnementsSession = [] } = useAbonnementsSession(sessionId);
  const { data: progressions = [] } = useProgressions();
  const { data: affectations } = useAffectations({
    sessionId,
    semaine,
    matiereId: undefined,
    centreId: centreIdParam ?? undefined,
  });

  const mappingAffectationsProgressions = useMemo(
    () =>
      construireMappingAffectationsProgressions(
        affectations ?? [],
        sessionId
          ? progressions.filter((p) => p.sessionId === sessionId)
          : progressions,
      ),
    [affectations, progressions, sessionId],
  );

  const [creneauSelectionne, setCreneauSelectionne] = useState<Affectation | null>(null);


  const couleursMatieres = useMemo(
    () => construireCouleursMatieres(matieres ?? []),
    [matieres],
  );

  const matieresVisibles = useMemo(() => {
    if (!matieres || !affectations) return [];
    const ids = new Set(affectations.map((a) => a.matiereId));
    return matieres.filter((m) => ids.has(m.id));
  }, [matieres, affectations]);

  type GroupeFormation = { formation: Formation; salles: Salle[] };
  type GroupeCentre = { centre: Centre; formations: GroupeFormation[] };

  const colonnes = useMemo<GroupeCentre[]>(() => {
    if (!salles || !centres || !formations) return [];

    const abonnementsActifs = new Set(
      abonnementsSession.map((a) => `${a.centreId}:${a.formationId}`),
    );

    const centresFiltres = centreIdParam
      ? centres.filter((c) => c.id === centreIdParam)
      : centres;

    const parCentre = new Map<string, GroupeCentre>();
    for (const salle of salles) {
      if (centreIdParam && salle.centreId !== centreIdParam) continue;
      const centre = centresFiltres.find((c) => c.id === salle.centreId);
      const formation = formations.find((f) => f.id === salle.formationId);
      if (!centre || !formation) continue;

      if (!abonnementsActifs.has(`${centre.id}:${formation.id}`)) continue;

      if (!parCentre.has(centre.id)) {
        parCentre.set(centre.id, { centre, formations: [] });
      }
      const gc = parCentre.get(centre.id)!;
      let gf = gc.formations.find((g) => g.formation.id === formation.id);
      if (!gf) {
        gf = { formation, salles: [] };
        gc.formations.push(gf);
      }
      gf.salles.push(salle);
    }
    return [...parCentre.values()]
      .map((gc) => ({
        ...gc,
        formations: gc.formations
          .filter((gf) => gf.salles.length > 0)
          .sort((a, b) =>
            a.formation.nom.localeCompare(b.formation.nom, "fr", {
              sensitivity: "base",
            }),
          )
          .map((gf) => ({
            ...gf,
            salles: [...gf.salles].sort((s1, s2) =>
              s1.nom.localeCompare(s2.nom, "fr", { numeric: true }),
            ),
          })),
      }))
      .filter((gc) => gc.formations.length > 0);
  }, [salles, centres, formations, abonnementsSession, centreIdParam]);

  function creneauxPour(salleId: string, jour: Jour): (Affectation | undefined)[] {
    const reels = (affectations ?? []).filter(
      (a) => a.salleId === salleId && a.jour === jour,
    );
    const seanceMax = Math.max(MAX_SEANCES_PAR_JOUR, ...reels.map((a) => a.seance));
    const parSeance: (Affectation | undefined)[] = Array.from(
      { length: seanceMax },
      () => undefined,
    );
    for (const a of reels) parSeance[a.seance - 1] = a;
    return parSeance;
  }

  const correspondALaRecherche = useCallback(
    (creneau: Affectation): boolean => {
      if (!recherche.trim()) return true;
      const q = recherche.trim().toLowerCase();
      const enseignant = enseignants?.find((e) => e.id === creneau.enseignantId);
      const matiere = matieres?.find((m) => m.id === creneau.matiereId);
      const salle = salles?.find((s) => s.id === creneau.salleId);
      const formation = formations?.find((f) => f.id === creneau.formationId);
      const centre = centres?.find((c) => c.id === creneau.centreId);
      const texte = [
        enseignant ? `${enseignant.prenom} ${enseignant.nom}` : "",
        matiere?.nom ?? "",
        salle?.nom ?? "",
        formation?.nom ?? "",
        centre?.nom ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return texte.includes(q);
    },
    [recherche, enseignants, matieres, salles, formations, centres],
  );

  const nombreResultatsRecherche = useMemo(() => {
    if (!recherche.trim() || !affectations) return null;
    return affectations.filter((a) => correspondALaRecherche(a)).length;
  }, [recherche, affectations, correspondALaRecherche]);

  const centreSelectionne = useMemo(
    () => (centreIdParam ? centres?.find((c) => c.id === centreIdParam) : undefined),
    [centres, centreIdParam],
  );

  const chargement = !sessionActive || !centres || !formations || !salles || !matieres;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* En-tête de la page publique */}
      <header className="border-b border-slate-200 bg-white px-8 py-5 shadow-xs">
        <div className="mx-auto max-w-[1600px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange text-white font-black text-xl shadow-xs">
              E
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-anthracite">
                EXCELIS PRÉPAS - Planning des cours
                {centreSelectionne ? ` (${centreSelectionne.nom})` : ""}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {sessionActive
                  ? `Session ${sessionActive.dateDebut} → ${sessionActive.dateFin}`
                  : "Chargement..."}
                {semaine === semaineCourante && (
                  <span className="ml-2 text-brand-orange font-semibold">· Semaine en cours</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Barre de recherche */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 shadow-xs focus-within:border-brand-orange focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-orange/10 w-64 transition-all">
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher enseignant, salle..."
                  className="w-full text-xs outline-none text-slate-700 placeholder-slate-400 bg-transparent"
                />
                {recherche && (
                  <button
                    type="button"
                    onClick={() => setRecherche("")}
                    title="Effacer la recherche"
                    className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {nombreResultatsRecherche !== null && (
                <p className="text-brand-orange text-xs font-bold px-1">
                  {nombreResultatsRecherche} séance{nombreResultatsRecherche > 1 ? "s" : ""} trouvée{nombreResultatsRecherche > 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Badge Semaine */}
            <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs shrink-0 self-start">
              <CalendarDays size={15} className="text-brand-orange" />
              <span>Semaine {semaine}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] p-6 flex flex-col gap-5">
        {/* Grille + Légende */}
        <div className="flex flex-col xl:flex-row gap-4 min-h-0">
          {/* Grille */}
          <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            {chargement ? (
              <p className="p-12 text-center text-slate-400">Chargement du planning...</p>
            ) : colonnes.length === 0 ? (
              <p className="p-12 text-center text-slate-400">
                {centreSelectionne
                  ? `Aucune salle disponible pour le centre ${centreSelectionne.nom} dans cette session.`
                  : "Aucune salle disponible pour cette session."}
              </p>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-20 bg-white">
                  {/* Ligne 1 : Centres */}
                  <tr>
                    <th
                      rowSpan={3}
                      className="sticky left-0 z-30 min-w-[90px] w-[90px] border-b border-r border-slate-200 bg-slate-100 p-2.5 text-center align-middle text-xs font-bold uppercase tracking-wider text-slate-700 shadow-[1px_0_0_0_#e2e8f0]"
                    >
                      Jour
                    </th>
                    <th
                      rowSpan={3}
                      className="sticky left-[90px] z-30 min-w-[50px] w-[50px] border-b border-r border-slate-200 bg-slate-100 p-2.5 text-center align-middle text-xs font-bold uppercase tracking-wider text-slate-700 shadow-[1px_0_0_0_#e2e8f0]"
                    >
                      Séance
                    </th>
                    {colonnes.map((groupe, index) => (
                      <th
                        key={groupe.centre.id}
                        colSpan={groupe.formations.reduce((t, f) => t + f.salles.length, 0)}
                        className={`border-b border-r p-2.5 text-center text-xs font-bold tracking-wider text-white uppercase ${
                          index % 2 === 0 ? "bg-slate-700" : "bg-slate-600"
                        } ${index > 0 ? "border-l-2 border-l-slate-400" : ""}`}
                      >
                        {groupe.centre.nom}
                        {groupe.centre.statut === "FERME" && (
                          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] normal-case font-normal">
                            Fermé
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                  {/* Ligne 2 : Formations */}
                  <tr>
                    {colonnes.map((groupe, groupeIndex) =>
                      groupe.formations.map((gf, formationIndex) => (
                        <th
                          key={gf.formation.id}
                          colSpan={gf.salles.length}
                          className={`border-b border-r bg-brand-orange/90 p-2 text-center text-xs font-bold text-white uppercase ${
                            groupeIndex > 0 && formationIndex === 0
                              ? "border-l-2 border-l-slate-400"
                              : ""
                          }`}
                        >
                          {gf.formation.nom}
                        </th>
                      )),
                    )}
                  </tr>
                  {/* Ligne 3 : Salles */}
                  <tr>
                    {colonnes.map((groupe, groupeIndex) =>
                      groupe.formations.map((gf, formationIndex) =>
                        gf.salles.map((salle, salleIndex) => (
                          <th
                            key={salle.id}
                            className={`min-w-[120px] border-b border-r bg-slate-50 p-2.5 text-center text-xs font-semibold text-slate-600 ${
                              groupeIndex > 0 && formationIndex === 0 && salleIndex === 0
                                ? "border-l-2 border-l-slate-400"
                                : ""
                            }`}
                          >
                            {salle.nom}
                          </th>
                        )),
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {JOURS.map((jour, jourIndex) => {
                    const teinteJour = jourIndex % 2 === 1 ? "bg-slate-50/60" : "bg-white";
                    const hauteur = Math.max(
                      1,
                      ...colonnes.flatMap((groupe) =>
                        groupe.formations.flatMap((gf) =>
                          gf.salles.map((salle) => creneauxPour(salle.id, jour).length),
                        ),
                      ),
                    );
                    return Array.from({ length: hauteur }).map((_, ligne) => (
                      <tr
                        key={`${jour}-${ligne}`}
                        className={`${teinteJour} hover:bg-amber-50/30 transition-colors`}
                      >
                        {ligne === 0 && (
                          <td
                            rowSpan={hauteur}
                            className={`sticky left-0 z-20 w-[90px] min-w-[90px] border-r border-slate-200 bg-slate-50/95 backdrop-blur-xs p-2 text-center align-middle shadow-[1px_0_0_0_#e2e8f0] ${
                              jourIndex > 0 ? BORDURE_JOUR : ""
                            }`}
                          >
                            <span className="inline-block rounded-lg bg-brand-anthracite px-2.5 py-1.5 text-xs font-bold text-white uppercase tracking-wider shadow-xs">
                              {LABELS_JOUR[jour]}
                            </span>
                          </td>
                        )}
                        <td
                          className={`sticky left-[90px] z-20 w-[50px] min-w-[50px] border-r border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs p-2 text-center align-middle shadow-[1px_0_0_0_#e2e8f0] ${
                            ligne === 0 && jourIndex > 0 ? BORDURE_JOUR : ""
                          }`}
                        >
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-black text-slate-700 shadow-2xs">
                            S{ligne + 1}
                          </span>
                        </td>
                        {colonnes.map((groupe, groupeIndex) =>
                          groupe.formations.map((gf, formationIndex) =>
                            gf.salles.map((salle, salleIndex) => {
                              const contenu = creneauxPour(salle.id, jour);
                              const creneau = contenu[ligne];
                              const bordureCentre =
                                groupeIndex > 0 && formationIndex === 0 && salleIndex === 0
                                  ? "border-l-2 border-l-slate-400"
                                  : "";
                              const bordureJour =
                                ligne === 0 && jourIndex > 0 ? BORDURE_JOUR : "";
                              return (
                                <td
                                  key={`${salle.id}-${jour}-${ligne}`}
                                  className={`border-r border-b border-slate-100 p-1.5 align-middle ${bordureCentre} ${bordureJour}`}
                                >
                                  {creneau && (() => {
                                    const couleur = couleursMatieres.get(creneau.matiereId);
                                    const enseignant = enseignants?.find(
                                      (e) => e.id === creneau.enseignantId,
                                    );
                                    const matiere = matieres?.find(
                                      (m) => m.id === creneau.matiereId,
                                    );
                                     const attenue = !correspondALaRecherche(creneau);
                                     const infoProg = mappingAffectationsProgressions.get(creneau.id);
                                     const progression = infoProg?.progression;
                                     const numeroCours = infoProg?.numeroCours ?? creneau.seance;

                                     return (
                                         <div
                                           role="button"
                                           tabIndex={0}
                                           onClick={() => setCreneauSelectionne(creneau)}
                                           onKeyDown={(e) => {
                                             if (e.key === "Enter" || e.key === " ") {
                                               e.preventDefault();
                                               setCreneauSelectionne(creneau);
                                             }
                                           }}
                                           title={
                                             progression
                                               ? `Cours N°${numeroCours} : ${progression.theme}`
                                               : `Séance N°${creneau.seance} (${numeroCours === 1 ? "1er" : `${numeroCours}e`} cours de ${matiere?.nom ?? "la matière"})`
                                           }
                                          className={`group/cell cursor-pointer rounded-xl p-2.5 text-left transition-all border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-brand-orange/60 hover:scale-[1.01] ${
                                            couleur ? couleur.bg : "bg-white"
                                          } ${attenue ? "opacity-20" : ""}`}
                                        >
                                          {/* Si enseignant assigné : Enseignant en premier plan */}
                                          {enseignant ? (
                                            <div className="flex flex-col gap-1.5">
                                              {/* Ligne principale : Avatar + (Nom, Prénom & Téléphone) + Badge Effectuée */}
                                              <div className="flex items-start justify-between gap-1.5">
                                                <div className="flex items-start gap-2 min-w-0">
                                                  <span
                                                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black border shadow-2xs mt-0.5 ${
                                                      couleur
                                                        ? `${couleur.texte} bg-white border-slate-200/80`
                                                        : "bg-slate-100 text-slate-700 border-slate-300"
                                                    }`}
                                                  >
                                                    {enseignant.prenom[0]}{enseignant.nom[0]}
                                                  </span>
                                                  <div className="min-w-0 flex-1 leading-tight">
                                                    <p className="text-xs font-bold text-slate-900 truncate">
                                                      {enseignant.nom} {enseignant.prenom}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-1.5 rounded-md bg-white/90 border border-slate-300 px-2 py-0.5 text-xs font-mono font-bold text-slate-900 shadow-2xs">
                                                      <Phone size={11} className="shrink-0 text-brand-orange" />
                                                      <span className="tracking-wide truncate">{enseignant.telephone || "-"}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                                {creneau.statut === "EFFECTUEE" && (
                                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[9px] font-bold shrink-0">
                                                    <CheckCircle2 size={10} className="text-emerald-600" />
                                                    <span>Fait</span>
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          ) : (
                                          /* Si aucun enseignant assigné */
                                          <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between gap-1">
                                              <span
                                                className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide truncate max-w-[125px] ${
                                                  couleur
                                                    ? `${couleur.bg} ${couleur.texte}`
                                                    : "bg-slate-100 text-slate-700"
                                                }`}
                                              >
                                                {matiere?.nom ?? "Matière"}
                                              </span>
                                              <span className="text-[10px] font-semibold text-amber-600">
                                                Non assigné
                                              </span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Aperçu du thème de progression au programme */}
                                        {progression ? (
                                          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-800 border border-slate-200/80 shadow-2xs truncate group-hover/cell:border-brand-orange/40">
                                            <BookOpen size={10} className="text-brand-orange shrink-0" />
                                            <span className="text-[9px] font-extrabold text-brand-orange shrink-0">C{numeroCours} :</span>
                                            <span className="truncate font-semibold">{progression.theme}</span>
                                          </div>
                                        ) : (
                                          <div className="mt-1.5 flex items-center gap-1 text-[9px] text-slate-400 opacity-60">
                                            <BookOpen size={9} />
                                            <span>Cours {numeroCours} · Détails</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>
                              );
                            }),
                          ),
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Légende */}
          <div className="w-full xl:w-52 shrink-0 rounded-xl border border-brand-orange/20 bg-brand-orange/5 p-4 shadow-xs">
            <div className="mb-3 flex items-center gap-2">
              <Palette size={15} className="text-brand-orange" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-anthracite">
                Légende des matières
              </h2>
            </div>
            {matieresVisibles.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune matière cette semaine.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {matieresVisibles.map((matiere) => {
                  const couleur = couleursMatieres.get(matiere.id);
                  return (
                    <span
                      key={matiere.id}
                      className={`rounded-lg px-3 py-1.5 text-center text-xs font-bold shadow-xs ${
                        couleur
                          ? `${couleur.bg} ${couleur.texte}`
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {matiere.nom}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Planning généré par EXCELIS PRÉPAS · Vue publique en lecture seule · Cliquez sur une séance pour afficher son syllabus
        </p>
      </main>

      {/* ── MODALE DÉTAIL & PROGRESSION PÉDAGOGIQUE DU COURS ── */}
      {creneauSelectionne && (
        <ModalProgressionPublic
          creneau={creneauSelectionne}
          onClose={() => setCreneauSelectionne(null)}
          formations={formations}
          matieres={matieres}
          salles={salles}
          centres={centres}
          enseignants={enseignants}
          infoProgression={mappingAffectationsProgressions.get(creneauSelectionne.id)}
          couleur={couleursMatieres.get(creneauSelectionne.matiereId)}
        />
      )}
    </div>
  );
}

interface ModalProgressionPublicProps {
  creneau: Affectation;
  onClose: () => void;
  formations?: Formation[];
  matieres?: Matiere[];
  salles?: Salle[];
  centres?: Centre[];
  enseignants?: Enseignant[];
  infoProgression?: InfoProgressionAffectation;
  couleur?: CouleurMatiere;
}


function ModalProgressionPublic({
  creneau,
  onClose,
  formations,
  matieres,
  salles,
  centres,
  enseignants,
  infoProgression,
  couleur,
}: ModalProgressionPublicProps) {
  const formation = formations?.find((f) => f.id === creneau.formationId);
  const matiere = matieres?.find((m) => m.id === creneau.matiereId);
  const salle = salles?.find((s) => s.id === creneau.salleId);
  const centre = centres?.find((c) => c.id === creneau.centreId);
  const enseignant = enseignants?.find((e) => e.id === creneau.enseignantId);

  const progression = infoProgression?.progression;
  const numeroCours = infoProgression?.numeroCours ?? creneau.seance;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${formation?.nom ?? "Formation"} · ${matiere?.nom ?? "Matière"}`}
      description={`Semaine ${creneau.semaine} · ${LABELS_JOUR[creneau.jour]} (Créneau N°${creneau.seance}) · ${numeroCours === 1 ? "1er Cours" : `${numeroCours}e Cours`} de ${matiere?.nom ?? "la matière"} en ${salle?.nom ?? "salle"}`}
    >
      <div className="space-y-5">
        {/* ── Bandeau Contexte Séance ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Salle et Centre */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 shadow-2xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs shrink-0">
              <MapPin size={16} className="text-brand-orange" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Lieu
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {salle?.nom ?? "Salle"}
              </p>
              <p className="text-[11px] text-slate-500">
                {centre?.nom ?? "Centre"}
              </p>
            </div>
          </div>

          {/* Statut de la séance */}
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 shadow-2xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs shrink-0">
              <Clock size={16} className="text-brand-orange" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Séance &amp; Statut
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                Créneau {creneau.seance} du jour · {numeroCours === 1 ? "1er cours" : `${numeroCours}e cours`} du syllabus
              </p>
              <div className="mt-1">
                {creneau.statut === "EFFECTUEE" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 size={11} className="text-emerald-600" />
                    <span>Séance effectuée</span>
                  </span>
                ) : creneau.statut === "ASSIGNEE" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                    <span>Séance programmée</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    <span>{creneau.statut}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Enseignant Assigné ── */}
        {enseignant && (
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black shadow-2xs ${
                  couleur
                    ? `${couleur.bg} ${couleur.texte} border border-slate-200`
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {enseignant.prenom[0]}
                {enseignant.nom[0]}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Enseignant
                </span>
                <p className="text-xs font-bold text-slate-900">
                  {enseignant.nom} {enseignant.prenom}
                </p>
              </div>
            </div>

            {enseignant.telephone && (
              <a
                href={`tel:${enseignant.telephone}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs font-mono font-bold text-slate-800 hover:border-brand-orange hover:text-brand-orange transition-colors cursor-pointer"
              >
                <Phone size={12} className="text-brand-orange" />
                <span>{enseignant.telephone}</span>
              </a>
            )}
          </div>
        )}

        {/* ── CONTENU DE LA PROGRESSION DU COURS (SYLLABUS) ── */}
        <div className="rounded-2xl border border-brand-orange/30 bg-orange-50/30 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-brand-orange/15 pb-2.5">
            <div className="flex items-center gap-2">
              <BookOpen size={17} className="text-brand-orange" />
              <h3 className="text-sm font-bold text-slate-900">
                Progression Pédagogique ({numeroCours === 1 ? "1er Cours" : `${numeroCours}e Cours`})
              </h3>
            </div>
            {progression ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                ✓ Contenu disponible
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                En attente
              </span>
            )}
          </div>

          {progression ? (
            <div className="space-y-4">
              {/* Thème */}
              <div>
                <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Thème au programme
                </span>
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                  <p className="text-sm font-bold text-slate-900">
                    {progression.theme}
                  </p>
                </div>
              </div>

              {/* Contenu détaillé */}
              <div>
                <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                  Contenu dispensé &amp; Notions abordées
                </span>
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {progression.contenu}
                  </p>
                </div>
              </div>

              {/* Exercices */}
              {progression.exercices && (
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    Exercices &amp; Devoirs
                  </span>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <p className="font-mono text-xs text-slate-800 whitespace-pre-line">
                      {progression.exercices}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-xs text-slate-500 space-y-1">
              <BookOpen size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">
                Aucun thème renseigné pour ce cours
              </p>
              <p className="text-[11px] text-slate-400">
                Le chef de département ou l&rsquo;enseignant n&rsquo;a pas encore
                publié la fiche pédagogique pour cette séance.
              </p>
            </div>
          )}
        </div>

        {/* Bouton de fermeture */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}


export default function PlanningPublicPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-400 text-sm">
          Chargement du planning...
        </div>
      }
    >
      <PlanningPublicContenu />
    </Suspense>
  );
}

