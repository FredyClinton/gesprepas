export interface LogoProps {
  variant?: "default" | "white";
  className?: string;
  priority?: boolean;
}

// Logo officiel complet EXCELIS PRÉPAS
// Réutilise l'asset officiel extrait de la charte graphique avec rendu vectoriel net.
// Utilise <img> natif pour garantir un affichage immédiat et une impression parfaite (window.print).
export function Logo({
  variant = "default",
  className = "h-10 w-auto object-contain",
  priority = false,
}: LogoProps) {
  const src = variant === "white" ? "/images/logo-excelis-white.png" : "/images/logo-excelis.png";
  return (
    <img
      src={src}
      alt="EXCELIS PRÉPAS"
      className={className}
      loading={priority ? "eager" : "lazy"}
    />
  );
}

// Emblème officiel EXCELIS PRÉPAS (X géométrique bicolore / blanc)
export function LogoEmblem({
  variant = "default",
  className = "h-8 w-auto object-contain",
  priority = false,
}: LogoProps) {
  const src = variant === "white" ? "/images/logo-excelis-emblem-white.png" : "/images/logo-excelis-emblem.png";
  return (
    <img
      src={src}
      alt="EXCELIS PRÉPAS"
      className={className}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
