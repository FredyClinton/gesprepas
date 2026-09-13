package com.excelisprepas.backend.livre.domain.port.in;

import com.excelisprepas.backend.livre.domain.model.VenteLivre;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface EnregistrerVenteLivreUseCase {
    record LigneVente(UUID livreId, int quantite) {}

    record CommandeVente(
            UUID sessionId,
            UUID centreId,
            LocalDate dateVente,
            String nomAcheteur,
            UUID apprenantId,
            boolean estExterne,
            UUID saisiParUtilisateurId,
            List<LigneVente> lignes
    ) {}

    List<VenteLivre> enregistrerVente(CommandeVente commande);
}

