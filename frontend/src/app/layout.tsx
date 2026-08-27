import type { Metadata } from "next";

import { montserrat } from "@/shared/config/fonts";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "EXCELIS PRÉPAS",
  description: "Gestion des centres, apprenants et dossiers d'EXCELIS PRÉPAS",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${montserrat.variable} antialiased`}>
      <body className="bg-brand-white text-brand-black min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
