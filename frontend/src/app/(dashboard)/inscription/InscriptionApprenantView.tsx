"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ChevronDown, ChevronUp, Search, UserPlus } from "lucide-react";

import { Button, Card, Input } from "@/shared/ui";
import { ApiError } from "@/shared/lib/api-client";
import {
    useCreerApprenant,
    apprenantSchema,
    type ApprenantFormValues,
} from "@/modules/apprenants";
import { useFormations } from "@/modules/academique";
import { useSessionActive } from "@/modules/centres-sessions";

export function InscriptionApprenantView({ centreId }: { centreId: string }) {
    const router = useRouter();
    const { data: sessionActive } = useSessionActive();
    const { data: formations } = useFormations();
    const formationsDuCentre = formations?.filter((f) => f.centreId === centreId);

    const creerApprenant = useCreerApprenant();

    const {
        register,
        handleSubmit,
        control,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<ApprenantFormValues>({
        resolver: zodResolver(apprenantSchema),
        defaultValues: { preInscrit: false },
    });

    const estPreInscrit = useWatch({ control, name: "preInscrit" });
    const [rechercheRecu, setRechercheRecu] = useState("");
    const [selecteurRecuOuvert, setSelecteurRecuOuvert] = useState(false);
    const [sectionOptionnelleOuverte, setSectionOptionnelleOuverte] = useState(true);

    const onSubmit = handleSubmit(async (values) => {
        if (!sessionActive) return;
        try {
            // etablissementOrigine / preInscrit / referenceRecu / contactApprenant /
            // nomParent / contactParent ne sont PAS envoyés : aucun champ correspondant
            // n'existe encore sur Apprenant côté backend (voir
            // modules/apprenants/domain/schemas.ts).
            await creerApprenant.mutateAsync({
                nom: values.nom,
                prenom: values.prenom,
                dateNaissance: values.dateNaissance,
                // Pas de champ visible pour la date d'inscription (absente de la
                // maquette) — on envoie la date du jour, hypothèse à confirmer si
                // ça ne convient pas.
                dateInscription: new Date().toISOString().slice(0, 10),
                montantContrat: values.montantContrat,
                // Date de définition du contrat : plus de champ dans le formulaire,
                // on envoie systématiquement la date du jour.
                dateDefinitionContrat: new Date().toISOString().slice(0, 10),
                centreId,
                sessionId: sessionActive.id,
                formationId: values.formationId,
            });
            router.push("/apprenants");
        } catch (erreur) {
            setError("root", {
                message:
                    erreur instanceof ApiError
                        ? ((erreur.body as { message?: string })?.message ??
                            "Inscription impossible.")
                        : "Inscription impossible pour le moment. Réessayez.",
            });
        }
    });

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center gap-2">
                <div className="bg-brand-orange/10 text-brand-orange rounded p-1.5">
                    <UserPlus size={18} />
                </div>
                <div>
                    <h1 className="text-brand-anthracite text-2xl font-bold">
                        Inscription Apprenant
                    </h1>
                    <p className="text-brand-gray text-sm">
                        Informations d&rsquo;identité et de contrat.
                    </p>
                </div>
            </div>

            {!sessionActive && (
                <Card className="p-4">
                    <p className="text-brand-gray text-sm">
                        Aucune session en cours — impossible d&rsquo;inscrire un apprenant
                        tant qu&rsquo;une session n&rsquo;est pas active.
                    </p>
                </Card>
            )}

            {sessionActive && (
                <Card className="p-6">
                    <form onSubmit={onSubmit} className="space-y-6" noValidate>
                        <section className="space-y-4">
                            <h2 className="text-brand-anthracite border-brand-gray/20 border-b pb-2 text-sm font-bold tracking-wide uppercase">
                                Informations personnelles{" "}
                                <span className="text-brand-gray font-normal normal-case">
                                    (Obligatoire)
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                    label="Nom"
                                    placeholder="Nom de famille"
                                    error={errors.nom?.message}
                                    {...register("nom")}
                                />
                                <Input
                                    label="Prénom"
                                    placeholder="Prénoms"
                                    error={errors.prenom?.message}
                                    {...register("prenom")}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Input
                                    label="Date de naissance"
                                    type="date"
                                    error={errors.dateNaissance?.message}
                                    {...register("dateNaissance")}
                                />
                                <Input
                                    label="Contact de l'apprenant"
                                    type="tel"
                                    placeholder="Numéro de téléphone"
                                    error={errors.contactApprenant?.message}
                                    {...register("contactApprenant")}
                                />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-brand-anthracite border-brand-gray/20 border-b pb-2 text-sm font-bold tracking-wide uppercase">
                                Détails de l&rsquo;inscription{" "}
                                <span className="text-brand-gray font-normal normal-case">
                                    (Obligatoire)
                                </span>
                            </h2>
                            <div>
                                <label className="text-brand-anthracite mb-1 block text-xs font-bold tracking-wide uppercase">
                                    Formation visée
                                </label>
                                <select
                                    {...register("formationId")}
                                    defaultValue=""
                                    className="border-brand-gray/30 focus:border-brand-orange focus:ring-brand-orange/30 w-full rounded-md border bg-white px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none"
                                >
                                    <option value="" disabled>
                                        Sélectionner une formation...
                                    </option>
                                    {formationsDuCentre?.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.nom}
                                        </option>
                                    ))}
                                </select>
                                {errors.formationId && (
                                    <p className="mt-1 text-xs font-bold text-red-600">
                                        {errors.formationId.message}
                                    </p>
                                )}
                                {formationsDuCentre?.length === 0 && (
                                    <p className="text-brand-gray mt-1 text-xs">
                                        Aucune formation pour votre centre pour l&rsquo;instant.
                                    </p>
                                )}
                            </div>
                            <Input
                                label="Montant du contrat"
                                type="number"
                                step="0.01"
                                placeholder="Montant en FCFA"
                                error={errors.montantContrat?.message}
                                {...register("montantContrat", { valueAsNumber: true })}
                            />
                        </section>

                        <section className="space-y-4">
                            <button
                                type="button"
                                onClick={() => setSectionOptionnelleOuverte((o) => !o)}
                                className="border-brand-gray/20 text-brand-anthracite flex w-full items-center justify-between border-b pb-2 text-sm font-bold tracking-wide uppercase"
                            >
                                <span>
                                    Informations supplémentaires{" "}
                                    <span className="text-brand-gray font-normal normal-case">
                                        (Optionnel)
                                    </span>
                                </span>
                                {sectionOptionnelleOuverte ? (
                                    <ChevronUp size={16} className="text-brand-gray" />
                                ) : (
                                    <ChevronDown size={16} className="text-brand-gray" />
                                )}
                            </button>

                            {sectionOptionnelleOuverte && (
                                <div className="space-y-4">
                                    <Input
                                        label="Établissement d'origine"
                                        placeholder="Nom de l'établissement précédent"
                                        {...register("etablissementOrigine")}
                                    />

                                    <div className="space-y-3 pt-1">
                                        <p className="text-brand-anthracite text-xs font-bold tracking-wide uppercase">
                                            Contact du parent ou tuteur
                                        </p>
                                        <Input
                                            label="Nom du parent"
                                            placeholder="Nom complet"
                                            {...register("nomParent")}
                                        />
                                        <Input
                                            label="Contact du parent"
                                            type="tel"
                                            placeholder="Numéro de téléphone"
                                            {...register("contactParent")}
                                        />
                                    </div>

                                    <div>
                                        <p className="text-brand-anthracite mb-1.5 text-xs font-bold tracking-wide uppercase">
                                            Pré-inscrit ?
                                        </p>
                                        <div className="flex gap-2">
                                            {(["Oui", "Non"] as const).map((option) => {
                                                const valeur = option === "Oui";
                                                const choisi = estPreInscrit === valeur;
                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() =>
                                                            setValue("preInscrit", valeur)
                                                        }
                                                        className={`rounded-md border px-4 py-1.5 text-sm font-bold transition-colors ${choisi
                                                                ? "bg-brand-orange border-brand-orange text-white"
                                                                : "border-brand-gray/30 text-brand-anthracite hover:border-brand-orange"
                                                            }`}
                                                    >
                                                        {option}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {estPreInscrit && (
                                            <div className="mt-3">
                                                <label className="text-brand-anthracite mb-1 block text-xs font-bold tracking-wide uppercase">
                                                    Référence du reçu
                                                </label>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelecteurRecuOuvert((o) => !o)
                                                        }
                                                        className="border-brand-gray/30 text-brand-gray flex w-full items-center gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm"
                                                    >
                                                        <Search size={14} />
                                                        Rechercher un reçu...
                                                    </button>
                                                    {selecteurRecuOuvert && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                aria-label="Fermer"
                                                                className="fixed inset-0 z-10 cursor-default"
                                                                onClick={() =>
                                                                    setSelecteurRecuOuvert(false)
                                                                }
                                                            />
                                                            <div className="border-brand-gray/20 absolute left-0 z-20 mt-1 w-full rounded-md border bg-white p-2 shadow-lg">
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    value={rechercheRecu}
                                                                    onChange={(e) =>
                                                                        setRechercheRecu(
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    placeholder="N° de reçu..."
                                                                    className="border-brand-gray/20 mb-2 w-full rounded border px-2 py-1.5 text-sm outline-none"
                                                                />
                                                                <p className="text-brand-gray p-2 text-xs">
                                                                    Fonctionnalité à venir — la
                                                                    liste des reçus n&rsquo;est
                                                                    pas encore disponible côté
                                                                    serveur.
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-brand-gray text-xs">
                                        Établissement d&rsquo;origine, informations du parent et
                                        pré-inscription : pas encore enregistrés côté serveur —
                                        capturés ici en prévision d&rsquo;une future mise à jour
                                        du backend.
                                    </p>
                                </div>
                            )}
                        </section>

                        <div className="border-brand-gray/20 flex items-center gap-3 border-t pt-4">
                            <button
                                type="button"
                                onClick={() => router.push("/apprenants")}
                                className="text-brand-gray text-sm font-bold"
                            >
                                Annuler
                            </button>
                            <div className="flex-1" />
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Inscription..." : "Inscrire l'apprenant"}
                            </Button>
                        </div>

                        {errors.root && (
                            <p className="text-sm font-bold text-red-600">
                                {errors.root.message}
                            </p>
                        )}
                    </form>
                </Card>
            )}
        </div>
    );
}