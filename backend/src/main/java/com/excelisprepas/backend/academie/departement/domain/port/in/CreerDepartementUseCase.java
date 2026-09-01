package com.excelisprepas.backend.academie.departement.domain.port.in;

import com.excelisprepas.backend.academie.departement.domain.model.Departement;

public interface CreerDepartementUseCase {
    /**
     * Crée un Departement avec sa Matiere associée (relation 1—1 imposée dès la création :
     * un Departement ne peut exister sans sa Matiere, et vice-versa).
     */
    Departement creerDepartement(String nomDepartement, String nomMatiere);
}