"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import {
  Building2,
  Check,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Layers,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";

import {
  changerMonMotDePasseSchema,
  useChangerMonMotDePasse,
  useMonCompte,
  type ChangerMonMotDePasseFormValues,
} from "@/modules/utilisateurs";
import { useDepartement } from "@/modules/departement";
import { messageErreurApi } from "@/shared/lib/api-client";
import { Button, Card, Input, Skeleton, SkeletonCard } from "@/shared/ui";
import { ROLE_LABELS } from "@/types/roles";

type ProfilViewProps = {
  centreNom?: string;
};

function initiales(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function LigneInfo({
  icon: Icon,
  label,
  valeur,
}: {
  icon: typeof Mail;
  label: string;
  valeur?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p
          className={`truncate text-sm ${valeur ? "text-brand-anthracite font-semibold" : "text-slate-400 italic"}`}
        >
          {valeur || "Non renseigné"}
        </p>
      </div>
    </div>
  );
}

function ChampMotDePasse({
  label,
  error,
  autoComplete,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      label={label}
      error={error}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      endAdornment={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="cursor-pointer text-slate-400 hover:text-slate-600"
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
      {...props}
    />
  );
}

function ChangerMotDePasseCard() {
  const mutation = useChangerMonMotDePasse();
  const [succes, setSucces] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangerMonMotDePasseFormValues>({
    resolver: zodResolver(changerMonMotDePasseSchema),
    defaultValues: {
      motDePasseActuel: "",
      nouveauMotDePasse: "",
      confirmation: "",
    },
  });

  const onSubmit = (valeurs: ChangerMonMotDePasseFormValues) => {
    setSucces(false);
    mutation.mutate(
      {
        motDePasseActuel: valeurs.motDePasseActuel,
        nouveauMotDePasse: valeurs.nouveauMotDePasse,
      },
      {
        onSuccess: () => {
          reset();
          setSucces(true);
          // Le backend a révoqué toutes les sessions : on ferme aussi celle-ci et on
          // renvoie vers la connexion, après un court délai pour lire le message.
          setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
        },
      },
    );
  };

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="bg-brand-orange/10 text-brand-orange flex h-10 w-10 items-center justify-center rounded-xl">
          <KeyRound size={18} />
        </div>
        <div>
          <h2 className="text-brand-anthracite text-base font-bold">
            Mot de passe
          </h2>
          <p className="text-xs text-slate-500">
            Au moins 8 caractères. Le changement vous déconnecte de toutes vos
            sessions.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <ChampMotDePasse
          label="Mot de passe actuel"
          id="motDePasseActuel"
          autoComplete="current-password"
          error={errors.motDePasseActuel?.message}
          {...register("motDePasseActuel")}
        />
        <ChampMotDePasse
          label="Nouveau mot de passe"
          id="nouveauMotDePasse"
          autoComplete="new-password"
          error={errors.nouveauMotDePasse?.message}
          {...register("nouveauMotDePasse")}
        />
        <ChampMotDePasse
          label="Confirmer le nouveau mot de passe"
          id="confirmation"
          autoComplete="new-password"
          error={errors.confirmation?.message}
          {...register("confirmation")}
        />

        {mutation.isError && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {messageErreurApi(
              mutation.error,
              "Impossible de changer le mot de passe.",
            )}
          </p>
        )}
        {succes && (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <Check size={14} /> Mot de passe modifié. Vous allez être déconnecté
            pour vous reconnecter avec le nouveau mot de passe.
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending || succes}>
            {mutation.isPending
              ? "Enregistrement..."
              : "Changer le mot de passe"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function ProfilView({ centreNom }: ProfilViewProps) {
  const { data: compte, isLoading, isError, error } = useMonCompte();
  const { data: departement } = useDepartement(
    compte?.departementId ?? undefined,
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <SkeletonCard />
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !compte) {
    return (
      <Card className="p-6 text-sm text-rose-700">
        {messageErreurApi(error, "Impossible de charger votre profil.")}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-brand-anthracite text-xl font-bold">Mon profil</h1>
        <p className="text-sm text-slate-500">
          Vos informations de compte et la sécurité de votre accès.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Carte identité */}
        <Card className="flex flex-col items-center p-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2D2E80] text-2xl font-bold text-white shadow-xs">
            {initiales(compte.prenom, compte.nom)}
          </div>
          <h2 className="text-brand-anthracite mt-4 text-lg font-bold">
            {compte.prenom} {compte.nom}
          </h2>
          <p className="truncate text-sm text-slate-500">{compte.email}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#2D2E80]/20 bg-[#2D2E80]/5 px-3 py-1 text-xs font-semibold text-[#2D2E80]">
            <ShieldCheck size={13} />
            {ROLE_LABELS[compte.role]}
          </span>

          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut size={16} /> Se déconnecter
          </Button>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {/* Informations détaillées */}
          <Card className="p-6">
            <h2 className="text-brand-anthracite mb-2 text-base font-bold">
              Informations
            </h2>
            <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
              <LigneInfo icon={Mail} label="Email" valeur={compte.email} />
              <LigneInfo
                icon={Phone}
                label="Téléphone"
                valeur={compte.telephone}
              />
              <LigneInfo
                icon={IdCard}
                label="N° CNI"
                valeur={compte.numeroCni}
              />
              <LigneInfo
                icon={ShieldCheck}
                label="Rôle"
                valeur={ROLE_LABELS[compte.role]}
              />
              {compte.centreId && (
                <LigneInfo
                  icon={Building2}
                  label="Centre de rattachement"
                  valeur={centreNom}
                />
              )}
              {compte.departementId && (
                <LigneInfo
                  icon={Layers}
                  label="Département"
                  valeur={departement?.nom}
                />
              )}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Pour corriger ces informations, adressez-vous à
              l&apos;administration.
            </p>
          </Card>

          <ChangerMotDePasseCard />
        </div>
      </div>
    </div>
  );
}
