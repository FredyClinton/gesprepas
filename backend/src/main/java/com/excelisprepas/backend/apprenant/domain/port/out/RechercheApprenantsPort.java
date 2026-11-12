package com.excelisprepas.backend.apprenant.domain.port.out;

import com.excelisprepas.backend.apprenant.domain.model.CriteresRechercheApprenants;
import com.excelisprepas.backend.apprenant.domain.model.LigneApprenant;
import com.excelisprepas.backend.apprenant.domain.model.SyntheseApprenants;
import com.excelisprepas.backend.shared.pagination.PageResultat;

import java.util.UUID;

/** Requêtes de lecture de la liste des apprenants (filtrage, tri et pagination faits par la base). */
public interface RechercheApprenantsPort {

    PageResultat<LigneApprenant> rechercher(CriteresRechercheApprenants criteres);

    SyntheseApprenants synthetiser(UUID sessionId, UUID centreId);
}
