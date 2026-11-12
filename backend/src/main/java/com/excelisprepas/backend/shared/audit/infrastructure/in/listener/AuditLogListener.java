package com.excelisprepas.backend.shared.audit.infrastructure.in.listener;

import com.excelisprepas.backend.shared.audit.domain.event.AuditLogEvent;
import com.excelisprepas.backend.shared.audit.domain.model.AuditLog;
import com.excelisprepas.backend.shared.audit.infrastructure.out.persistence.AuditLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@Slf4j
public class AuditLogListener {

    private final AuditLogRepository auditLogRepository;

    public AuditLogListener(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    // Après commit seulement : une opération annulée (rollback) ne doit pas laisser de
    // trace "SUCCES". fallbackExecution couvre les événements publiés hors transaction.
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAuditLogEvent(AuditLogEvent event) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .id(event.id())
                    .createdAt(event.createdAt())
                    .utilisateurId(event.utilisateurId())
                    .utilisateurNom(event.utilisateurNom())
                    .utilisateurEmail(event.utilisateurEmail())
                    .utilisateurRole(event.utilisateurRole())
                    .centreId(event.centreId())
                    .centreNom(event.centreNom())
                    .module(event.module() != null ? event.module().name() : "INCONNU")
                    .typeAction(event.typeAction())
                    .description(event.description())
                    .entiteType(event.entiteType())
                    .entiteId(event.entiteId())
                    .statut(event.statut() != null ? event.statut() : "SUCCES")
                    .details(event.details())
                    .adresseIp(event.adresseIp())
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("AuditLog enregistré avec succès: id={}, action={}", event.id(), event.typeAction());
        } catch (Exception e) {
            log.error("Échec de l'enregistrement de l'audit pour l'événement {}: {}", event.id(), e.getMessage(), e);
        }
    }
}
