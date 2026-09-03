package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;
import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.port.in.ConsulterHistoriqueSalairePersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.CreerPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.DefinirSalairePersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.ListerPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.out.HistoriqueSalairePersonnelRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class PersonnelService implements CreerPersonnelUseCase, ListerPersonnelUseCase,
        DefinirSalairePersonnelUseCase, ConsulterHistoriqueSalairePersonnelUseCase {

    private final PersonnelRepositoryPort personnelRepository;
    private final HistoriqueSalairePersonnelRepositoryPort historiqueSalaireRepository;

    public PersonnelService(PersonnelRepositoryPort personnelRepository,
                            HistoriqueSalairePersonnelRepositoryPort historiqueSalaireRepository) {
        this.personnelRepository = personnelRepository;
        this.historiqueSalaireRepository = historiqueSalaireRepository;
    }

    @Override
    public Personnel creerPersonnel(String nom, String prenom, String telephone, String numeroCni, String email) {
        Personnel personnel = new Personnel(UUID.randomUUID(), nom, prenom, telephone, numeroCni, email);
        return personnelRepository.save(personnel);
    }

    @Override
    public List<Personnel> listerTous() {
        return personnelRepository.findAll();
    }

    @Override
    public HistoriqueSalairePersonnel definirSalaire(UUID personnelId, UUID sessionId, BigDecimal salaireReference, LocalDate dateDebutEffet) {
        personnelRepository.findById(personnelId)
                .orElseThrow(() -> new IllegalArgumentException("Personnel introuvable: " + personnelId));

        LocalDate dateEffet = dateDebutEffet != null ? dateDebutEffet : LocalDate.now();
        HistoriqueSalairePersonnel historique = new HistoriqueSalairePersonnel(
                UUID.randomUUID(), personnelId, sessionId, salaireReference, dateEffet);
        return historiqueSalaireRepository.save(historique);
    }

    @Override
    public List<HistoriqueSalairePersonnel> listerParPersonnelEtSession(UUID personnelId, UUID sessionId) {
        return historiqueSalaireRepository.findByPersonnelIdAndSessionId(personnelId, sessionId);
    }

    @Override
    public List<HistoriqueSalairePersonnel> listerParSession(UUID sessionId) {
        return historiqueSalaireRepository.findBySessionId(sessionId);
    }
}
