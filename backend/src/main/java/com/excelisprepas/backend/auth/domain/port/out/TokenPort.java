package com.excelisprepas.backend.auth.domain.port.out;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

/**
 * Génération et validation des access tokens. Le domaine ne connaît que ce
 * contrat - jjwt (la librairie) reste un détail d'infrastructure.
 */
public interface TokenPort {
    String genererAccessToken(Utilisateur utilisateur);
    ClaimsAccessToken validerAccessToken(String token);
}
