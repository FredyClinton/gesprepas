package com.excelisprepas.backend.apprenant;

import com.excelisprepas.backend.academie.phase.domain.port.out.PhaseRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ContratApprenantRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.InscriptionPhaseFormationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.service.ApprenantService;
import com.excelisprepas.backend.apprenant.domain.service.CursusApprenantService;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.audit.application.AuditEventHelper;
import com.excelisprepas.backend.shared.audit.domain.event.AuditModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("Apprenant & Cursus - Audit Triggers")
class ApprenantAuditTest {

    private ApprenantRepositoryPort apprenantRepository;
    private CentreRepositoryPort centreRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private ContratApprenantRepositoryPort contratRepository;
    private InscriptionPhaseFormationRepositoryPort inscriptionRepository;
    private PhaseRepositoryPort phaseRepository;
    private AuditEventHelper auditEventHelper;

    private ApprenantService apprenantService;
    private CursusApprenantService cursusService;

    private UUID centreId;
    private UUID sessionId;
    private UUID apprenantId;

    @BeforeEach
    void setUp() {
        apprenantRepository = mock(ApprenantRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        contratRepository = mock(ContratApprenantRepositoryPort.class);
        inscriptionRepository = mock(InscriptionPhaseFormationRepositoryPort.class);
        phaseRepository = mock(PhaseRepositoryPort.class);
        auditEventHelper = mock(AuditEventHelper.class);

        centreId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
        apprenantId = UUID.randomUUID();

        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé")
        ));
        when(sessionRepository.findEnCours()).thenReturn(Optional.of(
                SessionAcademique.reconstituer(sessionId, "2026-2027",
                        LocalDate.of(2026, 9, 1), LocalDate.of(2027, 7, 31),
                        StatutSession.EN_COURS)
        ));

        apprenantService = new ApprenantService(apprenantRepository, centreRepository, sessionRepository, null, auditEventHelper);
        cursusService = new CursusApprenantService(apprenantRepository, contratRepository, inscriptionRepository, phaseRepository, auditEventHelper);
    }

    @Test
    @DisplayName("creerApprenant déclenche l'audit CREATION_APPRENANT")
    void creerApprenantDeclencheAudit() {
        when(apprenantRepository.save(any(Apprenant.class))).thenAnswer(inv -> inv.getArgument(0));

        apprenantService.creerApprenant(
                "Mballa", "Sophie", LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                centreId, "699112233", "Mballa Papa", "677112233", "Lycée Général Leclerc"
        );

        verify(auditEventHelper).audit(
                eq(AuditModule.INSCRIPTION),
                eq("CREATION_APPRENANT"),
                contains("Mballa"),
                eq("Apprenant"),
                any(),
                any(),
                eq(centreId)
        );
    }

    @Test
    @DisplayName("transfererCentre déclenche l'audit TRANSFERT_CENTRE")
    void transfererCentreDeclencheAudit() {
        UUID nouveauCentreId = UUID.randomUUID();
        when(centreRepository.findById(nouveauCentreId)).thenReturn(Optional.of(
                new Centre(nouveauCentreId, "Centre Douala", "Akwa", "Douala")
        ));
        Apprenant apprenant = new Apprenant(apprenantId, "Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                centreId, sessionId);
        when(apprenantRepository.findById(apprenantId)).thenReturn(Optional.of(apprenant));
        when(apprenantRepository.save(any(Apprenant.class))).thenAnswer(inv -> inv.getArgument(0));

        apprenantService.transfererCentre(apprenantId, nouveauCentreId);

        verify(auditEventHelper).audit(
                eq(AuditModule.INSCRIPTION),
                eq("TRANSFERT_CENTRE"),
                contains("Transféré"),
                eq("Apprenant"),
                eq(apprenantId.toString()),
                any(),
                eq(nouveauCentreId)
        );
    }

    @Test
    @DisplayName("creerContratPhase déclenche l'audit CREATION_CONTRAT")
    void creerContratPhaseDeclencheAudit() {
        Apprenant apprenant = new Apprenant(apprenantId, "Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                centreId, sessionId);
        when(apprenantRepository.findById(apprenantId)).thenReturn(Optional.of(apprenant));
        when(inscriptionRepository.findByApprenantId(apprenantId)).thenReturn(List.of());
        when(contratRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(inscriptionRepository.findByApprenantIdAndPhaseId(any(), any())).thenReturn(Optional.empty());
        when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID phaseId = UUID.randomUUID();
        UUID formationId = UUID.randomUUID();
        cursusService.creerContratPhase(apprenantId, phaseId, formationId, new BigDecimal("150000"), LocalDate.now(), "Contrat test");

        verify(auditEventHelper).audit(
                eq(AuditModule.INSCRIPTION),
                eq("CREATION_CONTRAT"),
                contains("Mballa"),
                eq("ContratApprenant"),
                any(),
                any(),
                eq(centreId)
        );
    }
}
