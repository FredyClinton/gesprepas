"use client";

import { useState } from "react";
import { UserPlus, Key, AlertCircle, RefreshCw, Check } from "lucide-react";

import { Modal } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import {
  useCreerPersonnel,
  useCreerComptePourPersonnel,
} from "../data/queries";
import { ROLE_LABELS, type Role } from "@/types/roles";

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
  const [role, setRole] = useState<Role>("COMPTABLE");
  const [centreId, setCentreId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [copiePassword, setCopiePassword] = useState(false);

  const [erreur, setErreur] = useState<string | null>(null);
  const isPending = creerPersonnelMutation.isPending || creerCompteMutation.isPending;

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
      setErreur("Une adresse email valide est obligatoire pour créer un compte utilisateur.");
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
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un Collaborateur" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5 pt-1">
        {erreur && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{erreur}</span>
          </div>
        )}

        {/* ── Section Identité RH ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Identité & Coordonnées RH</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Mbarga"
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prénom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Jean-Paul"
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: +237 699 00 00 00"
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Numéro CNI</label>
              <input
                type="text"
                value={numeroCni}
                onChange={(e) => setNumeroCni(e.target.value)}
                placeholder="Ex: 1122334455"
                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email {creerCompte && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: collaborateur@excelis.cm"
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* ── Section Option Compte Utilisateur ── */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={creerCompte}
              onChange={(e) => {
                setCreerCompte(e.target.checked);
                if (e.target.checked && !password) {
                  handleGenererPassword();
                }
              }}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs font-bold text-slate-800">
              Créer également un compte d'accès applicatif (Login / Rôle)
            </span>
          </label>

          {creerCompte && (
            <div className="pt-2 border-t border-blue-200/60 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rôle Applicatif <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(ROLE_LABELS).map(([r, label]) => (
                      <option key={r} value={r}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Centre de rattachement
                  </label>
                  <select
                    value={centreId}
                    onChange={(e) => setCentreId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mot de passe temporaire initial <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required={creerCompte}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 text-xs rounded-xl border border-slate-200 px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleGenererPassword}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Générer</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopierPassword}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    {copiePassword ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copié</span>
                      </>
                    ) : (
                      <span>Copier</span>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pensez à communiquer ce mot de passe au collaborateur pour sa première connexion.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Boutons d'action ── */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-2xs disabled:opacity-50 min-w-[130px]"
          >
            {isPending ? "Création en cours..." : "Créer le collaborateur"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
