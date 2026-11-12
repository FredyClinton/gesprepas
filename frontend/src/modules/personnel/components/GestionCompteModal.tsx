"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Key,
  Shield,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  Check,
  Lock,
  Trash2,
} from "lucide-react";

import { Modal } from "@/shared/ui";
import { messageErreurApi } from "@/shared/lib/api-client";
import { useCreerComptePourPersonnel } from "../data/queries";
import {
  useModifierUtilisateur,
  useChangerMotDePasseAdmin,
  useRevoquerCompteUtilisateur,
} from "@/modules/utilisateurs";
import { ROLE_LABELS, rolesAttribuablesPar, type Role } from "@/types/roles";

type CentreOption = {
  id: string;
  nom: string;
};

type PersonnelCible = {
  id: string;
  nom: string;
  prenom: string;
  email?: string | null;
  hasUserAccount: boolean;
  rolePrincipal?: Role | "MEMBRE";
  centreId?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  personnel: PersonnelCible | null;
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

export function GestionCompteModal({
  isOpen,
  onClose,
  personnel,
  centres,
}: Props) {
  const creerCompteMutation = useCreerComptePourPersonnel();
  const modifierUtilisateurMutation = useModifierUtilisateur();
  const changerMotDePasseMutation = useChangerMotDePasseAdmin();
  const revoquerCompteMutation = useRevoquerCompteUtilisateur();

  // État formulaire attribution (cas sans compte)
  const [roleAttributionChoisi, setRoleAttribution] =
    useState<Role>("COMPTABLE");
  // Seuls les rôles que l'utilisateur connecté a le droit d'attribuer sont proposés.
  const { data: authSession } = useSession();
  const rolesAttribuables = rolesAttribuablesPar(authSession?.user?.role);
  const roleAttribution: Role = rolesAttribuables.includes(
    roleAttributionChoisi,
  )
    ? roleAttributionChoisi
    : (rolesAttribuables[0] ?? roleAttributionChoisi);
  const [centreAttribution, setCentreAttribution] = useState<string>("");
  const [passwordAttribution, setPasswordAttribution] = useState("");

  // État formulaire modification (cas avec compte)
  const [roleModif, setRoleModif] = useState<Role>("COMPTABLE");
  const [centreModif, setCentreModif] = useState<string>("");

  // État réinitialisation mot de passe
  const [nouveauPassword, setNouveauPassword] = useState("");
  const [succesMdp, setSuccesMdp] = useState(false);

  // État confirmation révocation
  const [confirmerRevocation, setConfirmerRevocation] = useState(false);

  const [copiePassword, setCopiePassword] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (personnel) {
      setErreur(null);
      setSuccesMdp(false);
      setConfirmerRevocation(false);
      setPasswordAttribution("");
      setNouveauPassword("");

      if (
        personnel.hasUserAccount &&
        personnel.rolePrincipal &&
        personnel.rolePrincipal !== "MEMBRE"
      ) {
        setRoleModif(personnel.rolePrincipal);
        setCentreModif(personnel.centreId || "");
      } else {
        setRoleAttribution("COMPTABLE");
        setCentreAttribution(personnel.centreId || "");
      }
    }
  }, [personnel]);

  const handleCopier = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiePassword(true);
    setTimeout(() => setCopiePassword(false), 2000);
  };

  // 1. Création compte
  const handleCreerCompte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnel) return;
    setErreur(null);

    if (!personnel.email) {
      setErreur(
        "Ce collaborateur ne possède pas d'email. Veuillez d'abord modifier sa fiche RH pour lui renseigner une adresse email valide.",
      );
      return;
    }

    if (!passwordAttribution.trim()) {
      setErreur("Veuillez renseigner un mot de passe initial.");
      return;
    }

    try {
      await creerCompteMutation.mutateAsync({
        id: personnel.id,
        input: {
          password: passwordAttribution.trim(),
          role: roleAttribution,
          centreId: centreAttribution || null,
        },
      });
      onClose();
    } catch (err) {
      setErreur(messageErreurApi(err));
    }
  };

  // 2. Modification Rôle & Centre
  const handleModifierCompte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnel) return;
    setErreur(null);

    try {
      await modifierUtilisateurMutation.mutateAsync({
        id: personnel.id,
        input: {
          role: roleModif,
          centreId: centreModif || null,
        },
      });
      onClose();
    } catch (err) {
      setErreur(messageErreurApi(err));
    }
  };

  // 3. Réinitialisation mot de passe
  const handleChangerMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnel) return;
    setErreur(null);
    setSuccesMdp(false);

    if (!nouveauPassword.trim()) {
      setErreur("Veuillez renseigner un nouveau mot de passe.");
      return;
    }

    try {
      await changerMotDePasseMutation.mutateAsync({
        id: personnel.id,
        password: nouveauPassword.trim(),
      });
      setSuccesMdp(true);
      setTimeout(() => setSuccesMdp(false), 4000);
    } catch (err) {
      setErreur(messageErreurApi(err));
    }
  };

  // 4. Révocation compte
  const handleRevoquerCompte = async () => {
    if (!personnel) return;
    setErreur(null);

    try {
      await revoquerCompteMutation.mutateAsync(personnel.id);
      onClose();
    } catch (err) {
      setErreur(messageErreurApi(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        personnel?.hasUserAccount
          ? `Gestion du Compte • ${personnel.prenom} ${personnel.nom}`
          : `Créer un Compte • ${personnel?.prenom} ${personnel?.nom}`
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 pt-1">
        {erreur && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{erreur}</span>
          </div>
        )}

        {/* ── CAS 1 : Collaborateur SANS compte ── */}
        {!personnel?.hasUserAccount ? (
          <form onSubmit={handleCreerCompte} className="space-y-4">
            <div className="space-y-1 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900">
              <p className="flex items-center gap-1.5 font-semibold text-blue-800">
                <Key className="h-4 w-4" />
                <span>Attribution d'identifiants de connexion</span>
              </p>
              <p className="opacity-90">
                Ce collaborateur est répertorié dans le personnel administratif
                mais ne dispose pas encore de compte utilisateur.
              </p>
              <p className="text-[11px] text-blue-700">
                Identifiant de connexion (login) :{" "}
                <strong>{personnel?.email || "Non renseigné (requis)"}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Rôle Applicatif <span className="text-rose-500">*</span>
                </label>
                <select
                  value={roleAttribution}
                  onChange={(e) => setRoleAttribution(e.target.value as Role)}
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
                  value={centreAttribution}
                  onChange={(e) => setCentreAttribution(e.target.value)}
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
                  required
                  value={passwordAttribution}
                  onChange={(e) => setPasswordAttribution(e.target.value)}
                  placeholder="Mot de passe temporaire..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPasswordAttribution(genererMotDePasseSecurise())
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Générer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopier(passwordAttribution)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {copiePassword ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <span>Copier</span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creerCompteMutation.isPending}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50"
              >
                {creerCompteMutation.isPending
                  ? "Création..."
                  : "Créer les identifiants d'accès"}
              </button>
            </div>
          </form>
        ) : (
          /* ── CAS 2 : Collaborateur AVEC compte existant ── */
          <div className="space-y-6">
            {/* Section A : Modification Rôle & Centre */}
            <form
              onSubmit={handleModifierCompte}
              className="space-y-3 border-b border-slate-200/80 pb-5"
            >
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Rôle Applicatif & Centre</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Rôle
                  </label>
                  <select
                    value={roleModif}
                    onChange={(e) => setRoleModif(e.target.value as Role)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {Object.entries(ROLE_LABELS).map(([r, label]) => (
                      <option key={r} value={r}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Centre de rattachement
                  </label>
                  <select
                    value={centreModif}
                    onChange={(e) => setCentreModif(e.target.value)}
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

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={modifierUtilisateurMutation.isPending}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                >
                  {modifierUtilisateurMutation.isPending
                    ? "Mise à jour..."
                    : "Enregistrer le rôle/centre"}
                </button>
              </div>
            </form>

            {/* Section B : Réinitialisation Mot de passe */}
            <form
              onSubmit={handleChangerMotDePasse}
              className="space-y-3 border-b border-slate-200/80 pb-5"
            >
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-800 uppercase">
                <Lock className="h-4 w-4 text-amber-600" />
                <span>Réinitialiser le Mot de Passe</span>
              </div>

              {succesMdp && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    Mot de passe modifié avec succès ! Pensez à le transmettre
                    au collaborateur.
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={nouveauPassword}
                  onChange={(e) => setNouveauPassword(e.target.value)}
                  placeholder="Saisir ou générer un nouveau mot de passe..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setNouveauPassword(genererMotDePasseSecurise())
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Générer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopier(nouveauPassword)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {copiePassword ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <span>Copier</span>
                  )}
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={
                    changerMotDePasseMutation.isPending || !nouveauPassword
                  }
                  className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
                >
                  {changerMotDePasseMutation.isPending
                    ? "Modification..."
                    : "Valider le nouveau mot de passe"}
                </button>
              </div>
            </form>

            {/* Section C : Révocation du compte (Zone Danger) */}
            <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/40 p-4">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-rose-800 uppercase">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span>Révocation du Compte d'Accès</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-700/90">
                Cette action supprime les droits de connexion de ce
                collaborateur. Sa fiche RH, ses coordonnées et son historique de
                paie sont <strong>strictement conservés</strong>.
              </p>

              {confirmerRevocation ? (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmerRevocation(false)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleRevoquerCompte}
                    disabled={revoquerCompteMutation.isPending}
                    className="rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {revoquerCompteMutation.isPending
                      ? "Révocation..."
                      : "Oui, révoquer ce compte"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmerRevocation(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-bold text-rose-700 shadow-2xs transition-colors hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  <span>Révoquer le compte applicatif</span>
                </button>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
