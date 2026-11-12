package com.excelisprepas.backend.shared.audit.infrastructure.in.web.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Page de journaux d'audit au format JSON stable. Remplace la sérialisation directe de {@code PageImpl}, que
 * Spring Data déconseille (structure non garantie), en gardant exactement les champs lus par le frontend
 * ({@code PaginatedAuditLogs}).
 */
public record AuditLogPageResponseDto(
        List<AuditLogResponseDto> content,
        long totalElements,
        int totalPages,
        int size,
        int number,
        boolean first,
        boolean last,
        boolean empty
) {
    public static AuditLogPageResponseDto de(Page<AuditLogResponseDto> page) {
        return new AuditLogPageResponseDto(page.getContent(), page.getTotalElements(), page.getTotalPages(),
                page.getSize(), page.getNumber(), page.isFirst(), page.isLast(), page.isEmpty());
    }
}
