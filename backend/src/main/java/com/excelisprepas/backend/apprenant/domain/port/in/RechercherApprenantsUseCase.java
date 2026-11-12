package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.CriteresRechercheApprenants;
import com.excelisprepas.backend.apprenant.domain.model.LigneApprenant;
import com.excelisprepas.backend.apprenant.domain.model.SyntheseApprenants;
import com.excelisprepas.backend.shared.pagination.PageResultat;

import java.util.UUID;

public interface RechercherApprenantsUseCase {

    PageResultat<LigneApprenant> rechercher(CriteresRechercheApprenants criteres);

    SyntheseApprenants synthetiser(UUID sessionId, UUID centreId);
}
