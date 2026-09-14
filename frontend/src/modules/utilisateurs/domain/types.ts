import type { Role } from "@/types/roles";

export type Utilisateur = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  centreId: string | null;
  departementId: string | null;
  telephone?: string | null;
  numeroCni?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  utilisateur: Utilisateur;
};

export type RefreshRequest = {
  refreshToken: string;
};

// Même forme que LoginResponse côté backend (rotation : un nouveau couple de
// tokens est renvoyé à chaque rafraîchissement).
export type RefreshResponse = LoginResponse;

export type LogoutRequest = {
  refreshToken: string;
};
