package com.excelisprepas.backend.departement.domain.service;

import com.excelisprepas.backend.departement.domain.model.Departement;
import com.excelisprepas.backend.departement.domain.port.in.*;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.shared.exception.DepartementIntrouvableException;

import java.util.List;
import java.util.UUID;

public class DepartementService implements CreerDepartementUseCase, RecupererDepartementUseCase,
        ListerDepartementsUseCase, RenommerDepartementUseCase, SupprimerDepartementUseCase {

    private final DepartementRepositoryPort departementRepository;
    private final MatiereRepositoryPort matiereRepository;

    public DepartementService(DepartementRepositoryPort departementRepository,
                              MatiereRepositoryPort matiereRepository) {
        this.departementRepository = departementRepository;
        this.matiereRepository = matiereRepository;
    }

    @Override
    public Departement creerDepartement(String nomDepartement, String nomMatiere) {
        UUID matiereId = UUID.randomUUID();
        Matiere matiere = new Matiere(matiereId, nomMatiere);
        Departement departement = new Departement(UUID.randomUUID(), nomDepartement, matiereId);

        matiereRepository.save(matiere);
        return departementRepository.save(departement);
    }

    @Override
    public Departement recupererDepartement(UUID id) {
        return departementRepository.findById(id)
                .orElseThrow(() -> new DepartementIntrouvableException(id));
    }

    @Override
    public List<Departement> listerDepartements() {
        return departementRepository.findAll();
    }

    @Override
    public Departement renommerDepartement(UUID id, String nouveauNom) {
        Departement departement = recupererDepartement(id);
        departement.renommer(nouveauNom);
        return departementRepository.save(departement);
    }

    @Override
    public void supprimerDepartement(UUID id) {
        recupererDepartement(id);
        departementRepository.deleteById(id);
    }
}