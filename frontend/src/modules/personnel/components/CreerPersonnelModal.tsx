"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UserPlus, Key, AlertCircle, RefreshCw, Check } from "lucide-react";

import { Modal } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import {
  useCreerPersonnel,
  useCreerComptePourPersonnel,
} from "../data/queries";
import { ROLE_LABELS, rolesAttribuablesPar, type Role } from "@/types/roles";

type CentreOption = {
  id: string;
  nom: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  centres: CentreOption[];
};

function genererMotDePasseSecurise(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export function CreerPersonnelModal({ isOpen, onClose, centres }: Props) {
  const creerPersonnelMutation = useCreerPersonnel();
  const creerCompteMutation = useCreerComptePourPersonnel();

  // Données RH
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [numeroCni, setNumeroCni] = useState("");
  const [email, setEmail] = useState("");

  // Option Compte
  const [creerCompte, setCreerCompte] = useState(false);
  const [roleChoisi, setRole] = useState<Role>("COMPTABLE");
  // Seuls les rôles que l'utilisateur connecté a le droit d'attribuer sont proposés.
  const { data: authSession } = useSession();
  const rolesAttribuables = rolesAttribuablesPar(authSession?.user?.role);
  const role: Role = rolesAttribuables.includes(roleChoisi)
    ? roleChoisi
    : (rolesAttribuables[0] ?? roleChoisi);
  const [centreId, setCentreId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [copiePassword, setCopiePassword] = useState(false);

  const [erreur, setErreur] = useState<string | null>(null);
  const isPending =
    creerPersonnelMutation.isPending || creerCompteMutation.isPending;

  const handleGenererPassword = () => {
    const pwd = genererMotDePasseSecurise();
    setPassword(pwd);
  };

  const handleCopierPassword = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopiePassword(true);
    setTimeout(() => setCopiePassword(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);

    if (!nom.trim() || !prenom.trim()) {
      setErreur("Le nom et le prénom sont obligatoires.");
      return;
    }

    if (creerCompte && !email.trim()) {
      setErreur(
        "Une adresse email valide est obligatoire pour créer un compte utilisateur.",
      );
      return;
    }

    if (creerCompte && !password.trim()) {
      setErreur("Veuillez renseigner ou générer un mot de passe initial.");
      return;
    }

    try {
      const nouveauPersonnel = await creerPersonnelMutation.mutateAsync({
        nom: nom.trim(),
        prenom: prenom.trim(),
        telephone: telephone.trim() || null,
        numeroCni: numeroCni.trim() || null,
        email: email.trim() || null,
      });

      if (creerCompte && nouveauPersonnel?.id) {
        await creerCompteMutation.mutateAsync({
          id: nouveauPersonnel.id,
          input: {
            password: password.trim(),
            role,
            centreId: centreId || null,
          },
        });
      }

      onClose();
    } catch (err) {
      setErreur(messageErreurApi(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un Collaborateur"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-1">
        {erreur && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{erreur}</span>
          </div>
        )}

        {/* ── Section Identité RH ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 text-xs font-bold tracking-wider text-slate-700 uppercase">
            <UserPlus className="h-4 w-4 text-blue-600" />
            <span>Identité & Coordonnées RH</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Nom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Mbarga"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Prénom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Jean-Paul"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Téléphone
              </label>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: +237 699 00 00 00"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Numéro CNI
              </label>
              <input
                type="text"
                value={numeroCni}
                onChange={(e) => setNumeroCni(e.target.value)}
                placeholder="Ex: 1122334455"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Email {creerCompte && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: collaborateur@excelis.cm"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* ── Section Option Compte Utilisateur ── */}
        <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={creerCompte}
              onChange={(e) => {
                setCreerCompte(e.target.checked);
                if (e.target.checked && !password) {
                  handleGenererPassword();
                }
              }}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-bold text-slate-800">
              Créer également un compte d'accès applicatif (Login / Rôle)
            </span>
          </label>

          {creerCompte && (
            <div className="space-y-3 border-t border-blue-200/60 pt-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Rôle Applicatif <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {rolesAttribuables.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Centre de rattachement
                  </label>
                  <select
                    value={centreId}
                    onChange={(e) => setCentreId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">National / Tous centres</option>
                    {centres.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Mot de passe temporaire initial{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required={creerCompte}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenererPassword}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Générer</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopierPassword}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {copiePassword ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copié</span>
                      </>
                    ) : (
                      <span>Copier</span>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Pensez à communiquer ce mot de passe au collaborateur pour sa
                  première connexion.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Boutons d'action ── */}
        <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="min-w-[130px] rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Création en cours..." : "Créer le collaborateur"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
