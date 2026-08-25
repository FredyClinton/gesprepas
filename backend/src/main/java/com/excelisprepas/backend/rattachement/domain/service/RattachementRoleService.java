package com.excelisprepas.backend.rattachement.domain.service;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;
import com.excelisprepas.backend.rattachement.domain.port.in.*;
import com.excelisprepas.backend.rattachement.domain.port.out.AttributionRoleRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.port.out.RattachementCentreRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public class RattachementRoleService implements RattacherUtilisateurUseCase, AffecterCentreUseCase,
        AjouterRoleUseCase, RetirerRoleUseCase, RecupererRattachementUseCase,
        ListerRattachementsUseCase, ListerRolesUseCase, SupprimerRattachementUseCase {

    private final RattachementCentreRepositoryPort rattachementRepository;
    private final AttributionRoleRepositoryPort attributionRepository;
    private final UtilisateurRepositoryPort utilisateurRepository;
    private final CentreRepositoryPort centreRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public RattachementRoleService(RattachementCentreRepositoryPort rattachementRepository,
                                   AttributionRoleRepositoryPort attributionRepository,
                                   UtilisateurRepositoryPort utilisateurRepository,
                                   CentreRepositoryPort centreRepository,
                                   SessionAcademiqueRepositoryPort sessionRepository) {
        this.rattachementRepository = rattachementRepository;
        this.attributionRepository = attributionRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.centreRepository = centreRepository;
        this.sessionRepository = sessionRepository;
    }

    private static void verifierRolesCentreScopes(Set<RoleUtilisateur> roles) {
        for (RoleUtilisateur role : roles) {
            if (!role.estCentreScope()) {
                throw new RoleNonCentreScopeException(role);
            }
        }
    }

    private SessionAcademique verifierSessionUtilisable(UUID sessionId) {
        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            throw new SessionNonUtilisableException(sessionId);
        }
        return session;
    }

    @Override
    public RattachementCentre rattacher(UUID utilisateurId, UUID sessionId, UUID centreId,
                                        Set<RoleUtilisateur> rolesInitiaux) {
        if (utilisateurRepository.findById(utilisateurId).isEmpty()) {
            throw new UtilisateurIntrouvableException(utilisateurId);
        }
        Centre centre = centreRepository.findById(centreId)
                .orElseThrow(() -> new CentreIntrouvableException(centreId));

        verifierSessionUtilisable(sessionId);
        if (!centre.getSessionIds().contains(sessionId)) {
            throw new CentreNonParticipantSessionException(centreId, sessionId);
        }
        if (rattachementRepository.existsByUtilisateurIdAndSessionId(utilisateurId, sessionId)) {
            throw new RattachementDejaExistantException(utilisateurId, sessionId);
        }
        verifierRolesCentreScopes(rolesInitiaux);

        RattachementCentre rattachement = rattachementRepository.save(
                new RattachementCentre(UUID.randomUUID(), utilisateurId, sessionId, centreId));

        for (RoleUtilisateur role : rolesInitiaux) {
            attributionRepository.save(new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, role));
        }

        return rattachement;
    }

    @Override
    public RattachementCentre affecter(UUID rattachementId, UUID nouveauCentreId, Set<RoleUtilisateur> nouveauxRoles) {
        RattachementCentre rattachement = rattachementRepository.findById(rattachementId)
                .orElseThrow(() -> new RattachementIntrouvableException(rattachementId));

        Centre nouveauCentre = centreRepository.findById(nouveauCentreId)
                .orElseThrow(() -> new CentreIntrouvableException(nouveauCentreId));

        verifierSessionUtilisable(rattachement.getSessionId());
        if (!nouveauCentre.getSessionIds().contains(rattachement.getSessionId())) {
            throw new CentreNonParticipantSessionException(nouveauCentreId, rattachement.getSessionId());
        }
        verifierRolesCentreScopes(nouveauxRoles);

        // Retire tous les rôles centre-scopés actuels — ils n'ont plus de sens au nouveau centre
        List<AttributionRole> attributionsActuelles = attributionRepository.findByUtilisateurIdAndSessionId(
                rattachement.getUtilisateurId(), rattachement.getSessionId());
        for (AttributionRole attribution : attributionsActuelles) {
            if (attribution.getRole().estCentreScope()) {
                attributionRepository.deleteById(attribution.getId());
            }
        }

        // Ajoute les nouveaux rôles pour le nouveau centre
        for (RoleUtilisateur role : nouveauxRoles) {
            attributionRepository.save(new AttributionRole(
                    UUID.randomUUID(), rattachement.getUtilisateurId(), rattachement.getSessionId(), role));
        }

        rattachement.affecter(nouveauCentreId);
        return rattachementRepository.save(rattachement);
    }

    @Override
    public AttributionRole ajouterRole(UUID utilisateurId, UUID sessionId, RoleUtilisateur role) {
        if (utilisateurRepository.findById(utilisateurId).isEmpty()) {
            throw new UtilisateurIntrouvableException(utilisateurId);
        }
        verifierSessionUtilisable(sessionId);
        if (role.estCentreScope() && !rattachementRepository.existsByUtilisateurIdAndSessionId(utilisateurId, sessionId)) {
            throw new RattachementRequisException(utilisateurId, sessionId);
        }
        if (attributionRepository.existsByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, role)) {
            throw new RoleDejaAttribueException(utilisateurId, sessionId, role);
        }

        return attributionRepository.save(new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, role));
    }

    @Override
    public void retirerRole(UUID utilisateurId, UUID sessionId, RoleUtilisateur role) {
        AttributionRole attribution = attributionRepository
                .findByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, role)
                .orElseThrow(() -> new AttributionRoleIntrouvableException(utilisateurId, sessionId, role));
        attributionRepository.deleteById(attribution.getId());
    }

    @Override
    public RattachementCentre recuperer(UUID id) {
        return rattachementRepository.findById(id)
                .orElseThrow(() -> new RattachementIntrouvableException(id));
    }

    @Override
    public List<RattachementCentre> listerParCentreEtSession(UUID centreId, UUID sessionId) {
        return rattachementRepository.findByCentreIdAndSessionId(centreId, sessionId);
    }

    @Override
    public List<AttributionRole> listerParUtilisateurEtSession(UUID utilisateurId, UUID sessionId) {
        return attributionRepository.findByUtilisateurIdAndSessionId(utilisateurId, sessionId);
    }

    @Override
    public void supprimer(UUID id) {
        RattachementCentre rattachement = recuperer(id);

        List<AttributionRole> attributions = attributionRepository.findByUtilisateurIdAndSessionId(
                rattachement.getUtilisateurId(), rattachement.getSessionId());
        for (AttributionRole attribution : attributions) {
            if (attribution.getRole().estCentreScope()) {
                attributionRepository.deleteById(attribution.getId());
            }
        }

        rattachementRepository.deleteById(id);
    }
}