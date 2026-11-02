import { Montserrat } from "next/font/google";

// Police officielle de la charte EXCELIS PRÉPAS : Montserrat
// Titres : Montserrat Bold (700 / 800)
// Textes courants : Montserrat Regular (400 / 500 / 600)
export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});


