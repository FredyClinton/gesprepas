package com.excelisprepas.backend.session.domain.port.in;


import com.excelisprepas.backend.session.domain.model.SessionAcademique;

import java.time.LocalDate;

public interface CreerSessionAcademiqueUseCase {
    SessionAcademique creerSession(String annee, LocalDate dateDebut, LocalDate dateFin);
}
