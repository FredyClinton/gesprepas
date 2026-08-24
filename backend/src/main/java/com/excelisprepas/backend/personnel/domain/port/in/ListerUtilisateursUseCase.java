package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

import java.util.List;

public interface ListerUtilisateursUseCase {
    List<Utilisateur> listerUtilisateurs();
}