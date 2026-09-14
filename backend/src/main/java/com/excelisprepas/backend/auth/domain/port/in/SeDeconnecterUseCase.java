package com.excelisprepas.backend.auth.domain.port.in;

public interface SeDeconnecterUseCase {
    void seDeconnecter(String refreshToken);
}
