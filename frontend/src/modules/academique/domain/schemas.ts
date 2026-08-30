import { z } from "zod";

// centreId/sessionId ne font pas partie du formulaire : ils viennent du contexte
// (centre du Chef de Centre connecté, session active), pas d'une saisie utilisateur.
export const formationSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
});

export type FormationFormValues = z.infer<typeof formationSchema>;
