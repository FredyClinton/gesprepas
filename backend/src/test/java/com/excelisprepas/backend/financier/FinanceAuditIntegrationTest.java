package com.excelisprepas.backend.financier;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.model.TypeMotif;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MouvementFinancierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.financier.domain.service.MouvementFinancierService;
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

@DisplayName("Finance & Audit - Déclencheurs d'audit")
class FinanceAuditIntegrationTest {

    private EntreeRepositoryPort entreeRepository;
    private SortieRepositoryPort sortieRepository;
    private MotifRepositoryPort motifRepository;
    private CentreRepositoryPort centreRepository;
    private ApprenantRepositoryPort apprenantRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private MouvementFinancierRepositoryPort mouvementRepository;
    private AuditEventHelper auditEventHelper;

    private MouvementFinancierService service;

    private UUID sessionId;
    private UUID centreId;
    private UUID userId;
    private UUID apprenantId;
    private UUID motifId;

    @BeforeEach
    void setUp() {
        entreeRepository = mock(EntreeRepositoryPort.class);
        sortieRepository = mock(SortieRepositoryPort.class);
        motifRepository = mock(MotifRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        apprenantRepository = mock(ApprenantRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        mouvementRepository = mock(MouvementFinancierRepositoryPort.class);
        auditEventHelper = mock(AuditEventHelper.class);

        sessionId = UUID.randomUUID();
        centreId = UUID.randomUUID();
        userId = UUID.randomUUID();
        apprenantId = UUID.randomUUID();
        motifId = UUID.randomUUID();

        SessionAcademique session = mock(SessionAcademique.class);
        when(session.getStatut()).thenReturn(StatutSession.EN_COURS);
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        Centre centre = mock(Centre.class);
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(centre));
        var contratApprenantRepository = mock(com.excelisprepas.backend.apprenant.domain.port.out.ContratApprenantRepositoryPort.class);
        when(contratApprenantRepository.findByApprenantId(any())).thenReturn(List.of());

        service = new MouvementFinancierService(
                entreeRepository, sortieRepository, motifRepository, centreRepository,
                apprenantRepository, sessionRepository, mouvementRepository,
                null, contratApprenantRepository, null, null, auditEventHelper
        );
    }

    @Test
    @DisplayName("saisirEntree pour un apprenant déclenche l'audit CREATION_VERSEMENT")
    void saisirEntreeApprenantDeclencheAudit() {
        Motif motif = mock(Motif.class);
        when(motif.isActif()).thenReturn(true);
        when(motif.getType()).thenReturn(TypeMotif.ENTREE);
        when(motif.getNom()).thenReturn("Versement scolarité");
        when(motifRepository.findById(motifId)).thenReturn(Optional.of(motif));

        Apprenant apprenant = mock(Apprenant.class);
        when(apprenant.getNom()).thenReturn("Kouamé");
        when(apprenant.getPrenom()).thenReturn("Jean");
        when(apprenantRepository.findById(apprenantId)).thenReturn(Optional.of(apprenant));

        when(entreeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.saisirEntree(sessionId, motifId, BigDecimal.valueOf(50000), LocalDate.now(),
                userId, centreId, apprenantId, null);

        verify(auditEventHelper).audit(
                eq(AuditModule.FINANCE),
                eq("CREATION_VERSEMENT"),
                contains("Kouamé"),
                eq("MouvementFinancier"),
                any(),
                any(),
                eq(centreId)
        );
    }

    @Test
    @DisplayName("saisirSortie déclenche l'audit SORTIE_CAISSE")
    void saisirSortieDeclencheAudit() {
        Motif motif = mock(Motif.class);
        when(motif.isActif()).thenReturn(true);
        when(motif.getType()).thenReturn(TypeMotif.SORTIE);
        when(motif.getNom()).thenReturn("Achat fournitures");
        when(motifRepository.findById(motifId)).thenReturn(Optional.of(motif));

        when(sortieRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.saisirSortie(sessionId, motifId, BigDecimal.valueOf(15000), LocalDate.now(),
                userId, centreId, "M. le Directeur");

        verify(auditEventHelper).audit(
                eq(AuditModule.FINANCE),
                eq("SORTIE_CAISSE"),
                contains("Achat fournitures"),
                eq("MouvementFinancier"),
                any(),
                any(),
                eq(centreId)
        );
    }
}
