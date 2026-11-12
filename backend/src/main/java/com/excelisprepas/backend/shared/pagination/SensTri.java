package com.excelisprepas.backend.shared.pagination;

public enum SensTri {
    ASC,
    DESC;

    public String sql() {
        return this == DESC ? "DESC" : "ASC";
    }
}
