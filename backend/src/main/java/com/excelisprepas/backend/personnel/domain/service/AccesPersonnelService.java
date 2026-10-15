package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;
import com.excelisprepas.backend.personnel.domain.model.StatutAcces;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.GererAccesPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.ListerAccesPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.out.AccesPersonnelRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.PersonnelIntrouvableException;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Slf4j
public class AccesPersonnelService implements GererAccesPersonnelUseCase, ListerAccesPersonnelUseCase {

    private final AccesPersonnelRepositoryPort accesPersonnelRepository;
    private final PersonnelRepositoryPort personnelRepository;
    private final UtilisateurRepositoryPort utilisateurRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public AccesPersonnelService(AccesPersonnelRepositoryPort accesPersonnelRepository,
                                 PersonnelRepositoryPort personnelRepository,
                                 UtilisateurRepositoryPort utilisateurRepository,
                                 SessionAcademiqueRepositoryPort sessionRepository) {
        this.accesPersonnelRepository = accesPersonnelRepository;
        this.personnelRepository = personnelRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    public AccesPersonnel definirAcces(UUID personnelId, UUID sessionId, UUID phaseId, StatutAcces statut, String motif) {
        Objects.requireNonNull(personnelId, "personnelId ne peut pas être nul");
        Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        Objects.requireNonNull(statut, "statut ne peut pas être nul");

        personnelRepository.findById(personnelId)
                .orElseThrow(() -> new PersonnelIntrouvableException(personnelId));

        Utilisateur utilisateur = utilisateurRepository.findById(personnelId)
                .orElseThrow(() -> new IllegalStateException(
                        "Seuls les membres du personnel disposant d'un compte utilisateur peuvent avoir des accès gérés sur une session ou phase."));

        if (statut == StatutAcces.BLOQUE && utilisateur.getRole() == RoleUtilisateur.DIRECTEUR) {
            throw new IllegalStateException("Le compte du Directeur ne peut pas être bloqué.");
        }

        sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));

        Optional<AccesPersonnel> existant = accesPersonnelRepository
                .findByPersonnelIdAndSessionIdAndPhaseId(personnelId, sessionId, phaseId);

        AccesPersonnel acces;
        if (existant.isPresent()) {
            acces = existant.get();
            acces.modifierStatut(statut, motif);
            log.info("Accès mis à jour : personnelId={}, sessionId={}, phaseId={}, statut={}",
                    personnelId, sessionId, phaseId, statut);
        } else {
            acces = AccesPersonnel.nouveau(personnelId, sessionId, phaseId, statut, motif);
            log.info("Nouvel accès défini : personnelId={}, sessionId={}, phaseId={}, statut={}",
                    personnelId, sessionId, phaseId, statut);
        }

        return accesPersonnelRepository.save(acces);
    }

    @Override
    public AccesPersonnel accorderAcces(UUID personnelId, UUID sessionId, UUID phaseId, String motif) {
        return definirAcces(personnelId, sessionId, phaseId, StatutAcces.ACCORDE, motif);
    }

    @Override
    public AccesPersonnel bloquerAcces(UUID personnelId, UUID sessionId, UUID phaseId, String motif) {
        return definirAcces(personnelId, sessionId, phaseId, StatutAcces.BLOQUE, motif);
    }

    @Override
    public List<AccesPersonnel> listerParSession(UUID sessionId) {
        return accesPersonnelRepository.findBySessionId(sessionId);
    }

    @Override
    public List<AccesPersonnel> listerParSessionEtPhase(UUID sessionId, UUID phaseId) {
        if (phaseId == null) {
            return listerParSession(sessionId);
        }
        return accesPersonnelRepository.findBySessionIdAndPhaseId(sessionId, phaseId);
    }

    @Override
    public List<AccesPersonnel> listerParPersonnelEtSession(UUID personnelId, UUID sessionId) {
        return accesPersonnelRepository.findByPersonnelIdAndSessionId(personnelId, sessionId);
    }

    @Override
    public List<AccesPersonnel> listerParPersonnel(UUID personnelId) {
        return accesPersonnelRepository.findByPersonnelId(personnelId);
    }
}
