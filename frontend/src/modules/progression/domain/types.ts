export interface Progression {
  id: string;
  formationId: string;
  sessionId: string;
  phaseId: string;
  matiereId: string;
  semaine: number;
  numeroCours: number;
  theme: string;
  contenu: string;
  exercices?: string | null;
}

export interface CreerProgressionPayload {
  formationId: string;
  sessionId: string;
  phaseId: string;
  matiereId: string;
  semaine: number;
  numeroCours: number;
  theme: string;
  contenu: string;
  exercices?: string | null;
}

export interface MettreAJourContenuPayload {
  theme: string;
  contenu: string;
  exercices?: string | null;
}

export type TypeProgression = "THEME" | "TD";

/**
 * Décompose une chaîne de thème brute en type (THEME | TD) et titre nettoyé.
 */
export function decomposerTheme(rawTheme?: string | null): {
  type: TypeProgression;
  titre: string;
} {
  if (!rawTheme || !rawTheme.trim()) {
    return { type: "THEME", titre: "" };
  }
  const trimmed = rawTheme.trim();

  // 1. Préfixe explicite "TD : ...", "TD - ...", "[TD] ..."
  const tdPrefixMatch = trimmed.match(/^(?:\[TD\]|TD)\s*[:\-–]\s*(.*)$/i);
  if (tdPrefixMatch) {
    return { type: "TD", titre: tdPrefixMatch[1].trim() };
  }

  // 2. Préfixe explicite "THÈME : ...", "THEME : ...", "[THEME] ...", "COURS : ..."
  const themePrefixMatch = trimmed.match(
    /^(?:\[TH[ÈE]ME\]|TH[ÈE]ME|COURS)\s*[:\-–]\s*(.*)$/i,
  );
  if (themePrefixMatch) {
    return { type: "THEME", titre: themePrefixMatch[1].trim() };
  }

  // 3. Commence par "TD" suivi d'un mot (ex: "TD 1 ..." ou "TD N°1 ...")
  if (/^TD\b/i.test(trimmed)) {
    const sansTd = trimmed.replace(/^TD\s*/i, "").trim();
    return { type: "TD", titre: sansTd || "TD" };
  }

  // 4. Par défaut : THÈME
  return { type: "THEME", titre: trimmed };
}

/**
 * Recompose la chaîne de thème finale enregistrée en base de données.
 * Format standard : "THÈME : <titre>" ou "TD : <titre>".
 */
export function recomposerTheme(type: TypeProgression, titre: string): string {
  let clean = titre.trim();
  clean = clean
    .replace(
      /^(?:\[(?:TD|TH[ÈE]ME)\]|(?:TD|TH[ÈE]ME|COURS))\s*[:\-–]\s*/i,
      "",
    )
    .trim();
  if (!clean) return "";
  return `${type === "TD" ? "TD" : "THÈME"} : ${clean}`;
}
