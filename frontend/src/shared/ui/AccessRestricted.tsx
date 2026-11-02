import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";

interface AccessRestrictedProps {
  title?: string;
  message: string;
  redirectHref?: string;
  redirectLabel?: string;
}

/**
 * Composant officiel d'état d'accès restreint EXCELIS PRÉPAS
 * Harmonise la gestion des autorisations insuffisantes avec la charte visuelle.
 */
export function AccessRestricted({
  title = "Accès restreint",
  message,
  redirectHref = "/",
  redirectLabel = "Retour au tableau de bord",
}: AccessRestrictedProps) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-md border-slate-200/90 bg-white p-6 sm:p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
          <ShieldAlert size={28} />
        </div>

        <h1 className="mb-2 text-lg sm:text-xl font-bold text-brand-anthracite">
          {title}
        </h1>

        <p className="mb-6 text-xs sm:text-sm text-brand-gray leading-relaxed">
          {message}
        </p>

        <Link href={redirectHref} className="inline-block">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={15} />
            <span>{redirectLabel}</span>
          </Button>
        </Link>
      </Card>
    </main>
  );
}
