package com.excelisprepas.backend.apprenant.infrastructure.in.web.dto;

import java.util.List;

public record SyntheseApprenantsResponse(long total, long preInscrits, long definitifs, List<String> etablissements) {
}
