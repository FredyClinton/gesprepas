"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { Button, Input, Logo } from "@/shared/ui";
import { loginSchema, type LoginFormValues } from "@/modules/utilisateurs";

function LoginForm() {
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

  // Déjà connecté : redirection vers le tableau de bord
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
      setError("root", {
        message:
          resultat.error === "CredentialsSignin"
            ? "Email ou mot de passe incorrect."
            : "Connexion impossible pour le moment. Réessayez plus tard.",
      });
      return;
    }

    router.replace(searchParams.get("callbackUrl") ?? "/");
  });

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-radial from-slate-50 via-slate-100/60 to-slate-200/50 p-4 sm:p-8">
      {/* Halo subtil aux couleurs officielles de la marque */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-orange/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/4 w-80 h-80 rounded-full bg-[#2D2E80]/5 blur-3xl" />
      </div>

      {/* Conteneur principal */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* En-tête avec le LOGO OFFICIEL EXCELIS PRÉPAS */}
        <div className="mb-8 text-center flex flex-col items-center">
          <Logo className="h-14 w-auto object-contain transition-transform hover:scale-102" priority />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Plateforme de gestion centralisée
          </p>
        </div>

        {/* Carte de connexion */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-slate-200/50 transition-all">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2D2E80]/10 text-[#2D2E80]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-brand-anthracite">
              Espace sécurisé
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Saisissez vos identifiants pour accéder à votre espace
            </p>
          </div>

          <hr className="mb-6 border-slate-100" />

          <form
            method="post"
            action="/login"
            onSubmit={onSubmit}
            className="space-y-6"
            noValidate
          >
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
              <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-semibold text-rose-700 shadow-2xs animate-in fade-in duration-150">
                {errors.root.message}
              </div>
            )}

            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-xl bg-brand-orange text-sm font-bold text-white shadow-md shadow-brand-orange/20 transition-all hover:bg-[#e07f12] active:scale-[0.99]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connexion en cours..." : "Se connecter"}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
