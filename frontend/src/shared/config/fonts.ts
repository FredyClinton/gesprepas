import { Montserrat } from "next/font/google";

// Police de l'interface EXCELIS PRÉPAS : Montserrat, uniquement en graisses
// Regular (400) et Bold (700). La police du logo (Lemon Milk) ne doit jamais être
// chargée ici — elle reste réservée au logo lui-même, hors interface.
export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-montserrat",
  display: "swap",
});
