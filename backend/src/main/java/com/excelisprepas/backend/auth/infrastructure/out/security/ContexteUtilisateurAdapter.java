package com.excelisprepas.backend.auth.infrastructure.out.security;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.auth.domain.model.ContexteUtilisateur;
import com.excelisprepas.backend.auth.domain.port.out.ContexteUtilisateurPort;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;
import com.excelisprepas.backend.rattachement.domain.port.out.AttributionRoleRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.port.out.RattachementCentreRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Reconstruit le ContexteUtilisateur à chaque appel à partir du
 * SecurityContext (posé par JwtAuthenticationFilter) et d'une relecture en
 * base des attributions courantes - jamais depuis un cache ou le JWT
 * directement, pour que les rôles centre-scopés restent toujours à jour
 * (cf. ContexteUtilisateur, TokenPort).
 */
@Component
public class ContexteUtilisateurAdapter implements ContexteUtilisateurPort {

    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final RattachementCentreRepositoryPort rattachementCentreRepository;
    private final AttributionRoleRepositoryPort attributionRoleRepository;

    public ContexteUtilisateurAdapter(SessionAcademiqueRepositoryPort sessionRepository,
                                      RattachementCentreRepositoryPort rattachementCentreRepository,
                                      AttributionRoleRepositoryPort attributionRoleRepository) {
        this.sessionRepository = sessionRepository;
        this.rattachementCentreRepository = rattachementCentreRepository;
        this.attributionRoleRepository = attributionRoleRepository;
    }

    @Override
    public ContexteUtilisateur courant() {
        ClaimsAccessToken claims = claimsCourantes();

        return sessionRepository.findEnCours()
                .map(SessionAcademique::getId)
                .map(sessionId -> construireAvecSession(claims, sessionId))
                .orElseGet(() -> ContexteUtilisateur.depuis(claims.utilisateurId(), claims.role(), null, List.of()));
    }

    private ContexteUtilisateur construireAvecSession(ClaimsAccessToken claims, UUID sessionId) {
        UUID centreRattache = rattachementCentreRepository
                .findByUtilisateurIdAndSessionId(claims.utilisateurId(), sessionId)
                .map(RattachementCentre::getCentreId)
                .orElse(null);

        List<AttributionRole> attributions = attributionRoleRepository
                .findByUtilisateurIdAndSessionId(claims.utilisateurId(), sessionId);

        return ContexteUtilisateur.depuis(claims.utilisateurId(), claims.role(), centreRattache, attributions);
    }

    private static ClaimsAccessToken claimsCourantes() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof ClaimsAccessToken claims)) {
            throw new IllegalStateException(
                    "Aucun utilisateur authentifié dans le contexte courant - ContexteUtilisateurPort ne peut "
                            + "être utilisé que derrière une route protégée par JwtAuthenticationFilter");
        }
        return claims;
    }
}
