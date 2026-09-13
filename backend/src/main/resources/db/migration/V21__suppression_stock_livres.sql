-- Migration V21: Suppression du suivi de stock des livres
-- La disponibilité des livres n'est plus suivie par quantité en stock,
-- uniquement par le statut actif (disponible) / inactif (non disponible).

ALTER TABLE livres DROP COLUMN IF EXISTS stock;
