import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Doit rester aligné sur ChangerMonMotDePasseRequest côté backend (@Size(min = 8)).
export const changerMonMotDePasseSchema = z
  .object({
    motDePasseActuel: z.string().min(1, "Le mot de passe actuel est requis"),
    nouveauMotDePasse: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
    confirmation: z
      .string()
      .min(1, "Veuillez confirmer le nouveau mot de passe"),
  })
  .refine((v) => v.nouveauMotDePasse === v.confirmation, {
    message: "Les deux mots de passe ne correspondent pas",
    path: ["confirmation"],
  })
  .refine((v) => v.nouveauMotDePasse !== v.motDePasseActuel, {
    message: "Le nouveau mot de passe doit être différent de l'actuel",
    path: ["nouveauMotDePasse"],
  });

export type ChangerMonMotDePasseFormValues = z.infer<
  typeof changerMonMotDePasseSchema
>;
