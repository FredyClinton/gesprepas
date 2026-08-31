import { z } from "zod";

// Champs réels (envoyés à POST /api/apprenants) : nom, prenom, dateNaissance,
// dateInscription, montantContrat, dateDefinitionContrat, formationId — centreId et
// sessionId viennent du contexte (centre du Chef de Centre connecté, session active),
// pas d'une saisie utilisateur.
//
// etablissementOrigine / preInscrit / referenceRecu / contactApprenant / nomParent /
// contactParent : PAS encore de champ correspondant côté backend (confirmé le
// 31/08/2026 — à ajouter au modèle plus tard). Capturés ici dans le même
// formulaire pour l'expérience utilisateur, mais jamais envoyés dans la requête
// de création — voir InscriptionApprenantView.
export const apprenantSchema = z.object({
    nom: z.string().min(1, "Le nom est requis"),
    prenom: z.string().min(1, "Le prénom est requis"),
    dateNaissance: z.string().min(1, "La date de naissance est requise"),
    contactApprenant: z.string().min(1, "Le contact de l'apprenant est requis"),
    montantContrat: z
        .number({ message: "Le montant du contrat doit être un nombre" })
        .min(0, "Le montant du contrat ne peut pas être négatif"),
    formationId: z.string().min(1, "La formation est requise"),
    etablissementOrigine: z.string().optional(),
    nomParent: z.string().optional(),
    contactParent: z.string().optional(),
    preInscrit: z.boolean().optional(),
    referenceRecu: z.string().optional(),
});

export type ApprenantFormValues = z.infer<typeof apprenantSchema>;