import { z } from "zod";

// centreId/sessionId viennent du contexte (comme pour formationSchema) ; formationId
// est en revanche un vrai choix utilisateur (sélection dans la liste des formations
// du centre) — une salle est toujours créée pour une formation précise.
export const salleSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  formationId: z.string().min(1, "La formation est requise"),
});

export type SalleFormValues = z.infer<typeof salleSchema>;
