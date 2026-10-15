export type AuditModule =
  | "FINANCE"
  | "BILAN_JOURNALIER"
  | "INSCRIPTION"
  | "PAIE"
  | "ADMINISTRATION";

export interface AuditLogItem {
  id: string;
  createdAt: string;
  utilisateurId: string | null;
  utilisateurNom: string | null;
  utilisateurEmail: string | null;
  utilisateurRole: string | null;
  centreId: string | null;
  centreNom: string | null;
  module: AuditModule | string;
  typeAction: string;
  description: string;
  entiteType: string | null;
  entiteId: string | null;
  statut: "SUCCES" | "ECHEC" | string;
  details: Record<string, unknown> | null;
  adresseIp: string | null;
}

export interface AuditLogFilters {
  module?: string;
  centreId?: string;
  utilisateurId?: string;
  dateDebut?: string;
  dateFin?: string;
  recherche?: string;
  page?: number;
  size?: number;
}

export interface PaginatedAuditLogs {
  content: AuditLogItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
