BEGIN;

-- Centre 1 : Paris
INSERT INTO centres (id, nom, statut) VALUES ('a0000000-0000-0000-0000-000000000001', 'Centre Paris', 'OUVERT');
INSERT INTO localisations_centre (id, centre_id, adresse, ville, date_debut_validite) VALUES ('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '10 rue de Rivoli', 'Paris', NOW());
INSERT INTO centre_sessions (centre_id, session_id) VALUES ('a0000000-0000-0000-0000-000000000001', '0918ff08-8ae6-4196-bf57-cfe296e97b27');
INSERT INTO formations (id, centre_id, session_id, nom) VALUES ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '0918ff08-8ae6-4196-bf57-cfe296e97b27', 'Prépa Ingénieur');
INSERT INTO salles (id, centre_id, formation_id, session_id, nom) VALUES ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '0918ff08-8ae6-4196-bf57-cfe296e97b27', 'Salle Turing');
INSERT INTO salles (id, centre_id, formation_id, session_id, nom) VALUES ('a0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', '0918ff08-8ae6-4196-bf57-cfe296e97b27', 'Salle Lovelace');

-- Centre 2 : Lyon
INSERT INTO centres (id, nom, statut) VALUES ('a0000000-0000-0000-0000-000000000005', 'Centre Lyon', 'OUVERT');
INSERT INTO localisations_centre (id, centre_id, adresse, ville, date_debut_validite) VALUES ('a0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000005', '5 avenue Jean Jaurès', 'Lyon', NOW());
INSERT INTO centre_sessions (centre_id, session_id) VALUES ('a0000000-0000-0000-0000-000000000005', '0918ff08-8ae6-4196-bf57-cfe296e97b27');
INSERT INTO formations (id, centre_id, session_id, nom) VALUES ('a0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000005', '0918ff08-8ae6-4196-bf57-cfe296e97b27', 'Prépa Commerce');
INSERT INTO salles (id, centre_id, formation_id, session_id, nom) VALUES ('a0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000007', '0918ff08-8ae6-4196-bf57-cfe296e97b27', 'Salle Keynes');

COMMIT;
