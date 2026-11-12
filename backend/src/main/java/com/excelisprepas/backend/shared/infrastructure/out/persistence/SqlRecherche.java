package com.excelisprepas.backend.shared.infrastructure.out.persistence;

import java.util.Locale;

/** Utilitaires pour les requêtes SQL de recherche paginée (motifs LIKE échappés). */
public final class SqlRecherche {

    private SqlRecherche() {
    }

    /** Vrai si le texte de recherche est exploitable (non nul, non blanc). */
    public static boolean estRenseigne(String texte) {
        return texte != null && !texte.isBlank();
    }

    /**
     * Transforme un texte saisi en motif {@code LIKE '%...%'} en minuscules, avec {@code %}, {@code _} et
     * {@code \} échappés : à utiliser avec {@code LOWER(colonne) LIKE :motif ESCAPE '\'}.
     */
    public static String motifContient(String texte) {
        String echappe = texte.trim().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + echappe + "%";
    }
}
