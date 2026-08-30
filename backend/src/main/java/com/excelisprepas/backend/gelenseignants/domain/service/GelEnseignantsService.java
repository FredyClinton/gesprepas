package com.excelisprepas.backend.gelenseignants.domain.service;

import com.excelisprepas.backend.gelenseignants.domain.model.GelEnseignants;
import com.excelisprepas.backend.gelenseignants.domain.port.in.ConsulterGelEnseignantsUseCase;
import com.excelisprepas.backend.gelenseignants.domain.port.in.ModifierGelEnseignantsUseCase;
import com.excelisprepas.backend.gelenseignants.domain.port.in.VerifierAutoriseGestionEnseignantsUseCase;
import com.excelisprepas.backend.gelenseignants.domain.port.out.GelEnseignantsRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.shared.exception.GestionEnseignantsGeleeException;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;

@Slf4j
public class GelEnseignantsService implements ConsulterGelEnseignantsUseCase, ModifierGelEnseignantsUseCase,
        VerifierAutoriseGestionEnseignantsUseCase {

    private final GelEnseignantsRepositoryPort repository;

    public GelEnseignantsService(GelEnseignantsRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public GelEnseignants consulterGel() {
        return repository.recuperer();
    }

    @Override
    public GelEnseignants modifierGel(boolean actif, Instant dateFin) {
        GelEnseignants gel = repository.sauvegarder(new GelEnseignants(actif, dateFin));
        log.info("Gel des enseignants modifié : actif={}, dateFin={}", actif, dateFin);
        return gel;
    }

    @Override
    public void verifierAutorise(RoleUtilisateur appelant) {
        if (appelant == RoleUtilisateur.CHEF_DEPARTEMENT && repository.recuperer().estEffectif(Instant.now())) {
            log.warn("Action refusée : gestion des enseignants gelée pour l'appelant {}", appelant);
            throw new GestionEnseignantsGeleeException();
        }
    }
}
