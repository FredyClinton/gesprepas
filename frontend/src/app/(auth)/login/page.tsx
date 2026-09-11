"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { Button, Input } from "@/shared/ui";
import { loginSchema, type LoginFormValues } from "@/modules/utilisateurs";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Déjà connecté (ex: revenu manuellement sur /login) : pas la peine d'y rester -
  // le proxy (étape 5) exclut volontairement /login de sa protection, donc cette
  // page reste accessible même avec une session active.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  const onSubmit = handleSubmit(async (values) => {
    const resultat = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (resultat?.error) {
      // "CredentialsSignin" est le code SPÉCIFIQUE renvoyé quand authorize() (auth.ts)
      // retourne `null` - c.-à-d. email inconnu ou mot de passe incorrect (volontairement
      // indifférenciés, par sécurité). Tout autre code (backend injoignable, erreur 500...)
      // mérite un message différent : dire "mot de passe incorrect" alors que le vrai
      // problème est un serveur injoignable serait trompeur.
      setError("root", {
        message:
          resultat.error === "CredentialsSignin"
            ? "Email ou mot de passe incorrect."
            : "Connexion impossible pour le moment. Réessayez plus tard.",
      });
      return;
    }

    // callbackUrl posé par le proxy si on venait d'une page protégée (étape 5) ;
    // sinon on atterrit simplement sur le tableau de bord.
    router.replace(searchParams.get("callbackUrl") ?? "/");
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f6f8] p-4 sm:p-8">
      {/* En-tête avec le nom de la marque épuré */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-anthracite">
          EXCELIS <span className="text-brand-orange">PRÉPAS</span>
        </h1>
        <p className="mt-2 text-sm text-brand-gray/80">
          Plateforme de gestion centralisée
        </p>
      </div>

      {/* Conteneur principal du formulaire */}
      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
          <div className="mb-6 text-center">
            {/* Icône de sécurité/connexion pour habiller la carte */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-brand-orange">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-brand-anthracite">
              Espace sécurisé
            </h2>
            <p className="mt-1.5 text-sm text-brand-gray">
              Saisissez vos identifiants pour continuer
            </p>
          </div>

          <hr className="mb-6 border-gray-100" />

          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <Input
              label="Adresse e-mail"
              type="email"
              autoComplete="username"
              placeholder="jean.dupont@excelis-prepas.com"
              error={errors.email?.message}
              className="py-2.5 text-base"
              {...register("email")}
            />
            <Input
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              className="py-2.5 text-base"
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((valeur) => !valeur)}
                  className="text-brand-gray/60 hover:text-brand-anthracite focus:outline-none transition-colors"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
              {...register("password")}
            />

            {errors.root && (
              <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-600/20">
                {errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-medium shadow-sm transition-transform active:scale-[0.99] mt-2 bg-brand-orange hover:bg-brand-orange/90 text-white" disabled={isSubmitting}>
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-brand-gray/50">
            © {new Date().getFullYear()} EXCELIS PRÉPAS. Tous droits réservés.
          </p>
        </div>
      </div>
    </main>
  );
}
