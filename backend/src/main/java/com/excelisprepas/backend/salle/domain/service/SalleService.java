package com.excelisprepas.backend.salle.domain.service;

import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.in.CreerSalleUseCase;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;

import java.util.UUID;

public class SalleService implements CreerSalleUseCase {

    private final SalleRepositoryPort salleRepository;
    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;

    public SalleService(SalleRepositoryPort salleRepository,
                        CentreRepositoryPort centreRepository,
                        FormationRepositoryPort formationRepository) {
        this.salleRepository = salleRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
    }

    @Override
    public Salle creerSalle(String nom, UUID centreId, UUID formationId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        if (formationRepository.findById(formationId).isEmpty()) {
            throw new FormationIntrouvableException(formationId);
        }

        Salle salle = new Salle(UUID.randomUUID(), nom, centreId, formationId);
        return salleRepository.save(salle);
    }
}