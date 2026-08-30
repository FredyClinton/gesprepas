import { z } from "zod";
export const relocalisationSchema = z.object({
  adresse: z.string().min(1, "L'adresse est requise"),
  ville: z.string().min(1, "La ville est requise"),
});

export type RelocalisationFormValues = z.infer<typeof relocalisationSchema>;
