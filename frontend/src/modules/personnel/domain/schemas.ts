import { z } from "zod";

export const enseignantSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string().min(1, "Le prénom est requis"),
  matricule: z.string().min(1, "Le matricule est requis"),
  coutParSeance: z
    .number({ message: "Le coût par séance doit être un nombre" })
    .min(0, "Le coût par séance ne peut pas être négatif"),
  telephone: z.string().optional().or(z.literal("")),
  numeroCni: z.string().optional().or(z.literal("")),
  ecoleFonction: z.string().optional().or(z.literal("")),
  niveauGrade: z.string().optional().or(z.literal("")),
  dateRecrutement: z.string().optional().or(z.literal("")),
});

export type EnseignantFormValues = z.infer<typeof enseignantSchema>;

