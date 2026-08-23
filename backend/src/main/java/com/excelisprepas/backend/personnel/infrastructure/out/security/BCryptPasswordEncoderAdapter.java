package com.excelisprepas.backend.personnel.infrastructure.out.security;


import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BCryptPasswordEncoderAdapter implements PasswordEncoderPort {

    private final BCryptPasswordEncoder delegate = new BCryptPasswordEncoder();

    @Override
    public String encoder(String motDePasseEnClair) {
        return delegate.encode(motDePasseEnClair);
    }

    @Override
    public boolean correspond(String motDePasseEnClair, String motDePasseHash) {
        return delegate.matches(motDePasseEnClair, motDePasseHash);
    }

}
