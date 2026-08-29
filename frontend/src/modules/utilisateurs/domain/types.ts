import type { Role } from "@/types/roles";

export type Utilisateur = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  centreId: string | null;
  departementId: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  utilisateur: Utilisateur;
};
