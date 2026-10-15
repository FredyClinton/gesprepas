import type { AuditLogItem } from "@/types/audit";

function echapperValeur(valeur: unknown): string {
  if (valeur === null || valeur === undefined) {
    return '""';
  }
  const str = typeof valeur === "object" ? JSON.stringify(valeur) : String(valeur);
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportAuditLogsToCsv(
  logs: AuditLogItem[],
  nomFichier: string = `journal-audit-${new Date().toISOString().slice(0, 10)}.csv`,
): void {
  const enTetes = [
    "Date & Heure",
    "Utilisateur",
    "Email",
    "Rôle",
    "Centre",
    "Module",
    "Action",
    "Description",
    "Type Entité",
    "ID Entité",
    "Statut",
    "Adresse IP",
    "Détails",
  ];

  const lignes = logs.map((log) => [
    echapperValeur(new Date(log.createdAt).toLocaleString("fr-FR")),
    echapperValeur(log.utilisateurNom ?? "Système"),
    echapperValeur(log.utilisateurEmail ?? ""),
    echapperValeur(log.utilisateurRole ?? ""),
    echapperValeur(log.centreNom ?? ""),
    echapperValeur(log.module),
    echapperValeur(log.typeAction),
    echapperValeur(log.description),
    echapperValeur(log.entiteType ?? ""),
    echapperValeur(log.entiteId ?? ""),
    echapperValeur(log.statut),
    echapperValeur(log.adresseIp ?? ""),
    echapperValeur(log.details ? JSON.stringify(log.details) : ""),
  ]);

  const contenuCsv = [
    enTetes.join(";"),
    ...lignes.map((l) => l.join(";")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + contenuCsv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.setAttribute("href", url);
  lien.setAttribute("download", nomFichier);
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}
