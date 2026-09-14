package com.excelisprepas.backend.session.semaine.domain.port.in;

import com.excelisprepas.backend.session.semaine.domain.model.SemaineSession;

import java.util.UUID;

public interface AjouterSemaineUseCase {
    SemaineSession ajouterSemaine(UUID sessionId, int numero);
}