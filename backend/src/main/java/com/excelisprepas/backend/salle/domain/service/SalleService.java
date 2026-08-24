package com.excelisprepas.backend.salle.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.salle.domain.exception.SalleUtiliseeException;
import com.excelisprepas.backend.salle.domain.model.Salle;
import com.excelisprepas.backend.salle.domain.port.in.*;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.SalleIntrouvableException;

import java.util.List;
import java.util.UUID;

public class SalleService implements CreerSalleUseCase, RecupererSalleUseCase, ListerSallesUseCase,
        RenommerSalleUseCase, ReaffecterFormationUseCase, SupprimerSalleUseCase {

    private final SalleRepositoryPort salleRepository;
    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;
    private final AffectationRepositoryPort affectationRepository;

    public SalleService(SalleRepositoryPort salleRepository,
                        CentreRepositoryPort centreRepository,
                        FormationRepositoryPort formationRepository,
                        AffectationRepositoryPort affectationRepository) {
        this.salleRepository = salleRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.affectationRepository = affectationRepository;
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

    @Override
    public Salle recupererSalle(UUID id) {
        return salleRepository.findById(id)
                .orElseThrow(() -> new SalleIntrouvableException(id));
    }

    @Override
    public List<Salle> listerSalles() {
        return salleRepository.findAll();
    }

    @Override
    public Salle renommerSalle(UUID id, String nouveauNom) {
        Salle salle = recupererSalle(id);
        salle.renommer(nouveauNom);
        return salleRepository.save(salle);
    }

    @Override
    public Salle reaffecterFormation(UUID salleId, UUID nouvelleFormationId) {
        Salle salle = recupererSalle(salleId);
        if (formationRepository.findById(nouvelleFormationId).isEmpty()) {
            throw new FormationIntrouvableException(nouvelleFormationId);
        }
        salle.reaffecterFormation(nouvelleFormationId);
        return salleRepository.save(salle);
    }

    @Override
    public void supprimerSalle(UUID id) {
        recupererSalle(id);

        if (affectationRepository.existsBySalleId(id)) {
            throw new SalleUtiliseeException(id);
        }

        salleRepository.deleteById(id);
    }
}