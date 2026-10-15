package com.excelisprepas.backend.shared.audit.domain.event;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogEvent(
    UUID id,
    Instant createdAt,
    UUID utilisateurId,
    String utilisateurNom,
    String utilisateurEmail,
    String utilisateurRole,
    UUID centreId,
    String centreNom,
    AuditModule module,
    String typeAction,
    String description,
    String entiteType,
    String entiteId,
    String statut,
    Map<String, Object> details,
    String adresseIp
) {
    public static AuditLogEvent create(
        UUID utilisateurId,
        String utilisateurNom,
        String utilisateurEmail,
        String utilisateurRole,
        UUID centreId,
        String centreNom,
        AuditModule module,
        String typeAction,
        String description,
        String entiteType,
        String entiteId,
        Map<String, Object> details,
        String adresseIp
    ) {
        return new AuditLogEvent(
            UUID.randomUUID(),
            Instant.now(),
            utilisateurId,
            utilisateurNom,
            utilisateurEmail,
            utilisateurRole,
            centreId,
            centreNom,
            module,
            typeAction,
            description,
            entiteType,
            entiteId,
            "SUCCES",
            details,
            adresseIp
        );
    }
}
