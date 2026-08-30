package com.excelisprepas.backend.centre.domain.service;


import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.exception.CentreUtiliseException;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.in.*;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.port.out.RattachementCentreRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;
import com.excelisprepas.backend.shared.exception.SessionNonUtilisableException;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

@Slf4j
public class CentreService implements CreerCentreUseCase, RecupererCentreUseCase,
        ListerCentresUseCase, FermerCentreUseCase, RenommerCentreUseCase,
        RelocaliserCentreUseCase, RouvrirCentreUseCase, SupprimerCentreUseCase,
        RejoindreSessionUseCase {

    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final SalleRepositoryPort salleRepository;
    private final AffectationRepositoryPort affectationRepository;
    private final RattachementCentreRepositoryPort rattachementRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public CentreService(CentreRepositoryPort centreRepository, FormationRepositoryPort formationRepository,
                         ApprenantRepositoryPort apprenantRepository, SalleRepositoryPort salleRepository,
                         AffectationRepositoryPort affectationRepository,
                         RattachementCentreRepositoryPort rattachementRepository,
                         SessionAcademiqueRepositoryPort sessionRepository) {
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.apprenantRepository = apprenantRepository;
        this.salleRepository = salleRepository;
        this.affectationRepository = affectationRepository;
        this.rattachementRepository = rattachementRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    public Centre creerCentre(String nom, String adresseInitiale, String villeInitiale) {
        Centre centre = new Centre(UUID.randomUUID(), nom, adresseInitiale, villeInitiale);
        centre = centreRepository.save(centre);
        log.info("Centre créé : id={}, nom={}", centre.getId(), nom);
        return centre;
    }

    @Override
    public Centre recupererCentre(UUID id) {
        return centreRepository.findById(id)
                .orElseThrow(() -> new CentreIntrouvableException(id));
    }

    @Override
    public List<Centre> listerCentres() {
        return centreRepository.findAll();
    }

    @Override
    public Centre fermerCentre(UUID id) {
        Centre centre = recupererCentre(id);
        centre.fermer();
        centre = centreRepository.save(centre);
        log.info("Centre fermé : id={}", id);
        return centre;
    }

    @Override
    public Centre renommerCentre(UUID id, String nouveauNom) {
        Centre centre = recupererCentre(id);
        centre.renommer(nouveauNom);
        centre = centreRepository.save(centre);
        log.info("Centre renommé : id={}, nouveauNom={}", id, nouveauNom);
        return centre;
    }


    @Override
    public Centre relocaliserCentre(UUID id, String nouvelleAdresse, String nouvelleVille) {
        Centre centre = recupererCentre(id);
        centre.relocaliser(nouvelleAdresse, nouvelleVille);
        centre = centreRepository.save(centre);
        log.info("Centre relocalisé : id={}, nouvelleAdresse={}, nouvelleVille={}", id, nouvelleAdresse, nouvelleVille);
        return centre;
    }


    @Override
    public void supprimerCentre(UUID id) {
        // Verifie si le centre existe sinon lever une exception
        recupererCentre(id);
        boolean referencerAilleurs = this.formationRepository.existsByCentreId(id)
                || apprenantRepository.existsByCentreId(id)
                || salleRepository.existsByCentreId(id)
                || affectationRepository.existsByCentreId(id)
                || rattachementRepository.existsByCentreId(id);

        if (referencerAilleurs) {
            log.warn("Suppression de centre refusée : id={} encore référencé ailleurs", id);
            throw new CentreUtiliseException(id);
        }
        centreRepository.deleteById(id);
        log.info("Centre supprimé : id={}", id);
    }

    @Override
    public Centre rouvrirCentre(UUID id) {
        Centre centre = recupererCentre(id);
        centre.rouvrir();
        centre = centreRepository.save(centre);
        log.info("Centre rouvert : id={}", id);
        return centre;
    }

    @Override
    public Centre rejoindreSession(UUID centreId, UUID sessionId) {
        Centre centre = recupererCentre(centreId);

        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            log.warn("Rattachement à la session refusé : session {} clôturée", sessionId);
            throw new SessionNonUtilisableException(sessionId);
        }

        centre.rejoindreSession(sessionId);
        centre = centreRepository.save(centre);
        log.info("Centre rattaché à la session : centreId={}, sessionId={}", centreId, sessionId);
        return centre;
    }
}