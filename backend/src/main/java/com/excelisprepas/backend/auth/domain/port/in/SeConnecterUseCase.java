package com.excelisprepas.backend.auth.domain.port.in;

import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;

public interface SeConnecterUseCase {
    ResultatConnexion seConnecter(String email, String password);
}
