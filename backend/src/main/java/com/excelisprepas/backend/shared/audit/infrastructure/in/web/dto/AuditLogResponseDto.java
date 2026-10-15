package com.excelisprepas.backend.shared.audit.infrastructure.in.web.dto;

import com.excelisprepas.backend.shared.audit.domain.model.AuditLog;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogResponseDto(
    UUID id,
    Instant createdAt,
    UUID utilisateurId,
    String utilisateurNom,
    String utilisateurEmail,
    String utilisateurRole,
    UUID centreId,
    String centreNom,
    String module,
    String typeAction,
    String description,
    String entiteType,
    String entiteId,
    String statut,
    Map<String, Object> details,
    String adresseIp
) {
    public static AuditLogResponseDto fromEntity(AuditLog log) {
        return new AuditLogResponseDto(
            log.getId(),
            log.getCreatedAt(),
            log.getUtilisateurId(),
            log.getUtilisateurNom(),
            log.getUtilisateurEmail(),
            log.getUtilisateurRole(),
            log.getCentreId(),
            log.getCentreNom(),
            log.getModule(),
            log.getTypeAction(),
            log.getDescription(),
            log.getEntiteType(),
            log.getEntiteId(),
            log.getStatut(),
            log.getDetails(),
            log.getAdresseIp()
        );
    }
}
