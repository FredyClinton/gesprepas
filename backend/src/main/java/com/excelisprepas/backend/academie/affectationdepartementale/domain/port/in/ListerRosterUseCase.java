// affectationdepartementale/domain/port/in/ListerRosterUseCase.java
package com.excelisprepas.backend.academie.affectationdepartementale.domain.port.in;

import com.excelisprepas.backend.academie.affectationdepartementale.domain.model.AffectationDepartementale;

import java.util.List;
import java.util.UUID;

public interface ListerRosterUseCase {
    List<AffectationDepartementale> listerParDepartementEtSession(UUID departementId, UUID sessionId);
}