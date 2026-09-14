package com.excelisprepas.backend.session.semaine.infrastructure.in.web.dto;

import java.util.UUID;

public record SemaineResponse(UUID id, UUID sessionId, int numero) {}