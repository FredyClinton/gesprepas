package com.excelisprepas.backend.personnel.domain.port.out;

public interface PasswordEncoderPort {
    String encoder(String motDePasseEnClair);

    boolean correspond(String motDePasseEnClair, String motDePasseHash);
}
