/**
 * Calcul du compte à rebours et des indicateurs temporels pour les échéances
 * de concours (date limite de dépôt, recevabilité centre).
 */

export interface CompteARebours {
  texte: string;
  court: string;
  badge: string;
  dot: string;
  jours: number;
  estPasse: boolean;
  estAujourdhui: boolean;
  estUrgent: boolean;
}

export function calculerCompteARebours(dateStr: string): CompteARebours {
  const cible = new Date(dateStr);
  const now = new Date();

  // Comparer en jours calendaires stricts
  const cibleMinuit = new Date(cible.getFullYear(), cible.getMonth(), cible.getDate()).getTime();
  const nowMinuit = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffJours = Math.round((cibleMinuit - nowMinuit) / (1000 * 60 * 60 * 24));

  if (diffJours < 0) {
    const abs = Math.abs(diffJours);
    return {
      texte: abs === 1 ? "Clôturé hier" : `Clôturé (-${abs}j)`,
      court: "Clôturé",
      badge: "text-slate-400 bg-slate-100/80",
      dot: "bg-slate-400",
      jours: diffJours,
      estPasse: true,
      estAujourdhui: false,
      estUrgent: false,
    };
  }
  if (diffJours === 0) {
    return {
      texte: "Aujourd'hui (Dernier jour)",
      court: "Dernier jour",
      badge: "text-rose-700 bg-rose-50 border border-rose-200/60 font-bold",
      dot: "bg-rose-500 animate-pulse",
      jours: 0,
      estPasse: false,
      estAujourdhui: true,
      estUrgent: true,
    };
  }
  if (diffJours === 1) {
    return {
      texte: "Demain",
      court: "Demain",
      badge: "text-amber-700 bg-amber-500/10 font-semibold",
      dot: "bg-amber-500",
      jours: 1,
      estPasse: false,
      estAujourdhui: false,
      estUrgent: true,
    };
  }
  if (diffJours <= 7) {
    return {
      texte: `Dans ${diffJours} jours`,
      court: `${diffJours}j restants`,
      badge: "text-amber-800 bg-amber-500/10 font-semibold",
      dot: "bg-amber-500",
      jours: diffJours,
      estPasse: false,
      estAujourdhui: false,
      estUrgent: true,
    };
  }
  return {
    texte: `Dans ${diffJours} jours`,
    court: `Dans ${diffJours}j`,
    badge: "text-slate-600 bg-slate-100/80 font-normal",
    dot: "bg-slate-400",
    jours: diffJours,
    estPasse: false,
    estAujourdhui: false,
    estUrgent: false,
  };
}
