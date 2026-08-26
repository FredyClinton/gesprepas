package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.financier.domain.model.MouvementFinancier;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.financier.domain.model.ValidationMouvement;
import com.excelisprepas.backend.financier.domain.port.in.ValiderMouvementUseCase;
import com.excelisprepas.backend.financier.domain.port.out.MouvementFinancierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.ValidationMouvementRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.MouvementFinancierIntrouvableException;
import com.excelisprepas.backend.shared.exception.UtilisateurIntrouvableException;

import java.time.LocalDateTime;
import java.util.UUID;

public class ValidationMouvementService implements ValiderMouvementUseCase {

    private final MouvementFinancierRepositoryPort mouvementRepository;
    private final ValidationMouvementRepositoryPort validationRepository;
    private final UtilisateurRepositoryPort utilisateurRepository;

    public ValidationMouvementService(MouvementFinancierRepositoryPort mouvementRepository,
                                      ValidationMouvementRepositoryPort validationRepository,
                                      UtilisateurRepositoryPort utilisateurRepository) {
        this.mouvementRepository = mouvementRepository;
        this.validationRepository = validationRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public ValidationMouvement validerMouvement(UUID mouvementFinancierId, StatutMouvement decision,
                                                UUID validateurUtilisateurId) {
        MouvementFinancier mouvement = mouvementRepository.findById(mouvementFinancierId)
                .orElseThrow(() -> new MouvementFinancierIntrouvableException(mouvementFinancierId));

        if (utilisateurRepository.findById(validateurUtilisateurId).isEmpty()) {
            throw new UtilisateurIntrouvableException(validateurUtilisateurId);
        }

        mouvement.appliquerDecision(decision); // lève IllegalStateException si déjà traité
        mouvementRepository.save(mouvement);

        ValidationMouvement validation = new ValidationMouvement(
                UUID.randomUUID(), mouvementFinancierId, validateurUtilisateurId, decision, LocalDateTime.now());
        return validationRepository.save(validation);
    }
}