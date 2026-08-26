package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.RepartitionFormationLigne;

import java.util.List;
import java.util.UUID;

public interface ConsulterRepartitionParFormationUseCase {
    List<RepartitionFormationLigne> consulterRepartitionParFormation(UUID bilanId);
}