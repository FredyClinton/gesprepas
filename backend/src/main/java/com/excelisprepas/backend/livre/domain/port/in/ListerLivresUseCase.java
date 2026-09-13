package com.excelisprepas.backend.livre.domain.port.in;

import com.excelisprepas.backend.livre.domain.model.Livre;

import java.util.List;

public interface ListerLivresUseCase {
    List<Livre> listerTous();
    List<Livre> listerActifs();
}

