import type { Metadata } from "next";

import { montserrat } from "@/shared/config/fonts";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "EXCELIS PRÉPAS",
  description: "Plateforme de gestion centralisée du réseau EXCELIS PRÉPAS",
  icons: {
    icon: "/images/logo-excelis-emblem.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${montserrat.variable} font-sans antialiased`}>
      <body className="bg-slate-50 text-brand-anthracite min-h-screen font-sans selection:bg-brand-orange/20 selection:text-brand-anthracite">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
