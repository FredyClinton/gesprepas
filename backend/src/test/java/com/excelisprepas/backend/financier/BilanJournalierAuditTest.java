package com.excelisprepas.backend.financier;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.BilanJournalier;
import com.excelisprepas.backend.financier.domain.model.StatutBilan;
import com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.financier.domain.service.BilanJournalierService;
import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.audit.application.AuditEventHelper;
import com.excelisprepas.backend.shared.audit.domain.event.AuditModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("Bilan Journalier & Audit - Déclencheurs de visas et clôture")
class BilanJournalierAuditTest {

    private BilanJournalierRepositoryPort bilanRepository;
    private EntreeRepositoryPort entreeRepository;
    private SortieRepositoryPort sortieRepository;
    private CentreRepositoryPort centreRepository;
    private UtilisateurRepositoryPort utilisateurRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private PersonnelRepositoryPort personnelRepository;
    private AuditEventHelper auditEventHelper;

    private BilanJournalierService service;

    private UUID centreId;
    private UUID sessionId;
    private UUID userId;
    private LocalDate date;

    @BeforeEach
    void setUp() {
        bilanRepository = mock(BilanJournalierRepositoryPort.class);
        entreeRepository = mock(EntreeRepositoryPort.class);
        sortieRepository = mock(SortieRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        utilisateurRepository = mock(UtilisateurRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        personnelRepository = mock(PersonnelRepositoryPort.class);
        auditEventHelper = mock(AuditEventHelper.class);

        centreId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
        userId = UUID.randomUUID();
        date = LocalDate.now();

        Centre centre = mock(Centre.class);
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(centre));

        SessionAcademique session = mock(SessionAcademique.class);
        when(session.getStatut()).thenReturn(StatutSession.EN_COURS);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        Utilisateur utilisateur = mock(Utilisateur.class);
        when(utilisateurRepository.findById(userId)).thenReturn(Optional.of(utilisateur));

        Personnel personnel = mock(Personnel.class);
        when(personnel.getNom()).thenReturn("Kamga");
        when(personnel.getPrenom()).thenReturn("Alain");
        when(personnelRepository.findById(userId)).thenReturn(Optional.of(personnel));

        service = new BilanJournalierService(
                bilanRepository, entreeRepository, sortieRepository, null,
                centreRepository, utilisateurRepository, sessionRepository,
                personnelRepository, null, null, null, auditEventHelper
        );
    }

    @Test
    @DisplayName("soumettreBilanCaissier déclenche l'audit VISA_CAISSIER")
    void soumettreCaissierDeclencheAudit() {
        when(bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date))
                .thenReturn(Optional.empty());
        when(bilanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.soumettreBilanCaissier(centreId, sessionId, date, userId);

        verify(auditEventHelper).audit(
                eq(AuditModule.BILAN_JOURNALIER),
                eq("VISA_CAISSIER"),
                contains("caissier"),
                eq("BilanJournalier"),
                any(),
                any(),
                eq(centreId)
        );
    }

    @Test
    @DisplayName("validerBilanChefCentre déclenche l'audit VISA_CHEF_CENTRE")
    void validerChefCentreDeclencheAudit() {
        when(bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date))
                .thenReturn(Optional.empty());
        when(bilanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.validerBilanChefCentre(centreId, sessionId, date, userId);

        verify(auditEventHelper).audit(
                eq(AuditModule.BILAN_JOURNALIER),
                eq("VISA_CHEF_CENTRE"),
                contains("chef de centre"),
                eq("BilanJournalier"),
                any(),
                any(),
                eq(centreId)
        );
    }

    @Test
    @DisplayName("validerBilanControleur déclenche l'audit CLOTURE_BILAN")
    void validerControleurDeclencheAudit() {
        UUID bilanId = UUID.randomUUID();
        BilanJournalier bilan = new BilanJournalier(bilanId, centreId, sessionId, date, LocalDateTime.now(), userId);
        when(bilanRepository.findById(bilanId)).thenReturn(Optional.of(bilan));
        when(entreeRepository.findByCentreIdAndSessionIdAndDateAndStatut(any(), any(), any(), any())).thenReturn(List.of());
        when(sortieRepository.findByCentreIdAndSessionIdAndDateAndStatut(any(), any(), any(), any())).thenReturn(List.of());
        when(bilanRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.validerBilanControleur(bilanId, userId);

        verify(auditEventHelper).audit(
                eq(AuditModule.BILAN_JOURNALIER),
                eq("CLOTURE_BILAN"),
                contains("Clôture"),
                eq("BilanJournalier"),
                eq(bilanId.toString()),
                any(),
                eq(centreId)
        );
    }
}
