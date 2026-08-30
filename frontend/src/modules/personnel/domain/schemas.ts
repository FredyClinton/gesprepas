import { z } from "zod";

export const enseignantSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prenom est requis"),
  matricule: z.string().min(1, "Le matricule est requis"),
  coutParSeance: z
    .number({ message: "Le coût par séance doit être un nombre" })
    .min(0, "Le coût par séance ne peut pas être négatif"),
});

export type EnseignantFormValues = z.infer<typeof enseignantSchema>;
