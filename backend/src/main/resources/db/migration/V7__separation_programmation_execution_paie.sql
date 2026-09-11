-- Ajout du statut de paiement pour les fiches de paie enseignants
ALTER TABLE fiches_paie_enseignant ADD COLUMN IF NOT EXISTS statut VARCHAR(20) DEFAULT 'PAYEE' NOT NULL;
