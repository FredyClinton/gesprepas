"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { Button, Card, Input } from "@/shared/ui";
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

  // Déjà connecté (ex: revenu manuellement sur /login) : pas la peine d'y rester —
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
      // retourne `null` — c.-à-d. email inconnu ou mot de passe incorrect (volontairement
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
    <main className="bg-brand-anthracite flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-brand-anthracite text-2xl font-bold">
            Gesprepas
          </h1>
          <p className="text-brand-gray mt-1 text-sm">Connectez-vous</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input
            label="Email "
            type="email"
            autoComplete="username"
            placeholder="nom@excelis-prepas.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Mot de passe"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((valeur) => !valeur)}
                className="text-brand-gray hover:text-brand-anthracite"
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            {...register("password")}
          />

          {errors.root && (
            <p className="text-sm font-bold text-red-600">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <p className="text-brand-gray/70 mt-8 text-center text-xs">
          © {new Date().getFullYear()} EXCELIS PRÉPAS. Tous droits réservés.
        </p>
      </Card>
    </main>
  );
}
