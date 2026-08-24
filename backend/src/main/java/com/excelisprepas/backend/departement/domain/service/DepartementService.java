package com.excelisprepas.backend.departement.domain.service;

import com.excelisprepas.backend.departement.domain.model.Departement;
import com.excelisprepas.backend.departement.domain.port.in.CreerDepartementUseCase;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;

import java.util.UUID;

public class DepartementService implements CreerDepartementUseCase {

    private final DepartementRepositoryPort departementRepository;
    private final MatiereRepositoryPort matiereRepository;

    public DepartementService(DepartementRepositoryPort departementRepository,
                              MatiereRepositoryPort matiereRepository) {
        this.departementRepository = departementRepository;
        this.matiereRepository = matiereRepository;
    }

    @Override
    public Departement creerDepartement(String nomDepartement, String nomMatiere) {
        // Les deux objets sont d'abord construits (donc entièrement validés côté domaine)
        // avant toute persistance, pour ne jamais sauvegarder une Matiere orpheline si le
        // nom du Departement s'avère invalide (garantit l'invariant 1—1 dès la création).
        UUID matiereId = UUID.randomUUID();
        Matiere matiere = new Matiere(matiereId, nomMatiere);
        Departement departement = new Departement(UUID.randomUUID(), nomDepartement, matiereId);

        matiereRepository.save(matiere);
        return departementRepository.save(departement);
    }
}