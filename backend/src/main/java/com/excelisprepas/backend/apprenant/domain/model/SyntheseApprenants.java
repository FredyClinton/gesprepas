package com.excelisprepas.backend.apprenant.domain.model;

import java.util.List;

/** Compteurs d'un périmètre (session/centre) indépendants des filtres de la liste, plus les établissements connus. */
public record SyntheseApprenants(long total, long preInscrits, long definitifs, List<String> etablissements) {

    public SyntheseApprenants {
        etablissements = List.copyOf(etablissements);
    }
}
