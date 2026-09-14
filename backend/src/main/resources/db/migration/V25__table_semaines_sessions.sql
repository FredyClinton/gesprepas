INSERT INTO semaines_sessions (id, session_id, numero)
SELECT gen_random_uuid(), s.id, serie.numero
FROM sessions_academiques s
CROSS JOIN LATERAL generate_series(
    1,
    GREATEST(1, FLOOR((s.date_fin - s.date_debut) / 7)::integer + 1)
) AS serie(numero)
ON CONFLICT (session_id, numero) DO NOTHING;