package com.excelisprepas.backend.shared.audit;

import com.excelisprepas.backend.shared.audit.domain.event.AuditLogEvent;
import com.excelisprepas.backend.shared.audit.domain.event.AuditModule;
import com.excelisprepas.backend.shared.audit.domain.model.AuditLog;
import com.excelisprepas.backend.shared.audit.infrastructure.in.listener.AuditLogListener;
import com.excelisprepas.backend.shared.audit.infrastructure.out.persistence.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("AuditLogListener (Tests unitaires)")
class AuditLogListenerTest {

    private AuditLogRepository auditLogRepository;
    private AuditLogListener listener;

    @BeforeEach
    void setUp() {
        auditLogRepository = mock(AuditLogRepository.class);
        listener = new AuditLogListener(auditLogRepository);
    }

    @Test
    @DisplayName("onAuditLogEvent() persiste correctement l'événement sous forme d'AuditLog")
    void onAuditLogEventPersisteCorrectement() {
        // Given
        UUID userId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        AuditLogEvent event = new AuditLogEvent(
                UUID.randomUUID(),
                Instant.now(),
                userId,
                "Alice Martin",
                "alice@excelis.com",
                "DIRECTEUR",
                centreId,
                "Yaoundé",
                AuditModule.BILAN_JOURNALIER,
                "VISA_DIRECTEUR",
                "Visa apposé sur le bilan",
                "BilanJournalier",
                "12345",
                "SUCCES",
                Map.of("statut", "VALIDE"),
                "127.0.0.1"
        );

        // When
        listener.onAuditLogEvent(event);

        // Then
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(event.id());
        assertThat(saved.getUtilisateurNom()).isEqualTo("Alice Martin");
        assertThat(saved.getModule()).isEqualTo("BILAN_JOURNALIER");
        assertThat(saved.getTypeAction()).isEqualTo("VISA_DIRECTEUR");
        assertThat(saved.getDetails()).containsEntry("statut", "VALIDE");
    }

    @Test
    @DisplayName("onAuditLogEvent() capture les exceptions sans les propager (résilience)")
    void onAuditLogEventNePropagePasLesExceptions() {
        // Given
        doThrow(new RuntimeException("Erreur DB simulée")).when(auditLogRepository).save(any());
        AuditLogEvent event = AuditLogEvent.create(
                UUID.randomUUID(), "Bob", "bob@excelis.com", "COMPTABLE",
                UUID.randomUUID(), "Douala", AuditModule.FINANCE,
                "CREATION_VERSEMENT", "Versement", "Mouvement", "id-1",
                Map.of(), "127.0.0.1"
        );

        // When & Then (aucune exception ne doit fuiter)
        assertThatCode(() -> listener.onAuditLogEvent(event))
                .doesNotThrowAnyException();
    }
}
