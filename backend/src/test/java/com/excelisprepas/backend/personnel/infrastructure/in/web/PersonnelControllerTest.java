package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.port.in.ConsulterHistoriqueSalairePersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.CreerPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.DefinirSalairePersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.ListerPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.RecupererPersonnelUseCase;
import com.excelisprepas.backend.shared.exception.PersonnelIntrouvableException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import com.excelisprepas.backend.shared.testsupport.TokenPortTestConfig;
import org.springframework.context.annotation.Import;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc(addFilters = false)
@Import(TokenPortTestConfig.class)
@WebMvcTest(PersonnelController.class)
class PersonnelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CreerPersonnelUseCase creerPersonnelUseCase;

    @MockitoBean
    private RecupererPersonnelUseCase recupererPersonnelUseCase;

    @MockitoBean
    private ListerPersonnelUseCase listerPersonnelUseCase;

    @MockitoBean
    private DefinirSalairePersonnelUseCase definirSalairePersonnelUseCase;

    @MockitoBean
    private ConsulterHistoriqueSalairePersonnelUseCase consulterHistoriqueSalairePersonnelUseCase;

    @MockitoBean
    private com.excelisprepas.backend.personnel.domain.port.in.ModifierPersonnelUseCase modifierPersonnelUseCase;

    @MockitoBean
    private com.excelisprepas.backend.personnel.domain.port.in.SupprimerPersonnelUseCase supprimerPersonnelUseCase;

    @MockitoBean
    private com.excelisprepas.backend.personnel.domain.port.in.CreerComptePersonnelUseCase creerComptePersonnelUseCase;

    @Test
    @DisplayName("GET /api/personnel/{id} retourne 200 avec les informations du membre")
    void recupererPersonnel_existant_retourne200() throws Exception {
        UUID id = UUID.randomUUID();
        Personnel personnel = new Personnel(id, "Doe", "John", "+237699999999", "123456789", "john.doe@excelis.cm");
        when(recupererPersonnelUseCase.recupererPersonnel(id)).thenReturn(personnel);

        mockMvc.perform(get("/api/personnel/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.nom").value("Doe"))
                .andExpect(jsonPath("$.prenom").value("John"))
                .andExpect(jsonPath("$.email").value("john.doe@excelis.cm"))
                .andExpect(jsonPath("$.telephone").value("+237699999999"))
                .andExpect(jsonPath("$.numeroCni").value("123456789"));
    }

    @Test
    @DisplayName("GET /api/personnel/{id} retourne 404 si le membre est introuvable")
    void recupererPersonnel_introuvable_retourne404() throws Exception {
        UUID id = UUID.randomUUID();
        when(recupererPersonnelUseCase.recupererPersonnel(id)).thenThrow(new PersonnelIntrouvableException(id));

        mockMvc.perform(get("/api/personnel/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/personnel/{id} retourne 200 avec les données mises à jour")
    void modifierPersonnel_succes_retourne200() throws Exception {
        UUID id = UUID.randomUUID();
        Personnel maj = new Personnel(id, "Smith", "Jane", "+237677777777", "987654321", "jane.smith@excelis.cm");
        when(modifierPersonnelUseCase.modifierPersonnel(org.mockito.ArgumentMatchers.eq(id),
                org.mockito.ArgumentMatchers.eq("Smith"),
                org.mockito.ArgumentMatchers.eq("Jane"),
                org.mockito.ArgumentMatchers.eq("+237677777777"),
                org.mockito.ArgumentMatchers.eq("987654321"),
                org.mockito.ArgumentMatchers.eq("jane.smith@excelis.cm"))).thenReturn(maj);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/personnel/" + id)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nom": "Smith",
                                  "prenom": "Jane",
                                  "telephone": "+237677777777",
                                  "numeroCni": "987654321",
                                  "email": "jane.smith@excelis.cm"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.nom").value("Smith"))
                .andExpect(jsonPath("$.prenom").value("Jane"));
    }

    @Test
    @DisplayName("DELETE /api/personnel/{id} retourne 204 No Content")
    void supprimerPersonnel_succes_retourne204() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/personnel/" + id))
                .andExpect(status().isNoContent());

        org.mockito.Mockito.verify(supprimerPersonnelUseCase).supprimerPersonnel(id);
    }

    @Test
    @DisplayName("POST /api/personnel/{id}/compte retourne 201 avec le compte créé")
    void creerCompte_succes_retourne201() throws Exception {
        UUID id = UUID.randomUUID();
        com.excelisprepas.backend.personnel.domain.model.Utilisateur utilisateur =
                new com.excelisprepas.backend.personnel.domain.model.Utilisateur(
                        id, "Doe", "John", "+237699999999", "123456789", "john.doe@excelis.cm",
                        "hash", com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur.COMPTABLE, null);
        when(creerComptePersonnelUseCase.creerCompte(org.mockito.ArgumentMatchers.eq(id),
                org.mockito.ArgumentMatchers.eq("Secret123!"),
                org.mockito.ArgumentMatchers.eq(com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur.COMPTABLE),
                org.mockito.ArgumentMatchers.isNull())).thenReturn(utilisateur);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/personnel/" + id + "/compte")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "password": "Secret123!",
                                  "role": "COMPTABLE",
                                  "centreId": null
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.role").value("COMPTABLE"));
    }
}
