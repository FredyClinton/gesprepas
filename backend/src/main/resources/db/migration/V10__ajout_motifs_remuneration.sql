-- Migration V10: Motifs de sortie pour la rémunération des enseignants et du personnel

INSERT INTO motifs (id, nom, type, actif)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Rémunération Enseignants', 'SORTIE', true),
  ('00000000-0000-0000-0000-000000000002', 'Rémunération Personnel', 'SORTIE', true)
ON CONFLICT (id) DO UPDATE SET actif = true, type = 'SORTIE';

