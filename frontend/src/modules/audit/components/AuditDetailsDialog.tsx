"use client";

import React, { useState } from "react";
import { Modal } from "@/shared/ui/Modal";
import type { AuditLogItem } from "@/types/audit";
import {
  User,
  MapPin,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Globe,
  Database,
} from "lucide-react";

interface AuditDetailsDialogProps {
  log: AuditLogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDetailsDialog({
  log,
  isOpen,
  onClose,
}: AuditDetailsDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const isSuccess = log.statut === "SUCCES";
  const dateFormatted = new Date(log.createdAt).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const handleCopyJson = () => {
    if (!log.details) return;
    navigator.clipboard.writeText(JSON.stringify(log.details, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Détail de l'événement d'audit"
      description={`Enregistrement immuable #${log.id.slice(0, 8)}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-sm text-brand-anthracite">
        {/* En-tête statut et date */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-brand-gray/5 rounded-xl border border-brand-gray/10">
          <div className="flex items-center gap-2">
            {isSuccess ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Opération réussie
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <XCircle size={14} className="text-rose-600" />
                Échec
              </span>
            )}
            <span className="text-xs font-medium text-brand-gray">
              Action : <strong className="text-brand-anthracite">{log.typeAction}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-brand-gray">
            <Calendar size={14} />
            <span>{dateFormatted}</span>
          </div>
        </div>

        {/* Description principale */}
        <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
          <p className="text-xs font-semibold text-brand-primary uppercase tracking-wide mb-1">
            Description de l'action
          </p>
          <p className="text-base font-medium text-brand-anthracite leading-relaxed">
            {log.description}
          </p>
        </div>

        {/* Grille d'informations : Acteur & Contexte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bloc Utilisateur */}
          <div className="p-4 rounded-xl border border-brand-gray/10 bg-white shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gray">
              <User size={14} />
              <span>Acteur de l'action</span>
            </div>
            <div>
              <p className="font-semibold text-brand-anthracite">
                {log.utilisateurNom || "Système / Tâche d'arrière-plan"}
              </p>
              {log.utilisateurEmail && (
                <p className="text-xs text-brand-gray">{log.utilisateurEmail}</p>
              )}
            </div>
            <div className="pt-2 border-t border-brand-gray/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-brand-gray/10 text-brand-anthracite font-medium">
                {log.utilisateurRole || "Rôle non spécifié"}
              </span>
              {log.adresseIp && (
                <span className="flex items-center gap-1 text-brand-gray">
                  <Globe size={12} />
                  IP: {log.adresseIp}
                </span>
              )}
            </div>
          </div>

          {/* Bloc Cible & Centre */}
          <div className="p-4 rounded-xl border border-brand-gray/10 bg-white shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gray">
              <Layers size={14} />
              <span>Périmètre & Cible</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-gray flex items-center gap-1">
                  <MapPin size={12} /> Centre :
                </span>
                <span className="font-semibold text-brand-anthracite">
                  {log.centreNom || (log.centreId ? log.centreId.slice(0, 8) : "National / Tous")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-gray flex items-center gap-1">
                  <Activity size={12} /> Module :
                </span>
                <span className="font-semibold text-brand-anthracite">
                  {log.module}
                </span>
              </div>
              {log.entiteType && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-brand-gray/10">
                  <span className="text-brand-gray flex items-center gap-1">
                    <Database size={12} /> Entité :
                  </span>
                  <span className="font-mono text-xs text-brand-anthracite bg-brand-gray/10 px-1.5 py-0.5 rounded">
                    {log.entiteType} {log.entiteId ? `(#${log.entiteId.slice(0, 8)})` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Détails JSON */}
        {log.details && Object.keys(log.details).length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gray flex items-center gap-1.5">
                <Database size={14} /> Métadonnées & Snapshot de l'événement
              </h4>
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-gray hover:text-brand-anthracite hover:bg-brand-gray/10 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-600" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copier JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        )}

        {/* Pied de dialogue */}
        <div className="flex justify-end pt-3 border-t border-brand-gray/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-brand-anthracite bg-brand-gray/10 hover:bg-brand-gray/20 rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
