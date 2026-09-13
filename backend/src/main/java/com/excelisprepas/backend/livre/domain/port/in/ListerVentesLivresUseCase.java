package com.excelisprepas.backend.livre.domain.port.in;

import com.excelisprepas.backend.livre.domain.model.VenteLivre;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ListerVentesLivresUseCase {
    List<VenteLivre> listerVentes(UUID sessionId, UUID centreId, UUID livreId, LocalDate dateDebut, LocalDate dateFin);
}

