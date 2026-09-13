export interface Livre {
  id: string;
  titre: string;
  description?: string;
  prix: number;
  actif: boolean;
  createdAt?: string;
}

export interface CreerLivreDTO {
  titre: string;
  description?: string;
  prix: number;
}

export interface ModifierLivreDTO {
  titre: string;
  description?: string;
  prix: number;
  actif: boolean;
}

export interface VenteLivre {
  id: string;
  sessionId: string;
  centreId: string;
  centreNom: string;
  dateVente: string;
  nomAcheteur: string;
  apprenantId?: string;
  estExterne: boolean;
  livreId: string;
  livreTitre: string;
  quantite: number;
  prixUnitaire: number;
  montantTotal: number;
  entreeId?: string;
  saisiParUtilisateurId: string;
  createdAt: string;
}

export interface LigneVenteLivreDTO {
  livreId: string;
  quantite: number;
}

export interface EnregistrerVenteLivreDTO {
  sessionId: string;
  centreId: string;
  dateVente: string;
  nomAcheteur: string;
  apprenantId?: string;
  estExterne: boolean;
  saisiParUtilisateurId: string;
  lignes: LigneVenteLivreDTO[];
}

export interface VentilationLivreItem {
  livreId: string;
  titreLivre: string;
  quantiteVendue: number;
  montantTotal: number;
}

export interface VentilationCentreItem {
  centreId: string;
  nomCentre: string;
  quantiteVendue: number;
  montantTotal: number;
}

export interface StatsVentesLivres {
  totalMontant: number;
  totalQuantite: number;
  parLivre: VentilationLivreItem[];
  parCentre: VentilationCentreItem[];
}


