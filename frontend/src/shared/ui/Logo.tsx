import Image from "next/image";
import logoDefault from "@/assets/images/logo-excelis.png";
import logoWhite from "@/assets/images/logo-excelis-white.png";
import emblemDefault from "@/assets/images/logo-excelis-emblem.png";
import emblemWhite from "@/assets/images/logo-excelis-emblem-white.png";

export interface LogoProps {
  variant?: "default" | "white";
  className?: string;
  priority?: boolean;
}

// Logo officiel complet EXCELIS PRÉPAS
// Réutilise l'asset officiel extrait de la charte graphique avec rendu vectoriel net.
export function Logo({
  variant = "default",
  className = "h-10 w-auto object-contain",
  priority = false,
}: LogoProps) {
  const src = variant === "white" ? logoWhite : logoDefault;
  return (
    <Image
      src={src}
      alt="EXCELIS PRÉPAS"
      className={className}
      priority={priority}
    />
  );
}

// Emblème officiel EXCELIS PRÉPAS (X géométrique bicolore / blanc)
export function LogoEmblem({
  variant = "default",
  className = "h-8 w-auto object-contain",
  priority = false,
}: LogoProps) {
  const src = variant === "white" ? emblemWhite : emblemDefault;
  return (
    <Image
      src={src}
      alt="EXCELIS PRÉPAS"
      className={className}
      priority={priority}
    />
  );
}
