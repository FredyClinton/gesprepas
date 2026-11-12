package com.excelisprepas.backend.apprenant.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.CriteresRechercheApprenants;
import com.excelisprepas.backend.apprenant.domain.model.LigneApprenant;
import com.excelisprepas.backend.apprenant.domain.model.SyntheseApprenants;
import com.excelisprepas.backend.apprenant.domain.port.in.RechercherApprenantsUseCase;
import com.excelisprepas.backend.apprenant.domain.port.out.RechercheApprenantsPort;
import com.excelisprepas.backend.shared.pagination.PageResultat;

import java.util.Objects;
import java.util.UUID;

public class RechercheApprenantsService implements RechercherApprenantsUseCase {

    private final RechercheApprenantsPort rechercheApprenantsPort;

    public RechercheApprenantsService(RechercheApprenantsPort rechercheApprenantsPort) {
        this.rechercheApprenantsPort = Objects.requireNonNull(rechercheApprenantsPort);
    }

    @Override
    public PageResultat<LigneApprenant> rechercher(CriteresRechercheApprenants criteres) {
        return rechercheApprenantsPort.rechercher(Objects.requireNonNull(criteres));
    }

    @Override
    public SyntheseApprenants synthetiser(UUID sessionId, UUID centreId) {
        return rechercheApprenantsPort.synthetiser(sessionId, centreId);
    }
}
